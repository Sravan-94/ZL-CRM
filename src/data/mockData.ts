import { User, Lead, DashboardMetrics, ActivityItem, BDAPerformance, CalendarEvent, LeadStatus } from '../types';
import { format, subDays, addDays, isBefore, isToday, isAfter } from 'date-fns';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
  },
  {
    id: 'bda-1',
    name: 'John Smith',
    email: 'john@example.com',
    role: 'bda',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
  },
  {
    id: 'bda-2',
    name: 'Sarah Lee',
    email: 'sarah@example.com',
    role: 'bda',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
  },
];

// Helper to generate random dates within a range
const getRandomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Generate mock leads
export const generateMockLeads = (): Lead[] => {
  const industries = ['Technology', 'Healthcare', 'Education', 'Finance', 'Retail', 'Manufacturing'];
  const services = ['Consulting', 'Development', 'Support', 'Training', 'Maintenance'];
  const types = ['New Business', 'Existing Client', 'Referral', 'Cold Lead'];
  const statuses: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
  
  const leads: Lead[] = [];
  
  // Generate 50 mock leads
  for (let i = 1; i <= 50; i++) {
    const assignBda = Math.random() > 0.3; // 70% of leads are assigned
    const bdaId = Math.random() > 0.5 ? 'bda-1' : 'bda-2';
    const bdaName = bdaId === 'bda-1' ? 'John Smith' : 'Sarah Lee';
    
    const createdDate = getRandomDate(subDays(new Date(), 30), new Date());
    const updatedDate = getRandomDate(createdDate, new Date());
    
    // Create followup date (some in past, some today, some in future)
    let followUpDate = null;
    if (Math.random() > 0.2) { // 80% have followup dates
      const daysOffset = Math.floor(Math.random() * 14) - 7; // -7 to +7 days
      followUpDate = format(addDays(new Date(), daysOffset), 'yyyy-MM-dd');
    }
    
    leads.push({
      id: `lead-${i}`,
      name: `Lead ${i}`,
      phone: `+1555${Math.floor(1000000 + Math.random() * 9000000)}`,
      email: `lead${i}@example.com`,
      industry: industries[Math.floor(Math.random() * industries.length)],
      service: services[Math.floor(Math.random() * services.length)],
      type: types[Math.floor(Math.random() * types.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      assignedBdaId: assignBda ? bdaId : null,
      assignedBdaName: assignBda ? bdaName : null,
      followUpDate,
      temperature: Math.random() > 0.7 ? 'hot' : Math.random() > 0.5 ? 'warm' : 'cold',
      interests: Math.random() > 0.5 ? ['website'] : Math.random() > 0.5 ? ['app'] : Math.random() > 0.5 ? ['crm'] : ['both'],
      remarks: Math.random() > 0.5 ? 'Interested in our services. Following up next week.' : 'Needs more information about pricing.',
      whatsappSent: Math.random() > 0.5,
      emailSent: Math.random() > 0.6,
      quotationSent: Math.random() > 0.7,
      sampleWorkSent: Math.random() > 0.8,
      createdAt: format(createdDate, 'yyyy-MM-dd\'T\'HH:mm:ss'),
      updatedAt: format(updatedDate, 'yyyy-MM-dd\'T\'HH:mm:ss'),
    });
  }
  
  return leads;
};

// Initialize mock leads
export const mockLeads = generateMockLeads();

// Generate activity items based on leads
export const generateMockActivity = (): ActivityItem[] => {
  const actions = [
    'Created new lead',
    'Updated lead status',
    'Scheduled follow-up',
    'Sent quotation',
    'Sent sample work',
    'Added remarks',
    'Changed lead temperature',
    'Marked as contacted'
  ];
  
  const activities: ActivityItem[] = [];
  
  mockLeads.slice(0, 20).forEach((lead, index) => {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const performedBy = lead.assignedBdaName || 'Admin User';
    const performedById = lead.assignedBdaId || 'admin-1';
    
    activities.push({
      id: `activity-${index + 1}`,
      leadId: lead.id,
      leadName: lead.name,
      action,
      performedBy,
      performedById,
      timestamp: lead.updatedAt,
    });
  });
  
  // Sort by timestamp descending
  return activities.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

// Mock activity data
export const mockActivities = generateMockActivity();

// Generate dashboard metrics
export const generateMockDashboardMetrics = (userId?: string): DashboardMetrics => {
  // Filter leads if userId is provided (for BDA dashboard)
  const filteredLeads = userId 
    ? mockLeads.filter(lead => lead.assignedBdaId === userId)
    : mockLeads;
  
  // Calculate status counts
  const leadsByStatus = filteredLeads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<LeadStatus, number>);
  
  // Filter activities for this user if needed
  const filteredActivities = userId
    ? mockActivities.filter(activity => activity.performedById === userId)
    : mockActivities;
  
  return {
    totalLeads: filteredLeads.length,
    newLeads: filteredLeads.filter(l => l.status === 'new').length,
    followUpsToday: filteredLeads.filter(l => l.followUpDate === format(new Date(), 'yyyy-MM-dd')).length,
    leadsByStatus,
    recentActivity: filteredActivities.slice(0, 10),
  };
};

// Generate BDA performance metrics
export const generateMockBDAPerformance = (): BDAPerformance[] => {
  const bdaUsers = mockUsers.filter(user => user.role === 'bda');
  
  return bdaUsers.map(bda => {
    const bdaLeads = mockLeads.filter(lead => lead.assignedBdaId === bda.id);
    
    return {
      bdaId: bda.id,
      bdaName: bda.name,
      totalLeads: bdaLeads.length,
      totalCalls: Math.floor(bdaLeads.length * 1.5),
      followupsMade: bdaLeads.filter(l => l.status !== 'new').length,
      quotationsSent: bdaLeads.filter(l => l.quotationSent).length,
      dealsClosed: bdaLeads.filter(l => l.status === 'closed_won').length,
    };
  });
};

// Generate calendar events
export const generateCalendarEvents = (userId?: string): CalendarEvent[] => {
  // Filter leads if userId is provided (for BDA calendar)
  const filteredLeads = userId 
    ? mockLeads.filter(lead => lead.assignedBdaId === userId)
    : mockLeads;
  
  // Only include leads with follow-up dates
  const leadsWithFollowups = filteredLeads.filter(lead => lead.followUpDate);
  
  return leadsWithFollowups.map(lead => {
    const followUpDate = new Date(lead.followUpDate as string);
    
    // Determine status based on date
    let status: 'overdue' | 'today' | 'upcoming';
    if (isBefore(followUpDate, new Date()) && !isToday(followUpDate)) {
      status = 'overdue';
    } else if (isToday(followUpDate)) {
      status = 'today';
    } else {
      status = 'upcoming';
    }
    
    return {
      id: lead.id,
      title: lead.name,
      date: followUpDate,
      status,
      leadId: lead.id,
    };
  });
};