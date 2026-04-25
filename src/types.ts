/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'secretary' | 'lawyer' | 'chairman';

export interface Owner {
  id: string;
  name: string;
  room: string;
  area: number;
  share: number; // Percentage
  contact: string;
  notified: boolean;
  notificationDate?: string;
  notificationMethod?: 'email' | 'post' | 'hand' | 'none';
}

export interface AgendaItem {
  id: string;
  number: number;
  title: string;
  decisionText: string;
  requiresAttachments: string[];
  votes?: {
    for: number; // area or percent
    against: number;
    abstain: number;
  };
}

export type MeetingType = 'ochno' | 'ochno-zaochno' | 'zaochno';

export interface OSSMeeting {
  id: string;
  type: MeetingType;
  dateStart: string;
  dateEnd: string;
  location: string;
  initiator: string;
  secretary: string;
  chairperson: string;
  houseAddress: string;
  owners: Owner[];
  agenda: AgendaItem[];
  attachments: { name: string; type: string }[];
  status: 'draft' | 'preparing' | 'voting' | 'completed';
}

export interface AIValidation {
  status: 'ok' | 'warning' | 'error';
  errors: { code: string; message: string; howToFix: string }[];
  warnings: { code: string; message: string; howToFix: string }[];
  checks: {
    requiredFieldsComplete: boolean;
    agendaBallotConsistency: boolean;
    minutesConsistency: boolean;
    quorumMathValid: boolean;
    attachmentsComplete: boolean;
  };
}

export interface GeneratedDocs {
  noticeHtml: string;
  ballotHtml: string;
  minutesHtml: string;
  attachmentsIndexHtml: string;
  agendaItems?: AgendaItem[];
}
