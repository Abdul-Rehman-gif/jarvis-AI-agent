import { SystemMetrics, RunningProcess, AgentStatus, FileItem, Workflow, Plugin, AuditLog, SecuritySettings } from "../src/types.js";

// Real desktop state, populated once an actual agent authenticates over the
// WebSocket bridge (server/wsAgentServer.ts). Until then we honestly report
// "not connected" instead of pretending a PC is paired.
let currentAgentStatus: AgentStatus = {
  paired: false,
  connected: false,
  agentId: "WIN-AGENT-991",
  deviceName: "No agent connected",
  platform: "Unknown",
  ipAddress: "",
  version: "v2.5.0-win",
  lastSeen: new Date().toISOString(),
  pairingCode: process.env.JARVIS_PAIRING_CODE || "(see server startup log)",
};

// Demo/fallback telemetry, only shown while no real agent is connected so the
// dashboard isn't blank before you've paired a device.
let currentMetrics: SystemMetrics = {
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
};

// True once real telemetry has arrived from a connected agent at least once
// recently. getSystemMetrics() stops fabricating jitter once this is true.
let lastLiveMetricsAt = 0;
const LIVE_METRICS_STALE_MS = 8000;

export function setLiveMetrics(telemetry: Record<string, any>) {
  currentMetrics = {
    cpuUsage: telemetry.cpuUsage ?? currentMetrics.cpuUsage,
    cpuCores: telemetry.cpuCores ?? currentMetrics.cpuCores,
    cpuTemp: telemetry.cpuTemp ?? currentMetrics.cpuTemp,
    ramUsage: telemetry.ramUsage ?? currentMetrics.ramUsage,
    ramUsedGB: telemetry.ramUsedGB ?? currentMetrics.ramUsedGB,
    ramTotalGB: telemetry.ramTotalGB ?? currentMetrics.ramTotalGB,
    diskUsage: telemetry.diskUsage ?? currentMetrics.diskUsage,
    diskUsedGB: telemetry.diskUsedGB ?? currentMetrics.diskUsedGB,
    diskTotalGB: telemetry.diskTotalGB ?? currentMetrics.diskTotalGB,
    gpuUsage: telemetry.gpuUsage ?? currentMetrics.gpuUsage,
    netDownloadKbps: telemetry.netDownloadKbps ?? currentMetrics.netDownloadKbps,
    netUploadKbps: telemetry.netUploadKbps ?? currentMetrics.netUploadKbps,
    batteryLevel: telemetry.batteryLevel ?? currentMetrics.batteryLevel,
    isCharging: telemetry.isCharging ?? currentMetrics.isCharging,
    uptimeSeconds: telemetry.uptimeSeconds ?? currentMetrics.uptimeSeconds,
  };
  lastLiveMetricsAt = Date.now();
}

export function hasLiveMetrics(): boolean {
  return Date.now() - lastLiveMetricsAt < LIVE_METRICS_STALE_MS;
}

export function setLiveProcesses(procs: RunningProcess[]) {
  activeProcesses = procs;
  lastLiveProcessesAt = Date.now();
}

let lastLiveProcessesAt = 0;

let activeProcesses: RunningProcess[] = [
  { pid: 1420, name: "chrome.exe", cpuPercent: 8.4, memoryMB: 1250, status: "running", user: "Admin" },
  { pid: 3892, name: "code.exe", cpuPercent: 4.1, memoryMB: 820, status: "running", user: "Admin" },
  { pid: 5120, name: "spotify.exe", cpuPercent: 1.2, memoryMB: 340, status: "running", user: "Admin" },
  { pid: 7810, name: "discord.exe", cpuPercent: 2.8, memoryMB: 480, status: "running", user: "Admin" },
  { pid: 9940, name: "steam.exe", cpuPercent: 0.5, memoryMB: 290, status: "running", user: "Admin" },
  { pid: 1052, name: "explorer.exe", cpuPercent: 1.0, memoryMB: 180, status: "running", user: "Admin" },
  { pid: 6430, name: "python_agent.exe", cpuPercent: 0.8, memoryMB: 95, status: "running", user: "System" },
];

let mockFiles: FileItem[] = [
  { id: "f1", name: "Projects", path: "C:\\Users\\Admin\\Projects", size: 0, type: "folder", updatedAt: "2026-08-04" },
  { id: "f2", name: "Downloads", path: "C:\\Users\\Admin\\Downloads", size: 0, type: "folder", updatedAt: "2026-08-05" },
  { id: "f3", name: "Documents", path: "C:\\Users\\Admin\\Documents", size: 0, type: "folder", updatedAt: "2026-08-03" },
  { id: "f4", name: "Jarvis_Config.json", path: "C:\\Users\\Admin\\Projects\\Jarvis_Config.json", size: 4096, type: "file", extension: "json", updatedAt: "2026-08-05" },
  { id: "f5", name: "App_Build_Script.ps1", path: "C:\\Users\\Admin\\Projects\\App_Build_Script.ps1", size: 1024, type: "file", extension: "ps1", updatedAt: "2026-08-02" },
  { id: "f6", name: "Screenshot_20260805.png", path: "C:\\Users\\Admin\\Downloads\\Screenshot_20260805.png", size: 2450000, type: "file", extension: "png", updatedAt: "2026-08-05" },
];

let defaultWorkflows: Workflow[] = [
  {
    id: "wf-work",
    name: "Work Mode",
    description: "Launch VS Code, Chrome, Slack, mute music, and set volume to 40%",
    icon: "Briefcase",
    triggerType: "manual",
    shortcut: "Ctrl+Alt+W",
    steps: [
      { id: "s1", title: "Launch VS Code", type: "app_control", payload: { name: "VS Code" }, enabled: true },
      { id: "s2", title: "Open Google Chrome", type: "app_control", payload: { name: "Chrome" }, enabled: true },
      { id: "s3", title: "Set Master Volume to 40%", type: "volume_media", payload: { level: 40 }, enabled: true },
    ]
  },
  {
    id: "wf-gaming",
    name: "Gaming Mode",
    description: "Launch Steam & Discord, kill background Chrome tabs, disable DND",
    icon: "Gamepad2",
    triggerType: "manual",
    shortcut: "Ctrl+Alt+G",
    steps: [
      { id: "sg1", title: "Launch Steam", type: "app_control", payload: { name: "Steam" }, enabled: true },
      { id: "sg2", title: "Open Discord", type: "app_control", payload: { name: "Discord" }, enabled: true },
      { id: "sg3", title: "Close Heavy Background Apps", type: "app_control", payload: { name: "chrome.exe" }, enabled: true },
    ]
  },
  {
    id: "wf-clean",
    name: "System Cleanup",
    description: "Clean Windows temporary cache files and flush DNS resolution",
    icon: "Trash2",
    triggerType: "schedule",
    scheduleTime: "Daily at 03:00 AM",
    steps: [
      { id: "sc1", title: "Clean Temp Cache", type: "system_power", payload: { mode: "clean_temp" }, enabled: true },
      { id: "sc2", title: "Flush DNS Cache", type: "powershell_cmd", payload: { script: "Clear-DnsClientCache" }, enabled: true },
    ]
  }
];

let pluginsList: Plugin[] = [
  {
    id: "plg-spotify",
    name: "Spotify Control",
    description: "Media playback, playlist queueing, track switching, and volume control.",
    version: "1.4.0",
    author: "Jarvis Official",
    icon: "Music",
    enabled: true,
    category: "media",
    commands: ["Play music", "Pause Spotify", "Next track", "Current song info"],
    settings: [{ key: "autoResume", label: "Resume on startup", type: "boolean", value: true }]
  },
  {
    id: "plg-vscode",
    name: "VS Code Integration",
    description: "Open recent workspaces, run terminal tasks, format document, git commit.",
    version: "2.1.0",
    author: "Jarvis Official",
    icon: "Code",
    enabled: true,
    category: "dev",
    commands: ["Open workspace", "Run build task", "Toggle terminal"],
    settings: [{ key: "defaultFolder", label: "Default workspace folder", type: "string", value: "C:\\Users\\Admin\\Projects" }]
  },
  {
    id: "plg-chrome",
    name: "Chrome Automation",
    description: "Playwright powered browser control, tab searching, web scraping.",
    version: "3.0.0",
    author: "Jarvis Official",
    icon: "Globe",
    enabled: true,
    category: "browser",
    commands: ["Search YouTube", "Open bookmark", "Scrape webpage"],
    settings: [{ key: "headless", label: "Headless mode", type: "boolean", value: false }]
  },
  {
    id: "plg-discord",
    name: "Discord RPC & Messages",
    description: "Rich Presence sync, voice mute/deafen, unread message notifications.",
    version: "1.2.0",
    author: "Community",
    icon: "MessageSquare",
    enabled: true,
    category: "media",
    commands: ["Mute microphone", "Deafen audio", "Set status"],
    settings: []
  }
];

let auditLogs: AuditLog[] = [
  {
    id: "log-101",
    command: "Launch Google Chrome",
    category: "App Control",
    initiatedBy: "User (Voice Command)",
    riskLevel: "low",
    status: "executed",
    timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(),
    details: "Process started successfully (PID: 1420)"
  },
  {
    id: "log-102",
    command: "Set Volume 80%",
    category: "System Audio",
    initiatedBy: "User (Chat)",
    riskLevel: "low",
    status: "executed",
    timestamp: new Date(Date.now() - 1800000).toLocaleTimeString(),
    details: "Master volume updated to 80"
  },
  {
    id: "log-103",
    command: "Clean Temporary Files",
    category: "System Power",
    initiatedBy: "Workflow: System Cleanup",
    riskLevel: "medium",
    confirmedBy: "Admin User",
    status: "executed",
    timestamp: new Date(Date.now() - 900000).toLocaleTimeString(),
    details: "Freed 1.4 GB temp space"
  }
];

let securitySettings: SecuritySettings = {
  confirmFileDelete: true,
  confirmPowerAction: true,
  confirmPowerShell: true,
  confirmKillProcess: true,
  autoApproveLowRisk: true,
  requirePinForCritical: true,
  pinCode: "1234",
};

export function getAgentStatus() {
  return currentAgentStatus;
}

export function updateAgentStatus(status: Partial<AgentStatus>) {
  currentAgentStatus = { ...currentAgentStatus, ...status, lastSeen: new Date().toISOString() };
  return currentAgentStatus;
}

export function getSystemMetrics() {
  // Once a real agent is streaming telemetry, report it as-is - no more
  // fabricated jitter pretending to be a live machine.
  if (hasLiveMetrics()) {
    return currentMetrics;
  }

  // No agent connected: keep the dashboard non-blank with clearly-synthetic
  // fluctuating demo numbers.
  currentMetrics = {
    ...currentMetrics,
    cpuUsage: Math.max(10, Math.min(95, Math.round(currentMetrics.cpuUsage + (Math.random() * 8 - 4)))),
    ramUsage: Math.max(20, Math.min(90, Math.round(currentMetrics.ramUsage + (Math.random() * 2 - 1)))),
    gpuUsage: Math.max(5, Math.min(90, Math.round((currentMetrics.gpuUsage || 15) + (Math.random() * 6 - 3)))),
    netDownloadKbps: Math.round(Math.random() * 300 + 50),
    netUploadKbps: Math.round(Math.random() * 100 + 10),
  };
  return currentMetrics;
}

export function getProcesses() {
  return activeProcesses;
}

export function killProcess(pid: number) {
  const target = activeProcesses.find(p => p.pid === pid);
  activeProcesses = activeProcesses.filter(p => p.pid !== pid);
  
  if (target) {
    addAuditLog({
      command: `Kill Process ${target.name} (PID ${pid})`,
      category: "Task Manager",
      initiatedBy: "User",
      riskLevel: "medium",
      status: "executed",
      details: `Terminated process ${target.name}`
    });
  }
  return { success: true, message: `Process ${pid} terminated.` };
}

export function getMockFiles() {
  return mockFiles;
}

export function deleteFile(id: string) {
  const target = mockFiles.find(f => f.id === id);
  mockFiles = mockFiles.filter(f => f.id !== id);
  
  if (target) {
    addAuditLog({
      command: `Delete File ${target.name}`,
      category: "File Explorer",
      initiatedBy: "User",
      riskLevel: "high",
      status: "executed",
      details: `Permanently deleted ${target.path}`
    });
  }
  return { success: true, message: "File deleted successfully." };
}

export function createFolder(name: string, path: string) {
  const newFolder: FileItem = {
    id: `folder-${Date.now()}`,
    name,
    path: `${path}\\${name}`,
    size: 0,
    type: "folder",
    updatedAt: new Date().toISOString().split("T")[0]
  };
  mockFiles.unshift(newFolder);
  return newFolder;
}

export function getWorkflows() {
  return defaultWorkflows;
}

export function executeWorkflow(id: string) {
  const wf = defaultWorkflows.find(w => w.id === id);
  if (!wf) return { success: false, message: "Workflow not found" };

  addAuditLog({
    command: `Execute Workflow: ${wf.name}`,
    category: "Automation",
    initiatedBy: "User",
    riskLevel: "low",
    status: "executed",
    details: `Successfully triggered ${wf.steps.length} automation steps`
  });

  return { success: true, message: `Workflow "${wf.name}" completed successfully.`, workflow: wf };
}

export function getPlugins() {
  return pluginsList;
}

export function togglePlugin(id: string, enabled: boolean) {
  pluginsList = pluginsList.map(p => p.id === id ? { ...p, enabled } : p);
  return pluginsList;
}

export function getAuditLogs() {
  return auditLogs;
}

export function addAuditLog(log: Omit<AuditLog, "id" | "timestamp">) {
  const newLog: AuditLog = {
    ...log,
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString()
  };
  auditLogs.unshift(newLog);
  return newLog;
}

export function getSecuritySettings() {
  return securitySettings;
}

export function updateSecuritySettings(settings: Partial<SecuritySettings>) {
  securitySettings = { ...securitySettings, ...settings };
  return securitySettings;
}
