import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export const ForgotPassword: React.FC = () => {
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [devToken, setDevToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.success) {
        setIsSubmitted(true);
        if (res.devResetToken) {
          setDevToken(res.devResetToken);
        }
        success('Reset Instructions Sent', 'Check your email inbox or use the test token below.');
      }
    } catch (err: any) {
      error('Request Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Reset Your Password
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Enter your email to receive a secure password recovery token
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {!isSubmitted ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Work Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Button
                type="submit"
                className="w-full mt-2"
                size="lg"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Send Reset Link
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Request Processed</h3>
              <p className="text-xs text-slate-500">
                If an account exists for {email}, a password reset token has been issued.
              </p>

              {devToken && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs">
                  <span className="font-semibold text-slate-700 block mb-1">Development Test Token:</span>
                  <code className="text-[11px] text-brand-600 break-all select-all block bg-white p-2 rounded border border-slate-200">
                    {devToken}
                  </code>
                  <Button
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => navigate(`/reset-password?token=${devToken}`)}
                  >
                    Proceed with this Token
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 text-center text-xs">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
