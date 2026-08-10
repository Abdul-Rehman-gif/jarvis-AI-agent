import React, { useState } from "react";
import { useAgent } from "../context/AgentContext";
import {
  FolderTree,
  Folder,
  FileText,
  Plus,
  Trash2,
  Download,
  Search,
  ChevronRight,
  HardDrive,
  FileCode,
  Image as ImageIcon,
  FolderPlus,
  Eye,
} from "lucide-react";

export const FileExplorerView: React.FC = () => {
  const { files, deleteFileById, createNewFolder } = useAgent();
  const [search, setSearch] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      createNewFolder(newFolderName.trim());
      setNewFolderName("");
      setShowFolderModal(false);
    }
  };

  const getFileIcon = (type: string, extension?: string) => {
    if (type === "folder") return <Folder className="w-5 h-5 text-amber-400" />;
    if (extension === "png" || extension === "jpg") return <ImageIcon className="w-5 h-5 text-emerald-400" />;
    if (extension === "ps1" || extension === "json" || extension === "ts") return <FileCode className="w-5 h-5 text-cyan-400" />;
    return <FileText className="w-5 h-5 text-purple-400" />;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Path Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2 font-sans">
            <FolderTree className="w-5 h-5 text-cyan-400" />
            Windows Desktop File Explorer
          </h1>
          <p className="text-xs text-slate-400">
            Browse, manage, create folders, and preview documents on connected PC.
          </p>
        </div>

        <button
          onClick={() => setShowFolderModal(true)}
          className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all self-start sm:self-auto"
        >
          <FolderPlus className="w-4 h-4" /> New Folder
        </button>
      </div>

      {/* Path Breadcrumbs Bar */}
      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono backdrop-blur-xl">
        <div className="flex items-center gap-1 text-slate-300">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          <span>C:</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          <span>Users</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          <span>Admin</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-cyan-300 font-semibold">Projects</span>
        </div>

        <div className="relative w-48 sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-full h-8 pl-8 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Grid of Files */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredFiles.map((file) => (
          <div
            key={file.id}
            className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900 transition-all backdrop-blur-xl group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-cyan-500/30">
                  {getFileIcon(file.type, file.extension)}
                </div>
                <div>
                  <h3 className="text-xs font-bold font-mono text-slate-200 truncate max-w-[140px]">
                    {file.name}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {file.type === "folder" ? "Directory" : `${Math.round(file.size / 1024)} KB`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/60 text-[10px] font-mono text-slate-400">
              <span>{file.updatedAt}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedFile(file)}
                  className="p-1 hover:text-cyan-300 rounded"
                  title="Preview Details"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteFileById(file.id)}
                  className="p-1 hover:text-rose-400 rounded"
                  title="Delete File"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateFolder}
            className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-cyan-500/30 shadow-2xl space-y-4"
          >
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-cyan-400" />
              Create New Directory
            </h2>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder Name (e.g. React_App)"
              className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFolderModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400"
              >
                Create Folder
              </button>
            </div>
          </form>
        </div>
      )}

      {/* File Preview Drawer */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="font-bold text-cyan-300">{selectedFile.name}</span>
              <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2 text-slate-300">
              <p><span className="text-slate-500">Path:</span> {selectedFile.path}</p>
              <p><span className="text-slate-500">Type:</span> {selectedFile.type}</p>
              <p><span className="text-slate-500">Last Modified:</span> {selectedFile.updatedAt}</p>
              <p><span className="text-slate-500">Size:</span> {selectedFile.size} Bytes</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-[11px] overflow-x-auto">
              <code>// Jarvis Agent Sandbox Document Preview Ready</code>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedFile(null)}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
