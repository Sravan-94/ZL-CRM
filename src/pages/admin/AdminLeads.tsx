import { useState, useEffect, useRef } from 'react';
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
  ChevronUp
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { toast } from 'react-hot-toast';
import Papa from 'papaparse';
import LeadModal from '../../components/leads/LeadModal';

// Define types
interface Lead {
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
  temperature: string;
  interests: string[];
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

interface User {
  id: string;
  name: string;
  role: 'BDA' | 'admin';
}

const AdminLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof Lead>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [bdaFilter, setBdaFilter] = useState<string>('all');
  const [isAssigningLeads, setIsAssigningLeads] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [selectedBdaForAssignment, setSelectedBdaForAssignment] = useState<string>('');
  const [bdaUsers, setBdaUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bdaFetchError, setBdaFetchError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch leads and users from API on component mount
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch leads
        const leadsResponse = await fetch('http://localhost:8080/api/leads/getall');
        if (!leadsResponse.ok) throw new Error(`Failed to fetch leads: ${leadsResponse.status}`);
        const rawLeadsData = await leadsResponse.json();

        // Log raw response for debugging
        console.log('Raw Leads API Response:', rawLeadsData);

        // Map API response to Lead interface
        const leadsData: Lead[] = Array.isArray(rawLeadsData)
          ? rawLeadsData.map((lead: any) => ({
              id: String(lead.id),
              name: lead.name || '',
              phone: lead.contactNo || '',
              email: lead.email || '',
              industry: lead.industry || '',
              service: lead.service || '',
              type: lead.type || '',
              status: (lead.status || 'new') as LeadStatus,
              assignedBdaId: lead.assignedBdaId ? String(lead.assignedBdaId) : null,
              assignedBdaName: lead.assignedTo || null,
              followUpDate: lead.followUp || null,
              temperature: lead.temperature || '',
              interests: Array.isArray(lead.interests) ? lead.interests : [],
              remarks: lead.remarks || '',
              createdAt: lead.createdAt || new Date().toISOString(),
              updatedAt: lead.lastUpdated || new Date().toISOString(),
            }))
          : [];

        if (isMounted) {
          setLeads(leadsData);
          console.log('Mapped Leads:', leadsData);
        }

        // Fetch BDA users
        const usersResponse = await fetch('http://localhost:8080/api/bda-users');
        if (!usersResponse.ok) {
          throw new Error(`Failed to fetch BDAs: ${usersResponse.status}`);
        }
        const usersData = await usersResponse.json();

        // Log the raw response for debugging
        console.log('Raw BDA API Response:', usersData);

        // Map API response to User interface, converting id to string
        const bdaUsers = Array.isArray(usersData)
          ? usersData
              .filter((user: any) => user.role === 'BDA')
              .map((user: any) => ({
                id: String(user.id),
                name: user.name || '',
                role: user.role as 'BDA' | 'admin',
              }))
          : [];

        if (bdaUsers.length === 0) {
          console.warn('No valid BDA users found in response');
          if (isMounted) setBdaFetchError('No BDA users available');
        } else {
          if (isMounted) {
            setBdaUsers(bdaUsers);
            setBdaFetchError(null);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        if (isMounted) {
          toast.error('Failed to load leads or BDAs');
          setBdaFetchError('Failed to load BDA users');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Validate date strings
  const isValidDate = (dateString: string | null): boolean => {
    if (!dateString) return false;
    try {
      return isValid(parseISO(dateString));
    } catch {
      return false;
    }
  };

  // Handle lead selection for bulk actions
  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(leadId)) {
        newSelection.delete(leadId);
      } else {
        newSelection.add(leadId);
      }
      return newSelection;
    });
  };

  // Handle sorting
  const handleSort = (key: keyof Lead) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };

  // Filter and sort leads
  const filteredLeads = leads
    .filter(lead => {
      const matchesSearch =
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesBda =
        bdaFilter === 'all' ||
        (bdaFilter === 'unassigned' ? !lead.assignedBdaId : lead.assignedBdaId === bdaFilter);
      return matchesSearch && matchesStatus && matchesBda;
    })
    .sort((a, b) => {
      let valueA = a[sortBy] ?? '';
      let valueB = b[sortBy] ?? '';

      if (Array.isArray(valueA)) valueA = valueA.join(',');
      if (Array.isArray(valueB)) valueB = valueB.join(',');

      if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'followUpDate') {
        const dateA = isValidDate(valueA as string) ? new Date(valueA as string).getTime() : 0;
        const dateB = isValidDate(valueB as string) ? new Date(valueB as string).getTime() : 0;
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }

      return sortDirection === 'asc'
        ? String(valueA).localeCompare(String(valueB))
        : String(valueB).localeCompare(String(valueA));
    });

  // Handle opening lead modal
  const handleOpenLeadModal = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  // Handle lead assignment
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
          leadIds: Array.from(selectedLeads),
          bdaId: selectedBda.id,
          bdaName: selectedBda.name,
        }),
      });

      if (!response.ok) throw new Error('Failed to assign leads');

      const updatedLeads = leads.map(lead => {
        if (selectedLeads.has(lead.id)) {
          return {
            ...lead,
            assignedBdaId: selectedBda.id,
            assignedBdaName: selectedBda.name,
            updatedAt: new Date().toISOString(),
          };
        }
        return lead;
      });

      setLeads(updatedLeads);
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

  // Handle CSV import
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

      const rawNewLeads = await response.json();
      if (!Array.isArray(rawNewLeads) || !rawNewLeads.every(lead => 'id' in lead && 'name' in lead)) {
        throw new Error('Invalid lead data received');
      }

      // Map imported leads to Lead interface
      const newLeads: Lead[] = rawNewLeads.map((lead: any) => ({
        id: String(lead.id),
        name: lead.name || '',
        phone: lead.contactNo || '',
        email: lead.email || '',
        industry: lead.industry || '',
        service: lead.service || '',
        type: lead.type || '',
        status: (lead.status || 'new') as LeadStatus,
        assignedBdaId: lead.assignedBdaId ? String(lead.assignedBdaId) : null,
        assignedBdaName: lead.assignedTo || null,
        followUpDate: lead.followUp || null,
        temperature: lead.temperature || '',
        interests: Array.isArray(lead.interests) ? lead.interests : [],
        remarks: lead.remarks || '',
        createdAt: lead.createdAt || new Date().toISOString(),
        updatedAt: lead.lastUpdated || new Date().toISOString(),
      }));

      setLeads(prev => [...prev, ...newLeads]);
      toast.success('Leads imported successfully');
    } catch (err) {
      console.error('Error importing CSV:', err);
      toast.error('Failed to upload CSV');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Export leads to CSV
  const handleExportCSV = () => {
    const exportData = filteredLeads.map(lead => ({
      'Lead Name': lead.name,
      'Phone': lead.phone,
      'Email': lead.email,
      'Industry': lead.industry,
      'Service': lead.service,
      'Type': lead.type,
      'Status': lead.status,
      'Assigned BDA': lead.assignedBdaName || 'Unassigned',
      'Follow-up Date': lead.followUpDate || '',
      'Temperature': lead.temperature,
      'Interests': lead.interests.join(', '),
      'Remarks': lead.remarks,
      'Created At': lead.createdAt,
      'Updated At': lead.updatedAt,
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

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-semibold text-slate-800">Leads Management</h1>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsAssigningLeads(!isAssigningLeads)}
            disabled={isLoading}
            className={`px-3 py-2 text-sm font-medium rounded-md flex items-center ${
              isAssigningLeads 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50'
            }`}
            aria-label="Assign leads"
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            Assign Leads
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="px-3 py-2 text-sm font-medium rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center disabled:opacity-50"
            aria-label="Import CSV"
          >
            <Upload className="h-4 w-4 mr-1.5" />
            Import CSV
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportCSV}
              accept=".csv"
              className="hidden"
              aria-hidden="true"
            />
          </button>
          
          <button
            onClick={handleExportCSV}
            disabled={isLoading}
            className="px-3 py-2 text-sm font-medium rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center disabled:opacity-50"
            aria-label="Export CSV"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </button>
        </div>
      </div>
      
      {/* Bulk assignment UI */}
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
                  onChange={(e) => setSelectedBdaForAssignment(e.target.value)}
                  className="block w-48 rounded-md border-slate-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm"
                  aria-label="Select BDA for assignment"
                  disabled={isLoading}
                >
                  <option value="">Select BDA</option>
                  {bdaUsers.map((bda) => (
                    <option key={bda.id} value={bda.id}>{bda.name}</option>
                  ))}
                </select>
              )}
              
              <button
                onClick={handleAssignLeads}
                disabled={!selectedBdaForAssignment || selectedLeads.size === 0 || isLoading || bdaUsers.length === 0}
                className="px-3 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center"
                aria-label="Assign selected leads"
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
                aria-label="Cancel lead assignment"
                disabled={isLoading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border-slate-300 pl-10 pr-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            aria-label="Search leads"
            disabled={isLoading}
          />
        </div>
        
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="px-3 py-2 text-sm font-medium rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center sm:w-auto w-full justify-center disabled:opacity-50"
          aria-label={filtersOpen ? 'Hide filters' : 'Show filters'}
          disabled={isLoading}
        >
          <Filter className="h-4 w-4 mr-1.5" />
          Filter
          {filtersOpen ? (
            <ChevronUp className="h-4 w-4 ml-1.5" />
          ) : (
            <ChevronDown className="h-4 w-4 ml-1.5" />
          )}
        </button>
      </div>
      
      {/* Filters panel */}
      {filtersOpen && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="status-filter">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
              aria-label="Filter by status"
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
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="bda-filter">
              Assigned BDA
            </label>
            <select
              id="bda-filter"
              value={bdaFilter}
              onChange={(e) => setBdaFilter(e.target.value)}
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
              aria-label="Filter by assigned BDA"
              disabled={isLoading}
            >
              <option value="all">All BDAs</option>
              <option value="unassigned">Unassigned</option>
              {bdaUsers.map((bda) => (
                <option key={bda.id} value={bda.id}>{bda.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-4">
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      )}
      
      {/* Leads table */}
      {!isLoading && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {isAssigningLeads && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-10">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeads(new Set(filteredLeads.map(lead => lead.id)));
                          } else {
                            setSelectedLeads(new Set());
                          }
                        }}
                        checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                        aria-label="Select all leads"
                      />
                    </th>
                  )}
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                    role="button"
                    aria-label="Sort by name"
                  >
                    <div className="flex items-center">
                      Name
                      <ArrowUpDown className="h-4 w-4 ml-1" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('status')}
                    role="button"
                    aria-label="Sort by status"
                  >
                    <div className="flex items-center">
                      Status
                      <ArrowUpDown className="h-4 w-4 ml-1" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('assignedBdaName')}
                    role="button"
                    aria-label="Sort by assigned BDA"
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
                    role="button"
                    aria-label="Sort by follow-up date"
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
                    role="button"
                    aria-label="Sort by last updated"
                  >
                    <div className="flex items-center">
                      Last Updated
                      <ArrowUpDown className="h-4 w-4 ml-1" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={isAssigningLeads ? 7 : 6} className="px-6 py-4 text-center text-sm text-slate-500">
                      No leads found. Try adjusting your filters.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => {
                        if (isAssigningLeads) {
                          toggleLeadSelection(lead.id);
                        } else {
                          handleOpenLeadModal(lead);
                        }
                      }}
                      role="button"
                      aria-label={`View details for ${lead.name}`}
                    >
                      {isAssigningLeads && (
                        <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            checked={selectedLeads.has(lead.id)}
                            onChange={() => toggleLeadSelection(lead.id)}
                            aria-label={`Select lead ${lead.name}`}
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-800">{lead.name}</div>
                        <div className="text-sm text-slate-500">{lead.industry}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-800">{lead.phone}</div>
                        <div className="text-sm text-slate-500">{lead.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          lead.status === 'new' ? 'bg-slate-100 text-slate-800' :
                          lead.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                          lead.status === 'qualified' ? 'bg-purple-100 text-purple-800' :
                          lead.status === 'proposal' ? 'bg-amber-100 text-amber-800' :
                          lead.status === 'negotiation' ? 'bg-orange-100 text-orange-800' :
                          lead.status === 'closed_won' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {lead.status === 'closed_won' ? 'Won' :
                           lead.status === 'closed_lost' ? 'Lost' :
                           lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.assignedBdaName ? (
                          <div className="text-sm text-slate-800">{lead.assignedBdaName}</div>
                        ) : (
                          <div className="text-sm text-slate-500">Unassigned</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.followUpDate && isValidDate(lead.followUpDate) ? (
                          <div className={`text-sm ${
                            new Date(lead.followUpDate) < new Date() && format(new Date(lead.followUpDate), 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd')
                              ? 'text-red-600 font-medium'
                              : format(new Date(lead.followUpDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                                ? 'text-amber-600 font-medium'
                                : 'text-slate-800'
                          }`}>
                            {format(new Date(lead.followUpDate), 'MMM d, yyyy')}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500">Not scheduled</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isValidDate(lead.updatedAt) ? (
                          <div className="text-sm text-slate-500">
                            {format(parseISO(lead.updatedAt), 'MMM d, h:mm a')}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500">Invalid date</div>
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
      
      {/* Lead Modal */}
      {selectedLead && (
  <LeadModal
    isOpen={isModalOpen}
    onClose={() => {
      setIsModalOpen(false);
      setSelectedLead(null);
    }}
    lead={selectedLead}
    onSave={async (updatedLead) => {
      try {
        const response = await fetch(`http://localhost:8080/api/leads/update/${updatedLead.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: updatedLead.id,
            name: updatedLead.name ?? null,
            email: updatedLead.email ?? null,
            contactNo: updatedLead.phone ?? null,
            status: updatedLead.status ?? null,
            assignedTo: updatedLead.assignedBdaName ?? null,
            followUp: updatedLead.followUpDate ?? null,
          }),
        });

        if (!response.ok) throw new Error('Failed to update lead');

        // Replace updated lead in local state
        setLeads(prev =>
          prev.map(lead => (lead.id === updatedLead.id ? { ...lead, ...updatedLead } : lead))
        );

        setIsModalOpen(false);
        setSelectedLead(null);
        toast.success('Lead updated successfully');
      } catch (err) {
        console.error('Error updating lead:', err);
        toast.error('Failed to update lead');
      }
    }}
    readOnly={false}
  />
)}

    </div>
  );
};

export default AdminLeads;