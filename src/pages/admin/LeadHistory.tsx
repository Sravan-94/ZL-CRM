import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

interface LeadHistory {
  id: number;
  lead: {
    id: number;
    name: string;
    state: string;
    status: string;
    city: string;
    email: string;
    remarks: string;
    followUp: string;
    industry: string;
    contactNo: string;
    actionStatus: string;
    actionTaken: string;
    lastUpdated: string;
    assignedTo: string;
    companyName: string;
    intrests: string;
  };
  status: string;
  actionStatus: string;
  remarks: string;
  actionTaken: string;
  updatedAt: string;
  updatedBy: string;
}

const LeadHistory = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const [history, setHistory] = useState<LeadHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeadHistory = async () => {
      try {
        const response = await fetch(`http://147.93.102.131:8080/api/leads/${leadId}/history`);
        if (!response.ok) throw new Error('Failed to fetch lead history');
        const data = await response.json();
        console.log('Lead history API response:', JSON.stringify(data, null, 2));
        setHistory(data);
      } catch (err) {
        console.error('Error fetching lead history:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch lead history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeadHistory();
  }, [leadId]);

  // Debug log for history state
  useEffect(() => {
    console.log('Current history state:', JSON.stringify(history, null, 2));
  }, [history]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading lead history...</div>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">
              Lead History{history[0]?.lead?.name ? ` - ${history[0].lead.name}` : ''}
            </h1>
            <p className="text-sm text-slate-500">
              Track all changes made to this lead
            </p>
          </div>
        </div>
      </div>

      {/* History Timeline */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="divide-y divide-slate-200">
          {history.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No history found for this lead
            </div>
          ) : (
            history.map((entry, index) => {
              console.log('Processing entry:', entry);
              return (
                <div key={entry.id} className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Timeline dot */}
                    <div className="relative">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      {index !== history.length - 1 && (
                        <div className="absolute top-3 left-1.5 w-0.5 h-full bg-slate-200" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-medium text-slate-800">
                            Updated by {entry.updatedBy || 'Unknown User'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {format(parseISO(entry.updatedAt), 'MMM d, yyyy h:mm a')}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {entry.actionStatus && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              entry.actionStatus.toLowerCase() === 'hot' ? 'bg-red-100 text-red-800' :
                              entry.actionStatus.toLowerCase() === 'warm' ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {entry.actionStatus}
                            </span>
                          )}
                          {entry.status && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              entry.status === 'Interested' ? 'bg-green-100 text-green-800' :
                              entry.status === 'Not Interested' ? 'bg-red-100 text-red-800' :
                              'bg-slate-100 text-slate-800'
                            }`}>
                              {entry.status}
                            </span>
                          )}
                        </div>
                      </div>

                      {entry.remarks && (
                        <div className="mt-2 text-sm text-slate-600">
                          <span className="font-medium">Remarks:</span> {entry.remarks}
                        </div>
                      )}

                      {entry.actionTaken && entry.actionTaken.trim() !== '' && (
                        <div className="mt-2">
                          <div className="text-sm font-medium text-slate-800">Actions Taken:</div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {entry.actionTaken.split(',').map((action, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs"
                              >
                                {action.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadHistory;
