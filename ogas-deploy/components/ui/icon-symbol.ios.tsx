import { Ionicons } from '@expo/vector-icons';
import { StyleProp, TextStyle } from 'react-native';

export type SymbolWeight = 'light' | 'regular' | 'medium' | 'semibold' | 'bold';

export interface IconSymbolProps {
  name: string;
  size?: number;
  color?: string;
  weight?: SymbolWeight;
  style?: StyleProp<TextStyle>;
}

export function IconSymbol({ name, size = 24, color = '#000', style }: IconSymbolProps) {
  return <Ionicons name={name as any} size={size} color={color} style={style} />;
}
