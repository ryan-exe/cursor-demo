import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const GITHUB_URL = 'https://github.com/ryan-exe/cursor-demo';
const QR_URL = 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&color=1A0005&bgcolor=FFFFFF&data=exp%3A%2F%2Fu.expo.dev%2Fcursor-demo&qzone=2';
import Animated, {
    FadeIn, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming,
} from 'react-native-reanimated';

import SummaryView from '../components/SummaryView';
import { Colors, Fonts, Radii, Spacing } from '../constants/theme';
import { generateSummary, Transcript } from '../services/gemini';

export default function SummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ transcripts: string }>();
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const headerY = useSharedValue(32);
  const headerScale = useSharedValue(0.94);
  const headerOpacity = useSharedValue(0);
  const cardY = useSharedValue(60);
  const cardScale = useSharedValue(0.92);
  const cardOpacity = useSharedValue(0);

  const transcripts: Transcript[] = React.useMemo(() => {
    try {
      return JSON.parse(params.transcripts ?? "[]");
    } catch {
      return [];
    }
  }, [params.transcripts]);

  useEffect(() => {
    headerY.value = withDelay(60, withSpring(0, { damping: 20, stiffness: 200, mass: 0.8 }));
    headerScale.value = withDelay(60, withSpring(1, { damping: 20, stiffness: 200, mass: 0.8 }));
    headerOpacity.value = withDelay(60, withTiming(1, { duration: 200 }));
    cardY.value = withDelay(180, withSpring(0, { damping: 22, stiffness: 180, mass: 0.9 }));
    cardScale.value = withDelay(180, withSpring(1, { damping: 22, stiffness: 180, mass: 0.9 }));
    cardOpacity.value = withDelay(180, withTiming(1, { duration: 220 }));

    if (transcripts.length === 0) {
      setSummary("No updates were recorded for this standup.");
      return;
    }

    generateSummary(transcripts)
      .then(setSummary)
      .catch((e) => {
        console.error(e);
        setError(
          "Could not generate summary. Check your API key and try again.",
        );
      });
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerY.value }, { scale: headerScale.value }],
    opacity: headerOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardY.value }, { scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const handleNewStandup = () => {
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Red header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <Text style={styles.eyebrow}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </Text>
        <Text style={styles.title}>YOUR{"\n"}STANDUP</Text>
        {transcripts.length > 0 && (
          <View style={styles.countPill}>
            <Text style={styles.countText}>
              {transcripts.length}{" "}
              {transcripts.length === 1 ? "person" : "people"}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Web-only banner */}
      {Platform.OS === 'web' && (
        <View style={styles.webBar}>
          <TouchableOpacity
            style={styles.webGithubBtn}
            onPress={() => Linking.openURL(GITHUB_URL)}
            activeOpacity={0.8}
          >
            <Text style={styles.webGithubIcon}>{'{ }'}</Text>
            <Text style={styles.webGithubText}>View on GitHub</Text>
          </TouchableOpacity>

          <View style={styles.webQrBlock}>
            <Image
              source={{ uri: QR_URL }}
              style={styles.webQrImage}
              resizeMode="contain"
            />
            <View style={styles.webQrLabel}>
              <Text style={styles.webQrTitle}>Get the app</Text>
              <Text style={styles.webQrSub}>Scan with Expo Go</Text>
            </View>
          </View>
        </View>
      )}

      {/* White card */}
      <Animated.View
        style={[styles.card, cardStyle]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {!summary && !error && (
            <Animated.View
              entering={FadeIn.duration(400)}
              style={styles.loadingContainer}
            >
              <ActivityIndicator color={Colors.red} size="large" />
              <Text style={styles.loadingText}>
                Gemini is writing the summary...
              </Text>
            </Animated.View>
          )}

          {error && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={styles.errorBox}
            >
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          {summary && (
            <Animated.View entering={FadeIn.duration(400)}>
              <SummaryView summary={summary} onNewStandup={handleNewStandup} />
            </Animated.View>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.red,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  eyebrow: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.muted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 40,
    color: Colors.white,
    letterSpacing: -1,
    lineHeight: 42,
    marginTop: Spacing.xs,
  },
  countPill: {
    alignSelf: "flex-start",
    backgroundColor: Colors.glass,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.sm,
  },
  countText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.white,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    overflow: "hidden",
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  scrollContent: {
    padding: Spacing.lg,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    paddingVertical: Spacing.xxl * 2,
  },
  loadingText: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: Colors.textMid,
    textAlign: "center",
  },
  errorBox: {
    backgroundColor: "#FFF0F0",
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  errorText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.red,
    lineHeight: 22,
  },

  // Web-only banner
  webBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: Radii.lg,
    gap: Spacing.md,
  },
  webGithubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radii.full,
  },
  webGithubIcon: {
    fontSize: 16,
    color: Colors.textDark,
  },
  webGithubText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.textDark,
  },
  webQrBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.sm,
  },
  webQrImage: {
    width: 72,
    height: 72,
    borderRadius: Radii.sm,
  },
  webQrLabel: {
    gap: 2,
    paddingRight: Spacing.sm,
  },
  webQrTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.textDark,
  },
  webQrSub: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textLight,
  },
});
