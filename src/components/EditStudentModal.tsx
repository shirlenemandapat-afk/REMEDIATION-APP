import React, { useState, useEffect } from 'react';
import { Student, ProgramType } from '../types';
import {
  UserCheck,
  X,
  AlertCircle,
  Phone,
  User,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
  CalendarRange,
  BookOpen,
  Layers,
  Award,
  FileText,
  Save,
  Trash2,
  Archive,
} from 'lucide-react';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onUpdateStudent: (updatedStudent: Student) => void;
  onDeleteStudent?: (student: Student) => void;
  onArchiveStudent?: (student: Student) => void;
}

const SCHEDULE_VENUES = [
  'Designated Section Classroom',
  'Academic Remediation Center / Learning Resource Center',
  'Computer Laboratory',
  'Science / Skills Laboratory',
  'School Library',
  'Specialized Subject Workshop Room',
];

const TLE_SUBJECTS = [
  'ICT - Technical Drafting',
  'ICT - Computer Programming',
  'ICT - Illustration',
  'ICT - Animation',
  'Home Economics - Cookery',
  'Home Economics - Bread & Pastry Production',
  'Home Economics - Dressmaking',
  'Home Economics - Beauty Care / Nail Care',
  'Home Economics - Food and Beverage Services',
  'Industrial Arts - Electrical Installation & Maintenance (EIM)',
  'Industrial Arts - Shielded Metal Arc Welding (SMAW)',
  'Industrial Arts - Electronic Products Assembly and Servicing (EPAS)',
  'Industrial Arts - Automotive Servicing',
  'Industrial Arts - Carpentry',
  'Agri-Fishery Arts - Agricultural Crops Production',
  'Agri-Fishery Arts - Animal Production',
  'Agri-Fishery Arts - Aquaculture',
  'General TLE / Exploratory',
];

const SECTION_PRESETS = [
  'Diamond',
  'Emerald',
  'Ruby',
  'Sapphire',
  'Topaz',
  'Pearl',
  'Garnet',
  'Amethyst',
  'Opal',
  'Jade',
  'Jasper',
  'Onyx',
  'Quartz',
  'Turquoise',
  'Aquamarine',
  'Beryl',
];

// Helper: Convert 24h format (15:30) to 12h AM/PM (03:30 PM)
const format24to12 = (time24: string): string => {
  if (!time24) return '';
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  let h = parseInt(parts[0], 10);
  const m = parts[1].padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h.toString().padStart(2, '0')}:${m} ${period}`;
};

// Helper: Format YYYY-MM-DD to "Sep 2, 2026"
const formatDateDisplay = (dateStr: string) => {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

// Helper: Format Inclusive Date Range
const formatDateRangeDisplay = (startStr: string, endStr: string) => {
  try {
    if (!startStr) return '';
    if (!endStr || startStr === endStr) return formatDateDisplay(startStr);
    const p1 = startStr.split('-');
    const p2 = endStr.split('-');
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
    return `${startStr} to ${endStr}`;
  }
};

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  onUpdateStudent,
  onDeleteStudent,
  onArchiveStudent,
}) => {
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Grade 7');
  const [section, setSection] = useState('Diamond');
  const [subject, setSubject] = useState('ICT - Technical Drafting');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [customSubjectText, setCustomSubjectText] = useState('');
  const [programType, setProgramType] = useState<ProgramType>('Remediation');
  const [baselineScore, setBaselineScore] = useState<number>(45);
  const [status, setStatus] = useState<Student['status']>('Progressing');
  const [focusTopic, setFocusTopic] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentContact, setParentContact] = useState('');
  const [scheduleDetails, setScheduleDetails] = useState('');
  const [showScheduleBuilder, setShowScheduleBuilder] = useState(false);

  // Schedule builder helpers
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [startTimeRaw, setStartTimeRaw] = useState('15:30');
  const [endTimeRaw, setEndTimeRaw] = useState('16:30');
  const [scheduleVenue, setScheduleVenue] = useState(SCHEDULE_VENUES[0]);

  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Sync state when student prop changes
  useEffect(() => {
    if (student) {
      setLastName(student.lastName || '');
      setFirstName(student.firstName || '');
      setMiddleInitial(student.middleInitial || '');
      setGradeLevel(student.gradeLevel || 'Grade 7');
      setSection(student.section || 'Diamond');
      
      const isPredefined = TLE_SUBJECTS.includes(student.subject);
      if (isPredefined) {
        setSubject(student.subject);
        setIsCustomSubject(false);
        setCustomSubjectText('');
      } else {
        setSubject('Custom');
        setIsCustomSubject(true);
        setCustomSubjectText(student.subject || '');
      }

      setProgramType((student.programType as ProgramType) || 'Remediation');
      setBaselineScore(Number(student.baselineScore) || 0);
      setStatus(student.status || 'Progressing');
      setFocusTopic(student.focusTopic || '');
      setParentName(student.parentName || '');
      setParentContact(student.parentContact || '');
      setScheduleDetails(student.scheduleDetails || '');
      setNotes(student.notes || '');
      setError('');
      setSavedFeedback(false);
      setShowScheduleBuilder(false);
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const handleApplyScheduleBuilder = () => {
    const formattedRange = formatDateRangeDisplay(startDate, endDate);
    const finalTime = `${format24to12(startTimeRaw)} – ${format24to12(endTimeRaw)}`;
    const combined = `${formattedRange}, ${finalTime} (${scheduleVenue})`;
    setScheduleDetails(combined);
    setShowScheduleBuilder(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!lastName.trim() || !firstName.trim()) {
      setError('Student Last name and First name are required.');
      return;
    }

    const finalSubject = isCustomSubject ? customSubjectText.trim() || subject : subject;

    const updated: Student = {
      ...student,
      lastName: lastName.trim(),
      firstName: firstName.trim(),
      middleInitial: middleInitial.trim().toUpperCase(),
      gradeLevel,
      section: section.trim(),
      subject: finalSubject || 'TLE',
      programType,
      baselineScore: Number(baselineScore),
      status,
      focusTopic: focusTopic.trim(),
      parentName: parentName.trim(),
      parentContact: parentContact.trim(),
      scheduleDetails: scheduleDetails.trim(),
      notes: notes.trim(),
    };

    onUpdateStudent(updated);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 overflow-y-auto p-2 sm:p-4 md:p-6 flex justify-center items-start">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 my-2 sm:my-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-950 p-5 text-white flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400/20 text-amber-300 rounded-2xl border border-amber-400/30">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white font-serif tracking-wide">
                  Edit Student Profile & Details
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-emerald-950">
                  {student.programType}
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                Update records for <span className="font-bold text-yellow-300">{student.lastName}, {student.firstName}</span> • DepEd RMCHS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              {error}
            </div>
          )}

          {savedFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-extrabold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Student profile updated and synchronized successfully!
            </div>
          )}

          {/* Section 1: Program Classification & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-700" />
                Program Classification <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProgramType('Remediation')}
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                    programType === 'Remediation'
                      ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Remediation
                </button>
                <button
                  type="button"
                  onClick={() => setProgramType('Skills Enhancement')}
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                    programType === 'Skills Enhancement'
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-400 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Enhancement
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Progress Status <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Student['status'])}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="Needs Remediation">🔴 Needs Remediation</option>
                <option value="Progressing">🟡 Progressing</option>
                <option value="Mastered / Promoted">🟢 Mastered / Promoted</option>
              </select>
            </div>
          </div>

          {/* Section 2: Student Name */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-700" />
              Student Full Name <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  required
                  placeholder="Last Name (e.g., Dela Cruz)"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div className="sm:col-span-5">
                <input
                  type="text"
                  required
                  placeholder="First Name (e.g., Juan)"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  maxLength={4}
                  placeholder="M.I."
                  value={middleInitial}
                  onChange={(e) => setMiddleInitial(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Grade Level, Section & Baseline Diagnostic Score */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Grade Level <span className="text-red-500">*</span>
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="Grade 7">Grade 7</option>
                <option value="Grade 8">Grade 8</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Section Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  list="section-options"
                  placeholder="e.g. Diamond"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <datalist id="section-options">
                  {SECTION_PRESETS.map((sec) => (
                    <option key={sec} value={sec} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Baseline Diagnostic Score (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={baselineScore}
                  onChange={(e) => setBaselineScore(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <span className="text-xs font-extrabold text-slate-500">%</span>
              </div>
            </div>
          </div>

          {/* Section 4: Learning Area / Subject */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
              TLE Learning Area / Subject Strand <span className="text-red-500">*</span>
            </label>
            <select
              value={isCustomSubject ? 'Custom' : subject}
              onChange={(e) => {
                if (e.target.value === 'Custom') {
                  setIsCustomSubject(true);
                } else {
                  setIsCustomSubject(false);
                  setSubject(e.target.value);
                }
              }}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 mb-2"
            >
              {TLE_SUBJECTS.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
              <option value="Custom">✏️ Other / Custom TLE Subject...</option>
            </select>

            {isCustomSubject && (
              <input
                type="text"
                placeholder="Type custom subject name (e.g., Handicraft Production - Macrame)"
                value={customSubjectText}
                onChange={(e) => setCustomSubjectText(e.target.value)}
                className="w-full px-3 py-2 bg-amber-50/60 border border-amber-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            )}
          </div>

          {/* Section 5: Target Competency / Learning Gap */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Target Competency / Learning Gap Focus Topic
            </label>
            <input
              type="text"
              placeholder="e.g., Drafting Orthographic Projections & Dimensioning"
              value={focusTopic}
              onChange={(e) => setFocusTopic(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Section 6: Parent / Guardian Communication Details */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                Parent / Guardian Communication Info
              </span>
              <span className="text-[10px] text-slate-500 font-medium">For Notice of Remediation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Parent/Guardian Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Maria Dela Cruz"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Parent Contact Number
                </label>
                <input
                  type="text"
                  placeholder="e.g., 0917-123-4567"
                  value={parentContact}
                  onChange={(e) => setParentContact(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Section 7: Remediation Schedule & Venue */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <CalendarRange className="w-3.5 h-3.5 text-emerald-700" />
                Remediation Schedule & Venue
              </span>
              <button
                type="button"
                onClick={() => setShowScheduleBuilder(!showScheduleBuilder)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
              >
                {showScheduleBuilder ? 'Hide Schedule Builder' : '🗓️ Build Date & Time'}
              </button>
            </div>

            <input
              type="text"
              placeholder="e.g., Sep. 2 to Sep. 16, 2026, 03:30 PM – 04:30 PM (Designated Section Classroom)"
              value={scheduleDetails}
              onChange={(e) => setScheduleDetails(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />

            {showScheduleBuilder && (
              <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-3 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={startTimeRaw}
                      onChange={(e) => setStartTimeRaw(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={endTimeRaw}
                      onChange={(e) => setEndTimeRaw(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Remediation Venue</label>
                  <select
                    value={scheduleVenue}
                    onChange={(e) => setScheduleVenue(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    {SCHEDULE_VENUES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleApplyScheduleBuilder}
                    className="px-3 py-1.5 bg-emerald-800 text-yellow-300 hover:bg-emerald-700 text-xs font-bold rounded-lg cursor-pointer transition shadow-2xs"
                  >
                    Apply Built Schedule
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 8: Notes & Observations */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Diagnostic Notes / Teacher Observations
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Needs additional hands-on exercises with isometric and orthographic views..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              {onArchiveStudent && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onArchiveStudent(student);
                  }}
                  className="px-3 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-300 transition flex items-center gap-1.5 cursor-pointer"
                  title="Archive Student Record"
                >
                  <Archive className="w-3.5 h-3.5 text-amber-700" />
                  Archive
                </button>
              )}

              {onDeleteStudent && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDeleteStudent(student);
                  }}
                  className="px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-300 transition flex items-center gap-1.5 cursor-pointer"
                  title="Delete Student Record"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  Delete
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-yellow-300 rounded-xl text-xs font-extrabold transition flex items-center gap-2 shadow-sm border border-emerald-900 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4 text-amber-400" />
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
