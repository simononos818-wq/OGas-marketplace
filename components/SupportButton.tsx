import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Linking, View } from 'react-native';
import { MessageCircle, Phone, Mail } from 'lucide-react-native';

interface SupportButtonProps {
  variant?: 'compact' | 'full';
}

export function SupportButton({ variant = 'compact' }: SupportButtonProps) {
  const supportOptions = [
    {
      icon: <MessageCircle size={18} color="#ff6b35" />,
      label: 'Telegram',
      url: 'https://t.me/ogaslpg',
    },
    {
      icon: <Phone size={18} color="#ff6b35" />,
      label: 'WhatsApp',
      url: 'https://wa.me/234XXXXXXXXXX',
    },
    {
      icon: <Mail size={18} color="#ff6b35" />,
      label: 'Email',
      url: 'mailto:support@ogaslpgmarketplace.com',
    },
  ];

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={styles.compactBtn}
        onPress={() => Linking.openURL('https://t.me/ogaslpg')}
      >
        <MessageCircle size={16} color="#ff6b35" />
        <Text style={styles.compactText}>Support</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.fullContainer}>
      <Text style={styles.title}>Need Help?</Text>
      <Text style={styles.subtitle}>Our team is here to assist you</Text>
      
      {supportOptions.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={styles.optionBtn}
          onPress={() => Linking.openURL(option.url)}
        >
          {option.icon}
          <Text style={styles.optionText}>{option.label}</Text>
        </TouchableOpacity>
      ))}
      
      <Text style={styles.responseTime}>We typically respond within 2 hours</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  compactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  compactText: { color: '#ff6b35', fontSize: 12, fontWeight: '600' },
  fullContainer: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#888', fontSize: 13, marginBottom: 16 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  optionText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  responseTime: { color: '#666', fontSize: 12, textAlign: 'center', marginTop: 12 },
});
