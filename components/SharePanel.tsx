import React, { useState, useRef } from 'react';
import {
  Share2,
  Download,
  Upload,
  Copy,
  Check,
  Link,
  Save,
  FolderOpen,
  X,
} from 'lucide-react';
import { TreeExportData, importTreeFromFile } from '../data/treeExport';

interface SharePanelProps {
  onCopyShareURL: () => Promise<boolean>;
  onDownloadJSON: () => void;
  onImportFromCode: (code: string) => Promise<boolean>;
  onImportFromData: (data: TreeExportData) => Promise<void>;
  onSaveToStorage: () => Promise<string>;
  getShareURL: () => string;
  ornamentCount: number;
}

export const SharePanel: React.FC<SharePanelProps> = ({
  onCopyShareURL,
  onDownloadJSON,
  onImportFromCode,
  onImportFromData,
  onSaveToStorage,
  getShareURL,
  ornamentCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyURL = async () => {
    const success = await onCopyShareURL();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async () => {
    await onSaveToStorage();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleImportCode = async () => {
    setImportError('');
    const success = await onImportFromCode(importCode);
    if (success) {
      setShowImport(false);
      setImportCode('');
    } else {
      setImportError('Invalid share code');
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = await importTreeFromFile(file);
    if (data) {
      await onImportFromData(data);
      setShowImport(false);
    } else {
      setImportError('Invalid file format');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 bg-black/70 backdrop-blur-xl p-3 rounded-full border border-white/10 text-white hover:bg-black/80 transition-all shadow-lg"
        title="Share & Save"
      >
        <Share2 size={20} />
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-4 w-72">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Share2 size={18} />
          Share & Save
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Stats */}
      <div className="text-xs text-gray-400 mb-4">
        {ornamentCount} ornament{ornamentCount !== 1 ? 's' : ''} on tree
      </div>

      {/* Share Actions */}
      <div className="space-y-2">
        {/* Copy Share Link */}
        <button
          onClick={handleCopyURL}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
        >
          {copied ? (
            <Check size={18} className="text-green-400" />
          ) : (
            <Link size={18} className="text-blue-400" />
          )}
          <div>
            <div className="text-white text-sm font-medium">
              {copied ? 'Copied!' : 'Copy Share Link'}
            </div>
            <div className="text-gray-400 text-xs">Share your tree via URL</div>
          </div>
        </button>

        {/* Download JSON */}
        <button
          onClick={onDownloadJSON}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
        >
          <Download size={18} className="text-purple-400" />
          <div>
            <div className="text-white text-sm font-medium">Download File</div>
            <div className="text-gray-400 text-xs">Save as JSON file</div>
          </div>
        </button>

        {/* Save to Browser */}
        <button
          onClick={handleSave}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
        >
          {saved ? (
            <Check size={18} className="text-green-400" />
          ) : (
            <Save size={18} className="text-yellow-400" />
          )}
          <div>
            <div className="text-white text-sm font-medium">
              {saved ? 'Saved!' : 'Save to Browser'}
            </div>
            <div className="text-gray-400 text-xs">Store locally</div>
          </div>
        </button>

        {/* Divider */}
        <div className="border-t border-white/10 my-3" />

        {/* Import */}
        <button
          onClick={() => setShowImport(!showImport)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
        >
          <Upload size={18} className="text-green-400" />
          <div>
            <div className="text-white text-sm font-medium">Import Tree</div>
            <div className="text-gray-400 text-xs">Load from code or file</div>
          </div>
        </button>

        {/* Import Panel */}
        {showImport && (
          <div className="mt-2 p-3 rounded-lg bg-white/5 space-y-3">
            {/* Code Input */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Paste share code:
              </label>
              <textarea
                value={importCode}
                onChange={(e) => setImportCode(e.target.value)}
                placeholder="Paste share code here..."
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none h-20"
              />
              <button
                onClick={handleImportCode}
                disabled={!importCode.trim()}
                className="mt-2 w-full py-2 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Import from Code
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2">
              <div className="flex-1 border-t border-white/10" />
              <span className="text-xs text-gray-500">or</span>
              <div className="flex-1 border-t border-white/10" />
            </div>

            {/* File Input */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors text-sm"
              >
                <FolderOpen size={16} />
                Choose JSON File
              </button>
            </div>

            {/* Error */}
            {importError && (
              <div className="text-red-400 text-xs text-center">{importError}</div>
            )}
          </div>
        )}
      </div>

      {/* Share URL Preview */}
      <div className="mt-4 p-3 rounded-lg bg-white/5">
        <div className="text-xs text-gray-400 mb-1">Share URL:</div>
        <div className="text-xs text-gray-500 truncate font-mono">
          {getShareURL().substring(0, 50)}...
        </div>
      </div>
    </div>
  );
};
