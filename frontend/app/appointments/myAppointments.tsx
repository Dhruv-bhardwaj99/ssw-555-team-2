import RefreshableScroll from "@/components/RefreshableScroll";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useAuth } from "@/src/context/AuthContext";
import {
  Appointment,
  cancelAppointment,
  completeAppointment,
  fetchUserAppointments,
} from "@/src/services/appointments";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function MyAppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const isProvider = user?.role === "provider";

  const loadAppointments = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await fetchUserAppointments(user._id);
      const sorted = data.sort((a, b) => {
        const order = { scheduled: 0, completed: 1, cancelled: 2 };
        return (order[a.status] ?? 3) - (order[b.status] ?? 3);
      });
      setAppointments(sorted);
    } catch (error: any) {
      console.log("Could not load appointments:", error?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const { refreshing, onRefresh } = usePullToRefresh(loadAppointments);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getOtherPersonName = (appt: Appointment) => {
    if (user?.role === "provider") {
      if (typeof appt.patient_id === "object" && appt.patient_id !== null) {
        return `${appt.patient_id.firstName} ${appt.patient_id.lastName}`;
      }
      return "Patient";
    }
    if (typeof appt.doctor_id === "object" && appt.doctor_id !== null) {
      return `Dr. ${appt.doctor_id.firstName} ${appt.doctor_id.lastName}`;
    }
    return "Doctor";
  };

  // ── Cancel ──────────────────────────────────────────────────────────────────
  const handleCancel = (appt: Appointment) => {
    Alert.alert(
      "Cancel appointment",
      `Are you sure you want to cancel the appointment on ${formatDate(appt.date)} at ${appt.time}?`,
      [
        { text: "No, keep it", style: "cancel" },
        {
          text: "Yes, cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setCancellingId(appt._id);
              await cancelAppointment(appt._id);
              setAppointments((prev) =>
                prev.map((a) =>
                  a._id === appt._id ? { ...a, status: "cancelled" } : a,
                ),
              );
              Alert.alert("Cancelled", "The appointment has been cancelled.");
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Failed to cancel appointment");
            } finally {
              setCancellingId(null);
            }
          },
        },
      ],
    );
  };

  // ── Complete (provider only) ────────────────────────────────────────────────
  const handleComplete = (appt: Appointment) => {
    const patientName = getOtherPersonName(appt);
    Alert.alert(
      "Mark as Completed",
      `Mark the appointment with ${patientName} on ${formatDate(appt.date)} at ${appt.time} as completed?`,
      [
        { text: "Not yet", style: "cancel" },
        {
          text: "Yes, complete",
          onPress: async () => {
            try {
              setCompletingId(appt._id);
              await completeAppointment(appt._id);
              setAppointments((prev) =>
                prev.map((a) =>
                  a._id === appt._id ? { ...a, status: "completed" } : a,
                ),
              );
              Alert.alert("Done", `Appointment with ${patientName} marked as completed.`);
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Failed to complete appointment");
            } finally {
              setCompletingId(null);
            }
          },
        },
      ],
    );
  };

  const statusConfig = {
    scheduled: {
      label: "Scheduled",
      badgeStyle: styles.badgeGreen,
      borderColor: "#1D4ED8",
      opacity: 1,
    },
    completed: {
      label: "Completed",
      badgeStyle: styles.badgeBlue,
      borderColor: "#16A34A",
      opacity: 1,
    },
    cancelled: {
      label: "Cancelled",
      badgeStyle: styles.badgeRed,
      borderColor: "#EF4444",
      opacity: 0.55,
    },
  };

  return (
    <SafeAreaView style={styles.safe}>
      <RefreshableScroll
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        {/* Header */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backRow}
          activeOpacity={0.7}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={22} color="#1D4ED8" />
          <Text style={styles.backText}>Dashboard</Text>
        </TouchableOpacity>

        <Text style={styles.header}>My appointments</Text>
        <Text style={styles.subheader}>Upcoming and past visits</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#1D4ED8" style={{ marginTop: 40 }} />
        ) : appointments.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="calendar-outline" size={48} color="#E6EAF2" />
            <Text style={styles.emptyTitle}>No appointments yet</Text>
            <Text style={styles.emptySubtitle}>
              {isProvider
                ? "Your scheduled appointments will appear here"
                : "Book your first appointment to get started"}
            </Text>
          </View>
        ) : (
          appointments.map((appt) => {
            const config = statusConfig[appt.status] ?? statusConfig.scheduled;
            const isCancelling = cancellingId === appt._id;
            const isCompleting = completingId === appt._id;

            return (
              <View
                key={appt._id}
                style={[
                  styles.apptCard,
                  {
                    borderLeftColor: config.borderColor,
                    opacity: config.opacity,
                  },
                ]}
              >
                {/* Name row */}
                <View style={styles.apptTopRow}>
                  <Ionicons name="person" size={16} color="#1D4ED8" />
                  <Text style={styles.apptDoctor}>
                    {getOtherPersonName(appt)}
                  </Text>
                </View>

                {/* Date/time row */}
                <View style={styles.apptDetailRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color="#0B0F19"
                    style={{ opacity: 0.5 }}
                  />
                  <Text style={styles.apptDetail}>
                    {formatDate(appt.date)} at {appt.time}
                  </Text>
                </View>

                {/* Notes row */}
                {appt.notes ? (
                  <View style={styles.apptDetailRow}>
                    <Ionicons
                      name="document-text-outline"
                      size={14}
                      color="#0B0F19"
                      style={{ opacity: 0.5 }}
                    />
                    <Text style={styles.apptDetail} numberOfLines={2}>
                      {appt.notes}
                    </Text>
                  </View>
                ) : null}

                {/* Bottom row: badge + action buttons */}
                <View style={styles.apptBottomRow}>
                  <Text style={config.badgeStyle}>{config.label}</Text>

                  {appt.status === "scheduled" && (
                    <View style={styles.actionButtons}>

                      {/* Mark Complete — providers only */}
                      {isProvider && (
                        <TouchableOpacity
                          style={styles.completeBtn}
                          onPress={() => handleComplete(appt)}
                          disabled={isCompleting || isCancelling}
                          activeOpacity={0.75}
                          hitSlop={8}
                        >
                          {isCompleting ? (
                            <ActivityIndicator size="small" color="#16A34A" />
                          ) : (
                            <>
                              <Ionicons
                                name="checkmark-circle-outline"
                                size={14}
                                color="#16A34A"
                              />
                              <Text style={styles.completeBtnText}>
                                Complete
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}

                      {/* Cancel — both roles */}
                      <TouchableOpacity
                        onPress={() => handleCancel(appt)}
                        activeOpacity={0.7}
                        disabled={isCancelling || isCompleting}
                        hitSlop={8}
                      >
                        {isCancelling ? (
                          <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                          <Text style={styles.cancelLink}>Cancel</Text>
                        )}
                      </TouchableOpacity>

                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}

        {/* Book new appointment — patients only */}
        {!isProvider && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.primaryBtn}
            onPress={() => router.push("/appointments/bookAppointment")}
          >
            <Ionicons
              name="add-circle"
              size={20}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.primaryBtnText}>Book new appointment</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 20 }} />
      </RefreshableScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    padding: 16,
    paddingTop: 12,
  },

  // Header
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
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

  // Empty state
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0B0F19",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#0B0F19",
    opacity: 0.55,
    marginTop: 4,
    textAlign: "center",
  },

  // Appointment card
  apptCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E6EAF2",
    borderLeftWidth: 5,
    padding: 14,
    marginBottom: 10,
  },
  apptTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  apptDoctor: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0B0F19",
  },
  apptDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  apptDetail: {
    fontSize: 12,
    color: "#0B0F19",
    opacity: 0.65,
    flex: 1,
  },
  apptBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },

  // Action buttons group (complete + cancel)
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  // Complete button (provider)
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF3",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  completeBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16A34A",
  },

  // Cancel link
  cancelLink: {
    fontSize: 13,
    color: "#EF4444",
    fontWeight: "600",
  },

  // Badges
  badgeGreen: {
    backgroundColor: "#ECFDF3",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    color: "#16A34A",
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
  },
  badgeBlue: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    color: "#1D4ED8",
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
  },
  badgeRed: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
  },

  // Book button
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#1D4ED8",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 8,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.2,
  },
});