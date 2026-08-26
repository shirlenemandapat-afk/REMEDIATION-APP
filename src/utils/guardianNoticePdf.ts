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
 * exactly matching the DepEd Ramon Magsaysay (Cubao) High School TLE Department template,
 * strictly compressed to fit cleanly onto 1 single page.
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
  const marginX = 18; // 18mm left/right margin
  const contentWidth = pageWidth - marginX * 2; // 174mm
  let currentY = 15;

  // 1. Header (Centered, 3 lines)
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(schoolName, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.6;

  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.text(division, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.6;

  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.text(department, pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  // 2. Date
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text('Date: ', marginX, currentY);
  const dateLabelWidth = doc.getTextWidth('Date: ');
  doc.setFont('times', 'normal');
  if (isFilledTemplate && dateStr) {
    doc.text(dateStr, marginX + dateLabelWidth, currentY);
  }
  doc.line(marginX + dateLabelWidth, currentY + 0.6, marginX + dateLabelWidth + 45, currentY + 0.6);
  currentY += 5.5;

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
  doc.line(marginX + mrMsWidth, currentY + 0.6, marginX + mrMsWidth + 70, currentY + 0.6);
  currentY += 3.8;

  doc.setFont('times', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  doc.text('(Name of Parent/Guardian)', marginX, currentY);
  doc.setTextColor(0, 0, 0);
  currentY += 6;

  // 4. Subject: Participation in Remediation Program
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text('Subject: Participation in Remediation Program', marginX, currentY);
  currentY += 5.5;

  // 5. Dear Parent/Guardian,
  doc.setFont('times', 'normal');
  doc.setFontSize(9.8);
  doc.text('Dear Parent/Guardian,', marginX, currentY);
  currentY += 4.5;

  // 6. Warm greetings!
  doc.text('Warm greetings!', marginX, currentY);
  currentY += 4.8;

  // 7. Paragraph 1
  const studentFullName = `${student.firstName} ${student.middleInitial ? student.middleInitial + ' ' : ''}${student.lastName}`.trim();
  const gradeLevel = student.gradeLevel || 'Grade 10';
  const section = student.section || 'Aguho';
  const subjectArea = student.subject || 'Technology and Livelihood Education (ICT)';

  const p1Text = isFilledTemplate
    ? `We would like to inform you that your child ${studentFullName}, from ${gradeLevel} - Section ${section}, has been recommended to undergo a Remediation Program in ${subjectArea} based on his/her academic performance and assessment results for this quarter.`
    : `We would like to inform you that your child ____________________________________________________, from Grade ______ - Section ____________________________________, has been recommended to undergo a Remediation Program in ____________________________________ based on his/her academic performance and assessment results for this quarter.`;

  const p1Lines = doc.splitTextToSize(p1Text, contentWidth);
  doc.text(p1Lines, marginX, currentY, { maxWidth: contentWidth, align: 'justify' });
  currentY += p1Lines.length * 4.4 + 2;

  // 8. Paragraph 2
  const p2Text = 'The purpose of this program is to provide additional academic support to help your child strengthen their understanding of the subject and improve learning outcomes.';
  const p2Lines = doc.splitTextToSize(p2Text, contentWidth);
  doc.text(p2Lines, marginX, currentY, { maxWidth: contentWidth, align: 'justify' });
  currentY += p2Lines.length * 4.4 + 2.5;

  // 9. Program Details Bullet Points
  doc.setFont('times', 'bold');
  doc.setFontSize(9.8);
  doc.text('Program Details', marginX, currentY);
  currentY += 4.5;

  const detailsList = [
    { label: 'Subject Area', value: isFilledTemplate ? subjectArea : '' },
    { label: 'Schedule', value: isFilledTemplate ? cleanSchedule : '' },
    { label: 'Venue', value: isFilledTemplate ? derivedVenue : '' },
    { label: 'Start Date', value: isFilledTemplate ? startDate : '' },
    { label: 'Teacher-in-Charge', value: isFilledTemplate ? teacherInCharge : '' },
  ];

  detailsList.forEach((item) => {
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    const bulletPrefix = `\u2022  ${item.label}: `;
    doc.text(bulletPrefix, marginX + 3, currentY);
    const prefixWidth = doc.getTextWidth(bulletPrefix);

    doc.setFont('times', 'normal');
    if (item.value) {
      doc.text(item.value, marginX + 3 + prefixWidth, currentY);
    }
    doc.line(marginX + 3 + prefixWidth, currentY + 0.6, marginX + contentWidth, currentY + 0.6);
    currentY += 4.4;
  });

  currentY += 2;

  // 10. Paragraph 3 (requesting support & return slip)
  const p3Text = 'We are requesting your support and permission to allow your child to attend these sessions regularly. Please complete the reply slip below and return it to the teacher as soon as possible.';
  const p3Lines = doc.splitTextToSize(p3Text, contentWidth);
  doc.text(p3Lines, marginX, currentY, { maxWidth: contentWidth, align: 'justify' });
  currentY += p3Lines.length * 4.4 + 2;

  // 11. Paragraph 4 + Thank you
  const p4Text = "Should you have any questions, feel free to reach out to us through the school or your child's subject teacher. Thank you very much for your continued support.";
  const p4Lines = doc.splitTextToSize(p4Text, contentWidth);
  doc.text(p4Lines, marginX, currentY, { maxWidth: contentWidth, align: 'justify' });
  currentY += p4Lines.length * 4.4 + 3.5;

  // 12. Signatures (SIDE BY SIDE 2-COLUMN LAYOUT)
  const col1X = marginX;
  const col2X = marginX + contentWidth / 2 + 10;
  const sigLineWidth = 65;

  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.text('Sincerely,', col1X, currentY);

  doc.setFont('times', 'bold');
  doc.text('Noted by:', col2X, currentY);
  currentY += 9;

  // Teacher Name & Signature Line (Col 1)
  if (isFilledTemplate && teacherInCharge) {
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.text(teacherInCharge, col1X, currentY - 1.2);
  }
  doc.line(col1X, currentY, col1X + sigLineWidth, currentY);
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.text('Subject Teacher', col1X, currentY + 3.6);

  // Department Head & Signature Line (Col 2)
  if (isFilledTemplate && departmentHead) {
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.text(departmentHead, col2X, currentY - 1.2);
  }
  doc.line(col2X, currentY, col2X + sigLineWidth, currentY);
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.text('TLE Department Head', col2X, currentY + 3.6);

  currentY += 9;

  // 13. Dashed Separator Line
  doc.setLineDashPattern([2, 1.5], 0);
  doc.setDrawColor(70, 70, 70);
  doc.line(marginX, currentY, marginX + contentWidth, currentY);
  doc.setLineDashPattern([], 0); // reset to solid
  doc.setDrawColor(0, 0, 0);
  currentY += 4.5;

  // 14. REPLY SLIP HEADER (Title & Subtitle on same line)
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.text('REPLY SLIP', marginX, currentY);
  
  doc.setFont('times', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text('(To be returned to the subject teacher)', marginX + 28, currentY);
  doc.setTextColor(0, 0, 0);
  currentY += 4.2;

  doc.setFont('times', 'normal');
  doc.setFontSize(9.2);
  doc.text('I have received and read the letter regarding the remediation program for my child:', marginX, currentY);
  currentY += 4.5;

  // 15. Student Name and Grade & Section (SIDE BY SIDE)
  const halfContentWidth = (contentWidth - 6) / 2;
  
  // Left: Name of Student
  doc.setFont('times', 'bold');
  doc.setFontSize(9.2);
  doc.text('Name of Student: ', marginX, currentY);
  const studLabelW = doc.getTextWidth('Name of Student: ');
  doc.setFont('times', 'normal');
  if (isFilledTemplate && studentFullName) {
    doc.text(studentFullName, marginX + studLabelW, currentY);
  }
  doc.line(marginX + studLabelW, currentY + 0.6, marginX + halfContentWidth, currentY + 0.6);

  // Right: Grade & Section
  const rightColX = marginX + halfContentWidth + 6;
  doc.setFont('times', 'bold');
  doc.text('Grade & Section: ', rightColX, currentY);
  const grLabelW = doc.getTextWidth('Grade & Section: ');
  doc.setFont('times', 'normal');
  if (isFilledTemplate) {
    doc.text(`${gradeLevel} - ${section}`, rightColX + grLabelW, currentY);
  }
  doc.line(rightColX + grLabelW, currentY + 0.6, marginX + contentWidth, currentY + 0.6);
  currentY += 5.2;

  // 16. Checkboxes (Allow / Do not allow)
  doc.rect(marginX + 1, currentY - 2.8, 3.2, 3.2); // checkbox 1
  doc.setFont('times', 'bold');
  doc.setFontSize(9.2);
  doc.text('I allow', marginX + 6, currentY);
  doc.setFont('times', 'normal');
  doc.text(' my child to attend and participate in the remediation program.', marginX + 6 + doc.getTextWidth('I allow'), currentY);
  currentY += 4.2;

  doc.rect(marginX + 1, currentY - 2.8, 3.2, 3.2); // checkbox 2
  doc.setFont('times', 'bold');
  doc.text('I do not allow', marginX + 6, currentY);
  doc.setFont('times', 'normal');
  doc.text(' my child to attend the remediation program.', marginX + 6 + doc.getTextWidth('I do not allow'), currentY);
  currentY += 4.5;

  // 17. Reason (if not allowed)
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.text('Reason (if not allowed): ', marginX, currentY);
  const reasonLabelW = doc.getTextWidth('Reason (if not allowed): ');
  doc.line(marginX + reasonLabelW, currentY + 0.6, marginX + contentWidth, currentY + 0.6);
  currentY += 5.5;

  // 18. Parent Sign-off (3-COLUMN ROW: Parent Name, Signature, Date)
  const colW1 = 70;
  const colW2 = 50;
  const col3X = marginX + colW1 + colW2 + 4;
  const col2XSig = marginX + colW1 + 2;

  // Col 1: Name of Parent/Guardian
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.text('Parent/Guardian Name: ', marginX, currentY);
  const parentLabelW = doc.getTextWidth('Parent/Guardian Name: ');
  doc.setFont('times', 'normal');
  if (isFilledTemplate && parentName) {
    doc.text(parentName, marginX + parentLabelW, currentY);
  }
  doc.line(marginX + parentLabelW, currentY + 0.6, marginX + colW1, currentY + 0.6);

  // Col 2: Signature
  doc.setFont('times', 'bold');
  doc.text('Signature: ', col2XSig, currentY);
  const sigLabelW = doc.getTextWidth('Signature: ');
  doc.line(col2XSig + sigLabelW, currentY + 0.6, col2XSig + colW2 - 2, currentY + 0.6);

  // Col 3: Date
  doc.setFont('times', 'bold');
  doc.text('Date: ', col3X, currentY);
  const replyDateW = doc.getTextWidth('Date: ');
  doc.line(col3X + replyDateW, currentY + 0.6, marginX + contentWidth, currentY + 0.6);

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
