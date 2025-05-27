import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
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
  assignedTo: string | null;
  followUpDate: string | null;
  interests: string | null;
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

  useEffect(() => {
    console.log('LeadModal props:', { isOpen, lead, readOnly });
    setFormData({ ...lead });
  }, [lead, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
    const current = formData[field]?.split(',').map((i) => i.trim()) || [];
    const updated = checked
      ? [...new Set([...current, value])]
      : current.filter((i) => i !== value);
    setFormData((prev) => ({
      ...prev,
      [field]: updated.join(', ') || null,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const actionTaken = [
      formData.whatsappSent ? 'whatsapp' : '',
      formData.emailSent ? 'email' : '',
      formData.quotationSent ? 'quotation' : '',
      formData.sampleWorkSent ? 'sample' : '',
      formData.MeetingBooked ? 'MeetingBooked' : '',
      formData.DemoScheduled ? 'DemoScheduled' : '',
      formData.NeedMoreInfo ? 'NeedMoreInfo' : '',
      formData.WaitingForDecision ? 'WaitingForDecision' : '',
    ]
      .filter(Boolean)
      .join(', ') || null;
    console.log('Submitting form:', { ...formData, actionTaken });
    onSave({ ...formData, actionTaken });
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-opcacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <Dialog.Panel className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-lg border border-gray-300">
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title as="h2" className="text-xl font-semibold text-gray-900">
                  Update Lead
                </Dialog.Title>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Lead Details */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Lead Details</h3>
                <div className="border border-gray-200 bg-gray-50 p-4 rounded">
                  <p className="font-semibold text-gray-900">{formData.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-600">{formData.phone || 'Not set'}</p>
                  <p className="text-sm text-gray-600">{formData.email || 'Not set'}</p>
                  <div className="mt-2 text-sm">
                    <span className="text-gray-500">Industry:</span>{' '}
                    <span className="text-gray-700">{formData.industry || 'Not set'}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-wrap gap-4">
                {/* First Row: Status, Temperature, Follow-up Date */}
                <div className="flex flex-col md:flex-row w-full gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      name="status"
                      value={formData.status || 'new'}
                      onChange={handleChange}
                      disabled={readOnly}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700">Temperature</label>
                    <select
                      name="temperature"
                      value={formData.temperature || ''}
                      onChange={handleChange}
                      disabled={readOnly}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Not Set</option>
                      <option value="hot">Hot</option>
                      <option value="warm">Warm</option>
                      <option value="cold">Cold</option>
                      <option value="dead">Dead</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700">Follow-up Date</label>
                    <input
                      type="date"
                      name="followUpDate"
                      value={formData.followUpDate ? format(parseISO(formData.followUpDate), 'yyyy-MM-dd') : ''}
                      onChange={handleChange}
                      disabled={readOnly}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Second Row: Remarks, Assigned To, Action Status */}
                <div className="flex flex-col md:flex-row w-full gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700">Remarks</label>
                    <textarea
                      name="remarks"
                      value={formData.remarks || ''}
                      onChange={handleChange}
                      disabled={readOnly}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                    <input
                      type="text"
                      name="assignedTo"
                      value={formData.assignedTo || ''}
                      onChange={handleChange}
                      disabled={readOnly}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700">Action Status</label>
                    <input
                      type="text"
                      name="actionStatus"
                      value={formData.actionStatus || ''}
                      onChange={handleChange}
                      disabled={readOnly}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Third Row: Interests and Actions Taken */}
                <div className="flex flex-col md:flex-row w-full gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
                    <div className="space-y-2">
                      {['Website', 'App', 'CRM', 'Both', 'Ecommerce', 'CustomSoftware', 'AIIntegration'].map((item) => (
                        <label className="flex items-center" key={item}>
                          <input
                            type="checkbox"
                            name="interests"
                            value={item}
                            checked={(formData.interests || '').includes(item)}
                            onChange={(e) => handleCheckboxArrayChange(e, 'interests')}
                            disabled={readOnly}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Actions Taken</label>
                    <div className="space-y-2">
                      {[
                        { name: 'whatsappSent', label: 'WhatsApp Sent', value: 'whatsapp' },
                        { name: 'emailSent', label: 'Email Sent', value: 'email' },
                        { name: 'quotationSent', label: 'Quotation Sent', value: 'quotation' },
                        { name: 'sampleWorkSent', label: 'Sample Work Sent', value: 'sample' },
                        { name: 'MeetingBooked', label: 'Meeting Booked', value: 'MeetingBooked' },
                        { name: 'DemoScheduled', label: 'Demo Scheduled', value: 'DemoScheduled' },
                        { name: 'NeedMoreInfo', label: 'Need More Info', value: 'NeedMoreInfo' },
                        { name: 'WaitingForDecision', label: 'Waiting For Decision', value: 'WaitingForDecision' },
                      ].map((action) => (
                        <label className="flex items-center" key={action.name}>
                          <input
                            type="checkbox"
                            name={action.name}
                            checked={formData[action.name as keyof Lead] as boolean}
                            onChange={handleChange}
                            disabled={readOnly}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{action.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="w-full flex justify-end space-x-2 mt-4">
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
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Save
                    </button>
                  )}
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default LeadModal;