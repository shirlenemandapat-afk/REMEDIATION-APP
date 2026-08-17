import React from 'react';
import { AlertTriangle, Trash2, Archive, RotateCcw, X, ShieldAlert, CheckCircle } from 'lucide-react';

export type ConfirmActionType =
  | 'delete_student'
  | 'archive_student'
  | 'unarchive_student'
  | 'delete_session'
  | 'archive_section'
  | 'unarchive_section'
  | 'delete_section'
  | 'reset_data';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onAlternativeAction?: () => void;
  alternativeActionLabel?: string;
  type: ConfirmActionType;
  title: string;
  message: string;
  itemName?: string;
  itemDetails?: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary' | 'success';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onAlternativeAction,
  alternativeActionLabel,
  type,
  title,
  message,
  itemName,
  itemDetails,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
}) => {
  if (!isOpen) return null;

  const isDelete = type.startsWith('delete');
  const isArchive = type.startsWith('archive');
  const isRestore = type.startsWith('unarchive');

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        
        {/* Header with appropriate color theme */}
        <div
          className={`p-4 text-white flex items-center justify-between ${
            confirmVariant === 'danger'
              ? 'bg-rose-700'
              : confirmVariant === 'warning'
              ? 'bg-amber-600'
              : confirmVariant === 'success'
              ? 'bg-emerald-700'
              : 'bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {isDelete ? (
              <Trash2 className="w-5 h-5 text-white" />
            ) : isArchive ? (
              <Archive className="w-5 h-5 text-amber-200" />
            ) : isRestore ? (
              <RotateCcw className="w-5 h-5 text-emerald-200" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-300" />
            )}
            <h3 className="font-extrabold text-base tracking-tight">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-slate-700">
          <p className="text-sm leading-relaxed">{message}</p>

          {itemName && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Target Record:
              </span>
              <strong className="text-sm text-slate-900 block font-black">{itemName}</strong>
              {itemDetails && <span className="text-xs text-slate-600 block">{itemDetails}</span>}
            </div>
          )}

          {isDelete && (
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 font-medium">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> This action cannot be undone. All associated progress logs, scores, and evaluation records will be permanently removed.
              </span>
            </div>
          )}

          {isArchive && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900 font-medium">
              <Archive className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Archiving removes the record from the active roster while safely preserving all session history, mastery scores, and parent logs in the <strong>Archived Records</strong> section.
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-2">
          {onAlternativeAction && alternativeActionLabel && (
            <button
              type="button"
              onClick={() => {
                onAlternativeAction();
                onClose();
              }}
              className="w-full sm:w-auto px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold rounded-xl text-xs transition border border-amber-300 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Archive className="w-3.5 h-3.5 text-amber-800" />
              {alternativeActionLabel}
            </button>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-5 py-2 text-white font-extrabold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                confirmVariant === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : confirmVariant === 'warning'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : confirmVariant === 'success'
                  ? 'bg-emerald-700 hover:bg-emerald-600'
                  : 'bg-slate-800 hover:bg-slate-700'
              }`}
            >
              {isDelete && <Trash2 className="w-3.5 h-3.5" />}
              {isArchive && <Archive className="w-3.5 h-3.5" />}
              {isRestore && <RotateCcw className="w-3.5 h-3.5" />}
              {confirmLabel}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
