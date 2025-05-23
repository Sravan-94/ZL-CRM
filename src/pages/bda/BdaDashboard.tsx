import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, Circle, Info, PhoneCall, Mail, FileText, FileCheck } from 'lucide-react';
import { mockLeads, generateCalendarEvents } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';
import { format, parseISO, isSameDay } from 'date-fns';
import { Lead, LeadStatus } from '../../types';

const BdaDashboard = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [calendarEvents, setCalendarEvents] = useState(generateCalendarEvents(user?.id));
  
  // Initialize leads based on BDA assignment
  useEffect(() => {
    if (user) {
      const bdaLeads = mockLeads.filter(lead => lead.assignedBdaId === user.id);
      setLeads(bdaLeads);
    }
  }, [user]);
  
  // Calculate metrics based on actual leads data
  const calculateMetrics = () => {
    const totalLeads = leads.length;
    const newLeads = leads.filter(lead => lead.status === 'new').length;
    const todayFollowUps = calendarEvents.filter(event => event.status === 'today').length;
    const overdueFollowUps = calendarEvents.filter(event => event.status === 'overdue').length;
    
    // Calculate status distribution
    const statusCounts = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<LeadStatus, number>);
    
    // Calculate action metrics
    const whatsappSent = leads.filter(lead => lead.whatsappSent).length;
    const emailSent = leads.filter(lead => lead.emailSent).length;
    const quotationSent = leads.filter(lead => lead.quotationSent).length;
    const sampleWorkSent = leads.filter(lead => lead.sampleWorkSent).length;
    
    return {
      totalLeads,
      newLeads,
      todayFollowUps,
      overdueFollowUps,
      statusCounts,
      whatsappSent,
      emailSent,
      quotationSent,
      sampleWorkSent
    };
  };
  
  const metrics = calculateMetrics();
  
  // Get today's follow-ups
  const todayEvents = calendarEvents.filter(event => event.status === 'today');
  
  // Calculate status distribution percentages
  const statusPercentages = (() => {
    const total = Object.values(metrics.statusCounts).reduce((sum, count) => sum + count, 0);
    if (total === 0) return {};
    
    return Object.entries(metrics.statusCounts).reduce((acc, [status, count]) => {
      acc[status] = Math.round((count / total) * 100);
      return acc;
    }, {} as Record<string, number>);
  })();
  
  // Statistics cards data
  const statsCards = [
    { 
      title: 'Total Leads', 
      value: metrics.totalLeads, 
      icon: CheckCircle2, 
      color: 'bg-blue-500',
      description: 'Assigned to you' 
    },
    { 
      title: 'Today\'s Follow-ups', 
      value: metrics.todayFollowUps, 
      icon: Calendar, 
      color: 'bg-amber-500',
      description: 'Due today' 
    },
    { 
      title: 'Overdue Follow-ups', 
      value: metrics.overdueFollowUps, 
      icon: Clock, 
      color: 'bg-red-500',
      description: 'Need immediate attention' 
    },
    { 
      title: 'New Leads', 
      value: metrics.newLeads, 
      icon: Circle, 
      color: 'bg-green-500',
      description: 'Not contacted yet' 
    },
  ];

  // Get recent activities
  const getRecentActivities = () => {
    return leads
      .filter(lead => lead.updatedAt)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10)
      .map(lead => ({
        leadName: lead.name,
        action: determineLastAction(lead),
        timestamp: lead.updatedAt
      }));
  };
  
  // Helper to determine the most recent action
  const determineLastAction = (lead: Lead) => {
    if (lead.quotationSent) return 'Sent quotation';
    if (lead.sampleWorkSent) return 'Sent sample work';
    if (lead.emailSent) return 'Sent email';
    if (lead.whatsappSent) return 'Sent WhatsApp message';
    return 'Updated lead status';
  };
  
  const recentActivities = getRecentActivities();

  return (
    <div className="space-y-6">
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
        {/* Status overview */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 lg:col-span-1">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-medium text-slate-800">Lead Status Overview</h2>
          </div>
          <div className="p-6 space-y-4">
            {Object.entries(statusPercentages).map(([status, percentage]) => {
              const getStatusColor = (status: string) => {
                switch(status) {
                  case 'new': return 'bg-slate-500';
                  case 'contacted': return 'bg-blue-500';
                  case 'qualified': return 'bg-purple-500';
                  case 'proposal': return 'bg-amber-500';
                  case 'negotiation': return 'bg-orange-500';
                  case 'closed_won': return 'bg-green-500';
                  case 'closed_lost': return 'bg-red-500';
                  default: return 'bg-slate-300';
                }
              };
              
              const getStatusLabel = (status: string) => {
                switch(status) {
                  case 'closed_won': return 'Won';
                  case 'closed_lost': return 'Lost';
                  default: return status.charAt(0).toUpperCase() + status.slice(1);
                }
              };
              
              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-slate-800">
                      {getStatusLabel(status)}
                    </div>
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
        
        {/* Today's follow-ups */}
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
                <p className="text-sm text-slate-500">
                  Check the calendar for upcoming follow-ups.
                </p>
              </div>
            ) : (
              todayEvents.map((event) => (
                <div key={event.id} className="px-6 py-4 hover:bg-slate-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{event.title}</div>
                      <div className="text-xs text-amber-600 font-medium">Due today</div>
                    </div>
                    <div className="text-sm text-slate-500">
                      {format(event.date, 'h:mm a')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Recent activity */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-medium text-slate-800">Recent Activity</h2>
        </div>
        <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
          {recentActivities.length === 0 ? (
            <div className="px-6 py-4 text-center text-sm text-slate-500">
              No recent activity
            </div>
          ) : (
            recentActivities.map((activity, index) => (
              <div key={index} className="px-6 py-4 flex items-start">
                <div className="mr-4 mt-0.5">
                  {activity.action.includes('quotation') ? (
                    <FileText className="h-5 w-5 text-amber-500" />
                  ) : activity.action.includes('sample') ? (
                    <FileCheck className="h-5 w-5 text-purple-500" />
                  ) : activity.action.includes('email') ? (
                    <Mail className="h-5 w-5 text-blue-500" />
                  ) : activity.action.includes('WhatsApp') ? (
                    <PhoneCall className="h-5 w-5 text-green-500" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-slate-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-slate-800">
                      <span className="font-medium">{activity.leadName}</span>
                      <span className="text-slate-600"> - {activity.action}</span>
                    </p>
                    <div className="text-xs text-slate-500">
                      {format(parseISO(activity.timestamp), 'MMM d, h:mm a')}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BdaDashboard;