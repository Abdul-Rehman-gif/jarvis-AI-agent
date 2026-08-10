export interface SystemMetrics {
  cpuUsage: number; // percentage 0-100
  cpuCores: number;
  cpuTemp?: number;
  ramUsage: number; // percentage
  ramUsedGB: number;
  ramTotalGB: number;
  diskUsage: number; // percentage
  diskUsedGB: number;
  diskTotalGB: number;
  gpuUsage?: number;
  netDownloadKbps: number;
  netUploadKbps: number;
  batteryLevel?: number;
  isCharging?: boolean;
  uptimeSeconds: number;
}

export interface RunningProcess {
  pid: number;
  name: string;
  cpuPercent: number;
  memoryMB: number;
  status: 'running' | 'sleeping' | 'stopped';
  user: string;
}

export interface AgentStatus {
  paired: boolean;
  connected: boolean;
  agentId: string;
  deviceName: string;
  platform: string; // Windows 11 / Windows 10
  ipAddress: string;
  version: string;
  lastSeen: string;
  pairingCode: string;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  size: number;
  type: 'file' | 'folder';
  extension?: string;
  updatedAt: string;
  isSystem?: boolean;
}

export type ActionCategory = 
  | 'app_control' 
  | 'window_control' 
  | 'system_power' 
  | 'volume_media' 
  | 'file_system' 
  | 'powershell_cmd' 
  | 'browser_automation' 
  | 'workflow'
  | 'plugin';

export interface ExecutedAction {
  id: string;
  action: string;
  category: ActionCategory;
  params?: Record<string, any>;
  requiresConfirmation: boolean;
  confirmed?: boolean;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  result?: string;
  timestamp: string;
  screenshotDataUrl?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  actions?: ExecutedAction[];
  intent?: string;
  isStreaming?: boolean;
  screenshotDataUrl?: string;
}

export interface AutomationStep {
  id: string;
  title: string;
  type: ActionCategory;
  payload: Record<string, any>;
  enabled: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  icon: string;
  steps: AutomationStep[];
  isActive?: boolean;
  triggerType: 'manual' | 'shortcut' | 'schedule';
  shortcut?: string;
  scheduleTime?: string;
}

export interface PluginSetting {
  key: string;
  label: string;
  type: 'string' | 'boolean' | 'number';
  value: any;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  icon: string;
  enabled: boolean;
  category: 'media' | 'dev' | 'browser' | 'gaming' | 'utility';
  commands: string[];
  settings: PluginSetting[];
}

export interface AuditLog {
  id: string;
  command: string;
  category: string;
  initiatedBy: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confirmedBy?: string;
  status: 'allowed' | 'blocked' | 'executed';
  timestamp: string;
  details: string;
}

export interface SecuritySettings {
  confirmFileDelete: boolean;
  confirmPowerAction: boolean;
  confirmPowerShell: boolean;
  confirmKillProcess: boolean;
  autoApproveLowRisk: boolean;
  requirePinForCritical: boolean;
  pinCode: string;
}
