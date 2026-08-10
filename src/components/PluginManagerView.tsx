import React from "react";
import { useAgent } from "../context/AgentContext";
import {
  Boxes,
  Music,
  Code,
  Globe,
  MessageSquare,
  CheckCircle2,
  Sliders,
  Terminal,
} from "lucide-react";

export const PluginManagerView: React.FC = () => {
  const { plugins, togglePluginById } = useAgent();

  const getPluginIcon = (icon: string) => {
    if (icon === "Music") return <Music className="w-5 h-5 text-emerald-400" />;
    if (icon === "Code") return <Code className="w-5 h-5 text-blue-400" />;
    if (icon === "Globe") return <Globe className="w-5 h-5 text-amber-400" />;
    return <MessageSquare className="w-5 h-5 text-purple-400" />;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2 font-sans">
          <Boxes className="w-5 h-5 text-cyan-400" />
          Jarvis Plugin & Integrations Store
        </h1>
        <p className="text-xs text-slate-400">
          Enable modular integrations to control Spotify, VS Code, Discord, Chrome, and OBS from AI chat commands.
        </p>
      </div>

      {/* Plugins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plugins.map((plg) => (
          <div
            key={plg.id}
            className={`p-6 rounded-3xl border transition-all backdrop-blur-xl space-y-4 ${
              plg.enabled
                ? "bg-slate-900/80 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                : "bg-slate-900/40 border-slate-800 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  {getPluginIcon(plg.icon)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {plg.name}
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      v{plg.version}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">{plg.description}</p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => togglePluginById(plg.id, !plg.enabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  plg.enabled ? "bg-cyan-500" : "bg-slate-800"
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                    plg.enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Registered Commands preview */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1">
                <Terminal className="w-3 h-3 text-cyan-400" /> Registered Voice Commands
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {plg.commands.map((cmd, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
                  >
                    "{cmd}"
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
