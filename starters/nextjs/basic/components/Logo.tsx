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
  animated = false 
}) => {
  const s = size === 'sm' ? 48 : size === 'md' ? 80 : 128;
  
  if (variant === 'icon') {
    return (
      <svg viewBox="0 0 100 100" width={s} height={s} 
className={className}>
        <defs>
          <linearGradient id="ng" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0a1628"/>
            <stop offset="100%" stopColor="#1e3a5f"/>
          </linearGradient>
          <linearGradient id="eg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00d4aa"/>
            <stop offset="100%" stopColor="#00a8e8"/>
          </linearGradient>
        </defs>
        <g transform="translate(50,50)">
          <path d="M0,-40 L34.6,-20 L34.6,20 L0,40 L-34.6,20 L-34.6,-20 Z" 
fill="url(#ng)" stroke="url(#eg)" strokeWidth="2.5"/>
          <path d="M0,-24 L20.8,-12 L20.8,12 L0,24 L-20.8,12 L-20.8,-12 Z" 
fill="#e8eef5" opacity="0.9"/>
          <circle cx="0" cy="0" r="10" fill="url(#ng)"/>
          <circle cx="0" cy="0" r="5" fill="url(#eg)"/>
          
{[[0,-30],[26,-15],[26,15],[0,30],[-26,15],[-26,-15]].map(([cx,cy],i)=>(
            <circle key={i} cx={cx} cy={cy} r="3" fill="#00d4aa" 
className={animated?'animate-pulse':''} 
style={{animationDelay:`${i*0.15}s`}}/>
          ))}
        </g>
      </svg>
    );
  }
  
  return (
    <svg viewBox="0 0 400 160" width={s*2.5} height={s} 
className={className}>
      <defs>
        <linearGradient id="ng2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0a1628"/>
          <stop offset="100%" stopColor="#1e3a5f"/>
        </linearGradient>
        <linearGradient id="eg2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00d4aa"/>
          <stop offset="100%" stopColor="#00a8e8"/>
        </linearGradient>
      </defs>
      <g transform="translate(60,80)">
        <path d="M0,-50 L43.3,-25 L43.3,25 L0,50 L-43.3,25 L-43.3,-25 Z" 
fill="url(#ng2)" stroke="url(#eg2)" strokeWidth="3"/>
        <path d="M0,-30 L26,-15 L26,15 L0,30 L-26,15 L-26,-15 Z" 
fill="#e8eef5" opacity="0.9"/>
        <circle cx="0" cy="0" r="12" fill="url(#ng2)"/>
        <circle cx="0" cy="0" r="6" fill="url(#eg2)"/>
        
{[[0,-38],[33,-19],[33,19],[0,38],[-33,19],[-33,-19]].map(([cx,cy],i)=>(
          <circle key={i} cx={cx} cy={cy} r="4" fill="#00d4aa" 
className={animated?'animate-pulse':''} 
style={{animationDelay:`${i*0.1}s`}}/>
        ))}
      </g>
      <text x="130" y="75" fontFamily="Inter,system-ui,sans-serif" 
fontSize="52" fontWeight="700" fill="currentColor" 
letterSpacing="-1">OGas</text>
      <text x="130" y="100" fontFamily="Inter,system-ui,sans-serif" 
fontSize="14" fontWeight="500" fill="currentColor" opacity="0.6" 
letterSpacing="3">GAS MARKETPLACE</text>
      <rect x="130" y="108" width="60" height="3" fill="url(#eg2)" 
rx="1.5"/>
    </svg>
  );
};

export default Logo;
