import React from 'react';
import { X, Download, FileText, Image as ImageIcon } from 'lucide-react';

interface MOVViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataUrl: string;
  title: string;
}

export const MOVViewerModal: React.FC<MOVViewerModalProps> = ({
  isOpen,
  onClose,
  dataUrl,
  title,
}) => {
  if (!isOpen || !dataUrl) return null;

  const isPdf = dataUrl.startsWith('data:application/pdf') || title.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <ImageIcon className="w-5 h-5 text-blue-400 shrink-0" />
            <h3 className="font-bold text-sm truncate">{title || 'Means of Verification (MOV)'}</h3>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={dataUrl}
              download={title || 'MOV_Attachment.jpg'}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Content Body */}
        <div className="p-4 bg-slate-950 flex items-center justify-center overflow-auto flex-1 min-h-[300px]">
          {isPdf ? (
            <div className="text-center text-white space-y-3 p-8">
              <FileText className="w-16 h-16 text-blue-400 mx-auto" />
              <p className="text-sm font-semibold">{title}</p>
              <a
                href={dataUrl}
                download={title}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition"
              >
                <Download className="w-4 h-4" />
                Download PDF Document
              </a>
            </div>
          ) : (
            <img
              src={dataUrl}
              alt={title}
              className="max-h-[70vh] max-w-full object-contain rounded-lg border border-slate-800 shadow-2xl"
            />
          )}
        </div>
      </div>
    </div>
  );
};
