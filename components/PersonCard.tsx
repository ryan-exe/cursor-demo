import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withDelay,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Fonts, Radii, Spacing } from '../constants/theme';
import { TeamMember } from '../store/teamStore';

interface PersonCardProps {
  member: TeamMember;
  index: number;
  onRemove?: (id: string) => void;
  showRemove?: boolean;
  status?: 'pending' | 'recording' | 'done';
}

export default function PersonCard({
  member,
  index,
  onRemove,
  showRemove = false,
  status = 'pending',
}: PersonCardProps) {
  const translateY = useSharedValue(48);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.88);

  useEffect(() => {
    const delay = index * 45;
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 14, stiffness: 200, mass: 0.8 })
    );
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 14, stiffness: 200, mass: 0.8 })
    );
    opacity.value = withDelay(delay, withSpring(1, { damping: 20, stiffness: 300 }));
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const initials = member.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Animated.View style={[styles.card, cardStyle]}>
      <View style={[styles.avatar, { backgroundColor: member.avatarColor }]}>
        <Text style={styles.initials}>{initials}</Text>
      </View>
      <Text style={styles.name}>{member.name}</Text>
      <View style={styles.right}>
        {status === 'done' && (
          <View style={styles.doneBadge}>
            <Text style={styles.doneText}>✓</Text>
          </View>
        )}
        {status === 'recording' && (
          <View style={styles.recordingDot} />
        )}
        {showRemove && onRemove && (
          <TouchableOpacity
            onPress={() => onRemove(member.id)}
            style={styles.removeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.removeText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.white,
  },
  name: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: Colors.textDark,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  doneBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.red,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: Colors.textLight,
    fontSize: 20,
    lineHeight: 24,
    fontFamily: Fonts.regular,
  },
});
