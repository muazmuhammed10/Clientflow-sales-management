import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Search,
  Plus,
  Building2,
  User,
  Trash2,
  ExternalLink,
  Kanban,
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Pagination } from '../../components/common/Pagination';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

export const DealsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [deals, setDeals] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchDeals = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        ...(search ? { search } : {}),
      });
      const res = await api.get(`/deals?${params.toString()}`);
      if (res.success) {
        setDeals(res.data);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      error('Failed to Load Deals', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchDeals(1), 200);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDeleteDeal = async (id: string, name: string) => {
    if (!window.confirm(`Delete deal "${name}"?`)) return;
    try {
      await api.delete(`/deals/${id}`);
      success('Deal Deleted', `Deal "${name}" was removed.`);
      fetchDeals(pagination.page);
    } catch (err: any) {
      error('Failed to Delete Deal', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sales Deals</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track active revenue opportunities and closed business contracts
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/pipeline')}
            leftIcon={<Kanban className="w-4 h-4" />}
          >
            Kanban Board
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/pipeline')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Opportunity
          </Button>
        </div>
      </div>

      <Card className="p-4!">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search deals by name or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-500/30 bg-[#0a0f1d] text-white placeholder-slate-500"
          />
        </div>
      </Card>

      <Card className="p-0! overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Loading sales deals..." />
        ) : deals.length === 0 ? (
          <EmptyState
            icon={<DollarSign className="w-8 h-8 text-slate-400" />}
            title="No deals found"
            description="Create your first deal in the pipeline or convert a lead."
            actionLabel="Go to Sales Pipeline"
            onAction={() => navigate('/pipeline')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-xs">
              <thead className="bg-[#131d35] text-slate-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Deal Name</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Pipeline Stage</th>
                  <th className="py-3 px-4">Probability</th>
                  <th className="py-3 px-4">Account / Company</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Expected Close</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-[#0e1628]">
                {deals.map((d) => (
                  <tr key={d.id} className="hover:bg-[#131d35]/60 transition-colors">
                    <td className="py-3 px-4">
                      <div
                        onClick={() => navigate(`/deals/${d.id}`)}
                        className="font-semibold text-white hover:text-brand-400 cursor-pointer flex items-center gap-1.5"
                      >
                        {d.name}
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-400">
                      ${Number(d.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                        {d.stage?.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{d.probability}%</td>
                    <td className="py-3 px-4 text-slate-200">
                      {d.company ? d.company.name : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{d.owner?.firstName || '—'}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {d.expectedCloseDate ? new Date(d.expectedCloseDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteDeal(d.id, d.name)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Deal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={pagination.limit}
          onPageChange={(p) => fetchDeals(p)}
        />
      </Card>
    </div>
  );
};
