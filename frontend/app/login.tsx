import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { login } from "@/src/services/auth";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const insets = useSafeAreaInsets();

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Please enter email and password");
      return;
    }

    try {
      setLoading(true);
      const data = await login(email.trim(), password);
      Alert.alert("Success", `Welcome ${data.user.firstName}`);
      router.replace("/(tabs)/dashboard");
    } catch (error: any) {
      Alert.alert("Login failed", error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backBtn}
              hitSlop={12}
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={28} color="#1D4ED8" />
            </Pressable>
          </View> */}

          <View style={styles.card}>
            <Text style={styles.title}>Login</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              returnKeyType="next"
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                placeholder="**********"
                placeholderTextColor="#9CA3AF"
                style={[styles.input, styles.passwordInput]}
                returnKeyType="done"
              />

              <Pressable
                onPress={() => setShowPw((v) => !v)}
                style={styles.eyeBtn}
                hitSlop={12}
                accessibilityLabel={showPw ? "Hide password" : "Show password"}
              >
                <Ionicons
                  name={showPw ? "eye-off" : "eye"}
                  size={22}
                  color="#0B0F19"
                />
              </Pressable>
            </View>

            <Pressable
              onPress={onSubmit}
              disabled={loading}
              style={[styles.button, loading && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>
                {loading ? "Signing in..." : "Sign in"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don’t have an account?</Text>

            <Pressable onPress={() => router.replace("/signup")} hitSlop={10}>
              <Text style={styles.signupLink}>Sign up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 15,
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  headerRow: {
    marginBottom: 10,
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    borderRadius: 999,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E6EAF2",
    padding: 18,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 18,
    color: "#0B0F19",
  },
  label: {
    fontSize: 14,
    marginTop: 10,
    marginBottom: 6,
    color: "#0B0F19",
    opacity: 0.85,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#0B0F19",
    backgroundColor: "#FFFFFF",
  },
  passwordWrap: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 44, // space for eye button
  },
  eyeBtn: {
    position: "absolute",
    right: 10,
    height: "100%",
    justifyContent: "center",
  },

  button: {
    marginTop: 18,
    backgroundColor: "#1D4ED8", // match dashboard blue
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  signupRow: {
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  signupText: { color: "#0B0F19", opacity: 0.7 },
  signupLink: { color: "#1D4ED8", fontWeight: "700" },
});
