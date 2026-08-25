import jsPDF from 'jspdf';
import { Student, TeacherProfile } from '../types';

export interface GuardianNoticeData {
  student: Student;
  teacher: TeacherProfile;
  dateStr: string;
  venue?: string;
  schedule?: string;
  startDate?: string;
  teacherInCharge?: string;
  departmentHead?: string;
  schoolName?: string;
  division?: string;
  department?: string;
  isFilledTemplate?: boolean;
}

/**
 * Generates an official, high-resolution, vector-crisp PDF for the Guardian's Notice of Remediation
 * exactly matching the DepEd Ramon Magsaysay (Cubao) High School TLE Department template.
 */
export function generateGuardianNoticePDF(data: GuardianNoticeData): jsPDF {
  const {
    student,
    teacher,
    dateStr,
    startDate = student.enrolledDate || dateStr,
    teacherInCharge = teacher.name || 'Subject Teacher',
    departmentHead = teacher.headTeacherName || 'Dr. Corazon V. Santos',
    schoolName = teacher.schoolName || 'Ramon Magsaysay (Cubao) High School',
    division = teacher.division || 'Department of Education – Schools Division of Quezon City',
    department = teacher.department || 'Technology and Livelihood Education Department',
    isFilledTemplate = true,
  } = data;

  // Clean schedule and decouple venue to prevent duplicate/redundant venue display
  const rawSchedule = data.schedule || student.scheduleDetails || 'Every Tuesday & Thursday, 3:30 PM - 4:45 PM';
  const venueMatch = rawSchedule.match(/\((.*?)\)$/);
  const derivedVenue = data.venue || (venueMatch ? venueMatch[1].trim() : 'ICT Computer Lab 1 / TLE Building');
  const cleanSchedule = rawSchedule.replace(/\s*\(.*?\)$/, '').trim() || 'Every Tuesday & Thursday, 3:30 PM - 4:45 PM';

  // Create A4 Portrait PDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const marginX = 22; // 22mm left/right margin
  const contentWidth = pageWidth - marginX * 2; // 166mm
  let currentY = 22;

  // 1. Header (Centered, 3 lines)
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text(schoolName, pageWidth / 2, currentY, { align: 'center' });
  currentY += 5.5;

  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.text(division, pageWidth / 2, currentY, { align: 'center' });
  currentY += 5.5;

  doc.setFont('times', 'bold');
  doc.setFontSize(11.5);
  doc.text(department, pageWidth / 2, currentY, { align: 'center' });
  currentY += 12;

  // 2. Date
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.text('Date: ', marginX, currentY);
  const dateLabelWidth = doc.getTextWidth('Date: ');
  doc.setFont('times', 'normal');
  if (isFilledTemplate && dateStr) {
    doc.text(dateStr, marginX + dateLabelWidth, currentY);
    doc.line(marginX + dateLabelWidth, currentY + 0.8, marginX + dateLabelWidth + 50, currentY + 0.8);
  } else {
    doc.line(marginX + dateLabelWidth, currentY + 0.8, marginX + dateLabelWidth + 50, currentY + 0.8);
  }
  currentY += 8;

  // 3. To: Mr./Ms.
  doc.setFont('times', 'bold');
  doc.text('To: ', marginX, currentY);
  const toWidth = doc.getTextWidth('To: ');
  doc.setFont('times', 'normal');
  doc.text('Mr./Ms. ', marginX + toWidth, currentY);
  const mrMsWidth = toWidth + doc.getTextWidth('Mr./Ms. ');
  
  const parentName = student.parentName || '';
  if (isFilledTemplate && parentName) {
    doc.text(parentName, marginX + mrMsWidth, currentY);
  }
  doc.line(marginX + mrMsWidth, currentY + 0.8, marginX + mrMsWidth + 75, currentY + 0.8);
  currentY += 4.5;

  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('(Name of Parent/Guardian)', marginX, currentY);
  doc.setTextColor(0, 0, 0);
  currentY += 8;

  // 4. Subject: Participation in Remediation Program
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.text('Subject: Participation in Remediation Program', marginX, currentY);
  currentY += 8;

  // 5. Dear Parent/Guardian,
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.text('Dear Parent/Guardian,', marginX, currentY);
  currentY += 6;

  // 6. Warm greetings!
  doc.text('Warm greetings!', marginX, currentY);
  currentY += 7;

  // 7. Paragraph 1
  const studentFullName = `${student.firstName} ${student.middleInitial ? student.middleInitial + ' ' : ''}${student.lastName}`.trim();
  const gradeLevel = student.gradeLevel || 'Grade 7';
  const section = student.section || 'Diamond';
  const subjectArea = student.subject || 'Technology and Livelihood Education';

  const p1Text = isFilledTemplate
    ? `We would like to inform you that your child ${studentFullName}, from ${gradeLevel} - Section ${section}, has been recommended to undergo a Remediation Program in ${subjectArea} based on his/her academic performance and assessment results for this quarter.`
    : `We would like to inform you that your child ____________________________________________________, from Grade ______ - Section ____________________________________, has been recommended to undergo a Remediation Program in ____________________________________ based on his/her academic performance and assessment results for this quarter.`;

  const p1Lines = doc.splitTextToSize(p1Text, contentWidth);
  doc.text(p1Lines, marginX, currentY, { maxWidth: contentWidth, align: 'justify' });
  currentY += p1Lines.length * 5.2 + 3;

  // 8. Paragraph 2
  const p2Text = 'The purpose of this program is to provide additional academic support to help your child strengthen their understanding of the subject and improve learning outcomes.';
  const p2Lines = doc.splitTextToSize(p2Text, contentWidth);
  doc.text(p2Lines, marginX, currentY, { maxWidth: contentWidth, align: 'justify' });
  currentY += p2Lines.length * 5.2 + 4;

  // 9. Program Details Bullet Points
  doc.setFont('times', 'bold');
  doc.text('Program Details', marginX, currentY);
  currentY += 5.5;

  const detailsList = [
    { label: 'Subject Area', value: isFilledTemplate ? subjectArea : '' },
    { label: 'Schedule', value: isFilledTemplate ? cleanSchedule : '' },
    { label: 'Venue', value: isFilledTemplate ? derivedVenue : '' },
    { label: 'Start Date', value: isFilledTemplate ? startDate : '' },
    { label: 'Teacher-in-Charge', value: isFilledTemplate ? teacherInCharge : '' },
  ];

  detailsList.forEach((item) => {
    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    const bulletPrefix = `\u2022  ${item.label}: `;
    doc.text(bulletPrefix, marginX + 4, currentY);
    const prefixWidth = doc.getTextWidth(bulletPrefix);

    doc.setFont('times', 'normal');
    if (item.value) {
      doc.text(item.value, marginX + 4 + prefixWidth, currentY);
    }
    doc.line(marginX + 4 + prefixWidth, currentY + 0.8, marginX + contentWidth, currentY + 0.8);
    currentY += 5.2;
  });

  currentY += 2.5;

  // 10. Paragraph 3 (requesting support)
  const p3Text = 'We are requesting your support and permission to allow your child to attend these sessions regularly. Please complete the reply slip below and return it to the teacher as soon as possible.';
  const p3Lines = doc.splitTextToSize(p3Text, contentWidth);
  doc.text(p3Lines, marginX, currentY, { maxWidth: contentWidth, align: 'justify' });
  currentY += p3Lines.length * 5.2 + 3;

  // 11. Paragraph 4 (questions)
  const p4Text = "Should you have any questions, feel free to reach out to us through the school or your child's subject teacher.";
  const p4Lines = doc.splitTextToSize(p4Text, contentWidth);
  doc.text(p4Lines, marginX, currentY, { maxWidth: contentWidth, align: 'justify' });
  currentY += p4Lines.length * 5.2 + 3;

  // 12. Thank you
  doc.text('Thank you very much for your continued support.', marginX, currentY);
  currentY += 7;

  // 13. Sincerely & Signatures
  doc.text('Sincerely,', marginX, currentY);
  currentY += 11;

  // Subject Teacher Line
  if (isFilledTemplate && teacherInCharge) {
    doc.setFont('times', 'bold');
    doc.text(teacherInCharge, marginX, currentY - 1.5);
  }
  doc.line(marginX, currentY, marginX + 75, currentY);
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text('Subject Teacher', marginX, currentY + 4);
  currentY += 12;

  // Noted by:
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.text('Noted by:', marginX, currentY);
  currentY += 11;

  if (isFilledTemplate && departmentHead) {
    doc.setFont('times', 'bold');
    doc.text(departmentHead, marginX, currentY - 1.5);
  }
  doc.line(marginX, currentY, marginX + 75, currentY);
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text('TLE Department Head', marginX, currentY + 4);
  currentY += 10;

  // 14. Dashed Separator Line
  doc.setLineDashPattern([2, 1.5], 0);
  doc.setDrawColor(60, 60, 60);
  doc.line(marginX, currentY, marginX + contentWidth, currentY);
  doc.setLineDashPattern([], 0); // reset to solid
  doc.setDrawColor(0, 0, 0);
  currentY += 5.5;

  // 15. REPLY SLIP
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('REPLY SLIP', marginX, currentY);
  currentY += 4.5;

  doc.setFont('times', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(60, 60, 60);
  doc.text('(To be returned to the subject teacher)', marginX, currentY);
  doc.setTextColor(0, 0, 0);
  currentY += 5.5;

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text('I have received and read the letter regarding the remediation program for my child:', marginX, currentY);
  currentY += 6;

  // Name of Student:
  doc.setFont('times', 'bold');
  doc.text('Name of Student: ', marginX, currentY);
  const studLabelW = doc.getTextWidth('Name of Student: ');
  doc.setFont('times', 'normal');
  if (isFilledTemplate && studentFullName) {
    doc.text(studentFullName, marginX + studLabelW, currentY);
  }
  doc.line(marginX + studLabelW, currentY + 0.8, marginX + contentWidth, currentY + 0.8);
  currentY += 5.5;

  // Grade & Section:
  doc.setFont('times', 'bold');
  doc.text('Grade & Section: ', marginX, currentY);
  const grLabelW = doc.getTextWidth('Grade & Section: ');
  doc.setFont('times', 'normal');
  if (isFilledTemplate) {
    doc.text(`${gradeLevel} - ${section}`, marginX + grLabelW, currentY);
  }
  doc.line(marginX + grLabelW, currentY + 0.8, marginX + grLabelW + 65, currentY + 0.8);
  currentY += 6.5;

  // Checkboxes
  doc.rect(marginX + 1, currentY - 3.2, 3.8, 3.8); // checkbox 1
  doc.setFont('times', 'bold');
  doc.text('I allow', marginX + 7, currentY);
  doc.setFont('times', 'normal');
  doc.text(' my child to attend and participate in the remediation program.', marginX + 7 + doc.getTextWidth('I allow'), currentY);
  currentY += 5;

  doc.rect(marginX + 1, currentY - 3.2, 3.8, 3.8); // checkbox 2
  doc.setFont('times', 'bold');
  doc.text('I do not allow', marginX + 7, currentY);
  doc.setFont('times', 'normal');
  doc.text(' my child to attend the remediation program.', marginX + 7 + doc.getTextWidth('I do not allow'), currentY);
  currentY += 5.5;

  // Reason (if not allowed):
  doc.setFont('times', 'bold');
  doc.text('Reason (if not allowed): ', marginX, currentY);
  const reasonLabelW = doc.getTextWidth('Reason (if not allowed): ');
  doc.line(marginX + reasonLabelW, currentY + 0.8, marginX + contentWidth, currentY + 0.8);
  currentY += 5.5;
  doc.line(marginX, currentY + 0.8, marginX + contentWidth, currentY + 0.8);
  currentY += 9;

  // Name of Parent/Guardian:
  doc.setFont('times', 'bold');
  doc.text('Name of Parent/Guardian: ', marginX, currentY);
  const parentLabelW = doc.getTextWidth('Name of Parent/Guardian: ');
  doc.setFont('times', 'normal');
  if (isFilledTemplate && parentName) {
    doc.text(parentName, marginX + parentLabelW, currentY);
  }
  doc.line(marginX + parentLabelW, currentY + 0.8, marginX + parentLabelW + 65, currentY + 0.8);
  currentY += 5.5;

  // Signature & Date
  doc.setFont('times', 'bold');
  doc.text('Signature: ', marginX, currentY);
  const sigLabelW = doc.getTextWidth('Signature: ');
  doc.line(marginX + sigLabelW, currentY + 0.8, marginX + sigLabelW + 45, currentY + 0.8);
  currentY += 5.5;

  doc.setFont('times', 'bold');
  doc.text('Date: ', marginX, currentY);
  const replyDateW = doc.getTextWidth('Date: ');
  doc.line(marginX + replyDateW, currentY + 0.8, marginX + replyDateW + 35, currentY + 0.8);

  return doc;
}

/**
 * Directly downloads the Guardian's Notice PDF file to the browser.
 */
export function downloadGuardianNoticePDF(data: GuardianNoticeData, filename?: string): boolean {
  try {
    const doc = generateGuardianNoticePDF(data);
    const finalFilename = filename || `Guardian_Notice_of_Remediation_${data.student.lastName}_${data.student.firstName}.pdf`;
    
    // Save to user downloads
    try {
      doc.save(finalFilename);
    } catch (saveErr) {
      console.warn('doc.save() failed, attempting Blob download fallback:', saveErr);
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = finalFilename;
      document.body.appendChild(anchor);
      anchor.click();
      setTimeout(() => {
        document.body.removeChild(anchor);
        URL.revokeObjectURL(blobUrl);
      }, 1500);
    }
    return true;
  } catch (err) {
    console.error('Error generating Guardian Notice PDF:', err);
    return false;
  }
}
