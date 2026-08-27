import React, { useState } from 'react';
import { Student, ProgramType } from '../types';
import {
  UserPlus,
  X,
  AlertCircle,
  FileText,
  Phone,
  User,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
  CalendarRange,
} from 'lucide-react';

interface EnrollStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnrollStudent: (student: Omit<Student, 'id' | 'enrolledDate' | 'status'>) => void;
}

const SCHEDULE_VENUES = [
  'TLE Laboratory / Workshop Room',
  'ICT Computer Laboratory',
  'Cookery / FCS Kitchen Laboratory',
  'Industrial Arts (IA) Shop',
  'Agri-Fishery Arts (AFA) Area',
  'Designated Section Classroom',
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

export const EnrollStudentModal: React.FC<EnrollStudentModalProps> = ({
  isOpen,
  onClose,
  onEnrollStudent,
}) => {
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Grade 7');
  const [section, setSection] = useState('Diamond');
  const [subject, setSubject] = useState('ICT - Technical Drafting');
  const [programType, setProgramType] = useState<ProgramType>('Remediation');
  const [baselineScore, setBaselineScore] = useState<number>(45);
  const [parentName, setParentName] = useState('');
  const [parentContact, setParentContact] = useState('');

  // Easy Date Selection: Start Date & End Date to the calendar
  const todayStr = new Date().toISOString().split('T')[0];
  const calculateDefaultEndDate = (start: string, daysAhead = 14) => {
    try {
      const parts = start.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      d.setDate(d.getDate() + daysAhead);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch {
      return start;
    }
  };

  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(() => calculateDefaultEndDate(todayStr, 14));

  // Easy Time Encoding
  const [startTimeRaw, setStartTimeRaw] = useState('15:30');
  const [endTimeRaw, setEndTimeRaw] = useState('16:30');
  const [scheduleVenue, setScheduleVenue] = useState(SCHEDULE_VENUES[0]);

  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    // If end date is earlier than start date, auto adjust
    if (endDate < newStart) {
      setEndDate(calculateDefaultEndDate(newStart, 14));
    }
  };

  const handleDurationShortcut = (days: number) => {
    setEndDate(calculateDefaultEndDate(startDate, days));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!lastName.trim() || !firstName.trim()) {
      setError('Student Last name and First name are required.');
      return;
    }

    const formattedRange = formatDateRangeDisplay(startDate, endDate);
    const finalTime = `${format24to12(startTimeRaw)} – ${format24to12(endTimeRaw)}`;
    const combinedSchedule = `${formattedRange}, ${finalTime} (${scheduleVenue})`;

    onEnrollStudent({
      lastName: lastName.trim(),
      firstName: firstName.trim(),
      middleInitial: middleInitial.trim().toUpperCase(),
      gradeLevel,
      section: section.trim(),
      subject: subject.trim(),
      programType,
      baselineScore: Number(baselineScore),
      focusTopic: '', // Target topic is identified per session
      parentName: parentName.trim(),
      parentContact: parentContact.trim(),
      scheduleDetails: combinedSchedule,
      notes: notes.trim(),
    });

    // Reset form
    setLastName('');
    setFirstName('');
    setMiddleInitial('');
    setParentName('');
    setParentContact('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 overflow-y-auto p-2 sm:p-4 md:p-6 flex justify-center items-start">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 my-2 sm:my-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <UserPlus className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white">Enroll Student in Project S.M.I.L.E.</h3>
              <p className="text-xs text-emerald-200">
                Register student for Remediation or Skills Enhancement Program
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              {error}
            </div>
          )}

          {/* Program Type Selection (Remediation or Skills Enhancement) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Program Classification <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['Remediation', 'Skills Enhancement'] as ProgramType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setProgramType(type)}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-extrabold text-center transition flex items-center justify-center gap-2 cursor-pointer ${
                    programType === type
                      ? type === 'Remediation'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400/40'
                        : 'bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400/40'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{type === 'Remediation' ? '🎯 Remediation Program' : '⭐ Skills Enhancement'}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {programType === 'Remediation'
                ? 'Targeted intensive reteaching and practice for students needing mastery support.'
                : 'Advanced enrichment and higher-order skills development for proficient students.'}
            </p>
          </div>

          {/* Student Name Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Student Full Name
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Santos"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Juan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  M.I.
                </label>
                <input
                  type="text"
                  maxLength={3}
                  placeholder="e.g. A."
                  value={middleInitial}
                  onChange={(e) => setMiddleInitial(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none text-center font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Grade, Section, Subject & Baseline Score */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Grade Level
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium cursor-pointer"
              >
                <option value="Grade 7">Grade 7</option>
                <option value="Grade 8">Grade 8</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Section
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Diamond"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject / Strand
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ICT - Technical Drafting"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Baseline Diagnostic
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={baselineScore}
                  onChange={(e) => setBaselineScore(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-emerald-800"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Parent Communication & Proposed Schedule */}
          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <FileText className="w-4 h-4 text-amber-700" />
              <span>Parent / Guardian & Proposed Schedule (For Communication Letter)</span>
            </div>

            {/* Parent Name and Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  Parent / Guardian Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Ricardo Santos"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  Contact Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0917-123-4567"
                  value={parentContact}
                  onChange={(e) => setParentContact(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Schedule Configuration */}
            <div className="pt-3 border-t border-amber-200/80 space-y-3">
              {/* 1. Date Selection: Start Date & End Date to the Calendar */}
              <div className="bg-white p-3.5 rounded-xl border border-amber-300 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <CalendarRange className="w-4 h-4 text-amber-700" />
                    <span>Inclusive Session Dates (Calendar Date Range)</span>
                  </label>
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    {formatDateRangeDisplay(startDate, endDate)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-700" />
                      <span>Start Date</span>
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-700" />
                      <span>End Date</span>
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Quick Duration Shortcuts */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] font-bold text-slate-400">Duration:</span>
                  {[
                    { label: '1 Week', days: 7 },
                    { label: '2 Weeks (Standard)', days: 14 },
                    { label: '1 Month', days: 30 },
                    { label: 'Whole Quarter', days: 45 },
                  ].map((dur) => (
                    <button
                      key={dur.label}
                      type="button"
                      onClick={() => handleDurationShortcut(dur.days)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 rounded-md text-[10px] font-bold transition cursor-pointer border border-slate-200"
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Time Encoding: Direct Start & End Time Pickers */}
              <div className="bg-white p-3.5 rounded-xl border border-amber-300 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>Session Time Schedule</span>
                  </label>
                  <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full font-mono">
                    {format24to12(startTimeRaw)} – {format24to12(endTimeRaw)}
                  </span>
                </div>

                {/* Standard Start & End Time Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-700" />
                      <span>Start Time</span>
                    </label>
                    <input
                      type="time"
                      value={startTimeRaw}
                      onChange={(e) => setStartTimeRaw(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-700" />
                      <span>End Time</span>
                    </label>
                    <input
                      type="time"
                      value={endTimeRaw}
                      onChange={(e) => setEndTimeRaw(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Venue Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-700" />
                  <span>Assigned Laboratory / Classroom Venue</span>
                </label>
                <select
                  value={scheduleVenue}
                  onChange={(e) => setScheduleVenue(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                >
                  {SCHEDULE_VENUES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Schedule Summary Card */}
              <div className="bg-gradient-to-r from-amber-50 via-emerald-50/50 to-amber-50 p-3 rounded-xl border border-amber-300 text-xs space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-amber-900">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Official Schedule Summary
                  </span>
                  <span className="flex items-center gap-1 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Ready for Notice Letter
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div>
                    <span className="block text-[10px] text-slate-500 font-semibold">Inclusive Dates:</span>
                    <strong className="text-emerald-950 text-xs block">
                      {formatDateRangeDisplay(startDate, endDate)}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 font-semibold">Time Schedule:</span>
                    <strong className="text-amber-900 text-xs font-mono block">
                      {format24to12(startTimeRaw)} – {format24to12(endTimeRaw)}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 font-semibold">Assigned Room:</span>
                    <strong className="text-slate-800 text-xs truncate block">{scheduleVenue}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Initial Remarks / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Initial Anecdotal Notes / Diagnostic Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Identified during Q1 Diagnostic Assessment. Responds well to visual representations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold transition shadow-md flex items-center gap-1.5 border border-emerald-600 cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4 text-amber-300" />
              Enroll & Generate Parent Letter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};



