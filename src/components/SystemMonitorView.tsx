import React, { useState } from "react";
import { useAgent } from "../context/AgentContext";
import {
  Activity,
  Cpu,
  Monitor,
  HardDrive,
  Wifi,
  Search,
  XCircle,
  ShieldCheck,
  Zap,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export const SystemMonitorView: React.FC = () => {
  const { metrics, processes, killProcessById, agentStatus } = useAgent();
  const [search, setSearch] = useState("");
  const [selectedPid, setSelectedPid] = useState<number | null>(null);

  const filteredProcesses = processes.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.pid.toString().includes(search)
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2 font-sans">
            <Activity className="w-5 h-5 text-cyan-400" />
            Windows Task Manager & Telemetry
          </h1>
          <p className="text-xs text-slate-400">
            Real-time Windows process monitoring, resource allocation, and agent diagnostic telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Agent Device: <span className="text-cyan-300">{agentStatus.deviceName}</span>
        </div>
      </div>

      {/* Gauges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CPU Detailed */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">CPU PERFORMANCE</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-4xl font-bold text-white font-mono">{metrics.cpuUsage}%</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)] transition-all duration-300"
              style={{ width: `${metrics.cpuUsage}%` }}
            />
          </div>
          <div className="grid grid-cols-2 text-[11px] font-mono text-slate-400 pt-2 border-t border-white/10">
            <div>Cores: {metrics.cpuCores}</div>
            <div>Temp: {metrics.cpuTemp || 44}°C</div>
            <div>Arch: x86_64</div>
            <div>Base Clock: 4.2 GHz</div>
          </div>
        </div>

        {/* RAM Detailed */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">RAM MEMORY</span>
            <Monitor className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-4xl font-bold text-white font-mono">{metrics.ramUsage}%</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)] transition-all duration-300"
              style={{ width: `${metrics.ramUsage}%` }}
            />
          </div>
          <div className="grid grid-cols-2 text-[11px] font-mono text-slate-400 pt-2 border-t border-white/10">
            <div>Used: {metrics.ramUsedGB} GB</div>
            <div>Total: {metrics.ramTotalGB} GB</div>
            <div>Speed: 5600 MT/s</div>
            <div>Type: DDR5 SDRAM</div>
          </div>
        </div>

        {/* Disk & Net */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">DISK & NETWORK</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex justify-between items-baseline">
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">SSD USAGE</span>
              <span className="text-2xl font-bold text-white font-mono">{metrics.diskUsage}%</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-mono">DOWNLOAD</span>
              <span className="text-xl font-bold text-cyan-400 font-mono">↓ {metrics.netDownloadKbps} KB/s</span>
            </div>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] transition-all duration-300"
              style={{ width: `${metrics.diskUsage}%` }}
            />
          </div>
          <div className="grid grid-cols-2 text-[11px] font-mono text-slate-400 pt-2 border-t border-white/10">
            <div>Used: {metrics.diskUsedGB} GB</div>
            <div>Free: {metrics.diskTotalGB - metrics.diskUsedGB} GB</div>
            <div>Upload: ↑ {metrics.netUploadKbps} KB/s</div>
            <div>Status: Healthy</div>
          </div>
        </div>
      </div>

      {/* Task Manager Table Card */}
      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            Active Processes ({filteredProcesses.length})
          </h2>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter processes..."
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase">
                <th className="pb-3">PID</th>
                <th className="pb-3">Application Name</th>
                <th className="pb-3">CPU Usage</th>
                <th className="pb-3">Memory (MB)</th>
                <th className="pb-3">User</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProcesses.map((proc) => (
                <tr key={proc.pid} className="hover:bg-white/5 text-slate-200">
                  <td className="py-3 text-slate-500">{proc.pid}</td>
                  <td className="py-3 font-semibold text-indigo-300">{proc.name}</td>
                  <td className="py-3">{proc.cpuPercent}%</td>
                  <td className="py-3">{proc.memoryMB} MB</td>
                  <td className="py-3 text-slate-400">{proc.user}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => killProcessById(proc.pid)}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors flex items-center gap-1 ml-auto text-[11px]"
                    >
                      <XCircle className="w-3.5 h-3.5" /> End Task
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
