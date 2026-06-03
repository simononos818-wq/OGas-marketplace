import React from 'react';
import { Plus } from 'lucide-react';

interface FABProps {
  icon?: string;
  onPress: () => void;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  style?: React.CSSProperties;
}

export default function FAB({ onPress, color = '#FF5722', size = 'medium', style }: FABProps) {
  const sizeMap = {
    small: { width: 48, height: 48, iconSize: 20 },
    medium: { width: 56, height: 56, iconSize: 24 },
    large: { width: 64, height: 64, iconSize: 28 },
  };

  const s = sizeMap[size];

  return (
    <button
      onClick={onPress}
      style={{
        width: s.width,
        height: s.height,
        backgroundColor: color,
        borderRadius: '50%',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: `0 4px 12px ${color}40`,
        ...style,
      }}
    >
      <Plus size={s.iconSize} color="#fff" />
    </button>
  );
}
