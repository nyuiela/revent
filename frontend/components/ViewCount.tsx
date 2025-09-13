import React from 'react';
import { Eye } from 'lucide-react';

interface ViewCountProps {
  count: number;
  isLoading?: boolean;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ViewCount({
  count,
  isLoading = false,
  className = '',
  showIcon = true,
  size = 'sm'
}: ViewCountProps) {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-1 text-muted-foreground ${className}`}>
        {showIcon && <Eye className={`${iconSizes[size]} animate-pulse`} />}
        <span className={`${sizeClasses[size]} animate-pulse`}>...</span>
      </div>
    );
  }

  const formatCount = (num: number): string => {
    if (num < 1000) return num.toString();
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  };

  return (
    <div className={`flex items-center gap-1 text-muted-foreground ${className}`}>
      {showIcon && <Eye className={iconSizes[size]} />}
      <span className={sizeClasses[size]}>
        {formatCount(count)}
      </span>
    </div>
  );
}
