import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, isToday, isSameDay, isSameMonth, isBefore, parseISO } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { generateCalendarEvents, mockLeads } from '../../data/mockData';
import LeadModal from '../../components/leads/LeadModal';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import 'react-day-picker/dist/style.css';
import { Lead } from '../../types';

const BdaCalendar = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarEvents, setCalendarEvents] = useState(generateCalendarEvents(user?.id));
  const [leads, setLeads] = useState(mockLeads.filter(lead => lead.assignedBdaId === user?.id));
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Update events when leads change
  useEffect(() => {
    setCalendarEvents(generateCalendarEvents(user?.id));
  }, [leads, user?.id]);
  
  // Get events for selected date
  const getEventsForSelectedDate = () => {
    return calendarEvents.filter(event => isSameDay(event.date, selectedDate));
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
    const dayEvents = calendarEvents.filter(event => isSameDay(event.date, day));
    
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Follow-up Calendar</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Follow-up summary */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="font-medium text-red-800 mb-1">Overdue</div>
            <div className="text-2xl font-semibold text-red-900">
              {calendarEvents.filter(event => event.status === 'overdue').length}
            </div>
            <div className="text-sm text-red-700 mt-1">
              Follow-ups that need immediate attention
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="font-medium text-amber-800 mb-1">Today</div>
            <div className="text-2xl font-semibold text-amber-900">
              {calendarEvents.filter(event => event.status === 'today').length}
            </div>
            <div className="text-sm text-amber-700 mt-1">
              Follow-ups scheduled for today
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="font-medium text-green-800 mb-1">Upcoming</div>
            <div className="text-2xl font-semibold text-green-900">
              {calendarEvents.filter(event => event.status === 'upcoming').length}
            </div>
            <div className="text-sm text-green-700 mt-1">
              Follow-ups scheduled for upcoming days
            </div>
          </div>
        </div>
        
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

export default BdaCalendar;