import React from 'react';
import { useFarcasterUsername } from '@/hooks/useFarcasterUsername';
import { User, ExternalLink } from 'lucide-react';

interface OwnerDisplayProps {
  address: string;
  className?: string;
  showIcon?: boolean;
  showLink?: boolean;
}

export default function OwnerDisplay({
  address,
  className = '',
  showIcon = true,
  showLink = false
}: OwnerDisplayProps) {
  const { displayName, isFarcaster, isLoading, error } = useFarcasterUsername(address);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
        {showIcon && <User className="w-3 h-3" />}
        <span className="animate-pulse">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
        {showIcon && <User className="w-3 h-3" />}
        <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
      {showIcon && <User className="w-3 h-3" />}
      <span className={isFarcaster ? 'text-blue-400' : ''}>
        {displayName}
      </span>
      {showLink && isFarcaster && (
        <ExternalLink className="w-3 h-3 opacity-60" />
      )}
    </div>
  );
}
