import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Lead {
  id: number;
  name: string | null;
  remarks: string | null;
  status: string;
  email: string | null;
  lastUpdated: string;
  phone: string | null;
  followUpDate: string | null;
  intrests: string | null;
  actionStatus: string | null;
  actionTaken: string | null;
  industry?: string | null;
  temperature?: string | null;
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
  onSave: (updatedLead: Lead) => void;
  readOnly?: boolean;
}

const LeadModal: React.FC<LeadModalProps> = ({ isOpen, onClose, lead, onSave, readOnly = false }) => {
  const [formData, setFormData] = useState<Lead>({ ...lead });
  const [remarksError, setRemarksError] = useState<string>('');

  useEffect(() => {
    setFormData({ ...lead });
    setRemarksError('');
  }, [lead, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value || null,
    }));
  };

const handleCheckboxArrayChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  field: keyof Lead
) => {
  const { value, checked } = e.target;
  const existing = formData[field] || '';
  const values = existing
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v);

  let updatedValues: string[];

  if (checked) {
    updatedValues = values.includes(value) ? values : [...values, value];
  } else {
    updatedValues = values.filter((v) => v !== value);
  }

  setFormData((prev) => ({
    ...prev,
    [field]: updatedValues.length > 0 ? updatedValues.join(', ') : '',
  }));
};



  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate remarks
    if (!formData.remarks || formData.remarks.trim() === '') {
      setRemarksError('Remarks are required');
      return;
    }
    
    setRemarksError('');
    const actionTaken = [
      formData.whatsappSent ? 'whatsapp' : '',
      formData.emailSent ? 'email' : '',
      formData.quotationSent ? 'quotation' : '',
      formData.sampleWorkSent ? 'sample' : '',
      formData.MeetingBooked ? 'MeetingBooked' : '',
      formData.DemoScheduled ? 'DemoScheduled' : '',
      formData.NeedMoreInfo ? 'NeedMoreInfo' : '',
      formData.WaitingForDecision ? 'WaitingForDecision' : '',
    ].filter(Boolean).join(', ') || null;
    onSave({ ...formData, actionTaken });
  };

  const temperatureColors: Record<string, string> = {
    hot: 'bg-red-100 text-red-800',
    warm: 'bg-yellow-100 text-yellow-800',
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
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Name</label>
                  <input type="text" value={formData.name || ''} disabled className="mt-1 w-full rounded-lg bg-gray-100 p-2 border border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Phone</label>
                  <input type="text" value={formData.phone || ''} disabled className="mt-1 w-full rounded-lg bg-gray-100 p-2 border border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Email</label>
                  <input type="email" value={formData.email || ''} disabled className="mt-1 w-full rounded-lg bg-gray-100 p-2 border border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Industry</label>
                  <input type="text" value={formData.industry || ''} disabled className="mt-1 w-full rounded-lg bg-gray-100 p-2 border border-gray-300" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700">Status</label>
                  <select
                    name="status"
                    value={formData.status || 'new'}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="mt-1 w-full rounded-lg border-gray-300 bg-white p-2 shadow-sm"
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
                    className={`mt-1 w-full rounded-lg p-2 border border-gray-300 ${temperatureColors[formData.actionStatus || ''] || 'bg-white text-gray-900'}`}
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
                    value={formData.followUpDate ? format(parseISO(formData.followUpDate), 'yyyy-MM-dd') : ''}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="mt-1 w-full rounded-lg border-gray-300 bg-white p-2 shadow-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Remarks <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks || ''}
                    onChange={handleChange}
                    disabled={readOnly}
                    rows={3}
                    className={`mt-1 w-full rounded-lg border ${remarksError ? 'border-red-500' : 'border-gray-300'} p-2 shadow-sm`}
                    placeholder="Enter remarks (required)"
                  />
                  {remarksError && (
                    <p className="mt-1 text-sm text-red-500">{remarksError}</p>
                  )}
                </div>
              </div>

              {/* Interests */}
          <div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">Intrests</label>
  <div className="flex flex-wrap gap-2">
    {(() => {
      const selected = formData.intrests
        ? formData.intrests.split(',').map((i) => i.trim())
        : [];

      return ["Website", "App", "CRM", "Both", "Ecommerce", "CustomSoftware", "AIIntegration"].map((item) => (
        <label
          key={item}
          className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 hover:bg-blue-200 text-sm text-gray-800 cursor-pointer"
        >
          <input
            type="checkbox"
            value={item}
            checked={selected.includes(item)}
            onChange={(e) => handleCheckboxArrayChange(e, 'intrests')}
            disabled={readOnly}
            className="mr-2 text-blue-600 focus:ring-blue-500"
          />
          {item}
        </label>
      ));
    })()}
  </div>
</div>


              {/* Action Taken */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Actions Taken</label>
                <div className="grid grid-cols-2 gap-2">
                  {["whatsappSent", "emailSent", "quotationSent", "sampleWorkSent", "MeetingBooked", "DemoScheduled", "NeedMoreInfo", "WaitingForDecision"].map((field) => (
                    <label key={field} className="flex items-center text-sm text-gray-700">
                      <input
                        type="checkbox"
                        name={field}
                        checked={formData[field as keyof Lead] as boolean || false}
                        onChange={handleChange}
                        disabled={readOnly}
                        className="mr-2 text-blue-600 focus:ring-blue-500"
                      />
                      {field.replace(/([A-Z])/g, ' $1')}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                {!readOnly && (
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md hover:from-blue-700 hover:to-indigo-700"
                  >
                    Save
                  </button>
                )}
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default LeadModal;