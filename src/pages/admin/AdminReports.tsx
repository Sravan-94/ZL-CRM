import { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { generateMockBDAPerformance, mockLeads, mockUsers } from '../../data/mockData';
import { CalendarClock, CheckCircle, PhoneCall, FileText, Copy } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';

const AdminReports = () => {
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days'>('7days');
  const [selectedBda, setSelectedBda] = useState<string>('all');
  
  // Get BDA performance data
  const bdaPerformance = generateMockBDAPerformance();
  const bdaUsers = mockUsers.filter(user => user.role === 'bda');
  
  // Filter leads based on selected BDA
  const filteredLeads = selectedBda === 'all' 
    ? mockLeads 
    : mockLeads.filter(lead => lead.assignedBdaId === selectedBda);
  
  // Generate daily activity data for the selected date range
  const generateDailyActivityData = () => {
    let days = 7;
    switch (dateRange) {
      case '30days':
        days = 30;
        break;
      case '90days':
        days = 90;
        break;
      default:
        days = 7;
    }
    
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Count leads updated on this date
      const updatedLeads = filteredLeads.filter(lead => {
        const leadDate = format(parseISO(lead.updatedAt), 'yyyy-MM-dd');
        return leadDate === dateStr;
      });
      
      const calls = updatedLeads.length;
      const followups = updatedLeads.filter(lead => lead.followUpDate).length;
      const quotations = updatedLeads.filter(lead => lead.quotationSent).length;
      const closedWon = updatedLeads.filter(lead => lead.status === 'closed_won').length;
      
      data.push({
        date: format(date, 'MMM d'),
        calls,
        followups,
        quotations,
        closedWon
      });
    }
    
    return data;
  };
  
  const dailyActivityData = generateDailyActivityData();
  
  // Calculate metrics for the selected BDA and date range
  const calculateMetrics = () => {
    let days = 7;
    switch (dateRange) {
      case '30days':
        days = 30;
        break;
      case '90days':
        days = 90;
        break;
      default:
        days = 7;
    }
    
    const startDate = subDays(new Date(), days);
    
    // Filter leads updated within the date range
    const recentLeads = filteredLeads.filter(lead => {
      const updatedDate = parseISO(lead.updatedAt);
      return updatedDate >= startDate;
    });
    
    const totalCalls = recentLeads.length;
    const followupsMade = recentLeads.filter(lead => lead.followUpDate).length;
    const quotationsSent = recentLeads.filter(lead => lead.quotationSent).length;
    const dealsClosed = recentLeads.filter(lead => lead.status === 'closed_won').length;
    
    return {
      totalCalls,
      followupsMade,
      quotationsSent,
      dealsClosed
    };
  };
  
  const metrics = calculateMetrics();
  
  // Get conversion rate
  const getConversionRate = () => {
    if (filteredLeads.length === 0) return 0;
    
    const closedWon = filteredLeads.filter(lead => lead.status === 'closed_won').length;
    return Math.round((closedWon / filteredLeads.length) * 100);
  };
  
  const conversionRate = getConversionRate();
  
  // Get recent lead updates
  const getRecentLeadUpdates = () => {
    // Sort leads by updatedAt (most recent first)
    return [...filteredLeads]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10);
  };
  
  const recentLeadUpdates = getRecentLeadUpdates();

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <h2 className="text-lg font-medium text-slate-800">Performance Reports</h2>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <select
              value={selectedBda}
              onChange={(e) => setSelectedBda(e.target.value)}
              className="block w-full sm:w-48 rounded-md border-slate-300 shadow-sm 
                       focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
            >
              <option value="all">All BDAs</option>
              {bdaUsers.map((bda) => (
                <option key={bda.id} value={bda.id}>{bda.name}</option>
              ))}
            </select>
            
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setDateRange('7days')}
                className={`px-3 py-2 text-sm font-medium rounded-l-md border border-r-0 ${
                  dateRange === '7days'
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setDateRange('30days')}
                className={`px-3 py-2 text-sm font-medium border border-r-0 ${
                  dateRange === '30days'
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setDateRange('90days')}
                className={`px-3 py-2 text-sm font-medium rounded-r-md border ${
                  dateRange === '90days'
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                90 Days
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <PhoneCall className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Calls</p>
              <p className="text-2xl font-semibold text-slate-800">{metrics.totalCalls}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 mr-4">
              <CalendarClock className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Follow-ups Made</p>
              <p className="text-2xl font-semibold text-slate-800">{metrics.followupsMade}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-amber-100 mr-4">
              <FileText className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Quotations Sent</p>
              <p className="text-2xl font-semibold text-slate-800">{metrics.quotationsSent}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 mr-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Deals Closed</p>
              <p className="text-2xl font-semibold text-slate-800">{metrics.dealsClosed}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily activity chart */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-medium text-slate-800">Daily Activity</h3>
          </div>
          <div className="p-4" style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ 
                    borderRadius: '0.375rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line 
                  type="monotone" 
                  dataKey="calls" 
                  stroke="#3b82f6" 
                  name="Calls" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="followups" 
                  stroke="#8b5cf6" 
                  name="Follow-ups" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="quotations" 
                  stroke="#f59e0b" 
                  name="Quotations" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="closedWon" 
                  stroke="#10b981" 
                  name="Deals Closed" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* BDA performance comparison */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-medium text-slate-800">BDA Performance Comparison</h3>
          </div>
          <div className="p-4" style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bdaPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="bdaName" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ 
                    borderRadius: '0.375rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="totalLeads" name="Total Leads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="followupsMade" name="Follow-ups" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="quotationsSent" name="Quotations" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="dealsClosed" name="Deals Closed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Additional stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Conversion rate */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm lg:col-span-1">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-medium text-slate-800">Conversion Rate</h3>
          </div>
          <div className="p-6 flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="3"
                  strokeDasharray="100, 100"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeDasharray={`${conversionRate}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className="text-3xl font-semibold text-slate-800">{conversionRate}%</div>
                <div className="text-xs text-slate-500">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent lead updates */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm lg:col-span-3">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-medium text-slate-800">Recent Lead Updates</h3>
          </div>
          <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
            {recentLeadUpdates.length === 0 ? (
              <div className="px-6 py-4 text-center text-sm text-slate-500">
                No recent lead updates
              </div>
            ) : (
              recentLeadUpdates.map((lead) => (
                <div key={lead.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{lead.name}</div>
                      <div className="text-sm text-slate-500">
                        {lead.assignedBdaName || 'Unassigned'} • {lead.status.charAt(0).toUpperCase() + lead.status.slice(1).replace('_', ' ')}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      {format(parseISO(lead.updatedAt), 'MMM d, h:mm a')}
                    </div>
                  </div>
                  
                  <div className="mt-1 flex flex-wrap gap-2">
                    {lead.whatsappSent && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        WhatsApp Sent
                      </span>
                    )}
                    {lead.emailSent && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Email Sent
                      </span>
                    )}
                    {lead.quotationSent && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                        Quotation Sent
                      </span>
                    )}
                    {lead.sampleWorkSent && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        Sample Work Sent
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;