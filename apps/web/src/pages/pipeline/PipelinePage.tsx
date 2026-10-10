import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  User,
  ExternalLink,
  Kanban as KanbanIcon,
  List,
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const PipelinePage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [pipeline, setPipeline] = useState<any>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Create Deal Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newDeal, setNewDeal] = useState({
    name: '',
    amount: 25000,
    stageId: '',
    companyName: '',
    expectedCloseDate: '',
    description: '',
  });
  const [isCreating, setIsCreating] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pipeRes, dealsRes] = await Promise.all([
        api.get('/pipelines'),
        api.get('/deals?limit=100'),
      ]);

      if (pipeRes.success && pipeRes.data) {
        setPipeline(pipeRes.data);
        if (pipeRes.data.stages?.length > 0 && !newDeal.stageId) {
          setNewDeal((prev) => ({ ...prev, stageId: pipeRes.data.stages[0].id }));
        }
      }
      if (dealsRes.success && dealsRes.data) {
        setDeals(dealsRes.data);
      }
    } catch (err: any) {
      error('Failed to Load Pipeline', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (dealId: string) => {
    setDraggedDealId(dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stageId: string) => {
    if (!draggedDealId) return;

    const dealToMove = deals.find((d) => d.id === draggedDealId);
    if (!dealToMove || dealToMove.stageId === stageId) {
      setDraggedDealId(null);
      return;
    }

    const previousStageId = dealToMove.stageId;
    const targetStage = pipeline.stages.find((s: any) => s.id === stageId);

    // Optimistic UI Update
    setDeals((prev) =>
      prev.map((d) =>
        d.id === draggedDealId
          ? {
              ...d,
              stageId,
              stage: targetStage,
              probability: targetStage?.probability ?? d.probability,
            }
          : d
      )
    );
    setDraggedDealId(null);

    try {
      const res = await api.patch(`/deals/${dealToMove.id}/stage`, {
        stageId,
      });

      if (res.success) {
        success('Deal Moved', `Moved "${dealToMove.name}" to ${targetStage.name}`);
      }
    } catch (err: any) {
      // Rollback on failure
      error('Stage Update Failed', err.message);
      setDeals((prev) =>
        prev.map((d) => (d.id === dealToMove.id ? { ...d, stageId: previousStageId } : d))
      );
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await api.post('/deals', {
        name: newDeal.name,
        amount: Number(newDeal.amount),
        stageId: newDeal.stageId,
        expectedCloseDate: newDeal.expectedCloseDate || undefined,
        description: newDeal.description || undefined,
      });

      if (res.success) {
        success('Deal Created', `"${newDeal.name}" added to pipeline.`);
        setCreateModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      error('Error Creating Deal', err.message);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading interactive sales pipeline..." />;

  const filteredDeals = deals.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.company?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalOpenValue = filteredDeals
    .filter((d) => !d.stage?.isWon && !d.stage?.isLost)
    .reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <div className="space-y-6">
      {/* Pipeline Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">Sales Pipeline</h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
              Active Value: ${totalOpenValue.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Drag and drop deals between stages to advance opportunities through your sales cycle
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="bg-[#0a0f1d] border border-white/10 rounded-lg p-0.5 flex items-center">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'kanban' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Kanban Board View"
            >
              <KanbanIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Table List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Deal
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="w-full sm:w-80 relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          placeholder="Filter deals or companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-500/30 bg-[#0a0f1d] text-white placeholder-slate-500"
        />
      </div>

      {/* Interactive Kanban Board */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-6 items-start min-h-[calc(100vh-250px)]">
          {pipeline?.stages?.map((stage: any) => {
            const stageDeals = filteredDeals.filter((d) => d.stageId === stage.id);
            const stageValue = stageDeals.reduce((sum, d) => sum + Number(d.amount), 0);

            return (
              <div
                key={stage.id}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage.id)}
                className={`w-72 flex-shrink-0 rounded-xl border flex flex-col max-h-[calc(100vh-270px)] transition-colors ${
                  stage.isWon
                    ? 'border-emerald-500/30 bg-emerald-950/20'
                    : stage.isLost
                    ? 'border-rose-500/30 bg-rose-950/20'
                    : 'border-white/10 bg-[#0c1221]/90'
                }`}
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-white/10 bg-[#131d35] rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      {stage.isWon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {stage.isLost && <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                      {stage.name}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-300 px-1.5 py-0.5 rounded bg-white/10">
                      {stageDeals.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>${stageValue.toLocaleString()}</span>
                    <span>{stage.probability}% win prob</span>
                  </div>
                </div>

                {/* Deal Cards Container */}
                <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                  {stageDeals.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-slate-500 border border-dashed border-white/10 rounded-lg">
                      Drop deals here
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={() => handleDragStart(deal.id)}
                        onClick={() => navigate(`/deals/${deal.id}`)}
                        className="p-3.5 rounded-xl bg-[#0e1628] border border-white/10 shadow-md hover:border-brand-500/50 transition-all cursor-grab active:cursor-grabbing group select-none"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-bold text-white group-hover:text-brand-400 leading-snug line-clamp-2">
                            {deal.name}
                          </h4>
                          <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </div>

                        {deal.company && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 truncate">
                            <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{deal.company.name}</span>
                          </div>
                        )}

                        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                          <span className="text-xs font-extrabold text-emerald-400">
                            ${Number(deal.amount).toLocaleString()}
                          </span>

                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {deal.owner?.firstName || 'Team'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Alternative Table List View */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Deal Name</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Win Prob.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDeals.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => navigate(`/deals/${d.id}`)}
                  className="hover:bg-slate-50 cursor-pointer"
                >
                  <td className="py-3 px-4 font-semibold text-slate-900">{d.name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                      {d.stage?.name}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    ${Number(d.amount).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{d.company?.name || '—'}</td>
                  <td className="py-3 px-4 text-slate-600">{d.owner?.firstName || '—'}</td>
                  <td className="py-3 px-4 text-slate-600">{d.probability}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Deal Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Sales Deal"
        description="Add a new opportunity into the sales pipeline"
        maxWidth="md"
      >
        <form onSubmit={handleCreateDeal} className="space-y-4">
          <Input
            label="Deal Name"
            value={newDeal.name}
            onChange={(e) => setNewDeal({ ...newDeal, name: e.target.value })}
            placeholder="e.g. Enterprise License Expansion"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount ($)"
              type="number"
              min="0"
              value={newDeal.amount}
              onChange={(e) => setNewDeal({ ...newDeal, amount: Number(e.target.value) })}
              required
            />
            <Select
              label="Pipeline Stage"
              value={newDeal.stageId}
              onChange={(e) => setNewDeal({ ...newDeal, stageId: e.target.value })}
              options={pipeline?.stages?.map((s: any) => ({ value: s.id, label: s.name })) || []}
            />
          </div>

          <Input
            label="Expected Close Date"
            type="date"
            value={newDeal.expectedCloseDate}
            onChange={(e) => setNewDeal({ ...newDeal, expectedCloseDate: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Create Deal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
