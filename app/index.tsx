import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput,
    TouchableOpacity, View
} from 'react-native';
import Animated, {
    useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming
} from 'react-native-reanimated';

import PersonCard from '../components/PersonCard';
import { Colors, Fonts, Radii, Shadow, Spacing } from '../constants/theme';
import { useTeamStore } from '../store/teamStore';

export default function HomeScreen() {
  const router = useRouter();
  const { team, loaded, addMember, removeMember } = useTeamStore();
  const [newName, setNewName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const startBtnScale = useSharedValue(1);

  const handleAdd = () => {
    if (newName.trim()) {
      addMember(newName.trim());
      setNewName("");
    }
  };

  const handleStartStandup = () => {
    if (team.length === 0) return;
    startBtnScale.value = withSequence(
      withTiming(0.94, { duration: 80 }),
      withSpring(1, { damping: 8 }),
    );
    setTimeout(() => router.push("/standup"), 120);
  };

  const startBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: startBtnScale.value }],
  }));

  return (
    <View style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Red header */}
        <View style={styles.header}>
          <Text style={styles.appName}>STANDUP</Text>
          <Text style={styles.tagline}>Who's on today?</Text>
        </View>

        {/* White card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Team</Text>
            <TouchableOpacity
              onPress={() => setIsEditing(!isEditing)}
              style={styles.editBtn}
            >
              <Text style={styles.editBtnText}>
                {isEditing ? "Done" : "Edit"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.listScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {loaded &&
              team.map((member, i) => (
                <PersonCard
                  key={member.id}
                  member={member}
                  index={i}
                  showRemove={isEditing}
                  onRemove={removeMember}
                />
              ))}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Add person row */}
            <View style={styles.addRow}>
              <View style={styles.addAvatar}>
                <Text style={styles.addAvatarIcon}>+</Text>
              </View>
              <TextInput
                ref={inputRef}
                style={styles.addInput}
                placeholder="Add a person..."
                placeholderTextColor={Colors.textLight}
                value={newName}
                onChangeText={setNewName}
                onSubmitEditing={handleAdd}
                returnKeyType="done"
              />
              {newName.trim().length > 0 && (
                <TouchableOpacity
                  onPress={handleAdd}
                  style={styles.addConfirmBtn}
                >
                  <Text style={styles.addConfirmText}>Add</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          {/* Start button */}
          <View style={styles.startBtnWrapper}>
            <Animated.View style={startBtnStyle}>
              <TouchableOpacity
                style={[
                  styles.startBtn,
                  team.length === 0 && styles.startBtnDisabled,
                ]}
                onPress={handleStartStandup}
                disabled={team.length === 0}
                activeOpacity={0.85}
              >
                <Text style={styles.startBtnText}>Start Standup →</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.red,
    paddingTop: 96,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.xs,
  },
  appName: {
    fontFamily: Fonts.display,
    fontSize: 52,
    color: Colors.white,
    letterSpacing: -1,
    lineHeight: 56,
  },
  tagline: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    color: Colors.muted,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    borderBottomLeftRadius: Radii.xxl,
    borderBottomRightRadius: Radii.xxl,
    paddingTop: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: Colors.textDark,
    letterSpacing: -0.5,
  },
  editBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.border,
    borderRadius: Radii.full,
  },
  editBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.textMid,
  },
  listScroll: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.md,
  },
  addAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  addAvatarIcon: {
    fontSize: 22,
    color: Colors.textLight,
    fontFamily: Fonts.regular,
  },
  addInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 17,
    color: Colors.textDark,
    paddingVertical: Spacing.sm,
  },
  addConfirmBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    backgroundColor: Colors.red,
    borderRadius: Radii.full,
  },
  addConfirmText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.white,
  },
  startBtnWrapper: {
    padding: Spacing.lg,
    paddingBottom: Platform.OS === "android" ? Spacing.xxl : Spacing.xl,
  },
  startBtn: {
    backgroundColor: Colors.red,
    borderRadius: Radii.full,
    paddingVertical: 18,
    alignItems: "center",
    ...Shadow.button,
  },
  startBtnDisabled: {
    opacity: 0.4,
  },
  startBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.white,
    letterSpacing: 0.3,
  },
});
