import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Syne_800ExtraBold, useFonts } from '@expo-google-fonts/syne';

import { Colors } from '../constants/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Syne_800ExtraBold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.red,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={Colors.white} size="large" />
      </View>
    );
  }

  const stack = (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.red },
        animation: Platform.OS === "web" ? "none" : "slide_from_right",
      }}
    />
  );

  return (
    <>
      <StatusBar style="light" />
      {Platform.OS === "web" ? (
        <View style={styles.webOuter}>
          <View style={styles.webInner}>{stack}</View>
        </View>
      ) : (
        stack
      )}
    </>
  );
}

const styles = StyleSheet.create({
  webOuter: {
    flex: 1,
    backgroundColor: Colors.red,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  webInner: {
    width: "100%",
    maxWidth: 600,
    flex: 1,
    overflow: "hidden",
  },
});
