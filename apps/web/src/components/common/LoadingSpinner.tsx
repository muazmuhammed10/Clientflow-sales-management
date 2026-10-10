import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC<{ message?: string; className?: string }> = ({
  message = 'Loading data...',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-3" />
      <p className="text-xs font-medium text-slate-500 tracking-wide">{message}</p>
    </div>
  );
};
