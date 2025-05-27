// import { useState, useEffect } from 'react';
// import {
//   ArrowUpDown,
//   Search,
//   Filter,
//   ChevronDown,
//   ChevronUp,
//   CheckCircle,
//   Clock,
// } from 'lucide-react';
// import { useAuth } from '../../contexts/AuthContext';
// import { format, parseISO, isToday, isBefore } from 'date-fns';
// import { toast } from 'react-hot-toast';

// // LeadModal component (unchanged)
// const LeadModal = ({
//   isOpen,
//   onClose,
//   lead,
//   onSave,
//   readOnly,
// }: {
//   isOpen: boolean;
//   onClose: () => void;
//   lead: Lead;
//   onSave: (updatedLead: Lead) => void;
//   readOnly: boolean;
// }) => {
//   const [formData, setFormData] = useState<Lead>({ ...lead });

//   useEffect(() => {
//     console.log('LeadModal props:', { isOpen, lead, readOnly });
//     setFormData({ ...lead });
//   }, [lead, isOpen]);

//   if (!isOpen) return null;

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     const actionTaken = [
//       formData.whatsappSent ? 'WhatsApp' : '',
//       formData.emailSent ? 'Email' : '',
//       formData.quotationSent ? 'Quotation' : '',
//       formData.sampleWorkSent ? 'Sample' : '',
//     ]
//       .filter(Boolean)
//       .join(', ') || null;
//     onSave({ ...formData, actionTaken });
//   };

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
//   ) => {
//     const { name, value, type } = e.target;
//     if (type === 'checkbox') {
//       setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
//     } else {
//       setFormData({ ...formData, [name]: value || null });
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
//         <h2 className="text-xl font-semibold mb-4">Update Lead</h2>
//         <form onSubmit={handleSubmit}>
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-slate-700">Name</label>
//             <input
//               type="text"
//               name="name"
//               value={formData.name || ''}
//               onChange={handleChange}
//               disabled={readOnly}
//               className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//             />
//           </div>
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-slate-700">Phone</label>
//             <input
//               type="text"
//               name="phone"
//               value={formData.phone || ''}
//               onChange={handleChange}
//               disabled={readOnly}
//               className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//             />
//           </div>
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-slate-700">Email</label>
//             <input
//               type="email"
//               name="email"
//               value={formData.email || ''}
//               onChange={handleChange}
//               disabled={readOnly}
//               className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//             />
//           </div>
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-slate-700">Status</label>
//             <select
//               name="status"
//               value={formData.status || 'new'}
//               onChange={handleChange}
//               disabled={readOnly}
//               className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//             >
//               <option value="new">New</option>
//               <option value="contacted">Contacted</option>
//               <option value="qualified">Qualified</option>
//               <option value="proposal">Proposal</option>
//               <option value="negotiation">Negotiation</option>
//               <option value="closed_won">Closed (Won)</option>
//               <option value="closed_lost">Closed (Lost)</option>
//               <option value="warm">Warm</option>
//             </select>
//           </div>
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-slate-700">Temperature</label>
//             <select
//               name="temperature"
//               value={formData.temperature || ''}
//               onChange={handleChange}
//               disabled={readOnly}
//               className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//             >
//               <option value="">Not Set</option>
//               <option value="hot">Hot</option>
//               <option value="warm">Warm</option>
//               <option value="cold">Cold</option>
//             </select>
//           </div>
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-slate-700">Follow-up Date</label>
//             <input
//               type="date"
//               name="followUpDate"
//               value={formData.followUpDate ? format(new Date(formData.followUpDate), 'yyyy-MM-dd') : ''}
//               onChange={handleChange}
//               disabled={readOnly}
//               className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//             />
//           </div>
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-slate-700">Remarks</label>
//             <textarea
//               name="remarks"
//               value={formData.remarks || ''}
//               onChange={handleChange}
//               disabled={readOnly}
//               className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//               rows={4}
//             />
//           </div>
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-slate-700">Interests</label>
//             <input
//               type="text"
//               name="interests"
//               value={formData.interests || ''}
//               onChange={handleChange}
//               disabled={readOnly}
//               className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
//               placeholder="e.g., Web Development, SEO"
//             />
//           </div>
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-slate-700">Actions Taken</label>
//             <div className="space-y-2">
//               <label className="flex items-center">
//                 <input
//                   type="checkbox"
//                   name="whatsappSent"
//                   checked={formData.whatsappSent || false}
//                   onChange={handleChange}
//                   disabled={readOnly}
//                   className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
//                 />
//                 <span className="ml-2 text-sm text-slate-700">WhatsApp Sent</span>
//               </label>
//               <label className="flex items-center">
//                 <input
//                   type="checkbox"
//                   name="emailSent"
//                   checked={formData.emailSent || false}
//                   onChange={handleChange}
//                   disabled={readOnly}
//                   className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
//                 />
//                 <span className="ml-2 text-sm text-slate-700">Email Sent</span>
//               </label>
//               <label className="flex items-center">
//                 <input
//                   type="checkbox"
//                   name="quotationSent"
//                   checked={formData.quotationSent || false}
//                   onChange={handleChange}
//                   disabled={readOnly}
//                   className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
//                 />
//                 <span className="ml-2 text-sm text-slate-700">Quotation Sent</span>
//               </label>
//               <label className="flex items-center">
//                 <input
//                   type="checkbox"
//                   name="sampleWorkSent"
//                   checked={formData.sampleWorkSent || false}
//                   onChange={handleChange}
//                   disabled={readOnly}
//                   className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
//                 />
//                 <span className="ml-2 text-sm text-slate-700">Sample Work Sent</span>
//               </label>
//             </div>
//           </div>
//           <div className="flex justify-end space-x-2">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300"
//             >
//               Cancel
//             </button>
//             {!readOnly && (
//               <button
//                 type="submit"
//                 className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
//               >
//                 Save
//               </button>
//             )}
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// // Lead interface
// interface Lead {
//   id: number;
//   name: string | null;
//   remarks: string | null;
//   status: string;
//   email: string | null;
//   lastUpdated: string;
//   phone: string | null;
//   assignedTo: string | null;
//   followUpDate: string | null;
//   interests: string | null;
//   actionStatus: string | null;
//   actionTaken: string | null;
//   industry?: string | null;
//   temperature?: string | null;
//   whatsappSent?: boolean;
//   emailSent?: boolean;
//   quotationSent?: boolean;
//   sampleWorkSent?: boolean;
// }

// type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | 'warm';

// const BdaDashboard = () => {
//   const { user } = useAuth();
//   const [leads, setLeads] = useState<Lead[]>([]);
//   const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [sortBy, setSortBy] = useState<keyof Lead>('lastUpdated');
//   const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
//   const [filtersOpen, setFiltersOpen] = useState(false);
//   const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
//   const [temperatureFilter, setTemperatureFilter] = useState<string>('all');
//   const [activeCardFilter, setActiveCardFilter] = useState<'today' | 'overdue' | 'closed' | 'all'>('all');
//   const [error, setError] = useState<string | null>(null);

//   // Fetch leads from API
//   useEffect(() => {
//     if (!user) {
//       console.log('No user logged in');
//       setError('Please log in to view leads');
//       return;
//     }

//     console.log('Logged-in user:', { id: user.id, name: user.name });

//     fetch('http://localhost:8080/api/leads/getall', {
//       headers: {
//         // Uncomment if authentication is required
//         // 'Authorization': `Bearer ${user.token}`,
//       },
//     })
//       .then((response) => {
//         if (!response.ok) {
//           throw new Error(`HTTP error! Status: ${response.status}`);
//         }
//         return response.json();
//       })
//       .then((data: any[]) => {
//         console.log('API raw response:', data);
//         const mappedLeads = data.map((lead) => ({
//           id: lead.id,
//           name: lead.name || null,
//           remarks: lead.remarks || null,
//           status: lead.status || 'new',
//           email: lead.email || null,
//           lastUpdated: lead.lastUpdated || new Date().toISOString(),
//           phone: lead.contactNo || null,
//           assignedTo: lead.assignedTo || null,
//           followUpDate: lead.followUp || null,
//           interests: lead.intrests || null,
//           actionStatus: lead.actionStatus || null,
//           actionTaken: lead.actionTaken || null,
//           industry: null,
//           temperature: null,
//           whatsappSent: lead.actionTaken?.includes('whatsapp') || false,
//           emailSent: lead.actionTaken?.includes('email') || false,
//           quotationSent: lead.actionTaken?.includes('quotation') || false,
//           sampleWorkSent: lead.actionTaken?.includes('sample') || false,
//         }));
//         const bdaLeads = mappedLeads.filter((lead) => {
//           if (!lead.assignedTo || !user.name) return false;
//           const assignedTo = lead.assignedTo.trim().toLowerCase();
//           const userName = user.name.trim().toLowerCase();
//           console.log(`Lead ID ${lead.id}: assignedTo="${assignedTo}", userName="${userName}"`);
//           return assignedTo === userName;
//         });
//         console.log('Filtered leads:', bdaLeads);
//         setLeads(bdaLeads);
//         setError(null);
//         if (bdaLeads.length === 0) {
//           setError('No leads assigned to you');
//         }
//       })
//       .catch((error) => {
//         console.error('Error fetching leads:', error);
//         setError(`Failed to fetch leads: ${error.message}. Using mock data.`);
//         const mockLeads: Lead[] = [
//           {
//             id: 7,
//             name: 'KOMALI',
//             remarks: null,
//             status: 'new',
//             email: 'komalivarmakokkiligadda@gmail.com',
//             lastUpdated: '2025-05-24T06:26:42.937+00:00',
//             phone: '918000000000',
//             assignedTo: 'Prabhathi',
//             followUpDate: null,
//             interests: null,
//             actionStatus: null,
//             actionTaken: null,
//             industry: null,
//             temperature: null,
//             whatsappSent: false,
//             emailSent: false,
//             quotationSent: false,
//             sampleWorkSent: false,
//           },
//         ];
//         const bdaLeads = mockLeads.filter(
//           (lead) => lead.assignedTo?.trim().toLowerCase() === user.name?.trim().toLowerCase()
//         );
//         setLeads(bdaLeads);
//       });
//   }, [user]);

//   // Handle sorting
//   const handleSort = (key: keyof Lead) => {
//     if (sortBy === key) {
//       setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
//     } else {
//       setSortBy(key);
//       setSortDirection('asc');
//     }
//   };

//   // Handle card filter click
//   const handleCardFilter = (filter: 'today' | 'overdue' | 'closed' | 'all') => {
//     setActiveCardFilter(filter);
//   };

//   // Handle opening lead modal
//   const handleOpenLeadModal = (lead: Lead) => {
//     console.log('Opening modal for lead:', lead);
//     setSelectedLead(lead);
//     setIsModalOpen(true);
//   };

//   // Update lead via API
//   const handleUpdateLead = async (updatedLead: Lead) => {
//     try {
//       console.log('Updating lead:', updatedLead);
//       const response = await fetch(`http://localhost:8080/api/leads/update/${updatedLead.id}`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//           // Uncomment if authentication is required
//           // 'Authorization': `Bearer ${user.token}`,
//         },
//         body: JSON.stringify({
//           id: updatedLead.id,
//           name: updatedLead.name,
//           remarks: updatedLead.remarks,
//           status: updatedLead.status,
//           email: updatedLead.email,
//           lastUpdated: new Date().toISOString(),
//           contactNo: updatedLead.phone,
//           assignedTo: updatedLead.assignedTo,
//           followUp: updatedLead.followUpDate,
//           intrests: updatedLead.interests,
//           actionStatus: updatedLead.actionStatus,
//           actionTaken: updatedLead.actionTaken,
//           temperature: updatedLead.temperature,
//         }),
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! Status: ${response.status}`);
//       }

//       const updatedLeads = leads.map((lead) =>
//         lead.id === updatedLead.id ? { ...updatedLead } : lead
//       );
//       setLeads(updatedLeads);
//       setIsModalOpen(false);
//       setSelectedLead(null);
//       toast.success('Lead updated successfully');
//     } catch (error) {
//       console.error('Error updating lead:', error);
//       toast.error('Failed to update lead. Please try again.');
//     }
//   };

//   // Filter and sort leads
//   const filteredLeads = leads
//     .filter((lead) => {
//       const matchesSearch =
//         (lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
//         (lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
//         (lead.phone?.includes(searchTerm) || false);

//       const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
//       const matchesTemperature = temperatureFilter === 'all' || lead.temperature === temperatureFilter;

//       let matchesCardFilter = true;
//       if (activeCardFilter === 'today') {
//         matchesCardFilter = lead.followUpDate ? isToday(new Date(lead.followUpDate)) : false;
//       } else if (activeCardFilter === 'overdue') {
//         matchesCardFilter = lead.followUpDate
//           ? isBefore(new Date(lead.followUpDate), new Date()) && !isToday(new Date(lead.followUpDate))
//           : false;
//       } else if (activeCardFilter === 'closed') {
//         matchesCardFilter = lead.status === 'closed_won';
//       }

//       return matchesSearch && matchesStatus && matchesTemperature && matchesCardFilter;
//     })
//     .sort((a, b) => {
//       let valueA = a[sortBy];
//       let valueB = b[sortBy];

//       if (valueA === null) valueA = '';
//       if (valueB === null) valueB = '';

//       if (typeof valueA === 'string' && (sortBy === 'lastUpdated' || sortBy === 'followUpDate')) {
//         return sortDirection === 'asc'
//           ? new Date(valueA).getTime() - new Date(valueB as string).getTime()
//           : new Date(valueB as string).getTime() - new Date(valueA).getTime();
//       }

//       if (typeof valueA === 'string') {
//         return sortDirection === 'asc'
//           ? valueA.localeCompare(valueB as string)
//           : (valueB as string).localeCompare(valueA);
//       }

//       return 0;
//     });

//   // Get follow-up status class
//   const getFollowUpStatusClass = (followUpDate: string | null) => {
//     if (!followUpDate) return '';

//     const date = new Date(followUpDate);
//     if (isBefore(date, new Date()) && !isToday(date)) {
//       return 'text-red-600 font-medium';
//     }
//     if (isToday(date)) {
//       return 'text-amber-600 font-medium';
//     }
//     return 'text-slate-800';
//   };

//   // Get temperature badge class
//   const getTemperatureBadgeClass = (temperature: string | null | undefined) => {
//     switch (temperature) {
//       case 'hot':
//         return 'bg-red-100 text-red-800';
//       case 'warm':
//         return 'bg-amber-100 text-amber-800';
//       case 'cold':
//         return 'bg-blue-100 text-blue-800';
//       default:
//         return 'bg-slate-100 text-slate-800';
//     }
//   };

//   // Recent activity
//   const recentActivity = leads
//     .filter((lead) => lead.lastUpdated)
//     .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
//     .slice(0, 5)
//     .map((lead) => ({
//       performedBy: user?.name || 'BDA',
//       action: `updated lead status to ${lead.status}`,
//       leadName: lead.name || 'Unknown',
//       timestamp: lead.lastUpdated,
//     }));

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div>
//         <h1 className="text-2xl font-semibold text-slate-800">My Dashboard</h1>
//         <p className="text-slate-500 mt-1">Track and manage your assigned leads</p>
//       </div>

//       {/* Error message */}
//       {error && (
//         <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg">
//           {error}
//         </div>
//       )}

//       {/* Search and Filters */}
//    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
//   {/* Search & Filter Button */}
//   <div className="flex flex-col md:flex-row md:items-center md:space-x-3 space-y-3 md:space-y-0">
//     {/* Search Input */}
//     <div className="relative flex-1">
//       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//         <Search className="h-4 w-4 text-slate-400" />
//       </div>
//       <input
//         type="text"
//         placeholder="Search leads..."
//         value={searchTerm}
//         onChange={(e) => setSearchTerm(e.target.value)}
//         className="block w-full rounded-md border border-slate-300 pl-10 pr-3 py-2 text-sm placeholder-slate-400 
//                  focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//       />
//     </div>

//     {/* Compact Filter Button */}
//     <div>
//       <button
//         onClick={() => setFiltersOpen(!filtersOpen)}
//         className="inline-flex items-center px-2 py-1.5 text-sm font-medium rounded-md 
//                  bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
//       >
//         <Filter className="h-4 w-4 mr-1" />
//         Filter
//         {filtersOpen ? (
//           <ChevronUp className="h-4 w-4 ml-1" />
//         ) : (
//           <ChevronDown className="h-4 w-4 ml-1" />
//         )}
//       </button>
//     </div>
//   </div>

//   {/* Filters Dropdown */}
//   {filtersOpen && (
//     <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
//       {/* Status Filter */}
//       <div>
//         <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
//         <select
//           value={statusFilter}
//           onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
//           className="block w-full rounded-md border border-slate-300 text-sm shadow-sm 
//                    focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
//         >
//           <option value="all">All Statuses</option>
//           <option value="new">New</option>
//           <option value="contacted">Contacted</option>
//           <option value="qualified">Qualified</option>
//           <option value="proposal">Proposal</option>
//           <option value="negotiation">Negotiation</option>
//           <option value="closed_won">Closed (Won)</option>
//           <option value="closed_lost">Closed (Lost)</option>
//           <option value="warm">Warm</option>
//         </select>
//       </div>

//       {/* Temperature Filter */}
//       <div>
//         <label className="block text-sm font-medium text-slate-700 mb-1">Temperature</label>
//         <select
//           value={temperatureFilter}
//           onChange={(e) => setTemperatureFilter(e.target.value)}
//           className="block w-full rounded-md border border-slate-300 text-sm shadow-sm 
//                    focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
//         >
//           <option value="all">All Temperatures</option>
//           <option value="hot">Hot</option>
//           <option value="warm">Warm</option>
//           <option value="cold">Cold</option>
//           <option value="">Not Set</option>
//         </select>
//       </div>
//     </div>
//   )}
// </div>



//       {/* Follow-up reminders as filters */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <div
//           onClick={() => handleCardFilter('all')}
//           className={`border rounded-lg p-4 flex items-center justify-between cursor-pointer ${
//             activeCardFilter === 'all' ? 'bg-blue-100 border-blue-300' : 'bg-slate-50 border-slate-200'
//           }`}
//         >
//           <div className="flex items-center">
//             <div className="p-2 bg-slate-100 rounded-full mr-3">
//               <Clock className="h-5 w-5 text-slate-600" />
//             </div>
//             <div>
//               <h3 className="font-medium text-slate-800">All Leads</h3>
//               <p className="text-sm text-slate-700">{leads.length} leads</p>
//             </div>
//           </div>
//         </div>
//         <div
//           onClick={() => handleCardFilter('today')}
//           className={`border rounded-lg p-4 flex items-center justify-between cursor-pointer ${
//             activeCardFilter === 'today' ? 'bg-amber-100 border-amber-300' : 'bg-amber-50 border-amber-200'
//           }`}
//         >
//           <div className="flex items-center">
//             <div className="p-2 bg-amber-100 rounded-full mr-3">
//               <Clock className="h-5 w-5 text-amber-600" />
//             </div>
//             <div>
//               <h3 className="font-medium text-amber-800">Today's Follow-ups</h3>
//               <p className="text-sm text-amber-700">
//                 {leads.filter((lead) => lead.followUpDate && isToday(new Date(lead.followUpDate))).length} leads
//               </p>
//             </div>
//           </div>
//         </div>
//         <div
//           onClick={() => handleCardFilter('overdue')}
//           className={`border rounded-lg p-4 flex items-center justify-between cursor-pointer ${
//             activeCardFilter === 'overdue' ? 'bg-red-100 border-red-300' : 'bg-red-50 border-red-200'
//           }`}
//         >
//           <div className="flex items-center">
//             <div className="p-2 bg-red-100 rounded-full mr-3">
//               <Clock className="h-5 w-5 text-red-600" />
//             </div>
//             <div>
//               <h3 className="font-medium text-red-800">Overdue Follow-ups</h3>
//               <p className="text-sm text-red-700">
//                 {leads.filter(
//                   (lead) =>
//                     lead.followUpDate &&
//                     isBefore(new Date(lead.followUpDate), new Date()) &&
//                     !isToday(new Date(lead.followUpDate))
//                 ).length}{' '}
//                 leads
//               </p>
//             </div>
//           </div>
//         </div>
//         <div
//           onClick={() => handleCardFilter('closed')}
//           className={`border rounded-lg p-4 flex items-center justify-between cursor-pointer ${
//             activeCardFilter === 'closed' ? 'bg-green-100 border-green-300' : 'bg-green-50 border-green-200'
//           }`}
//         >
//           <div className="flex items-center">
//             <div className="p-2 bg-green-100 rounded-full mr-3">
//               <CheckCircle className="h-5 w-5 text-green-600" />
//             </div>
//             <div>
//               <h3 className="font-medium text-green-800">Closed Deals</h3>
//               <p className="text-sm text-green-700">
//                 {leads.filter((lead) => lead.status === 'closed_won').length} leads
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Leads table */}
//       <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
//         <div className="px-6 py-4 border-b border-slate-200">
//           <h2 className="font-medium text-slate-800">My Leads</h2>
//         </div>
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-slate-200">
//             <thead className="bg-slate-50">
//               <tr>
//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
//                   onClick={() => handleSort('name')}
//                 >
//                   <div className="flex items-center">
//                     Name
//                     <ArrowUpDown className="h-4 w-4 ml-1" />
//                   </div>
//                 </th>
//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
//                 >
//                   Contact
//                 </th>
//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
//                   onClick={() => handleSort('status')}
//                 >
//                   <div className="flex items-center">
//                     Status
//                     <ArrowUpDown className="h-4 w-4 ml-1" />
//                   </div>
//                 </th>
//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
//                   onClick={() => handleSort('temperature')}
//                 >
//                   <div className="flex items-center">
//                     Temperature
//                     <ArrowUpDown className="h-4 w-4 ml-1" />
//                   </div>
//                 </th>
//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer"
//                   onClick={() => handleSort('followUpDate')}
//                 >
//                   <div className="flex items-center">
//                     Follow-up
//                     <ArrowUpDown className="h-4 w-4 ml-1" />
//                   </div>
//                 </th>
//                 <th
//                   scope="col"
//                   className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
//                 >
//                   Actions Taken
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-slate-200">
//               {filteredLeads.length === 0 ? (
//                 <tr>
//                   <td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500">
//                     No leads found. Try adjusting your filters or check your assigned leads.
//                   </td>
//                 </tr>
//               ) : (
//                 filteredLeads.map((lead) => {
//                   const actionsTaken = [
//                     lead.whatsappSent ? 'WhatsApp' : '',
//                     lead.emailSent ? 'Email' : '',
//                     lead.quotationSent ? 'Quotation' : '',
//                     lead.sampleWorkSent ? 'Sample' : '',
//                   ]
//                     .filter(Boolean)
//                     .join(', ') || 'None';
//                   return (
//                     <tr
//                       key={lead.id}
//                       className="hover:bg-slate-50 cursor-pointer"
//                       onClick={() => handleOpenLeadModal(lead)}
//                     >
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm font-medium text-slate-800">{lead.name || 'Unknown'}</div>
//                         <div className="text-sm text-slate-500">{lead.industry || 'Not set'}</div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm text-slate-800">{lead.phone || 'Not set'}</div>
//                         <div className="text-sm text-slate-500">{lead.email || 'Not set'}</div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span
//                           className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
//                             lead.status === 'new'
//                               ? 'bg-slate-100 text-slate-800'
//                               : lead.status === 'contacted'
//                               ? 'bg-blue-100 text-blue-800'
//                               : lead.status === 'qualified'
//                               ? 'bg-purple-100 text-purple-800'
//                               : lead.status === 'proposal'
//                               ? 'bg-amber-100 text-amber-800'
//                               : lead.status === 'negotiation'
//                               ? 'bg-orange-100 text-orange-800'
//                               : lead.status === 'closed_won'
//                               ? 'bg-green-100 text-green-800'
//                               : lead.status === 'warm'
//                               ? 'bg-yellow-100 text-yellow-800'
//                               : 'bg-red-100 text-red-800'
//                           }`}
//                         >
//                           {lead.status === 'closed_won'
//                             ? 'Won'
//                             : lead.status === 'closed_lost'
//                             ? 'Lost'
//                             : lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         {lead.temperature ? (
//                           <span
//                             className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getTemperatureBadgeClass(
//                               lead.temperature
//                             )}`}
//                           >
//                             {lead.temperature.charAt(0).toUpperCase() + lead.temperature.slice(1)}
//                           </span>
//                         ) : (
//                           <span className="text-sm text-slate-500">Not set</span>
//                         )}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         {lead.followUpDate ? (
//                           <div className={`text-sm ${getFollowUpStatusClass(lead.followUpDate)}`}>
//                             {format(new Date(lead.followUpDate), 'MMM d, yyyy', { timeZone: 'Asia/Kolkata' })}
//                           </div>
//                         ) : (
//                           <div className="text-sm text-slate-500">Not scheduled</div>
//                         )}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm text-slate-800">{actionsTaken}</div>
//                       </td>
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Recent activity */}
//       <div className="bg-white rounded-lg shadow-sm border border-slate-200">
//         <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
//           <h2 className="font-medium text-slate-800">Recent Activity</h2>
//           <div className="text-sm text-blue-600 hover:text-blue-500 cursor-pointer">View all</div>
//         </div>
//         <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
//           {recentActivity.length === 0 ? (
//             <div className="px-6 py-4 text-center text-sm text-slate-500">No recent activity</div>
//           ) : (
//             recentActivity.map((activity, index) => (
//               <div key={index} className="px-6 py-4 flex items-start">
//                 <div className="mr-4 mt-0.5">
//                   <CheckCircle className="h-5 w-5 text-slate-500" />
//                 </div>
//                 <div className="flex-1">
//                   <div className="flex justify-between items-start">
//                     <div>
//                       <p className="text-sm font-medium text-slate-800">
//                         {activity.performedBy}
//                         <span className="font-normal text-slate-600"> {activity.action}</span>
//                       </p>
//                       <p className="text-sm text-slate-600">Lead: {activity.leadName}</p>
//                     </div>
//                     <div className="text-xs text-slate-500">
//                       {format(parseISO(activity.timestamp), 'MMM d, h:mm a', { timeZone: 'Asia/Kolkata' })}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
//       </div>

//       {/* Lead Modal */}
//       {selectedLead && (
//         <LeadModal
//           isOpen={isModalOpen}
//           onClose={() => {
//             console.log('Closing modal');
//             setIsModalOpen(false);
//             setSelectedLead(null);
//           }}
//           lead={selectedLead}
//           onSave={handleUpdateLead}
//           readOnly={false}
//         />
//       )}
//     </div>
//   );
// };

// export default BdaDashboard;

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
import { toast } from 'react-hot-toast';

// LeadModal component (unchanged)
const LeadModal = ({
  isOpen,
  onClose,
  lead,
  onSave,
  readOnly,
}: {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onSave: (updatedLead: Lead) => void;
  readOnly: boolean;
}) => {
  const [formData, setFormData] = useState<Lead>({ ...lead });

  useEffect(() => {
    console.log('LeadModal props:', { isOpen, lead, readOnly });
    setFormData({ ...lead });
  }, [lead, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const actionTaken = [
      formData.whatsappSent ? 'WhatsApp' : '',
      formData.emailSent ? 'Email' : '',
      formData.quotationSent ? 'Quotation' : '',
      formData.sampleWorkSent ? 'Sample' : '',
    ]
      .filter(Boolean)
      .join(', ') || null;
    onSave({ ...formData, actionTaken });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value || null });
    }
  };

  const LeadModal = ({ formData, handleChange, handleSubmit, readOnly, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Update Lead</h2>

        {/* Lead Details (Read-only) */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Lead Details</h3>
          <div className="border border-gray-200 bg-gray-50 p-4 rounded">
            <p className="font-semibold">{formData.name}</p>
            <p className="text-sm text-gray-600">{formData.phone}</p>
            <p className="text-sm text-gray-600">{formData.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Status */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700">Status</label>
            <select
              name="status"
              value={formData.status || 'new'}
              onChange={handleChange}
              disabled={readOnly}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"
            >
              <option value="new">New</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
              <option value="contacted">WrongNumber</option>
              <option value="warm">NotAnswered</option>
              <option value="warm">CallBackLater</option>
              <option value="warm">Interested</option>
              <option value="warm">NotInterested</option>
              <option value="warm">SwitchedOff</option>
              <option value="closed_won">Closed (Won)</option>
              <option value="closed_lost">Closed (Lost)</option>
            </select>
          </div>

          {/* Temperature */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700">Temperature</label>
            <select
              name="temperature"
              value={formData.temperature || ''}
              onChange={handleChange}
              disabled={readOnly}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"
            >
              <option value="">Not Set</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
              <option value="hot">Dead</option>
            </select>
          </div>

          {/* Follow-Up Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700">Follow-up Date</label>
            <input
              type="date"
              name="followUpDate"
              value={
                formData.followUpDate
                  ? format(new Date(formData.followUpDate), 'yyyy-MM-dd')
                  : ''
              }
              onChange={handleChange}
              disabled={readOnly}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"
            />
          </div>

          {/* Remarks */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700">Remarks</label>
            <textarea
              name="remarks"
              value={formData.remarks || ''}
              onChange={handleChange}
              disabled={readOnly}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"
              rows={4}
            />
          </div>

          {/* Interests */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Interests</label>
            <div className="space-y-2">
              {['Website', 'App', 'CRM', 'Both', 'Ecommerce', 'CustomSoftware', 'AIIntegration'].map((item) => (
                <label className="flex items-center" key={item}>
                  <input
                    type="checkbox"
                    name="interests"
                    value={item}
                    checked={(formData.interests || '').includes(item)}
                    onChange={(e) => {
                      const current = formData.interests?.split(',').map(i => i.trim()) || [];
                      const updated = e.target.checked
                        ? [...new Set([...current, item])]
                        : current.filter(i => i !== item);
                      handleChange({ target: { name: 'interests', value: updated.join(', ') } });
                    }}
                    disabled={readOnly}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-slate-700">{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions Taken */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Actions Taken</label>
            <div className="space-y-2">
              {[
                { name: 'whatsappSent', label: 'WhatsApp Sent' },
                { name: 'emailSent', label: 'Email Sent' },
                { name: 'quotationSent', label: 'Quotation Sent' },
                { name: 'sampleWorkSent', label: 'Sample Work Sent' },
                { name: 'MeetingBooked', label: 'MeetingBooked' },
                { name: 'DemoScheduled', label: 'DemoScheduled' },
                { name: 'NeedMoreInfo', label: 'NeedMoreInfo' },
                { name: 'WaitingForDecision', label: 'WaitingForDecision' },
              ].map((action) => (
                <label className="flex items-center" key={action.name}>
                  <input
                    type="checkbox"
                    name={action.name}
                    checked={formData[action.name] || false}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-slate-700">{action.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300"
            >
              Cancel
            </button>
            {!readOnly && (
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
// Lead interface
interface Lead {
  id: number;
  name: string | null;
  remarks: string | null;
  status: string;
  email: string | null;
  lastUpdated: string;
  phone: string | null;
  assignedTo: string | null;
  followUpDate: string | null;
  interests: string | null;
  actionStatus: string | null;
  actionTaken: string | null;
  industry?: string | null;
  temperature?: string | null;
  whatsappSent?: boolean;
  emailSent?: boolean;
  quotationSent?: boolean;
  sampleWorkSent?: boolean;
}

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | 'warm';

const BdaDashboard = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof Lead | null>(null); // Allow null for default sorting
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); // Default to asc for lastUpdated
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [temperatureFilter, setTemperatureFilter] = useState<string>('all');
  const [activeCardFilter, setActiveCardFilter] = useState<'today' | 'overdue' | 'closed' | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  // Fetch leads from API
  useEffect(() => {
    if (!user) {
      console.log('No user logged in');
      setError('Please log in to view leads');
      return;
    }

    console.log('Logged-in user:', { id: user.id, name: user.name });

    fetch('http://localhost:8080/api/leads/getall', {
      headers: {
        // Uncomment if authentication is required
        // 'Authorization': `Bearer ${user.token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data: any[]) => {
        console.log('API raw response:', data);
        const mappedLeads = data.map((lead) => ({
          id: lead.id,
          name: lead.name || null,
          remarks: lead.remarks || null,
          status: lead.status || 'new',
          email: lead.email || null,
          lastUpdated: lead.lastUpdated || new Date().toISOString(),
          phone: lead.contactNo || null,
          assignedTo: lead.assignedTo || null,
          followUpDate: lead.followUp || null,
          interests: lead.intrests || null,
          actionStatus: lead.actionStatus || null,
          actionTaken: lead.actionTaken || null,
          industry: null,
          temperature: null,
          whatsappSent: lead.actionTaken?.includes('whatsapp') || false,
          emailSent: lead.actionTaken?.includes('email') || false,
          quotationSent: lead.actionTaken?.includes('quotation') || false,
          sampleWorkSent: lead.actionTaken?.includes('sample') || false,
        }));
        const bdaLeads = mappedLeads.filter((lead) => {
          if (!lead.assignedTo || !user.name) return false;
          const assignedTo = lead.assignedTo.trim().toLowerCase();
          const userName = user.name.trim().toLowerCase();
          console.log(`Lead ID ${lead.id}: assignedTo="${assignedTo}", userName="${userName}"`);
          return assignedTo === userName;
        });
        console.log('Filtered leads:', bdaLeads);
        setLeads(bdaLeads);
        setError(null);
        if (bdaLeads.length === 0) {
          setError('No leads assigned to you');
        }
      })
      .catch((error) => {
        console.error('Error fetching leads:', error);
        setError(`Failed to fetch leads: ${error.message}. Using mock data.`);
        const mockLeads: Lead[] = [
          {
            id: 7,
            name: 'KOMALI',
            remarks: null,
            status: 'new',
            email: 'komalivarmakokkiligadda@gmail.com',
            lastUpdated: '2025-05-24T06:26:42.937+00:00',
            phone: '918000000000',
            assignedTo: 'Prabhathi',
            followUpDate: null,
            interests: null,
            actionStatus: null,
            actionTaken: null,
            industry: null,
            temperature: null,
            whatsappSent: false,
            emailSent: false,
            quotationSent: false,
            sampleWorkSent: false,
          },
        ];
        const bdaLeads = mockLeads.filter(
          (lead) => lead.assignedTo?.trim().toLowerCase() === user.name?.trim().toLowerCase()
        );
        setLeads(bdaLeads);
      });
  }, [user]);

  // Handle sorting
  const handleSort = (key: keyof Lead) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };

  // Handle card filter click
  const handleCardFilter = (filter: 'today' | 'today' | 'overdue' | 'closed' | 'all') => {
    setActiveCardFilter(filter);
  };

  // Handle opening lead modal
  const handleOpenLeadModal = (lead: Lead) => {
    console.log('Opening modal for lead:', lead);
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  // Update lead via API
  const handleUpdateLead = async (updatedLead: Lead) => {
    try {
      console.log('Updating lead:', updatedLead);
      const response = await fetch(`http://localhost:8080/api/leads/update/${updatedLead.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Uncomment if authentication is required
          // 'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          id: updatedLead.id,
          name: updatedLead.name,
          remarks: updatedLead.remarks,
          status: updatedLead.status,
          email: updatedLead.email,
          lastUpdated: new Date().toISOString(),
          contactNo: updatedLead.phone,
          assignedTo: updatedLead.assignedTo,
          followUp: updatedLead.followUpDate,
          intrests: updatedLead.interests,
          actionStatus: updatedLead.actionStatus,
          actionTaken: updatedLead.actionTaken,
          temperature: updatedLead.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const updatedLeads = leads.map((lead) =>
        lead.id === updatedLead.id ? { ...updatedLead, lastUpdated: new Date().toISOString() } : lead
      );
      setLeads(updatedLeads);
      setIsModalOpen(false);
      setSelectedLead(null);
      toast.success('Lead updated successfully');
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead. Please try again.');
    }
  };

  // Filter and sort leads
  const filteredLeads = leads
    .filter((lead) => {
      const matchesSearch =
        (lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (lead.phone?.includes(searchTerm) || false);

      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesTemperature = temperatureFilter === 'all' || lead.temperature === temperatureFilter;

      let matchesCardFilter = true;
      if (activeCardFilter === 'today') {
        matchesCardFilter = lead.followUpDate ? isToday(new Date(lead.followUpDate)) : false;
      } else if (activeCardFilter === 'overdue') {
        matchesCardFilter = lead.followUpDate
          ? isBefore(new Date(lead.followUpDate), new Date()) && !isToday(new Date(lead.followUpDate))
          : false;
      } else if (activeCardFilter === 'closed') {
        matchesCardFilter = lead.status === 'closed_won';
      }

      return matchesSearch && matchesStatus && matchesTemperature && matchesCardFilter;
    })
    .sort((a, b) => {
      // If the user has selected a custom sort field, apply that sorting
      if (sortBy) {
        let valueA = a[sortBy];
        let valueB = b[sortBy];

        if (valueA === null) valueA = '';
        if (valueB === null) valueB = '';

        if (typeof valueA === 'string' && (sortBy === 'lastUpdated' || sortBy === 'followUpDate')) {
          return sortDirection === 'asc'
            ? new Date(valueA).getTime() - new Date(valueB as string).getTime()
            : new Date(valueB as string).getTime() - new Date(valueA).getTime();
        }

        if (typeof valueA === 'string') {
          return sortDirection === 'asc'
            ? valueA.localeCompare(valueB as string)
            : (valueB as string).localeCompare(valueA);
        }

        return 0;
      }

      // Default sorting: sort by lastUpdated in ascending order (oldest first)
      const dateA = new Date(a.lastUpdated).getTime();
      const dateB = new Date(b.lastUpdated).getTime();
      return dateA - dateB; // Ascending order: newly updated leads go to the bottom
    });

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
  const getTemperatureBadgeClass = (temperature: string | null | undefined) => {
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

  // Recent activity
  const recentActivity = leads
    .filter((lead) => lead.lastUpdated)
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    .slice(0, 5)
    .map((lead) => ({
      performedBy: user?.name || 'BDA',
      action: `updated lead status to ${lead.status}`,
      leadName: lead.name || 'Unknown',
      timestamp: lead.lastUpdated,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">My Dashboard</h1>
        <p className="text-slate-500 mt-1">Track and manage your assigned leads</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        {/* Search & Filter Button */}
        <div className="flex flex-col md:flex-row md:items-center md:space-x-3 space-y-3 md:space-y-0">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border border-slate-300 pl-10 pr-3 py-2 text-sm placeholder-slate-400 
                       focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Compact Filter Button */}
          <div>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="inline-flex items-center px-2 py-1.5 text-sm font-medium rounded-md 
                       bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filter
              {filtersOpen ? (
                <ChevronUp className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
              )}
            </button>
          </div>
        </div>

        {/* Filters Dropdown */}
        {filtersOpen && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
                className="block w-full rounded-md border border-slate-300 text-sm shadow-sm 
                         focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
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
              </select>
            </div>

            {/* Temperature Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Temperature</label>
              <select
                value={temperatureFilter}
                onChange={(e) => setTemperatureFilter(e.target.value)}
                className="block w-full rounded-md border border-slate-300 text-sm shadow-sm 
                         focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
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
      </div>

      {/* Follow-up reminders as filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          onClick={() => handleCardFilter('all')}
          className={`border rounded-lg p-4 flex items-center justify-between cursor-pointer ${
            activeCardFilter === 'all' ? 'bg-blue-100 border-blue-300' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center">
            <div className="p-2 bg-slate-100 rounded-full mr-3">
              <Clock className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h3 className="font-medium text-slate-800">All Leads</h3>
              <p className="text-sm text-slate-700">{leads.length} leads</p>
            </div>
          </div>
        </div>
        <div
          onClick={() => handleCardFilter('today')}
          className={`border rounded-lg p-4 flex items-center justify-between cursor-pointer ${
            activeCardFilter === 'today' ? 'bg-amber-100 border-amber-300' : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-full mr-3">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-amber-800">Today's Follow-ups</h3>
              <p className="text-sm text-amber-700">
                {leads.filter((lead) => lead.followUpDate && isToday(new Date(lead.followUpDate))).length} leads
              </p>
            </div>
          </div>
        </div>
        <div
          onClick={() => handleCardFilter('overdue')}
          className={`border rounded-lg p-4 flex items-center justify-between cursor-pointer ${
            activeCardFilter === 'overdue' ? 'bg-red-100 border-red-300' : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-full mr-3">
              <Clock className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-medium text-red-800">Overdue Follow-ups</h3>
              <p className="text-sm text-red-700">
                {leads.filter(
                  (lead) =>
                    lead.followUpDate &&
                    isBefore(new Date(lead.followUpDate), new Date()) &&
                    !isToday(new Date(lead.followUpDate))
                ).length}{' '}
                leads
              </p>
            </div>
          </div>
        </div>
        <div
          onClick={() => handleCardFilter('closed')}
          className={`border rounded-lg p-4 flex items-center justify-between cursor-pointer ${
            activeCardFilter === 'closed' ? 'bg-green-100 border-green-300' : 'bg-green-50 border-green-200'
          }`}
        >
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-full mr-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-800">Closed Deals</h3>
              <p className="text-sm text-green-700">
                {leads.filter((lead) => lead.status === 'closed_won').length} leads
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Leads table */}
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
                  const actionsTaken = [
                    lead.whatsappSent ? 'WhatsApp' : '',
                    lead.emailSent ? 'Email' : '',
                    lead.quotationSent ? 'Quotation' : '',
                    lead.sampleWorkSent ? 'Sample' : '',
                  ]
                    .filter(Boolean)
                    .join(', ') || 'None';
                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => handleOpenLeadModal(lead)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-800">{lead.name || 'Unknown'}</div>
                        <div className="text-sm text-slate-500">{lead.industry || 'Not set'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-800">{lead.phone || 'Not set'}</div>
                        <div className="text-sm text-slate-500">{lead.email || 'Not set'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            lead.status === 'new'
                              ? 'bg-slate-100 text-slate-800'
                              : lead.status === 'contacted'
                              ? 'bg-blue-100 text-blue-800'
                              : lead.status === 'qualified'
                              ? 'bg-purple-100 text-purple-800'
                              : lead.status === 'proposal'
                              ? 'bg-amber-100 text-amber-800'
                              : lead.status === 'negotiation'
                              ? 'bg-orange-100 text-orange-800'
                              : lead.status === 'closed_won'
                              ? 'bg-green-100 text-green-800'
                              : lead.status === 'warm'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {lead.status === 'closed_won'
                            ? 'Won'
                            : lead.status === 'closed_lost'
                            ? 'Lost'
                            : lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.temperature ? (
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getTemperatureBadgeClass(
                              lead.temperature
                            )}`}
                          >
                            {lead.temperature.charAt(0).toUpperCase() + lead.temperature.slice(1)}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-500">Not set</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.followUpDate ? (
                          <div className={`text-sm ${getFollowUpStatusClass(lead.followUpDate)}`}>
                            {format(new Date(lead.followUpDate), 'MMM d, yyyy', { timeZone: 'Asia/Kolkata' })}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500">Not scheduled</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-800">{actionsTaken}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-medium text-slate-800">Recent Activity</h2>
          <div className="text-sm text-blue-600 hover:text-blue-500 cursor-pointer">View all</div>
        </div>
        <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
          {recentActivity.length === 0 ? (
            <div className="px-6 py-4 text-center text-sm text-slate-500">No recent activity</div>
          ) : (
            recentActivity.map((activity, index) => (
              <div key={index} className="px-6 py-4 flex items-start">
                <div className="mr-4 mt-0.5">
                  <CheckCircle className="h-5 w-5 text-slate-500" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {activity.performedBy}
                        <span className="font-normal text-slate-600"> {activity.action}</span>
                      </p>
                      <p className="text-sm text-slate-600">Lead: {activity.leadName}</p>
                    </div>
                    <div className="text-xs text-slate-500">
                      {format(parseISO(activity.timestamp), 'MMM d, h:mm a', { timeZone: 'Asia/Kolkata' })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Lead Modal */}
      {selectedLead && (
        <LeadModal
          isOpen={isModalOpen}
          onClose={() => {
            console.log('Closing modal');
            setIsModalOpen(false);
            setSelectedLead(null);
          }}
          lead={selectedLead}
          onSave={handleUpdateLead}
          readOnly={false}
        />
      )}
    </div>
  );
};
export default BdaDashboard;