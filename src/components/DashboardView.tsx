import React, { useState } from "react";
import { useAgent } from "../context/AgentContext";
import { JarvisOrbing } from "./JarvisOrbing";
import {
  Sparkles,
  Send,
  Camera,
  Briefcase,
  Trash2,
  Lock,
  VolumeX,
  Code,
  Globe,
  Cpu,
  Monitor,
  HardDrive,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  FileText,
} from "lucide-react";

export const DashboardView: React.FC = () => {
  const {
    metrics,
    agentStatus,
    files,
    workflows,
    processes,
    sendChatMessage,
    isListening,
    isThinking,
    isSpeaking,
    toggleListening,
    executeDirectAction,
    runWorkflowById,
    setCurrentView,
  } = useAgent();

  const [quickInput, setQuickInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickInput.trim()) {
      sendChatMessage(quickInput);
      setQuickInput("");
      setCurrentView("chat");
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Hero Jarvis Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] border border-white/10 p-6 md:p-8 backdrop-blur-md shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded border border-indigo-400/30 bg-indigo-500/10 text-indigo-300 text-[10px] font-mono">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              JARVIS PC COPILOT ONLINE
            </div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              Welcome back, Commander
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Connected to <span className="text-indigo-300 font-mono font-semibold">{agentStatus.deviceName}</span>. Ready to execute natural language PC automation, manage background processes, and run macro workflows.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              <button
                onClick={toggleListening}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg ${
                  isListening
                    ? "bg-rose-500 text-white animate-pulse"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                {isListening ? "Listening... Speak Now" : "Start Voice Control"}
              </button>

              <button
                onClick={() => setCurrentView("chat")}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
              >
                Open Full AI Chat
              </button>
            </div>
          </div>

          {/* Interactive Jarvis Orb Visualizer */}
          <div
            onClick={() => setCurrentView("chat")}
            className="cursor-pointer hover:scale-105 transition-transform p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 backdrop-blur-sm flex items-center gap-4"
          >
            <JarvisOrbing
              isListening={isListening}
              isThinking={isThinking}
              isSpeaking={isSpeaking}
              size="lg"
            />
          </div>
        </div>
      </div>

      {/* Real-time Telemetry Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Card */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm hover:bg-white/[0.08] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">
              CPU Utilization
            </span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{metrics.cpuUsage}%</span>
            <span className="text-xs text-slate-400 font-mono">16 Cores</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 shadow-[0_0_8px_rgba(129,140,248,0.5)] ${
                metrics.cpuUsage > 80 ? "bg-rose-500" : "bg-indigo-400"
              }`}
              style={{ width: `${metrics.cpuUsage}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-2">
            <span>Temp: {metrics.cpuTemp || 44}°C</span>
            <span>Uptime: {Math.floor(metrics.uptimeSeconds / 3600)}h</span>
          </div>
        </div>

        {/* RAM Card */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm hover:bg-white/[0.08] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">
              Memory Load
            </span>
            <Monitor className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{metrics.ramUsage}%</span>
            <span className="text-xs text-cyan-400 font-mono">{metrics.ramUsedGB} / {metrics.ramTotalGB} GB</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)] transition-all duration-500"
              style={{ width: `${metrics.ramUsage}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-2">
            <span>Active Apps: {processes.length}</span>
            <span>DDR5 5600MHz</span>
          </div>
        </div>

        {/* DISK Card */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm hover:bg-white/[0.08] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">
              Storage (SSD)
            </span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{metrics.diskUsage}%</span>
            <span className="text-xs text-emerald-400 font-mono">{metrics.diskUsedGB} / {metrics.diskTotalGB} GB</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] transition-all duration-500"
              style={{ width: `${metrics.diskUsage}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-2">
            <span>Free: {metrics.diskTotalGB - metrics.diskUsedGB} GB</span>
            <span>NVMe Gen4</span>
          </div>
        </div>

        {/* NETWORK Speed Card */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm hover:bg-white/[0.08] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">
              Network Speed
            </span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Down</span>
              <span className="text-xl font-bold text-cyan-400 font-mono">↓ {metrics.netDownloadKbps} KB/s</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Up</span>
              <span className="text-xl font-bold text-indigo-300 font-mono">↑ {metrics.netUploadKbps} KB/s</span>
            </div>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-cyan-400 animate-pulse w-3/4 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-2">
            <span>Ping: 12 ms</span>
            <span>Wi-Fi 6E</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            Quick Automations
          </h2>
          <span className="text-xs text-slate-500">1-Click Windows Control</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <button
            onClick={() => executeDirectAction("screenshot", "window_control")}
            className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 text-left transition-colors group flex flex-col justify-between"
          >
            <Camera className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-white mb-0.5">Screenshot</div>
              <div className="text-[10px] text-slate-500 italic">Capture Screen</div>
            </div>
          </button>

          <button
            onClick={() => runWorkflowById("wf-work")}
            className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 text-left transition-colors group flex flex-col justify-between"
          >
            <Briefcase className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-white mb-0.5">Work Session</div>
              <div className="text-[10px] text-slate-500 italic">6 Apps</div>
            </div>
          </button>

          <button
            onClick={() => executeDirectAction("open_app", "app_control", { name: "VS Code" })}
            className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 text-left transition-colors group flex flex-col justify-between"
          >
            <Code className="w-5 h-5 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-white mb-0.5">VS Code</div>
              <div className="text-[10px] text-slate-500 italic">Launch Editor</div>
            </div>
          </button>

          <button
            onClick={() => executeDirectAction("open_app", "app_control", { name: "Chrome" })}
            className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 text-left transition-colors group flex flex-col justify-between"
          >
            <Globe className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-white mb-0.5">Chrome</div>
              <div className="text-[10px] text-slate-500 italic">Open Browser</div>
            </div>
          </button>

          <button
            onClick={() => runWorkflowById("wf-clean")}
            className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 text-left transition-colors group flex flex-col justify-between"
          >
            <Trash2 className="w-5 h-5 text-rose-400 mb-2 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-white mb-0.5">Clean Up</div>
              <div className="text-[10px] text-slate-500 italic">Temp Files</div>
            </div>
          </button>

          <button
            onClick={() => executeDirectAction("system_power", "system_power", { mode: "lock" })}
            className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-left transition-colors group flex flex-col justify-between"
          >
            <Lock className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-emerald-400 mb-0.5">Lock Workstation</div>
              <div className="text-[10px] text-emerald-600 italic">Secure PC</div>
            </div>
          </button>
        </div>
      </div>

      {/* Grid Section: Running Applications & Recent Files */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Task Manager Preview */}
        <div className="lg:col-span-2 rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              Active Processes ({processes.length})
            </h3>
            <button
              onClick={() => setCurrentView("monitor")}
              className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-mono"
            >
              Task Manager <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase">
                  <th className="pb-2">PID</th>
                  <th className="pb-2">Process Name</th>
                  <th className="pb-2">CPU</th>
                  <th className="pb-2">Memory</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {processes.slice(0, 5).map((proc) => (
                  <tr key={proc.pid} className="hover:bg-white/5 text-slate-200">
                    <td className="py-2.5 text-slate-500">{proc.pid}</td>
                    <td className="py-2.5 font-semibold text-indigo-300">{proc.name}</td>
                    <td className="py-2.5">{proc.cpuPercent}%</td>
                    <td className="py-2.5">{proc.memoryMB} MB</td>
                    <td className="py-2.5 text-right">
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Running
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Health & Recent Files */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Device Insights
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-slate-400">Windows Defender:</span>
                <span className="text-emerald-400 font-semibold">Protected</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-slate-400">Agent Handshake:</span>
                <span className="text-indigo-300 font-semibold">100% Encrypted</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-slate-400">Safety Guard:</span>
                <span className="text-amber-300 font-semibold">Danger Confirm ON</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Recent Files
              </h3>
              <button
                onClick={() => setCurrentView("files")}
                className="text-xs text-cyan-400 hover:underline font-mono"
              >
                Browse All
              </button>
            </div>
            <div className="space-y-2">
              {files.slice(0, 3).map((f) => (
                <div
                  key={f.id}
                  onClick={() => setCurrentView("files")}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/40 cursor-pointer flex items-center justify-between text-xs"
                >
                  <span className="font-mono text-slate-200 truncate max-w-[180px]">{f.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{f.updatedAt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Command Bar Input */}
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          placeholder="Type a command (e.g., 'Take a screenshot' or 'Shutdown PC')..."
          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-500 font-medium backdrop-blur-md"
        />
        <button
          type="submit"
          disabled={!quickInput.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors shadow-lg"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
