import jsPDF from 'jspdf';
import { Student, TeacherProfile } from '../types';

export interface GuardianNoticeData {
  student: Student;
  teacher: TeacherProfile;
  dateStr: string;
  venue?: string;
  timeSchedule?: string;
  schedule?: string;
  datesRangeStr?: string;
  startDate?: string;
  endDate?: string;
  teacherInCharge?: string;
  departmentHead?: string;
  teacherTitle?: string;
  headTeacherTitle?: string;
  schoolName?: string;
  division?: string;
  department?: string;
  isFilledTemplate?: boolean;
}

/**
 * Generates an official, high-resolution, vector-crisp PDF for the Guardian's Notice of Remediation / Enhancement
 * strictly matching the DepEd Ramon Magsaysay (Cubao) High School TLE Department template,
 * with the official DepEd header and footer, compressed to fit cleanly onto 1 single page.
 */
export function generateGuardianNoticePDF(data: GuardianNoticeData): jsPDF {
  const {
    student,
    teacher,
    dateStr,
    venue = 'ICT Computer Lab 1 / TLE Building',
    timeSchedule = data.schedule || '3:00 PM – 4:00 PM',
    datesRangeStr = data.startDate || dateStr,
    teacherInCharge = teacher.name || 'TLE Teacher',
    departmentHead = teacher.headTeacherName || 'Dr. Corazon V. Santos',
    teacherTitle = 'TLE Teacher',
    headTeacherTitle = 'Head Teacher VI, TLE Department',
    department = teacher.department || 'Technology and Livelihood Education (TLE) Department',
    isFilledTemplate = true,
  } = data;

  const isEnhancement = student.programType === 'Skills Enhancement';
  const programTitle = isEnhancement ? 'Skills Enhancement Program' : 'Remediation Program';

  // Create 8.5 x 13 inches (Folio / Long Bond Paper) Portrait PDF with 1-inch margins
  // 8.5 in = 215.9 mm, 13 in = 330.2 mm, 1 in margin = 25.4 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [215.9, 330.2],
    compress: true,
  });

  const pageWidth = 215.9; // 8.5 inches in mm
  const pageHeight = 330.2; // 13.0 inches in mm
  const marginX = 25.4; // 1.0 inch (25.4mm) left & right margin
  const contentWidth = pageWidth - marginX * 2; // 165.1 mm (6.5 inches)
  let currentY = 25.4; // 1.0 inch (25.4mm) top margin

  // 1. Official DepEd Header (Centered)
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Republic of the Philippines', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5.2;

  doc.setFont('times', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('Department of Education', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5.2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.8);
  doc.setTextColor(51, 65, 85);
  doc.text('NATIONAL CAPITAL REGION', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.text('SCHOOLS DIVISION OF QUEZON CITY', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(15, 23, 42);
  doc.text('RAMON MAGSAYSAY (CUBAO) HIGH SCHOOL', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  // Header bottom dividing line
  doc.setLineWidth(0.6);
  doc.setDrawColor(15, 23, 42);
  doc.line(marginX, currentY, marginX + contentWidth, currentY);
  currentY += 6.5;

  // 2. Date
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('Date: ', marginX, currentY);
  const dateLabelWidth = doc.getTextWidth('Date: ');
  doc.setFont('times', 'normal');
  if (isFilledTemplate && dateStr) {
    doc.text(dateStr, marginX + dateLabelWidth, currentY);
  }
  doc.line(marginX + dateLabelWidth, currentY + 0.6, marginX + dateLabelWidth + 60, currentY + 0.6);
  currentY += 6.2;

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
  doc.line(marginX + mrMsWidth, currentY + 0.6, marginX + mrMsWidth + 85, currentY + 0.6);
  currentY += 6.8;

  // 4. Subject: Participation in Remediation/Enhancement Program
  doc.setFont('times', 'bold');
  doc.setFontSize(11.5);
  doc.text(`Subject: Participation in ${programTitle}`, marginX, currentY);
  currentY += 6.5;

  // 5. Dear Parent/Guardian,
  doc.setFont('times', 'normal');
  doc.setFontSize(10.8);
  doc.text('Dear Parent/Guardian,', marginX, currentY);
  currentY += 5.2;

  // 6. Warm greetings!
  doc.text('Warm greetings!', marginX, currentY);
  currentY += 6.0;

  // 7. Paragraph 1
  const studentFullName = `${student.firstName} ${student.middleInitial ? student.middleInitial + ' ' : ''}${student.lastName}`.trim();
  const gradeLevel = student.gradeLevel || 'Grade 10';
  const section = student.section || 'Aguho';
  const subjectArea = student.subject || 'Technology and Livelihood Education (ICT)';

  const p1Text = isFilledTemplate
    ? `We would like to inform you that your child ${studentFullName}, from ${gradeLevel} - Section ${section}, has been recommended to undergo a ${programTitle} in ${subjectArea} based on his/her academic performance and assessment results for this quarter.`
    : `We would like to inform you that your child ____________________________________________________, from Grade ______ - Section ____________________________________, has been recommended to undergo a ${programTitle} in ____________________________________ based on his/her academic performance and assessment results for this quarter.`;

  const p1Lines = doc.splitTextToSize(p1Text, contentWidth);
  doc.text(p1Lines, marginX, currentY, { maxWidth: contentWidth, align: 'justify' });
  currentY += p1Lines.length * 5.0 + 2.5;

  // 8. Paragraph 2
  const p2Text = 'The purpose of this program is to provide additional academic support to help your child strengthen their understanding of the subject and improve learning outcomes.';
  const p2Lines = doc.splitTextToSize(p2Text, contentWidth);
  doc.text(p2Lines, marginX, currentY, { maxWidth: contentWidth, align: 'justify' });
  currentY += p2Lines.length * 5.0 + 3.0;

  // 9. Program Details Bullet Points
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('Program Details', marginX, currentY);
  currentY += 5.2;

  const detailsList = [
    { label: 'Subject Area', value: isFilledTemplate ? subjectArea : '' },
    { label: 'Inclusive Dates', value: isFilledTemplate ? datesRangeStr : '' },
    { label: 'Time / Schedule', value: isFilledTemplate ? timeSchedule : '' },
    { label: 'Venue', value: isFilledTemplate ? venue : '' },
    { label: 'Teacher-in-Charge', value: isFilledTemplate ? teacherInCharge : '' },
  ];

  detailsList.forEach((item) => {
    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    const bulletPrefix = `\u2022  ${item.label}: `;
    doc.text(bulletPrefix, marginX + 3, currentY);
    const prefixWidth = doc.getTextWidth(bulletPrefix);

    doc.setFont('times', 'normal');
    if (item.value) {
      doc.text(item.value, marginX + 3 + prefixWidth, currentY);
    }
    doc.line(marginX + 3 + prefixWidth, currentY + 0.6, marginX + contentWidth, currentY + 0.6);
    currentY += 5.2;
  });

  currentY += 2.0;

  // 10. Paragraph 3 (requesting support & return slip to TLE teacher)
  const p3Text = 'We are requesting your support and permission to allow your child to attend these sessions regularly. Please complete the reply slip below and return it to the TLE teacher as soon as possible.';
  const p3Lines = doc.splitTextToSize(p3Text, contentWidth);
  doc.text(p3Lines, marginX, currentY, { maxWidth: contentWidth, align: 'justify' });
  currentY += p3Lines.length * 5.0 + 2.5;

  // 11. Paragraph 4 + Thank you
  const p4Text = "Should you have any questions, feel free to reach out to us through the school or your child's TLE teacher. Thank you very much for your continued support.";
  const p4Lines = doc.splitTextToSize(p4Text, contentWidth);
  doc.text(p4Lines, marginX, currentY, { maxWidth: contentWidth, align: 'justify' });
  currentY += p4Lines.length * 5.0 + 3.5;

  // 12. Signatures (SIDE BY SIDE 2-COLUMN LAYOUT)
  const col1X = marginX;
  const col2X = marginX + contentWidth / 2 + 10;
  const sigLineWidth = 72;

  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.text('Sincerely,', col1X, currentY);

  doc.setFont('times', 'bold');
  doc.text('Noted by:', col2X, currentY);
  currentY += 10.5;

  // TLE Teacher Signature Line (Col 1)
  if (isFilledTemplate && teacherInCharge) {
    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.text(teacherInCharge, col1X, currentY - 1.2);
  }
  doc.line(col1X, currentY, col1X + sigLineWidth, currentY);
  doc.setFont('times', 'bold');
  doc.setFontSize(9.8);
  doc.text(teacherTitle, col1X, currentY + 4.2);

  // Head Teacher VI, TLE Department Signature Line (Col 2)
  if (isFilledTemplate && departmentHead) {
    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.text(departmentHead, col2X, currentY - 1.2);
  }
  doc.line(col2X, currentY, col2X + sigLineWidth, currentY);
  doc.setFont('times', 'bold');
  doc.setFontSize(9.8);
  doc.text(headTeacherTitle, col2X, currentY + 4.2);

  currentY += 9.0;

  // 13. Dashed Separator Line
  doc.setLineDashPattern([3, 2], 0);
  doc.setDrawColor(60, 60, 60);
  doc.line(marginX, currentY, marginX + contentWidth, currentY);
  doc.setLineDashPattern([], 0); // reset to solid
  doc.setDrawColor(0, 0, 0);
  currentY += 5.5;

  // 14. REPLY SLIP HEADER (To be returned to the TLE teacher)
  doc.setFont('times', 'bold');
  doc.setFontSize(11.5);
  doc.text('REPLY SLIP', marginX, currentY);
  
  doc.setFont('times', 'italic');
  doc.setFontSize(9.2);
  doc.setTextColor(80, 80, 80);
  doc.text('(To be returned to the TLE teacher)', marginX + 30, currentY);
  doc.setTextColor(0, 0, 0);
  currentY += 5.0;

  doc.setFont('times', 'normal');
  doc.setFontSize(10.2);
  doc.text(`I have received and read the letter regarding the ${programTitle.toLowerCase()} for my child:`, marginX, currentY);
  currentY += 5.5;

  // 15. Student Name and Grade & Section (SIDE BY SIDE)
  const halfContentWidth = (contentWidth - 8) / 2;
  
  // Left: Name of Student
  doc.setFont('times', 'bold');
  doc.setFontSize(10.2);
  doc.text('Name of Student: ', marginX, currentY);
  const studLabelW = doc.getTextWidth('Name of Student: ');
  doc.setFont('times', 'normal');
  if (isFilledTemplate && studentFullName) {
    doc.text(studentFullName, marginX + studLabelW, currentY);
  }
  doc.line(marginX + studLabelW, currentY + 0.6, marginX + halfContentWidth, currentY + 0.6);

  // Right: Grade & Section
  const rightColX = marginX + halfContentWidth + 8;
  doc.setFont('times', 'bold');
  doc.text('Grade & Section: ', rightColX, currentY);
  const grLabelW = doc.getTextWidth('Grade & Section: ');
  doc.setFont('times', 'normal');
  if (isFilledTemplate) {
    doc.text(`${gradeLevel} - ${section}`, rightColX + grLabelW, currentY);
  }
  doc.line(rightColX + grLabelW, currentY + 0.6, marginX + contentWidth, currentY + 0.6);
  currentY += 6.2;

  // 16. Checkboxes (Allow / Do not allow)
  doc.rect(marginX + 1, currentY - 3.2, 3.8, 3.8); // checkbox 1
  doc.setFont('times', 'bold');
  doc.setFontSize(10.2);
  doc.text('I allow', marginX + 6.5, currentY);
  doc.setFont('times', 'normal');
  doc.text(` my child to attend and participate in the ${programTitle.toLowerCase()}.`, marginX + 6.5 + doc.getTextWidth('I allow'), currentY);
  currentY += 5.4;

  doc.rect(marginX + 1, currentY - 3.2, 3.8, 3.8); // checkbox 2
  doc.setFont('times', 'bold');
  doc.text('I do not allow', marginX + 6.5, currentY);
  doc.setFont('times', 'normal');
  doc.text(` my child to attend the ${programTitle.toLowerCase()}.`, marginX + 6.5 + doc.getTextWidth('I do not allow'), currentY);
  currentY += 5.8;

  // 17. Reason (if not allowed)
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text('Reason (if not allowed): ', marginX, currentY);
  const reasonLabelW = doc.getTextWidth('Reason (if not allowed): ');
  doc.line(marginX + reasonLabelW, currentY + 0.6, marginX + contentWidth, currentY + 0.6);
  currentY += 6.5;

  // 18. Parent Sign-off (3-COLUMN ROW: Parent Name, Signature, Date)
  const colW1 = 76;
  const colW2 = 46;
  const col3X = marginX + colW1 + colW2 + 6;
  const col2XSig = marginX + colW1 + 3;

  // Col 1: Name of Parent/Guardian
  doc.setFont('times', 'bold');
  doc.setFontSize(9.8);
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
  doc.line(col2XSig + sigLabelW, currentY + 0.6, col2XSig + colW2, currentY + 0.6);

  // Col 3: Date
  doc.setFont('times', 'bold');
  doc.text('Date: ', col3X, currentY);
  const replyDateW = doc.getTextWidth('Date: ');
  doc.line(col3X + replyDateW, currentY + 0.6, marginX + contentWidth, currentY + 0.6);

  // 19. Official DepEd Footer (Bottom of page - positioned cleanly above 1-inch bottom margin at 304.8mm)
  const footerStartY = Math.max(currentY + 8, 287);
  doc.setLineWidth(0.5);
  doc.setDrawColor(15, 23, 42);
  doc.line(marginX, footerStartY, marginX + contentWidth, footerStartY);

  doc.setFont('times', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(15, 23, 42);
  doc.text('731 Epifanio de los Santos Avenue, Quezon City', marginX, footerStartY + 4.2);
  doc.text('(8) 519-36-60', marginX, footerStartY + 8.0);

  doc.setTextColor(30, 64, 175); // blue-700
  doc.text('hs.ramonmagsaysaycubao@depedqc.ph', marginX, footerStartY + 11.8);

  return doc;

  return doc;
}

/**
 * Directly downloads the Guardian's Notice PDF file to the browser.
 */
export function downloadGuardianNoticePDF(data: GuardianNoticeData, filename?: string): boolean {
  try {
    const doc = generateGuardianNoticePDF(data);
    const isEnhancement = data.student.programType === 'Skills Enhancement';
    const finalFilename = filename || `Guardian_Notice_${isEnhancement ? 'Enhancement' : 'Remediation'}_${data.student.lastName}_${data.student.firstName}.pdf`;
    
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
