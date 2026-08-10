import React from "react";
import { useAgent } from "../context/AgentContext";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ShieldAlert,
  Lock,
  Wifi,
  WifiOff,
  Cpu,
  Monitor,
  Sparkles,
  Download,
} from "lucide-react";

export const Header: React.FC = () => {
  const {
    agentStatus,
    metrics,
    isListening,
    toggleListening,
    isSpeaking,
    stopSpeaking,
    setCurrentView,
    executeDirectAction,
  } = useAgent();

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-white/5 backdrop-blur-md border-b border-white/10 px-4 md:px-6 flex items-center justify-between shrink-0">
      {/* Left Branding */}
      <div className="flex items-center gap-3">
        <div
          onClick={() => setCurrentView("dashboard")}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 font-sans">
                JARVIS
              </span>
              <span className="text-[10px] font-mono text-indigo-400 ml-1.5 px-2 py-0.5 border border-indigo-400/30 rounded">
                v2.0.4-OS
              </span>
            </div>
          </div>
        </div>

        <div className="h-6 w-px bg-white/10 mx-2 hidden md:block" />

        {/* Agent Connection Status Pill */}
        <div
          onClick={() => setCurrentView("pairing")}
          className="cursor-pointer hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:border-indigo-400/40 transition-colors"
        >
          {agentStatus.connected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-mono text-slate-300">
                {agentStatus.deviceName}
              </span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span className="text-xs font-mono text-rose-300">Agent Disconnected</span>
            </>
          )}
        </div>
      </div>

      {/* Center Live Hardware Telemetry Quick Pills */}
      <div className="hidden lg:flex items-center gap-4 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400 font-mono">CPU:</span>
          <span className={`font-mono font-semibold ${metrics.cpuUsage > 80 ? 'text-rose-400' : 'text-indigo-400'}`}>
            {metrics.cpuUsage}%
          </span>
        </div>
        <div className="h-3 w-px bg-white/10" />
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <Monitor className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400 font-mono">RAM:</span>
          <span className="font-mono font-semibold text-cyan-400">
            {metrics.ramUsage}% ({metrics.ramUsedGB}GB)
          </span>
        </div>
        <div className="h-3 w-px bg-white/10" />
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <span className="text-slate-400 font-mono">NET:</span>
          <span className="font-mono font-semibold text-emerald-400">
            ↓ {metrics.netDownloadKbps} KB/s
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Agent Setup Downloader button */}
        <button
          onClick={() => setCurrentView("pairing")}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 transition-all font-mono"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Desktop Agent</span>
        </button>

        {/* Voice Mic Toggle */}
        <button
          onClick={toggleListening}
          className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
            isListening
              ? "bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse"
              : "bg-white/5 border-white/10 text-slate-300 hover:border-indigo-400/40"
          }`}
          title={isListening ? "Voice Listening Active (Click to Mute)" : "Enable Voice Control"}
        >
          {isListening ? <Mic className="w-4 h-4 text-rose-400" /> : <MicOff className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Sound TTS Speaker Mute Toggle */}
        <button
          onClick={isSpeaking ? stopSpeaking : () => {}}
          className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
            isSpeaking
              ? "bg-indigo-500/20 border-indigo-400 text-indigo-300 animate-bounce"
              : "bg-white/5 border-white/10 text-slate-400"
          }`}
          title={isSpeaking ? "Mute Speech Feedback" : "Speech Audio Enabled"}
        >
          {isSpeaking ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>

        {/* Emergency Workstation Lock */}
        <button
          onClick={() => executeDirectAction("system_power", "system_power", { mode: "lock" })}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/50 text-amber-400 hover:bg-amber-500/10 transition-colors"
          title="Lock Windows PC Workstation"
        >
          <Lock className="w-4 h-4" />
        </button>

        {/* Security Audit Button */}
        <button
          onClick={() => setCurrentView("security")}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/50 text-indigo-400 transition-colors"
          title="Security & Audit Log"
        >
          <ShieldAlert className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
