import React, { useState, useRef, useEffect } from 'react';
import {
  Student,
  SessionRecord,
  MOVAttachment,
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
  Sparkles,
  Save,
  Trash2,
  Clock,
  Eye,
  History,
  User,
  ChevronRight,
} from 'lucide-react';
import { compressFileToDataUrl } from '../utils/fileCompressor';

interface EditSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionRecord | null;
  students: Student[];
  allSessions?: SessionRecord[];
  onUpdateSession: (updatedSession: SessionRecord) => void;
  onDeleteSession?: (sessionId: string) => void;
  onViewMOV?: (url: string, title: string) => void;
}

const QUICK_REMARK_TEMPLATES = [
  'Demonstrated solid mastery of learning competencies with minimal guidance.',
  'Accurately completed hands-on practical exercises within the allocated time.',
  'Showed marked improvement from baseline diagnostic; progressing well.',
  'Actively participated in remediation activities and answered formative questions correctly.',
  'Requires continued guided practice and reinforcement on key steps.',
  'Successfully caught up on missed competency through 1-on-1 scaffolding.',
];

export const EditSessionModal: React.FC<EditSessionModalProps> = ({
  isOpen,
  onClose,
  session,
  students,
  allSessions = [],
  onUpdateSession,
  onDeleteSession,
  onViewMOV,
}) => {
  const movFileInputRef = useRef<HTMLInputElement | null>(null);
  const toolFileInputRef = useRef<HTMLInputElement | null>(null);

  // Active session being edited
  const [currentSession, setCurrentSession] = useState<SessionRecord | null>(session);

  const [date, setDate] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [focusCompetency, setFocusCompetency] = useState<string>('');

  // Multi-selection state
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>([]);
  const [selectedInterventions, setSelectedInterventions] = useState<string[]>([]);

  // Custom encoded 'Others' inputs for Activity Types and Interventions
  const [otherActivityText, setOtherActivityText] = useState<string>('');
  const [otherActivityChecked, setOtherActivityChecked] = useState<boolean>(false);

  const [otherStrategyText, setOtherStrategyText] = useState<string>('');
  const [otherStrategyChecked, setOtherStrategyChecked] = useState<boolean>(false);

  // Score encoding
  const [rawScore, setRawScore] = useState<number>(0);
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
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);
  const [isConfirmDelete, setIsConfirmDelete] = useState<boolean>(false);

  // Load a session record into the form
  const loadSessionData = (sess: SessionRecord) => {
    setCurrentSession(sess);
    setSelectedStudentId(sess.studentId);
    setDate(sess.date || new Date().toISOString().split('T')[0]);
    setFocusCompetency(sess.focusCompetency || '');

    // Load activity types
    const actList = sess.activityTypes && sess.activityTypes.length > 0
      ? sess.activityTypes
      : sess.activityType
      ? [sess.activityType]
      : ['Remedial Hands-on Practice'];
    
    const predefinedActNames = ACTIVITY_DEFINITIONS.map((a) => a.name);
    const matchedActs: string[] = [];
    let customAct = '';

    actList.forEach((act) => {
      if (predefinedActNames.includes(act)) {
        matchedActs.push(act);
      } else {
        // Strip leading 'Others: ' or 'OTHERS: ' if present
        const clean = act.replace(/^others:\s*/i, '').trim();
        if (clean) {
          customAct = clean;
        }
      }
    });

    setSelectedActivityTypes(matchedActs.length > 0 ? matchedActs : (customAct ? [] : [predefinedActNames[0]]));
    if (customAct) {
      setOtherActivityChecked(true);
      setOtherActivityText(customAct);
    } else {
      setOtherActivityChecked(false);
      setOtherActivityText('');
    }

    // Load interventions
    const intList = sess.interventions && sess.interventions.length > 0
      ? sess.interventions
      : sess.intervention
      ? [sess.intervention]
      : ['Task Simplification'];

    const predefinedIntNames = STRATEGY_DEFINITIONS.map((s) => s.name);
    const matchedInts: string[] = [];
    let customInt = '';

    intList.forEach((it) => {
      if (predefinedIntNames.includes(it)) {
        matchedInts.push(it);
      } else {
        // Strip leading 'Others: ' or 'OTHERS: ' if present
        const clean = it.replace(/^others:\s*/i, '').trim();
        if (clean) {
          customInt = clean;
        }
      }
    });

    setSelectedInterventions(matchedInts.length > 0 ? matchedInts : (customInt ? [] : [predefinedIntNames[0]]));
    if (customInt) {
      setOtherStrategyChecked(true);
      setOtherStrategyText(customInt);
    } else {
      setOtherStrategyChecked(false);
      setOtherStrategyText('');
    }

    // Load scores
    const tot = Number(sess.totalItems) > 0 ? Number(sess.totalItems) : 20;
    setTotalItems(tot);
    const raw = sess.rawScore !== undefined ? Number(sess.rawScore) : Math.round((Number(sess.score) / 100) * tot);
    setRawScore(raw);

    setRemarks(sess.remarks || '');
    setAssessmentTool(sess.assessmentTool);
    setAssessmentToolCaption(sess.assessmentTool?.caption || '');
    setMovs(Array.isArray(sess.movs) ? sess.movs : []);
    setMovCaption('');
    setError('');
    setSavedFeedback(false);
    setIsConfirmDelete(false);
  };

  // Synchronize when prop `session` changes
  useEffect(() => {
    if (session) {
      loadSessionData(session);
    }
  }, [session, isOpen]);

  if (!isOpen || !currentSession) return null;

  const currentStudent = students.find((s) => s.id === (selectedStudentId || currentSession.studentId));

  // Find all previously logged sessions for this student
  const studentPreviousSessions = allSessions
    .filter((s) => s.studentId === currentSession.studentId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Derived Score Calculations
  const validTotal = Math.max(1, totalItems);
  const clampedRaw = Math.min(validTotal, Math.max(0, rawScore));
  const calculatedPercentage = Math.round((clampedRaw / validTotal) * 100);
  const masteryInterpretation = interpretMasteryLevel(calculatedPercentage);

  // Toggle Activity Types
  const toggleActivityType = (act: string) => {
    setSelectedActivityTypes((prev) => {
      if (prev.includes(act)) {
        if (prev.length > 1 || otherActivityChecked || otherActivityText.trim()) {
          return prev.filter((a) => a !== act);
        }
        return prev;
      }
      return [...prev, act];
    });
  };

  // Toggle Interventions
  const toggleIntervention = (strat: string) => {
    setSelectedInterventions((prev) => {
      if (prev.includes(strat)) {
        if (prev.length > 1 || otherStrategyChecked || otherStrategyText.trim()) {
          return prev.filter((s) => s !== strat);
        }
        return prev;
      }
      return [...prev, strat];
    });
  };

  // Assessment Tool File Upload Handler
  const handleToolFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingUpload(true);
    setError('');

    try {
      const dataUrl = await compressFileToDataUrl(file);
      setAssessmentTool({
        id: `tool-${Date.now()}`,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        dataUrl,
        caption: assessmentToolCaption.trim() || file.name,
        uploadedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      setError(err?.message || 'Error processing assessment tool file.');
    } finally {
      setIsProcessingUpload(false);
      if (toolFileInputRef.current) toolFileInputRef.current.value = '';
    }
  };

  // MOV Upload Handler
  const handleMovFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingUpload(true);
    setError('');

    try {
      const newAttachments: MOVAttachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dataUrl = await compressFileToDataUrl(file);
        newAttachments.push({
          id: `mov-${Date.now()}-${i}`,
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'document',
          dataUrl,
          caption: movCaption.trim() || file.name,
          uploadedAt: new Date().toISOString(),
        });
      }
      setMovs((prev) => [...prev, ...newAttachments]);
      setMovCaption('');
    } catch (err: any) {
      setError(err?.message || 'Error processing MOV file attachment.');
    } finally {
      setIsProcessingUpload(false);
      if (movFileInputRef.current) movFileInputRef.current.value = '';
    }
  };

  const handleRemoveMov = (movId: string) => {
    setMovs((prev) => prev.filter((m) => m.id !== movId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!focusCompetency.trim()) {
      setError('Please provide the Focus Competency / Topic for this session.');
      return;
    }

    const formatCustomEntry = (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return '';
      return trimmed.toLowerCase().startsWith('others:') ? trimmed : `Others: ${trimmed}`;
    };

    const finalActivities = [...selectedActivityTypes];
    if (otherActivityText.trim()) {
      const formatted = formatCustomEntry(otherActivityText.trim());
      if (!finalActivities.includes(formatted)) {
        finalActivities.push(formatted);
      }
    }

    if (finalActivities.length === 0) {
      setError('Please select at least one Remediation Activity Type or encode a custom activity.');
      return;
    }

    const finalInterventions = [...selectedInterventions];
    if (otherStrategyText.trim()) {
      const formatted = formatCustomEntry(otherStrategyText.trim());
      if (!finalInterventions.includes(formatted)) {
        finalInterventions.push(formatted);
      }
    }

    if (finalInterventions.length === 0) {
      setError('Please select at least one Specific Intervention Applied or encode a custom strategy.');
      return;
    }

    // Determine target student info
    const targetStudent = students.find((s) => s.id === selectedStudentId) || currentStudent;
    const studentName = targetStudent
      ? `${targetStudent.lastName}, ${targetStudent.firstName} ${targetStudent.middleInitial || ''}`.trim()
      : currentSession.studentName;

    const updatedSession: SessionRecord = {
      ...currentSession,
      studentId: targetStudent ? targetStudent.id : currentSession.studentId,
      studentName,
      gradeLevel: targetStudent ? targetStudent.gradeLevel : currentSession.gradeLevel,
      section: targetStudent ? targetStudent.section : currentSession.section,
      subject: targetStudent ? targetStudent.subject : currentSession.subject,
      programType: targetStudent ? targetStudent.programType : currentSession.programType,
      date,
      focusCompetency: focusCompetency.trim(),
      activityType: finalActivities[0] as any,
      activityTypes: finalActivities,
      intervention: finalInterventions[0] as any,
      interventions: finalInterventions,
      rawScore: clampedRaw,
      totalItems: validTotal,
      score: calculatedPercentage,
      masteryLevel: masteryInterpretation.level,
      remarks: remarks.trim(),
      assessmentTool: assessmentTool
        ? { ...assessmentTool, caption: assessmentToolCaption.trim() || assessmentTool.caption || assessmentTool.name }
        : undefined,
      movs,
    };

    onUpdateSession(updatedSession);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 450);
  };

  const handleDelete = () => {
    if (onDeleteSession && currentSession) {
      onDeleteSession(currentSession.id);
      
      // If there are other sessions for this student, switch to the next one; otherwise close
      const remaining = studentPreviousSessions.filter((s) => s.id !== currentSession.id);
      if (remaining.length > 0) {
        loadSessionData(remaining[0]);
      } else {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 overflow-y-auto p-2 sm:p-4 md:p-6 flex justify-center items-start">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200 my-2 sm:my-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-950 p-5 text-white flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400/20 text-amber-300 rounded-2xl border border-amber-400/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white font-serif tracking-wide">
                  Edit Previously Logged Session
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-emerald-950">
                  {currentSession.programType || 'Remediation'}
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                Student: <span className="font-bold text-yellow-300">{currentSession.studentName}</span> ({currentSession.gradeLevel} - {currentSession.section} &bull; {currentSession.subject})
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

        {/* Previously Logged Sessions History Switcher Banner */}
        {studentPreviousSessions.length > 1 && (
          <div className="bg-amber-50/80 border-b border-amber-200 p-3 px-5 sm:px-6">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <History className="w-4 h-4 text-amber-700" />
                Previously Logged Sessions for this Student ({studentPreviousSessions.length})
              </span>
              <span className="text-[11px] text-amber-800 font-semibold">
                Click any session below to edit it:
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {studentPreviousSessions.map((pastSess, idx) => {
                const isSelected = pastSess.id === currentSession.id;
                const pastMastery = interpretMasteryLevel(pastSess.score);
                return (
                  <button
                    key={pastSess.id}
                    type="button"
                    onClick={() => loadSessionData(pastSess)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 border cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-800 text-yellow-300 border-emerald-900 shadow-xs'
                        : 'bg-white hover:bg-amber-100 text-slate-800 border-amber-300'
                    }`}
                  >
                    <Calendar className={`w-3 h-3 ${isSelected ? 'text-amber-300' : 'text-slate-500'}`} />
                    <span>{pastSess.date}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] ${isSelected ? 'bg-amber-400 text-emerald-950' : 'bg-slate-100 text-slate-700'}`}>
                      {pastSess.score}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              {error}
            </div>
          )}

          {savedFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-extrabold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              Session updated and synchronized across devices successfully!
            </div>
          )}

          {/* Section 1: Session Date & Focus Competency */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4 relative">
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                Session Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-2xs"
                />
              </div>
            </div>

            <div className="sm:col-span-8">
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Focus Competency / Learning Gap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Drafting Orthographic Projections & Dimensioning"
                value={focusCompetency}
                onChange={(e) => setFocusCompetency(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-2xs"
              />
            </div>
          </div>

          {/* Section 2: Activity Types (Multi-select) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                Remediation / Enhancement Activity Types <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] font-semibold text-emerald-700">
                ({selectedActivityTypes.length + (otherActivityChecked || otherActivityText.trim() ? 1 : 0)} selected)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ACTIVITY_DEFINITIONS.map((def) => {
                const isSelected = selectedActivityTypes.includes(def.name);
                return (
                  <button
                    key={def.name}
                    type="button"
                    onClick={() => toggleActivityType(def.name)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition flex items-start gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-2xs ring-1 ring-emerald-500/30'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="block leading-tight">{def.name}</span>
                      <span className="block text-[10px] font-normal text-slate-500 leading-snug mt-0.5">
                        {def.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Other Activity */}
            <div
              className={`rounded-xl border p-3 transition-all ${
                otherActivityChecked || otherActivityText.trim()
                  ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={otherActivityChecked || !!otherActivityText.trim()}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setOtherActivityChecked(checked);
                      if (!checked) {
                        setOtherActivityText('');
                      }
                    }}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-emerald-950 font-black text-xs flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    OTHERS:
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600">
                    Encode Custom Activity Type
                  </span>
                </label>
                {(otherActivityChecked || otherActivityText.trim()) && (
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    Custom Activity Added
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Encode custom activity type (e.g. Diagnostic Speed Drill, Board Simulation, Multimedia Critique, etc.)"
                  value={otherActivityText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setOtherActivityText(val);
                    if (val.trim()) {
                      setOtherActivityChecked(true);
                    }
                  }}
                  onFocus={() => {
                    if (!otherActivityChecked) setOtherActivityChecked(true);
                  }}
                  className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs"
                />
                {otherActivityText && (
                  <button
                    type="button"
                    onClick={() => {
                      setOtherActivityText('');
                      setOtherActivityChecked(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title="Clear custom activity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Interventions Applied (Multi-select) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                Specific Interventions Applied <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] font-semibold text-amber-700">
                ({selectedInterventions.length + (otherStrategyChecked || otherStrategyText.trim() ? 1 : 0)} selected)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STRATEGY_DEFINITIONS.map((def) => {
                const isSelected = selectedInterventions.includes(def.name);
                return (
                  <button
                    key={def.name}
                    type="button"
                    onClick={() => toggleIntervention(def.name)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition flex items-start gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 border-amber-400 text-amber-950 shadow-2xs ring-1 ring-amber-500/30'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="block leading-tight">{def.name}</span>
                      <span className="block text-[10px] font-normal text-slate-500 leading-snug mt-0.5">
                        {def.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Other Strategy */}
            <div
              className={`rounded-xl border p-3 transition-all ${
                otherStrategyChecked || otherStrategyText.trim()
                  ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={otherStrategyChecked || !!otherStrategyText.trim()}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setOtherStrategyChecked(checked);
                      if (!checked) {
                        setOtherStrategyText('');
                      }
                    }}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-amber-950 font-black text-xs flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    OTHERS:
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600">
                    Encode Custom Intervention or Teaching Strategy
                  </span>
                </label>
                {(otherStrategyChecked || otherStrategyText.trim()) && (
                  <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                    Custom Strategy Added
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Encode custom strategy (e.g. Peer-Led Reciprocal Questioning, Kinesthetic Modeling, Mnemonics Drill, etc.)"
                  value={otherStrategyText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setOtherStrategyText(val);
                    if (val.trim()) {
                      setOtherStrategyChecked(true);
                    }
                  }}
                  onFocus={() => {
                    if (!otherStrategyChecked) setOtherStrategyChecked(true);
                  }}
                  className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
                />
                {otherStrategyText && (
                  <button
                    type="button"
                    onClick={() => {
                      setOtherStrategyText('');
                      setOtherStrategyChecked(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title="Clear custom strategy"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Formative Assessment Score & Mastery Interpretation */}
          <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-emerald-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold tracking-wide uppercase text-yellow-300 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-amber-400" />
                Formative Assessment & DepEd Mastery Rating
              </span>
              <span className="text-[11px] text-emerald-200 font-semibold">Auto-Computed</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="block text-[11px] font-bold text-slate-200 mb-1">Raw Score Earned</label>
                <input
                  type="number"
                  min="0"
                  max={totalItems}
                  value={rawScore}
                  onChange={(e) => setRawScore(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-200 mb-1">Total Items / Max Score</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={totalItems}
                  onChange={(e) => setTotalItems(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 text-center"
                />
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center">
                <div className="text-2xl font-black text-yellow-300">
                  {calculatedPercentage}%
                </div>
                <div className="text-[11px] font-extrabold text-emerald-300 uppercase tracking-wider mt-0.5">
                  {masteryInterpretation.description}
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Assessment Tool Attachment */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <FileUp className="w-3.5 h-3.5 text-emerald-700" />
                Assessment Tool / Activity Worksheet Attachment
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">Optional</span>
            </div>

            {assessmentTool ? (
              <div className="flex items-center justify-between p-3 bg-white border border-emerald-300 rounded-xl">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{assessmentTool.name}</p>
                    <p className="text-[10px] text-slate-500">{assessmentTool.caption || 'Assessment Instrument'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {onViewMOV && assessmentTool.dataUrl && (
                    <button
                      type="button"
                      onClick={() => onViewMOV(assessmentTool.dataUrl!, assessmentTool.name)}
                      className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                      title="View Document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setAssessmentTool(undefined)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Remove Tool"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={toolFileInputRef}
                  onChange={handleToolFileUpload}
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => toolFileInputRef.current?.click()}
                  disabled={isProcessingUpload}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-700" />
                  {isProcessingUpload ? 'Uploading...' : 'Attach Assessment Tool / Rubric'}
                </button>
                <input
                  type="text"
                  placeholder="Optional tool caption / title..."
                  value={assessmentToolCaption}
                  onChange={(e) => setAssessmentToolCaption(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>
            )}
          </div>

          {/* Section 6: Teacher Anecdotal Remarks */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                Teacher Anecdotal Remarks & Observations
              </label>
              <span className="text-[10px] text-slate-500 font-semibold">Quick Templates Available</span>
            </div>

            {/* Quick Templates Buttons */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {QUICK_REMARK_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRemarks((prev) => (prev ? `${prev} ${tmpl}` : tmpl))}
                  className="text-[10px] bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 px-2.5 py-1 rounded-lg font-semibold transition border border-slate-200 cursor-pointer"
                >
                  + {tmpl.slice(0, 32)}...
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              placeholder="Record detailed observations on student progress, engagement, and next steps..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
            />
          </div>

          {/* Section 7: Means of Verification (MOVs) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                Means of Verification (MOVs) & Photo Evidence ({movs.length})
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">Upload session photos/outputs</span>
            </div>

            {/* Existing MOVs list */}
            {movs.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {movs.map((mov) => (
                  <div
                    key={mov.id}
                    className="relative group bg-white p-2 rounded-xl border border-slate-200 flex flex-col items-center text-center"
                  >
                    {mov.type === 'image' && mov.dataUrl ? (
                      <img
                        src={mov.dataUrl}
                        alt={mov.caption || mov.name}
                        className="w-full h-16 object-cover rounded-lg mb-1"
                      />
                    ) : (
                      <div className="w-full h-16 bg-slate-100 rounded-lg flex items-center justify-center mb-1 text-slate-400">
                        <FileText className="w-8 h-8" />
                      </div>
                    )}
                    <p className="text-[10px] font-bold text-slate-800 truncate w-full">{mov.caption || mov.name}</p>
                    <div className="absolute top-1 right-1 flex items-center gap-1 opacity-90 group-hover:opacity-100">
                      {onViewMOV && mov.dataUrl && (
                        <button
                          type="button"
                          onClick={() => onViewMOV(mov.dataUrl!, mov.caption || mov.name)}
                          className="p-1 bg-slate-900/80 text-white rounded-md hover:bg-slate-900 transition"
                          title="View MOV"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveMov(mov.id)}
                        className="p-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                        title="Remove MOV"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload new MOV input */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={movFileInputRef}
                onChange={handleMovFileUpload}
                accept="image/*,.pdf,.doc,.docx"
                multiple
                className="hidden"
              />
              <button
                type="button"
                onClick={() => movFileInputRef.current?.click()}
                disabled={isProcessingUpload}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-700" />
                {isProcessingUpload ? 'Processing...' : '+ Add Photo / MOV Evidence'}
              </button>
              <input
                type="text"
                placeholder="MOV caption (e.g., Student Output / Formative Quiz)..."
                value={movCaption}
                onChange={(e) => setMovCaption(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Delete Confirmation Alert */}
          {isConfirmDelete && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-xl flex items-center justify-between gap-3 text-red-900 animate-in fade-in">
              <div className="text-xs font-bold">
                ⚠️ Are you sure you want to permanently delete this logged session?
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmDelete(false)}
                  className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-xs"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
            <div>
              {onDeleteSession && !isConfirmDelete && (
                <button
                  type="button"
                  onClick={() => setIsConfirmDelete(true)}
                  className="px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-300 transition flex items-center gap-1.5 cursor-pointer"
                  title="Delete this session"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  Delete Session
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
                Save Session Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
