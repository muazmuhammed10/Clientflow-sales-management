import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  CheckCircle2,
  Send,
  Copy,
  Clock,
  MessageSquare,
  AlertTriangle,
  FileText,
  User,
  Plus,
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge, getStatusBadge, getPriorityBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConvertLeadModal } from './ConvertLeadModal';

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [lead, setLead] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [convertModalOpen, setConvertModalOpen] = useState(false);

  // Activity Log State
  const [noteContent, setNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // AI Assistant States
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [aiEmailDraft, setAiEmailDraft] = useState<any>(null);
  const [emailTone, setEmailTone] = useState<'professional' | 'consultative' | 'urgent'>('professional');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [nextAction, setNextAction] = useState<any>(null);

  const fetchLead = async () => {
    try {
      const res = await api.get(`/leads/${id}`);
      if (res.success) {
        setLead(res.data);
      }
    } catch (err: any) {
      error('Failed to Load Lead', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchLead();
  }, [id]);

  // Fetch AI Next Action recommendation
  useEffect(() => {
    if (id) {
      api.get(`/ai/next-action/lead/${id}`).then((res) => {
        if (res.success) setNextAction(res.data);
      }).catch(() => {});
    }
  }, [id]);

  const handleGenerateAiSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const res = await api.get(`/ai/lead-summary/${id}`);
      if (res.success) {
        setAiSummary(res.data);
        success('AI Summary Generated', 'Synthesized lead notes and interactions.');
      }
    } catch (err: any) {
      error('AI Service Error', err.message);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleGenerateAiEmail = async () => {
    setIsGeneratingEmail(true);
    try {
      const res = await api.get(`/ai/suggest-followup/${id}?tone=${emailTone}`);
      if (res.success) {
        setAiEmailDraft(res.data);
        success('Follow-up Draft Created', `Generated with ${emailTone} tone.`);
      }
    } catch (err: any) {
      error('AI Draft Error', err.message);
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setIsSubmittingNote(true);
    try {
      const res = await api.post('/activities', {
        title: 'Note Added',
        description: noteContent,
        type: 'NOTE',
        leadId: id,
      });
      if (res.success) {
        success('Note Added', 'Interaction logged to timeline.');
        setNoteContent('');
        fetchLead();
      }
    } catch (err: any) {
      error('Failed to Add Note', err.message);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    success('Copied to Clipboard!', 'Draft is ready to paste into your email client.');
  };

  if (isLoading) return <LoadingSpinner message="Loading lead profile..." />;
  if (!lead) return <div className="text-center py-12 text-slate-500">Lead not found.</div>;

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/leads')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Leads
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">
                {lead.firstName} {lead.lastName}
              </h1>
              {getStatusBadge(lead.status)}
              {getPriorityBadge(lead.priority)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {lead.jobTitle ? `${lead.jobTitle} • ` : ''}
              {lead.companyName || 'No Company'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {lead.status !== 'CONVERTED' ? (
            <Button
              size="sm"
              onClick={() => setConvertModalOpen(true)}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Convert to Customer & Deal
            </Button>
          ) : (
            <Badge variant="emerald" size="md">
              Converted Customer Account
            </Badge>
          )}
        </div>
      </div>

      {/* Duplicate Warning Alert */}
      {lead.potentialDuplicates && lead.potentialDuplicates.length > 0 && (
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 flex items-start gap-3 text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <h4 className="font-bold text-amber-300">Potential Duplicate Detected</h4>
            <p className="text-amber-200/80 mt-0.5">
              Another lead ({lead.potentialDuplicates[0].firstName} {lead.potentialDuplicates[0].lastName} at{' '}
              {lead.potentialDuplicates[0].companyName}) shares the email "{lead.email}".
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Details + AI Assistant & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lead Info Card */}
        <div className="space-y-6">
          <Card
            header={
              <h3 className="text-sm font-bold text-white">Lead Information</h3>
            }
          >
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Estimated Value</span>
                <span className="font-bold text-emerald-400 text-base">
                  ${Number(lead.estimatedValue).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Email</span>
                <a
                  href={`mailto:${lead.email}`}
                  className="font-medium text-brand-400 hover:underline flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {lead.email || 'None provided'}
                </a>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Phone</span>
                <a
                  href={`tel:${lead.phone}`}
                  className="font-medium text-slate-800 flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {lead.phone || 'None provided'}
                </a>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Organization / Account</span>
                <span className="font-medium text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {lead.companyName || 'Not linked'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Lead Acquisition Source</span>
                <span className="font-medium text-slate-800 capitalize">
                  {lead.source.replace(/_/g, ' ').toLowerCase()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Assigned Owner</span>
                <span className="font-medium text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {lead.assignedTo
                    ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`
                    : 'Unassigned'}
                </span>
              </div>
              {lead.notes && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block mb-1 font-semibold">Initial Notes</span>
                  <p className="text-slate-600 italic leading-relaxed">{lead.notes}</p>
                </div>
              )}
            </div>
          </Card>

          {/* AI Recommended Next Action Widget */}
          {nextAction && (
            <Card
              className="border-brand-200 bg-brand-50/30"
              header={
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Recommended Next Action
                  </h3>
                </div>
              }
            >
              <div className="text-xs space-y-2">
                <div className="font-bold text-slate-900">{nextAction.recommendedAction}</div>
                <p className="text-slate-600 leading-relaxed">{nextAction.rationale}</p>
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Priority: <strong className="text-brand-700">{nextAction.priority}</strong></span>
                  <span>Target: {new Date(nextAction.suggestedDueDate).toLocaleDateString()}</span>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Columns: AI Sales Assistant & Activity Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Sales Copilot Section */}
          <Card
            header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-brand-100 text-brand-700">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">AI Sales Assistant</h3>
                    <p className="text-xs text-slate-500">Synthesize notes & draft tailored outreach messages</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={isGeneratingSummary}
                  onClick={handleGenerateAiSummary}
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-brand-600" />}
                >
                  Generate Summary
                </Button>
              </div>
            }
          >
            {aiSummary ? (
              <div className="space-y-4 text-xs animate-fade-in">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900">Executive Summary</span>
                    <Badge variant="brand" size="sm">Sentiment: {aiSummary.sentiment}</Badge>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{aiSummary.summary}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                    <h4 className="font-bold text-slate-800 mb-1.5">Key Insights</h4>
                    <ul className="space-y-1 list-disc list-inside text-slate-600">
                      {aiSummary.keyHighlights.map((h: string, i: number) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                    <h4 className="font-bold text-slate-800 mb-1.5">Suggested Strategy</h4>
                    <ul className="space-y-1 list-disc list-inside text-slate-600">
                      {aiSummary.recommendedNextSteps.map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic text-center py-2">
                Click "Generate Summary" to have the AI synthesize lead history into actionable insights.
              </p>
            )}

            {/* AI Follow-Up Message Drafter */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <span className="text-xs font-bold text-slate-800">Draft Follow-Up Email</span>
                <div className="flex items-center gap-2">
                  <select
                    value={emailTone}
                    onChange={(e: any) => setEmailTone(e.target.value)}
                    className="text-xs border rounded-lg px-2.5 py-1 bg-white text-slate-700 focus:outline-none"
                  >
                    <option value="professional">Professional Tone</option>
                    <option value="consultative">Consultative Tone</option>
                    <option value="urgent">Time-Sensitive / Urgent</option>
                  </select>
                  <Button
                    size="sm"
                    variant="secondary"
                    isLoading={isGeneratingEmail}
                    onClick={handleGenerateAiEmail}
                    leftIcon={<Send className="w-3 h-3" />}
                  >
                    Draft Email
                  </Button>
                </div>
              </div>

              {aiEmailDraft && (
                <div className="p-3.5 rounded-xl border border-brand-200 bg-brand-50/30 text-xs space-y-2 animate-scale-in">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      Subject: {aiEmailDraft.subject}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(`Subject: ${aiEmailDraft.subject}\n\n${aiEmailDraft.body}`)
                      }
                      className="p-1 rounded text-slate-500 hover:text-brand-600 transition-colors"
                      title="Copy email to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <pre className="font-sans whitespace-pre-wrap text-slate-700 bg-white p-3 rounded-lg border border-brand-100 text-xs leading-relaxed">
                    {aiEmailDraft.body}
                  </pre>
                  <p className="text-[10px] text-slate-400 italic">{aiEmailDraft.disclaimer}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Activity Timeline & Add Note */}
          <Card
            header={
              <h3 className="text-sm font-bold text-slate-900">Activity Timeline & Log</h3>
            }
          >
            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="space-y-3 mb-6">
              <textarea
                rows={2}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Log a call outcome, meeting note, or customer update..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                required
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  type="submit"
                  isLoading={isSubmittingNote}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Log Activity
                </Button>
              </div>
            </form>

            {/* Timeline Stream */}
            <div className="space-y-4">
              {lead.activities?.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No activities logged yet.</p>
              ) : (
                lead.activities?.map((act: any) => (
                  <div key={act.id} className="flex items-start gap-3 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{act.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(act.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1 leading-relaxed">{act.description}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Logged by {act.user?.firstName} {act.user?.lastName}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Convert Lead Modal */}
      <ConvertLeadModal
        isOpen={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        lead={lead}
        onConverted={() => {
          fetchLead();
          navigate('/pipeline');
        }}
      />
    </div>
  );
};
