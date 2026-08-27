import React, { useState } from 'react';
import { Student, TeacherProfile } from '../types';
import { safePrintDocument } from '../utils/printHelper';
import { downloadGuardianNoticePDF } from '../utils/guardianNoticePdf';
import { DepEdDocHeader, DepEdDocFooter } from './DepEdDocHeaderFooter';
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
  Sparkles,
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

  // Remediation / Skills Enhancement Session Dates (Start Date & End Date)
  const defaultStartDate = student?.enrolledDate || todayStr;
  const calculateDefaultEndDate = (start: string) => {
    try {
      const d = new Date(start);
      if (!isNaN(d.getTime())) {
        d.setDate(d.getDate() + 13); // ~2 weeks later
        return d.toISOString().split('T')[0];
      }
    } catch {
      // fallback
    }
    return start;
  };

  const [startDateRaw, setStartDateRaw] = useState<string>(defaultStartDate);
  const [endDateRaw, setEndDateRaw] = useState<string>(calculateDefaultEndDate(defaultStartDate));

  // Preferred Session Time (Free-form typing by teacher)
  const parseInitialTimeAndVenue = (raw?: string) => {
    if (!raw) {
      return {
        initialTime: '3:00 PM – 4:00 PM',
        ven: 'ICT Computer Lab 1 / TLE Building',
      };
    }
    const match = raw.match(/\((.*?)\)$/);
    const ven = match ? match[1].trim() : 'ICT Computer Lab 1 / TLE Building';
    const cleanTime = raw.replace(/\s*\(.*?\)$/, '').trim() || '3:00 PM – 4:00 PM';
    return { initialTime: cleanTime, ven };
  };

  const initialParsed = parseInitialTimeAndVenue(student?.scheduleDetails);
  const [venue, setVenue] = useState<string>(initialParsed.ven);
  const [sessionTime, setSessionTime] = useState<string>(initialParsed.initialTime);
  const [teacherInCharge, setTeacherInCharge] = useState<string>(teacher.name || 'TLE Teacher');
  const [departmentHead, setDepartmentHead] = useState<string>(
    teacher.headTeacherName || 'Dr. Corazon V. Santos'
  );

  React.useEffect(() => {
    if (student) {
      const parsed = parseInitialTimeAndVenue(student.scheduleDetails);
      setSessionTime(parsed.initialTime);
      setVenue(parsed.ven);
      const start = student.enrolledDate || todayStr;
      setStartDateRaw(start);
      setEndDateRaw(calculateDefaultEndDate(start));
      setTeacherInCharge(teacher.name || 'TLE Teacher');
      setDepartmentHead(teacher.headTeacherName || 'Dr. Corazon V. Santos');
    }
  }, [student?.id, student?.scheduleDetails, student?.enrolledDate, teacher.name, teacher.headTeacherName, todayStr]);

  if (!isOpen || !student) return null;

  // Format single letter issue date
  const formattedLetterDate = (() => {
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
      return letterDateRaw;
    }
  })();

  // Format inclusive session date range (e.g. Sept. 2 to Sept. 15, 2025)
  const formattedSessionDates = (() => {
    try {
      if (!startDateRaw) return '';
      if (!endDateRaw || startDateRaw === endDateRaw) {
        const parts = startDateRaw.split('-');
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      const p1 = startDateRaw.split('-');
      const p2 = endDateRaw.split('-');
      const d1 = new Date(Number(p1[0]), Number(p1[1]) - 1, Number(p1[2]));
      const d2 = new Date(Number(p2[0]), Number(p2[1]) - 1, Number(p2[2]));

      const m1 = d1.toLocaleDateString('en-US', { month: 'short' });
      const m2 = d2.toLocaleDateString('en-US', { month: 'short' });
      const day1 = d1.getDate();
      const day2 = d2.getDate();
      const y1 = d1.getFullYear();
      const y2 = d2.getFullYear();

      if (y1 === y2) {
        if (m1 === m2) {
          return `${m1}. ${day1} to ${m1}. ${day2}, ${y1}`;
        }
        return `${m1}. ${day1} to ${m2}. ${day2}, ${y1}`;
      }
      return `${m1}. ${day1}, ${y1} to ${m2}. ${day2}, ${y2}`;
    } catch {
      return `${startDateRaw} to ${endDateRaw}`;
    }
  })();

  const isEnhancement = student.programType === 'Enhancement' || student.programType?.toLowerCase().includes('enhance');
  const programTitle = isEnhancement ? 'Skills Enhancement Program' : 'Remediation Program';

  const studentFullName = `${student.firstName} ${student.middleInitial ? student.middleInitial + ' ' : ''}${student.lastName}`.trim();
  const parentDisplayName = student.parentName || '';
  const docFilename = `Guardian_Notice_${isEnhancement ? 'Enhancement' : 'Remediation'}_${student.lastName}_${student.firstName}`;

  const showFeedback = (text: string, type: 'success' | 'error') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4500);
  };

  const handlePrint = () => {
    try {
      const ok = safePrintDocument('printable-guardian-notice', docFilename, {
        pageSize: '8.5in 13in',
        pageMargin: '1in',
      });
      if (ok) {
        showFeedback('Print preview launched for 8.5x13 bond paper! Select your printer or "Save as PDF".', 'success');
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
      const success = downloadGuardianNoticePDF(
        {
          student,
          teacher,
          dateStr: formattedLetterDate,
          venue,
          timeSchedule: sessionTime,
          datesRangeStr: formattedSessionDates,
          startDate: startDateRaw,
          endDate: endDateRaw,
          teacherInCharge,
          departmentHead,
          teacherTitle: 'TLE Teacher',
          headTeacherTitle: 'Head Teacher VI, TLE Department',
          isFilledTemplate,
        },
        `${docFilename}.pdf`
      );

      if (success) {
        showFeedback('Guardian Notice PDF successfully downloaded!', 'success');
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

  // Quick preset helper
  const setRangePreset = (days: number) => {
    const start = startDateRaw || todayStr;
    const d = new Date(start);
    d.setDate(d.getDate() + days - 1);
    setEndDateRaw(d.toISOString().split('T')[0]);
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
                  Guardian&apos;s Notice of {isEnhancement ? 'Skills Enhancement' : 'Remediation'}
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
              <span>Dates:</span>
              <strong className="text-emerald-950 font-bold bg-white px-2.5 py-0.5 rounded-md border border-amber-300 shadow-2xs">
                {formattedSessionDates || 'Select Dates'}
              </strong>
            </div>

            <div className="flex items-center gap-2 text-amber-950 font-semibold">
              <Clock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Time:</span>
              <strong className="text-emerald-950 font-bold bg-white px-2.5 py-0.5 rounded-md border border-amber-300 shadow-2xs">
                {sessionTime || 'Custom Time'}
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
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                isEditingDetails
                  ? 'bg-emerald-800 text-white hover:bg-emerald-700'
                  : 'bg-white hover:bg-amber-100 text-amber-900 border border-amber-300'
              }`}
              title="Customize session dates, preferred time, venue, or teachers"
            >
              {isEditingDetails ? <Check className="w-3.5 h-3.5" /> : <Edit2 className="w-3 h-3 text-amber-700" />}
              <span>{isEditingDetails ? 'Done Editing' : 'Customize Dates & Time'}</span>
            </button>
          </div>
        </div>

        {/* Customization Drawer (Hidden in Print) */}
        {isEditingDetails && (
          <div className="bg-slate-50 p-4 border-b border-slate-200 space-y-3 text-xs print:hidden animate-in fade-in duration-150">
            {/* Session Date Range Selection (Start Date & End Date) */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <span>Session Inclusive Dates (Start to End Date):</span>
                </label>
                <div className="flex items-center gap-1 text-[10px]">
                  <span className="text-slate-600 font-semibold">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => setRangePreset(7)}
                    className="px-2 py-0.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded font-medium cursor-pointer"
                  >
                    1 Week
                  </button>
                  <button
                    type="button"
                    onClick={() => setRangePreset(14)}
                    className="px-2 py-0.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded font-medium cursor-pointer"
                  >
                    2 Weeks
                  </button>
                  <button
                    type="button"
                    onClick={() => setRangePreset(30)}
                    className="px-2 py-0.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded font-medium cursor-pointer"
                  >
                    1 Month
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Start Date of Session:
                  </label>
                  <input
                    type="date"
                    value={startDateRaw}
                    onChange={(e) => setStartDateRaw(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    End Date of Session:
                  </label>
                  <input
                    type="date"
                    value={endDateRaw}
                    onChange={(e) => setEndDateRaw(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>
              <p className="text-[11px] text-emerald-900 font-medium italic">
                Preview: <strong>{formattedSessionDates}</strong>
              </p>
            </div>

            {/* Time & Venue & Letter Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Preferred Time (Type freely):</span>
                </label>
                <input
                  type="text"
                  value={sessionTime}
                  onChange={(e) => setSessionTime(e.target.value)}
                  placeholder="e.g. 3:00 PM – 4:00 PM / 3:30 PM - 4:45 PM"
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
                  placeholder="e.g. ICT Computer Lab 1 / TLE Building"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Letter Issue Date:</span>
                </label>
                <input
                  type="date"
                  value={letterDateRaw}
                  onChange={(e) => setLetterDateRaw(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* Teachers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>TLE Teacher Name:</span>
                </label>
                <input
                  type="text"
                  value={teacherInCharge}
                  onChange={(e) => setTeacherInCharge(e.target.value)}
                  placeholder="Teacher Name"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Head Teacher VI Name:</span>
                </label>
                <input
                  type="text"
                  value={departmentHead}
                  onChange={(e) => setDepartmentHead(e.target.value)}
                  placeholder="Head Teacher VI Name"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* PRINTABLE OFFICIAL NOTICE CONTAINER (STRICT 1-PAGE COMPRESSED LAYOUT WITH OFFICIAL HEADER & FOOTER) */}
        <div
          id="printable-guardian-notice"
          className="p-6 sm:p-8 md:p-10 text-black bg-white space-y-2.5 sm:space-y-3 font-serif text-xs sm:text-[13px] leading-snug sm:leading-normal print:p-0 print:m-0 print:space-y-2 print:text-[11px] print:leading-tight"
        >
          {/* Official DepEd Header */}
          <DepEdDocHeader department={teacher.department || 'Technology and Livelihood Education (TLE) Department'} />

          {/* Date & Addressee */}
          <div className="space-y-1 pt-0.5">
            <div>
              <p className="font-bold inline">Date: </p>
              {isFilledTemplate ? (
                <span className="underline font-normal inline-block min-w-[180px]">{formattedLetterDate}</span>
              ) : (
                <span className="inline-block border-b border-black w-44">&nbsp;</span>
              )}
            </div>

            {/* To: Mr./Ms. [Parent Name] - Note: "(Name of Parent/Guardian)" is removed */}
            <div>
              <p className="font-bold inline">To: </p>
              <span className="font-normal">Mr./Ms. </span>
              {isFilledTemplate && parentDisplayName ? (
                <span className="underline font-semibold inline-block min-w-[220px]">{parentDisplayName}</span>
              ) : (
                <span className="inline-block border-b border-black w-60">&nbsp;</span>
              )}
            </div>

            <div className="pt-0.5">
              <p className="font-bold text-xs sm:text-[13px] print:text-xs">
                Subject: Participation in {programTitle}
              </p>
            </div>
          </div>

          {/* Salutation */}
          <div className="space-y-0.5 pt-0.5">
            <p>Dear Parent/Guardian,</p>
            <p>Warm greetings!</p>
          </div>

          {/* Body Paragraphs */}
          <div className="space-y-1.5 text-justify">
            {isFilledTemplate ? (
              <p>
                We would like to inform you that your child{' '}
                <strong className="underline font-bold">{studentFullName}</strong>, from{' '}
                <strong>Grade</strong> <span className="underline font-bold px-1">{student.gradeLevel.replace('Grade ', '')}</span>{' '}
                <strong>- Section</strong> <span className="underline font-bold px-1">{student.section}</span>, has been recommended to undergo a{' '}
                <strong>{programTitle}</strong> in{' '}
                <strong className="underline font-bold">{student.subject}</strong> based on his/her academic performance and assessment results for this quarter.
              </p>
            ) : (
              <p>
                We would like to inform you that your child{' '}
                <span className="inline-block border-b border-black w-48">&nbsp;</span>, from{' '}
                <strong>Grade</strong> <span className="inline-block border-b border-black w-12">&nbsp;</span>{' '}
                <strong>- Section</strong> <span className="inline-block border-b border-black w-36">&nbsp;</span>, has been recommended to undergo a{' '}
                <strong>{programTitle}</strong> in{' '}
                <span className="inline-block border-b border-black w-44">&nbsp;</span> based on his/her academic performance and assessment results for this quarter.
              </p>
            )}

            <p>
              The purpose of this program is to provide additional academic support to help your child strengthen their understanding of the subject and improve learning outcomes.
            </p>

            {/* Program Details Bullet List */}
            <div className="pt-0.5 space-y-0.5">
              <p className="font-bold">Program Details</p>
              <ul className="space-y-0.5 pl-4">
                <li className="flex items-start">
                  <span className="mr-2">&bull;</span>
                  <div className="flex-1">
                    <strong className="font-bold">Subject Area: </strong>
                    {isFilledTemplate ? (
                      <span className="underline">{student.subject}</span>
                    ) : (
                      <span className="inline-block border-b border-black w-64 sm:w-80">&nbsp;</span>
                    )}
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">&bull;</span>
                  <div className="flex-1">
                    <strong className="font-bold">Inclusive Dates: </strong>
                    {isFilledTemplate ? (
                      <span className="underline font-semibold">{formattedSessionDates}</span>
                    ) : (
                      <span className="inline-block border-b border-black w-64 sm:w-80">&nbsp;</span>
                    )}
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">&bull;</span>
                  <div className="flex-1">
                    <strong className="font-bold">Time / Schedule: </strong>
                    {isFilledTemplate ? (
                      <span className="underline font-semibold">{sessionTime}</span>
                    ) : (
                      <span className="inline-block border-b border-black w-64 sm:w-80">&nbsp;</span>
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
                      <span className="inline-block border-b border-black w-64 sm:w-80">&nbsp;</span>
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
                      <span className="inline-block border-b border-black w-64 sm:w-80">&nbsp;</span>
                    )}
                  </div>
                </li>
              </ul>
            </div>

            <p>
              We are requesting your support and permission to allow your child to attend these sessions regularly. Please complete the reply slip below and return it to the TLE teacher as soon as possible.
            </p>

            <p>
              Should you have any questions, feel free to reach out to us through the school or your child&apos;s TLE teacher. Thank you very much for your continued support.
            </p>
          </div>

          {/* Signatures (SIDE BY SIDE 2-COLUMN LAYOUT) */}
          <div className="grid grid-cols-2 gap-6 pt-1.5 pb-0.5">
            <div>
              <p>Sincerely,</p>
              <div className="mt-4">
                {isFilledTemplate && teacherInCharge ? (
                  <p className="font-bold uppercase tracking-wide text-xs">{teacherInCharge}</p>
                ) : null}
                <div className="border-b border-black w-48 sm:w-56 my-0.5"></div>
                <p className="font-bold text-xs">TLE Teacher</p>
              </div>
            </div>

            <div>
              <p className="font-bold">Noted by:</p>
              <div className="mt-4">
                {isFilledTemplate && departmentHead ? (
                  <p className="font-bold uppercase tracking-wide text-xs">{departmentHead}</p>
                ) : null}
                <div className="border-b border-black w-48 sm:w-56 my-0.5"></div>
                <p className="font-bold text-xs">Head Teacher VI, TLE Department</p>
              </div>
            </div>
          </div>

          {/* Dashed Separator Line */}
          <div className="my-1.5 border-t-2 border-dashed border-slate-700"></div>

          {/* REPLY SLIP */}
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-baseline gap-2">
              <p className="font-bold text-xs sm:text-sm tracking-wide">REPLY SLIP</p>
              <p className="text-[11px] italic text-slate-700">(To be returned to the TLE teacher)</p>
            </div>

            <p className="text-[11px] sm:text-xs">
              I have received and read the letter regarding the {programTitle.toLowerCase()} for my child:
            </p>

            {/* Student & Grade Section in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <strong className="font-bold">Name of Student: </strong>
                {isFilledTemplate ? (
                  <span className="underline font-bold inline-block min-w-[180px]">{studentFullName}</span>
                ) : (
                  <span className="inline-block border-b border-black w-48">&nbsp;</span>
                )}
              </div>

              <div>
                <strong className="font-bold">Grade & Section: </strong>
                {isFilledTemplate ? (
                  <span className="underline font-bold inline-block min-w-[140px]">{student.gradeLevel} - {student.section}</span>
                ) : (
                  <span className="inline-block border-b border-black w-40">&nbsp;</span>
                )}
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-0.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded border-black text-black focus:ring-0"
                />
                <span>
                  <strong>I allow</strong> my child to attend and participate in the {programTitle.toLowerCase()}.
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded border-black text-black focus:ring-0"
                />
                <span>
                  <strong>I do not allow</strong> my child to attend the {programTitle.toLowerCase()}.
                </span>
              </label>
            </div>

            {/* Reason */}
            <div className="text-xs">
              <strong className="font-bold">Reason (if not allowed): </strong>
              <span className="inline-block border-b border-black w-56 sm:w-96">&nbsp;</span>
            </div>

            {/* Parent Sign-off (3 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-0.5 text-xs">
              <div>
                <strong className="font-bold">Parent/Guardian Name: </strong>
                {isFilledTemplate && parentDisplayName ? (
                  <span className="underline font-medium inline-block min-w-[120px]">{parentDisplayName}</span>
                ) : (
                  <span className="inline-block border-b border-black w-36">&nbsp;</span>
                )}
              </div>

              <div>
                <strong className="font-bold">Signature: </strong>
                <span className="inline-block border-b border-black w-28">&nbsp;</span>
              </div>

              <div>
                <strong className="font-bold">Date: </strong>
                <span className="inline-block border-b border-black w-24">&nbsp;</span>
              </div>
            </div>
          </div>

          {/* Official DepEd Footer */}
          <DepEdDocFooter />
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
