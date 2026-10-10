import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  Target,
  ArrowUpRight,
  Plus,
  AlertTriangle,
  Briefcase,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { api } from '../../api/client';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const NEON_COLORS = ['#10b981', '#f43f5e', '#8b5cf6', '#06b6d4', '#f59e0b'];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Calculating real-time executive sales metrics..." />;
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-slate-400">
        Unable to load dashboard data. Please try again.
      </div>
    );
  }

  const { kpis, charts, widgets } = data;

  const kpiCards = [
    {
      title: 'Won Revenue',
      value: `$${Number(kpis.revenueWon).toLocaleString()}`,
      subtext: `${kpis.dealsWon} deals closed won`,
      icon: DollarSign,
      topBorder: 'border-t-2 border-emerald-400',
      gradient: 'from-emerald-500/10 to-transparent',
      valueColor: 'text-emerald-400',
      iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Open Pipeline',
      value: `$${Number(kpis.openPipelineValue).toLocaleString()}`,
      subtext: `$${Number(kpis.weightedPipelineValue).toLocaleString()} weighted value`,
      icon: Target,
      topBorder: 'border-t-2 border-brand-400',
      gradient: 'from-brand-500/10 to-transparent',
      valueColor: 'text-brand-400',
      iconColor: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
    },
    {
      title: 'Win Ratio',
      value: `${kpis.winRate}%`,
      subtext: `${kpis.openDeals} deals in progress`,
      icon: TrendingUp,
      topBorder: 'border-t-2 border-cyan-400',
      gradient: 'from-cyan-500/10 to-transparent',
      valueColor: 'text-cyan-400',
      iconColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      title: 'Conversion Rate',
      value: `${kpis.conversionRate}%`,
      subtext: `${kpis.totalLeads} total leads acquired`,
      icon: Zap,
      topBorder: 'border-t-2 border-amber-400',
      gradient: 'from-amber-500/10 to-transparent',
      valueColor: 'text-amber-400',
      iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header / Context Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-white tracking-tight">Executive Sales Intelligence</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              Live SQL Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time pipeline calculations, realized revenue, and team velocity
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/leads')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
            <span>New Lead</span>
          </button>
          <button
            onClick={() => navigate('/pipeline')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-brand-600 hover:from-emerald-400 hover:to-brand-500 shadow-md shadow-emerald-500/20 hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Sales Pipeline</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid with Radiant Jewel Tops */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl bg-gradient-to-b ${kpi.gradient} bg-[#0e1628] border border-white/5 ${kpi.topBorder} shadow-lg hover:-translate-y-1 hover:border-white/20 transition-all duration-300 group`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {kpi.title}
                  </p>
                  <h3 className={`text-2xl font-black ${kpi.valueColor} mt-1.5 tracking-tight group-hover:scale-105 transition-transform origin-left`}>
                    {kpi.value}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">
                    {kpi.subtext}
                  </p>
                </div>
                <div className={`p-3 rounded-xl border ${kpi.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0e1628] border border-white/5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Realized Revenue Trajectory
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Historical won revenue aggregated across the last 6 months</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `$${val >= 1000 ? `${val / 1000}k` : val}`}
                />
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Won Revenue']}
                  contentStyle={{
                    backgroundColor: '#0a0f1b',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#emeraldGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win vs Lost Pie Chart */}
        <div className="p-5 rounded-2xl bg-[#0e1628] border border-white/5 shadow-lg space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Win / Loss Distribution
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Ratio of completed opportunities</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.wonVsLost}
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {charts.wonVsLost.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={NEON_COLORS[index % NEON_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0f1b',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs pt-2 border-t border-white/5">
            {charts.wonVsLost.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NEON_COLORS[i % NEON_COLORS.length] }} />
                <span className="text-slate-300 font-medium">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stage Breakdown & Sales Rep Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deal Stage Breakdown */}
        <div className="p-5 rounded-2xl bg-[#0e1628] border border-white/5 shadow-lg space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-400" />
              Pipeline Value by Stage
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Capital velocity distributed across active deal stages</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.stageDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="stageName" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `$${val >= 1000 ? `${val / 1000}k` : val}`}
                />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Pipeline Value']}
                  contentStyle={{
                    backgroundColor: '#0a0f1b',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="totalAmount" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rep Performance */}
        <div className="p-5 rounded-2xl bg-[#0e1628] border border-white/5 shadow-lg space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Executive Sales Leaderboard
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Won revenue production ranked per representative</p>
          </div>

          <div className="divide-y divide-white/5">
            {charts.repPerformance.map((rep: any, idx: number) => {
              const medalColor =
                idx === 0 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
                idx === 1 ? 'text-slate-200 bg-slate-500/10 border-slate-500/30' :
                'text-amber-600 bg-amber-700/10 border-amber-700/30';

              return (
                <div key={idx} className="py-3 flex items-center justify-between text-xs hover:bg-white/[0.02] px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center border ${medalColor}`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-white">{rep.name}</p>
                      <p className="text-[11px] text-slate-400">{rep.wonDeals} deals won • {rep.openDeals} active</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-400 text-sm">
                      ${Number(rep.wonRevenue).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Widgets: Action Required Tasks & Live Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue & Upcoming Tasks */}
        <div className="p-5 rounded-2xl bg-[#0e1628] border border-white/5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-400" />
                Action Required: Tasks
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">High priority deliverables and follow-ups</p>
            </div>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              View All →
            </button>
          </div>

          <div className="space-y-3">
            {widgets.overdueTasks.length === 0 && widgets.upcomingTasks.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No pending tasks found</p>
            ) : (
              <>
                {widgets.overdueTasks.map((t: any) => (
                  <div key={t.id} className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-950/20 flex items-start justify-between">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-white">{t.title}</p>
                        <p className="text-[11px] text-rose-400 mt-0.5">
                          Overdue since {new Date(t.dueDate).toLocaleDateString()} • {t.assignedTo?.firstName || 'Team'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {widgets.upcomingTasks.map((t: any) => (
                  <div key={t.id} className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] flex items-start justify-between">
                    <div className="flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-white">{t.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Due {new Date(t.dueDate).toLocaleDateString()} • {t.assignedTo?.firstName || 'Team'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Live Activity Stream */}
        <div className="p-5 rounded-2xl bg-[#0e1628] border border-white/5 shadow-lg space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-violet-400" />
              Live Activity Stream
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time log of customer updates and contract events</p>
          </div>

          <div className="space-y-3">
            {widgets.recentActivities.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No recent activity logged</p>
            ) : (
              widgets.recentActivities.map((act: any) => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                    <p className="font-bold text-white">{act.title}</p>
                    <p className="text-slate-400 mt-0.5 leading-relaxed">{act.description}</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {new Date(act.createdAt).toLocaleString()} by {act.user?.firstName || 'System'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
