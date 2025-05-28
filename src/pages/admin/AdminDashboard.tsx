import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Calendar, PhoneCall, ClipboardCheck, FileText, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

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

  // Fetch leads and users from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch leads
        const leadsResponse = await fetch('http://localhost:8080/api/leads/getall');
        if (!leadsResponse.ok) throw new Error(`Failed to fetch leads: ${leadsResponse.status}`);
        const leadsData = await leadsResponse.json();
        setLeads(leadsData);

        // Fetch users
        const usersResponse = await fetch('http://localhost:8080/api/bda-users');
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

  // Get recent leads using useMemo
  const recentLeads = useMemo(() => {
    return [...leads]
      .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [leads]);

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

      {/* Recent Leads */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-medium text-slate-800">Recent Leads</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {recentLeads.map((lead) => (
            <div key={lead.id} className="px-6 py-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium text-slate-800">{lead.name}</div>
                  <div className="text-xs text-slate-500">{lead.email}</div>
                </div>
                <div className="text-sm text-slate-500">
                  {lead.updatedAt ? format(new Date(lead.updatedAt), 'MMM d, yyyy h:mm a') : 'No date'}
                </div>
              </div>
              <div className="mt-2 flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  lead.status === 'new' ? 'bg-slate-100 text-slate-800' :
                  lead.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                  lead.status === 'qualified' ? 'bg-purple-100 text-purple-800' :
                  lead.status === 'proposal' ? 'bg-amber-100 text-amber-800' :
                  lead.status === 'negotiation' ? 'bg-orange-100 text-orange-800' :
                  lead.status === 'closed_won' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {lead.status.charAt(0).toUpperCase() + lead.status.slice(1).replace('_', ' ')}
                </span>
                {lead.assignedTo && (
                  <span className="text-xs text-slate-500">
                    Assigned to: {lead.assignedTo}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;