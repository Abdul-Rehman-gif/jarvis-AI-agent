import React from "react";
import { useAgent, ViewType } from "../context/AgentContext";
import {
  LayoutDashboard,
  MessageSquare,
  Activity,
  FolderTree,
  Zap,
  Boxes,
  ShieldCheck,
  Laptop,
  Terminal,
} from "lucide-react";

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, agentStatus } = useAgent();

  const navItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "chat", label: "Jarvis AI Chat", icon: MessageSquare, badge: "AI" },
    { id: "monitor", label: "System Monitor", icon: Activity },
    { id: "files", label: "File Explorer", icon: FolderTree },
    { id: "workflows", label: "Automations", icon: Zap },
    { id: "plugins", label: "Plugin Store", icon: Boxes },
    { id: "security", label: "Security & Logs", icon: ShieldCheck },
    { id: "pairing", label: "PC Desktop Agent", icon: Laptop },
  ];

  return (
    <aside className="w-16 md:w-64 bg-white/5 backdrop-blur-md border-r border-white/10 flex flex-col justify-between shrink-0 select-none">
      <div className="py-4 px-2 md:px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? "bg-indigo-500/20 text-indigo-100 font-semibold border border-indigo-500/30 shadow-[0_0_15px_rgba(129,140,248,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-indigo-400"
                }`}
              />

              <span className="hidden md:inline text-sm font-medium tracking-wide">
                {item.label}
              </span>

              {item.badge && (
                <span className="hidden md:inline ml-auto text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {item.badge}
                </span>
              )}

              {/* Active bar glow on left */}
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-400 rounded-r-full shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Agent Card */}
      <div className="p-3 m-2 rounded-2xl bg-white/5 border border-white/10 hidden md:block">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-mono font-semibold text-slate-300">
            AGENT STATUS
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 space-y-1">
          <div className="flex justify-between">
            <span>Device:</span>
            <span className="text-slate-200 truncate max-w-[100px]">{agentStatus.deviceName}</span>
          </div>
          <div className="flex justify-between">
            <span>Platform:</span>
            <span className="text-cyan-400">Win 11 x64</span>
          </div>
          <div className="flex justify-between">
            <span>Bridge:</span>
            <span className="text-emerald-400 font-bold">WS Encrypted</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
