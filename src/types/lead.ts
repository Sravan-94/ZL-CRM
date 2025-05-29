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
  assignedTo: string | null;
  assignedBdaId: string | null;
  assignedBdaName: string | null;
  followUpDate: string | null;
  temperature: string | null;
  interests: string | null;
  remarks: string | null;
  actionStatus: string | null;
  actionTaken: string | null;
  createdAt: string;
  updatedAt: string;
  lastUpdated?: string;
  loggedinId?: number;
  severity?: string;
  service?: string | null;
  type?: string | null;
} 