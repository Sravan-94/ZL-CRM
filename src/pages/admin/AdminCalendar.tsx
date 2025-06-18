import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, isToday, isSameDay, isSameMonth, isBefore, parseISO } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import LeadModal from '../../components/leads/LeadModal';
import { toast } from 'react-hot-toast';
import 'react-day-picker/dist/style.css';
import { Lead, LeadStatus } from '../../types/lead';

const AdminCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filteredBda, setFilteredBda] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch leads from API
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch('https://crm.infororg.com/api/leads/getall');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        
        const formattedLeads: Lead[] = data.map((lead: any) => ({
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
          whatsappSent: lead.actionTaken?.includes('whatsapp') || false,
          emailSent: lead.actionTaken?.includes('email') || false,
          quotationSent: lead.actionTaken?.includes('quotation') || false,
          sampleWorkSent: lead.actionTaken?.includes('sample') || false,
        }));
        
        setLeads(formattedLeads);
      } catch (error) {
        console.error('Error fetching leads:', error);
        toast.error('Failed to fetch leads');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeads();
  }, []);
  
  const bdaUsers = leads
    .map(lead => lead.assignedBdaName)
    .filter((name, index, self) => name && self.indexOf(name) === index) as string[];
  
  // Get events for selected date
  const getEventsForSelectedDate = () => {
    console.log('Selected date:', selectedDate);
    const events = leads
      .filter(lead => {
        console.log('Lead followUpDate:', lead.followUpDate);
        return lead.followUpDate && isSameDay(parseISO(lead.followUpDate), selectedDate);
      })
      .filter(lead => {
        if (filteredBda === 'all') return true;
        return lead.assignedBdaName === filteredBda;
      })
      .map(lead => ({
        id: lead.id,
        title: lead.name || 'Unknown Lead',
        date: parseISO(lead.followUpDate!),
        status: isBefore(parseISO(lead.followUpDate!), new Date()) ? 'overdue' : 'upcoming',
        leadId: lead.id,
      }));
    console.log('Filtered events:', events);
    return events;
  };
  
  const selectedDateEvents = getEventsForSelectedDate();
  
  // Handle opening lead modal
  const handleOpenLeadModal = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setSelectedLead(lead);
      setIsModalOpen(true);
    }
  };
  
  // Navigate to next/previous day
  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };
  
  // Custom day renderer for calendar
  const renderDay = (day: Date) => {
    const dayEvents = leads
      .filter(lead => lead.followUpDate && isSameDay(parseISO(lead.followUpDate), day))
      .filter(lead => {
        if (filteredBda === 'all') return true;
        return lead.assignedBdaName === filteredBda;
      });
    
    const hasPastEvents = dayEvents.some(lead => isBefore(parseISO(lead.followUpDate!), new Date()));
    const hasTodayEvents = dayEvents.some(lead => isToday(parseISO(lead.followUpDate!)));
    const hasUpcomingEvents = dayEvents.some(lead => !isBefore(parseISO(lead.followUpDate!), new Date()) && !isToday(parseISO(lead.followUpDate!)));
    
    const eventIndicatorColor = hasPastEvents 
      ? 'bg-red-500' 
      : hasTodayEvents 
        ? 'bg-amber-500' 
        : hasUpcomingEvents 
          ? 'bg-green-500' 
          : '';
    
    // Only show indicator if there are events
    return (
      <div className="relative">
        <div>{format(day, 'd')}</div>
        {dayEvents.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-center">
            <div className={`h-1.5 w-1.5 rounded-full ${eventIndicatorColor}`}></div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading calendar data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <h1 className="text-2xl font-semibold text-slate-800">Follow-up Calendar</h1>
        
        <select
          value={filteredBda}
          onChange={(e) => setFilteredBda(e.target.value)}
          className="block w-full md:w-48 rounded-md border-slate-300 shadow-sm 
                   focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
        >
          <option value="all">All BDAs</option>
          {bdaUsers.map((name, index) => (
            <option key={index} value={name}>{name}</option>
          ))}
        </select>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 lg:col-span-1">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              console.log('Date selected:', date);
              if (date) setSelectedDate(date);
            }}
            showOutsideDays
            className="w-full"
            components={{
              Day: ({ date, displayMonth }) => {
                if (!isSameMonth(date, displayMonth)) {
                  return (
                    <div 
                      className="text-slate-300 cursor-pointer hover:bg-slate-100 rounded-lg"
                      onClick={() => setSelectedDate(date)}
                    >
                      {format(date, 'd')}
                    </div>
                  );
                }
                return (
                  <div 
                    className="cursor-pointer hover:bg-slate-100 rounded-lg"
                    onClick={() => setSelectedDate(date)}
                  >
                    {renderDay(date)}
                  </div>
                );
              }
            }}
            modifiersClassNames={{
              selected: 'bg-blue-500 text-white rounded-lg',
              today: 'bg-amber-100 text-slate-900 rounded-lg',
            }}
            styles={{
              day: {
                margin: '2px',
                width: '36px',
                height: '36px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0.375rem',
              },
              caption_label: {
                fontSize: '1rem',
                fontWeight: 500,
                color: '#1e293b',
              },
              head_cell: {
                color: '#64748b',
                fontSize: '0.75rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                padding: '0.5rem 0',
              }
            }}
          />
        </div>
        
        {/* Events for selected date */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm lg:col-span-2">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 text-slate-500 mr-2" />
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => navigateDay('prev')}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h3 className="font-medium text-slate-800">
                  {isToday(selectedDate) ? 'Today, ' : ''}{format(selectedDate, 'MMMM d, yyyy')}
                </h3>
                <button
                  onClick={() => navigateDay('next')}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="text-sm text-slate-500">
              {selectedDateEvents.length} follow-ups
            </div>
          </div>
          
          <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
            {selectedDateEvents.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="text-slate-400 mb-2">
                  <CalendarIcon className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-1">No follow-ups scheduled</h3>
                <p className="text-sm text-slate-500">
                  There are no follow-ups scheduled for this date.
                </p>
              </div>
            ) : (
              selectedDateEvents.map((event) => {
                const lead = leads.find(l => l.id === event.leadId);
                
                if (!lead) return null;
                
                return (
                  <div 
                    key={event.id}
                    className="px-6 py-4 hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleOpenLeadModal(event.leadId)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex">
                        <div 
                          className={`mr-3 mt-1 w-3 h-3 rounded-full flex-shrink-0 ${
                            event.status === 'overdue' ? 'bg-red-500' :
                            event.status === 'today' ? 'bg-amber-500' :
                            'bg-green-500'
                          }`}
                        ></div>
                        <div>
                          <div className="text-sm font-medium text-slate-800">{lead.name}</div>
                          <div className="text-sm text-slate-500">
                            Assigned to: {lead.assignedBdaName || 'Unassigned'}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {lead.phone} • {lead.email}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          event.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          event.status === 'today' ? 'bg-amber-100 text-amber-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                        
                        <span className={`text-xs mt-1 ${
                          lead.status === 'new' ? 'text-slate-600' :
                          lead.status === 'contacted' ? 'text-blue-600' :
                          lead.status === 'qualified' ? 'text-purple-600' :
                          lead.status === 'proposal' ? 'text-amber-600' :
                          lead.status === 'negotiation' ? 'text-orange-600' :
                          lead.status === 'closed_won' ? 'text-green-600' :
                          'text-red-600'
                        }`}>
                          {lead.status.charAt(0).toUpperCase() + lead.status.slice(1).replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    
                    {lead.remarks && (
                      <div className="mt-2 text-sm text-slate-600 pl-6 border-l-2 border-slate-200">
                        {lead.remarks.length > 100 ? lead.remarks.substring(0, 100) + '...' : lead.remarks}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
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
          onSave={async (updatedLead) => {
            try {
              const response = await fetch(`https://crm.infororg.com/api/leads/update/${updatedLead.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: updatedLead.name,
                  contactNo: updatedLead.phone,
                  email: updatedLead.email,
                  status: updatedLead.status,
                  actionStatus: updatedLead.actionStatus,
                  assignedTo: updatedLead.assignedBdaName,
                  intrests: updatedLead.intrests,
                  remarks: updatedLead.remarks,
                  actionTaken: updatedLead.actionTaken,
                  followUp: updatedLead.followUpDate,
                }),
              });

              if (!response.ok) {
                throw new Error('Failed to update lead');
              }

              // Refresh leads after update
              const leadsResponse = await fetch('https://crm.infororg.com/api/leads/getall');
              if (!leadsResponse.ok) throw new Error('Failed to fetch updated leads');
              const data = await leadsResponse.json();
              
              const formattedLeads: Lead[] = data.map((lead: any) => ({
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
                whatsappSent: lead.actionTaken?.includes('whatsapp') || false,
                emailSent: lead.actionTaken?.includes('email') || false,
                quotationSent: lead.actionTaken?.includes('quotation') || false,
                sampleWorkSent: lead.actionTaken?.includes('sample') || false,
              }));
              
              setLeads(formattedLeads);
              setIsModalOpen(false);
              setSelectedLead(null);
              toast.success('Lead updated successfully');
              return true;
            } catch (error) {
              console.error('Error updating lead:', error);
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

export default AdminCalendar;