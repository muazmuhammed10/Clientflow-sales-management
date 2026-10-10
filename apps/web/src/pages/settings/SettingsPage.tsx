import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Lock,
  Building2,
  User,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Card } from '../../components/common/Card';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { success, error } = useToast();

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Organization settings
  const [orgName, setOrgName] = useState(user?.organizationName || '');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [isSavingOrg, setIsSavingOrg] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      error('Password Mismatch', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      error('Weak Password', 'New password must be at least 8 characters long');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (res.success) {
        success('Password Updated', 'Your account credentials have been changed.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      error('Error Changing Password', err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingOrg(true);
    try {
      const res = await api.patch('/organizations', {
        name: orgName,
        currency,
        timezone,
      });

      if (res.success) {
        success('Workspace Updated', 'Organization settings have been saved.');
        updateUser({ organizationName: orgName, currency, timezone });
      }
    } catch (err: any) {
      error('Error Updating Organization', err.message);
    } finally {
      setIsSavingOrg(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal user profile and organization configuration
        </p>
      </div>

      {/* User Profile Card */}
      <Card
        header={
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-bold text-white">Your User Profile</h3>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">Full Name</span>
            <span className="font-semibold text-white text-sm">
              {user?.firstName} {user?.lastName}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Email Address</span>
            <span className="font-semibold text-white text-sm">{user?.email}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Assigned Role</span>
            <span className="font-semibold text-brand-400 text-sm capitalize">
              {user?.role?.replace('_', ' ').toLowerCase()}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Organization Workspace</span>
            <span className="font-semibold text-white text-sm">
              {user?.organizationName}
            </span>
          </div>
        </div>
      </Card>

      {/* Organization Workspace Settings (If Admin) */}
      {(user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN') && (
        <Card
          header={
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-400" />
              <h3 className="text-sm font-bold text-white">Workspace Settings</h3>
            </div>
          }
        >
          <form onSubmit={handleOrgSubmit} className="space-y-4">
            <Input
              label="Organization Name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Primary Reporting Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                options={[
                  { value: 'USD', label: 'USD ($)' },
                  { value: 'EUR', label: 'EUR (€)' },
                  { value: 'GBP', label: 'GBP (£)' },
                  { value: 'CAD', label: 'CAD ($)' },
                ]}
              />

              <Select
                label="System Timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                options={[
                  { value: 'UTC', label: 'UTC' },
                  { value: 'America/New_York', label: 'Eastern Time (ET)' },
                  { value: 'America/Chicago', label: 'Central Time (CT)' },
                  { value: 'America/Denver', label: 'Mountain Time (MT)' },
                  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
                  { value: 'Europe/London', label: 'London (GMT)' },
                ]}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" isLoading={isSavingOrg}>
                Save Workspace Settings
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Change Password Card */}
      <Card
        header={
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
          </div>
        }
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={isChangingPassword}>
              Update Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
