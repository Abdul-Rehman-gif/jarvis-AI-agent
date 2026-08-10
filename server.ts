import express from "express";
import http from "http";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { parseUserCommand } from "./server/gemini.js";
import { isPathSafe, isScriptSafe } from "./server/safety.js";
import { getWeatherSummary } from "./server/weather.js";
import { resolveWhatsappTarget } from "./server/whatsapp.js";
import {
  getAgentStatus,
  updateAgentStatus,
  getSystemMetrics,
  getProcesses,
  killProcess,
  getMockFiles,
  deleteFile,
  createFolder,
  getWorkflows,
  executeWorkflow,
  getPlugins,
  togglePlugin,
  getAuditLogs,
  addAuditLog,
  getSecuritySettings,
  updateSecuritySettings
} from "./server/agentBridge.js";
import { PYTHON_AGENT_CODE, REQUIREMENTS_TXT, START_BAT } from "./server/desktopAgentCode.js";
import { attachAgentWebSocketServer, isAgentConnected, sendCommandToAgent } from "./server/wsAgentServer.js";

// --- Local-only network defaults ---------------------------------------
// Bind to loopback unless the operator explicitly opts into wider exposure.
// Set JARVIS_HOST=0.0.0.0 only if you understand the risk and have auth +
// TLS in front of this (e.g. a reverse proxy).
const HOST = process.env.JARVIS_HOST || "127.0.0.1";
const PORT = Number(process.env.JARVIS_PORT) || 3000;

// --- API key enforcement -------------------------------------------------
// Every /api/* route (except the static asset/vite passthrough) requires
// this key in an `x-jarvis-api-key` header. Without it, anyone who can
// reach this port could trigger PowerShell/shutdown/delete on your PC.
let API_KEY = process.env.JARVIS_API_KEY;
if (!API_KEY) {
  API_KEY = crypto.randomBytes(24).toString("hex");
  console.warn("\n[SECURITY] JARVIS_API_KEY was not set. Generated a random one for this session:");
  console.warn(`[SECURITY]   ${API_KEY}`);
  console.warn("[SECURITY] Set JARVIS_API_KEY in .env.local to keep it stable across restarts.\n");
}

// Simple in-memory throttle for repeated bad API keys, to slow down guessing.
const failedAuthByIp = new Map<string, { count: number; lockedUntil: number }>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

// Routes that must stay reachable without the API key, because they're hit
// either via plain <a href> downloads (no way to attach custom headers) or
// during the frontend's own startup bootstrap below. Paths here are
// relative to the "/api" mount point (Express strips that prefix from
// req.path inside app.use("/api", ...)).
const PUBLIC_API_PATHS = ["/agent/download", "/session-key"];

function requireApiKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const entry = failedAuthByIp.get(ip);
  if (entry && entry.lockedUntil > Date.now()) {
    return res.status(429).json({ error: "Too many failed auth attempts. Try again later." });
  }

  const provided = req.get("x-jarvis-api-key");
  const ok = typeof provided === "string" && provided.length === API_KEY!.length &&
    crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(API_KEY!));

  if (!ok) {
    const next = entry ? entry.count + 1 : 1;
    failedAuthByIp.set(ip, {
      count: next,
      lockedUntil: next >= MAX_FAILED_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0,
    });
    return res.status(401).json({ error: "Missing or invalid x-jarvis-api-key header" });
  }

  failedAuthByIp.delete(ip);
  next();
}

// Last line of defense before any command reaches the desktop agent.
// The LLM decides *what* to do; this checks *whether it's allowed*,
// independent of what the model or fallback parser produced.
function validateActionOrReason(action: { action: string; category?: string; params?: any; description?: string }): string | null {
  const params = action.params || {};

  if (action.action === "powershell") {
    const script = String(params.script || "");
    const reason = isScriptSafe(script);
    if (reason) return `Blocked PowerShell command: ${reason}`;
  }

  if (action.action === "file_system") {
    const op = params.operation;
    const targetPath = String(params.path || "");
    if (op === "delete" || op === "create_folder") {
      const reason = isPathSafe(targetPath);
      if (reason) return `Blocked file operation on "${targetPath}": ${reason}`;
    }
  }

  return null;
}

async function startServer() {
  const app = express();

  app.use(express.json());
  app.set("trust proxy", false);

  // Every API route below requires the key EXCEPT the public ones above.
  // Do this BEFORE defining routes.
  app.use("/api", (req, res, next) => {
    if (PUBLIC_API_PATHS.some((p) => req.path === p || req.path.startsWith(p + "?"))) {
      return next();
    }
    return requireApiKey(req, res, next);
  });

  // Lets the SPA fetch the API key once at load, so every other fetch() call
  // in the existing frontend code doesn't need to be hand-edited to attach a
  // header. This only works because the server is loopback-only: a request
  // from any other machine can't reach this route at all, and a malicious
  // *website* loaded in your browser can't read the JSON response either,
  // since the browser enforces same-origin policy on the response body and
  // we don't send any Access-Control-Allow-Origin header.
  // Caveat: this does NOT protect against other local users/programs on the
  // same PC - it protects against the network and against other websites.
  app.get("/api/session-key", (req, res) => {
    res.json({ apiKey: API_KEY });
  });

  // === REST API ENDPOINTS ===

  // AI Command Parser Chat Route
  // parseUserCommand only classifies intent into a structured action list -
  // it never touches a real PC. Actually running each action now happens
  // here, by forwarding it to whichever desktop agent is connected over the
  // WebSocket bridge (server/wsAgentServer.ts) and waiting for its result.
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message string required" });
      }

      const intentResult = await parseUserCommand(message);
      const agentOnline = isAgentConnected();
      const processedActions: any[] = [];
      let finalReplyText = intentResult.replyText;

      for (const action of intentResult.actions || []) {
        // Info queries (date/time, weather) are answered directly here -
        // no PC action, no confirmation, no agent involved at all.
        if (action.action === "get_datetime") {
          const text = `It's currently ${new Date().toLocaleString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}.`;
          finalReplyText = text;
          processedActions.push({ ...action, status: "completed", result: text });
          continue;
        }
        if (action.action === "get_weather") {
          const text = await getWeatherSummary(action.params?.city);
          finalReplyText = text;
          processedActions.push({ ...action, status: "completed", result: text });
          continue;
        }

        // WhatsApp: resolve contact name -> phone -> an official wa.me
        // click-to-chat link BEFORE anything else runs. This only ever
        // pre-fills a message for the user to send themselves - it never
        // auto-sends. If resolution fails (unknown contact, no message),
        // report that immediately rather than queuing a confirmation for
        // something that can't actually be built.
        let action_ = action;
        if (action.action === "whatsapp_message") {
          const resolved = resolveWhatsappTarget({
            contactName: action.params?.contactName,
            phone: action.params?.phone,
            message: action.params?.message,
          });
          if (!resolved.ok) {
            processedActions.push({ ...action, status: "failed", result: resolved.error });
            continue;
          }
          action_ = {
            ...action,
            action: "browser_automation",
            category: "browser_automation",
            params: { action: "open", url: resolved.waLink },
            description: "Open WhatsApp chat with your message pre-filled - you press Send yourself.",
          };
        }

        // Risky actions are never auto-run - they're queued and only sent to
        // the agent once the user explicitly confirms via /api/agent/execute.
        if (action_.requiresConfirmation) {
          addAuditLog({
            command: action_.description || action_.action,
            category: action_.category,
            initiatedBy: "User (AI Chat)",
            riskLevel: "medium",
            status: "blocked",
            details: JSON.stringify(action_.params || {})
          });
          processedActions.push({ ...action_, status: "pending", result: "Awaiting user confirmation" });
          continue;
        }

        if (!agentOnline) {
          addAuditLog({
            command: action_.description || action_.action,
            category: action_.category,
            initiatedBy: "User (AI Chat)",
            riskLevel: "low",
            status: "blocked",
            details: "No desktop agent connected"
          });
          processedActions.push({
            ...action_,
            status: "failed",
            result: "No desktop agent is connected. Download the agent from the Pairing tab and run it on your PC."
          });
          continue;
        }

        const guardError = validateActionOrReason(action_);
        if (guardError) {
          addAuditLog({
            command: action_.description || action_.action,
            category: action_.category,
            initiatedBy: "User (AI Chat)",
            riskLevel: "high",
            status: "blocked",
            details: guardError
          });
          processedActions.push({ ...action_, status: "failed", result: guardError });
          continue;
        }

        try {
          // browser_automation (search_youtube_list / select_result / play_youtube
          // etc.) drives a real Selenium session on the agent - searching, waiting
          // for the page to render, and scraping results takes longer than a
          // simple app-open or volume-change command, so give it more room than
          // the 12s default before we give up on it.
          const commandTimeout = action_.action === "browser_automation" ? 25000 : undefined;
          const agentResult = commandTimeout
            ? await sendCommandToAgent(action_.action, action_.params || {}, commandTimeout)
            : await sendCommandToAgent(action_.action, action_.params || {});
          const isScreenshot = action_.action === "screenshot" && typeof agentResult.result === "string" && agentResult.result.startsWith("data:image");

          addAuditLog({
            command: action_.description || action_.action,
            category: action_.category,
            initiatedBy: "User (AI Chat)",
            riskLevel: "low",
            status: agentResult.success ? "executed" : "blocked",
            details: isScreenshot ? "Screenshot captured" : String(agentResult.result).slice(0, 300)
          });

          // For browser_automation specifically, the agent's own result string
          // (e.g. the real scraped "1. Song - Channel / 2. ..." list, or "Now
          // playing: X") is more accurate and more useful to hear than the
          // static placeholder text the parser guessed before actually running
          // anything - so let it replace the chat reply.
          if (action_.action === "browser_automation" && typeof agentResult.result === "string") {
            finalReplyText = agentResult.result;
          }

          processedActions.push({
            ...action_,
            status: agentResult.success ? "completed" : "failed",
            result: isScreenshot ? "Screenshot captured from the desktop." : agentResult.result,
            screenshotDataUrl: isScreenshot ? agentResult.result : undefined,
          });
        } catch (err: any) {
          addAuditLog({
            command: action_.description || action_.action,
            category: action_.category,
            initiatedBy: "User (AI Chat)",
            riskLevel: "low",
            status: "blocked",
            details: err.message
          });
          processedActions.push({ ...action_, status: "failed", result: err.message });
        }
      }

      res.json({ ...intentResult, replyText: finalReplyText, actions: processedActions });
    } catch (error: any) {
      console.error("Chat API error:", error);
      res.status(500).json({ error: error.message || "Failed to process AI command" });
    }
  });

  // Confirm & run a high-risk action (shutdown, restart, delete, powershell,
  // etc.) that /api/chat queued instead of auto-executing.
  app.post("/api/agent/execute", async (req, res) => {
    const { action, category, params, description } = req.body;
    if (!action) return res.status(400).json({ error: "action is required" });

    const guardError = validateActionOrReason({ action, category, params, description });
    if (guardError) {
      addAuditLog({
        command: description || action,
        category: category || "app_control",
        initiatedBy: "User (Confirmed)",
        riskLevel: "high",
        status: "blocked",
        details: guardError
      });
      return res.json({ success: false, action, result: guardError });
    }

    if (!isAgentConnected()) {
      addAuditLog({
        command: description || action,
        category: category || "app_control",
        initiatedBy: "User (Confirmed)",
        riskLevel: "high",
        status: "blocked",
        details: "No desktop agent connected"
      });
      return res.json({ success: false, action, result: "No desktop agent is connected." });
    }

    try {
      const result = await sendCommandToAgent(action, params || {});
      addAuditLog({
        command: description || action,
        category: category || "app_control",
        initiatedBy: "User (Confirmed)",
        riskLevel: "high",
        confirmedBy: "User",
        status: result.success ? "executed" : "blocked",
        details: String(result.result).slice(0, 300)
      });
      res.json(result);
    } catch (err: any) {
      addAuditLog({
        command: description || action,
        category: category || "app_control",
        initiatedBy: "User (Confirmed)",
        riskLevel: "high",
        status: "blocked",
        details: err.message
      });
      res.status(500).json({ success: false, action, result: err.message });
    }
  });

  // Agent Status & Telemetry
  app.get("/api/agent/status", (req, res) => {
    res.json(getAgentStatus());
  });

  app.post("/api/agent/status", (req, res) => {
    const updated = updateAgentStatus(req.body);
    res.json(updated);
  });

  app.get("/api/agent/metrics", (req, res) => {
    res.json(getSystemMetrics());
  });

  app.get("/api/agent/processes", (req, res) => {
    res.json(getProcesses());
  });

  app.post("/api/agent/processes/kill", async (req, res) => {
    const { pid } = req.body;
    if (!pid) return res.status(400).json({ error: "PID is required" });

    if (isAgentConnected()) {
      try {
        const agentResult = await sendCommandToAgent("kill_process", { pid: Number(pid) });
        if (agentResult.success) killProcess(Number(pid)); // keep local list in sync
        return res.json({ success: agentResult.success, message: agentResult.result });
      } catch (err: any) {
        return res.json({ success: false, message: err.message });
      }
    }

    // No agent connected - fall back to updating the local demo list only.
    const result = killProcess(Number(pid));
    res.json(result);
  });

  // Download Desktop Agent Source Code files
  app.get("/api/agent/download", (req, res) => {
    const file = req.query.file as string;
    if (file === "requirements.txt") {
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", "attachment; filename=requirements.txt");
      return res.send(REQUIREMENTS_TXT);
    }
    if (file === "start.bat") {
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", "attachment; filename=start_agent.bat");
      return res.send(START_BAT);
    }

    // Default agent.py download - inject the *actual* address of this
    // server (derived from the request) so the agent connects to wherever
    // this app is really running instead of a hardcoded, possibly-stale URL.
    const proto = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "wss" : "ws";
    const host = req.get("host");
    const wsUrl = `${proto}://${host}/ws/agent`;
    const scriptWithRealUrl = PYTHON_AGENT_CODE.replace("SERVER_WS_URL_PLACEHOLDER", wsUrl);

    res.setHeader("Content-Type", "text/x-python");
    res.setHeader("Content-Disposition", "attachment; filename=jarvis_agent.py");
    return res.send(scriptWithRealUrl);
  });

  // File Explorer API
  app.get("/api/file-explorer", (req, res) => {
    res.json(getMockFiles());
  });

  app.post("/api/file-explorer/delete", (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "File ID required" });
    res.json(deleteFile(id));
  });

  app.post("/api/file-explorer/create-folder", (req, res) => {
    const { name, path } = req.body;
    if (!name) return res.status(400).json({ error: "Folder name required" });
    res.json(createFolder(name, path || "C:\\Users\\Admin\\Projects"));
  });

  // Automation Workflows API
  app.get("/api/workflows", (req, res) => {
    res.json(getWorkflows());
  });

  app.post("/api/workflows/run", (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "Workflow ID required" });
    res.json(executeWorkflow(id));
  });

  // Plugin System API
  app.get("/api/plugins", (req, res) => {
    res.json(getPlugins());
  });

  app.post("/api/plugins/toggle", (req, res) => {
    const { id, enabled } = req.body;
    if (!id) return res.status(400).json({ error: "Plugin ID required" });
    res.json(togglePlugin(id, Boolean(enabled)));
  });

  // Security & Audit Logs API
  app.get("/api/security", (req, res) => {
    res.json({
      settings: getSecuritySettings(),
      logs: getAuditLogs()
    });
  });

  app.post("/api/security", (req, res) => {
    const updated = updateSecuritySettings(req.body);
    res.json(updated);
  });

  // Vite Integration for Development vs Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Use an explicit http.Server (instead of app.listen) so the WebSocket
  // bridge can attach to the same underlying server and share the port.
  const httpServer = http.createServer(app);
  attachAgentWebSocketServer(httpServer);

  httpServer.listen(PORT, HOST, () => {
    console.log(`[Jarvis Server] Running on http://${HOST}:${PORT}`);
    console.log(`[Jarvis Server] Desktop agent bridge listening at ws://${HOST}:${PORT}/ws/agent`);
    if (HOST === "0.0.0.0") {
      console.warn("[SECURITY] Server is bound to 0.0.0.0 - reachable from your network, not just this machine.");
    }
  });
}

startServer();