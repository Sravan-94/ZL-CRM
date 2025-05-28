import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

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
  assignedBdaId?: string | null;
  assignedBdaName?: string | null;
  followUpDate: string | null;
  intrests: string | null;
  remarks: string | null;
  actionStatus: string | null;
  actionTaken: string | null;
  createdAt?: string;
  updatedAt?: string;
  loggedinId?: number;
  whatsappSent?: boolean;
  emailSent?: boolean;
  quotationSent?: boolean;
  sampleWorkSent?: boolean;
  MeetingBooked?: boolean;
  DemoScheduled?: boolean;
  NeedMoreInfo?: boolean;
  WaitingForDecision?: boolean;
}

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onSave: (updatedLead: Lead) => Promise<boolean>;
  readOnly?: boolean;
}

const LeadModal: React.FC<LeadModalProps> = ({ isOpen, onClose, lead, onSave, readOnly = false }) => {
  const [formData, setFormData] = useState<Lead>({ ...lead });
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    console.log('LeadModal opened', { isOpen, readOnly, user, leadId: lead.id });
    setFormData({ ...lead });
    setError(null);
    if (!user || !user.id) {
      toast.error('No authenticated user detected. Please log in.');
    }
  }, [lead, isOpen, user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value || null,
    }));
  };

  const handleCheckboxArrayChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof Lead
  ) => {
    const { value, checked } = e.target;
    const existing = formData[field]?.toString() || '';
    const values = existing
      .split(',')
      .map(v => v.trim())
      .filter(v => v);

    let updatedValues: string[];
    if (checked) {
      updatedValues = values.includes(value) ? values : [...values, value];
    } else {
      updatedValues = values.filter(v => v !== value);
    }

    setFormData(prev => ({
      ...prev,
      [field]: updatedValues.length > 0 ? updatedValues.join(', ') : null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user || !user.id) {
      setError('User information missing. Please log in again.');
      toast.error('Authentication error. Please log in again.');
      return;
    }

    try {
      const actionTaken = [
        formData.whatsappSent ? 'whatsapp' : null,
        formData.emailSent ? 'email' : null,
        formData.quotationSent ? 'quotation' : null,
        formData.sampleWorkSent ? 'sample' : null,
        formData.MeetingBooked ? 'MeetingBooked' : null,
        formData.DemoScheduled ? 'DemoScheduled' : null,
        formData.NeedMoreInfo ? 'NeedMoreInfo' : null,
        formData.WaitingForDecision ? 'WaitingForDecision' : null,
      ]
        .filter(Boolean)
        .join(', ') || null;

      const updatedLead = { ...formData, actionTaken, loggedinId: Number(user.id) };
      console.log('Submitting lead:', updatedLead);

      const success = await onSave(updatedLead);
      if (success) {
        toast.success('Lead updated successfully');
        onClose();
      } else {
        setError('Failed to save lead. Please try again.');
        toast.error('Lead update failed');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('An error occurred while saving the lead.');
      toast.error('Failed to save lead');
    }
  };

  const handleCancel = () => {
    console.log('Cancel button clicked');
    onClose();
  };

  const temperatureColors: Record<string, string> = {
    hot: 'bg-red-100 text-red-800',
    warm: 'bg-amber-100 text-amber-800',
    cold: 'bg-blue-100 text-blue-800',
    dead: 'bg-gray-100 text-gray-800',
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title as="h2" className="text-2xl font-bold text-gray-900">
                Lead Details
              </Dialog.Title>
              <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-2 text-sm text-red-600 bg-red-100 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="mt-1 w-full p-2 rounded-md text-sm border border-gray-200 bg-white text-gray-900 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="mt-1 w-full p-2 rounded-md text-sm border border-gray-200 bg-white text-gray-900 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="mt-1 w-full p-2 rounded-md text-sm border border-gray-200 bg-white text-gray-900 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Industry</label>
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry || ''}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="mt-1 w-full p-2 rounded-md text-sm border border-gray-200 bg-white text-gray-900 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName || ''}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="mt-1 w-full p-2 rounded-md text-sm border border-gray-200 bg-white text-gray-900 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city || ''}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="mt-1 w-full p-2 rounded-md text-sm border border-gray-200 bg-white text-gray-900 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state || ''}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="mt-1 w-full p-2 rounded-md text-sm border border-gray-200 bg-white text-gray-900 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Status</label>
                  <select
                    name="status"
                    value={formData.status || 'new'}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="mt-1 w-full p-2 rounded-md text-sm border border-gray-200 bg-white text-gray-900 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="closed_won">Closed (Won)</option>
                    <option value="closed_lost">Closed (Lost)</option>
                    <option value="warm">Warm</option>
                    <option value="WrongNumber">Wrong Number</option>
                    <option value="NotAnswered">Not Answered</option>
                    <option value="CallBackLater">Call Back Later</option>
                    <option value="Interested">Interested</option>
                    <option value="NotInterested">Not Interested</option>
                    <option value="SwitchedOff">Switched Off</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Temperature</label>
                  <select
                    name="actionStatus"
                    value={formData.actionStatus || ''}
                    onChange={handleChange}
                    disabled={readOnly}
                    className={`mt-1 w-full p-2 rounded-md text-sm border border-gray-200 ${
                      temperatureColors[formData.actionStatus || ''] || 'bg-white text-gray-900'
                    } focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100`}
                  >
                    <option value="">Select</option>
                    <option value="hot">Hot</option>
                    <option value="warm">Warm</option>
                    <option value="cold">Cold</option>
                    <option value="dead">Dead</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Follow-up Date</label>
                  <input
                    type="date"
                    name="followUpDate"
                    value={
                      formData.followUpDate && isValid(parseISO(formData.followUpDate))
                        ? format(parseISO(formData.followUpDate), 'yyyy-MM-dd')
                        : ''
                    }
                    onChange={handleChange}
                    disabled={readOnly}
                    className="mt-1 w-full p-2 rounded-md text-sm border border-gray-200 bg-white text-gray-900 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700">Remarks</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks || ''}
                    onChange={handleChange}
                    disabled={readOnly}
                    rows={3}
                    className="mt-1 w-full p-2 rounded-md text-sm border border-gray-200 bg-white text-gray-900 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Interests</label>
                <div className="flex flex-wrap gap-2">
                  {['Website', 'App', 'CRM', 'Both', 'Ecommerce', 'CustomSoftware', 'AIIntegration'].map(
                    item => (
                      <label
                        key={item}
                        className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 hover:bg-blue-200 text-sm text-gray-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          value={item}
                          checked={
                            formData.intrests?.split(',').map(i => i.trim()).includes(item) ?? false
                          }
                          onChange={e => handleCheckboxArrayChange(e, 'intrests')}
                          disabled={readOnly}
                          className="mr-2 text-blue-600 focus:ring-blue-500"
                        />
                        {item}
                      </label>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Actions Taken</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'whatsappSent',
                    'emailSent',
                    'quotationSent',
                    'sampleWorkSent',
                    'MeetingBooked',
                    'DemoScheduled',
                    'NeedMoreInfo',
                    'WaitingForDecision',
                  ].map(field => (
                    <label key={field} className="flex items-center text-sm text-gray-700">
                      <input
                        type="checkbox"
                        name={field}
                        checked={(formData[field as keyof Lead] as boolean) ?? false}
                        onChange={handleChange}
                        disabled={readOnly}
                        className="mr-2 text-blue-600 focus:ring-blue-500"
                      />
                      {field.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={readOnly || !user || !user.id}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    readOnly || !user || !user.id
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                  }`}
                >
                  Save
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default LeadModal;