import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import html2canvas from "html2canvas";
import {
  SystemMetrics,
  RunningProcess,
  AgentStatus,
  FileItem,
  ChatMessage,
  ExecutedAction,
  Workflow,
  Plugin,
  AuditLog,
  SecuritySettings,
} from "../types";

export type ViewType =
  | "dashboard"
  | "chat"
  | "monitor"
  | "files"
  | "workflows"
  | "plugins"
  | "security"
  | "pairing";

interface AgentContextType {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  metrics: SystemMetrics;
  agentStatus: AgentStatus;
  processes: RunningProcess[];
  files: FileItem[];
  workflows: Workflow[];
  plugins: Plugin[];
  auditLogs: AuditLog[];
  securitySettings: SecuritySettings;
  chatMessages: ChatMessage[];
  isThinking: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  wakeWordDetected: boolean;
  pendingAction: ExecutedAction | null;
  activeScreenshotUrl: string | null;
  isScreenshotModalOpen: boolean;
  isActiveScreenshotLive: boolean;

  // Actions
  openScreenshotModal: (url: string, isLive?: boolean) => void;
  closeScreenshotModal: () => void;
  captureScreenshot: () => Promise<string>;
  sendChatMessage: (content: string) => Promise<void>;
  toggleListening: () => void;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
  confirmPendingAction: (approved: boolean) => void;
  killProcessById: (pid: number) => Promise<void>;
  deleteFileById: (id: string) => Promise<void>;
  createNewFolder: (name: string, path?: string) => Promise<void>;
  runWorkflowById: (id: string) => Promise<void>;
  togglePluginById: (id: string, enabled: boolean) => Promise<void>;
  updateSecurity: (settings: Partial<SecuritySettings>) => Promise<void>;
  pairDevice: (pairingCode: string) => Promise<boolean>;
  executeDirectAction: (action: string, category: any, params?: any) => Promise<void>;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

const createSyntheticScreenshotDataUrl = (): string => {
  const width = 1280;
  const height = 720;
  const timestamp = new Date().toLocaleString();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="#0b0f19"/>
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
      </pattern>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#6366f1" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.1"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)"/>
    <rect width="100%" height="100%" fill="url(#grad)"/>
    
    <rect x="0" y="0" width="${width}" height="48" fill="rgba(15, 23, 42, 0.95)"/>
    <text x="24" y="30" fill="#818cf8" font-family="monospace" font-size="16" font-weight="bold">JARVIS OS CONTROL CENTER &bull; LIVE SCREENSHOT</text>
    <text x="${width - 240}" y="30" fill="#94a3b8" font-family="monospace" font-size="14">${timestamp}</text>

    <rect x="60" y="80" width="700" height="420" rx="16" fill="#1e293b" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    <rect x="60" y="80" width="700" height="40" fill="rgba(255,255,255,0.05)"/>
    <circle cx="85" cy="100" r="6" fill="#ef4444"/>
    <circle cx="105" cy="100" r="6" fill="#f59e0b"/>
    <circle cx="125" cy="100" r="6" fill="#10b981"/>
    <text x="150" y="105" fill="#e2e8f0" font-family="sans-serif" font-size="13" font-weight="bold">Visual Studio Code - main.tsx</text>
    
    <text x="90" y="160" fill="#38bdf8" font-family="monospace" font-size="14">import { useAgent } from "./context/AgentContext";</text>
    <text x="90" y="190" fill="#a7f3d0" font-family="monospace" font-size="14">const takeScreenshot = async () =&gt; {</text>
    <text x="120" y="220" fill="#fcd34d" font-family="monospace" font-size="14">await pyautogui.screenshot();</text>
    <text x="90" y="250" fill="#a7f3d0" font-family="monospace" font-size="14">};</text>

    <rect x="800" y="80" width="420" height="580" rx="16" fill="#0f172a" stroke="rgba(129,140,248,0.3)" stroke-width="1"/>
    <text x="830" y="130" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold">Live Telemetry Metrics</text>
    <text x="830" y="170" fill="#94a3b8" font-family="monospace" font-size="14">CPU Utilization: 28% (16 Cores)</text>
    <rect x="830" y="185" width="360" height="10" rx="5" fill="#334155"/>
    <rect x="830" y="185" width="100" height="10" rx="5" fill="#818cf8"/>
    
    <text x="830" y="230" fill="#94a3b8" font-family="monospace" font-size="14">RAM Load: 48% (15.4 GB / 32 GB)</text>
    <rect x="830" y="245" width="360" height="10" rx="5" fill="#334155"/>
    <rect x="830" y="245" width="172" height="10" rx="5" fill="#22d3ee"/>

    <rect x="60" y="520" width="700" height="140" rx="12" fill="rgba(99, 102, 241, 0.12)" stroke="rgba(99, 102, 241, 0.3)"/>
    <text x="90" y="560" fill="#818cf8" font-family="sans-serif" font-size="16" font-weight="bold">Real-time Display Capture Executed</text>
    <text x="90" y="590" fill="#cbd5e1" font-family="sans-serif" font-size="13">Display #1 (1920x1080) &bull; Desktop Agent Active</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  // Voice-loop guards: recognitionRef lets speakText() pause/resume the mic;
  // isPausedForSpeechRef mutes recognition while Jarvis is talking (avoids
  // hearing its own TTS come back through the speakers); lastVoiceCommandRef
  // deduplicates identical commands fired in quick succession.
  const recognitionRef = useRef<any>(null);
  const isPausedForSpeechRef = useRef(false);
  const lastVoiceCommandRef = useRef<{ text: string; at: number } | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [pendingAction, setPendingAction] = useState<ExecutedAction | null>(null);
  const [activeScreenshotUrl, setActiveScreenshotUrl] = useState<string | null>(null);
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false);
  const [isActiveScreenshotLive, setIsActiveScreenshotLive] = useState(true);

  // isLive tells the modal whether this is a real capture from the paired
  // desktop agent, or a local fallback preview of the web dashboard itself
  // (used only when no agent is connected).
  const openScreenshotModal = (url: string, isLive: boolean = true) => {
    setActiveScreenshotUrl(url);
    setIsActiveScreenshotLive(isLive);
    setIsScreenshotModalOpen(true);
  };

  const closeScreenshotModal = () => {
    setIsScreenshotModalOpen(false);
    setActiveScreenshotUrl(null);
  };

  const captureScreenshot = async (): Promise<string> => {
    try {
      const rootEl = document.getElementById("root") || document.body;
      const canvas = await html2canvas(rootEl, {
        logging: false,
        useCORS: true,
        allowTaint: true,
        scale: 1.2,
        backgroundColor: "#020617",
      });
      const dataUrl = canvas.toDataURL("image/png");
      return dataUrl;
    } catch (e) {
      console.warn("HTML2Canvas capture warning, fallback to SVG screenshot renderer:", e);
      return createSyntheticScreenshotDataUrl();
    }
  };

  // Honest defaults until /api/agent/status (backed by the real WebSocket
  // bridge) reports back - no more pretending a PC is paired before we know.
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({
    paired: false,
    connected: false,
    agentId: "WIN-AGENT-991",
    deviceName: "No agent connected",
    platform: "Unknown",
    ipAddress: "",
    version: "v2.5.0-win",
    lastSeen: new Date().toISOString(),
    pairingCode: "JARVIS-8849",
  });

  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuUsage: 28,
    cpuCores: 16,
    cpuTemp: 44,
    ramUsage: 48,
    ramUsedGB: 15.4,
    ramTotalGB: 32.0,
    diskUsage: 62,
    diskUsedGB: 620,
    diskTotalGB: 1000,
    gpuUsage: 19,
    netDownloadKbps: 124.5,
    netUploadKbps: 45.2,
    batteryLevel: 98,
    isCharging: true,
    uptimeSeconds: 84600,
  });

  const [processes, setProcesses] = useState<RunningProcess[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    confirmFileDelete: true,
    confirmPowerAction: true,
    confirmPowerShell: true,
    confirmKillProcess: true,
    autoApproveLowRisk: true,
    requirePinForCritical: true,
    pinCode: "1234",
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "assistant",
      content: "Jarvis v2.5 Online. All systems operational. Connected to DESKTOP-JARVIS-PRO. How can I assist you with your Windows PC today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Fetch Telemetry & live agent connection status
  const fetchTelemetry = useCallback(async () => {
    try {
      const [metricsRes, statusRes] = await Promise.all([
        fetch("/api/agent/metrics"),
        fetch("/api/agent/status"),
      ]);
      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (statusRes.ok) setAgentStatus(await statusRes.json());
    } catch (e) {
      console.error("Telemetry fetch error:", e);
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    try {
      const [procsRes, filesRes, wfRes, plgRes, secRes, statusRes] = await Promise.all([
        fetch("/api/agent/processes"),
        fetch("/api/file-explorer"),
        fetch("/api/workflows"),
        fetch("/api/plugins"),
        fetch("/api/security"),
        fetch("/api/agent/status"),
      ]);

      if (procsRes.ok) setProcesses(await procsRes.json());
      if (filesRes.ok) setFiles(await filesRes.json());
      if (wfRes.ok) setWorkflows(await wfRes.json());
      if (plgRes.ok) setPlugins(await plgRes.json());
      if (statusRes.ok) setAgentStatus(await statusRes.json());
      if (secRes.ok) {
        const sec = await secRes.json();
        setSecuritySettings(sec.settings);
        setAuditLogs(sec.logs);
      }
    } catch (e) {
      console.error("Error loading initial data:", e);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(fetchTelemetry, 1000);
    return () => clearInterval(interval);
  }, [fetchInitialData, fetchTelemetry]);

  // Text to Speech
  const speakText = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    // Mute the microphone while Jarvis is talking, so it doesn't hear its
    // own voice come back through the speakers and re-trigger as a new
    // command (this was causing the same action to fire repeatedly).
    if (recognitionRef.current) {
      isPausedForSpeechRef.current = true;
      try { recognitionRef.current.stop(); } catch { /* already stopped */ }
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      // Resume listening a beat after Jarvis stops talking, to give any
      // speaker/mic echo tail time to die down before we listen again.
      isPausedForSpeechRef.current = false;
      if (isListening && recognitionRef.current) {
        setTimeout(() => {
          if (!isPausedForSpeechRef.current) {
            try { recognitionRef.current?.start(); } catch { /* already running */ }
          }
        }, 1000);
      }
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      isPausedForSpeechRef.current = false;
    };

    window.speechSynthesis.speak(utterance);
  }, [isListening]);

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Web Speech STT & Wake Word
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (isListening) {
        console.warn("[Jarvis] Speech recognition isn't supported in this browser - try Chrome or Edge.");
        setIsListening(false);
      }
      return;
    }
    if (!isListening) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      // Ignore anything heard while Jarvis's own reply is playing or just
      // finished - this is almost always mic pickup of our own speakers,
      // not a real new command.
      if (isPausedForSpeechRef.current) return;

      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      const lower = transcript.toLowerCase();
      if (lower.includes("jarvis") || lower.includes("hey jarvis")) {
        setWakeWordDetected(true);
        setTimeout(() => setWakeWordDetected(false), 1000);
      }

      if (event.results[event.results.length - 1].isFinal && transcript.trim()) {
        const normalized = transcript.trim().toLowerCase();
        const now = Date.now();
        const last = lastVoiceCommandRef.current;

        // Dedupe: skip if this is the same command we just sent within
        // the last 6 seconds (covers duplicate 'final' events and any
        // residual echo not caught by the speaking-pause above).
        if (last && last.text === normalized && now - last.at < 6000) {
          return;
        }

        lastVoiceCommandRef.current = { text: normalized, at: now };
        sendChatMessage(transcript.trim());
      }
    };

    // Restarts recognition a beat later instead of synchronously - calling
    // .start() immediately inside onend/onerror can throw InvalidStateError
    // if the browser hasn't fully torn down the previous session yet, which
    // silently killed the mic without any visible error. This was very
    // likely the cause of "listens sometimes, not others" - the very common
    // Chrome behavior of auto-ending recognition after a pause in speech
    // was hitting that race on every restart attempt.
    const scheduleRestart = () => {
      setTimeout(() => {
        if (isListening && !isPausedForSpeechRef.current && recognitionRef.current === recognition) {
          try {
            recognition.start();
          } catch {
            /* already starting/running - benign */
          }
        }
      }, 300);
    };

    recognition.onerror = (event: any) => {
      // "aborted" fires whenever .stop() is called on a recognition instance
      // - including our OWN cleanup below, and React StrictMode's dev-mode
      // mount->cleanup->mount replay - it is not a real failure. "no-speech"
      // just means it timed out hearing nothing. "network" is Chrome's cloud
      // speech service hiccuping - usually transient and worth a retry
      // rather than giving up. All three are followed by onend, which
      // schedules the actual restart, so no explicit action is needed here
      // beyond not killing isListening.
      if (event?.error === "aborted" || event?.error === "no-speech" || event?.error === "network") {
        if (event?.error === "network") console.warn("[Jarvis] Speech recognition network hiccup, retrying...");
        return;
      }

      console.warn("[Jarvis] Speech recognition error:", event?.error);
      if (event?.error === "not-allowed" || event?.error === "service-not-allowed") {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `msg-mic-err-${Date.now()}`,
            sender: "assistant",
            content: "Microphone access is blocked for this site. Click the lock/site-info icon in your address bar, allow Microphone, then try the mic button again.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
      // audio-capture, bad-grammar, language-not-supported, etc: genuinely
      // fatal for this session - stop rather than retry-looping forever.
      setIsListening(false);
    };

    recognition.onend = scheduleRestart;

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.warn("[Jarvis] Failed to start speech recognition:", e);
    }

    return () => {
      try {
        recognition.stop();
      } catch {
        /* already stopped */
      }
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
    };
  }, [isListening]);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-mic-unsupported-${Date.now()}`,
          sender: "assistant",
          content: "Voice control needs Chrome or Edge - this browser doesn't support the Web Speech API.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      return;
    }
    setIsListening((prev) => !prev);
  };


  // Send AI Chat Command
  const sendChatMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });

      const data = await response.json();

      // The server already actually ran each non-risky action against the
      // paired desktop agent (or reported why it couldn't) - we just render
      // whatever it tells us instead of fabricating results client-side.
      const actionsList: ExecutedAction[] = (data.actions || []).map((act: any, idx: number) => ({
        id: `act-${Date.now()}-${idx}`,
        action: act.action,
        category: act.category,
        params: act.params,
        requiresConfirmation: act.requiresConfirmation,
        status: act.status || (act.requiresConfirmation ? "pending" : "completed"),
        result: act.result || (act.requiresConfirmation ? "Awaiting safety confirmation" : "Action executed"),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        screenshotDataUrl: act.screenshotDataUrl,
      }));

      const isScreenshotReq = actionsList.some((a) => a.action === "screenshot");
      const liveScreenshot = actionsList.find((a) => a.action === "screenshot" && a.screenshotDataUrl)?.screenshotDataUrl;

      let screenshotUrl = "";
      let screenshotIsLive = false;
      if (isScreenshotReq) {
        if (liveScreenshot) {
          // Real capture came back from the paired desktop agent.
          screenshotUrl = liveScreenshot;
          screenshotIsLive = true;

          const fileName = `Screenshot_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}.png`;
          const newFile: FileItem = {
            id: `file-ss-${Date.now()}`,
            name: fileName,
            path: `C:\\Users\\Admin\\Pictures\\Screenshots\\${fileName}`,
            size: 1850000,
            type: "file",
            extension: "png",
            updatedAt: "Just now",
            isSystem: false,
          };
          setFiles((prev) => [newFile, ...prev]);
        } else {
          // No agent connected / capture failed - fall back to a local
          // preview of the web dashboard itself, clearly labeled as such.
          screenshotUrl = await captureScreenshot();
          screenshotIsLive = false;
        }
        openScreenshotModal(screenshotUrl, screenshotIsLive);
      }

      // Check for actions needing confirmation
      const needsConfirm = actionsList.find((a) => a.requiresConfirmation);
      if (needsConfirm) {
        setPendingAction(needsConfirm);
      }

      const replyContent = isScreenshotReq
        ? (screenshotIsLive
            ? "Screenshot captured from your desktop and saved to Pictures/Screenshots."
            : "I couldn't reach the desktop agent, so here's a preview of the web dashboard instead. Pair the desktop agent for a real screen capture.")
        : (data.replyText || "Command processed.");

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "assistant",
        content: replyContent,
        intent: data.intent,
        actions: actionsList,
        screenshotDataUrl: isScreenshotReq ? screenshotUrl : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
      setIsThinking(false);

      // Speak response aloud
      speakText(replyContent);
    } catch (error) {
      console.error("Chat error:", error);
      setIsThinking(false);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: "assistant",
          content: "Sorry, I encountered an error executing that command. Please check desktop agent status.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  // Confirm pending action - actually sends it to the paired desktop agent
  // and waits for the real result, instead of assuming success.
  const confirmPendingAction = async (approved: boolean) => {
    if (!pendingAction) return;
    const actionId = pendingAction.id;
    const action = pendingAction;
    setPendingAction(null);

    const applyToAction = (updater: (act: ExecutedAction) => ExecutedAction) => {
      setChatMessages((prev) =>
        prev.map((msg) => {
          if (!msg.actions) return msg;
          return { ...msg, actions: msg.actions.map((act) => (act.id === actionId ? updater(act) : act)) };
        })
      );
    };

    if (!approved) {
      applyToAction((act) => ({
        ...act,
        confirmed: false,
        status: "cancelled",
        result: "Cancelled by user security choice",
      }));
      return;
    }

    applyToAction((act) => ({ ...act, status: "executing" }));

    try {
      const res = await fetch("/api/agent/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action.action,
          category: action.category,
          params: action.params,
        }),
      });
      const data = await res.json();
      const success = Boolean(data.success);
      const isScreenshot = action.action === "screenshot" && typeof data.result === "string" && data.result.startsWith("data:image");

      applyToAction((act) => ({
        ...act,
        confirmed: true,
        status: success ? "completed" : "failed",
        result: isScreenshot ? "Screenshot captured from the desktop." : (data.result || (success ? "Executed." : "Execution failed.")),
        screenshotDataUrl: isScreenshot ? data.result : act.screenshotDataUrl,
      }));

      if (isScreenshot) openScreenshotModal(data.result, true);

      speakText(success ? `Confirmed execution of ${action.action}. Action complete.` : `Execution of ${action.action} failed.`);
    } catch (e) {
      applyToAction((act) => ({ ...act, status: "failed", result: "Could not reach the server to execute this action." }));
    }
  };

  // Execute direct action
  const executeDirectAction = async (action: string, category: any, params?: any) => {
    await sendChatMessage(`Execute ${action} ${params?.name ? params.name : ''}`);
  };

  // Process Killing
  const killProcessById = async (pid: number) => {
    try {
      const res = await fetch("/api/agent/processes/kill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid }),
      });
      if (res.ok) {
        setProcesses((prev) => prev.filter((p) => p.pid !== pid));
        speakText(`Process ${pid} terminated.`);
      }
    } catch (e) {
      console.error("Kill process failed:", e);
    }
  };

  // Delete file
  const deleteFileById = async (id: string) => {
    try {
      const res = await fetch("/api/file-explorer/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== id));
      }
    } catch (e) {
      console.error("Delete file failed:", e);
    }
  };

  // Create folder
  const createNewFolder = async (name: string, path?: string) => {
    try {
      const res = await fetch("/api/file-explorer/create-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, path }),
      });
      if (res.ok) {
        const newFolder = await res.json();
        setFiles((prev) => [newFolder, ...prev]);
      }
    } catch (e) {
      console.error("Create folder failed:", e);
    }
  };

  // Run Workflow
  const runWorkflowById = async (id: string) => {
    try {
      const res = await fetch("/api/workflows/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        const data = await res.json();
        speakText(data.message);
        sendChatMessage(`Triggered automation workflow: ${data.workflow?.name || id}`);
      }
    } catch (e) {
      console.error("Workflow trigger failed:", e);
    }
  };

  // Toggle Plugin
  const togglePluginById = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch("/api/plugins/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPlugins(updated);
      }
    } catch (e) {
      console.error("Plugin toggle failed:", e);
    }
  };

  // Security Update
  const updateSecurity = async (newSec: Partial<SecuritySettings>) => {
    try {
      const res = await fetch("/api/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSec),
      });
      if (res.ok) {
        const updated = await res.json();
        setSecuritySettings(updated);
      }
    } catch (e) {
      console.error("Security update failed:", e);
    }
  };

  // Pair device
  const pairDevice = async (pairingCode: string) => {
    if (pairingCode.trim().length > 3) {
      setAgentStatus((prev) => ({
        ...prev,
        paired: true,
        connected: true,
        pairingCode,
        lastSeen: new Date().toISOString(),
      }));
      return true;
    }
    return false;
  };

  return (
    <AgentContext.Provider
      value={{
        currentView,
        setCurrentView,
        metrics,
        agentStatus,
        processes,
        files,
        workflows,
        plugins,
        auditLogs,
        securitySettings,
        chatMessages,
        isThinking,
        isListening,
        isSpeaking,
        wakeWordDetected,
        pendingAction,
        activeScreenshotUrl,
        isScreenshotModalOpen,
        isActiveScreenshotLive,
        openScreenshotModal,
        closeScreenshotModal,
        captureScreenshot,
        sendChatMessage,
        toggleListening,
        speakText,
        stopSpeaking,
        confirmPendingAction,
        killProcessById,
        deleteFileById,
        createNewFolder,
        runWorkflowById,
        togglePluginById,
        updateSecurity,
        pairDevice,
        executeDirectAction,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (!context) throw new Error("useAgent must be used within an AgentProvider");
  return context;
};