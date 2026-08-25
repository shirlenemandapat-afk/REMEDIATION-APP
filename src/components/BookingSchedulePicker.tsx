import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Check } from 'lucide-react';

export const DEPED_TEACHER_POSITIONS = [
  'Teacher I',
  'Teacher II',
  'Teacher III',
  'Teacher IV',
  'Teacher V',
  'Teacher VI',
  'Master Teacher I',
  'Master Teacher II',
  'Master Teacher III',
  'Master Teacher IV',
  'Head Teacher I',
  'Head Teacher II',
  'Head Teacher III',
  'Head Teacher IV',
  'Head Teacher V',
  'Head Teacher VI',
  'Principal I',
  'Principal II',
  'Principal III',
  'Principal IV',
] as const;

export type DepEdPosition = (typeof DEPED_TEACHER_POSITIONS)[number];

/* =========================================================================
   1. BOOKING TIME INPUT (_ _ : _ _ with A.M. / P.M. Dropdown)
   ========================================================================= */

interface BookingTimeInputProps {
  label?: string;
  value?: string; // e.g. "03:30 PM" or "15:30"
  onChange: (formattedTime: string) => void;
  className?: string;
}

export const BookingTimeInput: React.FC<BookingTimeInputProps> = ({
  label,
  value = '03:30 PM',
  onChange,
  className = '',
}) => {
  // Parse initial value
  const parseTime = (timeStr: string) => {
    let hour = '03';
    let minute = '30';
    let period = 'PM';

    if (timeStr) {
      const match12 = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM|A\.M\.|P\.M\.)?/i);
      if (match12) {
        hour = match12[1].padStart(2, '0');
        minute = match12[2];
        if (match12[3]) {
          period = match12[3].toUpperCase().includes('A') ? 'AM' : 'PM';
        }
      } else {
        const match24 = timeStr.match(/(\d{1,2}):(\d{2})/);
        if (match24) {
          const hNum = parseInt(match24[1], 10);
          minute = match24[2];
          if (hNum >= 12) {
            period = 'PM';
            hour = hNum === 12 ? '12' : (hNum - 12).toString().padStart(2, '0');
          } else {
            period = 'AM';
            hour = hNum === 0 ? '12' : hNum.toString().padStart(2, '0');
          }
        }
      }
    }
    return { hour, minute, period };
  };

  const initial = parseTime(value);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initial.period as 'AM' | 'PM');

  const minuteInputRef = useRef<HTMLInputElement>(null);

  // Sync from props if external value changes drastically
  useEffect(() => {
    const parsed = parseTime(value);
    setHour(parsed.hour);
    setMinute(parsed.minute);
    setPeriod(parsed.period as 'AM' | 'PM');
  }, [value]);

  const emitChange = (h: string, m: string, p: 'AM' | 'PM') => {
    const safeH = h.padStart(2, '0');
    const safeM = m.padStart(2, '0');
    onChange(`${safeH}:${safeM} ${p}`);
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (val) {
      const num = parseInt(val, 10);
      if (num > 12) val = '12';
      if (num === 0 && val.length === 2) val = '01';
    }
    setHour(val);
    emitChange(val || '00', minute || '00', period);

    // Auto-advance to minute input if 2 digits entered or single digit > 1
    if (val.length === 2 || (val.length === 1 && parseInt(val, 10) > 1)) {
      minuteInputRef.current?.focus();
      minuteInputRef.current?.select();
    }
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (val) {
      const num = parseInt(val, 10);
      if (num > 59) val = '59';
    }
    setMinute(val);
    emitChange(hour || '00', val || '00', period);
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const p = e.target.value as 'AM' | 'PM';
    setPeriod(p);
    emitChange(hour || '00', minute || '00', p);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-700" />
          <span>{label}</span>
        </label>
      )}

      {/* Booking Style _ _ : _ _ Container */}
      <div className="inline-flex items-center bg-white border border-slate-300 hover:border-amber-500 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl p-1 shadow-2xs transition-all">
        {/* Hour _ _ */}
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            placeholder="__"
            value={hour}
            onChange={handleHourChange}
            onBlur={() => {
              if (hour) {
                const safe = Math.min(12, Math.max(1, parseInt(hour, 10) || 1)).toString().padStart(2, '0');
                setHour(safe);
                emitChange(safe, minute || '00', period);
              } else {
                setHour('03');
                emitChange('03', minute || '00', period);
              }
            }}
            className="w-9 h-8 text-center text-xs font-mono font-extrabold text-slate-900 bg-slate-50 hover:bg-white rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            title="Hour (01-12)"
          />
        </div>

        <span className="px-1 text-slate-400 font-mono font-black text-xs select-none">:</span>

        {/* Minute _ _ */}
        <div className="relative">
          <input
            ref={minuteInputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            placeholder="__"
            value={minute}
            onChange={handleMinuteChange}
            onBlur={() => {
              if (minute) {
                const safe = Math.min(59, Math.max(0, parseInt(minute, 10) || 0)).toString().padStart(2, '0');
                setMinute(safe);
                emitChange(hour || '03', safe, period);
              } else {
                setMinute('00');
                emitChange(hour || '03', '00', period);
              }
            }}
            className="w-9 h-8 text-center text-xs font-mono font-extrabold text-slate-900 bg-slate-50 hover:bg-white rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            title="Minute (00-59)"
          />
        </div>

        {/* A.M. / P.M. Dropdown Box */}
        <div className="ml-1.5 pl-1.5 border-l border-slate-200">
          <select
            value={period}
            onChange={handlePeriodChange}
            className="h-8 px-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-lg text-xs font-extrabold cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="AM">A.M.</option>
            <option value="PM">P.M.</option>
          </select>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   2. BOOKING TIME RANGE PICKER (Start Time _ _:_ _ to End Time _ _:_ _)
   ========================================================================= */

interface BookingTimeRangeInputProps {
  label?: string;
  startTime?: string;
  endTime?: string;
  onChange: (rangeStr: string, start: string, end: string) => void;
}

export const BookingTimeRangeInput: React.FC<BookingTimeRangeInputProps> = ({
  label = 'Session Time Range',
  startTime = '03:30 PM',
  endTime = '04:45 PM',
  onChange,
}) => {
  const [start, setStart] = useState(startTime);
  const [end, setEnd] = useState(endTime);

  const handleStartChange = (newStart: string) => {
    setStart(newStart);
    onChange(`${newStart} - ${end}`, newStart, end);
  };

  const handleEndChange = (newEnd: string) => {
    setEnd(newEnd);
    onChange(`${start} - ${newEnd}`, start, newEnd);
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
        <Clock className="w-3.5 h-3.5 text-amber-700" />
        <span>{label}</span>
      </label>

      <div className="flex flex-wrap items-center gap-3 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200">
        <div>
          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Start Time</span>
          <BookingTimeInput value={start} onChange={handleStartChange} />
        </div>

        <span className="text-slate-400 font-bold text-xs mt-3 select-none">to</span>

        <div>
          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">End Time</span>
          <BookingTimeInput value={end} onChange={handleEndChange} />
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   3. BOOKING-STYLE DATE & RECURRING SCHEDULE PICKER (HOTEL/FLIGHT STYLE)
   ========================================================================= */

interface BookingDatePickerProps {
  label?: string;
  selectedDate?: string; // YYYY-MM-DD
  endDate?: string;
  onSelectDate: (dateStr: string) => void;
  onSelectEndDate?: (dateStr: string) => void;
  isRangeMode?: boolean;
}

export const BookingDatePicker: React.FC<BookingDatePickerProps> = ({
  label = 'Select Session Date',
  selectedDate = new Date().toISOString().split('T')[0],
  endDate,
  onSelectDate,
  onSelectEndDate,
  isRangeMode = false,
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = selectedDate ? new Date(selectedDate) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onSelectDate(formatted);
  };

  const isSelected = (day: number) => {
    const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return formatted === selectedDate;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  return (
    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-800 block leading-tight">{label}</span>
            <span className="text-[10px] text-emerald-800 font-extrabold">
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 hover:bg-white text-slate-700 rounded-lg transition cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-bold text-slate-800 px-2 min-w-[105px] text-center">
            {monthNames[month]} {year}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 hover:bg-white text-slate-700 rounded-lg transition cursor-pointer"
            title="Next Month"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-slate-100 rounded-xl p-2 bg-slate-50/50">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
            <div
              key={d}
              className={`text-[10px] font-extrabold py-0.5 ${
                i === 0 || i === 6 ? 'text-amber-700' : 'text-slate-500'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days Cells */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for leading offset */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="h-7" />
          ))}

          {/* Actual Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const selected = isSelected(day);
            const current = isToday(day);

            return (
              <button
                key={`day-${day}`}
                type="button"
                onClick={() => handleDateClick(day)}
                className={`h-7 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer relative ${
                  selected
                    ? 'bg-emerald-700 text-white shadow-xs scale-105 ring-2 ring-emerald-500/40'
                    : current
                    ? 'bg-amber-100 text-amber-900 font-extrabold border border-amber-300 hover:bg-amber-200'
                    : 'hover:bg-slate-200 text-slate-700 bg-white'
                }`}
              >
                <span>{day}</span>
                {current && !selected && (
                  <span className="absolute bottom-0.5 w-1 h-1 bg-amber-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Booking Quick Presets */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[10px] font-bold text-slate-500">Quick Select:</span>
        <button
          type="button"
          onClick={() => onSelectDate(new Date().toISOString().split('T')[0])}
          className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-md text-[10px] font-bold transition cursor-pointer"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => {
            const tm = new Date();
            tm.setDate(tm.getDate() + 1);
            onSelectDate(tm.toISOString().split('T')[0]);
          }}
          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-md text-[10px] font-bold transition cursor-pointer"
        >
          Tomorrow
        </button>
        <button
          type="button"
          onClick={() => {
            const d = new Date();
            const day = d.getDay();
            const diff = d.getDate() + ((1 + 7 - day) % 7 || 7);
            const nextMon = new Date(d.setDate(diff));
            onSelectDate(nextMon.toISOString().split('T')[0]);
          }}
          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-md text-[10px] font-bold transition cursor-pointer"
        >
          Next Monday
        </button>
      </div>
    </div>
  );
};

/* =========================================================================
   4. DEPED FACULTY POSITION SELECT COMPONENT (TEACHER I-VI, MT I-II, P I-IV)
   ========================================================================= */

interface TeacherPositionSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
}

export const TeacherPositionSelect: React.FC<TeacherPositionSelectProps> = ({
  value,
  onChange,
  label = 'Position / Faculty Rank',
  required = false,
  className = '',
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <select
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer shadow-2xs"
      >
        <option value="" disabled>-- Select DepEd Position / Rank --</option>
        
        <optgroup label="👨‍🏫 Regular Teaching Faculty (Teacher I - VI)">
          <option value="Teacher I">Teacher I</option>
          <option value="Teacher II">Teacher II</option>
          <option value="Teacher III">Teacher III</option>
          <option value="Teacher IV">Teacher IV</option>
          <option value="Teacher V">Teacher V</option>
          <option value="Teacher VI">Teacher VI</option>
        </optgroup>

        <optgroup label="🌟 Master Teachers (Master Teacher I - IV)">
          <option value="Master Teacher I">Master Teacher I</option>
          <option value="Master Teacher II">Master Teacher II</option>
          <option value="Master Teacher III">Master Teacher III</option>
          <option value="Master Teacher IV">Master Teacher IV</option>
        </optgroup>

        <optgroup label="🏛️ Head Teachers (Head Teacher I - VI)">
          <option value="Head Teacher I">Head Teacher I</option>
          <option value="Head Teacher II">Head Teacher II</option>
          <option value="Head Teacher III">Head Teacher III</option>
          <option value="Head Teacher IV">Head Teacher IV</option>
          <option value="Head Teacher V">Head Teacher V</option>
          <option value="Head Teacher VI">Head Teacher VI</option>
        </optgroup>

        <optgroup label="🏫 Principals & School Heads (Principal I - IV)">
          <option value="Principal I">Principal I</option>
          <option value="Principal II">Principal II</option>
          <option value="Principal III">Principal III</option>
          <option value="Principal IV">Principal IV</option>
        </optgroup>
      </select>
    </div>
  );
};
