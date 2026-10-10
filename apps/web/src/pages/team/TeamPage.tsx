import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  UserPlus,
  Mail,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Shield,
  UserCheck,
  UserX,
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const TeamPage: React.FC = () => {
  const { success, error } = useToast();

  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Invite Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('SALES_REP');
  const [isInviting, setIsInviting] = useState(false);
  const [latestInviteLink, setLatestInviteLink] = useState<string | null>(null);

  const fetchTeam = async () => {
    setIsLoading(true);
    try {
      const [memRes, invRes] = await Promise.all([
        api.get('/team/members'),
        api.get('/team/invitations'),
      ]);

      if (memRes.success) setMembers(memRes.data);
      if (invRes.success) setInvitations(invRes.data);
    } catch (err: any) {
      error('Failed to Load Team', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    try {
      const res = await api.post('/team/invite', {
        email: inviteEmail,
        role: inviteRole,
      });

      if (res.success) {
        success('Invitation Generated', `Sent to ${inviteEmail}`);
        if (res.data?.invitationLink) {
          setLatestInviteLink(res.data.invitationLink);
        }
        setInviteEmail('');
        fetchTeam();
      }
    } catch (err: any) {
      error('Invitation Failed', err.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, role: string) => {
    try {
      const res = await api.patch(`/team/members/${memberId}/role`, { role });
      if (res.success) {
        success('Role Updated', 'Member permission levels changed.');
        fetchTeam();
      }
    } catch (err: any) {
      error('Failed to Update Role', err.message);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const res = await api.patch(`/team/members/${userId}/status`);
      if (res.success) {
        success('Status Changed', res.data.isActive ? 'User activated' : 'User deactivated');
        fetchTeam();
      }
    } catch (err: any) {
      error('Status Update Failed', err.message);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading team directory..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Team & Permissions</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage organization members, assign roles, and grant pipeline access
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setLatestInviteLink(null);
            setInviteModalOpen(true);
          }}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Invite Member
        </Button>
      </div>

      {/* Members Directory */}
      <Card header={<h3 className="text-sm font-bold text-white">Active Organization Members</h3>}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-xs">
            <thead className="bg-[#131d35] text-slate-300 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Role & Access</th>
                <th className="py-3 px-4">Active Leads</th>
                <th className="py-3 px-4">Active Deals</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#0e1628]">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-[#131d35]/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">
                      {m.firstName} {m.lastName}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{m.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      className="text-xs border border-white/10 rounded-lg px-2.5 py-1 bg-[#0a0f1d] font-medium text-white focus:outline-none"
                    >
                      <option value="ORG_ADMIN" className="bg-[#0e1628]">Organization Admin</option>
                      <option value="SALES_MANAGER" className="bg-[#0e1628]">Sales Manager</option>
                      <option value="SALES_REP" className="bg-[#0e1628]">Sales Representative</option>
                      <option value="READ_ONLY_ANALYST" className="bg-[#0e1628]">Read-Only Analyst</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{m.counts?.assignedLeads || 0}</td>
                  <td className="py-3 px-4 text-slate-300">{m.counts?.ownedDeals || 0}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.isActive
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {m.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      size="sm"
                      variant={m.isActive ? 'ghost' : 'outline'}
                      onClick={() => handleToggleStatus(m.userId)}
                      className="text-[11px] py-1! px-2!"
                    >
                      {m.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card header={<h3 className="text-sm font-bold text-slate-900">Pending Invitations</h3>}>
          <div className="divide-y divide-slate-100 text-xs">
            {invitations.map((inv) => (
              <div key={inv.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900">{inv.email}</span>
                  <span className="text-slate-500 ml-2">Role: {inv.role}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Invited on {new Date(inv.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Invite Member Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite New Colleague"
        description="Generate a secure invitation link for your team member"
        maxWidth="md"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Colleague Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            required
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Select
            label="Role & Permission Level"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            options={[
              { value: 'SALES_REP', label: 'Sales Representative' },
              { value: 'SALES_MANAGER', label: 'Sales Manager' },
              { value: 'ORG_ADMIN', label: 'Organization Admin' },
              { value: 'READ_ONLY_ANALYST', label: 'Read-Only Analyst' },
            ]}
          />

          {latestInviteLink && (
            <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl space-y-1.5 text-xs">
              <span className="font-bold text-brand-900 block">Invitation Link Generated:</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={latestInviteLink}
                  className="bg-white border rounded p-1.5 text-[11px] text-slate-700 w-full"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(latestInviteLink);
                    success('Copied Link!', 'Share this URL with the invitee.');
                  }}
                  className="p-1.5 rounded bg-brand-600 text-white hover:bg-brand-700"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setInviteModalOpen(false)}>
              Done
            </Button>
            <Button type="submit" isLoading={isInviting}>
              Generate Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
