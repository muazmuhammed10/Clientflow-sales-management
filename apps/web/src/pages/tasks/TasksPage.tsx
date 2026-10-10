import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Trash2,
  Filter,
  User,
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Card } from '../../components/common/Card';
import { Badge, getPriorityBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

export const TasksPage: React.FC = () => {
  const { success, error } = useToast();

  const [tasks, setTasks] = useState<any[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'today' | 'overdue' | 'completed'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Create Task Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    type: 'FOLLOW_UP',
    priority: 'MEDIUM',
    dueDate: new Date().toISOString().split('T')[0],
  });
  const [isCreating, setIsCreating] = useState(false);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const filterParam = filterTab !== 'all' ? `&filter=${filterTab}` : '';
      const res = await api.get(`/tasks?limit=100${filterParam}`);
      if (res.success) {
        setTasks(res.data);
      }
    } catch (err: any) {
      error('Failed to Load Tasks', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filterTab]);

  const handleToggleComplete = async (task: any) => {
    const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    try {
      const res = await api.patch(`/tasks/${task.id}`, { status: newStatus });
      if (res.success) {
        success('Task Updated', newStatus === 'COMPLETED' ? 'Marked complete!' : 'Marked active.');
        fetchTasks();
      }
    } catch (err: any) {
      error('Failed to Update Task', err.message);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await api.post('/tasks', {
        ...newTask,
        dueDate: new Date(newTask.dueDate).toISOString(),
      });
      if (res.success) {
        success('Task Created', `"${newTask.title}" added to schedule.`);
        setCreateModalOpen(false);
        setNewTask({
          title: '',
          description: '',
          type: 'FOLLOW_UP',
          priority: 'MEDIUM',
          dueDate: new Date().toISOString().split('T')[0],
        });
        fetchTasks();
      }
    } catch (err: any) {
      error('Error Creating Task', err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.delete(`/tasks/${id}`);
      success('Task Deleted', 'Task removed.');
      fetchTasks();
    } catch (err: any) {
      error('Failed to Delete Task', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Tasks & Follow-Ups</h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize sales calls, meetings, follow-up messages, and action items
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Task
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10">
        {[
          { key: 'all', label: 'All Tasks' },
          { key: 'today', label: 'Due Today' },
          { key: 'overdue', label: 'Overdue' },
          { key: 'completed', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key as any)}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              filterTab === tab.key
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      <Card className="p-0! overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Loading task deliverables..." />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={<CheckSquare className="w-8 h-8 text-slate-400" />}
            title="No tasks in this view"
            description="All scheduled follow-ups are up to date."
            actionLabel="Create Task"
            onAction={() => setCreateModalOpen(true)}
          />
        ) : (
          <div className="divide-y divide-white/5 bg-[#0e1628]">
            {tasks.map((t) => {
              const isOverdue =
                new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED';
              return (
                <div
                  key={t.id}
                  className={`p-4 flex items-start justify-between gap-3 transition-colors ${
                    t.status === 'COMPLETED'
                      ? 'bg-slate-900/40 opacity-70'
                      : isOverdue
                      ? 'bg-rose-950/20'
                      : 'hover:bg-[#131d35]/60'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={t.status === 'COMPLETED'}
                      onChange={() => handleToggleComplete(t)}
                      className="mt-1 rounded text-brand-500 focus:ring-brand-500 w-4 h-4 cursor-pointer bg-[#0a0f1d] border-white/20"
                    />
                    <div>
                      <h4
                        className={`text-xs font-bold ${
                          t.status === 'COMPLETED'
                            ? 'line-through text-slate-400'
                            : 'text-white'
                        }`}
                      >
                        {t.title}
                      </h4>
                      {t.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{t.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-400 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(t.dueDate).toLocaleDateString()}
                        </span>
                        {isOverdue && (
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Overdue
                          </span>
                        )}
                        <span>•</span>
                        <span className="capitalize text-slate-300">{t.type.replace('_', ' ').toLowerCase()}</span>
                        <span>•</span>
                        <span className="text-slate-300">Assigned to {t.assignedTo?.firstName || 'Me'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getPriorityBadge(t.priority)}
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="p-1 rounded text-slate-300 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Create Task Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Schedule Task / Follow-Up"
        description="Set reminder for sales calls, meetings, or customer deliverables"
        maxWidth="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Task Title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            placeholder="e.g. Follow up on proposal feedback"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Type"
              value={newTask.type}
              onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
              options={[
                { value: 'FOLLOW_UP', label: 'Follow-Up' },
                { value: 'CALL', label: 'Call' },
                { value: 'MEETING', label: 'Meeting' },
                { value: 'EMAIL', label: 'Email' },
                { value: 'GENERAL', label: 'General' },
              ]}
            />
            <Select
              label="Priority"
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              options={[
                { value: 'URGENT', label: 'Urgent' },
                { value: 'HIGH', label: 'High' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'LOW', label: 'Low' },
              ]}
            />
          </div>

          <Input
            label="Due Date"
            type="date"
            value={newTask.dueDate}
            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Schedule Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
