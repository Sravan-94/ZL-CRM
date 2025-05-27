import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Thermometer, ClipboardCheck, Calendar, CheckSquare } from 'lucide-react';
import { Lead, LeadFormData, LeadInterest, LeadStatus, LeadTemperature } from '../../types';
import { format } from 'date-fns';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onSave: (lead: Lead) => void;
  readOnly?: boolean;
}

const LeadModal = ({ isOpen, onClose, lead, onSave, readOnly = false }: LeadModalProps) => {
  const [formData, setFormData] = useState<LeadFormData>({
    temperature: lead.temperature,
    interests: lead.interests,
    remarks: lead.remarks,
    followUpDate: lead.followUpDate,
    whatsappSent: lead.whatsappSent,
    emailSent: lead.emailSent,
    quotationSent: lead.quotationSent,
    sampleWorkSent: lead.sampleWorkSent,
    status: lead.status,
  });
  
  // Update form data when lead changes
  useEffect(() => {
    setFormData({
      temperature: lead.temperature,
      interests: lead.interests,
      remarks: lead.remarks,
      followUpDate: lead.followUpDate,
      whatsappSent: lead.whatsappSent,
      emailSent: lead.emailSent,
      quotationSent: lead.quotationSent,
      sampleWorkSent: lead.sampleWorkSent,
      status: lead.status,
    });
  }, [lead]);
  
  const handleInterestToggle = (interest: LeadInterest) => {
    if (formData.interests.includes(interest)) {
      setFormData({
        ...formData,
        interests: formData.interests.filter(i => i !== interest)
      });
    } else {
      setFormData({
        ...formData,
        interests: [...formData.interests, interest]
      });
    }
  };
  
  const handleSave = () => {
    const updatedLead: Lead = {
      ...lead,
      ...formData,
      updatedAt: new Date().toISOString()
    };
    
    onSave(updatedLead);
  };
  
  return (
    <Transition appear show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all sm:max-w-lg">
                <div className="flex justify-between items-start">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-slate-900"
                  >
                    Lead Details
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-500"
                    onClick={onClose}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Lead basic info (read-only) */}
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <div className="text-lg font-medium text-slate-800">{lead.name}</div>
                  <div className="mt-1 text-sm text-slate-600">{lead.phone}</div>
                  <div className="text-sm text-slate-600">{lead.email}</div>
                  <div className="mt-2 text-sm">
                    <span className="text-slate-500">Industry:</span> <span className="text-slate-700">{lead.industry}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-500">Service:</span> <span className="text-slate-700">{lead.service}</span>
                  </div>
                </div>
                
                <div className="mt-6 space-y-6">
                  {/* Lead status */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                      <ClipboardCheck className="h-4 w-4 mr-1" />
                      Lead Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as LeadStatus})}
                      disabled={readOnly}
                      className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200"
                    >
                      <option value="new">New</option>
                      <option value="qualified">Qualified</option>
                      <option value="proposal">Proposal</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="contacted">WrongNumber</option>
                      <option value="warm">NotAnswered</option>
                      <option value="warm">CallBackLater</option>
                      <option value="warm">Interested</option>
                      <option value="warm">NotInterested</option>
                      <option value="warm">SwitchedOff</option>
                      <option value="closed_won">Closed (Won)</option>
                      <option value="closed_lost">Closed (Lost)</option>
                    </select>
                  </div>
                  
                  {/* Lead temperature */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                      <Thermometer className="h-4 w-4 mr-1" />
                      Lead Temperature
                    </label>
                    <div className="flex space-x-4">
                      <label className={`flex items-center p-2 border rounded-md cursor-pointer ${
                        formData.temperature === 'hot' 
                          ? 'bg-red-50 border-red-300 text-red-800' 
                          : 'border-slate-300 hover:bg-slate-50'
                      }`}>
                        <input
                          type="radio"
                          name="temperature"
                          value="hot"
                          checked={formData.temperature === 'hot'}
                          onChange={() => setFormData({...formData, temperature: 'hot'})}
                          disabled={readOnly}
                          className="hidden"
                        />
                        <span className="text-sm">Hot</span>
                      </label>
                      
                      <label className={`flex items-center p-2 border rounded-md cursor-pointer ${
                        formData.temperature === 'warm' 
                          ? 'bg-amber-50 border-amber-300 text-amber-800' 
                          : 'border-slate-300 hover:bg-slate-50'
                      }`}>
                        <input
                          type="radio"
                          name="temperature"
                          value="warm"
                          checked={formData.temperature === 'warm'}
                          onChange={() => setFormData({...formData, temperature: 'warm'})}
                          disabled={readOnly}
                          className="hidden"
                        />
                        <span className="text-sm">Warm</span>
                      </label>
                      
                      <label className={`flex items-center p-2 border rounded-md cursor-pointer ${
                        formData.temperature === 'cold' 
                          ? 'bg-blue-50 border-blue-300 text-blue-800' 
                          : 'border-slate-300 hover:bg-slate-50'
                      }`}>
                        <input
                          type="radio"
                          name="temperature"
                          value="cold"
                          checked={formData.temperature === 'cold'}
                          onChange={() => setFormData({...formData, temperature: 'cold'})}
                          disabled={readOnly}
                          className="hidden"
                        />
                        <span className="text-sm">Cold</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Lead interests */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Interests
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.interests.includes('website')}
                          onChange={() => handleInterestToggle('website')}
                          disabled={readOnly}
                          className="rounded border-slate-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="text-sm text-slate-700">Website</span>
                      </label>
                      
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.interests.includes('app')}
                          onChange={() => handleInterestToggle('app')}
                          disabled={readOnly}
                          className="rounded border-slate-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="text-sm text-slate-700">App</span>
                      </label>
                      
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.interests.includes('crm')}
                          onChange={() => handleInterestToggle('crm')}
                          disabled={readOnly}
                          className="rounded border-slate-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="text-sm text-slate-700">CRM</span>
                      </label>
                      
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.interests.includes('both')}
                          onChange={() => handleInterestToggle('both')}
                          disabled={readOnly}
                          className="rounded border-slate-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="text-sm text-slate-700">Both</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Follow-up date */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={formData.followUpDate || ''}
                      onChange={(e) => setFormData({...formData, followUpDate: e.target.value || null})}
                      disabled={readOnly}
                      className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200"
                    />
                  </div>
                  
                  {/* Remarks */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Remarks
                    </label>
                    <textarea
                      rows={3}
                      value={formData.remarks}
                      onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                      disabled={readOnly}
                      className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200"
                      placeholder="Add notes about this lead..."
                    />
                  </div>
                  
                  {/* Action toggles */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                      <CheckSquare className="h-4 w-4 mr-1" />
                      Actions Taken
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.whatsappSent}
                          onChange={(e) => setFormData({...formData, whatsappSent: e.target.checked})}
                          disabled={readOnly}
                          className="rounded border-slate-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="text-sm text-slate-700">WhatsApp Sent</span>
                      </label>
                      
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.emailSent}
                          onChange={(e) => setFormData({...formData, emailSent: e.target.checked})}
                          disabled={readOnly}
                          className="rounded border-slate-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="text-sm text-slate-700">Email Sent</span>
                      </label>
                      
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.quotationSent}
                          onChange={(e) => setFormData({...formData, quotationSent: e.target.checked})}
                          disabled={readOnly}
                          className="rounded border-slate-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="text-sm text-slate-700">Quotation Sent</span>
                      </label>
                      
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.sampleWorkSent}
                          onChange={(e) => setFormData({...formData, sampleWorkSent: e.target.checked})}
                          disabled={readOnly}
                          className="rounded border-slate-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="text-sm text-slate-700">Sample Work Sent</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-between">
                  <div className="text-xs text-slate-500">
                    Last updated: {format(new Date(lead.updatedAt), 'MMM d, yyyy h:mm a')}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      className="px-3 py-2 text-sm font-medium rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    {!readOnly && (
                      <button
                        type="button"
                        className="px-3 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                        onClick={handleSave}
                      >
                        Update Lead
                      </button>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default LeadModal;