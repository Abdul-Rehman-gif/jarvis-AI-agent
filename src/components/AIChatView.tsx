import React, { useState, useRef, useEffect } from "react";
import { useAgent } from "../context/AgentContext";
import { JarvisOrbing } from "./JarvisOrbing";
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Play,
  Volume2,
  ShieldAlert,
  Terminal,
  VolumeX,
  Camera,
  ExternalLink,
} from "lucide-react";

export const AIChatView: React.FC = () => {
  const {
    chatMessages,
    sendChatMessage,
    isThinking,
    isListening,
    isSpeaking,
    toggleListening,
    stopSpeaking,
    wakeWordDetected,
    confirmPendingAction,
    openScreenshotModal,
  } = useAgent();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isThinking) {
      sendChatMessage(input);
      setInput("");
    }
  };

  const samplePrompts = [
    "Open Google Chrome",
    "Open VS Code",
    "Take a screenshot",
    "Clean temporary files",
    "Increase volume to 80%",
    "Activate Work Mode",
    "Lock my Windows PC",
    "Show CPU and RAM usage",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto p-4 md:p-6 space-y-4">
      {/* Header Visualizer Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <JarvisOrbing
            isListening={isListening}
            isThinking={isThinking}
            isSpeaking={isSpeaking}
            size="sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white font-mono tracking-wider uppercase">
                Jarvis Voice & Cognition Engine
              </h2>
              {wakeWordDetected && (
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono animate-bounce">
                  WAKE WORD DETECTED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Function Calling Architecture • Windows PC Real-Time Agent Control
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs flex items-center gap-1.5 font-mono"
            >
              <VolumeX className="w-3.5 h-3.5" /> Stop Voice
            </button>
          )}

          <button
            onClick={toggleListening}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isListening
                ? "bg-rose-500 text-white animate-pulse"
                : "bg-white/5 text-slate-200 hover:bg-white/10 border border-white/10"
            }`}
          >
            {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            {isListening ? "Listening..." : "Enable Mic"}
          </button>
        </div>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-3xl ${
              msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            {/* Avatar Icon */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                msg.sender === "user"
                  ? "bg-indigo-600 text-white"
                  : msg.sender === "system"
                  ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                  : "bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white"
              }`}
            >
              {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble Content */}
            <div className="space-y-2">
              <div
                className={`p-4 rounded-2xl border text-sm leading-relaxed backdrop-blur-md ${
                  msg.sender === "user"
                    ? "bg-indigo-600/30 border-indigo-500/40 text-white rounded-tr-none shadow-lg"
                    : "bg-white/5 border-white/10 text-slate-200 rounded-tl-none"
                }`}
              >
                {msg.intent && (
                  <div className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    INTENT: {msg.intent}
                  </div>
                )}
                <p>{msg.content}</p>

                {msg.screenshotDataUrl && (
                  <div className="mt-3 p-2 rounded-xl bg-slate-950/80 border border-indigo-500/30 overflow-hidden space-y-2">
                    <div className="relative group cursor-pointer" onClick={() => openScreenshotModal(msg.screenshotDataUrl!)}>
                      <img
                        src={msg.screenshotDataUrl}
                        alt="Captured Screenshot"
                        className="w-full max-h-52 object-cover rounded-lg border border-white/10 group-hover:opacity-90 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-indigo-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <span className="px-3 py-1.5 rounded-lg bg-slate-900/90 text-indigo-300 text-xs font-mono font-bold border border-indigo-500/40 shadow-xl flex items-center gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5" /> Expand Screenshot
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs px-1 font-mono">
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5 text-indigo-400" />
                        Captured PNG
                      </span>
                      <button
                        onClick={() => openScreenshotModal(msg.screenshotDataUrl!)}
                        className="text-indigo-400 hover:text-indigo-300 text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        View Fullscreen
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-[10px] font-mono text-slate-400 mt-1 text-right">
                  {msg.timestamp}
                </div>
              </div>

              {/* Action Execution Cards Block */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="space-y-2 pt-1">
                  {msg.actions.map((act) => (
                    <div
                      key={act.id}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs font-mono space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="font-bold text-indigo-300 uppercase">{act.action}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                            {act.category}
                          </span>
                        </div>

                        {act.status === "completed" && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Executed
                          </span>
                        )}
                        {act.status === "pending" && (
                          <span className="flex items-center gap-1 text-amber-400 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" /> Requires Approval
                          </span>
                        )}
                        {act.status === "cancelled" && (
                          <span className="flex items-center gap-1 text-slate-500">
                            Cancelled
                          </span>
                        )}
                        {act.status === "executing" && (
                          <span className="flex items-center gap-1 text-cyan-400 animate-pulse">
                            Sending to agent...
                          </span>
                        )}
                        {act.status === "failed" && (
                          <span className="flex items-center gap-1 text-rose-400">
                            <AlertTriangle className="w-3.5 h-3.5" /> Failed
                          </span>
                        )}
                      </div>

                      {act.params && Object.keys(act.params).length > 0 && (
                        <div className="bg-white/5 p-2 rounded border border-white/5 text-slate-400">
                          {JSON.stringify(act.params)}
                        </div>
                      )}

                      {act.result && (act.status === "completed" || act.status === "failed") && (
                        <div className={`p-2 rounded border text-[11px] ${act.status === "failed" ? "bg-rose-500/10 border-rose-500/30 text-rose-200" : "bg-white/5 border-white/5 text-slate-400"}`}>
                          {act.result}
                        </div>
                      )}

                      {/* Interactive Confirmation Prompt inside chat */}
                      {act.status === "pending" && (
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-amber-400" />
                            <span>Safety check: Approve executing {act.action} on PC?</span>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => confirmPendingAction(true)}
                              className="px-3 py-1 rounded bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors text-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => confirmPendingAction(false)}
                              className="px-3 py-1 rounded bg-white/10 text-slate-300 hover:bg-white/20 transition-colors text-xs"
                            >
                              Deny
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex gap-3 max-w-xl mr-auto">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-400 flex items-center gap-2">
              <span className="animate-pulse">Jarvis AI thinking & parsing Windows PC automation intent...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Command Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0">
        <span className="text-[10px] font-mono text-slate-400 uppercase shrink-0">Prompts:</span>
        {samplePrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => sendChatMessage(prompt)}
            className="text-xs font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:border-indigo-400/40 hover:text-indigo-300 transition-colors shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="relative shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Command Jarvis (e.g. 'Open Chrome', 'Shutdown PC', 'Take screenshot')..."
          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-500 font-medium backdrop-blur-md"
        />
        <button
          type="submit"
          disabled={!input.trim() || isThinking}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors shadow-lg"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
