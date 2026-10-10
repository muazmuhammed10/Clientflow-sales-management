import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Building2,
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

export const ContactsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [contacts, setContacts] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    notes: '',
  });
  const [isCreating, setIsCreating] = useState(false);

  const fetchContacts = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        ...(search ? { search } : {}),
      });
      const res = await api.get(`/contacts?${params.toString()}`);
      if (res.success) {
        setContacts(res.data);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      error('Failed to Load Contacts', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchContacts(1), 200);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await api.post('/contacts', newContact);
      if (res.success) {
        success('Contact Created', `${newContact.firstName} was added.`);
        setCreateModalOpen(false);
        setNewContact({ firstName: '', lastName: '', email: '', phone: '', jobTitle: '', notes: '' });
        fetchContacts(1);
      }
    } catch (err: any) {
      error('Error Creating Contact', err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteContact = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.delete(`/contacts/${id}`);
      success('Contact Deleted', `${name} was removed.`);
      fetchContacts(pagination.page);
    } catch (err: any) {
      error('Failed to Delete Contact', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customer Contacts</h1>
          <p className="text-xs text-slate-400 mt-1">
            Directory of verified customer stakeholders, partners, and decision-makers
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Contact
        </Button>
      </div>

      {/* Search Input */}
      <Card className="p-4!">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search contacts by name, title, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-500/30 bg-[#0a0f1d] text-white placeholder-slate-500"
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0! overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Loading contacts..." />
        ) : contacts.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8 text-slate-400" />}
            title="No contacts found"
            description="Add your first customer contact or convert a qualified lead."
            actionLabel="Add Contact"
            onAction={() => setCreateModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-xs">
              <thead className="bg-[#131d35] text-slate-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Account Owner</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-[#0e1628]">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-[#131d35]/60 transition-colors">
                    <td className="py-3 px-4">
                      <div
                        onClick={() => navigate(`/contacts/${c.id}`)}
                        className="font-semibold text-white hover:text-brand-400 cursor-pointer flex items-center gap-1"
                      >
                        {c.firstName} {c.lastName}
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </div>
                      <div className="text-[11px] text-slate-400">{c.jobTitle || 'No title'}</div>
                    </td>
                    <td className="py-3 px-4">
                      {c.company ? (
                        <span className="font-medium text-slate-200 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {c.company.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{c.email || '—'}</td>
                    <td className="py-3 px-4 text-slate-300">{c.phone || '—'}</td>
                    <td className="py-3 px-4 text-slate-300">{c.owner?.firstName || 'Team'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteContact(c.id, `${c.firstName} ${c.lastName}`)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Contact"
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
          onPageChange={(p) => fetchContacts(p)}
        />
      </Card>

      {/* Create Contact Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Customer Contact"
        description="Save contact info and link to company account"
        maxWidth="md"
      >
        <form onSubmit={handleCreateContact} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={newContact.firstName}
              onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={newContact.lastName}
              onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })}
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={newContact.email}
            onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone"
              value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
            />
            <Input
              label="Job Title"
              value={newContact.jobTitle}
              onChange={(e) => setNewContact({ ...newContact, jobTitle: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Save Contact
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
