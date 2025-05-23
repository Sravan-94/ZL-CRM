export type UserRole = 'admin' | 'bda';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type LeadTemperature = 'hot' | 'warm' | 'cold' | '';

export type LeadStatus = 
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export type LeadInterest = 'website' | 'app' | 'crm' | 'both';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  industry: string;
  service: string;
  type: string;
  status: LeadStatus;
  assignedBdaId: string | null;
  assignedBdaName: string | null;
  followUpDate: string | null;
  temperature: LeadTemperature;
  interests: LeadInterest[];
  remarks: string;
  whatsappSent: boolean;
  emailSent: boolean;
  quotationSent: boolean;
  sampleWorkSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeadFormData {
  temperature: LeadTemperature;
  interests: LeadInterest[];
  remarks: string;
  followUpDate: string | null;
  whatsappSent: boolean;
  emailSent: boolean;
  quotationSent: boolean;
  sampleWorkSent: boolean;
  status: LeadStatus;
}

export interface DashboardMetrics {
  totalLeads: number;
  newLeads: number;
  followUpsToday: number;
  leadsByStatus: Record<LeadStatus, number>;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  leadId: string;
  leadName: string;
  action: string;
  performedBy: string;
  performedById: string;
  timestamp: string;
}

export interface BDAPerformance {
  bdaId: string;
  bdaName: string;
  totalLeads: number;
  totalCalls: number;
  followupsMade: number;
  quotationsSent: number;
  dealsClosed: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  status: 'overdue' | 'today' | 'upcoming';
  leadId: string;
}