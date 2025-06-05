import { useState, useEffect } from 'react';
import {
  ArrowUpDown,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Users,
  Calendar,
  Clock,
  Star,
  XCircle,
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { toast } from 'react-hot-toast';
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
  const [isLoading, setIsLoading] = useState(false);
  const [activeCardFilter, setActiveCardFilter] = useState<'all' | 'today' | 'overdue' | 'new'>('all');

  // Define the order of statuses
  const statusOrder: Record<LeadStatus, number> = {
    new: 1,
    contacted: 2,
    qualified: 3,
    proposal: 4,
    negotiation: 5,
    closed_won: 6,
    closed_lost: 7,
    warm: 8,
    WrongNumber: 9,
    NotAnswered: 10,
    CallBackLater: 11,
    Interested: 12,
    NotInterested: 13,
    SwitchedOff: 14,
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!user) {
        console.error('No authenticated user found');
        toast.error('User authentication required');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch leads
        const leadsResponse = await fetch('http://147.93.102.131:8080/api/leads/getall');
        if (!leadsResponse.ok) throw new Error(`Failed to fetch leads: ${leadsResponse.status}`);
        const rawLeadsData = await leadsResponse.json();

        // Filter leads for the logged-in BDA
        const leadsData: Lead[] = Array.isArray(rawLeadsData)
          ? rawLeadsData
              .filter((lead: any) => {
                if (!lead.assignedBdaId && !lead.assignedTo) return false;
                const assignedBdaId = lead.assignedBdaId ? String(lead.assignedBdaId).trim().toLowerCase() : null;
                const assignedBdaName = lead.assignedTo ? lead.assignedTo.trim().toLowerCase() : null;
                const userId = user.id?.toString().trim().toLowerCase();
                const userName = user.name?.trim().toLowerCase();
                const match = assignedBdaId === userId || assignedBdaName === userName;
                console.log(`Lead ID ${lead.id}: assignedBdaId=${assignedBdaId}, assignedTo=${assignedBdaName}, userId=${userId}, userName=${userName}, match=${match}`);
                return match;
              })
              .map((lead: any) => ({
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
                createdAt: (typeof lead.createdAt === 'string' && lead.createdAt) ? lead.createdAt : new Date().toISOString(),
                updatedAt: (typeof lead.lastUpdated === 'string' && lead.lastUpdated) ? lead.lastUpdated : new Date().toISOString(),
                whatsappSent: lead.actionTaken?.includes('whatsapp') || false,
                emailSent: lead.actionTaken?.includes('email') || false,
                quotationSent: lead.actionTaken?.includes('quotation') || false,
                sampleWorkSent: lead.actionTaken?.includes('sample') || false,
                MeetingBooked: lead.actionTaken?.includes('MeetingBooked') || false,
                DemoScheduled: lead.actionTaken?.includes('DemoScheduled') || false,
                NeedMoreInfo: lead.actionTaken?.includes('NeedMoreInfo') || false,
                WaitingForDecision: lead.actionTaken?.includes('WaitingForDecision') || false,
              }))
          : [];

        if (isMounted) {
          console.log('Filtered leads for BDA:', leadsData);
          setLeads(leadsData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        if (isMounted) toast.error('Failed to load leads');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const isValidDate = (dateString: string | null): boolean => {
    if (!dateString) return false;
    try {
      return isValid(parseISO(dateString));
    } catch {
      return false;
    }
  };

  // Calculate counts for the filter cards
  const today = format(new Date(), 'yyyy-MM-dd');
  const allLeadsCount = leads.length;
  const todaysFollowUpsCount = leads.filter(lead => 
    lead.followUpDate && format(new Date(lead.followUpDate), 'yyyy-MM-dd') === today
  ).length;
  const overdueFollowUpsCount = leads.filter(lead => 
    lead.followUpDate && new Date(lead.followUpDate) < new Date() && format(new Date(lead.followUpDate), 'yyyy-MM-dd') !== today
  ).length;
  const newLeadsCount = leads.filter(lead => lead.status === 'new').length;

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
    setFiltersOpen(false);
  };

  const filteredLeads = leads
    .filter(lead => {
      // Apply card filter
      let matchesCardFilter = true;
      if (activeCardFilter === 'today') {
        matchesCardFilter = lead.followUpDate && format(new Date(lead.followUpDate), 'yyyy-MM-dd') === today;
      } else if (activeCardFilter === 'overdue') {
        matchesCardFilter = lead.followUpDate && new Date(lead.followUpDate) < new Date() && format(new Date(lead.followUpDate), 'yyyy-MM-dd') !== today;
      } else if (activeCardFilter === 'new') {
        matchesCardFilter = lead.status === 'new';
      } else {
        matchesCardFilter = true; // 'all' filter shows all leads
      }

      const matchesSearch =
        (lead.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.phone || '').includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      return matchesCardFilter && matchesSearch && matchesStatus;
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
      console.log(`Comparing dates for ${a.name} (${a.status}): ${dateA} vs ${b.name} (${b.status}): ${dateB}`);
      return dateA - dateB; // Ascending order for dates within status group
    });

  const handleOpenLeadModal = (lead: Lead) => {
    setSelectedLead({
      ...lead,
      createdAt: lead.createdAt || new Date().toISOString(),
      updatedAt: lead.updatedAt || new Date().toISOString(),
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-semibold text-slate-800">Leads Management</h1>
      </div>

      {/* Filter Cards Section with Clickable Filters and Updated Icons */}
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
            <Users className="h-6 w-6 text-yellow-600" />
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
        <div className="bg-white border border-slate-200 rounded-lg p-4">
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
        </div>
      )}

      {isLoading && <div className="text-center py-4">Loading...</div>}

      {!isLoading && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
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
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No leads found. Try adjusting your filters or contact your admin.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map(lead => (
                    <tr
                      key={lead.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleOpenLeadModal(lead)}
                    >
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
                        <div className="text-sm text-gray-900">{lead.assignedBdaName || 'Unassigned'}</div>
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
          onSave={async (updatedLead: Lead) => {
            try {
              if (!user || user.id == null) {
                toast.error('User authentication required.');
                console.error('Auth user missing:', user);
                return false;
              }

              const payload = {
                name: updatedLead.name ?? "",
                contactNo: updatedLead.phone ?? "",
                email: updatedLead.email ?? "",
                status: updatedLead.status ?? "",
                actionStatus: updatedLead.actionStatus ?? "",
                assignedTo: updatedLead.assignedBdaName ?? "",
                intrests: updatedLead.intrests ?? "",
                remarks: updatedLead.remarks ?? "",
                actionTaken: updatedLead.actionTaken ?? "",
                followUp: updatedLead.followUpDate ?? "",
                loggedinId: Number(user.id),
                companyName: updatedLead.companyName ?? "",
                industry: updatedLead.industry ?? "",
                city: updatedLead.city ?? "",
                state: updatedLead.state ?? "",
                lastUpdated: new Date().toISOString()
              };

              const response = await fetch(`http:///api/leads/update/${updatedLead.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });

              if (!response.ok) {
                const errorText = await response.text();
                console.error('Backend error:', errorText);
                toast.error(`Failed to update lead: ${errorText}`);
                return false;
              }

              const leadsResponse = await fetch('http://147.93.102.131:8080/api/leads/getall');
              if (!leadsResponse.ok) {
                console.error('Failed to fetch leads:', leadsResponse.status);
                toast.error('Failed to refresh leads');
                return false;
              }

              const rawLeads = await leadsResponse.json();
              const updatedLeads: Lead[] = Array.isArray(rawLeads)
                ? rawLeads
                    .filter((lead: any) => {
                      if (!lead.assignedBdaId && !lead.assignedTo) return false;
                      const assignedBdaId = lead.assignedBdaId ? String(lead.assignedBdaId).trim().toLowerCase() : null;
                      const assignedBdaName = lead.assignedTo ? lead.assignedTo.trim().toLowerCase() : null;
                      const userId = user?.id?.toString().trim().toLowerCase();
                      const userName = user?.name?.trim().toLowerCase();
                      const match = assignedBdaId === userId || assignedBdaName === userName;
                      return match;
                    })
                    .map((lead: any) => ({
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
                      createdAt: (typeof lead.createdAt === 'string' && lead.createdAt) ? lead.createdAt : new Date().toISOString(),
                      updatedAt: (typeof lead.lastUpdated === 'string' && lead.lastUpdated) ? lead.lastUpdated : new Date().toISOString(),
                      whatsappSent: lead.actionTaken?.includes('whatsapp') || false,
                      emailSent: lead.actionTaken?.includes('email') || false,
                      quotationSent: lead.actionTaken?.includes('quotation') || false,
                      sampleWorkSent: lead.actionTaken?.includes('sample') || false,
                      MeetingBooked: lead.actionTaken?.includes('MeetingBooked') || false,
                      DemoScheduled: lead.actionTaken?.includes('DemoScheduled') || false,
                      NeedMoreInfo: lead.actionTaken?.includes('NeedMoreInfo') || false,
                      WaitingForDecision: lead.actionTaken?.includes('WaitingForDecision') || false,
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
            }
          }}
          readOnly={false}
        />
      )}
    </div>
  );
};

export default BdaLeads;