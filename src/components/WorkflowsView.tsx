import React, { useState } from "react";
import { useAgent } from "../context/AgentContext";
import { Workflow } from "../types";
import {
  Zap,
  Play,
  Plus,
  Briefcase,
  Gamepad2,
  Trash2,
  Clock,
  CheckCircle2,
  Sliders,
  Layers,
} from "lucide-react";

export const WorkflowsView: React.FC = () => {
  const { workflows, runWorkflowById } = useAgent();
  const [activeTab, setActiveTab] = useState<"all" | "active">("all");

  const getWorkflowIcon = (iconName: string) => {
    if (iconName === "Briefcase") return <Briefcase className="w-5 h-5 text-indigo-400" />;
    if (iconName === "Gamepad2") return <Gamepad2 className="w-5 h-5 text-rose-400" />;
    return <Zap className="w-5 h-5 text-cyan-400" />;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2 font-sans">
            <Zap className="w-5 h-5 text-cyan-400" />
            Automated Macro Workflows
          </h1>
          <p className="text-xs text-slate-400">
            Trigger multi-app launch sequences, system optimizations, and custom macro routines with 1-click or hotkeys.
          </p>
        </div>
      </div>

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {workflows.map((wf) => (
          <div
            key={wf.id}
            className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 transition-all backdrop-blur-xl space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  {getWorkflowIcon(wf.icon)}
                </div>
                {wf.shortcut && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {wf.shortcut}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{wf.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{wf.description}</p>
              </div>

              {/* Steps List */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Automated Actions ({wf.steps.length})</span>
                {wf.steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-2 text-xs font-mono text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{step.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => runWorkflowById(wf.id)}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              Trigger Routine Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
