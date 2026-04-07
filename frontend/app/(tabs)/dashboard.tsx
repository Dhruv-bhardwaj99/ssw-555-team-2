import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import RefreshableScroll from "@/components/RefreshableScroll";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { router } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { Appointment, fetchUserAppointments } from "@/src/services/appointments";


type CardProps = {
  title: string;
  value: string;
  subtitle?: string;
  variant?: "blue" | "green" | "neutral";
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onPress?: () => void;
};

function Card({
  title,
  value,
  subtitle,
  variant = "neutral",
  iconName,
  iconColor,
  onPress,
}: CardProps) {
  const v = variantStyles[variant];

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.card, v.card]}
    >
      <View style={[styles.cardAccent, v.accent]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          {iconName ? (
            <Ionicons
              name={iconName}
              size={22}
              color={iconColor ?? "#0B0F19"}
            />
          ) : null}
          <Text style={styles.cardTitle}>{title}</Text>
        </View>

        <Text style={[styles.cardValue, v.value]}>{value}</Text>
        {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);

  const loadAll = useCallback(async () => {
    if (user) {
      try {
        const data = await fetchUserAppointments(user._id);
        const upcoming = data
          .filter((a) => a.status === "scheduled")
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setNextAppointment(upcoming[0] ?? null);
      } catch {
        // silently fail — dashboard shouldn't break if this errors
      }
    }
  }, [user]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const { refreshing, onRefresh } = usePullToRefresh(loadAll);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
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
  
  return (
    <SafeAreaView style={styles.safe}>
    <RefreshableScroll
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <Text style={styles.header}>Dashboard</Text>
      <Text style={styles.subheader}>Health overview at a glance</Text>

      {/* Top summary cards (your original ones) */}
      <View style={styles.grid}>
        <Card
          title="Upcoming Appointment"
          value={nextAppointment ? getOtherPersonName(nextAppointment) : "None scheduled"}
          subtitle={
            nextAppointment
              ? `${formatDate(nextAppointment.date)} at ${nextAppointment.time}`
              : "Book your next visit"
          }
          variant="blue"
          iconName="calendar"
          iconColor="#1D4ED8"
          onPress={() => router.push("/appointments/myAppointments")}
        />
        <Card
          title="Unread Messages"
          value="0"
          subtitle="Secure chat with your doctor"
          variant="green"
          iconName="chatbubbles"
          iconColor="#16A34A"
          onPress={() => {}}
        />
        <Card
          title="Health Snapshot"
          value="--"
          subtitle="Wearables integration later"
          variant="neutral"
          iconName="pulse"
          iconColor="#0EA5E9"
          onPress={() => {}}
        />
      </View>

      {/* New "Health Overview" section with 2-up cards (from your second code) */}
      <Text style={styles.sectionTitle}>Health Overview</Text>

      <View style={styles.twoUpRow}>
        <TouchableOpacity activeOpacity={0.9} style={styles.miniCard}>
          <View style={styles.miniCardIconRow}>
            <Ionicons name="heart" size={24} color="#EF4444" />
            <Text style={styles.miniCardLabel}>Heart Rate</Text>
          </View>
          <Text style={styles.miniCardValue}>72 bpm</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.9} style={styles.miniCard}>
          <View style={styles.miniCardIconRow}>
            <Ionicons name="walk" size={24} color="#16A34A" />
            <Text style={styles.miniCardLabel}>Daily Steps</Text>
          </View>
          <Text style={styles.miniCardValue}>4,520</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Actions */}
      <Text style={styles.sectionTitle}>Upcoming Actions</Text>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.actionItem}
        onPress={() => router.push("/appointments/myAppointments")}
      >
        <View style={styles.actionRow}>
          <Ionicons name="time" size={18} color="#1D4ED8" />
          <Text style={styles.actionText}>
            {nextAppointment
              ? `${getOtherPersonName(nextAppointment)} — ${formatDate(nextAppointment.date)} at ${nextAppointment.time}`
              : "No upcoming appointments"}
          </Text>
          {nextAppointment && (
            <Ionicons name="chevron-forward" size={16} color="#1D4ED8" style={{ marginLeft: "auto" }} />
          )}
        </View>
      </TouchableOpacity>

      {/* Buttons with feedback (TouchableOpacity) */}
      <View style={styles.actions}>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.secondaryBtn}
          onPress={() => router.push("/appointments/bookAppointment")}
        >
          <Text style={styles.secondaryBtnText}>Schedule Appointment</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 24 }} />
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
    paddingTop: 16,
  },

  header: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0B0F19", // black text
    letterSpacing: 0.2,
  },
  subheader: {
    marginTop: 6,
    marginBottom: 16,
    fontSize: 14,
    color: "#0B0F19",
    opacity: 0.7,
  },

  grid: { gap: 12 },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E6EAF2",
    overflow: "hidden",
  },
  cardAccent: {
    height: 5,
    width: "100%",
  },
  cardBody: {
    padding: 14,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0B0F19",
    opacity: 0.85,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 8,
    color: "#0B0F19",
  },
  cardSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#0B0F19",
    opacity: 0.65,
  },

  sectionTitle: {
    marginTop: 22,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: "800",
    color: "#0B0F19",
  },

  twoUpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  miniCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E6EAF2",
    borderRadius: 16,
    padding: 14,
    elevation: 2, // Android shadow
  },
  miniCardIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  miniCardLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0B0F19",
    opacity: 0.75,
  },
  miniCardValue: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: "900",
    color: "#0B0F19",
  },

  actionItem: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    borderLeftWidth: 5,
    borderLeftColor: "#1D4ED8",
    borderWidth: 1,
    borderColor: "#E6EAF2",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionText: {
    color: "#0B0F19",
    fontWeight: "700",
    flexShrink: 1,
  },

  actions: { marginTop: 18, gap: 10 },

  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#1D4ED8", // blue
    alignItems: "center",
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
    backgroundColor: "#ECFDF3", // light green tint
    borderWidth: 1,
    borderColor: "#A7F3D0",
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#0B0F19", // black text
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.2,
  },
});

const variantStyles = {
  blue: StyleSheet.create({
    card: { backgroundColor: "#EFF6FF" },
    accent: { backgroundColor: "#2563EB" },
    value: { color: "#0B0F19" },
  }),
  green: StyleSheet.create({
    card: { backgroundColor: "#ECFDF3" },
    accent: { backgroundColor: "#16A34A" },
    value: { color: "#0B0F19" },
  }),
  neutral: StyleSheet.create({
    card: { backgroundColor: "#F8FAFC" },
    accent: { backgroundColor: "#0EA5E9" },
    value: { color: "#0B0F19" },
  }),
};
