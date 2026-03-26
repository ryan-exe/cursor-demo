import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/theme';

interface RecordButtonProps {
  isRecording: boolean;
  onPress: () => void;
  disabled?: boolean;
}

const BUTTON_SIZE = 88;
const RING_SIZE = BUTTON_SIZE + 24;

const PulseRing = ({ delay, isRecording }: { delay: number; isRecording: boolean }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isRecording) {
      scale.value = 1;
      opacity.value = 0.6;
      scale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: delay }),
          withTiming(1.8, { duration: 800, easing: Easing.out(Easing.ease) }),
          withTiming(1.8, { duration: 0 })
        ),
        -1,
        false
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: delay }),
          withTiming(0, { duration: 800, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      );
    } else {
      scale.value = withSpring(1);
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isRecording, delay]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.pulseRing, ringStyle]} />;
};

export default function RecordButton({ isRecording, onPress, disabled }: RecordButtonProps) {
  const scale = useSharedValue(1);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.9, { duration: 80 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );
    onPress();
  };

  return (
    <View style={styles.wrapper}>
      {isRecording && (
        <>
          <PulseRing delay={0} isRecording={isRecording} />
          <PulseRing delay={300} isRecording={isRecording} />
          <PulseRing delay={600} isRecording={isRecording} />
        </>
      )}
      <Animated.View style={buttonStyle}>
        <TouchableOpacity
          onPress={handlePress}
          disabled={disabled}
          activeOpacity={0.85}
          style={[styles.button, isRecording && styles.buttonRecording]}
        >
          {isRecording ? (
            <View style={styles.stopIcon} />
          ) : (
            <MicIcon />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function MicIcon() {
  return (
    <View style={styles.micContainer}>
      <View style={styles.micBody} />
      <View style={styles.micBase} />
      <View style={styles.micStand} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonRecording: {
    backgroundColor: Colors.white,
  },
  stopIcon: {
    width: 28,
    height: 28,
    backgroundColor: Colors.red,
    borderRadius: 6,
  },
  micContainer: {
    alignItems: 'center',
    gap: 2,
  },
  micBody: {
    width: 20,
    height: 28,
    backgroundColor: Colors.red,
    borderRadius: 10,
  },
  micBase: {
    width: 28,
    height: 14,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderWidth: 3,
    borderColor: Colors.red,
    borderBottomWidth: 0,
    marginTop: -2,
  },
  micStand: {
    width: 3,
    height: 6,
    backgroundColor: Colors.red,
    borderRadius: 2,
  },
});
