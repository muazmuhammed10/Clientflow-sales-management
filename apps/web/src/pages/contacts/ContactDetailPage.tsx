import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Briefcase,
  User,
  Plus,
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const ContactDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [contact, setContact] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [noteContent, setNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const fetchContact = async () => {
    try {
      const res = await api.get(`/contacts/${id}`);
      if (res.success) setContact(res.data);
    } catch (err: any) {
      error('Failed to Load Contact', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchContact();
  }, [id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setIsSubmittingNote(true);
    try {
      const res = await api.post('/activities', {
        title: 'Contact Interaction Logged',
        description: noteContent,
        type: 'NOTE',
        contactId: id,
      });
      if (res.success) {
        success('Interaction Logged', 'Updated timeline.');
        setNoteContent('');
        fetchContact();
      }
    } catch (err: any) {
      error('Failed to Log Interaction', err.message);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading contact record..." />;
  if (!contact) return <div className="text-center py-12 text-slate-500">Contact not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate('/contacts')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Contacts
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {contact.firstName} {contact.lastName}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {contact.jobTitle ? `${contact.jobTitle} • ` : ''}
            {contact.company?.name || 'Independent Contact'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="space-y-6">
          <Card header={<h3 className="text-sm font-bold text-slate-900">Contact Profile</h3>}>
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Email</span>
                <a href={`mailto:${contact.email}`} className="font-medium text-brand-600 hover:underline flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {contact.email || 'None'}
                </a>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Phone</span>
                <span className="font-medium text-slate-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {contact.phone || 'None'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Company Account</span>
                <span className="font-medium text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {contact.company ? (
                    <button
                      onClick={() => navigate(`/companies/${contact.company.id}`)}
                      className="text-brand-600 hover:underline"
                    >
                      {contact.company.name}
                    </button>
                  ) : (
                    'Not linked'
                  )}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Account Owner</span>
                <span className="font-medium text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {contact.owner ? `${contact.owner.firstName} ${contact.owner.lastName}` : 'Unassigned'}
                </span>
              </div>
            </div>
          </Card>

          {/* Related Deals Card */}
          <Card header={<h3 className="text-sm font-bold text-slate-900">Associated Deals</h3>}>
            <div className="space-y-2 text-xs">
              {contact.deals?.length === 0 ? (
                <p className="text-slate-400 italic">No deals linked</p>
              ) : (
                contact.deals?.map((d: any) => (
                  <div
                    key={d.id}
                    onClick={() => navigate(`/deals/${d.id}`)}
                    className="p-2.5 rounded-lg border border-slate-100 hover:border-brand-300 bg-slate-50/50 cursor-pointer transition-colors"
                  >
                    <div className="font-bold text-slate-900">{d.name}</div>
                    <div className="flex items-center justify-between text-slate-500 mt-1">
                      <span>${Number(d.amount).toLocaleString()}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 text-[10px]">
                        {d.stage?.name}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Timeline & Notes */}
        <div className="lg:col-span-2">
          <Card header={<h3 className="text-sm font-bold text-slate-900">Interaction Timeline</h3>}>
            <form onSubmit={handleAddNote} className="space-y-3 mb-6">
              <textarea
                rows={2}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Log email, meeting summary, or conversation notes..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"
                required
              />
              <div className="flex justify-end">
                <Button size="sm" type="submit" isLoading={isSubmittingNote} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Log Activity
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              {contact.activities?.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No activities logged yet.</p>
              ) : (
                contact.activities?.map((act: any) => (
                  <div key={act.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{act.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {new Date(act.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed">{act.description}</p>
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
