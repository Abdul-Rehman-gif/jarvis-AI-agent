import React from "react";
import { useAgent } from "../context/AgentContext";
import { ShieldAlert, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export const SafetyConfirmationModal: React.FC = () => {
  const { pendingAction, confirmPendingAction } = useAgent();

  if (!pendingAction) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.2)] space-y-5">
        <div className="flex items-center gap-3 text-amber-400">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-sans">
              High-Risk Command Confirmation
            </h2>
            <span className="text-xs text-amber-300 font-mono">
              Action requires explicit user authorization
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Action Type:</span>
            <span className="text-cyan-300 font-bold uppercase">{pendingAction.action}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Category:</span>
            <span className="text-slate-200">{pendingAction.category}</span>
          </div>
          {pendingAction.params && Object.keys(pendingAction.params).length > 0 && (
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">Parameters:</span>
              <pre className="p-2 rounded bg-slate-900 text-amber-300 overflow-x-auto text-[11px]">
                {JSON.stringify(pendingAction.params, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-300">
          Executing this action will send the command directly to your connected Windows PC workstation. Proceed with execution?
        </p>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => confirmPendingAction(false)}
            className="flex-1 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <XCircle className="w-4 h-4" /> Cancel Command
          </button>
          <button
            onClick={() => confirmPendingAction(true)}
            className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" /> Approve Execution
          </button>
        </div>
      </div>
    </div>
  );
};
