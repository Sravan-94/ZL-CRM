
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
  ChevronUp,
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { toast } from 'react-hot-toast';
import Papa from 'papaparse';
import LeadModal from '../../components/leads/LeadModal';
import { useAuth } from '../../contexts/AuthContext';

interface Lead {
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
  createdAt: string;
  updatedAt: string;
  loggedinId?: number;
}

type LeadStatus =
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

interface User {
  id: string;
  name: string;
  role: 'BDA' | 'admin';
}

const AdminLeads = () => {
  const { user } = useAuth();
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
  const [isSaving, setIsSaving] = useState(false);
  const [bdaFetchError, setBdaFetchError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (dateString: string | null, formatStr: string = 'MMM d, yyyy'): string => {
    if (!dateString || !isValid(parseISO(dateString))) return 'N/A';
    return format(parseISO(dateString), formatStr);
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
              assignedBdaId: lead.assignedBdaId ? String(lead.assignedBdaId) : null,
              assignedBdaName: lead.assignedTo || null,
              followUpDate: lead.followUp || null,
              intrests: lead.intrests || null,
              remarks: lead.remarks || null,
              actionStatus: lead.actionStatus || null,
              actionTaken: lead.actionTaken || null,
              createdAt: lead.createdAt || new Date().toISOString(),
              updatedAt: lead.lastUpdated || new Date().toISOString(),
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
        if (isMounted) {
          console.error('Error fetching data:', err);
          toast.error('Failed to load leads or BDAs');
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
        (bdaFilter === 'unassigned' ? !lead.assignedBdaId : lead.assignedBdaId === bdaFilter);
      return matchesSearch && matchesStatus && matchesBda;
    })
    .sort((a, b) => {
      let valueA = a[sortBy] ?? '';
      let valueB = b[sortBy] ?? '';

      if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'followUpDate') {
        const dateA = valueA ? new Date(valueA as string).getTime() : 0;
        const dateB = valueB ? new Date(valueB as string).getTime() : 0;
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }

      return sortDirection === 'asc'
        ? String(valueA).localeCompare(String(valueB))
        : String(valueB).localeCompare(String(valueA));
    });

  const handleOpenLeadModal = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
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

      setLeads(prev =>
        prev.map(lead =>
          selectedLeads.has(lead.id)
            ? {
                ...lead,
                assignedBdaId: selectedBda.id,
                assignedBdaName: selectedBda.name,
                updatedAt: new Date().toISOString(),
              }
            : lead
        )
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
            assignedBdaId: lead.assignedBdaId ? String(lead.assignedBdaId) : null,
            assignedBdaName: lead.assignedTo || null,
            followUpDate: lead.followUp || null,
            intrests: lead.intrests || null,
            remarks: lead.remarks || null,
            actionStatus: lead.actionStatus || null,
            actionTaken: lead.actionTaken || null,
            createdAt: lead.createdAt || new Date().toISOString(),
            updatedAt: lead.lastUpdated || new Date().toISOString(),
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
      AssignedTo: lead.assignedBdaName || 'Unassigned',
      Intrests: lead.intrests || '',
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

  return (
    <div className="space-y-6">
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
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            Assign Leads
          </button>
          <button
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
          </button>
          <button
            onClick={handleExportCSV}
            disabled={isLoading}
            className="px-3 py-2 text-sm font-medium rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </button>
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
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="px-3 py-2 text-sm font-medium rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center sm:w-auto w-full justify-center disabled:opacity-50"
          disabled={isLoading}
        >
          <Filter className="h-4 w-4 mr-1.5" />
          Filter
          {filtersOpen ? <ChevronUp className="h-4 w-4 ml-1.5" /> : <ChevronDown className="h-4 w-4 ml-1.5" />}
        </button>
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
                    onClick={() => handleSort('assignedBdaName')}
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
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredLeads.map(lead => (
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
                  >
                    {isAssigningLeads && (
                      <td
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={e => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          checked={selectedLeads.has(lead.id)}
                          onChange={() => toggleLeadSelection(lead.id)}
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-800">{lead.name || 'N/A'}</div>
                      <div className="text-sm text-slate-500">{lead.industry || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-800">{lead.phone || 'N/A'}</div>
                      <div className="text-sm text-slate-500">{lead.email || 'N/A'}</div>
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
                      <div className="text-sm text-slate-800">{lead.assignedBdaName || 'Unassigned'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm ${
                          lead.followUpDate &&
                          new Date(lead.followUpDate) < new Date() &&
                          formatDate(lead.followUpDate, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd')
                            ? 'text-red-600 font-medium'
                            : lead.followUpDate &&
                              formatDate(lead.followUpDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                            ? 'text-amber-600 font-medium'
                            : 'text-slate-800'
                        }`}
                      >
                        {lead.followUpDate ? formatDate(lead.followUpDate) : 'Not scheduled'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">{formatDate(lead.updatedAt, 'MMM d, yyyy h:mm a')}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedLead && (
        <LeadModal
          key={selectedLead.id}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedLead(null);
          }}
          lead={selectedLead}
          onSave={async (updatedLead: Lead) => {
            if (!user || !user.id) {
              toast.error('User authentication required. Please log in again.');
              return;
            }

            setIsSaving(true);
            try {
              const payload = {
                name: updatedLead.name || null,
                email: updatedLead.email || null,
                contactNo: updatedLead.phone || null,
                status: updatedLead.status || null,
                assignedTo: updatedLead.assignedBdaName || null,
                followUp: updatedLead.followUpDate || null,
                intrests: updatedLead.intrests || null,
                remarks: updatedLead.remarks || null,
                actionStatus: updatedLead.actionStatus || null,
                actionTaken: updatedLead.actionTaken || null,
                loggedinId: Number(user.id),
                companyName: updatedLead.companyName || null,
                industry: updatedLead.industry || null,
                city: updatedLead.city || null,
                state: updatedLead.state || null,
              };

              const response = await fetch(`http://localhost:8080/api/leads/update/${updatedLead.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });

              if (!response.ok) {
                const errorText = await response.text();
                toast.error(errorText.includes('User not found') ? 'Invalid user ID.' : `Failed to update lead: ${errorText}`);
                return;
              }

              const leadsResponse = await fetch('http://localhost:8080/api/leads/getall');
              if (!leadsResponse.ok) throw new Error('Failed to fetch updated leads');
              const rawLeads = await leadsResponse.json();

              const updatedLeads: Lead[] = Array.isArray(rawLeads)
                ? rawLeads.map((lead: any) => ({
                    id: String(lead.id),
                    name: lead.name || null,
                    phone: lead.contactNo || null,
                    email: lead.email || null,
                    industry: lead.industry || null,
                    companyName: lead.companyName || null,
                    city: lead.city || null,
                    state: lead.state || null,
                    status: (lead.status || 'new') as LeadStatus,
                    assignedBdaId: lead.assignedBdaId ? String(lead.assignedBdaId) : null,
                    assignedBdaName: lead.assignedTo || null,
                    followUpDate: lead.followUp || null,
                    intrests: lead.intrests || null,
                    remarks: lead.remarks || null,
                    actionStatus: lead.actionStatus || null,
                    actionTaken: lead.actionTaken || null,
                    createdAt: lead.createdAt || new Date().toISOString(),
                    updatedAt: lead.lastUpdated || new Date().toISOString(),
                  }))
                : [];

              setLeads(updatedLeads);
              setIsModalOpen(false);
              setSelectedLead(null);
              toast.success('Lead updated successfully');
            } catch (err) {
              console.error('Error updating lead:', err);
              toast.error('Failed to update lead');
            } finally {
              setIsSaving(false);
            }
          }}
          readOnly={false}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};

export default AdminLeads;
