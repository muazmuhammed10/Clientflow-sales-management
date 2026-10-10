import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Kanban,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Zap,
  BarChart3,
  Users,
  Building2,
  DollarSign,
  ChevronRight,
  ExternalLink,
  Layers,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#080d16] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Ambient Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-brand-600/20 via-emerald-500/10 to-transparent blur-[140px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#080d16]/80 border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Top Left: Logo + Immediate Login & Register Navigation */}
          <div className="flex items-center gap-6 sm:gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform duration-200">
                CF
              </div>
              <div>
                <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                  ClientFlow
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Enterprise
                  </span>
                </span>
                <span className="hidden sm:block text-[11px] text-slate-400 font-medium">
                  Turn relationships into revenue.
                </span>
              </div>
            </Link>

            {/* Direct Login & Registration Buttons at the Top Left */}
            <div className="flex items-center gap-2 pl-2 sm:pl-4 border-l border-white/10">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-200"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-md shadow-brand-600/25 hover:shadow-brand-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Register
              </Link>
            </div>
          </div>

          {/* Top Right: Status & Dashboard Link if logged in */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 hover:bg-emerald-900/50 transition-all"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 transition-all"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Launch Live System</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-500/25 mb-8 backdrop-blur-md animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Next-Gen Enterprise Sales Execution Platform</span>
            <ChevronRight className="w-3 h-3 text-emerald-400" />
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Turn Relationships Into{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-brand-400">
              Predictable Revenue
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            The high-velocity B2B CRM designed for ambitious sales teams. Seamlessly qualify leads, convert accounts atomically, manage deals across an interactive Kanban pipeline, and leverage built-in AI copilot drafting.
          </p>

          {/* Action Buttons -> Navigates to /login */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to="/register"
              className="px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-brand-600 hover:from-emerald-400 hover:to-brand-500 shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/35 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 group"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/login"
              className="px-6 py-3.5 rounded-xl text-sm font-bold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 backdrop-blur-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Launch Live System</span>
            </Link>
          </div>

          {/* Interactive Project Preview Mockup (Visual Showcase) */}
          <div className="mt-14 max-w-5xl mx-auto">
            <div className="relative rounded-2xl p-2 sm:p-3 bg-gradient-to-b from-white/15 to-white/5 border border-white/10 shadow-2xl shadow-black/80 backdrop-blur-xl group hover:border-emerald-500/30 transition-all duration-500">
              {/* Fake Window Header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#0d1424] rounded-t-xl border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs text-slate-400 font-mono ml-2">clientflow.app/pipeline</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Live System Connected
                </div>
              </div>

              {/* High-Fidelity Pipeline Mockup Card */}
              <div className="p-4 sm:p-6 bg-[#0a101d] rounded-b-xl text-left space-y-6">
                {/* Mockup Top KPI Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-colors">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Won Revenue</span>
                    <div className="text-xl font-black text-emerald-400 mt-0.5">$325,000</div>
                    <span className="text-[10px] text-emerald-500 font-medium">+18% this month</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-brand-500/30 transition-colors">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Open Pipeline</span>
                    <div className="text-xl font-black text-brand-400 mt-0.5">$480,000</div>
                    <span className="text-[10px] text-slate-400 font-medium">6 active stages</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-colors">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Win Rate</span>
                    <div className="text-xl font-black text-cyan-400 mt-0.5">78.5%</div>
                    <span className="text-[10px] text-cyan-500 font-medium">Top 5% quartile</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-violet-500/30 transition-colors">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">AI Copilot</span>
                    <div className="text-xl font-black text-violet-400 mt-0.5">Active</div>
                    <span className="text-[10px] text-violet-300 font-medium">Next actions prioritized</span>
                  </div>
                </div>

                {/* Mockup Interactive Pipeline Stages */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Column 1: Discovery */}
                  <div className="p-3 rounded-xl bg-[#0e1628] border border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span>Discovery</span>
                      <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px]">$85,000</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#141f36] border border-white/5 hover:border-brand-500/50 hover:-translate-y-0.5 transition-all cursor-pointer">
                      <div className="text-xs font-bold text-white">Vertex AI — Automation Suite</div>
                      <div className="text-[10px] text-slate-400 mt-1">Vertex AI Labs • 30% Prob</div>
                      <div className="mt-2 flex items-center justify-between text-[11px] font-extrabold text-slate-200">
                        <span>$85,000</span>
                        <span className="text-[10px] text-brand-400 font-normal">Sarah J.</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Negotiation */}
                  <div className="p-3 rounded-xl bg-[#0e1628] border border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span>Negotiation</span>
                      <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px]">$110,000</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#141f36] border border-white/5 hover:border-brand-500/50 hover:-translate-y-0.5 transition-all cursor-pointer">
                      <div className="text-xs font-bold text-white">BlueSky — Global Fleet CRM</div>
                      <div className="text-[10px] text-slate-400 mt-1">BlueSky Logistics • 80% Prob</div>
                      <div className="mt-2 flex items-center justify-between text-[11px] font-extrabold text-slate-200">
                        <span>$110,000</span>
                        <span className="text-[10px] text-brand-400 font-normal">David C.</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Closed Won */}
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Closed Won
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[10px]">$180,000</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#141f36] border border-emerald-500/30 hover:-translate-y-0.5 transition-all cursor-pointer">
                      <div className="text-xs font-bold text-white">FinEdge — Risk Analytics Platform</div>
                      <div className="text-[10px] text-emerald-400 mt-1">FinEdge Capital • 100% Won</div>
                      <div className="mt-2 flex items-center justify-between text-[11px] font-extrabold text-emerald-300">
                        <span>$180,000</span>
                        <span className="text-[10px] text-slate-400 font-normal">Alex M.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Copilot Suggestion Pill */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-violet-950/40 via-brand-950/30 to-emerald-950/30 border border-violet-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
                    <span className="text-slate-200 font-medium">
                      <strong className="text-violet-300">AI Sales Insight:</strong> 3 qualified leads have not received follow-ups in 48h. Ready to auto-draft consultative emails?
                    </span>
                  </div>
                  <Link
                    to="/login"
                    className="text-xs font-bold text-violet-300 hover:text-white underline ml-3 flex-shrink-0"
                  >
                    View System →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Access Cards Section (Navigates to Sign In) */}
      <section className="py-16 bg-[#0a0f1b] border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Enterprise Role-Based Access Control
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Multi-tenant security designed for granular team permissions:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => navigate('/login')}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-200 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm mb-3 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                Organization Admin
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Full governance, team member invites, pipeline stage configuration, and billing.
              </p>
              <div className="mt-4 flex items-center text-xs font-semibold text-emerald-400 gap-1">
                <span>Sign In as Admin</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div
              onClick={() => navigate('/login')}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-500/50 hover:bg-brand-500/5 transition-all duration-200 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center font-bold text-sm mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors">
                Sales Manager
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Team assignment oversight, rep productivity leaderboard, and revenue forecasting.
              </p>
              <div className="mt-4 flex items-center text-xs font-semibold text-brand-400 gap-1">
                <span>Sign In as Manager</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div
              onClick={() => navigate('/login')}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all duration-200 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-sm mb-3 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                Sales Representative
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Lead capture, interactive Kanban deal board, follow-up scheduler, and AI drafter.
              </p>
              <div className="mt-4 flex items-center text-xs font-semibold text-cyan-400 gap-1">
                <span>Sign In as Representative</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div
              onClick={() => navigate('/login')}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all duration-200 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center font-bold text-sm mb-3 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-violet-400 transition-colors">
                Read-Only Analyst
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Inspect calculated revenue analytics, win rates, and anti-formula CSV exports.
              </p>
              <div className="mt-4 flex items-center text-xs font-semibold text-violet-400 gap-1">
                <span>Sign In as Analyst</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Showcase with Hover Cards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Engineered for Enterprise Revenue Velocity
            </h2>
            <p className="text-sm text-slate-400 mt-3">
              Every feature works together with real database integrity, transactional workflows, and strict tenant isolation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <Kanban className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Interactive Kanban Board</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Drag-and-drop deals between customizable stages. Features optimistic UI rendering with instant backend rollback on network faults.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-500/40 hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Atomic Lead Conversion</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Transform qualified prospects into Company accounts, Contacts, and Pipeline Deals simultaneously in an all-or-nothing database transaction.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/40 hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">AI Sales Assistant</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate executive lead summaries and tone-tailored follow-up emails (Professional, Consultative, Urgent) with built-in intelligent heuristics or external LLMs.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/40 hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Real Calculated Analytics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                No mock numbers. Real-time SQL aggregations compute realized won revenue, weighted pipeline value, historical win rates, and rep productivity.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/40 hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Strict Tenant Isolation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Organizations operate in distinct logical boundaries enforced via JWT middleware. Automated integration tests guarantee zero cross-tenant leakage.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-rose-500/40 hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Follow-ups & Overdue Alerts</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tabbed follow-up lists for calls, meetings, and emails with overdue warning flags, customer interaction timelines, and audit logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-10 border-t border-white/5 bg-[#060a12] text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-xs">
              CF
            </div>
            <span>© {new Date().getFullYear()} ClientFlow Technologies Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              All Systems Operational
            </span>
            <Link to="/login" className="hover:text-slate-300">Sign In</Link>
            <Link to="/register" className="hover:text-slate-300">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
