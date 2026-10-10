import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Globe,
  MapPin,
  Users,
  DollarSign,
  Plus,
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const CompanyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [company, setCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompany = async () => {
    try {
      const res = await api.get(`/companies/${id}`);
      if (res.success) setCompany(res.data);
    } catch (err: any) {
      error('Failed to Load Company', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCompany();
  }, [id]);

  if (isLoading) return <LoadingSpinner message="Loading account 360-view..." />;
  if (!company) return <div className="text-center py-12 text-slate-500">Company not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate('/companies')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Companies
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{company.name}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {company.industry ? `${company.industry} • ` : ''}
            {[company.city, company.country].filter(Boolean).join(', ') || 'Global'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Card */}
        <div className="space-y-6">
          <Card header={<h3 className="text-sm font-bold text-slate-900">Account Overview</h3>}>
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Website</span>
                {company.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-brand-600 hover:underline flex items-center gap-1.5"
                  >
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    {company.website}
                  </a>
                ) : (
                  'None'
                )}
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Industry & Segment</span>
                <span className="font-medium text-slate-800">{company.industry || 'General Business'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Company Size</span>
                <span className="font-medium text-slate-800">{company.size || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Address</span>
                <span className="font-medium text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {[company.address, company.city, company.country].filter(Boolean).join(', ') || 'None'}
                </span>
              </div>
            </div>
          </Card>

          {/* Associated Contacts */}
          <Card header={<h3 className="text-sm font-bold text-slate-900">Stakeholder Contacts</h3>}>
            <div className="space-y-2 text-xs">
              {company.contacts?.length === 0 ? (
                <p className="text-slate-400 italic">No contacts registered for this account.</p>
              ) : (
                company.contacts?.map((ct: any) => (
                  <div
                    key={ct.id}
                    onClick={() => navigate(`/contacts/${ct.id}`)}
                    className="p-2.5 rounded-lg border border-slate-100 hover:border-brand-300 bg-slate-50/50 cursor-pointer transition-colors"
                  >
                    <div className="font-bold text-slate-900">{ct.firstName} {ct.lastName}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{ct.jobTitle || ct.email || 'Contact'}</div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Associated Deals & Activity Stream */}
        <div className="lg:col-span-2 space-y-6">
          <Card header={<h3 className="text-sm font-bold text-slate-900">Opportunities & Deals</h3>}>
            <div className="space-y-3">
              {company.deals?.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No active deals found for this account.</p>
              ) : (
                company.deals?.map((d: any) => (
                  <div
                    key={d.id}
                    onClick={() => navigate(`/deals/${d.id}`)}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-brand-300 cursor-pointer transition-all flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{d.name}</div>
                      <div className="text-[11px] text-slate-500 mt-1">Stage: {d.stage?.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 text-sm">
                        ${Number(d.amount).toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-400">{d.probability}% prob</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card header={<h3 className="text-sm font-bold text-slate-900">Account Activity Log</h3>}>
            <div className="space-y-3">
              {company.activities?.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No recent activity.</p>
              ) : (
                company.activities?.map((act: any) => (
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
    </div>
  );
};
