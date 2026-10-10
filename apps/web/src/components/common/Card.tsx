import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', header, footer }) => {
  return (
    <div className={`bg-[#0e1628]/95 backdrop-blur-md rounded-xl border border-white/10 shadow-xl shadow-black/20 text-white overflow-hidden ${className}`}>
      {header && <div className="border-b border-white/10 px-5 py-4">{header}</div>}
      <div className="p-5">{children}</div>
      {footer && <div className="border-t border-white/10 px-5 py-3.5 bg-[#0a0f1d]/50">{footer}</div>}
    </div>
  );
};
