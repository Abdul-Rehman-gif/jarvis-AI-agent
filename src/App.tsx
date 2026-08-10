import React from "react";
import { AgentProvider, useAgent } from "./context/AgentContext";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { DashboardView } from "./components/DashboardView";
import { AIChatView } from "./components/AIChatView";
import { SystemMonitorView } from "./components/SystemMonitorView";
import { FileExplorerView } from "./components/FileExplorerView";
import { WorkflowsView } from "./components/WorkflowsView";
import { PluginManagerView } from "./components/PluginManagerView";
import { SecurityAuditView } from "./components/SecurityAuditView";
import { AgentPairingModal } from "./components/AgentPairingModal";
import { SafetyConfirmationModal } from "./components/SafetyConfirmationModal";
import { ScreenshotModal } from "./components/ScreenshotModal";

function MainContent() {
  const { currentView, activeScreenshotUrl, isScreenshotModalOpen, isActiveScreenshotLive, closeScreenshotModal } = useAgent();

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardView />;
      case "chat":
        return <AIChatView />;
      case "monitor":
        return <SystemMonitorView />;
      case "files":
        return <FileExplorerView />;
      case "workflows":
        return <WorkflowsView />;
      case "plugins":
        return <PluginManagerView />;
      case "security":
        return <SecurityAuditView />;
      case "pairing":
        return <AgentPairingModal />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans relative overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <Header />
      <div className="flex-1 flex overflow-hidden z-10">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-transparent">
          {renderView()}
        </main>
      </div>
      <SafetyConfirmationModal />
      <ScreenshotModal
        isOpen={isScreenshotModalOpen}
        onClose={closeScreenshotModal}
        imageUrl={activeScreenshotUrl || ""}
        isLive={isActiveScreenshotLive}
      />
    </div>
  );
}

export default function App() {
  return (
    <AgentProvider>
      <MainContent />
    </AgentProvider>
  );
}
