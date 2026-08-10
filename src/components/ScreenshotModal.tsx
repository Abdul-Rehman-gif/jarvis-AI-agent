import React, { useState } from "react";
import { X, Download, Copy, Check, FileText, Camera, ExternalLink, Image } from "lucide-react";

interface ScreenshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  timestamp?: string;
  /** True when this image came from the paired desktop agent's real screen
   *  capture. False when it's a local fallback preview of the web dashboard
   *  itself (no agent connected). */
  isLive?: boolean;
}

export const ScreenshotModal: React.FC<ScreenshotModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  timestamp,
  isLive = true,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `Jarvis_Screenshot_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {
      // Fallback text copy
      await navigator.clipboard.writeText(imageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Camera className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2 font-mono">
                {isLive ? "SCREENSHOT CAPTURED" : "DASHBOARD PREVIEW"}
                <span
                  className={`text-[10px] px-2 py-0.5 rounded border font-semibold uppercase ${
                    isLive
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  }`}
                >
                  {isLive ? "Real Desktop Capture" : "No Agent Connected"}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {timestamp || new Date().toLocaleString()} &bull; {isLive ? "Windows Display Output" : "Local web preview, not your desktop"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Captured Image Viewer */}
        <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-slate-950/50 min-h-[300px]">
          <div className="relative group max-w-full max-h-full rounded-xl overflow-hidden border border-white/10 shadow-2xl">
            <img
              src={imageUrl}
              alt="Captured Desktop Screenshot"
              className="max-h-[60vh] object-contain rounded-xl"
            />
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-300 pointer-events-none">
              PNG &bull; Full Resolution
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Image className="w-4 h-4 text-indigo-400" />
            <span>Saved to local cache &amp; File Explorer</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              {copied ? "Copied!" : "Copy Image"}
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
