import { useState } from 'react';
import { 
  ArrowUpDown, 
  Search, 
  Filter, 
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock
} from 'lucide-react';
import { mockLeads } from '../../data/mockData';
import { Lead, LeadStatus } from '../../types';
import { format, parseISO, isToday, isBefore } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import LeadModal from '../../components/leads/LeadModal';

const BdaLeads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>(mockLeads.filter(lead => lead.assignedBdaId === user?.id));
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof Lead>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [temperatureFilter, setTemperatureFilter] = useState<string>('all');
  
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
      const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           lead.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           lead.phone.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesTemperature = temperatureFilter === 'all' || lead.temperature === temperatureFilter;
      
      return matchesSearch && matchesStatus && matchesTemperature;
    })
    .sort((a, b) => {
      let valueA = a[sortBy];
      let valueB = b[sortBy];
      
      // Handle null values
      if (valueA === null) valueA = '';
      if (valueB === null) valueB = '';
      
      // Handle date strings
      if (typeof valueA === 'string' && (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'followUpDate')) {
        return sortDirection === 'asc' 
          ? new Date(valueA).getTime() - new Date(valueB as string).getTime()
          : new Date(valueB as string).getTime() - new Date(valueA).getTime();
      }
      
      // Handle other string comparisons
      if (typeof valueA === 'string') {
        return sortDirection === 'asc'
          ? valueA.localeCompare(valueB as string)
          : (valueB as string).localeCompare(valueA);
      }
      
      return 0;
    });
  
  // Handle opening lead modal
  const handleOpenLeadModal = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };
  
  // Get follow-up status class
  const getFollowUpStatusClass = (followUpDate: string | null) => {
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
  
  // Get temperature badge class
  const getTemperatureBadgeClass = (temperature: string) => {
    switch (temperature) {
      case 'hot':
        return 'bg-red-100 text-red-800';
      case 'warm':
        return 'bg-amber-100 text-amber-800';
      case 'cold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">My Leads</h1>
        <p className="text-slate-500 mt-1">Manage and track your assigned leads</p>
      </div>
      
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
            className="block w-full rounded-md border-slate-300 pl-10 pr-3 py-2 text-sm placeholder-slate-400 
                     focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="px-3 py-2 text-sm font-medium rounded-md bg-white border border-slate-300 
                   text-slate-700 hover:bg-slate-50 flex items-center sm:w-auto w-full justify-center"
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
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
              className="block w-full rounded-md border-slate-300 shadow-sm 
                       focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
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
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Temperature
            </label>
            <select
              value={temperatureFilter}
              onChange={(e) => setTemperatureFilter(e.target.value)}
              className="block w-full rounded-md border-slate-300 shadow-sm 
                       focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
            >
              <option value="all">All Temperatures</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
              <option value="">Not Set</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Follow-up reminders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's follow-ups */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-full mr-3">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-amber-800">Today's Follow-ups</h3>
              <p className="text-sm text-amber-700">
                {leads.filter(lead => lead.followUpDate && isToday(new Date(lead.followUpDate))).length} leads
              </p>
            </div>
          </div>
        </div>
        
        {/* Overdue follow-ups */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-full mr-3">
              <Clock className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-medium text-red-800">Overdue Follow-ups</h3>
              <p className="text-sm text-red-700">
                {leads.filter(lead => lead.followUpDate && isBefore(new Date(lead.followUpDate), new Date()) && !isToday(new Date(lead.followUpDate))).length} leads
              </p>
            </div>
          </div>
        </div>
        
        {/* Closed deals */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-full mr-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-800">Closed Deals</h3>
              <p className="text-sm text-green-700">
                {leads.filter(lead => lead.status === 'closed_won').length} leads
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Leads table */}
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions Taken
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500">
                    No leads found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleOpenLeadModal(lead)}
                  >
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
                      {lead.temperature ? (
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getTemperatureBadgeClass(lead.temperature)}`}>
                          {lead.temperature.charAt(0).toUpperCase() + lead.temperature.slice(1)}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lead.followUpDate ? (
                        <div className={`text-sm ${getFollowUpStatusClass(lead.followUpDate)}`}>
                          {format(new Date(lead.followUpDate), 'MMM d, yyyy')}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500">Not scheduled</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-1">
                        {lead.whatsappSent && (
                          <span className="w-2 h-2 bg-green-500 rounded-full" title="WhatsApp Sent"></span>
                        )}
                        {lead.emailSent && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full" title="Email Sent"></span>
                        )}
                        {lead.quotationSent && (
                          <span className="w-2 h-2 bg-amber-500 rounded-full" title="Quotation Sent"></span>
                        )}
                        {lead.sampleWorkSent && (
                          <span className="w-2 h-2 bg-purple-500 rounded-full" title="Sample Work Sent"></span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Lead Modal */}
      {selectedLead && (
        <LeadModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedLead(null);
          }}
          lead={selectedLead}
          onSave={(updatedLead) => {
            // Update lead in the list
            const updatedLeads = leads.map(lead => 
              lead.id === updatedLead.id ? updatedLead : lead
            );
            setLeads(updatedLeads);
            setIsModalOpen(false);
            setSelectedLead(null);
            toast.success('Lead updated successfully');
          }}
          readOnly={false}
        />
      )}
    </div>
  );
};

export default BdaLeads;