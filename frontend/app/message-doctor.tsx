import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../src/context/AuthContext";
import { sendMessage } from "../src/services/messages";
import { fetchDoctors, Doctor } from "../src/services/appointments";
import { validateMessage, MESSAGE_MAX_LENGTH } from "../src/utils/messageValidation";

export default function MessageComposer() {
  const router = useRouter();
  const { user } = useAuth();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showDoctorPicker, setShowDoctorPicker] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchDoctors()
      .then(setDoctors)
      .catch(() => Alert.alert("Error", "Could not load doctors"))
      .finally(() => setLoadingDoctors(false));
  }, []);

  const addBold = () => setBody((prev) => prev + "**bold text**");
  const addItalic = () => setBody((prev) => prev + "*italic text*");
  const addBullet = () => setBody((prev) => prev + "\n• ");

  async function handleSend() {
    if (!user) {
      Alert.alert("Error", "You must be logged in to send a message");
      return;
    }
    if (!selectedDoctor) {
      Alert.alert("Error", "Please select a doctor");
      return;
    }
    const check = validateMessage(subject, body);
    if (!check.valid) {
      Alert.alert("Error", check.error);
      return;
    }

    setSending(true);
    try {
      const isPatient = user.role === "patient";
      await sendMessage({
        patient_id: isPatient ? user._id : selectedDoctor._id,
        doctor_id: isPatient ? selectedDoctor._id : user._id,
        sender_id: user._id,
        sender_role: user.role,
        subject: subject.trim(),
        body: body.trim(),
        encrypted: false,
      });
      Alert.alert("Sent", "Your message was sent successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Could not send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1D4ED8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Message</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Doctor selector */}
        <Text style={styles.label}>To</Text>
        {loadingDoctors ? (
          <ActivityIndicator color="#1D4ED8" style={{ marginBottom: 12 }} />
        ) : (
          <>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowDoctorPicker((v) => !v)}
            >
              <Text
                style={[
                  styles.selectorText,
                  !selectedDoctor && styles.selectorPlaceholder,
                ]}
              >
                {selectedDoctor
                  ? `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`
                  : "Select a doctor"}
              </Text>
              <Ionicons
                name={showDoctorPicker ? "chevron-up" : "chevron-down"}
                size={18}
                color="#0B0F19"
              />
            </TouchableOpacity>

            {showDoctorPicker && (
              <View style={styles.dropdown}>
                {doctors.map((doc) => (
                  <TouchableOpacity
                    key={doc._id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedDoctor(doc);
                      setShowDoctorPicker(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>
                      Dr. {doc.firstName} {doc.lastName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {/* Subject */}
        <Text style={styles.label}>Subject</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter subject"
          placeholderTextColor="rgba(11,15,25,0.4)"
          value={subject}
          onChangeText={setSubject}
        />

        {/* Formatting toolbar */}
        <Text style={styles.label}>Formatting</Text>
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolButton} onPress={addBold}>
            <Text style={styles.toolText}>B</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton} onPress={addItalic}>
            <Text style={[styles.toolText, { fontStyle: "italic" }]}>I</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton} onPress={addBullet}>
            <Text style={styles.toolText}>•</Text>
          </TouchableOpacity>
        </View>

        {/* Body */}
        <Text style={styles.label}>Message</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Write your message..."
          placeholderTextColor="rgba(11,15,25,0.4)"
          value={body}
          onChangeText={setBody}
          multiline
          textAlignVertical="top"
        />
        <Text
          style={[
            styles.charCount,
            body.length > MESSAGE_MAX_LENGTH && styles.charCountOver,
          ]}
        >
          {body.length} / {MESSAGE_MAX_LENGTH.toLocaleString()}
        </Text>

        {/* Send button */}
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendText}>Send Message</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E6EAF2",
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0B0F19",
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0B0F19",
    opacity: 0.65,
    marginTop: 16,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E6EAF2",
    borderRadius: 10,
    padding: 14,
    backgroundColor: "#F8FAFC",
  },
  selectorText: {
    fontSize: 15,
    color: "#0B0F19",
    fontWeight: "600",
  },
  selectorPlaceholder: {
    color: "rgba(11,15,25,0.4)",
    fontWeight: "400",
  },
  dropdown: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#E6EAF2",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E6EAF2",
  },
  dropdownItemText: {
    fontSize: 15,
    color: "#0B0F19",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E6EAF2",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: "#0B0F19",
    backgroundColor: "#F8FAFC",
  },
  toolbar: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  toolButton: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  toolText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#E6EAF2",
    borderRadius: 10,
    padding: 14,
    minHeight: 160,
    fontSize: 15,
    color: "#0B0F19",
    backgroundColor: "#F8FAFC",
  },
  charCount: {
    fontSize: 12,
    color: "rgba(11,15,25,0.4)",
    textAlign: "right",
    marginTop: 4,
  },
  charCountOver: {
    color: "#EF4444",
    fontWeight: "700",
  },
  sendButton: {
    backgroundColor: "#1D4ED8",
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#BFDBFE",
  },
  sendText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});