import { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowUpDown,
  Search,
  Filter,
  Download,
  Upload,
  UserPlus,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import { format, parseISO, isValid, isToday, isBefore } from 'date-fns';
import { toast } from 'react-hot-toast';
import Papa from 'papaparse';
import LeadModal from '../../components/leads/LeadModal';
import { useAuth } from '../../contexts/AuthContext';
import { Lead, LeadStatus } from '../../types/lead';

interface User {
  id: string;
  name: string;
  role: 'BDA' | 'admin';
}

const BdaLeads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof Lead>('status');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [bdaFilter, setBdaFilter] = useState<string>('all');
  const [followUpFilter, setFollowUpFilter] = useState<'all' | 'today' | 'overdue'>('all');
  const [isAssigningLeads, setIsAssigningLeads] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [selectedBdaForAssignment, setSelectedBdaForAssignment] = useState<string>('');
  const [bdaUsers, setBdaUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bdaFetchError, setBdaFetchError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Define the order of statuses
  const statusOrder: Record<LeadStatus, number> = {
    'new': 1,
    'contacted': 2,
    'qualified': 3,
    'proposal': 4,
    'negotiation': 5,
    'closed_won': 6,
    'closed_lost': 7,
    'warm': 8,
    'WrongNumber': 9,
    'NotAnswered': 10,
    'CallBackLater': 11,
    'Interested': 12,
    'NotInterested': 13,
    'SwitchedOff': 14
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const leadsResponse = await fetch('http://localhost:8080/api/leads/getall');
        if (!leadsResponse.ok) throw new Error(`Failed to fetch leads: ${leadsResponse.status}`);
        const rawLeadsData = await leadsResponse.json();

        const leadsData: Lead[] = Array.isArray(rawLeadsData)
          ? rawLeadsData.map((lead: any) => ({
              id: String(lead.id),
              name: lead.name || null,
              phone: lead.contactNo || null,
              email: lead.email || null,
              industry: lead.industry || null,
              companyName: lead.companyName || null,
              city: lead.city || null,
              state: lead.state || null,
              status: (lead.status || 'new') as LeadStatus,
              assignedTo: lead.assignedTo || null,
              followUpDate: lead.followUp || null,
              temperature: lead.temperature || null,
              interests: lead.interests || null,
              remarks: lead.remarks || null,
              actionStatus: lead.actionStatus || null,
              actionTaken: lead.actionTaken || null,
              createdAt: (typeof lead.createdAt === 'string' && lead.createdAt) ? lead.createdAt : new Date().toISOString(),
              updatedAt: (typeof lead.lastUpdated === 'string' && lead.lastUpdated) ? lead.lastUpdated : new Date().toISOString(),
              lastUpdated: (typeof lead.lastUpdated === 'string' && lead.lastUpdated) ? lead.lastUpdated : new Date().toISOString(),
            }))
          : [];

        if (isMounted) setLeads(leadsData);

        const usersResponse = await fetch('http://localhost:8080/api/bda-users');
        if (!usersResponse.ok) throw new Error(`Failed to fetch BDAs: ${usersResponse.status}`);
        const usersData = await usersResponse.json();

        const bdaUsers = Array.isArray(usersData)
          ? usersData
              .filter((user: any) => user.role === 'BDA')
              .map((user: any) => ({
                id: String(user.id),
                name: user.name || '',
                role: user.role as 'BDA' | 'admin',
              }))
          : [];

        if (isMounted) {
          setBdaUsers(bdaUsers);
          setBdaFetchError(bdaUsers.length === 0 ? 'No BDA users available' : null);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        if (isMounted) toast.error('Failed to load leads or BDAs');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const isValidDate = (dateString: string | null): boolean => {
    if (!dateString) return false;
    try {
      return isValid(parseISO(dateString));
    } catch {
      return false;
    }
  };

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(leadId)) newSelection.delete(leadId);
      else newSelection.add(leadId);
      return newSelection;
    });
  };

  const handleSort = (key: keyof Lead) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };

  const filteredLeads = leads
    .filter(lead => {
      const matchesSearch =
        (lead.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.phone || '').includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesBda =
        bdaFilter === 'all' ||
        (bdaFilter === 'unassigned' ? !lead.assignedTo : lead.assignedTo === bdaFilter);
      const matchesFollowUp =
        followUpFilter === 'all' ||
        (followUpFilter === 'today' &&
          lead.followUpDate &&
          isValid(parseISO(lead.followUpDate)) &&
          isToday(parseISO(lead.followUpDate))) ||
        (followUpFilter === 'overdue' &&
          lead.followUpDate &&
          isValid(parseISO(lead.followUpDate)) &&
          isBefore(parseISO(lead.followUpDate), new Date()) &&
          !isToday(parseISO(lead.followUpDate)));
      return matchesSearch && matchesStatus && matchesBda && matchesFollowUp;
    })
    .sort((a, b) => {
      // First sort by status using the predefined order
      const statusA = statusOrder[a.status] || 999;
      const statusB = statusOrder[b.status] || 999;
      
      if (statusA !== statusB) {
        return statusA - statusB;
      }

      // If status is the same, sort by lastUpdated within the status group
      const dateA = new Date(a.lastUpdated || a.updatedAt || '').getTime();
      const dateB = new Date(b.lastUpdated || b.updatedAt || '').getTime();
      return dateA - dateB; // Ascending order for dates within status group
    });

  const totalLeadsCount = filteredLeads.length;

  const todayFollowupsCount = useMemo(() => {
    return leads.filter(lead => 
      lead.followUpDate && isValid(parseISO(lead.followUpDate)) && isToday(parseISO(lead.followUpDate))
    ).length;
  }, [leads]);

  const overdueFollowupsCount = useMemo(() => {
    return leads.filter(lead => 
      lead.followUpDate && isValid(parseISO(lead.followUpDate)) && isBefore(parseISO(lead.followUpDate), new Date()) && !isToday(parseISO(lead.followUpDate))
    ).length;
  }, [leads]);

  const closedDealsCount = useMemo(() => {
    return filteredLeads.filter(lead => lead.status === 'closed_won').length;
  }, [filteredLeads]);

  const handleOpenLeadModal = (lead: Lead) => {
    setSelectedLead({
      ...lead,
      createdAt: lead.createdAt || new Date().toISOString(),
      updatedAt: lead.updatedAt || new Date().toISOString(),
      lastUpdated: lead.lastUpdated || new Date().toISOString(),
    });
    setIsModalOpen(true);
  };

  const handleSaveLead = async (updatedLead: Lead): Promise<boolean> => {
    console.log('Attempting to save lead:', updatedLead);
    setIsLoading(true);
    let success = false;
    try {
      const payload = {
        ...updatedLead,
        id: parseInt(updatedLead.id),
        loggedinId: user?.id ? parseInt(user.id) : undefined,
      };
      console.log('Saving lead with payload:', payload);
      
      const response = await fetch(`http://localhost:8080/api/leads/update/${payload.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save lead: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Save lead response:', result);
      toast.success('Lead updated successfully');
      
      setLeads(prevLeads =>
        prevLeads.map(lead => (lead.id === updatedLead.id ? result : lead))
      );

      success = true;
    } catch (error) {
      console.error('Error saving lead:', error);
      toast.error(`Failed to save lead: ${error instanceof Error ? error.message : String(error)}`);
      success = false;
    } finally {
      setIsLoading(false);
    }
    return success;
  };

  const handleAssignLeads = async () => {
    if (!selectedBdaForAssignment || selectedLeads.size === 0) {
      toast.error('Please select a BDA and at least one lead');
      return;
    }

    const selectedBda = bdaUsers.find(bda => bda.id === selectedBdaForAssignment);
    if (!selectedBda) {
      toast.error('Invalid BDA selected');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/leads/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: Array.from(selectedLeads).map(id => parseInt(id)),
          bdaId: parseInt(selectedBda.id),
          bdaName: selectedBda.name,
        }),
      });

      if (!response.ok) throw new Error('Failed to assign leads');

      setLeads(leads =>
        leads.map(lead => {
          const updatedLead = selectedLeads.has(lead.id)
            ? {
                ...lead,
                assignedTo: selectedBda.name,
                updatedAt: new Date().toISOString(),
              }
            : lead;
          return {
            ...updatedLead,
            createdAt: typeof updatedLead.createdAt === 'string' ? updatedLead.createdAt : new Date().toISOString(),
            updatedAt: typeof updatedLead.updatedAt === 'string' ? updatedLead.updatedAt : new Date().toISOString(),
          };
        })
      );

      setSelectedLeads(new Set());
      setIsAssigningLeads(false);
      setSelectedBdaForAssignment('');
      toast.success(`${selectedLeads.size} leads assigned to ${selectedBda.name}`);
    } catch (err) {
      console.error('Error assigning leads:', err);
      toast.error('Failed to assign leads');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/leads/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload CSV');

      const message = await response.text();
      toast.success(message);

      const leadsResponse = await fetch('http://localhost:8080/api/leads/getall');
      if (!leadsResponse.ok) throw new Error('Failed to fetch updated leads');
      const rawLeadsData = await leadsResponse.json();

      const newLeads: Lead[] = Array.isArray(rawLeadsData)
        ? rawLeadsData.map((lead: any) => ({
            id: String(lead.id),
            name: lead.name || null,
            phone: lead.contactNo || null,
            email: lead.email || null,
            industry: lead.industry || null,
            companyName: lead.companyName || null,
            city: lead.city || null,
            state: lead.state || null,
            status: (lead.status || 'new') as LeadStatus,
            assignedTo: lead.assignedTo || null,
            followUpDate: lead.followUp || null,
            temperature: lead.temperature || null,
            interests: lead.interests || null,
            remarks: lead.remarks || null,
            actionStatus: lead.actionStatus || null,
            actionTaken: lead.actionTaken || null,
            createdAt: (typeof lead.createdAt === 'string' && lead.createdAt) ? lead.createdAt : new Date().toISOString(),
            updatedAt: (typeof lead.lastUpdated === 'string' && lead.lastUpdated) ? lead.lastUpdated : new Date().toISOString(),
            lastUpdated: (typeof lead.lastUpdated === 'string' && lead.lastUpdated) ? lead.lastUpdated : new Date().toISOString(),
          }))
        : [];

      setLeads(newLeads);
    } catch (err) {
      console.error('Error importing CSV:', err);
      toast.error('Failed to upload CSV');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportCSV = () => {
    const exportData = filteredLeads.map(lead => ({
      Id: lead.id,
      Name: lead.name || '',
      ContactNo: lead.phone || '',
      Email: lead.email || '',
      Status: lead.status,
      ActionStatus: lead.actionStatus || '',
      AssignedTo: lead.assignedTo || 'Unassigned',
      Intrests: lead.interests || '',
      Remarks: lead.remarks || '',
      ActionTaken: lead.actionTaken || '',
      CompanyName: lead.companyName || '',
      Industry: lead.industry || '',
      City: lead.city || '',
      State: lead.state || '',
      FollowUp: lead.followUpDate || '',
      LastUpdated: lead.updatedAt,
    }));

    const csv = Papa.unparse(exportData, { quotes: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Leads exported successfully');
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setBdaFilter('all');
    setFollowUpFilter('all');
    setSearchTerm('');
    setFiltersOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-semibold text-slate-800">Leads Management</h1>
        <div className="flex flex-wrap gap-2">
          {/* Remove Assign Leads Button */}
          {/* <button
            onClick={() => setIsAssigningLeads(!isAssigningLeads)}
            disabled={isLoading}
            className={`px-3 py-2 text-sm font-medium rounded-md flex items-center ${
              isAssigningLeads
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50'
            }`}
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            Assign Leads
          </button> */}
          {/* Remove Import CSV Button */}
          {/* <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="px-3 py-2 text-sm font-medium rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center disabled:opacity-50"
          >
            <Upload className="h-4 w-4 mr-1.5" />
            Import CSV
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportCSV}
              accept=".csv"
              className="hidden"
            />
          </button> */}
          {/* Remove Export CSV Button */}
          {/* <button
            onClick={handleExportCSV}
            disabled={isLoading}
            className="px-3 py-2 text-sm font-medium rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </button> */}
        </div>
      </div>

      {isAssigningLeads && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <div>
              <h3 className="font-medium text-indigo-700">Assign Leads to BDA</h3>
              <p className="text-sm text-indigo-600">Selected: {selectedLeads.size} leads</p>
            </div>
            <div className="flex items-center space-x-2">
              {bdaFetchError ? (
                <p className="text-sm text-red-600">{bdaFetchError}</p>
              ) : bdaUsers.length === 0 ? (
                <p className="text-sm text-slate-500">No BDA users available</p>
              ) : (
                <select
                  value={selectedBdaForAssignment}
                  onChange={e => setSelectedBdaForAssignment(e.target.value)}
                  className="block w-48 rounded-md border-slate-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm"
                  disabled={isLoading}
                >
                  <option value="">Select BDA</option>
                  {bdaUsers.map(bda => (
                    <option key={bda.id} value={bda.id}>
                      {bda.name}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={handleAssignLeads}
                disabled={!selectedBdaForAssignment || selectedLeads.size === 0 || isLoading || bdaUsers.length === 0}
                className="px-3 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center"
              >
                <Check className="h-4 w-4 mr-1.5" />
                Assign
              </button>
              <button
                onClick={() => {
                  setIsAssigningLeads(false);
                  setSelectedLeads(new Set());
                  setSelectedBdaForAssignment('');
                }}
                className="p-2 text-slate-500 hover:text-slate-700 rounded-md"
                disabled={isLoading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border-slate-300 pl-10 pr-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
        </div>
        <div className="flex space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="px-3 py-2 text-sm font-medium rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center w-full sm:w-auto justify-center disabled:opacity-50"
            disabled={isLoading}
          >
            <Filter className="h-4 w-4 mr-1.5" />
            Filter
            {filtersOpen ? <ChevronUp className="h-4 w-4 ml-1.5" /> : <ChevronDown className="h-4 w-4 ml-1.5" />}
          </button>
          <button
            onClick={handleClearFilters}
            className="px-3 py-2 text-sm font-medium rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center w-full sm:w-auto justify-center disabled:opacity-50"
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-1.5" />
            Clear Filters
          </button>
        </div>
      </div>

      {filtersOpen && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as LeadStatus | 'all')}
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
              disabled={isLoading}
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
              <option value="closed_won">Closed (Won)</option>
              <option value="closed_lost">Closed (Lost)</option>
              <option value="warm">Warm</option>
              <option value="WrongNumber">Wrong Number</option>
              <option value="NotAnswered">Not Answered</option>
              <option value="CallBackLater">Call Back Later</option>
              <option value="Interested">Interested</option>
              <option value="NotInterested">Not Interested</option>
              <option value="SwitchedOff">Switched Off</option>
            </select>
          </div>
          <div>
            <label htmlFor="bda-filter" className="block text-sm font-medium text-slate-700 mb-1">
              Assigned BDA
            </label>
            <select
              id="bda-filter"
              value={bdaFilter}
              onChange={e => setBdaFilter(e.target.value)}
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
              disabled={isLoading}
            >
              <option value="all">All BDAs</option>
              <option value="unassigned">Unassigned</option>
              {bdaUsers.map(bda => (
                <option key={bda.id} value={bda.id}>
                  {bda.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Filter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* All Leads Card */}
        <div
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-4 cursor-pointer hover:bg-blue-100 transition duration-150 ease-in-out"
          onClick={() => {
            setStatusFilter('all');
            setBdaFilter('all');
            setFollowUpFilter('all');
          }}
        >
          <div className="p-2 rounded-full bg-blue-100">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-blue-800">All Leads</div>
            <div className="text-2xl font-semibold text-blue-900">{leads.length}</div>
          </div>
        </div>
        {/* Today's Follow-ups Card */}
        <div
          className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center space-x-4 cursor-pointer hover:bg-amber-100 transition duration-150 ease-in-out"
          onClick={() => {
            setStatusFilter('all');
            setBdaFilter('all');
            setFollowUpFilter('today');
          }}
        >
          <div className="p-2 rounded-full bg-amber-100">
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-amber-800">Today's Follow-ups</div>
            <div className="text-2xl font-semibold text-amber-900">{todayFollowupsCount}</div>
          </div>
        </div>
        {/* Overdue Follow-ups Card */}
        <div
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-4 cursor-pointer hover:bg-red-100 transition duration-150 ease-in-out"
          onClick={() => {
            setStatusFilter('all');
            setBdaFilter('all');
            setFollowUpFilter('overdue');
          }}
        >
          <div className="p-2 rounded-full bg-red-100">
            <Clock className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-red-800">Overdue Follow-ups</div>
            <div className="text-2xl font-semibold text-red-900">{overdueFollowupsCount}</div>
          </div>
        </div>
        {/* New Leads Card */}
        <div
          className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-4 cursor-pointer hover:bg-green-100 transition duration-150 ease-in-out"
          onClick={() => {
            setStatusFilter('new');
            setBdaFilter('all');
            setFollowUpFilter('all');
          }}
        >
          <div className="p-2 rounded-full bg-green-100">
            <UserPlus className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-green-800">New Leads</div>
            <div className="text-2xl font-semibold text-green-900">{useMemo(() => leads.filter(lead => lead.status === 'new').length, [leads])}</div>
          </div>
        </div>
      </div>

      {isLoading && <div className="text-center py-4">Loading...</div>}

      {!isLoading && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {isAssigningLeads && (
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-10"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedLeads(new Set(filteredLeads.map(lead => lead.id)));
                          } else {
                            setSelectedLeads(new Set());
                          }
                        }}
                      />
                    </th>
                  )}
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Name
                      <ArrowUpDown className="h-4 w-4 ml-1" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                  >
                    Contact
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      <ArrowUpDown className="h-4 w-4 ml-1" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('assignedTo')}
                  >
                    <div className="flex items-center">
                      Assigned To
                      <ArrowUpDown className="h-4 w-4 ml-1" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('followUpDate')}
                  >
                    <div className="flex items-center">
                      Follow-up
                      <ArrowUpDown className="h-4 w-4 ml-1" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('updatedAt')}
                  >
                    <div className="flex items-center">
                      Last Updated
                      <ArrowUpDown className="h-4 w-4 ml-1" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isAssigningLeads ? 7 : 6}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No leads found. Try adjusting your filters.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map(lead => (
                    <tr
                      key={lead.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        if (isAssigningLeads) {
                          toggleLeadSelection(lead.id);
                        } else {
                          handleOpenLeadModal(lead);
                        }
                      }}
                    >
                      {isAssigningLeads && (
                        <td className="px-6 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="cursor-pointer rounded-md border-gray-400 text-blue-600 focus:shadow-outline focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            checked={selectedLeads.has(lead.id)}
                            onChange={() => toggleLeadSelection(lead.id)}
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{lead.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{lead.industry || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lead.phone || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{lead.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            lead.status === 'new'
                              ? 'bg-blue-100 text-blue-800'
                              : lead.status === 'contacted'
                              ? 'bg-green-100 text-green-800'
                              : lead.status === 'qualified'
                              ? 'bg-purple-100 text-purple-800'
                              : lead.status === 'proposal'
                              ? 'bg-yellow-100 text-yellow-800'
                              : lead.status === 'negotiation'
                              ? 'bg-orange-100 text-orange-800'
                              : lead.status === 'closed_won'
                              ? 'bg-green-600 text-white'
                              : lead.status === 'closed_lost'
                              ? 'bg-red-100 text-red-800'
                              : lead.status === 'warm'
                              ? 'bg-amber-100 text-amber-800'
                              : lead.status === 'WrongNumber'
                              ? 'bg-red-100 text-red-800'
                              : lead.status === 'NotAnswered'
                              ? 'bg-gray-100 text-gray-800'
                              : lead.status === 'CallBackLater'
                              ? 'bg-yellow-100 text-yellow-800'
                              : lead.status === 'Interested'
                              ? 'bg-green-100 text-green-800'
                              : lead.status === 'NotInterested'
                              ? 'bg-red-100 text-red-800'
                              : lead.status === 'SwitchedOff'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {lead.status.charAt(0).toUpperCase() + lead.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lead.assignedTo || 'Unassigned'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.followUpDate && isValidDate(lead.followUpDate) ? (
                          <div
                            className={`text-sm ${
                              new Date(lead.followUpDate) < new Date() &&
                              format(new Date(lead.followUpDate), 'yyyy-MM-dd') !==
                                format(new Date(), 'yyyy-MM-dd')
                                ? 'text-red-600 font-medium'
                                : format(new Date(lead.followUpDate), 'yyyy-MM-dd') ===
                                  format(new Date(), 'yyyy-MM-dd')
                                ? 'text-amber-600 font-medium'
                                : 'text-gray-800'
                            }`}
                          >
                            {format(new Date(lead.followUpDate), 'MMM d, yyyy')}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Not scheduled</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.updatedAt && isValidDate(lead.updatedAt) ? (
                          <div className="text-sm text-gray-500">
                            {format(parseISO(lead.updatedAt), 'MMM d, yyyy h:mm a')}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Invalid date</div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedLead && (
        <LeadModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedLead(null);
          }}
          lead={selectedLead}
          onSave={handleSaveLead}
          readOnly={false}
        />
      )}
    </div>
  );
};

export default BdaLeads;