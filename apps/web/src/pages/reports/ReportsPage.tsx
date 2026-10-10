import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Award,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const ReportsPage: React.FC = () => {
  const { success, error } = useToast();

  const [period, setPeriod] = useState<'7d' | '30d' | 'quarter' | 'ytd' | 'all'>('30d');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/reports?period=${period}`);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      error('Failed to Load Reports', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [period]);

  const handleExportCsv = async (type: 'deals' | 'leads') => {
    try {
      const token = localStorage.getItem('clientflow_access_token');
      const res = await fetch(`/api/v1/reports/export/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clientflow_${type}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      success('Export Complete', `Downloaded sanitized ${type} CSV file.`);
    } catch (err: any) {
      error('Export Error', err.message);
    }
  };

  if (isLoading) return <LoadingSpinner message="Aggregating sales analytics..." />;
  if (!data) return <div className="text-center py-12 text-slate-500">No report data found.</div>;

  const { summary, repPerformance, sourcePerformance } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Reports & Performance</h1>
          <p className="text-xs text-slate-400 mt-1">
            Analyze sales velocity, representative productivity, and pipeline forecasts
          </p>
        </div>

        {/* Date Filter & Export CSV */}
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e: any) => setPeriod(e.target.value)}
            className="text-xs border border-white/10 rounded-lg px-3 py-2 bg-[#0a0f1d] text-white font-semibold focus:outline-none"
          >
            <option value="7d" className="bg-[#0e1628]">Last 7 Days</option>
            <option value="30d" className="bg-[#0e1628]">Last 30 Days</option>
            <option value="quarter" className="bg-[#0e1628]">Current Quarter</option>
            <option value="ytd" className="bg-[#0e1628]">Year to Date (YTD)</option>
            <option value="all" className="bg-[#0e1628]">All Time</option>
          </select>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExportCsv('deals')}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Deals CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExportCsv('leads')}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Leads CSV
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Realized Revenue
          </span>
          <div className="text-2xl font-black text-white mt-1">
            ${Number(summary.totalRevenue).toLocaleString()}
          </div>
          <p className="text-xs text-emerald-400 font-medium mt-1">
            {summary.wonDeals} deals won in period
          </p>
        </Card>

        <Card>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Win Rate
          </span>
          <div className="text-2xl font-black text-white mt-1">{summary.winRate}%</div>
          <p className="text-xs text-slate-400 mt-1">
            {summary.wonDeals} Won • {summary.lostDeals} Lost
          </p>
        </Card>

        <Card>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Weighted Forecast
          </span>
          <div className="text-2xl font-black text-brand-400 mt-1">
            ${Number(summary.weightedForecast).toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            From ${Number(summary.openPipelineValue).toLocaleString()} pipeline
          </p>
        </Card>

        <Card>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Lead Conversion Rate
          </span>
          <div className="text-2xl font-black text-purple-400 mt-1">{summary.conversionRate}%</div>
          <p className="text-xs text-slate-400 mt-1">
            {summary.convertedLeads} converted of {summary.totalLeads}
          </p>
        </Card>
      </div>

      {/* Rep Performance Table */}
      <Card
        header={
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-bold text-white">Sales Representative Productivity</h3>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-xs">
            <thead className="bg-[#131d35] text-slate-300 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Sales Representative</th>
                <th className="py-2.5 px-4">Opportunities Managed</th>
                <th className="py-2.5 px-4">Deals Closed Won</th>
                <th className="py-2.5 px-4">Win Rate</th>
                <th className="py-2.5 px-4 text-right">Realized Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#0e1628]">
              {repPerformance.map((rep: any, idx: number) => {
                const repWinRate =
                  rep.dealsCount > 0
                    ? Number(((rep.wonCount / rep.dealsCount) * 100).toFixed(1))
                    : 0;
                return (
                  <tr key={idx} className="hover:bg-[#131d35]/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">{rep.name}</td>
                    <td className="py-3 px-4 text-slate-300">{rep.dealsCount} deals</td>
                    <td className="py-3 px-4 text-slate-300">{rep.wonCount} won</td>
                    <td className="py-3 px-4 text-slate-300">{repWinRate}%</td>
                    <td className="py-3 px-4 font-bold text-emerald-400 text-right">
                      ${Number(rep.wonRevenue).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Lead Channel Performance */}
      <Card
        header={
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-bold text-white">Lead Acquisition Channel Performance</h3>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-xs">
            <thead className="bg-[#131d35] text-slate-300 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Channel / Source</th>
                <th className="py-2.5 px-4">Total Leads</th>
                <th className="py-2.5 px-4">Converted Customers</th>
                <th className="py-2.5 px-4 text-right">Conversion Velocity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#0e1628]">
              {sourcePerformance.map((src: any, idx: number) => {
                const rate = src.total > 0 ? ((src.converted / src.total) * 100).toFixed(1) : 0;
                return (
                  <tr key={idx} className="hover:bg-[#131d35]/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white capitalize">
                      {src.source.replace(/_/g, ' ').toLowerCase()}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{src.total}</td>
                    <td className="py-3 px-4 text-slate-300">{src.converted}</td>
                    <td className="py-3 px-4 font-bold text-brand-400 text-right">{rate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
