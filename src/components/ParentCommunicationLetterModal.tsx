import React, { useState } from 'react';
import { Student, TeacherProfile } from '../types';
import { safePrintDocument } from '../utils/printHelper';
import { downloadGuardianNoticePDF, generateGuardianNoticePDF } from '../utils/guardianNoticePdf';
import { BookingDatePicker, TeacherPositionSelect } from './BookingSchedulePicker';
import {
  Printer,
  ArrowLeft,
  X,
  FileText,
  CheckCircle2,
  Download,
  Loader2,
  Calendar,
  Edit2,
  Check,
  AlertCircle,
  MapPin,
  Clock,
  UserCheck,
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

  // Configuration States
  const todayStr = new Date().toISOString().split('T')[0];
  const [letterDateRaw, setLetterDateRaw] = useState<string>(todayStr);
  const [isEditingDetails, setIsEditingDetails] = useState<boolean>(false);
  const [isFilledTemplate, setIsFilledTemplate] = useState<boolean>(true);

  // Helper to decouple schedule and venue so venue is never printed redundantly
  const parseScheduleDetails = (raw?: string) => {
    if (!raw) {
      return {
        cleanSched: 'Every Tuesday & Thursday, 3:30 PM - 4:45 PM',
        ven: 'ICT Computer Lab 1 / TLE Building',
      };
    }
    const match = raw.match(/\((.*?)\)$/);
    const ven = match ? match[1].trim() : 'ICT Computer Lab 1 / TLE Building';
    const cleanSched = raw.replace(/\s*\(.*?\)$/, '').trim() || 'Every Tuesday & Thursday, 3:30 PM - 4:45 PM';
    return { cleanSched, ven };
  };

  const initialParsed = parseScheduleDetails(student?.scheduleDetails);
  const [venue, setVenue] = useState<string>(initialParsed.ven);
  const [schedule, setSchedule] = useState<string>(initialParsed.cleanSched);
  const [teacherInCharge, setTeacherInCharge] = useState<string>(teacher.name || 'Subject Teacher');
  const [departmentHead, setDepartmentHead] = useState<string>(
    teacher.headTeacherName || 'Dr. Corazon V. Santos'
  );

  React.useEffect(() => {
    if (student) {
      const parsed = parseScheduleDetails(student.scheduleDetails);
      setSchedule(parsed.cleanSched);
      setVenue(parsed.ven);
      setTeacherInCharge(teacher.name || 'Subject Teacher');
      setDepartmentHead(teacher.headTeacherName || 'Dr. Corazon V. Santos');
    }
  }, [student?.id, student?.scheduleDetails, teacher.name, teacher.headTeacherName]);

  if (!isOpen || !student) return null;

  // Format letter date
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

  const studentFullName = `${student.firstName} ${student.middleInitial ? student.middleInitial + ' ' : ''}${student.lastName}`.trim();
  const parentDisplayName = student.parentName || '';
  const docFilename = `Guardian_Notice_of_Remediation_${student.lastName}_${student.firstName}`;

  const showFeedback = (text: string, type: 'success' | 'error') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4500);
  };

  const handlePrint = () => {
    try {
      const ok = safePrintDocument('printable-guardian-notice', docFilename);
      if (ok) {
        showFeedback('Print preview launched! Select your printer or "Save as PDF".', 'success');
      } else {
        showFeedback('Print preview blocked by browser. Please use "Save PDF File".', 'error');
      }
    } catch (e: any) {
      showFeedback('Print preview failed. Use "Save PDF File" to download directly.', 'error');
    }
  };

  const handleDownloadPDF = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setFeedbackMessage(null);

    try {
      // Use direct vector PDF generation (100% reliable, zero rendering quirks, sharp text)
      const success = downloadGuardianNoticePDF(
        {
          student,
          teacher,
          dateStr: formattedDate,
          venue,
          schedule,
          startDate: student.enrolledDate || formattedDate,
          teacherInCharge,
          departmentHead,
          isFilledTemplate,
        },
        `${docFilename}.pdf`
      );

      if (success) {
        showFeedback('Guardian Notice PDF successfully generated and saved to your Downloads!', 'success');
      } else {
        showFeedback('Could not save PDF file directly. Please use "Print Document" -> "Save as PDF".', 'error');
      }
    } catch (err: any) {
      console.error('PDF download error:', err);
      showFeedback('PDF generation error. Please try "Print Document" -> "Save as PDF".', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 overflow-y-auto p-2 sm:p-4 md:p-6 flex justify-center items-start print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 my-2 sm:my-4 flex flex-col print:shadow-none print:border-none print:my-0 print:max-w-none">
        
        {/* Modal Header Bar (Hidden in Print) */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-950 p-4 text-white flex items-center justify-between rounded-t-2xl border-b-2 border-amber-400 gap-3 shadow-sm print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-emerald-100 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/20 shadow-xs cursor-pointer shrink-0"
              title="Back to Students / Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="w-5 h-5 text-amber-300 shrink-0" />
              <div className="truncate">
                <h3 className="font-extrabold text-sm sm:text-base leading-tight truncate">
                  Guardian&apos;s Notice of Remediation
                </h3>
                <p className="text-[11px] text-emerald-200 truncate">
                  DepEd TLE Official Notice &bull; {student.lastName}, {student.firstName} ({student.gradeLevel}-{student.section})
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
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

        {/* Controls Toolbar (Hidden in Print) */}
        <div className="bg-amber-50/90 px-4 sm:px-6 py-3 border-b border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-amber-950 font-semibold">
              <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Date:</span>
              <strong className="text-emerald-950 font-bold bg-white px-2.5 py-0.5 rounded-md border border-amber-300 shadow-2xs">
                {formattedDate}
              </strong>
            </div>

            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-amber-300">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFilledTemplate}
                  onChange={(e) => setIsFilledTemplate(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-600"
                />
                <span>Pre-fill Student Information</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingDetails(!isEditingDetails)}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                isEditingDetails
                  ? 'bg-emerald-800 text-white hover:bg-emerald-700'
                  : 'bg-white hover:bg-amber-100 text-amber-900 border border-amber-300'
              }`}
              title="Edit date, venue, schedule, or teachers"
            >
              {isEditingDetails ? <Check className="w-3.5 h-3.5" /> : <Edit2 className="w-3 h-3 text-amber-700" />}
              <span>{isEditingDetails ? 'Done Editing' : 'Customize Notice Details'}</span>
            </button>
          </div>
        </div>

        {/* Customization Drawer (Hidden in Print) */}
        {isEditingDetails && (
          <div className="bg-slate-50 p-4 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs print:hidden animate-in fade-in duration-150">
            <div>
              <label className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Letter Date:</span>
              </label>
              <input
                type="date"
                value={letterDateRaw}
                onChange={(e) => setLetterDateRaw(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Venue:</span>
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. ICT Computer Lab 1"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Schedule:</span>
              </label>
              <input
                type="text"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="e.g. Every Tuesday & Thursday, 3:30 PM - 4:45 PM"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Teacher-in-Charge / TLE Department Head:</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={teacherInCharge}
                  onChange={(e) => setTeacherInCharge(e.target.value)}
                  placeholder="Teacher Name"
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                />
                <input
                  type="text"
                  value={departmentHead}
                  onChange={(e) => setDepartmentHead(e.target.value)}
                  placeholder="Department Head"
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* PRINTABLE OFFICIAL NOTICE CONTAINER (MATCHES EXACT UPLOADED IMAGE) */}
        <div
          id="printable-guardian-notice"
          className="p-8 sm:p-12 md:p-14 text-black bg-white space-y-5 font-serif text-[13px] sm:text-[14px] leading-relaxed print:p-0 print:m-0"
        >
          {/* Header */}
          <div className="text-center space-y-0.5">
            <h1 className="font-bold text-base sm:text-lg text-black tracking-normal">
              {teacher.schoolName || 'Ramon Magsaysay (Cubao) High School'}
            </h1>
            <p className="text-xs sm:text-[13px] text-black">
              {teacher.division ? `Department of Education – ${teacher.division}` : 'Department of Education – Schools Division of Quezon City'}
            </p>
            <h2 className="font-bold text-sm sm:text-base text-black">
              {teacher.department || 'Technology and Livelihood Education Department'}
            </h2>
          </div>

          {/* Date & Addressee */}
          <div className="pt-4 space-y-3">
            <div>
              <p className="font-bold inline">Date: </p>
              {isFilledTemplate ? (
                <span className="underline font-normal inline-block min-w-[200px]">{formattedDate}</span>
              ) : (
                <span className="inline-block border-b border-black w-48">&nbsp;</span>
              )}
            </div>

            <div>
              <p className="font-bold inline">To: </p>
              <span className="font-normal">Mr./Ms. </span>
              {isFilledTemplate && parentDisplayName ? (
                <span className="underline font-normal inline-block min-w-[240px]">{parentDisplayName}</span>
              ) : (
                <span className="inline-block border-b border-black w-64">&nbsp;</span>
              )}
              <p className="text-[11px] sm:text-xs italic text-slate-700 mt-0.5">
                (Name of Parent/Guardian)
              </p>
            </div>

            <div className="pt-1">
              <p className="font-bold text-[14px] sm:text-[15px]">
                Subject: Participation in Remediation Program
              </p>
            </div>
          </div>

          {/* Salutation */}
          <div className="space-y-2 pt-1">
            <p>Dear Parent/Guardian,</p>
            <p>Warm greetings!</p>
          </div>

          {/* Body Paragraphs */}
          <div className="space-y-3.5 text-justify">
            {isFilledTemplate ? (
              <p>
                We would like to inform you that your child{' '}
                <strong className="underline font-bold">{studentFullName}</strong>, from{' '}
                <strong>Grade</strong> <span className="underline font-bold px-1">{student.gradeLevel.replace('Grade ', '')}</span>{' '}
                <strong>- Section</strong> <span className="underline font-bold px-1">{student.section}</span>, has been recommended to undergo a{' '}
                <strong>Remediation Program</strong> in{' '}
                <strong className="underline font-bold">{student.subject}</strong> based on his/her academic performance and assessment results for this quarter.
              </p>
            ) : (
              <p>
                We would like to inform you that your child{' '}
                <span className="inline-block border-b border-black w-64">&nbsp;</span>, from{' '}
                <strong>Grade</strong> <span className="inline-block border-b border-black w-16">&nbsp;</span>{' '}
                <strong>- Section</strong> <span className="inline-block border-b border-black w-48">&nbsp;</span>, has been recommended to undergo a{' '}
                <strong>Remediation Program</strong> in{' '}
                <span className="inline-block border-b border-black w-56">&nbsp;</span> based on his/her academic performance and assessment results for this quarter.
              </p>
            )}

            <p>
              The purpose of this program is to provide additional academic support to help your child strengthen their understanding of the subject and improve learning outcomes.
            </p>

            {/* Program Details Bullet List */}
            <div className="pt-1 space-y-1.5">
              <p className="font-bold">Program Details</p>
              <ul className="space-y-1 pl-4">
                <li className="flex items-start">
                  <span className="mr-2">&bull;</span>
                  <div className="flex-1">
                    <strong className="font-bold">Subject Area: </strong>
                    {isFilledTemplate ? (
                      <span className="underline">{student.subject}</span>
                    ) : (
                      <span className="inline-block border-b border-black w-72 sm:w-96">&nbsp;</span>
                    )}
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">&bull;</span>
                  <div className="flex-1">
                    <strong className="font-bold">Schedule: </strong>
                    {isFilledTemplate ? (
                      <span className="underline">{schedule}</span>
                    ) : (
                      <span className="inline-block border-b border-black w-72 sm:w-96">&nbsp;</span>
                    )}
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">&bull;</span>
                  <div className="flex-1">
                    <strong className="font-bold">Venue: </strong>
                    {isFilledTemplate ? (
                      <span className="underline">{venue}</span>
                    ) : (
                      <span className="inline-block border-b border-black w-72 sm:w-96">&nbsp;</span>
                    )}
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">&bull;</span>
                  <div className="flex-1">
                    <strong className="font-bold">Start Date: </strong>
                    {isFilledTemplate ? (
                      <span className="underline">{student.enrolledDate || formattedDate}</span>
                    ) : (
                      <span className="inline-block border-b border-black w-72 sm:w-96">&nbsp;</span>
                    )}
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">&bull;</span>
                  <div className="flex-1">
                    <strong className="font-bold">Teacher-in-Charge: </strong>
                    {isFilledTemplate ? (
                      <span className="underline">{teacherInCharge}</span>
                    ) : (
                      <span className="inline-block border-b border-black w-72 sm:w-96">&nbsp;</span>
                    )}
                  </div>
                </li>
              </ul>
            </div>

            <p>
              We are requesting your support and permission to allow your child to attend these sessions regularly. Please complete the reply slip below and return it to the teacher as soon as possible.
            </p>

            <p>
              Should you have any questions, feel free to reach out to us through the school or your child&apos;s subject teacher.
            </p>

            <p>Thank you very much for your continued support.</p>
          </div>

          {/* Signatures */}
          <div className="pt-4 space-y-6">
            <div>
              <p>Sincerely,</p>
              <div className="mt-8">
                {isFilledTemplate && teacherInCharge ? (
                  <p className="font-bold uppercase tracking-wide">{teacherInCharge}</p>
                ) : null}
                <div className="border-b border-black w-64 my-1"></div>
                <p className="font-bold">Subject Teacher</p>
              </div>
            </div>

            <div>
              <p className="font-bold">Noted by:</p>
              <div className="mt-8">
                {isFilledTemplate && departmentHead ? (
                  <p className="font-bold uppercase tracking-wide">{departmentHead}</p>
                ) : null}
                <div className="border-b border-black w-64 my-1"></div>
                <p className="font-bold">TLE Department Head</p>
              </div>
            </div>
          </div>

          {/* Dashed Separator Line */}
          <div className="pt-6 border-t-2 border-dashed border-black"></div>

          {/* REPLY SLIP */}
          <div className="space-y-3 pt-1">
            <div>
              <p className="font-bold text-[14px] sm:text-[15px] tracking-wide">REPLY SLIP</p>
              <p className="text-xs italic text-slate-700">(To be returned to the subject teacher)</p>
            </div>

            <p>I have received and read the letter regarding the remediation program for my child:</p>

            <div className="space-y-2 pt-1">
              <div>
                <strong className="font-bold">Name of Student: </strong>
                {isFilledTemplate ? (
                  <span className="underline font-bold inline-block min-w-[280px]">{studentFullName}</span>
                ) : (
                  <span className="inline-block border-b border-black w-72 sm:w-96">&nbsp;</span>
                )}
              </div>

              <div>
                <strong className="font-bold">Grade & Section: </strong>
                {isFilledTemplate ? (
                  <span className="underline font-bold inline-block min-w-[180px]">{student.gradeLevel} - {student.section}</span>
                ) : (
                  <span className="inline-block border-b border-black w-64">&nbsp;</span>
                )}
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-black text-black focus:ring-0"
                />
                <span>
                  <strong>I allow</strong> my child to attend and participate in the remediation program.
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-black text-black focus:ring-0"
                />
                <span>
                  <strong>I do not allow</strong> my child to attend the remediation program.
                </span>
              </label>
            </div>

            {/* Reason */}
            <div className="pt-1 space-y-2">
              <div>
                <strong className="font-bold">Reason (if not allowed): </strong>
                <span className="inline-block border-b border-black w-48 sm:w-80">&nbsp;</span>
              </div>
              <div className="border-b border-black w-full">&nbsp;</div>
            </div>

            {/* Parent Sign-off */}
            <div className="pt-3 space-y-2">
              <div>
                <strong className="font-bold">Name of Parent/Guardian: </strong>
                {isFilledTemplate && parentDisplayName ? (
                  <span className="underline font-medium inline-block min-w-[200px]">{parentDisplayName}</span>
                ) : (
                  <span className="inline-block border-b border-black w-64">&nbsp;</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <strong className="font-bold">Signature: </strong>
                  <span className="inline-block border-b border-black w-44">&nbsp;</span>
                </div>

                <div>
                  <strong className="font-bold">Date: </strong>
                  <span className="inline-block border-b border-black w-36">&nbsp;</span>
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
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-amber-300 font-extrabold rounded-xl text-xs transition flex items-center gap-2 shadow-md hover:shadow-lg border border-emerald-600 cursor-pointer disabled:opacity-50"
              title="Save official Guardian Notice as a downloadable PDF file"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Generating PDF File...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-amber-300" />
                  <span>Save PDF File</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-extrabold rounded-xl text-xs transition flex items-center gap-2 shadow-md hover:shadow-lg border border-amber-300 cursor-pointer"
              title="Print document or open browser print dialog"
            >
              <Printer className="w-4 h-4 text-emerald-950" />
              <span>Print Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
