import { signup } from "@/src/services/auth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "@/src/context/AuthContext";

export default function SignupPage() {
  const insets = useSafeAreaInsets();
  const { setUser } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [role, setRole] = useState<"patient" | "provider" | "admin">("patient");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert("Missing info", "Please fill fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(
        "Passwords don't match, Please make sure both passwords are the same",
      );
      return;
    }

    try {
      setLoading(true);
      const data = await signup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        role,
      });
      setUser(data.user);
      Alert.alert("Account created", `Welcome ${data.user.firstName}!`);
      router.replace("/(tabs)/dashboard");
    } catch (error: any) {
      Alert.alert("Sign up failed", error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          {/* <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={12}>
              <Ionicons name="chevron-back" size={28} color="#1D4ED8" />
            </Pressable>
          </View> */}

          <View style={styles.card}>
            <Text style={styles.title}>Sign up</Text>

            <Text style={styles.label}>First name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="John"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />

            <Text style={styles.label}>Last name</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Doe"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />

            <Text style={styles.label}>Role</Text>
            <View style={styles.pickerWrap}>
              <Picker selectedValue={role} onValueChange={(v) => setRole(v)}>
                <Picker.Item label="Patient" value="patient" />
                <Picker.Item label="Provider" value="provider" />
                <Picker.Item label="Admin" value="admin" />
              </Picker>
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                placeholder="**********"
                placeholderTextColor="#9CA3AF"
                style={[styles.input, styles.passwordInput]}
              />
              <Pressable onPress={() => setShowPw((v) => !v)} style={styles.eyeBtn} hitSlop={12}>
                <Ionicons name={showPw ? "eye-off" : "eye"} size={22} color="#0B0F19" />
              </Pressable>
            </View>

            <Text style={styles.label}>Confirm password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPw}
                placeholder="**********"
                placeholderTextColor="#9CA3AF"
                style={[styles.input, styles.passwordInput]}
              />
              <Pressable onPress={() => setShowConfirmPw((v) => !v)} style={styles.eyeBtn} hitSlop={12}>
                <Ionicons name={showConfirmPw ? "eye-off" : "eye"} size={22} color="#0B0F19" />
              </Pressable>
            </View>

            <Pressable onPress={onSubmit} disabled={loading} style={[styles.button, loading && styles.buttonDisabled]}>
              <Text style={styles.buttonText}>{loading ? "Creating..." : "Create account"}</Text>
            </Pressable>

            <View style={{ marginTop: 14, alignItems: "center" }}>
              <Text style={{ color: "#0B0F19", opacity: 0.7 }}>
                Already have an account?{" "}
                <Text style={{ color: "#1D4ED8", fontWeight: "700" }} onPress={() => router.replace("/login")}>
                  Log in
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  headerRow: { marginBottom: 10 },
  iconBtn: { alignSelf: "flex-start", padding: 6, borderRadius: 999 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E6EAF2",
    padding: 18,
  },
  title: { fontSize: 32, fontWeight: "800", marginBottom: 12, color: "#0B0F19" },

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

  pickerWrap: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
  },

  passwordWrap: { position: "relative", justifyContent: "center" },
  passwordInput: { paddingRight: 44 },
  eyeBtn: { position: "absolute", right: 10, height: "100%", justifyContent: "center" },

  button: {
    marginTop: 8,
    backgroundColor: "#1D4ED8",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});