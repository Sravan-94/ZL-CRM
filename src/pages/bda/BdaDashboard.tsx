import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, Circle, Info } from 'lucide-react';
import { generateCalendarEvents } from '../../data/mockData'; // Removed mockLeads since we use API
import { useAuth } from '../../contexts/AuthContext';
import { format, parseISO, isToday } from 'date-fns';

// Lead type based on provided data structure
interface Lead {
  id: number;
  name: string | null;
  remarks: string | null;
  status: string;
  email: string | null;
  lastUpdated: string;
  contactNo: string | null;
  assignedTo: string | null;
  followUp: string | null;
  intrests: string | null;
  actionStatus: string | null;
  actionTaken: string | null;
}

const BdaDashboard = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [calendarEvents, setCalendarEvents] = useState(generateCalendarEvents(user?.id));
  const [error, setError] = useState<string | null>(null); // Added for error handling

  // Fetch leads from API and filter based on user
  useEffect(() => {
    if (user) {
      console.log('Logged-in user:', { id: user.id, name: user.name }); // Debug user object
      fetch('http://localhost:8080/api/leads/getall')
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((data: Lead[]) => {
          const bdaLeads = data.filter((lead) => {
            if (!lead.assignedTo) return false;
            const assignedTo = lead.assignedTo.trim().toLowerCase();
            const userId = user.id?.toString().trim().toLowerCase();
            const userName = user.name?.trim().toLowerCase();
            const match = assignedTo === userId || assignedTo === userName;
            console.log(`Lead ID ${lead.id}: assignedTo=${assignedTo}, match=${match}`); // Debug each lead
            return match;
          });
          console.log('Filtered leads:', bdaLeads); // Debug filtered leads
          setLeads(bdaLeads);
          
          // Generate calendar events from actual leads
          const events = bdaLeads
            .filter(lead => lead.followUp)
            .map(lead => {
              const followUpDate = lead.followUp ? new Date(lead.followUp) : null;
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
        })
        .catch((error) => {
          console.error('Error fetching leads:', error);
          setError('Failed to fetch leads. Please try again later.');
          setLeads([]); // Clear leads on error
        });
    }
  }, [user]);

  // Calculate metrics based on actual leads data
  const calculateMetrics = () => {
    const totalLeads = leads.length;
    const newLeads = leads.filter((lead) => lead.status === 'new').length;
    const todayFollowUps = calendarEvents.filter((event) => event.status === 'today').length;
    const overdueFollowUps = calendarEvents.filter((event) => event.status === 'overdue').length;

    const statusCounts = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const whatsappSent = leads.filter((lead) => lead.actionTaken?.includes('whatsapp')).length;
    const emailSent = leads.filter((lead) => lead.actionTaken?.includes('email')).length;
    const quotationSent = leads.filter((lead) => lead.actionTaken?.includes('quotation')).length;
    const sampleWorkSent = leads.filter((lead) => lead.actionTaken?.includes('sample')).length;

    return {
      totalLeads,
      newLeads,
      todayFollowUps,
      overdueFollowUps,
      statusCounts,
      whatsappSent,
      emailSent,
      quotationSent,
      sampleWorkSent,
    };
  };

  const metrics = calculateMetrics();

  const todayEvents = calendarEvents.filter((event) => event.status === 'today');

  const statusPercentages = (() => {
    const total = Object.values(metrics.statusCounts).reduce((sum, count) => sum + count, 0);
    if (total === 0) return {};

    return Object.entries(metrics.statusCounts).reduce((acc, [status, count]) => {
      acc[status] = Math.round((count / total) * 100);
      return acc;
    }, {} as Record<string, number>);
  })();

  const statsCards = [
    {
      title: 'Total Leads',
      value: metrics.totalLeads,
      icon: CheckCircle2,
      color: 'bg-blue-500',
      description: 'Assigned to you',
    },
    {
      title: "Today's Follow-ups",
      value: metrics.todayFollowUps,
      icon: Calendar,
      color: 'bg-amber-500',
      description: 'Due today',
    },
    {
      title: 'Overdue Follow-ups',
      value: metrics.overdueFollowUps,
      icon: Clock,
      color: 'bg-red-500',
      description: 'Need immediate attention',
    },
    {
      title: 'New Leads',
      value: metrics.newLeads,
      icon: Circle,
      color: 'bg-green-500',
      description: 'Not contacted yet',
    },
  ];

  const getRecentActivities = () => {
    return leads
      .filter((lead) => lead.lastUpdated)
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, 10)
      .map((lead) => ({
        leadName: lead.name || 'Unknown Lead',
        action: determineLastAction(lead),
        timestamp: lead.lastUpdated,
      }));
  };

  const determineLastAction = (lead: Lead) => {
    if (lead.actionTaken?.includes('quotation')) return 'Sent quotation';
    if (lead.actionTaken?.includes('sample')) return 'Sent sample work';
    if (lead.actionTaken?.includes('email')) return 'Sent email';
    if (lead.actionTaken?.includes('whatsapp')) return 'Sent WhatsApp message';
    return lead.actionTaken || 'Updated lead status';
  };

  const recentActivities = getRecentActivities();

  return (
    <div className="space-y-6">
      {/* Error message if API fetch fails */}
      {error && (
        <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Welcome message */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Welcome back, {user?.name}</h1>
            <p className="text-slate-500 mt-1">Here's what's happening with your leads today.</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center">
            <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
              <Info className="w-4 h-4 mr-1" />
              {metrics.todayFollowUps} follow-ups today
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm p-6 flex items-start space-x-4 border border-slate-200 hover:shadow-md transition-shadow"
          >
            <div className={`p-3 rounded-full ${card.color}`}>
              <card.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{card.title}</p>
              <p className="text-2xl font-semibold text-slate-800">{card.value}</p>
              <p className="text-xs text-slate-500 mt-1">{card.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Status overview and Today's follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 lg:col-span-1">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-medium text-slate-800">Lead Status Overview</h2>
          </div>
          <div className="p-6 space-y-4">
            {Object.entries(statusPercentages).map(([status, percentage]) => {
              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'new':
                    return 'bg-slate-500';
                  case 'contacted':
                    return 'bg-blue-500';
                  case 'qualified':
                    return 'bg-purple-500';
                  case 'proposal':
                    return 'bg-amber-500';
                  case 'negotiation':
                    return 'bg-orange-500';
                  case 'closed_won':
                    return 'bg-green-500';
                  case 'closed_lost':
                    return 'bg-red-500';
                  case 'warm':
                    return 'bg-yellow-500';
                  default:
                    return 'bg-slate-300';
                }
              };

              const getStatusLabel = (status: string) => {
                switch (status) {
                  case 'closed_won':
                    return 'Won';
                  case 'closed_lost':
                    return 'Lost';
                  default:
                    return status.charAt(0).toUpperCase() + status.slice(1);
                }
              };

              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-slate-800">{getStatusLabel(status)}</div>
                    <div className="text-sm text-slate-500">{percentage}%</div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full">
                    <div
                      className={`h-full rounded-full ${getStatusColor(status)}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}

            <hr className="border-slate-200" />

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-800">Communication Status</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span>WhatsApp Sent</span>
                </div>
                <div className="text-sm font-medium">{metrics.whatsappSent}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span>Email Sent</span>
                </div>
                <div className="text-sm font-medium">{metrics.emailSent}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm">
                  <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                  <span>Quotation Sent</span>
                </div>
                <div className="text-sm font-medium">{metrics.quotationSent}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm">
                  <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                  <span>Sample Work Sent</span>
                </div>
                <div className="text-sm font-medium">{metrics.sampleWorkSent}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 lg:col-span-2">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-medium text-slate-800">Today's Follow-ups</h2>
          </div>
          <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
            {todayEvents.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="text-slate-400 mb-2">
                  <Calendar className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-1">No follow-ups for today</h3>
                <p className="text-sm text-slate-500">Check the calendar for upcoming follow-ups.</p>
              </div>
            ) : (
              todayEvents.map((event) => (
                <div key={event.id} className="px-6 py-4 hover:bg-slate-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{event.title}</div>
                      <div className="text-xs text-amber-600 font-medium">Due today</div>
                    </div>
                    <div className="text-sm text-slate-500">{format(event.date, 'h:mm a')}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-medium text-slate-800">Recent Activity</h2>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {recentActivities.length === 0 ? (
            <div className="px-6 py-4 text-center text-sm text-slate-500">No recent activity</div>
          ) : (
            <table className="w-full text-sm text-left text-slate-800">
              <thead className="text-xs uppercase text-slate-500 bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Assigned To</th>
                  <th className="px-6 py-3">Follow-up</th>
                  <th className="px-6 py-3">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.map((activity, index) => {
                  // Find the corresponding lead to get full details
                  const lead = leads.find((l) => l.name === activity.leadName);
                  if (!lead) return null; // Skip if lead not found

                  // Format contact number by removing the "+" if present
                  const contactNo = lead.contactNo?.startsWith('+')
                    ? lead.contactNo.slice(1)
                    : lead.contactNo;

                  // Format the last updated timestamp
                  const lastUpdated = format(parseISO(lead.lastUpdated), 'MMM d, h:mm a');

                  // Capitalize status and handle special cases
                  const getStatusLabel = (status: string) => {
                    if (status === 'closed_won') return 'Won';
                    if (status === 'closed_lost') return 'Lost';
                    return status.charAt(0).toUpperCase() + status.slice(1);
                  };

                  // Determine status color
                  const getStatusColor = (status: string) => {
                    switch (status.toLowerCase()) {
                      case 'contacted':
                        return 'bg-blue-100 text-blue-800';
                      case 'qualified':
                        return 'bg-purple-100 text-purple-800';
                      case 'new':
                        return 'bg-gray-100 text-gray-800';
                      default:
                        return 'bg-gray-100 text-gray-800';
                    }
                  };

                  return (
                    <tr key={index} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium">{lead.name || 'Unknown Lead'}</td>
                      <td className="px-6 py-4">
                        <div>{contactNo || '-'}</div>
                        <div className="text-xs text-slate-500">{lead.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}
                        >
                          {getStatusLabel(lead.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">{lead.assignedTo || '-'}</td>
                      <td className="px-6 py-4">{lead.followUp || 'Not scheduled'}</td>
                      <td className="px-6 py-4">{lastUpdated}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default BdaDashboard;