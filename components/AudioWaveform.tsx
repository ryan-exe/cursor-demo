import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

const BAR_COUNT = 28;
const BAR_WIDTH = 4;
const BAR_GAP = 3;
const MAX_HEIGHT = 56;
const MIN_HEIGHT = 4;
const IDLE_HEIGHT = 8;

// Per-bar multiplier for organic, uneven feel
const BAR_MULTIPLIERS = Array.from(
  { length: BAR_COUNT },
  (_, i) => 0.4 + 0.6 * Math.abs(Math.sin(i * 0.7 + 1.3))
);

interface AudioWaveformProps {
  isRecording: boolean;
  metering?: number; // dBFS value from expo-av, typically -160 to 0
  color?: string;
}

const AnimatedBar = ({
  index,
  isRecording,
  metering,
  color,
}: {
  index: number;
  isRecording: boolean;
  metering: number;
  color: string;
}) => {
  const height = useSharedValue(IDLE_HEIGHT);

  useEffect(() => {
    if (!isRecording) {
      // Breathing idle animation
      const delay = index * 40;
      height.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(IDLE_HEIGHT + BAR_MULTIPLIERS[index] * 6, { duration: 800 }),
            withTiming(IDLE_HEIGHT, { duration: 800 })
          ),
          -1,
          true
        )
      );
      return;
    }

    // Map dBFS to height: clamp to [-60, 0] range
    const db = Math.max(-60, Math.min(0, metering));
    const normalized = (db + 60) / 60; // 0 to 1
    const targetHeight =
      MIN_HEIGHT + normalized * (MAX_HEIGHT - MIN_HEIGHT) * BAR_MULTIPLIERS[index];

    height.value = withSpring(Math.max(MIN_HEIGHT, targetHeight), {
      damping: 12,
      stiffness: 180,
    });
  }, [isRecording, metering, index]);

  const animStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        { width: BAR_WIDTH, backgroundColor: color },
        animStyle,
      ]}
    />
  );
};

export default function AudioWaveform({
  isRecording,
  metering = -60,
  color = '#FFFFFF',
}: AudioWaveformProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <AnimatedBar
          key={i}
          index={i}
          isRecording={isRecording}
          metering={metering}
          color={color}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BAR_GAP,
    height: MAX_HEIGHT + 8,
    paddingHorizontal: 4,
  },
  bar: {
    borderRadius: 99,
  },
});
