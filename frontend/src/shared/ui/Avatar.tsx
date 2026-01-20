import React, { useState } from 'react';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  name, 
  src, 
  size = 'md', 
  className = '',
  onClick
}) => {
  const [imageError, setImageError] = useState(false);

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-[8px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-14 h-14 text-lg'
  };

  const Container = onClick ? 'button' : 'div';

  return (
    <Container
      className={`relative inline-flex items-center justify-center ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={name}
          className={`rounded object-cover block ${sizeClasses[size]}`}
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          className={`rounded bg-sky-600 flex items-center justify-center text-white font-semibold ${sizeClasses[size]}`}
        >
          {getInitials(name)}
        </div>
      )}
    </Container>
  );
};
