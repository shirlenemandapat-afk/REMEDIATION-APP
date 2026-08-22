import React, { useState, useRef, useEffect } from 'react';
import {
  Student,
  SessionRecord,
  ActivityType,
  MOVAttachment,
  ProgramType,
  interpretMasteryLevel,
  ACTIVITY_DEFINITIONS,
  STRATEGY_DEFINITIONS,
} from '../types';
import {
  Calendar,
  FileText,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  X,
  AlertCircle,
  Paperclip,
  CheckSquare,
  Square,
  Award,
  BookOpen,
  Calculator,
  FileUp,
  Info,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { compressFileToDataUrl } from '../utils/fileCompressor';

interface AddSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onAddSession: (session: Omit<SessionRecord, 'id' | 'createdAt'>) => void;
  preSelectedStudentId?: string;
}

const QUICK_REMARK_TEMPLATES = [
  'Demonstrated solid mastery of learning competencies with minimal guidance.',
  'Accurately completed hands-on practical exercises within the allocated time.',
  'Showed marked improvement from baseline diagnostic; progressing well.',
  'Actively participated in remediation activities and answered formative questions correctly.',
  'Requires continued guided practice and reinforcement on key steps.',
];

export const AddSessionModal: React.FC<AddSessionModalProps> = ({
  isOpen,
  onClose,
  students,
  onAddSession,
  preSelectedStudentId,
}) => {
  const movFileInputRef = useRef<HTMLInputElement | null>(null);
  const toolFileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [focusCompetency, setFocusCompetency] = useState<string>('');

  // Multi-selection state
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>(['Remedial Hands-on Practice']);
  const [selectedInterventions, setSelectedInterventions] = useState<string[]>(['Task Simplification']);

  // Active tooltip state for hover/tap description preview
  const [activeTooltip, setActiveTooltip] = useState<{ title: string; desc: string; category?: string } | null>(null);

  // Score encoding
  const [rawScore, setRawScore] = useState<number>(18);
  const [totalItems, setTotalItems] = useState<number>(20);

  const [remarks, setRemarks] = useState<string>('');

  // Assessment / Intervention Tool upload
  const [assessmentTool, setAssessmentTool] = useState<MOVAttachment | undefined>(undefined);
  const [assessmentToolCaption, setAssessmentToolCaption] = useState<string>('');

  // Other MOVs
  const [movs, setMovs] = useState<MOVAttachment[]>([]);
  const [movCaption, setMovCaption] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isProcessingUpload, setIsProcessingUpload] = useState<boolean>(false);

  // Prioritize active students
  const activeStudents = students.filter((s) => !s.isArchived);
  const eligibleStudents = activeStudents.length > 0 ? activeStudents : students;

  // Synchronize student and form values when modal opens or preSelectedStudentId changes
  useEffect(() => {
    if (isOpen) {
      setError('');
      setDate(new Date().toISOString().split('T')[0]);

      let targetId = preSelectedStudentId;
      if (!targetId || !students.some((s) => s.id === targetId)) {
        targetId = eligibleStudents.length > 0 ? eligibleStudents[0].id : '';
      }

      if (targetId) {
        setSelectedStudentId(targetId);
        const st = students.find((s) => s.id === targetId);
        if (st) {
          setFocusCompetency(st.focusTopic || 'Target Learning Competency Mastery');
        }
      }
    }
  }, [isOpen, preSelectedStudentId, students]);

  if (!isOpen) return null;

  const currentStudent = students.find((s) => s.id === selectedStudentId);

  // Handle student dropdown change
  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    setError('');
    const st = students.find((s) => s.id === studentId);
    if (st && st.focusTopic) {
      setFocusCompetency(st.focusTopic);
    }
  };

  // Auto-calculated percentage and mastery level
  const validTotal = totalItems > 0 ? totalItems : 1;
  const calculatedPercentage = Math.min(100, Math.max(0, Math.round((rawScore / validTotal) * 100)));
  const masteryInterpretation = interpretMasteryLevel(calculatedPercentage);

  // Activity Type multi-select toggle
  const toggleActivityType = (act: string) => {
    setSelectedActivityTypes((prev) =>
      prev.includes(act)
        ? prev.length > 1
          ? prev.filter((a) => a !== act)
          : prev
        : [...prev, act]
    );
  };

  // Intervention strategy multi-select toggle
  const toggleIntervention = (strat: string) => {
    setSelectedInterventions((prev) =>
      prev.includes(strat)
        ? prev.length > 1
          ? prev.filter((s) => s !== strat)
          : prev
        : [...prev, strat]
    );
  };

  // Handle Assessment Tool Upload with compression
  const handleAssessmentToolUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingUpload(true);
      const dataUrl = await compressFileToDataUrl(file);
      const defaultCaption = assessmentToolCaption.trim() || `${file.name.replace(/\.[^/.]+$/, '')} Assessment Tool`;
      
      setAssessmentTool({
        id: `tool-${Date.now()}`,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'pdf',
        dataUrl,
        uploadedAt: date,
        caption: defaultCaption,
        isAssessmentTool: true,
      });

      if (!assessmentToolCaption.trim()) {
        setAssessmentToolCaption(defaultCaption);
      }
    } catch (err) {
      console.error('Error processing assessment tool upload:', err);
    } finally {
      setIsProcessingUpload(false);
      // Reset input value so same file can be re-uploaded if replaced
      if (e.target) e.target.value = '';
    }
  };

  // Handle MOVs File Upload with compression
  const handleMovUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsProcessingUpload(true);
      const fileList = Array.from(files) as File[];

      for (const file of fileList) {
        const dataUrl = await compressFileToDataUrl(file);
        const newMov: MOVAttachment = {
          id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'pdf',
          dataUrl,
          uploadedAt: date,
          caption: movCaption.trim() || `Classroom MOV for session on ${date}`,
        };
        setMovs((prev) => [...prev, newMov]);
      }
      setMovCaption('');
    } catch (err) {
      console.error('Error processing MOV upload:', err);
    } finally {
      setIsProcessingUpload(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Fallback student determination if state desynced
    const targetStudent = currentStudent || students.find((s) => s.id === selectedStudentId) || eligibleStudents[0];

    if (!targetStudent) {
      setError('Please select an enrolled student to log a session.');
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const effectiveCompetency = focusCompetency.trim() || targetStudent.focusTopic || 'Target Learning Competency Mastery';
    const effectiveActivities = selectedActivityTypes.length > 0 ? selectedActivityTypes : ['Remedial Hands-on Practice'];
    const effectiveInterventions = selectedInterventions.length > 0 ? selectedInterventions : ['Task Simplification'];

    const safeRaw = Number(rawScore) >= 0 ? Number(rawScore) : 0;
    const safeTotal = Number(totalItems) > 0 ? Number(totalItems) : 20;

    if (safeRaw > safeTotal) {
      setError(`Score earned (${safeRaw}) cannot exceed Total Items (${safeTotal}).`);
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Auto-generate remarks if blank
    const effectiveRemarks = remarks.trim() ||
      `Conducted session on ${effectiveCompetency}. Student scored ${safeRaw}/${safeTotal} (${calculatedPercentage}%) under ${targetStudent.programType} program.`;

    const formattedStudentName = `${targetStudent.lastName}, ${targetStudent.firstName} ${targetStudent.middleInitial || ''}`.trim();

    // Finalize assessment tool caption
    const finalizedAssessmentTool = assessmentTool
      ? {
          ...assessmentTool,
          caption: assessmentToolCaption.trim() || assessmentTool.caption || `${assessmentTool.name} Assessment Tool`,
        }
      : undefined;

    const allMovs = finalizedAssessmentTool ? [finalizedAssessmentTool, ...movs] : movs;

    // Call onAddSession
    onAddSession({
      studentId: targetStudent.id,
      studentName: formattedStudentName,
      gradeLevel: targetStudent.gradeLevel,
      section: targetStudent.section,
      subject: targetStudent.subject,
      programType: targetStudent.programType as ProgramType,
      date,
      focusCompetency: effectiveCompetency,
      activityType: effectiveActivities.join(' & '),
      activityTypes: effectiveActivities,
      intervention: effectiveInterventions.join('; '),
      interventions: effectiveInterventions,
      rawScore: safeRaw,
      totalItems: safeTotal,
      score: calculatedPercentage,
      masteryLevel: masteryInterpretation.level,
      remarks: effectiveRemarks,
      movs: allMovs,
      assessmentTool: finalizedAssessmentTool,
    });

    // Reset local transient form state
    setRemarks('');
    setMovs([]);
    setAssessmentTool(undefined);
    setAssessmentToolCaption('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 overflow-y-auto p-2 sm:p-4 md:p-6 flex justify-center items-start">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-100 my-2 sm:my-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Institutional Header Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-950 p-5 text-white flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400/20 border border-amber-400/40 rounded-xl">
              <FileText className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-400 text-emerald-950">
                  Project S.M.I.L.E.
                </span>
                <h3 className="font-extrabold text-base sm:text-lg">Log Daily Anecdotal Session</h3>
              </div>
              <p className="text-xs text-emerald-200">
                Record focus competency, multiple strategies, evaluation score, and assessment tool
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Active Info Tooltip Floating Box */}
          {activeTooltip && (
            <div className="p-3 bg-slate-900 text-white rounded-xl shadow-lg border border-amber-400/60 flex items-start justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-amber-300">{activeTooltip.title}</span>
                    {activeTooltip.category && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-white/10 rounded-sm text-slate-300">
                        {activeTooltip.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-200 mt-0.5 font-medium leading-relaxed">
                    {activeTooltip.desc}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTooltip(null)}
                className="text-white/60 hover:text-white p-1"
                title="Dismiss info"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Student Selection & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Enrolled Student <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedStudentId}
                onChange={(e) => handleStudentSelect(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                {students.length === 0 && <option value="">No students available</option>}
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.lastName}, {s.firstName} {s.middleInitial} ({s.gradeLevel} - {s.section} | {s.programType}) {s.isArchived ? '[Archived]' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Session Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Student Quick Information Banner */}
          {currentStudent && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] text-white ${
                    currentStudent.programType === 'Remediation' ? 'bg-amber-600' : 'bg-emerald-700'
                  }`}
                >
                  {currentStudent.programType}
                </span>
                <span className="text-emerald-950 font-bold">
                  {currentStudent.subject} &bull; {currentStudent.gradeLevel} ({currentStudent.section})
                </span>
              </div>
              <div className="text-emerald-900 font-semibold">
                Baseline Diagnostic: <strong className="text-emerald-950">{currentStudent.baselineScore}%</strong>
                <span className="ml-2 text-slate-500">| Status: <strong className="text-slate-700">{currentStudent.status}</strong></span>
              </div>
            </div>
          )}

          {/* REQUIREMENT 1: Focus Competency Per Session */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              Focus Learning Competency for this Session <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Constructing Orthographic Views (Top, Front, Right-Side Views)"
              value={focusCompetency}
              onChange={(e) => setFocusCompetency(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs"
            />
            <p className="text-[11px] text-slate-500">
              Specify the exact curriculum MELC or practical competency addressed during today's session.
            </p>
          </div>

          {/* REQUIREMENT 2: Activity Types with Descriptions & Hover Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Activity Types Conducted <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                  Hover ⓘ for guide
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700">
                ({selectedActivityTypes.length} selected)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {ACTIVITY_DEFINITIONS.map((def) => {
                const isSelected = selectedActivityTypes.includes(def.name);
                return (
                  <div
                    key={def.name}
                    className={`relative rounded-xl border p-2 text-xs transition flex items-center justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-800 text-yellow-300 border-emerald-700 shadow-xs ring-1 ring-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleActivityType(def.name)}
                      className="flex-1 flex items-center gap-2 text-left font-semibold cursor-pointer overflow-hidden"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate">{def.name}</span>
                    </button>

                    {/* Hover Info Tooltip Button */}
                    <button
                      type="button"
                      onMouseEnter={() =>
                        setActiveTooltip({
                          title: def.name,
                          desc: def.description,
                          category: def.category,
                        })
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTooltip({
                          title: def.name,
                          desc: def.description,
                          category: def.category,
                        });
                      }}
                      title={`${def.name}: ${def.description}`}
                      className={`p-1 rounded-full hover:scale-110 transition shrink-0 cursor-pointer ${
                        isSelected
                          ? 'text-yellow-200 hover:bg-emerald-700'
                          : 'text-slate-400 hover:text-emerald-700 hover:bg-slate-200'
                      }`}
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* REQUIREMENT 2 (cont.): Intervention & Teaching Strategies with Descriptions & Hover Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Intervention & Teaching Strategies Applied <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                  Hover ⓘ for guide
                </span>
              </div>
              <span className="text-[11px] font-semibold text-blue-700">
                ({selectedInterventions.length} selected)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {STRATEGY_DEFINITIONS.map((def) => {
                const isSelected = selectedInterventions.includes(def.name);
                return (
                  <div
                    key={def.name}
                    className={`relative rounded-xl border p-2 text-xs transition flex items-center justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-blue-800 text-blue-100 border-blue-700 shadow-xs ring-1 ring-blue-500'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleIntervention(def.name)}
                      className="flex-1 flex items-center gap-2 text-left font-semibold cursor-pointer overflow-hidden"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate">{def.name}</span>
                    </button>

                    {/* Hover Info Tooltip Button */}
                    <button
                      type="button"
                      onMouseEnter={() =>
                        setActiveTooltip({
                          title: def.name,
                          desc: def.description,
                          category: def.category,
                        })
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTooltip({
                          title: def.name,
                          desc: def.description,
                          category: def.category,
                        });
                      }}
                      title={`${def.name}: ${def.description}`}
                      className={`p-1 rounded-full hover:scale-110 transition shrink-0 cursor-pointer ${
                        isSelected
                          ? 'text-blue-200 hover:bg-blue-700'
                          : 'text-slate-400 hover:text-blue-700 hover:bg-slate-200'
                      }`}
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* REQUIREMENT 3: Evaluation / Mastery Level (Encode Score & Automatic Interpretation) */}
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-amber-700" />
                Encode Student Score & Automatic Mastery Interpretation
              </label>
              <span className="text-[11px] font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-md">
                DepEd Mastery Scale
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Raw Score Earned <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={totalItems}
                  value={rawScore}
                  onChange={(e) => setRawScore(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Total Items / Maximum Points <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={totalItems}
                  onChange={(e) => setTotalItems(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Real-time calculated mastery percentage & interpretation badge */}
              <div className="bg-white p-2.5 rounded-xl border border-amber-300 shadow-xs flex flex-col justify-center">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Calculated Mastery:</span>
                  <span className="text-lg font-black text-emerald-800">{calculatedPercentage}%</span>
                </div>
                <div className="mt-1">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border block text-center truncate ${masteryInterpretation.badgeColor}`}>
                    {masteryInterpretation.description}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* REQUIREMENT 4: Upload Assessment / Intervention Tool */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileUp className="w-4 h-4 text-emerald-700" />
                Upload Assessment / Intervention Tool Used
              </label>
              <span className="text-[11px] text-slate-500">
                (Worksheet, Quiz, Rubric, Diagnostic Tool)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Tool Description / Caption
                </label>
                <input
                  type="text"
                  placeholder="e.g. Graded Technical Drafting Rubric & Orthographic Task Sheet"
                  value={assessmentToolCaption}
                  onChange={(e) => setAssessmentToolCaption(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Attach Tool File (Image / PDF)
                </label>
                <input
                  type="file"
                  ref={toolFileInputRef}
                  onChange={handleAssessmentToolUpload}
                  accept="image/*,.pdf"
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isProcessingUpload}
                  onClick={() => toolFileInputRef.current?.click()}
                  className="w-full px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isProcessingUpload ? 'Optimizing...' : assessmentTool ? 'Replace Tool File' : 'Select Tool File'}
                </button>
              </div>
            </div>

            {/* Assessment Tool Preview */}
            {assessmentTool && (
              <div className="bg-emerald-50/80 border border-emerald-300 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-950 block truncate">{assessmentTool.name}</span>
                    <span className="text-[11px] text-emerald-800 block truncate">
                      Caption: {assessmentToolCaption || assessmentTool.caption}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAssessmentTool(undefined);
                    setAssessmentToolCaption('');
                  }}
                  className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Daily Anecdotal Remarks with Quick Suggestion Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                Anecdotal Remarks & Observational Notes <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Quick suggestions below
              </span>
            </div>

            <textarea
              required
              rows={3}
              placeholder="Record specific teacher observations (e.g. Student mastered orthographic projection rules, accurately sketched top and front views, scored 18/20 on formative task sheet...)"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
            />

            {/* Quick remark suggestion chips */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {QUICK_REMARK_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRemarks((prev) => (prev ? `${prev} ${tmpl}` : tmpl))}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 text-slate-600 rounded-lg text-[11px] font-medium transition border border-slate-200 hover:border-emerald-300 text-left cursor-pointer"
                >
                  + {tmpl}
                </button>
              ))}
            </div>
          </div>

          {/* Additional MOVs / Classroom Photos */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-slate-600" />
                Additional MOVs & Classroom Photos ({movs.length})
              </label>
              <input
                type="file"
                ref={movFileInputRef}
                onChange={handleMovUpload}
                accept="image/*,.pdf"
                multiple
                className="hidden"
              />
              <button
                type="button"
                disabled={isProcessingUpload}
                onClick={() => movFileInputRef.current?.click()}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                {isProcessingUpload ? 'Optimizing...' : 'Attach Photos'}
              </button>
            </div>

            {movs.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {movs.map((mov) => (
                  <div
                    key={mov.id}
                    className="relative bg-white border border-slate-200 rounded-xl p-1.5 flex flex-col items-center text-center shadow-xs"
                  >
                    {mov.type === 'image' && mov.dataUrl ? (
                      <img
                        src={mov.dataUrl}
                        alt={mov.name}
                        className="w-full h-16 object-cover rounded-lg mb-1 border border-slate-100"
                      />
                    ) : (
                      <div className="w-full h-16 bg-slate-100 rounded-lg mb-1 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                    <span className="text-[10px] font-semibold text-slate-700 truncate w-full">
                      {mov.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMovs((prev) => prev.filter((m) => m.id !== mov.id))}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white p-0.5 rounded-full shadow-xs transition cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Error Notification if any */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium">
              {currentStudent ? `Recording for: ${currentStudent.firstName} ${currentStudent.lastName}` : ''}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition shadow-md flex items-center gap-1.5 border border-emerald-600 cursor-pointer active:scale-95"
              >
                <CheckCircle className="w-4 h-4 text-amber-300" />
                Save Daily Session Record
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
