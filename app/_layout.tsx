import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { queryClient } from '../src/lib/queryClient';
import { loadStoredTheme, ThemeProvider, Colors } from '../src/theme';
import { ToastHost } from '../src/components/Toast';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await SplashScreen.preventAutoHideAsync();
      } catch {}
      // Apply the saved theme BEFORE the first screen renders.
      // (Icons are font-free SVGs now — nothing to preload.)
      await loadStoredTheme();
      setReady(true);
      try {
        await SplashScreen.hideAsync();
      } catch {}
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="workouts" />
          <Stack.Screen name="nutrition" />
          <Stack.Screen name="yoga" />
          <Stack.Screen name="progress" />
        </Stack>
        <ToastHost />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
