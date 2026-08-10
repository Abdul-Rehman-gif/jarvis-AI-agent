import React from "react";
import { motion } from "motion/react";

interface JarvisOrbProps {
  isListening?: boolean;
  isThinking?: boolean;
  isSpeaking?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const JarvisOrbing: React.FC<JarvisOrbProps> = ({
  isListening = false,
  isThinking = false,
  isSpeaking = false,
  size = "md",
  className = "",
}) => {
  const dimensionMap = {
    sm: "w-16 h-16",
    md: "w-32 h-32",
    lg: "w-48 h-48",
  };

  const getStatusColor = () => {
    if (isListening) return "from-red-500 via-amber-400 to-rose-600";
    if (isThinking) return "from-purple-500 via-cyan-400 to-indigo-600";
    if (isSpeaking) return "from-cyan-400 via-emerald-400 to-blue-600";
    return "from-cyan-500 via-blue-600 to-indigo-700";
  };

  const getStatusLabel = () => {
    if (isListening) return "LISTENING...";
    if (isThinking) return "PROCESSING...";
    if (isSpeaking) return "SPEAKING...";
    return "JARVIS READY";
  };

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* Outer Glow Halo */}
      <motion.div
        animate={{
          scale: isSpeaking ? [1, 1.25, 1.05, 1.2] : isListening ? [1, 1.3, 1] : [1, 1.1, 1],
          opacity: [0.35, 0.7, 0.35],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: isThinking ? 1.5 : isSpeaking ? 2 : 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute rounded-full bg-gradient-to-tr ${getStatusColor()} blur-xl opacity-50 ${dimensionMap[size]}`}
      />

      {/* Rotating Ring Outer */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className={`absolute rounded-full border border-cyan-500/30 border-dashed ${dimensionMap[size]}`}
      />

      {/* Rotating Ring Inner Counter */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className={`absolute rounded-full border border-purple-500/20 ${dimensionMap[size]}`}
        style={{ padding: "8px" }}
      />

      {/* Core AI Orb */}
      <motion.div
        animate={{
          scale: isSpeaking ? [0.9, 1.1, 0.95] : isThinking ? [0.85, 1.05, 0.85] : [0.95, 1.02, 0.95],
        }}
        transition={{
          duration: isThinking ? 0.8 : 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`relative z-10 flex items-center justify-center rounded-full bg-gradient-to-br ${getStatusColor()} shadow-[0_0_50px_rgba(6,182,212,0.6)] border border-cyan-200/40 cursor-pointer overflow-hidden ${dimensionMap[size]}`}
      >
        {/* Shiny Highlight Layer */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/30 rounded-full" />

        {/* Dynamic Sound Pulse Waves when Speaking/Listening */}
        {(isSpeaking || isListening) && (
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  height: ["12px", `${Math.random() * 32 + 16}px`, "12px"],
                }}
                transition={{
                  duration: 0.4,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: i * 0.1,
                }}
                className="w-1.5 bg-white rounded-full shadow-sm"
              />
            ))}
          </div>
        )}

        {!isSpeaking && !isListening && (
          <span className="text-white font-mono font-bold tracking-widest text-xs drop-shadow-md">
            JARVIS
          </span>
        )}
      </motion.div>

      {/* Label indicator */}
      <div className="mt-3 flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            isListening ? "bg-red-500 animate-ping" : isThinking ? "bg-amber-400 animate-pulse" : "bg-cyan-400"
          }`}
        />
        <span className="text-[11px] font-mono tracking-wider text-cyan-300 uppercase font-semibold">
          {getStatusLabel()}
        </span>
      </div>
    </div>
  );
};
