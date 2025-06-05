import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Lead, LeadStatus, LeadTemperature, LeadInterest } from '../types'; // Using standardized types

interface LeadsContextType {
  bdaLeads: Lead[];
  isLoading: boolean;
  error: string | null;
  fetchLeads: () => Promise<void>;
  updateLead: (leadId: string, updatedData: Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'assignedBdaId' | 'assignedBdaName'>>) => Promise<void>;
  getLeadById: (leadId: string) => Lead | undefined;
}

const LeadsContext = createContext<LeadsContextType | undefined>(undefined);

// Helper to parse interests string (e.g., "Website, App") into LeadInterest[]
const parseInterests = (interestsStr: string | null | undefined): LeadInterest[] => {
  if (!interestsStr) return [];
  const validInterests: Set<string> = new Set(['website', 'app', 'crm', 'both', 'Ecommerce', 'CustomSoftware', 'AIIntegration']); // Add all valid LeadInterest values
  return interestsStr
    .split(',')
    .map(interest => interest.trim() as LeadInterest)
    .filter(interest => validInterests.has(interest));
};

// Helper to parse actionTaken string
const parseActionTaken = (actionTakenStr: string | null | undefined) => {
  const actions = {
    whatsappSent: false,
    emailSent: false,
    quotationSent: false,
    sampleWorkSent: false,
  };
  if (actionTakenStr) {
    const taken = actionTakenStr.toLowerCase();
    if (taken.includes('whatsapp')) actions.whatsappSent = true;
    if (taken.includes('email')) actions.emailSent = true;
    if (taken.includes('quotation')) actions.quotationSent = true;
    if (taken.includes('sample') || taken.includes('sample work')) actions.sampleWorkSent = true;
  }
  return actions;
};


export const LeadsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [bdaLeads, setBdaLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const mapApiLeadToLeadType = (apiLead: any): Lead => {
    const { whatsappSent, emailSent, quotationSent, sampleWorkSent } = parseActionTaken(apiLead.actionTaken);
    return {
      id: String(apiLead.id), // API might send number
      name: apiLead.name || '',
      phone: apiLead.contactNo || '', // Map contactNo to phone
      email: apiLead.email || '',
      industry: apiLead.industry || '', // Assuming API provides this, or default
      service: apiLead.service || '',   // Assuming API provides this, or default
      type: apiLead.type || '',       // Assuming API provides this, or default
      status: (apiLead.status as LeadStatus) || 'new',
      assignedBdaId: user?.id || null, // Assuming current user is the BDA if filtered
      assignedBdaName: apiLead.assignedTo || user?.name || null,
      followUpDate: apiLead.followUp || null, // Map followUp to followUpDate
      temperature: (apiLead.temperature as LeadTemperature) || '',
      interests: parseInterests(apiLead.intrests || apiLead.interests), // Map intrests to interests array
      remarks: apiLead.remarks || '',
      whatsappSent,
      emailSent,
      quotationSent,
      sampleWorkSent,
      createdAt: apiLead.createdAt || new Date().toISOString(), // Assuming API provides this, or default
      updatedAt: apiLead.lastUpdated || new Date().toISOString(), // Map lastUpdated to updatedAt
    };
  };

  const fetchLeads = useCallback(async () => {
    if (!user || !user.name) {
      setError('User not available to fetch leads.');
      setIsLoading(false);
      setBdaLeads([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://147.93.102.131:8080/api/leads/getall');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data: any[] = await response.json();
      const allLeads = data.map(mapApiLeadToLeadType);

      const filteredLeads = allLeads.filter(lead =>
        lead.assignedBdaName?.trim().toLowerCase() === user.name?.trim().toLowerCase()
      );
      setBdaLeads(filteredLeads);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leads.');
      setBdaLeads([]); // Clear leads on error
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateLead = async (
    leadId: string,
    updatedData: any // Accept any to allow extra fields
  ) => {
    if (!user) throw new Error('User not authenticated for updating lead');

    try {
      const leadToUpdate = bdaLeads.find(l => l.id === leadId);
      if (!leadToUpdate) throw new Error('Lead not found');

      // Compose actionTaken
      let actionTaken = updatedData.actionTaken;
      if (actionTaken === undefined) {
        const actions: string[] = [];
        if (updatedData.whatsappSent ?? leadToUpdate.whatsappSent) actions.push('whatsapp');
        if (updatedData.emailSent ?? leadToUpdate.emailSent) actions.push('email');
        if (updatedData.quotationSent ?? leadToUpdate.quotationSent) actions.push('quotation');
        if (updatedData.sampleWorkSent ?? leadToUpdate.sampleWorkSent) actions.push('sample');
        actionTaken = actions.join(', ');
      }

      const apiPayload = {
        name: updatedData.name ?? leadToUpdate.name ?? '',
        contactNo: updatedData.phone ?? leadToUpdate.phone ?? '',
        email: updatedData.email ?? leadToUpdate.email ?? '',
        status: updatedData.status ?? leadToUpdate.status ?? '',
        actionStatus: updatedData.actionStatus ?? updatedData.temperature ?? '',
        assignedTo: updatedData.assignedTo ?? leadToUpdate.assignedBdaName ?? '',
        intrests: Array.isArray(updatedData.interests)
          ? updatedData.interests.join(', ')
          : (updatedData.intrests ?? ''),
        remarks: updatedData.remarks ?? leadToUpdate.remarks ?? '',
        actionTaken: actionTaken ?? '',
        followUp: updatedData.followUp ?? updatedData.followUpDate ?? leadToUpdate.followUpDate ?? '',
        loggedinId: user.id,
        companyName: updatedData.companyName ?? '',
        industry: updatedData.industry ?? leadToUpdate.industry ?? '',
        city: updatedData.city ?? '',
        state: updatedData.state ?? ''
      };

      const response = await fetch(`http://147.93.102.131:8080/api/leads/update/${parseInt(leadId, 10)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! Status: ${response.status}. ${errorData}`);
      }
      await fetchLeads();
    } catch (err) {
      console.error('Error updating lead:', err);
      setError(err instanceof Error ? err.message : 'Failed to update lead.');
      throw err;
    }
  };

  const getLeadById = (leadId: string): Lead | undefined => {
    return bdaLeads.find(lead => lead.id === leadId);
  };

  return (
    <LeadsContext.Provider value={{ bdaLeads, isLoading, error, fetchLeads, updateLead, getLeadById }}>
      {children}
    </LeadsContext.Provider>
  );
};

export const useLeads = () => {
  const context = useContext(LeadsContext);
  if (context === undefined) {
    throw new Error('useLeads must be used within a LeadsProvider');
  }
  return context;
};