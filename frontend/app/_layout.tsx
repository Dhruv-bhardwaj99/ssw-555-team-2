import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useMemo } from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const LightAppTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: "#FFFFFF", // white background
        card: "#FFFFFF",       // header / stack card background
        text: "#0B0F19",       // black text
        border: "#E6EAF2",     // soft border
        primary: "#1D4ED8",    // blue accent
        notification: "#16A34A", // green accent
      },
    }),
    []
  );

  const DarkAppTheme = useMemo(
    () => ({
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        primary: "#60A5FA",      // lighter blue in dark mode
        notification: "#34D399", // lighter green in dark mode
      },
    }),
    []
  );

  const theme = colorScheme === "dark" ? DarkAppTheme : LightAppTheme;

  return (
    <ThemeProvider value={theme}>
      <Stack screenOptions={{ contentStyle: { backgroundColor: theme.colors.background } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
      </Stack>
      <StatusBar style={colorScheme === "light" ? "light" : "dark"} />
    </ThemeProvider>
  );
}