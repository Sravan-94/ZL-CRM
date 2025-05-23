import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Calendar, PhoneCall, ClipboardCheck, FileText, CheckCircle } from 'lucide-react';
import { generateMockDashboardMetrics, mockLeads, mockUsers } from '../../data/mockData';
import { format, parseISO } from 'date-fns';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(generateMockDashboardMetrics());
  const [statusData, setStatusData] = useState<{ name: string; count: number; color: string }[]>([]);
  
  const bdaCount = mockUsers.filter(user => user.role === 'bda').length;
  const assignedLeadsCount = mockLeads.filter(lead => lead.assignedBdaId).length;
  const unassignedLeadsCount = mockLeads.filter(lead => !lead.assignedBdaId).length;
  
  useEffect(() => {
    // Transform status data for the chart
    const statusMapping: Record<string, { label: string, color: string }> = {
      new: { label: 'New', color: '#94A3B8' },
      contacted: { label: 'Contacted', color: '#60A5FA' },
      qualified: { label: 'Qualified', color: '#C084FC' },
      proposal: { label: 'Proposal', color: '#FBBF24' },
      negotiation: { label: 'Negotiating', color: '#FB923C' },
      closed_won: { label: 'Won', color: '#34D399' },
      closed_lost: { label: 'Lost', color: '#F87171' },
    };
    
    const formattedData = Object.entries(metrics.leadsByStatus || {}).map(([status, count]) => ({
      name: statusMapping[status]?.label || status,
      count,
      color: statusMapping[status]?.color || '#94A3B8',
    }));
    
    setStatusData(formattedData);
  }, [metrics]);

  // Simulate data refresh (e.g., websocket or polling)
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(generateMockDashboardMetrics());
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, []);
  
  // Statistics cards data
  const statsCards = [
    { title: 'Total Leads', value: metrics.totalLeads, icon: Users, color: 'bg-blue-500' },
    { title: 'New Leads', value: metrics.newLeads, icon: FileText, color: 'bg-purple-500' },
    { title: 'Follow-ups Today', value: metrics.followUpsToday, icon: Calendar, color: 'bg-amber-500' },
    { title: 'Unassigned Leads', value: unassignedLeadsCount, icon: Users, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, index) => (
          <div 
            key={index}
            className="bg-white rounded-lg shadow-sm p-6 flex items-center space-x-4 border border-slate-200 hover:shadow-md transition-shadow"
          >
            <div className={`p-3 rounded-full ${card.color}`}>
              <card.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{card.title}</p>
              <p className="text-2xl font-semibold text-slate-800">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* BDA overview and Lead status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BDA overview */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 col-span-1">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-medium text-slate-800">BDA Overview</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-slate-500">Total BDAs</div>
              <div className="text-lg font-medium text-slate-800">{bdaCount}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-slate-500">Assigned Leads</div>
              <div className="text-lg font-medium text-slate-800">{assignedLeadsCount}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-slate-500">Unassigned Leads</div>
              <div className="text-lg font-medium text-slate-800">{unassignedLeadsCount}</div>
            </div>
            
            <hr className="border-slate-200" />
            
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-800">BDA Performance</h3>
              
              {mockUsers
                .filter(user => user.role === 'bda')
                .map(bda => {
                  const bdaLeads = mockLeads.filter(lead => lead.assignedBdaId === bda.id);
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
        
        {/* Lead status chart */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 col-span-2">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-medium text-slate-800">Lead Status Breakdown</h2>
          </div>
          <div className="p-6" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={80} 
                  tickLine={false}
                  axisLine={false}
                  style={{ fontSize: '0.875rem' }}
                />
                <Tooltip
                  formatter={(value) => [`${value} leads`, 'Count']}
                  labelStyle={{ fontWeight: 500 }}
                  contentStyle={{ 
                    borderRadius: '0.375rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 4, 4]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Recent activity */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-medium text-slate-800">Recent Activity</h2>
          <div className="text-sm text-blue-600 hover:text-blue-500 cursor-pointer">View all</div>
        </div>
        <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
          {metrics.recentActivity.map((activity, index) => (
            <div key={index} className="px-6 py-4 flex items-start">
              <div className="mr-4 mt-0.5">
                {activity.action.includes('status') ? (
                  <ClipboardCheck className="h-5 w-5 text-purple-500" />
                ) : activity.action.includes('follow-up') ? (
                  <Calendar className="h-5 w-5 text-amber-500" />
                ) : activity.action.includes('quotation') ? (
                  <FileText className="h-5 w-5 text-blue-500" />
                ) : activity.action.includes('contacted') ? (
                  <PhoneCall className="h-5 w-5 text-green-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-slate-500" />
                )}
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
                    {format(parseISO(activity.timestamp), 'MMM d, h:mm a')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;