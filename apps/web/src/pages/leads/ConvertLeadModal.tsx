import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Building2, User, DollarSign, CheckCircle2 } from 'lucide-react';

interface ConvertLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  onConverted: () => void;
}

export const ConvertLeadModal: React.FC<ConvertLeadModalProps> = ({
  isOpen,
  onClose,
  lead,
  onConverted,
}) => {
  const { success, error } = useToast();
  const [stages, setStages] = useState<any[]>([]);
  const [createCompany, setCreateCompany] = useState(true);
  const [companyName, setCompanyName] = useState(lead?.companyName || '');
  const [createContact, setCreateContact] = useState(true);
  const [createDeal, setCreateDeal] = useState(true);
  const [dealName, setDealName] = useState(`${lead?.companyName || lead?.lastName || 'New'} - Opportunity`);
  const [dealAmount, setDealAmount] = useState<number>(Number(lead?.estimatedValue) || 10000);
  const [dealStageId, setDealStageId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (lead) {
      setCompanyName(lead.companyName || `${lead.lastName} Co`);
      setDealName(`${lead.companyName || lead.lastName} - Strategic Opportunity`);
      setDealAmount(Number(lead.estimatedValue) || 10000);
    }

    const fetchPipeline = async () => {
      try {
        const res = await api.get('/pipelines');
        if (res.success && res.data?.stages) {
          setStages(res.data.stages);
          if (res.data.stages.length > 0) {
            setDealStageId(res.data.stages[0].id);
          }
        }
      } catch {
        // Silently handle
      }
    };

    if (isOpen) {
      fetchPipeline();
    }
  }, [isOpen, lead]);

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    setIsLoading(true);
    try {
      const res = await api.post(`/leads/${lead.id}/convert`, {
        createCompany,
        companyName,
        createContact,
        createDeal,
        dealName,
        dealAmount: Number(dealAmount),
        dealStageId,
      });

      if (res.success) {
        success('Lead Converted!', 'Successfully created customer account, contact, and deal.');
        onConverted();
        onClose();
      }
    } catch (err: any) {
      error('Conversion Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Convert Qualified Lead"
      description={`Transform ${lead?.firstName} ${lead?.lastName} into a customer organization, contact, and active deal.`}
      maxWidth="xl"
    >
      <form onSubmit={handleConvert} className="space-y-5">
        {/* Company creation card */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={createCompany}
              onChange={(e) => setCreateCompany(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-brand-600" />
              Create or Link Organization / Company
            </span>
          </label>
          {createCompany && (
            <Input
              label="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          )}
        </div>

        {/* Contact creation card */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={createContact}
              onChange={(e) => setCreateContact(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <User className="w-4 h-4 text-brand-600" />
              Create Contact for {lead?.firstName} {lead?.lastName}
            </span>
          </label>
          <p className="text-xs text-slate-500 pl-6.5">
            Will preserve contact email ({lead?.email || 'N/A'}) and phone ({lead?.phone || 'N/A'}).
          </p>
        </div>

        {/* Opportunity / Deal creation card */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={createDeal}
              onChange={(e) => setCreateDeal(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-brand-600" />
              Create Sales Pipeline Opportunity (Deal)
            </span>
          </label>

          {createDeal && (
            <div className="space-y-3 pl-6.5">
              <Input
                label="Opportunity Name"
                value={dealName}
                onChange={(e) => setDealName(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Estimated Value ($)"
                  type="number"
                  min="0"
                  value={dealAmount}
                  onChange={(e) => setDealAmount(Number(e.target.value))}
                  required
                />
                <Select
                  label="Initial Pipeline Stage"
                  value={dealStageId}
                  onChange={(e) => setDealStageId(e.target.value)}
                  options={stages.map((s) => ({ value: s.id, label: s.name }))}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Confirm & Convert Lead
          </Button>
        </div>
      </form>
    </Modal>
  );
};
