import React, { useState } from 'react';
import { SystemAnnouncement, TeacherProfile } from '../../types';
import { storage } from '../../services/storage';
import {
  Bell,
  PlusCircle,
  Pin,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Users,
  X,
  Search,
  Sparkles,
} from 'lucide-react';

interface AdminAnnouncementManagementProps {
  currentAdmin: TeacherProfile;
  announcements: SystemAnnouncement[];
  onRefresh: () => void;
}

export const AdminAnnouncementManagement: React.FC<AdminAnnouncementManagementProps> = ({
  currentAdmin,
  announcements,
  onRefresh,
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [targetAudience, setTargetAudience] = useState<'all' | 'teachers' | 'students'>('all');
  const [isPinned, setIsPinned] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredAnnouncements = announcements.filter((a) => {
    return (
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      setFeedback({ type: 'error', message: 'Please provide both title and announcement content.' });
      return;
    }

    storage.createAnnouncement(currentAdmin.email, {
      title: title.trim(),
      content: content.trim(),
      priority,
      targetAudience,
      isPinned,
      expiresAt: expiresAt || undefined,
      authorName: currentAdmin.name,
      authorRole: currentAdmin.title,
      status: 'Published',
      publishDate: new Date().toISOString().split('T')[0],
    });

    setFeedback({ type: 'success', message: 'Announcement broadcasted successfully!' });
    onRefresh();
    setTimeout(() => {
      setIsCreateOpen(false);
      setTitle('');
      setContent('');
      setIsPinned(false);
      setExpiresAt('');
      setFeedback(null);
    }, 1200);
  };

  const handleTogglePin = (a: SystemAnnouncement) => {
    storage.updateAnnouncement(currentAdmin.email, a.id, {
      isPinned: !a.isPinned,
    });
    onRefresh();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this announcement broadcast?')) {
      storage.deleteAnnouncement(currentAdmin.email, id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-600" />
            Announcement & Notification Broadcast Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Post system-wide notices, remediation program guidelines, submission deadlines, and schedules to teachers and learners.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-2 shadow-sm cursor-pointer active:scale-95 shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-white" />
          POST NEW ANNOUNCEMENT
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search announcements by title or keyword..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {filteredAnnouncements.map((a) => {
          const priorityBadge =
            a.priority === 'urgent'
              ? 'bg-rose-100 text-rose-900 border-rose-300'
              : a.priority === 'high'
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : a.priority === 'normal'
              ? 'bg-blue-100 text-blue-900 border-blue-300'
              : 'bg-slate-100 text-slate-700 border-slate-300';

          const audienceLabel =
            a.targetAudience === 'all'
              ? 'All Faculty & Students'
              : a.targetAudience === 'teachers'
              ? 'Teachers Only'
              : 'Students Only';

          return (
            <div
              key={a.id}
              className={`bg-white rounded-2xl p-5 border shadow-sm transition space-y-3 ${
                a.isPinned ? 'border-amber-400/80 bg-amber-50/20' : 'border-slate-200/90'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {a.isPinned && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Pin className="w-3 h-3 fill-amber-900" /> PINNED NOTICE
                    </span>
                  )}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${priorityBadge}`}>
                    {a.priority} Priority
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                    Audience: {audienceLabel}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleTogglePin(a)}
                    title={a.isPinned ? 'Unpin Announcement' : 'Pin to Top'}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      a.isPinned
                        ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                  >
                    <Pin className={`w-4 h-4 ${a.isPinned ? 'fill-amber-900' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(a.id)}
                    title="Delete Announcement"
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-slate-900">{a.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-line">{a.content}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
                <span>
                  Posted by: <strong className="text-slate-700">{a.authorName}</strong> ({a.authorRole})
                </span>
                <span>
                  {new Date(a.createdAt).toLocaleDateString()} {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {filteredAnnouncements.length === 0 && (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            No announcements found. Click "Post New Announcement" to notify faculty and students.
          </div>
        )}
      </div>

      {/* --- CREATE ANNOUNCEMENT MODAL --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-600" />
                Broadcast System Announcement
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Announcement Subject / Headline *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q1 Remediation Assessment & MOV Submission Deadline"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent / Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="all">All Faculty & Students</option>
                    <option value="teachers">Teachers Only</option>
                    <option value="students">Students Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notice Content & Instructions *</label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter details, instructions, room assignments, or submission reminders..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <label
                  onClick={() => setIsPinned(!isPinned)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold cursor-pointer transition ${
                    isPinned ? 'bg-amber-100 text-amber-950 border-amber-300' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={() => {}}
                    className="rounded text-amber-600 focus:ring-amber-500 pointer-events-none"
                  />
                  <span>Pin to Dashboard Banner</span>
                </label>
              </div>

              {feedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl transition shadow-md cursor-pointer"
                >
                  Post Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
