import React, { useState } from 'react';
import { Student, TeacherProfile } from '../types';
import { SchoolLogo } from './SchoolLogo';
import { safePrintDocument, downloadPDFDocument } from '../utils/printHelper';
import {
  Printer,
  ArrowLeft,
  X,
  Mail,
  CheckCircle2,
  Download,
  Loader2,
  Calendar,
  Edit2,
  Check,
  AlertCircle,
} from 'lucide-react';

interface ParentCommunicationLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  teacher: TeacherProfile;
}

export const ParentCommunicationLetterModal: React.FC<ParentCommunicationLetterModalProps> = ({
  isOpen,
  onClose,
  student,
  teacher,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Customizable Letter Date state (defaults to today's date in YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [letterDateRaw, setLetterDateRaw] = useState<string>(todayStr);
  const [isEditingDate, setIsEditingDate] = useState<boolean>(false);

  if (!isOpen || !student) return null;

  // Format letter date for official DepEd presentation
  const formattedDate = (() => {
    try {
      const parts = letterDateRaw.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }
      return new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
  })();

  const parentDisplayName = student.parentName || 'Parent / Guardian';
  const isRemediation = student.programType === 'Remediation';
  const docFilename = `Parent_Notice_${student.lastName}_${student.firstName}_${student.programType}`;

  const showFeedback = (text: string, type: 'success' | 'error') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 5000);
  };

  const handlePrint = () => {
    try {
      safePrintDocument('printable-letter-container', docFilename);
    } catch (e: any) {
      showFeedback('Print dialog failed to open. You can use Download PDF instead.', 'error');
    }
  };

  const handleDownloadPDF = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setFeedbackMessage(null);

    try {
      const success = await downloadPDFDocument('printable-letter-container', docFilename, {
        format: 'a4',
        orientation: 'portrait',
      });

      if (success) {
        showFeedback('Letter PDF generated and downloaded to your Downloads folder!', 'success');
      } else {
        showFeedback('PDF generation was cancelled or encountered an issue. You can click "Print Letter" and choose "Save as PDF".', 'error');
      }
    } catch (err: any) {
      console.error('PDF generation error:', err);
      showFeedback('Could not generate PDF. Please try "Print Letter" -> "Save as PDF".', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 overflow-y-auto p-2 sm:p-4 md:p-6 flex justify-center items-start print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 my-2 sm:my-4 flex flex-col print:shadow-none print:border-none print:my-0 print:max-w-none">
        
        {/* Sticky Action Header Bar (Hidden in Print) */}
        <div className="sticky top-0 z-30 bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-950 p-3.5 sm:p-4 text-white flex items-center justify-between rounded-t-2xl border-b-2 border-amber-400 gap-2 sm:gap-3 shadow-md print:hidden">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={onClose}
              className="px-2.5 sm:px-3 py-1.5 bg-white/10 hover:bg-white/20 text-emerald-100 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/20 shadow-xs cursor-pointer shrink-0"
              title="Back to Students / Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="w-5 h-5 text-amber-300 shrink-0 hidden md:block" />
              <div className="truncate">
                <h3 className="font-extrabold text-xs sm:text-sm md:text-base leading-tight truncate">
                  Parent / Guardian Letter
                </h3>
                <p className="text-[11px] text-emerald-200 truncate">
                  {student.firstName} {student.lastName} &bull; {student.gradeLevel}-{student.section}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-3 sm:px-3.5 py-1.5 sm:py-2 bg-emerald-700 hover:bg-emerald-600 text-yellow-300 font-extrabold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md border border-emerald-500 cursor-pointer disabled:opacity-50"
              title="Save PDF file directly to your download folder"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-yellow-300" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-yellow-300" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="px-3 sm:px-3.5 py-1.5 sm:py-2 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-extrabold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md hover:shadow-lg border border-amber-300 cursor-pointer active:scale-95"
              title="Print official letter or save as PDF via browser dialog"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print Letter</span>
            </button>

            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer ml-1"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedbackMessage && (
          <div
            className={`p-3 text-xs font-bold flex items-center gap-2 border-b print:hidden animate-in fade-in duration-150 ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="flex-1">{feedbackMessage.text}</span>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Date Config Bar (Hidden in Print) */}
        <div className="bg-amber-50/80 px-6 py-2.5 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs print:hidden">
          <div className="flex items-center gap-2 text-amber-950 font-semibold">
            <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Official Letter Date:</span>
            <strong className="text-emerald-950 font-bold bg-white px-2.5 py-0.5 rounded-md border border-amber-300 shadow-2xs">
              {formattedDate}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            {isEditingDate ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={letterDateRaw}
                  onChange={(e) => setLetterDateRaw(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                <button
                  onClick={() => setIsEditingDate(false)}
                  className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Done</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingDate(true)}
                className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Change the date displayed on the letter"
              >
                <Edit2 className="w-3 h-3 text-amber-700" />
                <span>Change Date</span>
              </button>
            )}
          </div>
        </div>

        {/* PRINTABLE LETTER PAPER BODY */}
        <div id="printable-letter-container" className="p-6 sm:p-10 md:p-12 text-slate-900 space-y-6 print:p-0 print:text-black bg-white">
          
          {/* Official DepEd & RMCHS Letterhead */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-emerald-900">
            <SchoolLogo size="md" showShadow={false} />
            <div className="text-center space-y-0.5 flex-1 px-4">
              <p className="text-[11px] font-serif uppercase tracking-widest text-slate-600">
                Republic of the Philippines &bull; Department of Education
              </p>
              <p className="text-xs font-bold uppercase tracking-wider font-serif text-emerald-950">
                {teacher.region} &bull; {teacher.division}
              </p>
              <p className="text-base font-extrabold text-emerald-900 uppercase tracking-wide font-serif">
                RAMON MAGSAYSAY (CUBAO) HIGH SCHOOL
              </p>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                Technology and Livelihood Education (TLE) Department
              </p>
              <p className="text-[10px] text-slate-500">
                Project S.M.I.L.E. (Student Monitoring and Intervention for Learning Enhancement)
              </p>
            </div>
            <div className="w-12 h-12 rounded-full border border-emerald-800 flex items-center justify-center p-1 bg-emerald-50 shrink-0">
              <span className="text-[9px] font-extrabold text-emerald-900 text-center leading-tight">
                PROJECT<br />S.M.I.L.E.
              </span>
            </div>
          </div>

          {/* Letter Date & Addressee */}
          <div className="space-y-3 pt-2 text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <p className="font-extrabold text-slate-900 text-sm tracking-wide">
                {formattedDate}
              </p>
              <span className="text-[10px] font-bold text-emerald-900 uppercase bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded print:hidden">
                Official Notice
              </span>
            </div>

            <div className="space-y-0.5">
              <p className="font-bold text-slate-900">TO THE PARENT / GUARDIAN OF:</p>
              <p className="text-base font-black text-emerald-950 font-serif">
                {student.lastName}, {student.firstName} {student.middleInitial}
              </p>
              <p className="text-xs text-slate-600 font-medium">
                Grade & Section: <strong className="text-slate-800">{student.gradeLevel} - {student.section}</strong> &bull; Subject: <strong className="text-emerald-900">{student.subject}</strong>
              </p>
              {student.parentName && (
                <p className="text-xs text-slate-600">
                  Addressee: <strong className="text-slate-800">{student.parentName}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Salutation */}
          <p className="text-xs sm:text-sm font-semibold text-slate-900">
            Dear {parentDisplayName},
          </p>

          {/* Letter Content */}
          <div className="text-xs sm:text-sm leading-relaxed text-justify space-y-3.5 text-slate-800">
            <p>
              Warm greetings from the Technology and Livelihood Education (TLE) Department of Ramon Magsaysay (Cubao) High School!
            </p>

            {isRemediation ? (
              <p>
                In our continuous dedication to ensuring the academic success and practical competency of our learners, your child, <strong>{student.firstName} {student.lastName}</strong>, has been officially enrolled in <strong>PROJECT S.M.I.L.E. (Student Monitoring and Intervention for Learning Enhancement) — Remediation Program</strong>.
              </p>
            ) : (
              <p>
                Recognizing the demonstrated aptitude and strong foundation of your child, <strong>{student.firstName} {student.lastName}</strong>, we are pleased to inform you that they have been selected to participate in <strong>PROJECT S.M.I.L.E. — Skills Enhancement Program</strong>.
              </p>
            )}

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2 text-xs text-slate-800">
              <p className="font-bold text-emerald-950 uppercase tracking-wide">
                📌 Program Details & Specifics:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                <li>
                  <strong>Program Classification:</strong>{' '}
                  <span className="font-bold text-emerald-900">{student.programType}</span>
                </li>
                <li>
                  <strong>Learning Area / TLE Strand:</strong> {student.subject}
                </li>
                <li>
                  <strong>Target Learning Competency:</strong> {student.focusTopic}
                </li>
                <li>
                  <strong>Session Schedule & Location:</strong>{' '}
                  <span className="font-semibold text-emerald-950">
                    {student.scheduleDetails || 'Regular Scheduled Remedial Period, TLE Laboratory / Classroom'}
                  </span>
                </li>
                <li>
                  <strong>Advising Teacher / Facilitator:</strong> {teacher.name} ({teacher.title})
                </li>
              </ul>
            </div>

            {isRemediation ? (
              <p>
                This targeted program provides personalized, scaffolded reteaching, hands-on practice, and contextualized Learning Activity Sheets (LAS) designed to address specific learning gaps and ensure your child reaches full mastery.
              </p>
            ) : (
              <p>
                This advanced enrichment track provides higher-order technical exercises, project-based tasks, and hands-on laboratory workshops to further enhance your child's technical expertise and leadership skills.
              </p>
            )}

            <p>
              We firmly believe that strong parent-teacher collaboration is key to maximizing our students' growth. We kindly request your encouragement and support in ensuring their prompt and active attendance in all scheduled sessions.
            </p>
          </div>

          {/* Signatures of Teacher & School Head */}
          <div className="pt-4 grid grid-cols-2 gap-8 text-xs">
            <div>
              <p className="text-slate-600 mb-8">Sincerely yours,</p>
              <p className="font-extrabold uppercase text-slate-900 underline decoration-slate-800 underline-offset-4">
                {teacher.name}
              </p>
              <p className="text-slate-600 font-medium">{teacher.title}</p>
              <p className="text-[11px] text-slate-500 italic">Project S.M.I.L.E. Facilitator / TLE Teacher</p>
            </div>

            <div>
              <p className="text-slate-600 mb-8">Noted by:</p>
              <p className="font-extrabold uppercase text-slate-900 underline decoration-slate-800 underline-offset-4">
                {teacher.headTeacherName || 'Dr. Corazon V. Santos'}
              </p>
              <p className="text-slate-600 font-medium">
                {teacher.headTeacherPosition || 'Head Teacher III / TLE Department'}
              </p>
              <p className="text-[11px] text-slate-500 italic">{teacher.schoolName || 'Ramon Magsaysay (Cubao) High School'}</p>
            </div>
          </div>

          {/* PARENT ACKNOWLEDGMENT SLIP (CUT-OUT SLIP) */}
          <div className="pt-6 border-t-2 border-dashed border-slate-400 space-y-3">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span>✂️ CUT ALONG DOTTED LINE AND RETURN TO SUBJECT TEACHER</span>
              <span>ACKNOWLEDGMENT & PARENT CONSENT SLIP</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 text-xs space-y-3">
              <p className="text-slate-800 leading-relaxed">
                I, <strong className="border-b border-slate-700 px-2 inline-block min-w-[180px]">{student.parentName || '________________________'}</strong>, parent / guardian of{' '}
                <strong>{student.firstName} {student.lastName}</strong> of Grade <strong>{student.gradeLevel} - {student.section}</strong>, hereby acknowledge receipt of this notification regarding my child's enrollment in <strong>Project S.M.I.L.E. ({student.programType})</strong>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="border-b border-slate-800 pt-6"></div>
                  <p className="text-[10px] text-center font-bold text-slate-700 mt-1 uppercase">
                    Parent / Guardian Signature over Printed Name
                  </p>
                </div>

                <div>
                  <div className="border-b border-slate-800 pt-6"></div>
                  <p className="text-[10px] text-center font-bold text-slate-700 mt-1 uppercase">
                    Date Signed & Contact Number
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer Bar (Hidden in Print) */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-slate-300 shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Ready for parent distribution:
            </span>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-yellow-300 font-extrabold rounded-xl text-xs transition flex items-center gap-2 shadow-md hover:shadow-lg border border-emerald-500 cursor-pointer disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-yellow-300" />
                  <span>Saving PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-yellow-300" />
                  <span>Download PDF Copy</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-extrabold rounded-xl text-xs transition flex items-center gap-2 shadow-md hover:shadow-lg border border-amber-300 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-950" />
              <span>Print Official Notice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
