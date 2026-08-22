import React, { useState } from 'react';
import { Student, ProgramType } from '../types';
import { UserPlus, X, AlertCircle, FileText, Phone, User, Calendar, Clock, MapPin } from 'lucide-react';

interface EnrollStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnrollStudent: (student: Omit<Student, 'id' | 'enrolledDate' | 'status'>) => void;
}

const SCHEDULE_DAYS = [
  'Every Tuesday & Thursday',
  'Every Monday & Wednesday',
  'Every Friday',
  'Every Monday to Friday',
  'Every Saturday (Catch-up / Enhancement)',
  'Every Monday',
  'Every Tuesday',
  'Every Wednesday',
  'Every Thursday',
];

const SCHEDULE_TIMES = [
  '3:30 PM - 4:30 PM (After Class Remedial)',
  '4:00 PM - 5:00 PM (After Class)',
  '12:00 PM - 1:00 PM (Remedial Period)',
  '7:00 AM - 8:00 AM (Zero Period)',
  '1:00 PM - 2:00 PM (Remediation Slot)',
  '2:00 PM - 3:00 PM (Remediation Slot)',
];

const SCHEDULE_VENUES = [
  'TLE Laboratory / Workshop Room',
  'ICT Computer Laboratory',
  'Cookery / FCS Kitchen Laboratory',
  'Industrial Arts (IA) Shop',
  'Agri-Fishery Arts (AFA) Area',
  'Designated Section Classroom',
];

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
  
  // Proposed Session Schedule Dropdown States
  const [scheduleDay, setScheduleDay] = useState(SCHEDULE_DAYS[0]);
  const [scheduleTime, setScheduleTime] = useState(SCHEDULE_TIMES[0]);
  const [scheduleVenue, setScheduleVenue] = useState(SCHEDULE_VENUES[0]);
  
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!lastName.trim() || !firstName.trim()) {
      setError('Student Last name and First name are required.');
      return;
    }

    const combinedSchedule = `${scheduleDay}, ${scheduleTime} (${scheduleVenue})`;

    onEnrollStudent({
      lastName: lastName.trim(),
      firstName: firstName.trim(),
      middleInitial: middleInitial.trim().toUpperCase(),
      gradeLevel,
      section: section.trim(),
      subject: subject.trim(),
      programType,
      baselineScore: Number(baselineScore),
      focusTopic: '', // Target topic is now identified per remedial session
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

          {/* Parent Communication & Details */}
          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <FileText className="w-4 h-4 text-amber-700" />
              <span>Parent / Guardian & Proposed Schedule (For Communication Letter)</span>
            </div>

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

            {/* Structured Schedule Dropdowns */}
            <div className="pt-2 border-t border-amber-200/60 space-y-2.5">
              <span className="block text-[11px] font-bold text-amber-950 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                Proposed Session Schedule & Venue Selection
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Session Day(s)
                  </label>
                  <select
                    value={scheduleDay}
                    onChange={(e) => setScheduleDay(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium cursor-pointer"
                  >
                    {SCHEDULE_DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Session Time Slot
                  </label>
                  <select
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium cursor-pointer"
                  >
                    {SCHEDULE_TIMES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    Venue / Room
                  </label>
                  <select
                    value={scheduleVenue}
                    onChange={(e) => setScheduleVenue(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium cursor-pointer"
                  >
                    {SCHEDULE_VENUES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Schedule Summary Preview Badge */}
              <div className="bg-amber-100/70 px-3 py-2 rounded-lg border border-amber-300/80 text-[11px] text-amber-950 font-medium flex items-center gap-2">
                <span className="font-bold text-amber-900 shrink-0">Schedule Preview:</span>
                <span className="truncate">{scheduleDay}, {scheduleTime} ({scheduleVenue})</span>
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


