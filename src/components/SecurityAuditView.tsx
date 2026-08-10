import React from "react";
import { useAgent } from "../context/AgentContext";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Key,
  KeyRound,
} from "lucide-react";

export const SecurityAuditView: React.FC = () => {
  const { securitySettings, updateSecurity, auditLogs, agentStatus } = useAgent();

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2 font-sans">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Security Center & Action Audit Logs
        </h1>
        <p className="text-xs text-slate-400">
          Configure Windows PC execution safety guards, require PIN confirmation for high-risk commands, and inspect execution audit logs.
        </p>
      </div>

      {/* Safety Toggles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            Execution Confirmation Guardrails
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block">File Deletion Confirmation</span>
                <span className="text-slate-400 text-[11px]">Require explicit approval before permanently removing files</span>
              </div>
              <input
                type="checkbox"
                checked={securitySettings.confirmFileDelete}
                onChange={(e) => updateSecurity({ confirmFileDelete: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block">Power Action Confirmation</span>
                <span className="text-slate-400 text-[11px]">Require approval for Shutdown, Restart, or Sleep</span>
              </div>
              <input
                type="checkbox"
                checked={securitySettings.confirmPowerAction}
                onChange={(e) => updateSecurity({ confirmPowerAction: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block">PowerShell Script Approval</span>
                <span className="text-slate-400 text-[11px]">Prompt before running CLI / PowerShell commands</span>
              </div>
              <input
                type="checkbox"
                checked={securitySettings.confirmPowerShell}
                onChange={(e) => updateSecurity({ confirmPowerShell: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Device Pairing Security Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-purple-400" />
            Agent Pairing & Handshake Encryption
          </h2>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Paired Device:</span>
              <span className="text-cyan-300 font-bold">{agentStatus.deviceName}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Pairing PIN Code:</span>
              <span className="text-emerald-300 font-bold">{agentStatus.pairingCode}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Transport Security:</span>
              <span className="text-purple-300 font-bold">WSS / TLS 1.3</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Browser Isolation:</span>
              <span className="text-emerald-400 font-bold font-sans">✓ Strictly Proxied via Agent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          Command Execution Audit Trail
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase">
                <th className="pb-3">Time</th>
                <th className="pb-3">Command</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Initiated By</th>
                <th className="pb-3">Risk Level</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/50 text-slate-200">
                  <td className="py-3 text-slate-400">{log.timestamp}</td>
                  <td className="py-3 font-semibold text-cyan-300">{log.command}</td>
                  <td className="py-3 text-slate-400">{log.category}</td>
                  <td className="py-3 text-slate-300">{log.initiatedBy}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.riskLevel === "high" || log.riskLevel === "critical"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : log.riskLevel === "medium"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {log.riskLevel}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Executed
                    </span>
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
