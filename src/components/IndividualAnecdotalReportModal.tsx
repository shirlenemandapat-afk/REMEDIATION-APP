import React from 'react';
import { Student, SessionRecord, TeacherProfile, interpretMasteryLevel } from '../types';
import { SchoolLogo } from './SchoolLogo';
import { safePrintDocument } from '../utils/printHelper';
import { Printer, ArrowLeft, X, FileText, CheckCircle2, User, BookOpen, Award, Sparkles, TrendingUp } from 'lucide-react';

interface IndividualAnecdotalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  sessions: SessionRecord[];
  teacher: TeacherProfile;
}

export const IndividualAnecdotalReportModal: React.FC<IndividualAnecdotalReportModalProps> = ({
  isOpen,
  onClose,
  student,
  sessions,
  teacher,
}) => {
  if (!isOpen || !student) return null;

  const studentSessions = sessions
    .filter((s) => s.studentId === student.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalSessions = studentSessions.length;
  
  // Calculate average percentage mastery strictly across activities conducted during remediation sessions
  const sessionScores = studentSessions.map((s) => s.score);
  const avgScore =
    sessionScores.length > 0
      ? Math.round(sessionScores.reduce((acc, score) => acc + score, 0) / sessionScores.length)
      : student.baselineScore;
  const avgMastery = interpretMasteryLevel(avgScore);

  const latestScore = studentSessions.length > 0
    ? studentSessions[studentSessions.length - 1].score
    : student.baselineScore;
  const latestMastery = interpretMasteryLevel(latestScore);

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handlePrint = () => {
    safePrintDocument(
      'printable-anecdotal-report',
      `Anecdotal_Report_${student.lastName}_${student.firstName}_${student.programType}`
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 my-6 animate-in fade-in zoom-in-95 duration-150 print:shadow-none print:border-none print:my-0 print:max-w-none">
        {/* Action Header (Hidden in Print) */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-950 p-4 text-white flex items-center justify-between print:hidden border-b-2 border-amber-400 gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-emerald-100 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/20 shadow-xs cursor-pointer"
              title="Back to Students / Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-300 hidden sm:block" />
              <div>
                <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                  Individual Student Anecdotal Progress Report (Parent's Copy)
                </h3>
                <p className="text-xs text-emerald-200">
                  Official Report for {student.firstName} {student.lastName} ({student.programType})
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-extrabold rounded-xl text-xs transition flex items-center gap-2 shadow-md hover:shadow-lg border border-amber-300 cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Parent's Copy / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT BODY */}
        <div id="printable-anecdotal-report" className="p-8 sm:p-12 text-slate-900 space-y-6 print:p-0 print:text-black bg-white">
          {/* Institutional Letterhead Banner */}
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
            </div>
            <div className="w-14 h-14 rounded-full border border-emerald-800 flex items-center justify-center p-1 bg-emerald-50 shrink-0">
              <span className="text-[9px] font-black text-emerald-900 text-center leading-tight">
                PROJECT<br />S.M.I.L.E.
              </span>
            </div>
          </div>

          {/* Document Title Header */}
          <div className="text-center py-2 border-b border-amber-300">
            <div className="inline-block px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-900 border border-amber-300 mb-1">
              PROJECT S.M.I.L.E. (STUDENT MONITORING AND INTERVENTION FOR LEARNING ENHANCEMENT)
            </div>
            <h1 className="text-base sm:text-lg font-black font-serif uppercase tracking-wide text-emerald-950">
              INDIVIDUAL STUDENT ANECDOTAL PROGRESS REPORT
            </h1>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              OFFICIAL PARENT'S COPY &bull; ACADEMIC YEAR 2025–2026
            </p>
          </div>

          {/* Student Profile & Metadata Matrix */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">Student Name:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {student.lastName}, {student.firstName} {student.middleInitial}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">Grade & Section:</span>
                <span className="font-bold text-slate-800">{student.gradeLevel} - {student.section}</span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">Program Category:</span>
                <span className="font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md inline-block border border-emerald-300">
                  {student.programType}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">TLE Strand / Subject:</span>
                <span className="font-bold text-slate-800">{student.subject}</span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">Parent / Guardian:</span>
                <span className="font-bold text-slate-800">{student.parentName || 'N/A'} {student.parentContact ? `(${student.parentContact})` : ''}</span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">Target Learning Competency:</span>
                <span className="font-bold text-emerald-950">{student.focusTopic}</span>
              </div>
            </div>
          </div>

          {/* Summary Progress Key Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-300">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Baseline Score</span>
              <span className="text-lg font-black text-slate-800">{student.baselineScore}%</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-300">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Latest Mastery Score</span>
              <span className="text-lg font-black text-emerald-800">{latestScore}%</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-300">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Average Level of Mastery</span>
              <span className="text-lg font-black text-blue-900">{avgScore}%</span>
              <span className="text-[10px] font-bold block text-blue-700">{avgMastery.description}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-300">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Sessions Logged</span>
              <span className="text-lg font-black text-indigo-900">{totalSessions} Session(s)</span>
              <span className="text-[10px] font-bold text-emerald-700 block">{student.status}</span>
            </div>
          </div>

          {/* GRANULAR SESSION-BY-SESSION ANECDOTAL RECORD TABLE */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold font-serif uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              Detailed Anecdotal Session Records & Evaluation Log
            </h2>

            {studentSessions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold font-serif">
                      <th className="p-2 border border-slate-300 w-20">Date</th>
                      <th className="p-2 border border-slate-300">Focus Competency</th>
                      <th className="p-2 border border-slate-300">Activity & Strategies</th>
                      <th className="p-2 border border-slate-300 text-center w-24">Raw Score / Items</th>
                      <th className="p-2 border border-slate-300 text-center w-28">Mastery Level</th>
                      <th className="p-2 border border-slate-300">Teacher Anecdotal Remarks & Observations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {studentSessions.map((sess) => {
                      const sessMastery = interpretMasteryLevel(sess.score);
                      return (
                        <tr key={sess.id} className="align-top">
                          <td className="p-2 border border-slate-300 font-bold text-slate-800 whitespace-nowrap">
                            {sess.date}
                          </td>
                          <td className="p-2 border border-slate-300 font-semibold text-slate-900">
                            {sess.focusCompetency || student.focusTopic}
                          </td>
                          <td className="p-2 border border-slate-300 text-[11px] text-slate-700">
                            <p className="font-bold text-emerald-950">
                              {sess.activityTypes ? sess.activityTypes.join(', ') : sess.activityType}
                            </p>
                            <p className="text-slate-500 italic mt-0.5">
                              Strategy: {sess.interventions ? sess.interventions.join('; ') : sess.intervention}
                            </p>
                            {sess.assessmentTool && (
                              <p className="text-[10px] text-blue-700 font-semibold mt-1">
                                📎 Tool: {sess.assessmentTool.caption || sess.assessmentTool.name}
                              </p>
                            )}
                          </td>
                          <td className="p-2 border border-slate-300 text-center font-bold">
                            {sess.rawScore !== undefined && sess.totalItems !== undefined
                              ? `${sess.rawScore} / ${sess.totalItems}`
                              : '—'}
                          </td>
                          <td className="p-2 border border-slate-300 text-center">
                            <span className="font-extrabold text-xs block text-emerald-900">{sess.score}%</span>
                            <span className="text-[9px] font-bold text-slate-600 uppercase block">
                              {sessMastery.description}
                            </span>
                          </td>
                          <td className="p-2 border border-slate-300 text-[11px] text-slate-800 leading-relaxed text-justify">
                            {sess.remarks}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-3 text-center border border-dashed border-slate-300 rounded-lg">
                No session entries recorded yet.
              </p>
            )}
          </div>

          {/* Teacher Summary Remarks & Recommendations */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 text-xs space-y-1.5">
            <h3 className="font-bold font-serif text-slate-900 uppercase">
              Teacher's Overall Diagnostic Assessment & Recommendation:
            </h3>
            <p className="text-slate-800 leading-relaxed text-justify">
              Student has demonstrated an average mastery level of <strong>{avgScore}% ({avgMastery.description})</strong> throughout Project S.M.I.L.E.
              {student.status === 'Mastered / Promoted'
                ? ' The learner has successfully met the core competencies and is recommended for regular classroom progression and advanced enrichment.'
                : student.status === 'Progressing'
                ? ' The learner is showing steady progress and should continue participating in targeted peer buddy practice and reinforcement drills.'
                : ' Continued scaffolded remediation and parental reinforcement at home are strongly recommended to bridge remaining competency gaps.'}
            </p>
          </div>

          {/* PARENT / GUARDIAN FEEDBACK & OBSERVATIONS SECTION */}
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-300 text-xs space-y-3 print:bg-white print:border-slate-400">
            <div className="flex items-center justify-between border-b border-amber-200 print:border-slate-300 pb-1.5">
              <h3 className="font-extrabold font-serif text-slate-900 uppercase flex items-center gap-1.5">
                <span>Parent / Guardian Feedback & Observations</span>
                <span className="text-[11px] font-normal text-slate-600 italic">
                  (Puna at Obserbasyon ng Magulang / Tagapangalaga)
                </span>
              </h3>
              <span className="text-[10px] text-slate-500 font-semibold italic">To be accomplished by Parent</span>
            </div>

            {/* Quick Feedback Checkboxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-slate-800 pt-1">
              <label className="flex items-start gap-1.5 cursor-pointer">
                <input type="checkbox" className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-500" />
                <span>Observed noticeable improvement in child's TLE skills & confidence</span>
              </label>
              <label className="flex items-start gap-1.5 cursor-pointer">
                <input type="checkbox" className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-500" />
                <span>Child diligently reviews & practices TLE activities at home</span>
              </label>
              <label className="flex items-start gap-1.5 cursor-pointer">
                <input type="checkbox" className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-500" />
                <span>Requests follow-up consultation / additional home learning drills</span>
              </label>
            </div>

            {/* Written Remarks / Notes by Parent */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[11px] font-bold text-slate-800">
                Comments, Suggestions, or Home Support Commitments (Mga Komento / Mungkahi):
              </p>
              <div className="space-y-2.5 pt-1">
                <div className="border-b border-dashed border-slate-400 h-5 w-full"></div>
                <div className="border-b border-dashed border-slate-400 h-5 w-full"></div>
                <div className="border-b border-dashed border-slate-400 h-5 w-full"></div>
              </div>
            </div>
          </div>

          {/* SIGNATURES SECTION (TEACHER, DEPARTMENT HEAD, AND PARENT/GUARDIAN) */}
          <div className="pt-6 border-t-2 border-slate-800 space-y-6">
            <div className="grid grid-cols-3 gap-6 text-xs text-slate-800">
              {/* Teacher Signature */}
              <div>
                <p className="text-[11px] text-slate-500 mb-8 font-semibold">Prepared by:</p>
                <div className="border-b border-slate-900 pb-1">
                  <p className="font-black text-xs uppercase text-slate-950">
                    {teacher.name}
                  </p>
                </div>
                <p className="text-[11px] font-bold text-slate-700 mt-1">{teacher.title}</p>
                <p className="text-[10px] text-slate-500 italic">Project S.M.I.L.E. Subject Teacher</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Date: {currentDate}</p>
              </div>

              {/* Department Head Signature */}
              <div>
                <p className="text-[11px] text-slate-500 mb-8 font-semibold">Noted & Approved by:</p>
                <div className="border-b border-slate-900 pb-1">
                  <p className="font-black text-xs uppercase text-slate-950">
                    {teacher.headTeacherName || 'Dr. Corazon V. Santos'}
                  </p>
                </div>
                <p className="text-[11px] font-bold text-slate-700 mt-1">
                  {teacher.headTeacherPosition || 'Head Teacher III / TLE Dept. Head'}
                </p>
                <p className="text-[10px] text-slate-500 italic">{teacher.schoolName || 'Ramon Magsaysay (Cubao) High School'}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Date: {currentDate}</p>
              </div>

              {/* MANDATORY PARENT / GUARDIAN SIGNATURE SPACE */}
              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-300 print:bg-transparent print:p-0 print:border-none">
                <p className="text-[11px] text-amber-900 print:text-slate-700 mb-8 font-bold">
                  Acknowledged & Received by Parent/Guardian:
                </p>
                <div className="border-b border-slate-900 pb-1">
                  <p className="font-bold text-xs uppercase text-slate-900 min-h-[16px]">
                    {student.parentName || ''}
                  </p>
                </div>
                <p className="text-[10px] font-bold text-slate-700 mt-1 uppercase">
                  Parent / Guardian Signature over Printed Name
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Contact No: {student.parentContact || '_____________________'}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Date Signed: _____________________</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer Bar (Hidden in Print) */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-slate-300 shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Official parent's copy report:
            </span>
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-yellow-300 font-extrabold rounded-xl text-xs transition flex items-center gap-2 shadow-md hover:shadow-lg border border-emerald-950 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Print Official Anecdotal Report (Parent's Copy)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
