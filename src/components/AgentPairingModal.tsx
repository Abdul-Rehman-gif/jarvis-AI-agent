import React, { useState } from "react";
import { useAgent } from "../context/AgentContext";
import {
  Laptop,
  Download,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Wifi,
} from "lucide-react";

export const AgentPairingModal: React.FC = () => {
  const { agentStatus, pairDevice } = useAgent();
  const [pairingCodeInput, setPairingCodeInput] = useState(agentStatus.pairingCode);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(agentStatus.pairingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2 font-sans">
          <Laptop className="w-5 h-5 text-cyan-400" />
          Windows Desktop Agent Pairing & Download
        </h1>
        <p className="text-xs text-slate-400">
          The web dashboard communicates with your Windows PC via a secure Python desktop agent. The browser never accesses system APIs directly.
        </p>
      </div>

      {/* Agent Downloads Section */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-xl space-y-5 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-cyan-400" />
            Download Windows Desktop Agent Package
          </h2>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            Python 3.10+ • Win32 API • PyAutoGUI • WebSockets
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <a
            href="/api/agent/download?file=agent.py"
            download="jarvis_agent.py"
            className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center gap-3">
              <Terminal className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
              <div>
                <span className="text-sm font-bold text-white block">jarvis_agent.py</span>
                <span className="text-[10px] text-slate-400 font-mono">Main Python Agent Script</span>
              </div>
            </div>
            <div className="mt-3 text-[11px] font-mono text-cyan-300 flex items-center gap-1 font-semibold">
              <Download className="w-3.5 h-3.5" /> Download Script
            </div>
          </a>

          <a
            href="/api/agent/download?file=requirements.txt"
            download="requirements.txt"
            className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center gap-3">
              <Terminal className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
              <div>
                <span className="text-sm font-bold text-white block">requirements.txt</span>
                <span className="text-[10px] text-slate-400 font-mono">PyWin32, Psutil & Dependencies</span>
              </div>
            </div>
            <div className="mt-3 text-[11px] font-mono text-indigo-300 flex items-center gap-1 font-semibold">
              <Download className="w-3.5 h-3.5" /> Download Requirements
            </div>
          </a>

          <a
            href="/api/agent/download?file=start.bat"
            download="start_agent.bat"
            className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center gap-3">
              <Terminal className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div>
                <span className="text-sm font-bold text-white block">start_agent.bat</span>
                <span className="text-[10px] text-slate-400 font-mono">1-Click Windows Batch Launcher</span>
              </div>
            </div>
            <div className="mt-3 text-[11px] font-mono text-emerald-300 flex items-center gap-1 font-semibold">
              <Download className="w-3.5 h-3.5" /> Download Launcher
            </div>
          </a>
        </div>
      </div>

      {/* Step by Step Setup Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Installation & Execution Steps
          </h3>

          <ol className="space-y-3 text-xs font-mono text-slate-300 list-decimal list-inside">
            <li className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              Download <span className="text-cyan-300 font-bold">jarvis_agent.py</span> and <span className="text-cyan-300 font-bold">start_agent.bat</span> to any folder on your Windows PC.
            </li>
            <li className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              Double click <span className="text-emerald-300 font-bold">start_agent.bat</span> (or run <code className="text-purple-300">python agent.py</code> in PowerShell).
            </li>
            <li className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              The agent connects via encrypted WebSockets to stream telemetry and receive voice commands.
            </li>
          </ol>
        </div>

        {/* Pairing Code Card */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Wifi className="w-4 h-4 text-emerald-400" />
              Your Device Pairing Key
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Enter this pairing PIN in your local agent or configuration file:
            </p>

            <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 flex items-center justify-between">
              <span className="text-2xl font-mono font-extrabold text-cyan-300 tracking-widest">
                {agentStatus.pairingCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy PIN"}
              </button>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 text-xs font-mono p-3 rounded-xl border ${
              agentStatus.connected
                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                : "text-amber-400 bg-amber-500/10 border-amber-500/30"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              {agentStatus.connected
                ? `Agent Status: Paired & Connected (${agentStatus.deviceName})`
                : "Agent Status: Waiting for the desktop agent to connect..."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
