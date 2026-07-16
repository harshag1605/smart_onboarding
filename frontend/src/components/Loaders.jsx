import React from 'react';

// A simple bubble bouncing loader
export const BubbleLoader = ({ size = 'md', color = 'black' }) => {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };
  
  const dim = sizeClasses[size] || sizeClasses.md;
  const bgClass = color === 'white' ? 'bg-white' : 'bg-gray-900';

  return (
    <div className="flex items-center justify-center gap-1">
      <div className={`${dim} rounded-full ${bgClass} animate-[bounce_1s_infinite_-0.3s]`}></div>
      <div className={`${dim} rounded-full ${bgClass} animate-[bounce_1s_infinite_-0.15s]`}></div>
      <div className={`${dim} rounded-full ${bgClass} animate-[bounce_1s_infinite]`}></div>
    </div>
  );
};

// Generic Skeleton wrapper
export const Skeleton = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`}></div>
  );
};

// Skeleton block specifically for HR Dashboard cards (e.g. New Project, Assign Team)
export const CardSkeleton = () => {
  return (
    <div className="bg-white/80 backdrop-blur-xl bg-gradient-to-b from-white/60 to-gray-100/80 p-6 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] border border-gray-200">
      <Skeleton className="h-6 w-3/4 mb-6" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
};

export const ListSkeleton = ({ rows = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
};
