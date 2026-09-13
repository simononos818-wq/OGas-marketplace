import React from 'react';

interface LogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'icon',
  size = 'md',
  className = '',
}) => {
  const s = size === 'sm' ? 36 : size === 'md' ? 48 : 88;
  const src = variant === 'full' ? '/ogas-logo.svg' : '/ogas-icon.svg';
  return (
    <img
      src={src}
      alt="OGas"
      width={s}
      height={s}
      className={`rounded-full bg-white object-cover ${className}`}
    />
  );
};

export default Logo;
