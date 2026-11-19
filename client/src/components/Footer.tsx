import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>
          &copy; {new Date().getFullYear()} <span className="font-semibold text-slate-700">SurvPulse</span>. Full-Stack Dynamic Survey Platform.
        </p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Online
          </span>
          <span>•</span>
          <span>MongoDB Atlas Connected</span>
        </div>
      </div>
    </footer>
  );
};
