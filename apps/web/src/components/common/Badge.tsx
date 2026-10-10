import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'slate'
    | 'brand'
    | 'emerald'
    | 'amber'
    | 'rose'
    | 'sky'
    | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  className = '',
}) => {
  const variants = {
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
    brand: 'bg-brand-500/15 text-brand-300 border-brand-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    sky: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  };

  const sizes = {
    sm: 'text-[10px] font-semibold px-2 py-0.5',
    md: 'text-xs font-medium px-2.5 py-0.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border leading-normal tracking-wide uppercase ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'NEW':
      return <Badge variant="sky">New</Badge>;
    case 'CONTACTED':
      return <Badge variant="brand">Contacted</Badge>;
    case 'QUALIFIED':
      return <Badge variant="purple">Qualified</Badge>;
    case 'UNQUALIFIED':
      return <Badge variant="slate">Unqualified</Badge>;
    case 'CONVERTED':
      return <Badge variant="emerald">Converted</Badge>;
    case 'TODO':
      return <Badge variant="slate">To Do</Badge>;
    case 'IN_PROGRESS':
      return <Badge variant="brand">In Progress</Badge>;
    case 'COMPLETED':
      return <Badge variant="emerald">Completed</Badge>;
    case 'CANCELLED':
      return <Badge variant="rose">Cancelled</Badge>;
    default:
      return <Badge variant="slate">{status}</Badge>;
  }
};

export const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'URGENT':
      return <Badge variant="rose">Urgent</Badge>;
    case 'HIGH':
      return <Badge variant="amber">High</Badge>;
    case 'MEDIUM':
      return <Badge variant="sky">Medium</Badge>;
    case 'LOW':
      return <Badge variant="slate">Low</Badge>;
    default:
      return <Badge variant="slate">{priority}</Badge>;
  }
};
