import { useState, useEffect } from 'react';
import {
  ArrowUpDown,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { format, parseISO, isToday, isBefore } from 'date-fns';
import toast from 'react-hot-toast';
import LeadModal from '../../components/leads/LeadModal';

// Lead interface (aligned with AdminLeads)
interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  industry: string;
  companyName: string;
  city: string;
  state: string;
  status: LeadStatus;
  assignedBdaId: string | null;
  assignedBdaName: string | null;
  followUpDate: string | null;
  temperature: string;
  interests: string;
  remarks: string;
  actionStatus: string;
  actionTaken: string;
  createdAt: string;
  updatedAt: string;
  whatsappSent: boolean;
  emailSent: boolean;
  quotationSent: boolean;
  sampleWorkSent: boolean;
  MeetingBooked: boolean;
  DemoScheduled: boolean;
  NeedMoreInfo: boolean;
  WaitingForDecision: boolean;
}

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

const BdaDashboard = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof Lead | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [temperatureFilter, setTemperatureFilter] = useState<string>('all');
  const [activeCardFilter, setActiveCardFilter] = useState<'today' | 'overdue' | 'closed' | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      console.log('No user logged in');
      setError('Please log in to view leads');
      return;
    }

    console.log('Logged-in user:', { id: user.id, name: user.name });

    fetch('http://localhost:8080/api/leads/getall')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data: any[]) => {
        console.log('API raw response:', data);
        const mappedLeads: Lead[] = data.map((lead) => ({
          id: String(lead.id),
          name: lead.name || '',
          phone: lead.contactNo || '',
          email: lead.email || '',
          industry: lead.industry || '',
          companyName: lead.companyName || '',
          city: lead.city || '',
          state: lead.state || '',
          status: (lead.status || 'new') as LeadStatus,
          assignedBdaId: lead.assignedBdaId ? String(lead.assignedBdaId) : null,
          assignedBdaName: lead.assignedTo || null,
          followUpDate: lead.followUp || null,
          temperature: lead.temperature || '',
          interests: lead.intrests || '',
          remarks: lead.remarks || '',
          actionStatus: lead.actionStatus || '',
          actionTaken: lead.actionTaken || '',
          createdAt: lead.createdAt || new Date().toISOString(),
          updatedAt: lead.lastUpdated || new Date().toISOString(),
          whatsappSent: lead.actionTaken?.includes('WhatsApp') || false,
          emailSent: lead.actionTaken?.includes('Email') || false,
          quotationSent: lead.actionTaken?.includes('Quotation') || false,
          sampleWorkSent: lead.actionTaken?.includes('Sample Work') || false,
          MeetingBooked: lead.actionTaken?.includes('MeetingBooked') || false,
          DemoScheduled: lead.actionTaken?.includes('DemoScheduled') || false,
          NeedMoreInfo: lead.actionTaken?.includes('NeedMoreInfo') || false,
          WaitingForDecision: lead.actionTaken?.includes('WaitingForDecision') || false,
        }));
        const bdaLeads = mappedLeads.filter((lead) => {
          if (!lead.assignedBdaName || !user.name) return false;
          const assignedTo = lead.assignedBdaName.trim().toLowerCase();
          const userName = user.name.trim().toLowerCase();
          console.log(`Lead ID ${lead.id}: assignedBdaName="${assignedTo}", userName="${userName}"`);
          return assignedTo === userName;
        });
        console.log('Filtered leads:', bdaLeads);
        setLeads(bdaLeads);
        setError(null);
        if (bdaLeads.length === 0) {
          setError('No leads assigned to you');
        }
      })
      .catch((err) => {
        console.error('Error fetching leads:', err);
        setError(`Failed to fetch leads: ${err.message}. Using mock data.`);
        const mockLeads: Lead[] = [
          {
            id: '7',
            name: 'KOMALI',
            phone: '918000000000',
            email: 'komalivarmakokkiligadda@gmail.com',
            industry: '',
            companyName: '',
            city: '',
            state: '',
            status: 'new',
            assignedBdaId: null,
            assignedBdaName: 'Prabhathi',
            followUpDate: null,
            temperature: '',
            interests: '',
            remarks: '',
            actionStatus: '',
            actionTaken: '',
            createdAt: '2025-05-24T06:26:42.937Z',
            updatedAt: '2025-05-24T06:26:42.937Z',
            whatsappSent: false,
            emailSent: false,
            quotationSent: false,
            sampleWorkSent: false,
            MeetingBooked: false,
            DemoScheduled: false,
            NeedMoreInfo: false,
            WaitingForDecision: false,
          },
        ];
        const bdaLeads = mockLeads.filter(
          (lead) => lead.assignedBdaName?.trim().toLowerCase() === user.name?.trim().toLowerCase()
        );
        setLeads(bdaLeads);
      });
  }, [user]);

  const handleSort = (key: keyof Lead) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };

  const handleCardFilter = (filter: 'today' | 'overdue' | 'closed' | 'all') => {
    setActiveCardFilter(filter);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTemperatureFilter('all');
    setActiveCardFilter('all');
    setSortBy(null);
    setSortDirection('asc');
    setFiltersOpen(false);
  };

  const handleOpenLeadModal = (lead: Lead) => {
    console.log('Opening modal for lead:', lead);
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const filteredLeads = leads
    .filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesTemperature = temperatureFilter === 'all' || lead.temperature === temperatureFilter;
      let matchesCardFilter = true;
      if (activeCardFilter === 'today') {
        matchesCardFilter = lead.followUpDate ? isToday(parseISO(lead.followUpDate)) : false;
      } else if (activeCardFilter === 'overdue') {
        matchesCardFilter = lead.followUpDate
          ? isBefore(parseISO(lead.followUpDate), new Date()) && !isToday(parseISO(lead.followUpDate))
          : false;
      } else if (activeCardFilter === 'closed') {
        matchesCardFilter = lead.status === 'closed_won';
      }
      return matchesSearch && matchesStatus && matchesTemperature && matchesCardFilter;
    })
    .sort((a, b) => {
      if (sortBy) {
        let valueA = a[sortBy] ?? '';
        let valueB = b[sortBy] ?? '';
        if (sortBy === 'updatedAt' || sortBy === 'followUpDate' || sortBy === 'createdAt') {
          return sortDirection === 'asc'
            ? new Date(valueA).getTime() - new Date(valueB).getTime()
            : new Date(valueB).getTime() - new Date(valueA).getTime();
        }
        return sortDirection === 'asc'
          ? String(valueA).localeCompare(String(valueB))
          : String(valueB).localeCompare(String(valueA));
      }
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    });

  const getFollowUpStatusClass = (followUpDate: string | null) => {
    if (!followUpDate) return '';
    const date = parseISO(followUpDate);
    if (isBefore(date, new Date()) && !isToday(date)) return 'text-red-600 font-medium';
    if (isToday(date)) return 'text-amber-600 font-medium';
    return 'text-slate-800';
  };

  const getTemperatureBadgeClass = (temperature: string) => {
    switch (temperature.toLowerCase()) {
      case 'hot':
        return 'bg-red-100 text-red-800';
      case 'warm':
        return 'bg-amber-100 text-amber-800';
      case 'cold':
        return 'bg-blue-100 text-blue-800';
      case 'dead':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
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
        return 'bg-gray-100 text-gray-800';
    }
  };

  const recentActivity = leads
    .filter((lead) => lead.updatedAt)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)
    .map((lead) => ({
      performedBy: user?.name || 'BDA',
      action: lead.actionTaken
        ? `performed action: ${lead.actionTaken}`
        : `updated lead status to ${lead.status}`,
      leadName: lead.name,
      timestamp: lead.updatedAt,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">My Dashboard</h1>
        <p className="text-slate-500 dark:text-gray-400 mt-1">Track and manage your assigned leads</p>
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg">{error}</div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-600 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-3 space-y-3 md:space-y-0">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border border-slate-300 dark:border-gray-600 pl-10 pr-3 py-2 text-sm placeholder-slate-400 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="inline-flex items-center px-2 py-1.5 text-sm font-medium rounded-md bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-600"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filter
              {filtersOpen ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
            </button>
          </div>
          <div>
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center px-2 py-1.5 text-sm font-medium rounded-md bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
                className="block w-full rounded-md border border-slate-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
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
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Temperature</label>
              <select
                value={temperatureFilter}
                onChange={(e) => setTemperatureFilter(e.target.value)}
                className="block w-full rounded-md border border-slate-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              >
                <option value="all">All Temperatures</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
                <option value="dead">Dead</option>
                <option value="">Not Set</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          onClick={() => handleCardFilter('all')}
          className={`border rounded-md p-4 flex items-center justify-between cursor-pointer ${
            activeCardFilter === 'all' ? 'bg-blue-100 border-blue-300' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-md mr-4">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-gray-900">All Leads</h3>
              <p className="text-sm text-gray-500">{leads.length} leads</p>
            </div>
          </div>
        </div>
        <div
          onClick={() => handleCardFilter('today')}
          className={`border rounded-md p-4 flex items-center justify-between cursor-pointer ${
            activeCardFilter === 'today' ? 'bg-amber-100 border-amber-300' : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-md mr-4">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-gray-900">Today's Follow-ups</h3>
              <p className="text-sm text-gray-500">
                {leads.filter((lead) => lead.followUpDate && isToday(parseISO(lead.followUpDate))).length} leads
              </p>
            </div>
          </div>
        </div>
        <div
          onClick={() => handleCardFilter('overdue')}
          className={`border rounded-md p-4 flex items-center justify-between cursor-pointer ${
            activeCardFilter === 'overdue' ? 'bg-red-100 border-red-300' : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-md mr-4">
              <Clock className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-gray-900">Overdue Follow-ups</h3>
              <p className="text-sm text-gray-500">
                {
                  leads.filter(
                    (lead) =>
                      lead.followUpDate &&
                      isBefore(parseISO(lead.followUpDate), new Date()) &&
                      !isToday(parseISO(lead.followUpDate))
                  ).length
                }{' '}
                leads
              </p>
            </div>
          </div>
        </div>
        <div
          onClick={() => handleCardFilter('closed')}
          className={`border rounded-md p-4 flex items-center justify-between cursor-pointer ${
            activeCardFilter === 'closed' ? 'bg-green-100 border-green-300' : 'bg-green-50 border-green-200'
          }`}
        >
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-md mr-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-gray-900">Closed Deals</h3>
              <p className="text-sm text-gray-500">
                {leads.filter((lead) => lead.status === 'closed_won').length} leads
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-medium text-slate-800">My Leads</h2>
        </div>
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
                  onClick={() => handleSort('temperature')}
                >
                  <div className="flex items-center">
                    Temperature
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
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  Actions Taken
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500">
                    No leads found. Try adjusting your filters or check your assigned leads.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const actionsTaken = lead.actionTaken
                    ? lead.actionTaken
                        .split(',')
                        .map((action) => action.trim())
                        .filter(Boolean)
                        .join(', ')
                    : 'None';
                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-400 cursor-pointer"
                      onClick={() => handleOpenLeadModal(lead)}
                    >
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                        <div className="text-sm text-gray-500">{lead.industry}</div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lead.phone}</div>
                        <div className="text-sm text-gray-500">{lead.email}</div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(
                            lead.status
                          )}`}
                        >
                          {lead.status === 'closed_won'
                            ? 'Registered'
                            : lead.status === 'closed_lost'
                            ? 'Lost'
                            : lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getTemperatureBadgeClass(
                            lead.temperature
                          )}`}
                        >
                          {lead.temperature.charAt(0).toUpperCase() + lead.temperature.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {lead.followUpDate ? (
                          <div className={`text-sm ${getFollowUpStatusClass(lead.followUpDate)}`}>
                            {format(new Date(lead.followUpDate), 'MMM d, yyyy')}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Not scheduled</div>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{actionsTaken}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="px-4 py-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="font-medium text-gray-900">Recent Activity</h2>
            <div className="text-sm font-medium text-blue-600 hover:text-blue-600 cursor-pointer">
              View all
            </div>
          </div>
        </div>
        <div className="divide-y-2 divide-gray-200 max-h-96">
          {recentActivity.length === 0 ? (
            <div className="px-4 py-4 sm:px-6 py-4 text-center text-sm text-gray-600">
              No recent activity
            </div>
          ) : (
            recentActivity.map((activity, index) => (
              <div key={index} className="px-4 py-4 sm:px-6 py-4">
                <div className="flex items-start">
                  <div className="mr-4 flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {activity.performedBy}
                          <span className="font-normal text-gray-600"> {activity.action}</span>
                        </p>
                        <p className="text-sm text-gray-600">Lead: {activity.leadName}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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
                  name: updatedLead.name || null,
                  email: updatedLead.email || null,
                  contactNo: updatedLead.phone || null,
                  status: updatedLead.status || null,
                  assignedTo: updatedLead.assignedBdaName || null,
                  followUp: updatedLead.followUpDate || null,
                  intrests: updatedLead.interests || null,
                  remarks: updatedLead.remarks || null,
                  actionStatus: updatedLead.actionStatus || null,
                  actionTaken: updatedLead.actionTaken || null,
                  companyName: updatedLead.companyName || null,
                  industry: updatedLead.industry || null,
                  city: updatedLead.city || null,
                  state: updatedLead.state || null,
                }),
              });

              if (!response.ok) throw new Error('Failed to update lead');

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

export default BdaDashboard;