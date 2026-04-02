import { createAppointment } from "@/src/services/appointments";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function ConfirmAppointmentScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    doctorId: string;
    doctorFirstName: string;
    doctorLastName: string;
    date: string;
    time: string;
  }>();

  const { user } = useAuth();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Format the date for DIsplay
  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error: any) {
      console.error("Error", error.message);
      return dateStr;
    }
  };

  const handleConfirm = async () => {
    if (!user) {
      Alert.alert("Not logged in", "Please log in to book an appointment.");
      return;
    }
    const patientId = user._id;
    try {
      setLoading(true);
      const result = await createAppointment({
        patient_id: patientId,
        doctor_id: params.doctorId,
        date: params.date,
        time: params.time,
        notes: notes.trim() || undefined,
      });
      Alert.alert(
        "Booked!",
        result.message || "Your appointment has been scheduled.",
        [
          {
            text: "View my appointments",
            onPress: () => router.replace("/appointments/myAppointments"),
          },
          {
            text: "Back to Dashboard",
            onPress: () => router.replace("/(tabs)/dashboard"),
          },
        ],
      );
    } catch (error: any) {
      Alert.alert(
        "Booking failed",
        error?.message || "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={12}
          style={styles.backRow}
        >
          <Ionicons name="chevron-back" size={22} color="#1D4ED8" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.header}>Confirm booking</Text>
        <Text style={styles.subheader}>Review your appointment details</Text>

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="person" size={18} color="#1D4ED8" />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Doctor</Text>
              <Text style={styles.summaryValue}>
                Dr. {params.doctorFirstName} {params.doctorLastName}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Ionicons name="calendar" size={18} color="#1D4ED8" />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>{formatDate(params.date)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Ionicons name="time" size={18} color="#1D4ED8" />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Time</Text>
              <Text style={styles.summaryValue}>{params.time}</Text>
            </View>
          </View>
        </View>

        {/* Notes card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Reason for visit, symptoms, questions..."
            placeholderTextColor="#9CA3AF"
            style={styles.notesInput}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Confirm button */}

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.primaryBtnText}>Confirm booking</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Go back button */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.secondaryBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryBtnText}>Go back</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    padding: 16,
    paddingTop: 12,
  },

  //Header
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
  },
  backText: {
    fontSize: 14,
    color: "#1D4ED8",
    fontWeight: "600",
  },
  header: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0B0F19",
    letterSpacing: 0.2,
  },
  subheader: {
    marginTop: 4,
    marginBottom: 16,
    fontSize: 14,
    color: "#0B0F19",
    opacity: 0.65,
  },

  //Summary Card
  summaryCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#0B0F19",
    opacity: 0.55,
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 15,
    color: "#0B0F19",
    fontWeight: "700",
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#DBEAFE",
    marginVertical: 10,
  },

  //Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E6EAF2",
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "0B0F19",
    opacity: 0.85,
    marginBottom: 10,
  },

  //Notes
  notesInput: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0B0F19",
    backgroundColor: "#FFFFFF",
    minHeight: 80,
  },

  // Buttons
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#1D4ED8",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 8,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#ECFDF3",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#0B0F19",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
