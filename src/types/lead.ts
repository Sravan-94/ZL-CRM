export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'
  | 'warm'
  | 'WrongNumber'
  | 'NotAnswered'
  | 'CallBackLater'
  | 'Interested'
  | 'NotInterested'
  | 'SwitchedOff';

export interface Lead {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  industry: string | null;
  companyName: string | null;
  city: string | null;
  state: string | null;
  status: LeadStatus;
  assignedBdaId: string | null;
  assignedBdaName: string | null;
  followUpDate: string | null;
  intrests: string | null;
  remarks: string | null;
  actionStatus: string | null;
  actionTaken: string | null;
  createdAt: string; // Required string
  updatedAt: string; // Required string
  loggedinId?: number;
  whatsappSent?: boolean;
  emailSent?: boolean;
  quotationSent?: boolean;
  sampleWorkSent?: boolean;
  MeetingBooked?: boolean;
  DemoScheduled?: boolean;
  NeedMoreInfo?: boolean;
  WaitingForDecision?: boolean;
} 