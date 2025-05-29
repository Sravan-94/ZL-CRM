import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, isToday, isSameDay, isSameMonth, isBefore, parseISO } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import LeadModal from '../../components/leads/LeadModal';
import { toast } from 'react-hot-toast';
import 'react-day-picker/dist/style.css';
import { Lead } from '../../types';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  status: 'overdue' | 'today' | 'upcoming';
  leadId: string;
}

interface User {
  id: string;
  name: string;
  role: string;
}

const AdminCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filteredBda, setFilteredBda] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch leads and users from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch leads
        const leadsResponse = await fetch('http://localhost:8080/api/leads/getall');
        if (!leadsResponse.ok) throw new Error('Failed to fetch leads');
        const leadsData = await leadsResponse.json();
        setLeads(leadsData);
        
        // Fetch users
        const usersResponse = await fetch('http://localhost:8080/api/bda-users');
        if (!usersResponse.ok) throw new Error('Failed to fetch users');
        const usersData = await usersResponse.json();
        setUsers(usersData);
        
        // Generate calendar events from actual leads
        const events = leadsData
          .filter((lead: Lead) => lead.followUpDate)
          .map((lead: Lead) => {
            const followUpDate = lead.followUpDate ? new Date(lead.followUpDate) : null;
            if (!followUpDate) return null;
            
            const now = new Date();
            
            // Determine status based on date
            let status: 'overdue' | 'today' | 'upcoming';
            if (followUpDate < now && !isToday(followUpDate)) {
              status = 'overdue';
            } else if (isToday(followUpDate)) {
              status = 'today';
            } else {
              status = 'upcoming';
            }
            
            return {
              id: lead.id.toString(),
              title: lead.name || 'Unknown Lead',
              date: followUpDate,
              status,
              leadId: lead.id.toString(),
            };
          })
          .filter((event): event is NonNullable<typeof event> => event !== null);
        
        setCalendarEvents(events);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data. Please try again later.');
        setLeads([]);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Get events for selected date
  const getEventsForSelectedDate = () => {
    return calendarEvents
      .filter(event => isSameDay(event.date, selectedDate))
      .filter(event => {
        if (filteredBda === 'all') return true;
        const lead = leads.find(l => l.id === event.leadId);
        return lead?.assignedTo === filteredBda;
      });
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
    const dayEvents = calendarEvents
      .filter(event => isSameDay(event.date, day))
      .filter(event => {
        if (filteredBda === 'all') return true;
        const lead = leads.find(l => l.id === event.leadId);
        return lead?.assignedTo === filteredBda;
      });
    
    const hasPastEvents = dayEvents.some(event => event.status === 'overdue');
    const hasTodayEvents = dayEvents.some(event => event.status === 'today');
    const hasUpcomingEvents = dayEvents.some(event => event.status === 'upcoming');
    
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

  if (error) {
    return (
      <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg">
        {error}
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
          {users
            .filter(user => user.role === 'BDA')
            .map((bda) => (
              <option key={bda.id} value={bda.id}>{bda.name}</option>
            ))}
        </select>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 lg:col-span-1">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            showOutsideDays
            className="w-full"
            components={{
              Day: ({ date, displayMonth }) => {
                if (!isSameMonth(date, displayMonth)) return <div className="text-slate-300">{format(date, 'd')}</div>;
                return renderDay(date);
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
                            Assigned to: {lead.assignedTo || 'Unassigned'}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {lead.phone} • {lead.email}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        {format(event.date, 'h:mm a')}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
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

export default AdminCalendar;