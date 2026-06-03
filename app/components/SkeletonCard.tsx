import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function SkeletonCard() {
  const pulseAnim = React.useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity: pulseAnim }]}>
      <View style={styles.imageSkeleton} />
      <View style={styles.content}>
        <View style={styles.titleSkeleton} />
        <View style={styles.lineSkeleton} />
        <View style={styles.footerSkeleton} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  imageSkeleton: {
    height: 140,
    backgroundColor: Colors.dark.elevated,
  },
  content: {
    padding: 14,
  },
  titleSkeleton: {
    height: 18,
    width: '60%',
    backgroundColor: Colors.dark.elevated,
    borderRadius: 4,
    marginBottom: 10,
  },
  lineSkeleton: {
    height: 13,
    width: '80%',
    backgroundColor: Colors.dark.elevated,
    borderRadius: 4,
    marginBottom: 10,
  },
  footerSkeleton: {
    height: 16,
    width: '40%',
    backgroundColor: Colors.dark.elevated,
    borderRadius: 4,
  },
});
