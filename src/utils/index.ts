import { format, isToday, isBefore } from 'date-fns';
import { Lead, LeadStatus } from '../types';

// Format a date with a consistent format
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Not scheduled';
  return format(new Date(dateString), 'MMM d, yyyy');
};

// Get a class name for a follow-up date status
export const getFollowUpStatusClass = (followUpDate: string | null): string => {
  if (!followUpDate) return '';
  
  const date = new Date(followUpDate);
  if (isBefore(date, new Date()) && !isToday(date)) {
    return 'text-red-600 font-medium';
  } 
  if (isToday(date)) {
    return 'text-amber-600 font-medium';
  }
  return 'text-slate-800';
};

// Get a color for a lead status
export const getStatusColor = (status: LeadStatus): string => {
  switch(status) {
    case 'new': 
      return 'bg-slate-100 text-slate-800';
    case 'contacted': 
      return 'bg-blue-100 text-blue-800';
    case 'qualified': 
      return 'bg-purple-100 text-purple-800';
    case 'proposal': 
      return 'bg-amber-100 text-amber-800';
    case 'negotiation': 
      return 'bg-orange-100 text-orange-800';
    case 'closed_won': 
      return 'bg-green-100 text-green-800';
    case 'closed_lost': 
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

// Format a lead status for display
export const formatStatus = (status: LeadStatus): string => {
  if (status === 'closed_won') return 'Won';
  if (status === 'closed_lost') return 'Lost';
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
};

// Calculate conversion rate
export const calculateConversionRate = (leads: Lead[]): number => {
  if (leads.length === 0) return 0;
  
  const closedWon = leads.filter(lead => lead.status === 'closed_won').length;
  return Math.round((closedWon / leads.length) * 100);
};

// Group leads by status
export const groupLeadsByStatus = (leads: Lead[]): Record<LeadStatus, Lead[]> => {
  const result = {} as Record<LeadStatus, Lead[]>;
  
  leads.forEach(lead => {
    if (!result[lead.status]) {
      result[lead.status] = [];
    }
    result[lead.status].push(lead);
  });
  
  return result;
};