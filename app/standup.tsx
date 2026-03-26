import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import Animated, {
    FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSpring, withTiming
} from 'react-native-reanimated';

import AudioWaveform from '../components/AudioWaveform';
import RecordButton from '../components/RecordButton';
import { Colors, Fonts, Radii, Spacing } from '../constants/theme';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { transcribeAudio } from '../services/gemini';
import { useTeamStore } from '../store/teamStore';

type StepState = "idle" | "recording" | "processing" | "done";

interface PersonResult {
  name: string;
  text: string;
}

export default function StandupScreen() {
  const router = useRouter();
  const { team } = useTeamStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stepState, setStepState] = useState<StepState>("idle");
  const [metering, setMetering] = useState(-60);
  const [results, setResults] = useState<PersonResult[]>([]);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const cardSlide = useSharedValue(280);
  const cardScale = useSharedValue(0.92);
  const cardOpacity = useSharedValue(0);

  const { startRecording, stopRecording } = useAudioRecorder((db) =>
    setMetering(db),
  );

  const currentMember = team[currentIndex];
  const isLastPerson = currentIndex === team.length - 1;

  useEffect(() => {
    animateCardIn();
  }, []);

  useEffect(() => {
    cardSlide.value = 280;
    cardScale.value = 0.92;
    cardOpacity.value = 0;
    animateCardIn();
    setLastTranscript(null);
    setStepState("idle");
  }, [currentIndex]);

  const animateCardIn = () => {
    cardSlide.value = withSpring(0, { damping: 22, stiffness: 180, mass: 0.9 });
    cardScale.value = withSpring(1, { damping: 22, stiffness: 180, mass: 0.9 });
    cardOpacity.value = withTiming(1, { duration: 180 });
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardSlide.value }, { scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const handleRecord = useCallback(async () => {
    if (stepState === "recording") {
      setStepState("processing");
      setMetering(-60);
      try {
        const result = await stopRecording();
        if (result) {
          const text = await transcribeAudio(
            currentMember.name,
            result.base64,
            result.mimeType,
          );
          setLastTranscript(text);
          setResults((prev) => [...prev, { name: currentMember.name, text }]);
        }
      } catch (e) {
        console.error(e);
        setLastTranscript("(Could not transcribe)");
        setResults((prev) => [
          ...prev,
          { name: currentMember.name, text: "(Could not transcribe)" },
        ]);
      }
      setStepState("done");
    } else if (stepState === "idle") {
      try {
        await startRecording();
        setStepState("recording");
      } catch (e) {
        console.error("Failed to start recording", e);
      }
    }
  }, [stepState, currentMember]);

  const handleNext = () => {
    if (isLastPerson) {
      router.push({
        pathname: "/summary",
        params: { transcripts: JSON.stringify(results) },
      });
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  if (!currentMember) return null;

  const initials = currentMember.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Progress dots */}
      <View style={styles.progressRow}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← Exit</Text>
        </TouchableOpacity>
        <View style={styles.dots}>
          {team.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < currentIndex && styles.dotDone,
                i === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <Text style={styles.progressLabel}>
          {currentIndex + 1}/{team.length}
        </Text>
      </View>

      {/* Person info */}
      <View style={styles.personSection}>
        <View
          style={[
            styles.bigAvatar,
            { backgroundColor: currentMember.avatarColor },
          ]}
        >
          <Text style={styles.bigInitials}>{initials}</Text>
        </View>
        <Text style={styles.personName}>{currentMember.name}</Text>
        <Text style={styles.personHint}>
          {stepState === "idle" && "Tap to start recording"}
          {stepState === "recording" && "Listening..."}
          {stepState === "processing" && "Transcribing..."}
          {stepState === "done" && "All done!"}
        </Text>
      </View>

      {/* White card area */}
      <Animated.View style={[styles.card, cardStyle]}>
        {/* Waveform */}
        <View style={styles.waveformContainer}>
          <AudioWaveform
            isRecording={stepState === "recording"}
            metering={metering}
            color={stepState === "recording" ? Colors.red : Colors.border}
          />
        </View>

        {/* Processing spinner */}
        {stepState === "processing" && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={styles.processingRow}
          >
            <ActivityIndicator color={Colors.red} size="small" />
            <Text style={styles.processingText}>Asking Gemini...</Text>
          </Animated.View>
        )}

        {/* Transcript preview */}
        {stepState === "done" && lastTranscript && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.transcriptBox}
          >
            <Text style={styles.transcriptLabel}>Transcript</Text>
            <ScrollView
              style={styles.transcriptScroll}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.transcriptText}>{lastTranscript}</Text>
            </ScrollView>
          </Animated.View>
        )}

        {/* Record button */}
        <View style={styles.recordArea}>
          <RecordButton
            isRecording={stepState === "recording"}
            onPress={handleRecord}
            disabled={stepState === "processing"}
          />
        </View>

        {/* Next button — only when done */}
        {stepState === "done" && (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={styles.nextBtnWrapper}
          >
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>
                {isLastPerson
                  ? "See Summary →"
                  : `Next: ${team[currentIndex + 1]?.name} →`}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Skip option */}
        {(stepState === "idle" || stepState === "recording") && (
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={handleNext}
            activeOpacity={0.6}
          >
            <Text style={styles.skipText}>
              {isLastPerson ? "Skip to summary" : "Skip"}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.red,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  backBtn: {
    paddingVertical: Spacing.xs,
  },
  backText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.muted,
  },
  dots: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.glassMid,
  },
  dotActive: {
    backgroundColor: Colors.white,
    width: 20,
  },
  dotDone: {
    backgroundColor: Colors.muted,
  },
  progressLabel: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.muted,
    minWidth: 36,
    textAlign: "right",
  },
  personSection: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  bigAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  bigInitials: {
    fontFamily: Fonts.display,
    fontSize: 32,
    color: Colors.white,
  },
  personName: {
    fontFamily: Fonts.display,
    fontSize: 40,
    color: Colors.white,
    letterSpacing: -1,
  },
  personHint: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.muted,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    borderBottomLeftRadius: Radii.xl,
    borderBottomRightRadius: Radii.xl,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    alignItems: "center",
  },
  waveformContainer: {
    alignItems: "center",
    width: "100%",
  },
  processingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  processingText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.textMid,
  },
  transcriptBox: {
    width: "100%",
    backgroundColor: Colors.offWhite,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  transcriptLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.textLight,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: Spacing.xs,
  },
  transcriptScroll: {
    maxHeight: 80,
  },
  transcriptText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textDark,
  },
  recordArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtnWrapper: {
    width: "100%",
  },
  nextBtn: {
    backgroundColor: Colors.red,
    borderRadius: Radii.full,
    paddingVertical: 18,
    alignItems: "center",
  },
  nextBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  skipBtn: {
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  skipText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.textLight,
  },
});
