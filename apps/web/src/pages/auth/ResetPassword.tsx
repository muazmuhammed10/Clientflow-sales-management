import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      error('Password Mismatch', 'The passwords entered do not match');
      return;
    }

    if (password.length < 8) {
      error('Weak Password', 'Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { token, password });
      if (res.success) {
        success('Password Reset Complete', 'You can now log in with your new password');
        navigate('/login');
      }
    } catch (err: any) {
      error('Reset Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Create New Password
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Enter your recovery token and choose a secure new password
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Reset Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste token here..."
              required
            />

            <Input
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              helperText="Must include uppercase and number"
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Update Password
            </Button>
          </form>

          <div className="mt-6 text-center text-xs">
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-500">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
