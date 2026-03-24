import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import RefreshableScroll from "@/components/RefreshableScroll";

export default function ProfileTab() {
  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    // Later: re-check auth / fetch profile
  });
  return (
    <RefreshableScroll
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{
        flexGrow: 1,
        padding: 24,
        paddingTop: 56,
        backgroundColor: "#fff",
      }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>You’re not logged in yet.</Text>

        <Pressable style={styles.button} onPress={() => router.push("/login")}>
          <Text style={styles.buttonText}>Go to Login</Text>
        </Pressable>
      </View>
    </RefreshableScroll>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 56,
    backgroundColor: "#FFFFFF",
  },
  title: { fontSize: 28, fontWeight: "800", color: "#0B0F19" },
  subtitle: { marginTop: 8, opacity: 0.7, color: "#0B0F19" },
  button: {
    marginTop: 18,
    backgroundColor: "#1D4ED8",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
