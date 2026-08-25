import React, { useState } from 'react';
import { Student, ProgramType } from '../types';
import { BookingDatePicker, BookingTimeInput } from './BookingSchedulePicker';
import { UserPlus, X, AlertCircle, FileText, Phone, User, Calendar, Clock, MapPin, Check, Sparkles, Plane, Building } from 'lucide-react';

interface EnrollStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnrollStudent: (student: Omit<Student, 'id' | 'enrolledDate' | 'status'>) => void;
}

const SCHEDULE_PRESET_DAYS = [
  { label: 'Tue & Thu', value: 'Every Tuesday & Thursday' },
  { label: 'Mon & Wed', value: 'Every Monday & Wednesday' },
  { label: 'Every Friday', value: 'Every Friday' },
  { label: 'Daily (Mon-Fri)', value: 'Every Monday to Friday' },
  { label: 'Saturday Catch-up', value: 'Every Saturday (Catch-up / Enhancement)' },
];

const WEEKDAYS = [
  { key: 'Mon', label: 'Monday' },
  { key: 'Tue', label: 'Tuesday' },
  { key: 'Wed', label: 'Wednesday' },
  { key: 'Thu', label: 'Thursday' },
  { key: 'Fri', label: 'Friday' },
  { key: 'Sat', label: 'Saturday' },
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
  
  // Booking-style schedule states
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Tuesday', 'Thursday']);
  const [scheduleDayText, setScheduleDayText] = useState('Every Tuesday & Thursday');
  const [startTime, setStartTime] = useState('03:30 PM');
  const [endTime, setEndTime] = useState('04:45 PM');
  const [scheduleVenue, setScheduleVenue] = useState(SCHEDULE_VENUES[0]);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleDay = (dayName: string) => {
    let updated: string[];
    if (selectedDays.includes(dayName)) {
      if (selectedDays.length === 1) return; // keep at least 1 day
      updated = selectedDays.filter((d) => d !== dayName);
    } else {
      updated = [...selectedDays, dayName];
    }
    setSelectedDays(updated);
    if (updated.length === 6) {
      setScheduleDayText('Every Monday to Saturday');
    } else if (updated.length === 5 && !updated.includes('Saturday')) {
      setScheduleDayText('Every Monday to Friday');
    } else {
      setScheduleDayText(`Every ${updated.join(' & ')}`);
    }
  };

  const handleApplyPreset = (presetValue: string, daysArray: string[]) => {
    setScheduleDayText(presetValue);
    setSelectedDays(daysArray);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!lastName.trim() || !firstName.trim()) {
      setError('Student Last name and First name are required.');
      return;
    }

    const formattedTimeSlot = `${startTime} - ${endTime}`;
    const combinedSchedule = `${scheduleDayText}, ${formattedTimeSlot} (${scheduleVenue})`;

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

            {/* Booking-Style Proposed Schedule & Venue Selection */}
            <div className="pt-3 border-t border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                  <Plane className="w-4 h-4 text-amber-700" />
                  Proposed Remediation Session & Schedule (Booking Style)
                </span>
                <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                  DepEd Schedule
                </span>
              </div>

              {/* 1. Date Selection (Booking Style Calendar / Effective Start Date) */}
              <div className="bg-white p-3 rounded-xl border border-amber-300 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-100 text-amber-900 rounded-lg">
                      <Calendar className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Effective Start Date
                      </span>
                      <span className="text-xs font-extrabold text-emerald-950">
                        {new Date(startDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCalendarPicker(!showCalendarPicker)}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-700" />
                    <span>{showCalendarPicker ? 'Hide Calendar' : 'Change Date'}</span>
                  </button>
                </div>

                {/* Inline Booking Calendar when toggled */}
                {showCalendarPicker && (
                  <div className="pt-2 border-t border-slate-100 animate-in fade-in duration-150">
                    <BookingDatePicker
                      label="Select Program Start / Launch Date"
                      selectedDate={startDate}
                      onSelectDate={(d) => {
                        setStartDate(d);
                        setShowCalendarPicker(false);
                      }}
                    />
                  </div>
                )}

                {/* Quick Date Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-400">Quick Start:</span>
                  <button
                    type="button"
                    onClick={() => setStartDate(todayStr)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                      startDate === todayStr
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      const day = d.getDay();
                      const diff = d.getDate() + ((1 + 7 - day) % 7 || 7);
                      const nextMon = new Date(d.setDate(diff)).toISOString().split('T')[0];
                      setStartDate(nextMon);
                    }}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] font-bold transition cursor-pointer"
                  >
                    Next Monday
                  </button>
                </div>
              </div>

              {/* 2. Recurring Days (Booking System Style Day Chips) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>Recurring Session Days</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {scheduleDayText}
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {SCHEDULE_PRESET_DAYS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        if (preset.label === 'Tue & Thu') handleApplyPreset(preset.value, ['Tuesday', 'Thursday']);
                        else if (preset.label === 'Mon & Wed') handleApplyPreset(preset.value, ['Monday', 'Wednesday']);
                        else if (preset.label === 'Every Friday') handleApplyPreset(preset.value, ['Friday']);
                        else if (preset.label.includes('Daily')) handleApplyPreset(preset.value, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
                        else if (preset.label.includes('Saturday')) handleApplyPreset(preset.value, ['Saturday']);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer border ${
                        scheduleDayText === preset.value
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Individual Day Chips */}
                <div className="grid grid-cols-6 gap-1.5 pt-1">
                  {WEEKDAYS.map((w) => {
                    const isSelected = selectedDays.includes(w.label);
                    return (
                      <button
                        key={w.key}
                        type="button"
                        onClick={() => toggleDay(w.label)}
                        className={`py-1.5 px-1 rounded-lg text-xs font-extrabold text-center transition cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                        title={`Toggle ${w.label}`}
                      >
                        {w.key}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Time Selection (_ _:_ _ with A.M. / P.M. Dropdown for Start & End) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/90 space-y-2">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Session Time Slot</span>
                </label>

                <div className="flex flex-wrap items-center gap-3 pt-0.5">
                  <div>
                    <BookingTimeInput
                      label="Start Time"
                      value={startTime}
                      onChange={(val) => setStartTime(val)}
                    />
                  </div>

                  <span className="text-slate-400 font-extrabold text-xs mt-4 select-none">to</span>

                  <div>
                    <BookingTimeInput
                      label="End Time"
                      value={endTime}
                      onChange={(val) => setEndTime(val)}
                    />
                  </div>
                </div>
              </div>

              {/* 4. Venue Selection */}
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

              {/* 5. Booking Boarding Pass / Itinerary Summary Card */}
              <div className="bg-gradient-to-r from-amber-50 via-emerald-50/50 to-amber-50 p-3 rounded-xl border-2 border-dashed border-amber-400 text-xs space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-amber-900">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Official Schedule Itinerary
                  </span>
                  <span>RMCHS DepEd S.M.I.L.E.</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div>
                    <span className="block text-[10px] text-slate-500 font-semibold">Session Day(s):</span>
                    <strong className="text-emerald-950 text-xs">{scheduleDayText}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 font-semibold">Time Schedule:</span>
                    <strong className="text-amber-900 text-xs font-mono">{startTime} – {endTime}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 font-semibold">Venue / Room:</span>
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


