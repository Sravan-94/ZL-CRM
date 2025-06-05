import { useState, useEffect, useMemo } from 'react';
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
  ResponsiveContainer,
} from 'recharts';
import { CalendarClock, CheckCircle, PhoneCall, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, subDays, parseISO, addDays } from 'date-fns';
import Select from 'react-select';

type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'
  | 'warm'
  | 'WrongNumber'
  | 'NotAnswered'
  | 'CallBackLater'
  | 'Interested'
  | 'NotInterested'
  | 'SwitchedOff';

interface Lead {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  industry: string | null;
  companyName: string | null;
  city: string | null;
  state: string | null;
  status: LeadStatus;
  assignedTo: string | null;
  followUpDate: string | null;
  temperature: string | null;
  interests: string | null;
  remarks: string | null;
  actionStatus: string | null;
  actionTaken: string | null;
  createdAt: string;
  updatedAt: string;
  lastUpdated: string;
}

interface User {
  id: string;
  name: string;
  role: string;
}

interface LeadHistory {
  status: LeadStatus;
  actionStatus: string;
  remarks: string;
  actionTaken: string;
  updatedAt: string;
  updatedBy: string;
}

interface BdaPerformance {
  bdaName: string;
  totalLeads: number;
  totalCalls: number;
  followupsMade: number;
  quotationsSent: number;
  dealsClosed: number;
}

const AdminReports = () => {
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | '90days'>('7days');
  const [selectedBdas, setSelectedBdas] = useState<string[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [leadHistory, setLeadHistory] = useState<LeadHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Retry fetch with delay
  const fetchWithRetry = async (url: string, retries = 3, delay = 2000): Promise<any> => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
        return await response.json();
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  // Fetch leads, users, and lead history
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch leads
        try {
          const leadsData = await fetchWithRetry('http://147.93.102.131:8080/api/leads/getall');
          const mappedLeads = leadsData.map((lead: any) => ({
            id: String(lead.id),
            name: lead.name || null,
            phone: lead.contactNo || null,
            email: lead.email || null,
            industry: lead.industry || null,
            companyName: lead.companyName || null,
            city: lead.city || null,
            state: lead.state || null,
            status: (lead.status || 'new') as LeadStatus,
            assignedTo: lead.assignedTo || null,
            followUpDate: lead.followUp || null,
            temperature: lead.temperature || null,
            interests: lead.intrests || null,
            remarks: lead.remarks || null,
            actionStatus: lead.actionStatus || null,
            actionTaken: lead.actionTaken || null,
            createdAt: lead.createdAt || new Date().toISOString(),
            updatedAt: lead.lastUpdated || new Date().toISOString(),
            lastUpdated: lead.lastUpdated || new Date().toISOString(),
          }));
          setLeads(mappedLeads);
        } catch (err) {
          console.error('Error fetching leads:', err);
          setError('Failed to fetch leads. Some data may be incomplete.');
        }

        // Fetch users
        try {
          const usersData = await fetchWithRetry('http://147.93.102.131:8080/api/bda-users');
          setUsers(usersData);
        } catch (err) {
          console.error('Error fetching users:', err);
          setError((prev) => (prev ? `${prev} Failed to fetch users.` : 'Failed to fetch users.'));
        }

        // Fetch lead history
        try {
          const historyData = await fetchWithRetry('http://147.93.102.131:8080/api/leads/history');
          setLeadHistory(historyData);
        } catch (err) {
          console.error('Error fetching lead history:', err);
          setError((prev) =>
            prev ? `${prev} Failed to fetch lead history.` : 'Failed to fetch lead history. Call data may be unavailable.'
          );
          setLeadHistory([]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Partial data loaded due to slow or failed API responses.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // BDA options for react-select
  const bdaOptions = useMemo(() => {
    const bdaUsers = users.filter(user => user.role?.toLowerCase() === 'bda');
    return [
      { value: 'all', label: 'All BDAs' },
      ...bdaUsers.map(bda => ({
        value: bda.id,
        label: bda.name,
      }))
    ];
  }, [users]);

  // Handle BDA selection change
  const handleBdaChange = (selectedOptions: any) => {
    if (!selectedOptions || selectedOptions.length === 0) {
      setSelectedBdas([]);
      return;
    }

    const selectedValues = selectedOptions.map((option: any) => option.value);

    // If "All BDAs" is selected, set to ['all'] only if no other BDAs are selected
    if (selectedValues.includes('all') && selectedValues.length === 1) {
      setSelectedBdas(['all']);
      return;
    }

    // Filter out 'all' if other BDAs are selected
    const filteredValues = selectedValues.filter((value: string) => value !== 'all');

    // Enforce max 4 BDAs
    if (filteredValues.length > 4) {
      return;
    }

    setSelectedBdas(filteredValues);
  };

  // Filter leads based on selected BDAs
  const filteredLeads = useMemo(() => {
    if (selectedBdas.includes('all') || selectedBdas.length === 0) return leads;
    
    return leads.filter((lead) => {
      if (!lead.assignedTo) return false;
      
      return selectedBdas.some((bdaId) => {
        const selectedBda = users.find(user => user.id === bdaId);
        if (!selectedBda) return false;
        
        const assignedTo = lead.assignedTo?.toLowerCase() || '';
        const assignedToId = lead.assignedTo?.toString() || '';
        return (
          assignedTo === selectedBda.name.toLowerCase() ||
          assignedToId === selectedBda.id.toString()
        );
      });
    });
  }, [leads, selectedBdas, users]);

  // Filter lead history based on date range and selected BDAs
  const filteredLeadHistory = useMemo(() => {
    let startDate: Date;
    if (dateRange === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else {
      const days = dateRange === '30days' ? 30 : dateRange === '90days' ? 90 : 7;
      startDate = subDays(new Date(), days);
    }

    return leadHistory.filter((history) => {
      try {
        const updatedDate = parseISO(history.updatedAt);
        const isWithinDateRange = updatedDate >= startDate;
        const isBySelectedBda =
          selectedBdas.includes('all') || selectedBdas.length === 0 ||
          selectedBdas.some((bda) => {
            const selectedBda = users.find(user => user.id === bda);
            if (!selectedBda) return false;
            return history.updatedBy.toLowerCase() === selectedBda.name.toLowerCase();
          });
        return isWithinDateRange && isBySelectedBda;
      } catch (error) {
        console.error('Error parsing history date:', error);
        return false;
      }
    });
  }, [leadHistory, selectedBdas, dateRange, users]);

  // Generate daily activity data
  const dailyActivityData = useMemo(() => {
    let days: number;
    let startDate: Date;
    
    if (dateRange === 'today') {
      days = 1;
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else {
      days = dateRange === '30days' ? 30 : dateRange === '90days' ? 90 : 7;
      startDate = subDays(new Date(), days - 1);
    }

    const data = [];

    for (let i = 0; i < days; i++) {
      const date = addDays(startDate, i);
      const dateStr = format(date, 'yyyy-MM-dd');

      const calls = filteredLeadHistory.filter((history) => {
        try {
          const historyDate = format(parseISO(history.updatedAt), 'yyyy-MM-dd');
          return historyDate === dateStr;
        } catch (error) {
          return false;
        }
      }).length;

      const updatedLeads = filteredLeads.filter((lead) => {
        if (!lead.lastUpdated) return false;
        try {
          const leadDate = format(parseISO(lead.lastUpdated), 'yyyy-MM-dd');
          return leadDate === dateStr;
        } catch (error) {
          return false;
        }
      });

      const followups = updatedLeads.filter((lead) => {
        if (!lead.followUpDate) return false;
        try {
          const followUpDate = format(parseISO(lead.followUpDate), 'yyyy-MM-dd');
          return followUpDate === dateStr;
        } catch (error) {
          return false;
        }
      }).length;

      const quotations = updatedLeads.filter((lead) =>
        lead.actionTaken?.toLowerCase().includes('quotation')
      ).length;

      const closedWon = updatedLeads.filter((lead) => lead.status?.toLowerCase() === 'closed_won')
        .length;

      data.push({
        date: format(date, 'MMM d'),
        calls,
        followups,
        quotations,
        closedWon,
      });
    }

    return data;
  }, [filteredLeads, filteredLeadHistory, dateRange]);

  // Calculate metrics
  const metrics = useMemo(() => {
    let days = dateRange === '30days' ? 30 : dateRange === '90days' ? 90 : 7;
    const startDate = subDays(new Date(), days);

    const recentLeads = filteredLeads.filter((lead) => {
      if (!lead.lastUpdated) return false;
      try {
        const updatedDate = parseISO(lead.lastUpdated);
        return updatedDate >= startDate;
      } catch (error) {
        return false;
      }
    });

    const totalCalls = filteredLeadHistory.length;

    const followupsMade = recentLeads.filter((lead) => lead.followUpDate).length;
    const quotationsSent = recentLeads.filter((lead) =>
      lead.actionTaken?.toLowerCase().includes('quotation')
    ).length;
    const dealsClosed = recentLeads.filter((lead) => lead.status?.toLowerCase() === 'closed_won').length;

    return {
      totalCalls,
      followupsMade,
      quotationsSent,
      dealsClosed,
    };
  }, [filteredLeads, filteredLeadHistory, dateRange]);

  // Get conversion rate
  const conversionRate = useMemo(() => {
    if (filteredLeads.length === 0) return 0;
    const closedWon = filteredLeads.filter((lead) => lead.status === 'closed_won').length;
    return Math.round((closedWon / filteredLeads.length) * 100);
  }, [filteredLeads]);

  // Get recent lead updates
  const recentLeadUpdates = useMemo(() => {
    return [...filteredLeads]
      .filter((lead) => lead.lastUpdated)
      .sort((a, b) => {
        try {
          return new Date(b.lastUpdated!).getTime() - new Date(a.lastUpdated!).getTime();
        } catch (error) {
          return 0;
        }
      })
      .slice(0, 10);
  }, [filteredLeads]);

  // Generate BDA performance data
  const bdaPerformance = useMemo(() => {
    let startDate: Date;
    if (dateRange === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else {
      const days = dateRange === '30days' ? 30 : dateRange === '90days' ? 90 : 7;
      startDate = subDays(new Date(), days);
    }

    const performance = users
      .filter((user) => user.role?.toLowerCase() === 'bda')
      .filter((user) =>
        selectedBdas.includes('all') || selectedBdas.length === 0 ||
        selectedBdas.includes(user.id)
      )
      .map((bda) => {
        const bdaLeads = leads.filter(
          (lead) =>
            lead.assignedTo?.toLowerCase() === bda.name.toLowerCase() ||
            lead.assignedTo?.toString() === bda.id.toString()
        );

        const recentBdaLeads = bdaLeads.filter((lead) => {
          if (!lead.lastUpdated) return false;
          try {
            const updatedDate = parseISO(lead.lastUpdated);
            return updatedDate >= startDate;
          } catch (error) {
            return false;
          }
        });

        const bdaHistory = leadHistory.filter(
          (history) => {
            try {
              return (
                history.updatedBy.toLowerCase() === bda.name.toLowerCase() &&
                parseISO(history.updatedAt) >= startDate
              );
            } catch (error) {
              return false;
            }
          }
        );

        return {
          bdaName: bda.name,
          totalLeads: recentBdaLeads.length,
          totalCalls: bdaHistory.length,
          followupsMade: recentBdaLeads.filter((lead) => lead.followUpDate).length,
          quotationsSent: recentBdaLeads.filter((lead) =>
            lead.actionTaken?.toLowerCase().includes('quotation')
          ).length,
          dealsClosed: recentBdaLeads.filter((lead) => lead.status?.toLowerCase() === 'closed_won')
            .length,
        };
      });

    return performance;
  }, [leads, users, leadHistory, dateRange, selectedBdas]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading reports data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg">{error}</div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <h2 className="text-lg font-medium text-slate-800">Performance Reports</h2>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <div className="flex items-center space-x-2">
              <Select
                isMulti
                options={bdaOptions}
                value={bdaOptions.filter(option => selectedBdas.includes(option.value))}
                onChange={handleBdaChange}
                className="w-full sm:w-48 text-sm"
                placeholder="Select BDAs (max 4)"
                isOptionDisabled={(option) => 
                  selectedBdas.length >= 4 && 
                  !selectedBdas.includes(option.value) && 
                  option.value !== 'all'
                }
                isClearable={true}
                closeMenuOnSelect={false}
                blurInputOnSelect={false}
                menuPlacement="auto"
                noOptionsMessage={() => "No BDAs available"}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '36px',
                    backgroundColor: 'white',
                    borderColor: '#e2e8f0',
                    '&:hover': {
                      borderColor: '#94a3b8'
                    }
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#e2e8f0' : 'white',
                    color: state.isSelected ? 'white' : '#1e293b',
                    cursor: 'pointer',
                    ':active': {
                      backgroundColor: state.isSelected ? '#3b82f6' : '#e2e8f0',
                    },
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: '#e2e8f0',
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: '#1e293b',
                    fontWeight: 500,
                  }),
                  multiValueRemove: (base) => ({
                    ...base,
                    color: '#64748b',
                    ':hover': {
                      backgroundColor: '#cbd5e1',
                      color: '#1e293b',
                    },
                  }),
                }}
              />
            </div>

            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setDateRange('today')}
                className={`px-3 py-2 text-sm font-medium rounded-l-md border border-r-0 ${
                  dateRange === 'today'
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateRange('7days')}
                className={`px-3 py-2 text-sm font-medium border border-r-0 ${
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
              <p className="text-sm font-medium text-slate-500">Total Calls Made</p>
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
              <p className="text-sm font-medium text-slate-500">Follow-ups Scheduled</p>
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
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  dataKey="calls"
                  stroke="#3b82f6"
                  name="Calls Made"
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
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar
                  dataKey="totalCalls"
                  name="Calls Made"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="totalLeads"
                  name="Leads Assigned"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="followupsMade"
                  name="Follow-ups"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="quotationsSent"
                  name="Quotations"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="dealsClosed"
                  name="Deals Closed"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Additional stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                        {lead.assignedTo || 'Unassigned'} •{' '}
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1).replace('_', ' ')}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      {lead.updatedAt
                        ? format(parseISO(lead.updatedAt), 'MMM d, h:mm a')
                        : 'No update date'}
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {lead.actionTaken?.includes('whatsapp') && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        WhatsApp Sent
                      </span>
                    )}
                    {lead.actionTaken?.includes('email') && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Email Sent
                      </span>
                    )}
                    {lead.actionTaken?.includes('quotation') && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                        Quotation Sent
                      </span>
                    )}
                    {lead.actionTaken?.includes('sample') && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        Sample Work Sent
                      </span>
                    )}
                    {leadHistory.some(
                      (history) =>
                        history.updatedAt === lead.lastUpdated &&
                        ['NotAnswered', 'SwitchedOff', 'NotInterested', 'CallBackLater'].includes(history.status)
                    ) && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Call Attempted
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