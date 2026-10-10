import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Search,
  Plus,
  Globe,
  MapPin,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Card } from '../../components/common/Card';
import { Pagination } from '../../components/common/Pagination';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

export const CompaniesPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [companies, setCompanies] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    website: '',
    industry: '',
    size: '',
    city: '',
    country: '',
    description: '',
  });
  const [isCreating, setIsCreating] = useState(false);

  const fetchCompanies = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        ...(search ? { search } : {}),
      });
      const res = await api.get(`/companies?${params.toString()}`);
      if (res.success) {
        setCompanies(res.data);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      error('Failed to Load Companies', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchCompanies(1), 200);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await api.post('/companies', newCompany);
      if (res.success) {
        success('Company Created', `${newCompany.name} was added.`);
        setCreateModalOpen(false);
        setNewCompany({ name: '', website: '', industry: '', size: '', city: '', country: '', description: '' });
        fetchCompanies(1);
      }
    } catch (err: any) {
      error('Error Creating Company', err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCompany = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete company ${name}? Connected contacts will be preserved.`)) return;
    try {
      await api.delete(`/companies/${id}`);
      success('Company Deleted', `${name} was removed.`);
      fetchCompanies(pagination.page);
    } catch (err: any) {
      error('Failed to Delete Company', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Companies & Accounts</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage target business accounts, enterprise clients, and organization relationships
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Company
        </Button>
      </div>

      <Card className="p-4!">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search companies by name, industry, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-500/30 bg-[#0a0f1d] text-white placeholder-slate-500"
          />
        </div>
      </Card>

      <Card className="p-0! overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Loading enterprise accounts..." />
        ) : companies.length === 0 ? (
          <EmptyState
            icon={<Building2 className="w-8 h-8 text-slate-400" />}
            title="No companies found"
            description="Add your first target company or convert a lead."
            actionLabel="Add Company"
            onAction={() => setCreateModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-xs">
              <thead className="bg-[#131d35] text-slate-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Industry</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Contacts</th>
                  <th className="py-3 px-4">Deals</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-[#0e1628]">
                {companies.map((c) => (
                  <tr key={c.id} className="hover:bg-[#131d35]/60 transition-colors">
                    <td className="py-3 px-4">
                      <div
                        onClick={() => navigate(`/companies/${c.id}`)}
                        className="font-semibold text-white hover:text-brand-400 cursor-pointer flex items-center gap-1.5"
                      >
                        {c.name}
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </div>
                      {c.website && (
                        <a
                          href={c.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-brand-400 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Globe className="w-3 h-3" />
                          {c.website.replace('https://', '').replace('http://', '')}
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{c.industry || '—'}</td>
                    <td className="py-3 px-4 text-slate-300">
                      {[c.city, c.country].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{c.size || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white">{c._count?.contacts || 0}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white">{c._count?.deals || 0}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteCompany(c.id, c.name)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Company"
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
          onPageChange={(p) => fetchCompanies(p)}
        />
      </Card>

      {/* Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Company"
        description="Register a new business account in your CRM"
        maxWidth="md"
      >
        <form onSubmit={handleCreateCompany} className="space-y-4">
          <Input
            label="Company Name"
            value={newCompany.name}
            onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
            placeholder="Acme Global Inc."
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Website"
              value={newCompany.website}
              onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
              placeholder="https://acmeglobal.com"
            />
            <Input
              label="Industry"
              value={newCompany.industry}
              onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
              placeholder="Software / Healthcare"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              value={newCompany.city}
              onChange={(e) => setNewCompany({ ...newCompany, city: e.target.value })}
            />
            <Input
              label="Country"
              value={newCompany.country}
              onChange={(e) => setNewCompany({ ...newCompany, country: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Save Company
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
