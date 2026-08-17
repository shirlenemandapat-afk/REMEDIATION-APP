import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  Layers,
  Key,
  Globe,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  supabaseService,
  SUPABASE_SQL_SCHEMA,
  isSupabaseConfigured,
} from '../services/supabase';
import { TeacherProfile, Student, SessionRecord } from '../types';

interface SupabaseDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: TeacherProfile;
  students: Student[];
  sessions: SessionRecord[];
  onSyncComplete: () => void;
}

export const SupabaseDatabaseModal: React.FC<SupabaseDatabaseModalProps> = ({
  isOpen,
  onClose,
  teacher,
  students,
  sessions,
  onSyncComplete,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [activeTab, setActiveTab] = useState<'connect' | 'sql' | 'sync'>('connect');

  useEffect(() => {
    if (isOpen) {
      const cfg = getSupabaseConfig();
      setUrl(cfg.url);
      setAnonKey(cfg.anonKey);
      setAutoSync(cfg.autoSync);
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setStatusMessage({ text: 'Please enter both your Supabase Project URL and Anon API Key.', type: 'error' });
      return;
    }
    setTesting(true);
    setStatusMessage(null);
    const res = await supabaseService.testConnection(url.trim(), anonKey.trim());
    setTesting(false);
    setStatusMessage({
      text: res.message,
      type: res.success ? 'success' : 'error',
    });
  };

  const handleSaveConfig = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setStatusMessage({ text: 'Please provide both the Project URL and Anon Key to connect.', type: 'error' });
      return;
    }

    saveSupabaseConfig({
      url: url.trim(),
      anonKey: anonKey.trim(),
      autoSync,
    });

    setStatusMessage({
      text: 'Supabase configuration saved! You can now sync your data to the cloud.',
      type: 'success',
    });
  };

  const handleDisconnect = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setStatusMessage({ text: 'Supabase disconnected. Using local browser storage.', type: 'info' });
  };

  const handlePushToCloud = async () => {
    setSyncing(true);
    setStatusMessage(null);
    const success = await supabaseService.pushAll(teacher, students, sessions);
    setSyncing(false);
    if (success) {
      setStatusMessage({
        text: `Successfully synced ${students.length} students, ${sessions.length} session logs, and Teacher Profile to Supabase!`,
        type: 'success',
      });
      onSyncComplete();
    } else {
      setStatusMessage({
        text: 'Failed to push data to Supabase. Please ensure you have run the SQL setup script in your Supabase SQL Editor.',
        type: 'error',
      });
    }
  };

  const handlePullFromCloud = async () => {
    setSyncing(true);
    setStatusMessage(null);
    const cloudData = await supabaseService.fetchAll();
    setSyncing(false);
    if (cloudData) {
      // Save pulled data to local storage as well for seamless offline support
      localStorage.setItem('remediation_app_students', JSON.stringify(cloudData.students));
      localStorage.setItem('remediation_app_sessions', JSON.stringify(cloudData.sessions));
      if (cloudData.teacher) {
        localStorage.setItem('remediation_app_teacher', JSON.stringify(cloudData.teacher));
      }
      setStatusMessage({
        text: `Loaded ${cloudData.students.length} students and ${cloudData.sessions.length} sessions from your Supabase cloud database!`,
        type: 'success',
      });
      onSyncComplete();
    } else {
      setStatusMessage({
        text: 'Could not fetch records from Supabase. Make sure tables are created.',
        type: 'error',
      });
    }
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  const isConnected = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-950 px-6 py-5 text-white flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">Supabase Cloud Database</h2>
                {isConnected ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 border border-emerald-400 text-emerald-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    CONNECTED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-400/40 text-amber-300">
                    LOCAL STORAGE
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Ramon Magsaysay (Cubao) High School &bull; Project S.M.I.L.E. Cloud Storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300/70 hover:text-white p-2 rounded-xl hover:bg-emerald-800/60 transition cursor-pointer text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('connect')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'connect'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Key className="w-4 h-4 text-emerald-600" />
            1. Connection Setup
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'sql'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            2. SQL Table Schema
          </button>

          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'sync'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            3. Sync & Cloud Backup
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs">
          {/* Status Message Alert */}
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in duration-150 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-bold text-xs">{statusMessage.text}</p>
              </div>
            </div>
          )}

          {/* TAB 1: CONNECT */}
          {activeTab === 'connect' && (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-950">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Secure Supabase PostgreSQL Database Integration</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Connect your personal or RMCHS school Supabase project. All student profiles, remedial records, competency mastery scores, and MOV attachments will be automatically stored in the cloud.
                </p>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-800 hover:text-emerald-950 underline underline-offset-2 mt-1"
                >
                  Open Supabase Dashboard <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://xyzcompany.supabase.co"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Found in Supabase Project Settings &rarr; API &rarr; Project URL
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-500" />
                    Supabase Anon Public API Key (anon public)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Found in Supabase Project Settings &rarr; API &rarr; Project API keys &rarr; anon public
                  </span>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    disabled={testing}
                    onClick={handleTestConnection}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    {testing ? 'Testing...' : 'Test Connection'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-2 shadow-md shadow-emerald-950/20 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-yellow-300" />
                    Save & Activate Supabase
                  </button>

                  {isConnected && (
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="px-3.5 py-2.5 text-rose-700 hover:bg-rose-50 rounded-xl font-bold transition ml-auto cursor-pointer"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SQL SCHEMA */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-amber-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-700" />
                  <span>One-Click SQL Setup for Supabase</span>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Copy the SQL query below, navigate to your <strong>Supabase Dashboard &rarr; SQL Editor &rarr; New Query</strong>, paste and click <strong>Run</strong>. This will create the required tables (<code className="font-mono bg-amber-100 px-1 rounded">students</code>, <code className="font-mono bg-amber-100 px-1 rounded">session_records</code>, <code className="font-mono bg-amber-100 px-1 rounded">teacher_profiles</code>) and policies.
                </p>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-72 border border-slate-800 leading-relaxed select-all">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
                <button
                  onClick={handleCopySchema}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  {copiedSchema ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSchema ? 'Copied!' : 'Copy SQL Schema'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SYNC */}
          {activeTab === 'sync' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
                      <UploadCloud className="w-4 h-4 text-emerald-600" />
                      <span>Push Local Data to Supabase</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mb-3">
                      Upload all {students.length} student profiles and {sessions.length} daily session logs from your current browser storage into the Supabase cloud database.
                    </p>
                  </div>
                  <button
                    disabled={syncing || !isConnected}
                    onClick={handlePushToCloud}
                    className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md"
                  >
                    <UploadCloud className="w-4 h-4 text-yellow-300" />
                    {syncing ? 'Syncing...' : 'Upload Data to Cloud'}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
                      <DownloadCloud className="w-4 h-4 text-blue-600" />
                      <span>Pull Data from Supabase</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mb-3">
                      Fetch the latest records stored in your Supabase cloud tables to update this browser workspace.
                    </p>
                  </div>
                  <button
                    disabled={syncing || !isConnected}
                    onClick={handlePullFromCloud}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md"
                  >
                    <DownloadCloud className="w-4 h-4 text-emerald-300" />
                    {syncing ? 'Fetching...' : 'Fetch from Cloud'}
                  </button>
                </div>
              </div>

              {!isConnected && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-center font-bold text-xs">
                  Please connect your Supabase credentials in Tab 1 first before syncing.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Project S.M.I.L.E. Supabase Database Hub</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
