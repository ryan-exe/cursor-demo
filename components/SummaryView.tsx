import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming
} from 'react-native-reanimated';

import { Colors, Fonts, Radii, Shadow, Spacing } from '../constants/theme';

interface SummaryViewProps {
  summary: string;
  onNewStandup: () => void;
}

export default function SummaryView({
  summary,
  onNewStandup,
}: SummaryViewProps) {
  const copyScale = useSharedValue(1);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(summary);
    setCopied(true);
    copyScale.value = withSequence(
      withTiming(0.92, { duration: 80 }),
      withSpring(1, { damping: 8 }),
    );
    setTimeout(() => setCopied(false), 2500);
  };

  const copyBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: copyScale.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.slackIcon}>💬</Text>
          <Text style={styles.cardTitle}>Ready for Slack</Text>
        </View>
        <Text style={styles.summaryText}>{summary}</Text>
      </View>

      <Animated.View style={copyBtnStyle}>
        <TouchableOpacity
          style={styles.copyBtn}
          onPress={handleCopy}
          activeOpacity={0.85}
        >
          <Text style={styles.copyBtnText}>
            {copied ? "✓  Copied!" : "Copy for Slack"}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity
        onPress={onNewStandup}
        style={styles.newBtn}
        activeOpacity={0.7}
      >
        <Text style={styles.newBtnText}>Start a new standup →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  summaryCard: {
    backgroundColor: Colors.offWhite,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  slackIcon: {
    fontSize: 20,
  },
  cardTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.textMid,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  summaryText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    lineHeight: 26,
    color: Colors.textDark,
  },
  copyBtn: {
    backgroundColor: Colors.red,
    borderRadius: Radii.full,
    paddingVertical: 18,
    alignItems: "center",
    ...Shadow.button,
  },
  copyBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  newBtn: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  newBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.textLight,
  },
});
