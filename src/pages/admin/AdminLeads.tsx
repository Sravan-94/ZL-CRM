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
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar,
  Clock,
  Star,
  XCircle,
  Trash2,
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
  interests: string | null;
  remarks: string | null;
  actionStatus: string | null;
  actionTaken: string | null;
  createdAt: string;
  updatedAt: string;
  lastUpdated?: string;
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
  const [sortBy, setSortBy] = useState<keyof Lead>('status');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [bdaFilter, setBdaFilter] = useState<string>('all');
  const [isAssigningLeads, setIsAssigningLeads] = useState(false);
  const [isDeletingLeads, setIsDeletingLeads] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [selectedBdaForAssignment, setSelectedBdaForAssignment] = useState<string>('');
  const [bdaUsers, setBdaUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [bdaFetchError, setBdaFetchError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const leadsPerPage = 50;
  const [activeCardFilter, setActiveCardFilter] = useState<'all' | 'today' | 'overdue' | 'new'>('all');
  const [isLeadsLoaded, setIsLeadsLoaded] = useState(false);

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
        const leadsResponse = await fetch('http://147.93.102.131:8080/api/leads/getall');
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
              assignedBdaId: lead.assignedBdaId !== undefined && lead.assignedBdaId !== null ? String(lead.assignedBdaId) : null,
              assignedBdaName: lead.assignedTo || null,
              followUpDate: lead.followUp || null,
              interests: lead.intrests || null,
              remarks: lead.remarks || null,
              actionStatus: lead.actionStatus || null,
              actionTaken: lead.actionTaken || null,
              createdAt: lead.createdAt || new Date().toISOString(),
              updatedAt: lead.lastUpdated || new Date().toISOString(),
            }))
          : [];

        if (isMounted) {
          setLeads(leadsData);
          setIsLeadsLoaded(true);
        }

        const usersResponse = await fetch('http://147.93.102.131:8080/api/bda-users');
        if (!usersResponse.ok) throw new Error(`Failed to fetch BDAs: ${usersResponse.status}`);
        const usersData = await usersResponse.json();
        if (isMounted) setBdaUsers(usersData);
      } catch (error) {
        console.error('Error fetching data:', error);
        if (isMounted) {
          toast.error('Failed to load data');
          setIsLeadsLoaded(false);
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

  const isValidDate = (dateString: string | null): boolean => {
    if (!dateString) return false;
    try {
      return isValid(parseISO(dateString));
    } catch {
      return false;
    }
  };

  const today = format(new Date(), 'yyyy-MM-dd');
  const bdaFilteredLeads = leads.filter(lead => {
    let matchesBda: boolean;
    if (bdaFilter === 'all') {
      matchesBda = true;
    } else if (bdaFilter === 'unassigned') {
      matchesBda = !lead.assignedBdaName || lead.assignedBdaName.trim() === '';
    } else {
      const selectedBda = bdaUsers.find(bda => String(bda.id) === String(bdaFilter));
      if (!selectedBda) {
        matchesBda = false;
      } else {
        const leadBdaName = (lead.assignedBdaName || '').trim().toLowerCase();
        const selectedBdaName = (selectedBda.name || '').trim().toLowerCase();
        matchesBda = leadBdaName === selectedBdaName;
      }
    }
    return matchesBda;
  });

  const allLeadsCount = bdaFilteredLeads.length;
  const todaysFollowUpsCount = bdaFilteredLeads.filter(lead => 
    lead.followUpDate && format(new Date(lead.followUpDate), 'yyyy-MM-dd') === today
  ).length;
  const overdueFollowUpsCount = bdaFilteredLeads.filter(lead => 
    lead.followUpDate && new Date(lead.followUpDate) < new Date() && format(new Date(lead.followUpDate), 'yyyy-MM-dd') !== today
  ).length;
  const newLeadsCount = bdaFilteredLeads.filter(lead => lead.status === 'new').length;

  console.log('Filter Card Counts Debug:', {
    bdaFilter,
    totalBdaFilteredLeads: bdaFilteredLeads.length,
    allLeadsCount,
    todaysFollowUpsCount,
    overdueFollowUpsCount,
    newLeadsCount,
    sampleBdaFilteredLeads: bdaFilteredLeads.slice(0, 3).map(lead => ({
      id: lead.id,
      name: lead.name,
      assignedBdaName: lead.assignedBdaName,
      status: lead.status,
      followUpDate: lead.followUpDate,
    })),
  });

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

  const handleClearFilters = () => {
    setActiveCardFilter('all');
    setSearchTerm('');
    setStatusFilter('all');
    setBdaFilter('all');
    setIsAssigningLeads(false);
    setIsDeletingLeads(false);
    setSelectedLeads(new Set());
    setFiltersOpen(false);
  };

  useEffect(() => {
    console.log('Current sort settings:', { sortBy, sortDirection });
    console.log('Sample lead dates:', leads.slice(0, 3).map(lead => ({
      name: lead.name,
      updatedAt: lead.updatedAt,
      lastUpdated: lead.lastUpdated
    })));
  }, [sortBy, sortDirection, leads]);

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

  const filteredLeads = leads
    .filter(lead => {
      let matchesCardFilter: boolean = true;
      if (activeCardFilter === 'today') {
        matchesCardFilter = Boolean(lead.followUpDate && format(new Date(lead.followUpDate), 'yyyy-MM-dd') === today);
      } else if (activeCardFilter === 'overdue') {
        matchesCardFilter = Boolean(lead.followUpDate && new Date(lead.followUpDate) < new Date() && format(new Date(lead.followUpDate), 'yyyy-MM-dd') !== today);
      } else if (activeCardFilter === 'new') {
        matchesCardFilter = lead.status === 'new';
      } else {
        matchesCardFilter = true;
      }

      const matchesSearch =
        (lead.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.phone || '').includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

      let matchesBda: boolean;
      if (bdaFilter === 'all') {
        matchesBda = true;
      } else if (bdaFilter === 'unassigned') {
        matchesBda = !lead.assignedBdaName || lead.assignedBdaName.trim() === '';
      } else {
        const selectedBda = bdaUsers.find(bda => String(bda.id) === String(bdaFilter));
        if (!selectedBda) {
          matchesBda = false;
        } else {
          const leadBdaName = (lead.assignedBdaName || '').trim().toLowerCase();
          const selectedBdaName = (selectedBda.name || '').trim().toLowerCase();
          matchesBda = leadBdaName === selectedBdaName;
        }
      }

      console.log('BDA Filter Debug:', {
        leadId: lead.id,
        leadName: lead.name,
        assignedBdaName: lead.assignedBdaName,
        normalizedAssignedBdaName: (lead.assignedBdaName || '').trim().toLowerCase(),
        assignedBdaId: lead.assignedBdaId,
        bdaFilter,
        matchesBda,
        selectedBdaId: bdaFilter,
        selectedBdaName: bdaUsers.find(bda => String(bda.id) === String(bdaFilter))?.name || 'N/A',
        normalizedSelectedBdaName: (bdaUsers.find(bda => String(bda.id) === String(bdaFilter))?.name || '').trim().toLowerCase(),
      });

      return matchesCardFilter && matchesSearch && matchesStatus && matchesBda;
    })
    .sort((a, b) => {
      const statusA = statusOrder[a.status] || 999;
      const statusB = statusOrder[b.status] || 999;
      
      if (statusA !== statusB) {
        return statusA - statusB;
      }

      const dateA = new Date(a.lastUpdated || a.updatedAt || '').getTime();
      const dateB = new Date(b.lastUpdated || b.updatedAt || '').getTime();
      console.log(`Comparing dates for ${a.name} (${a.status}): ${dateA} vs ${b.name} (${b.status}): ${dateB}`);
      return dateA - dateB;
    });

  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);

  const startIndex = (currentPage - 1) * leadsPerPage;
  const endIndex = startIndex + leadsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleOpenLeadModal = (lead: Lead) => {
    setSelectedLead({
      ...lead,
      createdAt: lead.createdAt || new Date().toISOString(),
      updatedAt: lead.updatedAt || new Date().toISOString(),
    });
    setIsModalOpen(true);
  };

  const handleAssignLeads = async () => {
    if (!selectedBdaForAssignment) {
      toast.error('Please select a BDA');
      return;
    }

    if (selectedLeads.size === 0) {
      toast.error('Please select at least one lead to assign');
      return;
    }

    const selectedBda = bdaUsers.find(bda => String(bda.id) === String(selectedBdaForAssignment));
    
    if (!selectedBda) {
      console.error('Error: Could not find BDA with ID', selectedBdaForAssignment, 'in bdaUsers', bdaUsers);
      toast.error('Invalid BDA selected. Please try again.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://147.93.102.131:8080/api/leads/assign', {
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

  const handleBulkDelete = async () => {
    if (selectedLeads.size === 0) {
      toast.error('Please select at least one lead to delete');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://147.93.102.131:8080/api/leads/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: Array.from(selectedLeads).map(id => parseInt(id)),
        }),
      });

      if (!response.ok) throw new Error('Failed to delete leads');

      setLeads(prev => prev.filter(lead => !selectedLeads.has(lead.id)));

      const remainingLeads = filteredLeads.filter(lead => !selectedLeads.has(lead.id));
      const newTotalPages = Math.ceil(remainingLeads.length / leadsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }

      setSelectedLeads(new Set());
      setIsDeletingLeads(false);
      toast.success(`${selectedLeads.size} leads deleted successfully`);
    } catch (err) {
      console.error('Error deleting leads:', err);
      toast.error('Failed to delete leads');
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
      const response = await fetch('http://147.93.102.131:8080/api/leads/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload CSV');

      const message = await response.text();
      toast.success(message);

      const leadsResponse = await fetch('http://147.93.102.131:8080/api/leads/getall');
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
            assignedBdaId: lead.assignedBdaId !== undefined && lead.assignedBdaId !== null ? String(lead.assignedBdaId) : null,
            assignedBdaName: lead.assignedTo || null,
            followUpDate: lead.followUp || null,
            interests: lead.intrests || null,
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
      Interests: lead.interests || '',
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
            disabled={isLoading || !isLeadsLoaded || isDeletingLeads}
            className={`px-3 py-2 text-sm font-medium rounded-md flex items-center ${
              isAssigningLeads
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            Assign Leads
          </button>
          <button
            onClick={() => setIsDeletingLeads(!isDeletingLeads)}
            disabled={isLoading || !isLeadsLoaded || isAssigningLeads}
            className={`px-3 py-2 text-sm font-medium rounded-md flex items-center ${
              isDeletingLeads
                ? 'bg-red-100 text-red-700'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Bulk Delete
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || !isLeadsLoaded}
            className="px-3 py-2 text-sm font-medium rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="h-4 w-4 mr-1.5" />
            Import CSV
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportCSV}
              accept=".csv"
              className="hidden"
              disabled={isLoading || !isLeadsLoaded}
            />
          </button>
          <button
            onClick={handleExportCSV}
            disabled={isLoading || !isLeadsLoaded}
            className="px-3 py-2 text-sm font-medium rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-4">
          <div className="text-slate-500">Loading leads data...</div>
        </div>
      )}

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
                className="px-3 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center"
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
                className="p-2 text-slate-500 hover:text-slate-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeletingLeads && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <div>
              <h3 className="font-medium text-red-700">Delete Selected Leads</h3>
              <p className="text-sm text-red-600">Selected: {selectedLeads.size} leads</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkDelete}
                disabled={selectedLeads.size === 0 || isLoading}
                className="px-3 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete
              </button>
              <button
                onClick={() => {
                  setIsDeletingLeads(false);
                  setSelectedLeads(new Set());
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveCardFilter('all')}
          className={`border rounded-lg p-4 flex items-center space-x-3 cursor-pointer transition-colors ${
            activeCardFilter === 'all'
              ? 'bg-blue-100 border-blue-300'
              : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
          }`}
        >
          <div className="p-2 bg-blue-100 rounded-full">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-800">All Leads</h3>
            <p className="text-2xl font-semibold text-blue-900">{allLeadsCount}</p>
          </div>
        </div>
        <div
          onClick={() => setActiveCardFilter('today')}
          className={`border rounded-lg p-4 flex items-center space-x-3 cursor-pointer transition-colors ${
            activeCardFilter === 'today'
              ? 'bg-yellow-100 border-yellow-300'
              : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
          }`}
        >
          <div className="p-2 bg-yellow-100 rounded-full">
            <Calendar className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Today's Follow-ups</h3>
            <p className="text-2xl font-semibold text-yellow-900">{todaysFollowUpsCount}</p>
          </div>
        </div>
        <div
          onClick={() => setActiveCardFilter('overdue')}
          className={`border rounded-lg p-4 flex items-center space-x-3 cursor-pointer transition-colors ${
            activeCardFilter === 'overdue'
              ? 'bg-red-100 border-red-300'
              : 'bg-red-50 border-red-200 hover:bg-red-100'
          }`}
        >
          <div className="p-2 bg-red-100 rounded-full">
            <Clock className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-red-800">Overdue Follow-ups</h3>
            <p className="text-2xl font-semibold text-red-900">{overdueFollowUpsCount}</p>
          </div>
        </div>
        <div
          onClick={() => setActiveCardFilter('new')}
          className={`border rounded-lg p-4 flex items-center space-x-3 cursor-pointer transition-colors ${
            activeCardFilter === 'new'
              ? 'bg-green-100 border-green-300'
              : 'bg-green-50 border-green-200 hover:bg-green-100'
          }`}
        >
          <div className="p-2 bg-green-100 rounded-full">
            <Star className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-green-800">New Leads</h3>
            <p className="text-2xl font-semibold text-green-900">{newLeadsCount}</p>
          </div>
        </div>
      </div>

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
        <div className="flex space-x-2">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="px-3 py-2 text-sm font-medium rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center sm:w-auto w-full justify-center disabled:opacity-50"
            disabled={isLoading}
          >
            <Filter className="h-4 w-4 mr-1.5" />
            Filter
            {filtersOpen ? <ChevronUp className="h-4 w-4 ml-1.5" /> : <ChevronDown className="h-4 w-4 ml-1.5" />}
          </button>
          <button
            onClick={handleClearFilters}
            className="px-3 py-2 text-sm font-medium rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center sm:w-auto w-full justify-center disabled:opacity-50"
            disabled={isLoading}
          >
            <XCircle className="h-4 w-4 mr-1.5" />
            Clear Filter
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

      {isLoading && <div className="text-center py-4">Loading...</div>}

      {!isLoading && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {(isAssigningLeads || isDeletingLeads) && (
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-10"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        checked={selectedLeads.size === paginatedLeads.length && paginatedLeads.length > 0}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedLeads(new Set(paginatedLeads.map(lead => lead.id)));
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
                {paginatedLeads.length === 0 ? (
                  <tr>
                    <td
                      colSpan={(isAssigningLeads || isDeletingLeads) ? 7 : 6}
                      className="px-6 py-4 text-center text-sm text-slate-500"
                    >
                      No leads found. Try adjusting your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedLeads.map(lead => (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => {
                        if (isAssigningLeads || isDeletingLeads) {
                          toggleLeadSelection(lead.id);
                        } else {
                          handleOpenLeadModal(lead);
                        }
                      }}
                    >
                      {(isAssigningLeads || isDeletingLeads) && (
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredLeads.length)}</span> of{' '}
                    <span className="font-medium">{filteredLeads.length}</span> leads
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {[...Array(totalPages)].map((_, index) => (
                      <button
                        key={index + 1}
                        onClick={() => handlePageChange(index + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === index + 1
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
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
          onSave={async (updatedLead: Lead) => {
            console.log('handleSubmit start:', { user, userId: user?.id });
            if (!user || !user.id) {
              toast.error('User authentication required. Please log in again.');
              return false;
            }

            setIsSaving(true);
            try {
              const payload = {
                name: updatedLead.name ?? '',
                contactNo: updatedLead.phone ?? '',
                email: updatedLead.email ?? '',
                status: updatedLead.status ?? '',
                actionStatus: updatedLead.actionStatus ?? '',
                assignedTo: updatedLead.assignedBdaName ?? '',
                interests: updatedLead.interests ?? '',
                remarks: updatedLead.remarks ?? '',
                actionTaken: updatedLead.actionTaken ?? '',
                followUp: updatedLead.followUpDate ?? '',
                loggedinId: Number(user.id),
                companyName: updatedLead.companyName ?? '',
                industry: updatedLead.industry ?? '',
                city: updatedLead.city ?? '',
                state: updatedLead.state ?? '',
                lastUpdated: new Date().toISOString(),
              };
              const response = await fetch(`http://crmbackend-lxbe.on.com/api/leads/update/${updatedLead.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });
              if (!response.ok) {
                const errorText = await response.text();
                toast.error(errorText.includes('User not found') ? 'Invalid user ID.' : `Failed to update lead: ${errorText}`);
                return false;
              }

              const leadsResponse = await fetch('http://147.93.102.131:8080/api/leads/getall');
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
                    assignedBdaId: lead.assignedBdaId !== undefined && lead.assignedBdaId !== null ? String(lead.assignedBdaId) : null,
                    assignedBdaName: lead.assignedTo || null,
                    followUpDate: lead.followUp || null,
                    interests: lead.intrests || null,
                    remarks: lead.remarks || null,
                    actionStatus: lead.actionStatus || null,
                    actionTaken: lead.actionTaken || null,
                    createdAt: lead.createdAt || new Date().toISOString(),
                    updatedAt: lead.lastUpdated || new Date().toISOString(),
                    lastUpdated: lead.lastUpdated || new Date().toISOString(),
                  }))
                : [];

              setLeads(updatedLeads);
              setIsModalOpen(false);
              setSelectedLead(null);
              toast.success('Lead updated successfully');
              return true;
            } catch (err) {
              console.error('Error updating lead:', err);
              toast.error('Failed to update lead');
              return false;
            } finally {
              setIsSaving(false);
            }
          }}
          readOnly={false}
        />
      )}
    </div>
  );
};

export default AdminLeads;