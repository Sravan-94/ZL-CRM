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
      const response = await fetch('http://localhost:8080/api/leads/getall');
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

  const updateLead = async (leadId: string, updatedData: Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'assignedBdaId' | 'assignedBdaName'>>) => {
    if (!user) {
      throw new Error('User not authenticated for updating lead');
    }
    // Optimistic update (optional, for better UX)
    // const originalLeads = [...bdaLeads];
    // setBdaLeads(prevLeads => prevLeads.map(l => l.id === leadId ? { ...l, ...updatedData, updatedAt: new Date().toISOString() } : l));

    try {
      const leadToUpdate = bdaLeads.find(l => l.id === leadId);
      if (!leadToUpdate) throw new Error('Lead not found');

      const currentActionTakenParts: string[] = [];
      if (updatedData.whatsappSent === true) currentActionTakenParts.push('WhatsApp');
      if (updatedData.emailSent === true) currentActionTakenParts.push('Email');
      if (updatedData.quotationSent === true) currentActionTakenParts.push('Quotation');
      if (updatedData.sampleWorkSent === true) currentActionTakenParts.push('Sample Work');

      let finalActionTaken: string | null = null;
      if (currentActionTakenParts.length > 0) {
        finalActionTaken = currentActionTakenParts.join(', ');
      } else {
        // If no new actions are specified in updatedData, reconstruct from existing leadToUpdate
        const existingActionParts: string[] = [];
        if (leadToUpdate.whatsappSent) existingActionParts.push('WhatsApp');
        if (leadToUpdate.emailSent) existingActionParts.push('Email');
        if (leadToUpdate.quotationSent) existingActionParts.push('Quotation');
        if (leadToUpdate.sampleWorkSent) existingActionParts.push('Sample Work');
        if (existingActionParts.length > 0) {
          finalActionTaken = existingActionParts.join(', ');
        }
      }


      // Construct a new payload object with only the fields expected by the API
      const apiPayload: any = {
        id: parseInt(leadId, 10),
        name: updatedData.name !== undefined ? updatedData.name : leadToUpdate.name,
        contactNo: updatedData.phone !== undefined ? updatedData.phone : leadToUpdate.phone,
        email: updatedData.email !== undefined ? updatedData.email : leadToUpdate.email,
        industry: updatedData.industry !== undefined ? updatedData.industry : leadToUpdate.industry,
        service: updatedData.service !== undefined ? updatedData.service : leadToUpdate.service,
        type: updatedData.type !== undefined ? updatedData.type : leadToUpdate.type,
        status: updatedData.status !== undefined ? updatedData.status : leadToUpdate.status,
        assignedTo: leadToUpdate.assignedBdaName,
        followUp: updatedData.followUpDate !== undefined ? updatedData.followUpDate : leadToUpdate.followUpDate,
        temperature: updatedData.temperature !== undefined ? updatedData.temperature : leadToUpdate.temperature,
        intrests: updatedData.interests !== undefined ? updatedData.interests.join(',') : leadToUpdate.interests.join(','),
        remarks: updatedData.remarks !== undefined ? updatedData.remarks : leadToUpdate.remarks,
        lastUpdated: new Date().toISOString(),
        actionTaken: finalActionTaken,
        // actionStatus: leadToUpdate.actionStatus, // 'actionStatus' is not in our standardized Lead type. If API needs it, it should come from original API data if stored separately or be part of Lead type.
      };
      // If your API has an 'actionStatus' field and it's important, ensure it's handled.
      // For now, assuming it's not part of the standardized Lead type used in the frontend primarily.


      const response = await fetch(`http://localhost:8080/api/leads/update/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Add Authorization header if needed:
          // 'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify(apiPayload), // Use apiPayload here
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! Status: ${response.status}. ${errorData}`);
      }
      // Refresh leads from server to get the most up-to-date state
      await fetchLeads();
    } catch (err) {
      console.error('Error updating lead:', err);
      // Rollback optimistic update if it was implemented
      // setBdaLeads(originalLeads);
      setError(err instanceof Error ? err.message : 'Failed to update lead.');
      throw err; // Re-throw to be caught by the calling component
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