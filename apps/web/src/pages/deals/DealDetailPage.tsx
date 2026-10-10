import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  DollarSign,
  Building2,
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  Plus,
  Sparkles,
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const DealDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [deal, setDeal] = useState<any>(null);
  const [pipeline, setPipeline] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Lost modal
  const [lossModalOpen, setLossModalOpen] = useState(false);
  const [lossReason, setLossReason] = useState('');
  const [targetLostStageId, setTargetLostStageId] = useState('');

  // Activity Log
  const [noteContent, setNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const fetchDealData = async () => {
    try {
      const [dRes, pRes] = await Promise.all([
        api.get(`/deals/${id}`),
        api.get('/pipelines'),
      ]);

      if (dRes.success) setDeal(dRes.data);
      if (pRes.success) setPipeline(pRes.data);
    } catch (err: any) {
      error('Failed to Load Deal', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDealData();
  }, [id]);

  const handleStageChange = async (stageId: string) => {
    const targetStage = pipeline?.stages?.find((s: any) => s.id === stageId);
    if (targetStage?.isLost) {
      setTargetLostStageId(stageId);
      setLossModalOpen(true);
      return;
    }

    try {
      const res = await api.patch(`/deals/${id}/stage`, { stageId });
      if (res.success) {
        success('Stage Updated', `Deal moved to ${targetStage.name}`);
        fetchDealData();
      }
    } catch (err: any) {
      error('Stage Update Failed', err.message);
    }
  };

  const handleConfirmLost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.patch(`/deals/${id}/stage`, {
        stageId: targetLostStageId,
        lossReason,
      });
      if (res.success) {
        success('Deal Marked Closed Lost', 'Loss reason recorded for reporting analytics.');
        setLossModalOpen(false);
        setLossReason('');
        fetchDealData();
      }
    } catch (err: any) {
      error('Failed to Update Deal', err.message);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setIsSubmittingNote(true);
    try {
      const res = await api.post('/activities', {
        title: 'Deal Update Logged',
        description: noteContent,
        type: 'NOTE',
        dealId: id,
      });
      if (res.success) {
        success('Note Saved', 'Activity logged to deal timeline.');
        setNoteContent('');
        fetchDealData();
      }
    } catch (err: any) {
      error('Failed to Log Note', err.message);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading opportunity details..." />;
  if (!deal) return <div className="text-center py-12 text-slate-500">Deal record not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/pipeline')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Pipeline
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{deal.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {deal.company?.name || 'Account'} • Owner: {deal.owner?.firstName || 'Team'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-extrabold text-slate-900">
            ${Number(deal.amount).toLocaleString()}
          </div>
          <span className="text-xs font-semibold text-brand-600">
            Stage Probability: {deal.probability}%
          </span>
        </div>
      </div>

      {/* Stage Progression Bar */}
      <Card className="p-4!">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2.5">
          <span>Sales Stage Progression</span>
          <span className="text-slate-800">Current: {deal.stage?.name}</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {pipeline?.stages?.map((stage: any, idx: number) => {
            const isCurrent = deal.stageId === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => handleStageChange(stage.id)}
                className={`flex-1 min-w-28 py-2 px-3 rounded-lg text-xs font-bold text-center transition-all ${
                  isCurrent
                    ? stage.isWon
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : stage.isLost
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {stage.name}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Overview Card */}
        <div className="space-y-6">
          <Card header={<h3 className="text-sm font-bold text-slate-900">Opportunity Overview</h3>}>
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Expected Close Date</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : 'None set'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Account / Company</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {deal.company?.name || 'Unlinked'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Primary Contact</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : 'Unlinked'}
                </span>
              </div>
              {deal.lossReason && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
                  <span className="font-bold block mb-1">Loss Reason:</span>
                  <p>{deal.lossReason}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Timeline & Notes */}
        <div className="lg:col-span-2">
          <Card header={<h3 className="text-sm font-bold text-slate-900">Activity Timeline</h3>}>
            <form onSubmit={handleAddNote} className="space-y-3 mb-6">
              <textarea
                rows={2}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Log proposal update, negotiation notes, or buyer feedback..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"
                required
              />
              <div className="flex justify-end">
                <Button size="sm" type="submit" isLoading={isSubmittingNote} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Log Activity
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              {deal.activities?.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No activities logged yet.</p>
              ) : (
                deal.activities?.map((act: any) => (
                  <div key={act.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{act.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {new Date(act.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1">{act.description}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Lost Reason Modal */}
      <Modal
        isOpen={lossModalOpen}
        onClose={() => setLossModalOpen(false)}
        title="Mark Deal Closed Lost"
        description="Record why this opportunity was lost to optimize future sales cycles"
        maxWidth="md"
      >
        <form onSubmit={handleConfirmLost} className="space-y-4">
          <Input
            label="Loss Reason"
            value={lossReason}
            onChange={(e) => setLossReason(e.target.value)}
            placeholder="e.g. Budget cancelled, competitor pricing, feature gap"
            required
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setLossModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger">
              Confirm Closed Lost
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
