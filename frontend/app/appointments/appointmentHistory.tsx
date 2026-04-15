import RefreshableScroll from "@/components/RefreshableScroll";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useAuth } from "@/src/context/AuthContext";
import {
  Appointment,
  fetchAppointmentHistory,
} from "@/src/services/appointments";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const AppointmentHistoryScreen = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [appointment, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "completed" | "cancelled">(
    "all",
  );

  const loadHistory = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await fetchAppointmentHistory(user._id);
      setAppointments(data);
    } catch (error: any) {
      console.log("Could not load appointment history:", error?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const { refreshing, onRefresh } = usePullToRefresh(loadHistory);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error: any) {
      console.error(error.message);
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
  const filteredAppointments = appointment.filter((appt) => {
    if (filter === "all") {
      return true;
    }
    return appt.status === filter;
  });

  const statusConfig = {
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
    scheduled: {
      label: "Scheduled",
      badgeStyle: styles.badgeGreen,
      borderColor: "#1D4ED8",
      opacity: 1,
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
          <Text style={styles.backText}>Profile</Text>
        </TouchableOpacity>

        <Text style={styles.header}>Appointment History</Text>
        <Text style={styles.subheader}>
          Your completed and cancelled visits
        </Text>
        {/* Filter Tab */}
        <View style={styles.filterRow}>
          {(["all", "completed", "cancelled"] as const).map((key) => (
            <TouchableOpacity
              key={key}
              activeOpacity={0.8}
              style={[
                styles.filterTab,
                filter === key && styles.filterTabActive,
              ]}
              onPress={() => setFilter(key)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filter === key && styles.filterTabTextActive,
                ]}
              >
                {key === "all"
                  ? "All"
                  : key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading? (
            <ActivityIndicator size="large" color="#1D4ED8" style={{marginTop: 40}} />
        ): filteredAppointments.length === 0? (
            <View style={styles.emptyWrap}>
                <Ionicons name="time-outline" size={48} color="#E6EAF2" />
                <Text style={styles.emptyTitle}>No history yet</Text>
                <Text style={styles.emptySubtitle}>
                    {filter === "all"
                ? "Completed and cancelled appointments will appear here"
                : `No ${filter} appointments found`}
                </Text>
            </View>
        ): (
            filteredAppointments.map((appt) =>{
                const config = statusConfig[appt.status] ?? statusConfig.completed;
                return(
                    <View key={appt._id}
                    style={[
                        styles.apptCard,
                        {
                            borderBlockColor: config.borderColor,
                            opacity: config.opacity
                        }
                    ]}>
                        <View style={styles.apptTopRow}>
                            <Ionicons name="person" size={16} color="#1D4ED8" />
                            <Text style={styles.apptDoctor}>{getOtherPersonName(appt)}</Text>
                        </View>
                        <View style={styles.apptDetailRow}>
                            <Ionicons name="calendar-outline" size={14} color="#0B0F19" style={{ opacity: 0.5 }} />
                            <Text style={styles.apptDetail}>
                                {formatDate(appt.date)} at {appt.time}
                            </Text>
                        </View>

                        {appt.notes ? (
                            <View style={styles.apptDetailRow}>
                                <Ionicons name="document-text-outline" size={14} color="#0B0F19" style={{ opacity: 0.5 }} />
                                <Text style={styles.apptDetail} numberOfLines={2}>{appt.notes}</Text>
                            </View>
                        ) : null}

                        <View style={styles.apptBottomRow}>
                            <Text style={config.badgeStyle}>
                                {config.label}
                            </Text>
                            {appt.createdAt && (
                                <Text style={styles.dateCreated}>
                                    Booked {formatDate(appt.createdAt)}
                                </Text>
                            )}
                        </View>
                    </View>
                )
            })
        )}

        {/* Book New appointment button */}
        <TouchableOpacity activeOpacity={0.85} style={styles.primaryBtn} onPress={() => router.push("/appointments/bookAppointment")} >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Book new appointment</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </RefreshableScroll>
    </SafeAreaView>
  );
};

export default AppointmentHistoryScreen;

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

  // Filter tabs
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E6EAF2",
    backgroundColor: "#F8FAFC",
  },
  filterTabActive: {
    backgroundColor: "#1D4ED8",
    borderColor: "#1D4ED8",
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0B0F19",
  },
  filterTabTextActive: {
    color: "#FFFFFF",
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
  dateCreated: {
    fontSize: 11,
    color: "#0B0F19",
    opacity: 0.4,
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

  // Button
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
