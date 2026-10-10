import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Sparkles,
  Phone,
  Mail,
  Building,
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Card } from '../../components/common/Card';
import { Pagination } from '../../components/common/Pagination';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { getStatusBadge, getPriorityBadge } from '../../components/common/Badge';
import { ConvertLeadModal } from './ConvertLeadModal';

export const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [leads, setLeads] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [priority, setPriority] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedLeadForConvert, setSelectedLeadForConvert] = useState<any>(null);

  // Create Form State
  const [newLead, setNewLead] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    jobTitle: '',
    source: 'WEBSITE',
    status: 'NEW',
    priority: 'MEDIUM',
    estimatedValue: 10000,
    notes: '',
  });
  const [isCreating, setIsCreating] = useState(false);

  const fetchLeads = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        ...(source ? { source } : {}),
        ...(priority ? { priority } : {}),
      });

      const res = await api.get(`/leads?${params.toString()}`);
      if (res.success) {
        setLeads(res.data);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      error('Failed to Load Leads', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [search, status, source, priority, error]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads(1);
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchLeads]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await api.post('/leads', {
        ...newLead,
        estimatedValue: Number(newLead.estimatedValue),
      });
      if (res.success) {
        success('Lead Created', `${newLead.firstName} ${newLead.lastName} was added.`);
        setCreateModalOpen(false);
        setNewLead({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          companyName: '',
          jobTitle: '',
          source: 'WEBSITE',
          status: 'NEW',
          priority: 'MEDIUM',
          estimatedValue: 10000,
          notes: '',
        });
        fetchLeads(1);
      }
    } catch (err: any) {
      error('Error Creating Lead', err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteLead = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete lead ${name}?`)) return;
    try {
      await api.delete(`/leads/${id}`);
      success('Lead Deleted', `${name} was removed.`);
      fetchLeads(pagination.page);
    } catch (err: any) {
      error('Failed to Delete Lead', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Leads & Prospects</h1>
          <p className="text-xs text-slate-400 mt-1">
            Capture, qualify, and convert potential customers into sales opportunities
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Create Lead
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4!">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, company, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-[#0a0f1d] text-white placeholder-slate-500"
            />
          </div>

          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'NEW', label: 'New' },
              { value: 'CONTACTED', label: 'Contacted' },
              { value: 'QUALIFIED', label: 'Qualified' },
              { value: 'UNQUALIFIED', label: 'Unqualified' },
              { value: 'CONVERTED', label: 'Converted' },
            ]}
          />

          <Select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            options={[
              { value: '', label: 'All Sources' },
              { value: 'WEBSITE', label: 'Website' },
              { value: 'REFERRAL', label: 'Referral' },
              { value: 'SOCIAL_MEDIA', label: 'Social Media' },
              { value: 'EMAIL_CAMPAIGN', label: 'Email Campaign' },
              { value: 'EVENT', label: 'Event' },
              { value: 'COLD_OUTREACH', label: 'Cold Outreach' },
            ]}
          />

          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={[
              { value: '', label: 'All Priorities' },
              { value: 'HIGH', label: 'High Priority' },
              { value: 'MEDIUM', label: 'Medium Priority' },
              { value: 'LOW', label: 'Low Priority' },
            ]}
          />
        </div>
      </Card>

      {/* Leads Table */}
      <Card className="p-0! overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Loading lead database..." />
        ) : leads.length === 0 ? (
          <EmptyState
            icon={<UserPlus className="w-8 h-8 text-slate-400" />}
            title="No leads found"
            description="Adjust your search filters or create a new lead to start building your sales pipeline."
            actionLabel="Create First Lead"
            onAction={() => setCreateModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-xs">
              <thead className="bg-[#131d35] text-slate-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Lead Name</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Est. Value</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-[#0e1628]">
                {leads.map((l) => (
                  <tr key={l.id} className="hover:bg-[#131d35]/60 transition-colors">
                    <td className="py-3 px-4">
                      <div
                        onClick={() => navigate(`/leads/${l.id}`)}
                        className="font-semibold text-white hover:text-brand-400 cursor-pointer flex items-center gap-1.5"
                      >
                        {l.firstName} {l.lastName}
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{l.email || 'No email'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{l.companyName || '—'}</div>
                      <div className="text-[11px] text-slate-400">{l.jobTitle || '—'}</div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(l.status)}</td>
                    <td className="py-3 px-4">{getPriorityBadge(l.priority)}</td>
                    <td className="py-3 px-4 font-semibold text-white">
                      ${Number(l.estimatedValue).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-400 capitalize">
                      {l.source.replace(/_/g, ' ').toLowerCase()}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}` : 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {l.status !== 'CONVERTED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedLeadForConvert(l);
                              setConvertModalOpen(true);
                            }}
                            className="text-[11px] py-1! px-2!"
                            leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          >
                            Convert
                          </Button>
                        )}
                        <button
                          onClick={() => handleDeleteLead(l.id, `${l.firstName} ${l.lastName}`)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
          onPageChange={(page) => fetchLeads(page)}
        />
      </Card>

      {/* Create Lead Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New Lead"
        description="Record a new sales lead and set qualification status"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateLead} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={newLead.firstName}
              onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={newLead.lastName}
              onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              value={newLead.email}
              onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={newLead.phone}
              onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Company Name"
              value={newLead.companyName}
              onChange={(e) => setNewLead({ ...newLead, companyName: e.target.value })}
            />
            <Input
              label="Job Title"
              value={newLead.jobTitle}
              onChange={(e) => setNewLead({ ...newLead, jobTitle: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Source"
              value={newLead.source}
              onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
              options={[
                { value: 'WEBSITE', label: 'Website' },
                { value: 'REFERRAL', label: 'Referral' },
                { value: 'SOCIAL_MEDIA', label: 'Social Media' },
                { value: 'EMAIL_CAMPAIGN', label: 'Email Campaign' },
                { value: 'EVENT', label: 'Event' },
                { value: 'COLD_OUTREACH', label: 'Cold Outreach' },
                { value: 'OTHER', label: 'Other' },
              ]}
            />
            <Select
              label="Status"
              value={newLead.status}
              onChange={(e) => setNewLead({ ...newLead, status: e.target.value })}
              options={[
                { value: 'NEW', label: 'New' },
                { value: 'CONTACTED', label: 'Contacted' },
                { value: 'QUALIFIED', label: 'Qualified' },
                { value: 'UNQUALIFIED', label: 'Unqualified' },
              ]}
            />
            <Input
              label="Est. Value ($)"
              type="number"
              min="0"
              value={newLead.estimatedValue}
              onChange={(e) => setNewLead({ ...newLead, estimatedValue: Number(e.target.value) })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Create Lead
            </Button>
          </div>
        </form>
      </Modal>

      {/* Convert Lead Modal */}
      {selectedLeadForConvert && (
        <ConvertLeadModal
          isOpen={convertModalOpen}
          onClose={() => {
            setConvertModalOpen(false);
            setSelectedLeadForConvert(null);
          }}
          lead={selectedLeadForConvert}
          onConverted={() => fetchLeads(pagination.page)}
        />
      )}
    </div>
  );
};
