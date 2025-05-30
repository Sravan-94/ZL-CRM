import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Calendar, PhoneCall, ClipboardCheck, FileText, CheckCircle } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  industry: string;
  companyName: string;
  city: string;
  state: string;
  status: string;
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
  assignedTo?: string;
  lastUpdated?: string;
}

interface User {
  id: string;
  name: string;
  role: string;
}

const AdminDashboard = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // New state for date filter
  const [dateFilter, setDateFilter] = useState<{
    startDate: string | null;
    endDate: string | null;
  }>({ startDate: null, endDate: null });

  // Fetch leads and users from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch leads
        const leadsResponse = await fetch('https://crmbackend-lxbe.onrender.com/api/leads/getall');
        if (!leadsResponse.ok) throw new Error(`Failed to fetch leads: ${leadsResponse.status}`);
        const leadsData = await leadsResponse.json();
        setLeads(leadsData);

        // Fetch users
        const usersResponse = await fetch('https://crmbackend-lxbe.onrender.com/api/bda-users');
        if (!usersResponse.ok) throw new Error(`Failed to fetch users: ${usersResponse.status}`);
        const usersData = await usersResponse.json();
        setUsers(usersData);

        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate metrics using useMemo to prevent unnecessary recalculations
  const metrics = useMemo(() => {
    const bdaCount = users.filter(user => user.role === 'BDA').length;
    
    // Count leads that have an assignedTo value
    const assignedLeadsCount = leads.filter(lead => lead.assignedTo).length;
    const unassignedLeadsCount = leads.filter(lead => !lead.assignedTo).length;

    // Calculate leads by status
    const leadsByStatus = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      bdaCount,
      assignedLeadsCount,
      unassignedLeadsCount,
      leadsByStatus
    };
  }, [leads, users]);

  // Transform status data for the chart using useMemo
  const statusData = useMemo(() => {
    const statusMapping: Record<string, { label: string, color: string }> = {
      new: { label: 'New', color: '#94A3B8' },
      contacted: { label: 'Contacted', color: '#60A5FA' },
      qualified: { label: 'Qualified', color: '#C084FC' },
      proposal: { label: 'Proposal', color: '#FBBF24' },
      negotiation: { label: 'Negotiating', color: '#FB923C' },
      closed_won: { label: 'Won', color: '#34D399' },
      closed_lost: { label: 'Lost', color: '#F87171' },
    };
    
    return Object.entries(metrics.leadsByStatus || {}).map(([status, count]) => ({
      name: statusMapping[status]?.label || status,
      count,
      color: statusMapping[status]?.color || '#94A3B8',
    }));
  }, [metrics.leadsByStatus]);

  // Helper function to determine the last action taken on a lead
  const determineLastAction = (lead: Lead) => {
    if (lead.actionTaken?.includes('quotation')) return 'Sent quotation';
    if (lead.actionTaken?.includes('sample')) return 'Sent sample work';
    if (lead.actionTaken?.includes('email')) return 'Sent email';
    if (lead.actionTaken?.includes('whatsapp')) return 'Sent WhatsApp message';
    return lead.actionTaken || 'Updated lead status';
  };

  // Get recent activities using useMemo
  const recentActivities = useMemo(() => {
    console.log('All leads:', leads); // Debug log to see all leads

    const activities = [...leads]
      .filter((lead) => {
        // Check both updatedAt and lastUpdated fields
        const updateTime = lead.lastUpdated || lead.updatedAt;
        const hasUpdateTime = Boolean(updateTime);
        console.log(`Lead ${lead.name}: lastUpdated = ${lead.lastUpdated}, updatedAt = ${lead.updatedAt}, hasUpdateTime = ${hasUpdateTime}`); // Debug log

        // Apply date filter
        if (!hasUpdateTime) return false;
        if (!dateFilter.startDate && !dateFilter.endDate) return true;

        const updateDate = parseISO(updateTime);
        if (!isValid(updateDate)) return false;

        const start = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
        const end = dateFilter.endDate ? new Date(dateFilter.endDate) : null;

        if (start && end) {
          end.setHours(23, 59, 59, 999); // Include entire end date
          return updateDate >= start && updateDate <= end;
        } else if (start) {
          return updateDate >= start;
        } else if (end) {
          end.setHours(23, 59, 59, 999);
          return updateDate <= end;
        }

        return true;
      })
      .sort((a, b) => {
        // Use lastUpdated if available, otherwise fall back to updatedAt
        const dateA = new Date(a.lastUpdated || a.updatedAt).getTime();
        const dateB = new Date(b.lastUpdated || b.updatedAt).getTime();
        console.log(`Comparing dates: ${a.name} (${dateA}) vs ${b.name} (${dateB})`); // Debug log
        return dateB - dateA;
      })
      .slice(0, 10)
      .map((lead) => {
        const activity = {
          leadName: lead.name || 'Unknown Lead',
          action: determineLastAction(lead),
          timestamp: lead.lastUpdated || lead.updatedAt,
          leadId: lead.id,
          status: lead.status,
          assignedTo: lead.assignedTo,
          followUpDate: lead.followUpDate,
          phone: lead.phone,
          email: lead.email
        };
        console.log('Created activity:', activity); // Debug log
        return activity;
      });

    console.log('Final recent activities:', activities); // Debug log
    return activities;
  }, [leads, dateFilter]);

  // Handle date filter changes
  const handleDateFilterChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateFilter(prev => ({
      ...prev,
      [field]: value || null,
    }));
  };

  // Clear date filter
  const clearDateFilter = () => {
    setDateFilter({ startDate: null, endDate: null });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading dashboard data...</div>
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
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 flex items-start space-x-4 border border-slate-200">
          <div className="p-3 rounded-full bg-blue-500">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total BDAs</p>
            <p className="text-2xl font-semibold text-slate-800">{metrics.bdaCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 flex items-start space-x-4 border border-slate-200">
          <div className="p-3 rounded-full bg-green-500">
            <CheckCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Assigned Leads</p>
            <p className="text-2xl font-semibold text-slate-800">{metrics.assignedLeadsCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 flex items-start space-x-4 border border-slate-200">
          <div className="p-3 rounded-full bg-amber-500">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Unassigned Leads</p>
            <p className="text-2xl font-semibold text-slate-800">{metrics.unassignedLeadsCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 flex items-start space-x-4 border border-slate-200">
          <div className="p-3 rounded-full bg-purple-500">
            <PhoneCall className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Leads</p>
            <p className="text-2xl font-semibold text-slate-800">{leads.length}</p>
          </div>
        </div>
      </div>

      {/* BDA Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-medium text-slate-800">BDA Overview</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-500">Total BDAs</div>
            <div className="text-lg font-medium text-slate-800">{metrics.bdaCount}</div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-500">Assigned Leads</div>
            <div className="text-lg font-medium text-slate-800">{metrics.assignedLeadsCount}</div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-500">Unassigned Leads</div>
            <div className="text-lg font-medium text-slate-800">{metrics.unassignedLeadsCount}</div>
          </div>
          
          <hr className="border-slate-200" />
          
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-800">BDA Performance</h3>
            
            {users
              .filter(user => user.role === 'BDA')
              .map(bda => {
                // Filter leads assigned to this BDA by name or ID
                const bdaLeads = leads.filter(lead => 
                  lead.assignedTo?.toLowerCase() === bda.name.toLowerCase() ||
                  lead.assignedTo?.toString() === bda.id.toString()
                );
                const closedLeads = bdaLeads.filter(lead => 
                  lead.status === 'closed_won' || lead.status === 'closed_lost'
                );
                const closedPercentage = bdaLeads.length > 0 
                  ? Math.round((closedLeads.length / bdaLeads.length) * 100) 
                  : 0;
                
                return (
                  <div key={bda.id} className="flex flex-col">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium">{bda.name}</div>
                      <div className="text-sm">{bdaLeads.length} leads</div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full mt-1">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${closedPercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <div>{closedLeads.length} closed</div>
                      <div>{closedPercentage}%</div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-medium text-slate-800">Recent Activity</h2>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-slate-600">From:</label>
              <input
                type="date"
                value={dateFilter.startDate || ''}
                onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
                className="border border-slate-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-slate-600">To:</label>
              <input
                type="date"
                value={dateFilter.endDate || ''}
                onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
                className="border border-slate-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {(dateFilter.startDate || dateFilter.endDate) && (
              <button
                onClick={clearDateFilter}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {recentActivities.length === 0 ? (
            <div className="px-6 py-4 text-center text-sm text-slate-500">
              No recent activity{dateFilter.startDate || dateFilter.endDate ? ' for the selected date range' : ''}
            </div>
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
                  // Use the activity data directly since we're now storing all needed fields
                  const lead = activity;
                  if (!lead) {
                    console.log(`Activity data missing:`, activity); // Debug log
                    return null;
                  }

                  // Format contact number by removing the "+" if present
                  const contactNo = lead.phone?.startsWith('+')
                    ? lead.phone.slice(1)
                    : lead.phone;

                  // Format the last updated timestamp
                  const lastUpdated = format(parseISO(lead.timestamp), 'MMM d, h:mm a');

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
                      <td className="px-6 py-4 font-medium">{lead.leadName}</td>
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
                      <td className="px-6 py-4">{lead.followUpDate || 'Not scheduled'}</td>
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

export default AdminDashboard;