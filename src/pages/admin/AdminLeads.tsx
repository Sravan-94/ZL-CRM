import { useState, useRef } from 'react';
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
import { mockLeads, mockUsers } from '../../data/mockData';
import { Lead, LeadStatus, User } from '../../types';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import LeadModal from '../../components/leads/LeadModal';
import Papa from 'papaparse';

const AdminLeads = () => {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const bdaUsers = mockUsers.filter(user => user.role === 'bda');
  
  // Handle lead selection for bulk actions
  const toggleLeadSelection = (leadId: string) => {
    const newSelection = new Set(selectedLeads);
    if (newSelection.has(leadId)) {
      newSelection.delete(leadId);
    } else {
      newSelection.add(leadId);
    }
    setSelectedLeads(newSelection);
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
      const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           lead.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           lead.phone.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesBda = bdaFilter === 'all' || 
                        (bdaFilter === 'unassigned' ? !lead.assignedBdaId : lead.assignedBdaId === bdaFilter);
      
      return matchesSearch && matchesStatus && matchesBda;
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
  
  // Handle assigning leads to BDA
  const handleAssignLeads = () => {
    if (!selectedBdaForAssignment || selectedLeads.size === 0) {
      toast.error('Please select a BDA and at least one lead');
      return;
    }
    
    const selectedBda = bdaUsers.find(bda => bda.id === selectedBdaForAssignment);
    
    if (!selectedBda) {
      toast.error('Invalid BDA selected');
      return;
    }
    
    // Update leads with new BDA assignment
    const updatedLeads = leads.map(lead => {
      if (selectedLeads.has(lead.id)) {
        return {
          ...lead,
          assignedBdaId: selectedBda.id,
          assignedBdaName: selectedBda.name,
          updatedAt: new Date().toISOString()
        };
      }
      return lead;
    });
    
    setLeads(updatedLeads);
    setSelectedLeads(new Set());
    setIsAssigningLeads(false);
    toast.success(`${selectedLeads.size} leads assigned to ${selectedBda.name}`);
  };
  
  // Handle CSV import
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const newLeads: Lead[] = results.data.map((row: any, index) => {
            // Generate a unique ID
            const newId = `imported-${Date.now()}-${index}`;
            
            return {
              id: newId,
              name: row['Lead Name'] || `Imported Lead ${index + 1}`,
              phone: row['Phone'] || '',
              email: row['Email'] || '',
              industry: row['Industry'] || '',
              service: row['Service'] || '',
              type: row['Type'] || '',
              status: (row['Status']?.toLowerCase() as LeadStatus) || 'new',
              assignedBdaId: null,
              assignedBdaName: null,
              followUpDate: row['Follow-up Date'] || null,
              temperature: '',
              interests: [],
              remarks: '',
              whatsappSent: false,
              emailSent: false,
              quotationSent: false,
              sampleWorkSent: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          });
          
          // Add imported leads to the existing leads
          setLeads((prevLeads) => [...prevLeads, ...newLeads]);
          
          toast.success(`Successfully imported ${newLeads.length} leads`);
        } catch (error) {
          console.error('Error importing CSV:', error);
          toast.error('Error importing CSV. Please check the file format.');
        }
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        toast.error('Error parsing CSV file');
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    });
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
      'Updated At': lead.updatedAt
    }));
    
    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
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
            className={`px-3 py-2 text-sm font-medium rounded-md flex items-center ${
              isAssigningLeads 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            Assign Leads
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 text-sm font-medium rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center"
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
            className="px-3 py-2 text-sm font-medium rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center"
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
              <select
                value={selectedBdaForAssignment}
                onChange={(e) => setSelectedBdaForAssignment(e.target.value)}
                className="block w-48 rounded-md border-slate-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm"
              >
                <option value="">Select BDA</option>
                {bdaUsers.map((bda) => (
                  <option key={bda.id} value={bda.id}>{bda.name}</option>
                ))}
              </select>
              
              <button
                onClick={handleAssignLeads}
                disabled={!selectedBdaForAssignment || selectedLeads.size === 0}
                className="px-3 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center"
              >
                <Check className="h-4 w-4 mr-1.5" />
                Assign
              </button>
              
              <button
                onClick={() => {
                  setIsAssigningLeads(false);
                  setSelectedLeads(new Set());
                }}
                className="p-2 text-slate-500 hover:text-slate-700 rounded-md"
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
              Assigned BDA
            </label>
            <select
              value={bdaFilter}
              onChange={(e) => setBdaFilter(e.target.value)}
              className="block w-full rounded-md border-slate-300 shadow-sm 
                       focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
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
      
      {/* Leads table */}
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
                  >
                    {isAssigningLeads && (
                      <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          checked={selectedLeads.has(lead.id)}
                          onChange={() => toggleLeadSelection(lead.id)}
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
                      {lead.followUpDate ? (
                        <div className={`text-sm ${
                          new Date(lead.followUpDate) < new Date() && !format(new Date(lead.followUpDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
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
                      <div className="text-sm text-slate-500">
                        {format(parseISO(lead.updatedAt), 'MMM d, h:mm a')}
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

export default AdminLeads;