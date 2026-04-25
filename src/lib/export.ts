/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { OSSMeeting, GeneratedDocs } from '../types';

export async function exportToPdf(html: string, filename: string) {
  const doc = new jsPDF();
  
  // Very basic HTML to Text conversion for PDF as a placeholder 
  // In a real app we'd use a more robust html-to-pdf library
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const text = tempDiv.innerText;
  
  const splitText = doc.splitTextToSize(text, 180);
  doc.text(splitText, 10, 10);
  doc.save(`${filename}.pdf`);
}

export async function createArchiveZip(meeting: OSSMeeting, docs: GeneratedDocs) {
  const zip = new JSZip();
  
  const folder = zip.folder("OSS_Package");
  if (folder) {
    folder.file("Notice.html", docs.noticeHtml);
    folder.file("Ballot.html", docs.ballotHtml);
    folder.file("Minutes.html", docs.minutesHtml);
    folder.file("Attachments_Index.html", docs.attachmentsIndexHtml);
    
    // Add data as JSON for reference
    folder.file("meeting_data.json", JSON.stringify(meeting, null, 2));
  }
  
  const content = await zip.generateAsync({ type: "blob" });
  const url = window.URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `OSS_Package_${meeting.id}.zip`;
  a.click();
}
