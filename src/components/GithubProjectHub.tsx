import React, { useState } from 'react';
import { GITHUB_REPO_FILES } from '../data/defaultData';
import {
  FolderGit2,
  FileCode,
  FileText,
  Copy,
  Check,
  Download,
  Terminal,
  ExternalLink,
  Github,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import JSZip from 'jszip';

export const GithubProjectHub: React.FC = () => {
  const [selectedFileName, setSelectedFileName] = useState<string>('index.html');
  const [copiedFile, setCopiedFile] = useState(false);
  const [copiedGitCmd, setCopiedGitCmd] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipSuccess, setZipSuccess] = useState(false);

  const fileList = Object.keys(GITHUB_REPO_FILES);
  const currentFileContent = GITHUB_REPO_FILES[selectedFileName as keyof typeof GITHUB_REPO_FILES] || '';

  const gitCommands = `# 1. Create project folder & enter it
mkdir f-docx
cd f-docx

# 2. Extract or copy the f-docx files into this folder

# 3. Initialize Git repository
git init

# 4. Stage all files
git add .

# 5. Commit
git commit -m "feat: complete f-docx Google Sheets form integration suite"

# 6. Set default branch to main
git branch -M main

# 7. Add GitHub remote repository (replace with your GitHub username)
git remote add origin https://github.com/your-username/f-docx.git

# 8. Push to GitHub!
git push -u origin main`;

  const handleCopyFile = () => {
    navigator.clipboard.writeText(currentFileContent);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const handleCopyGitCmd = () => {
    navigator.clipboard.writeText(gitCommands);
    setCopiedGitCmd(true);
    setTimeout(() => setCopiedGitCmd(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();
      
      const folder = zip.folder('f-docx') || zip;
      fileList.forEach((filename) => {
        folder.file(filename, GITHUB_REPO_FILES[filename as keyof typeof GITHUB_REPO_FILES]);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'f-docx.zip';
      link.click();
      URL.revokeObjectURL(url);

      setZipSuccess(true);
      setTimeout(() => setZipSuccess(false), 4000);
    } catch (err) {
      console.error('Error creating ZIP:', err);
      alert('Could not generate ZIP archive.');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-2">
              <Github className="w-3.5 h-3.5 text-emerald-400" />
              Demo Project • Repository "f-docx"
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              f-docx Complete GitHub Project Bundle
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
              Standalone, dependency-free HTML, CSS, JavaScript & Google Apps Script project ready to download or push directly to GitHub.
            </p>
          </div>

          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-lg transition-all cursor-pointer self-start md:self-auto shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{isZipping ? 'Bundling ZIP...' : 'Download f-docx.zip'}</span>
          </button>
        </div>

        {zipSuccess && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>f-docx.zip downloaded! Extract the archive and push to your GitHub repo.</span>
          </div>
        )}
      </div>

      {/* Git push CLI Instructions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Push Demo Project to GitHub ("f-docx")
            </h3>
          </div>
          <button
            onClick={handleCopyGitCmd}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            {copiedGitCmd ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied Commands!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Terminal Commands</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-3">
          First create a new empty repository named <strong className="text-slate-800">f-docx</strong> on GitHub (e.g. at <a href="https://github.com/new" target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">github.com/new</a>), then run:
        </p>

        <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-emerald-400 border border-slate-800 overflow-x-auto">
          <pre>{gitCommands}</pre>
        </div>
      </div>

      {/* File Explorer & Code Preview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm flex flex-col md:flex-row min-h-[500px]">
        {/* Left Sidebar: File Tree */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200/80 p-4 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">
            <FolderGit2 className="w-4 h-4 text-emerald-600" />
            <span>Repository Files</span>
          </div>

          <div className="space-y-1">
            {fileList.map((filename) => {
              const isSelected = selectedFileName === filename;
              return (
                <button
                  key={filename}
                  onClick={() => setSelectedFileName(filename)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300/50'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {filename.endsWith('.html') || filename.endsWith('.css') || filename.endsWith('.js') || filename.endsWith('.gs') ? (
                      <FileCode className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                    ) : (
                      <FileText className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                    )}
                    <span className="truncate">{filename}</span>
                  </div>
                  {filename === 'index.html' && (
                    <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1 rounded font-sans">
                      UI
                    </span>
                  )}
                  {filename === 'Code.gs' && (
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-1 rounded font-sans">
                      Apps Script
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 p-3 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-500 space-y-1.5">
            <span className="font-semibold text-slate-700 block">Project Specs:</span>
            <div>• Pure Vanilla HTML5 & CSS3</div>
            <div>• Vanilla JS (No build step required)</div>
            <div>• Netlify / Vercel drag-and-drop ready</div>
            <div>• Full Google Apps Script API backend</div>
          </div>
        </div>

        {/* Right Code Area */}
        <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
          {/* Code Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>f-docx / {selectedFileName}</span>
            </div>

            <button
              onClick={handleCopyFile}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
            >
              {copiedFile ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy File Content</span>
                </>
              )}
            </button>
          </div>

          {/* Code Viewer */}
          <div className="flex-1 p-4 overflow-auto max-h-[520px]">
            <pre className="font-mono text-xs text-slate-300 leading-relaxed">
              <code>{currentFileContent}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
