import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "@/src/config/api";
import RefreshableScroll from "@/components/RefreshableScroll";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { router } from "expo-router"


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
  const [apiStatus, setApiStatus] = useState("Checking backend...");
  const fetchStatus = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/`); // or /health if you added it
    const json = await res.json();
    setApiStatus(json?.message ? "Backend connected ✅" : "Backend responded ⚠️");
  } catch {
    setApiStatus("Backend not reachable ❌");
  }
};

useEffect(() => {
  fetchStatus();
}, []);

const { refreshing, onRefresh } = usePullToRefresh(fetchStatus);
  
  return (
    <RefreshableScroll
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <Text style={styles.header}>Dashboard</Text>
      <Text style={styles.subheader}>Health overview at a glance</Text>
      <Text style={{ color: "#0B0F19", opacity: 0.7, marginBottom: 12 }}>
        {apiStatus}
      </Text>

      {/* Top summary cards (your original ones) */}
      <View style={styles.grid}>
        <Card
          title="Upcoming Appointment"
          value="None scheduled"
          subtitle="Book your next visit"
          variant="blue"
          iconName="calendar"
          iconColor="#1D4ED8"
          onPress={() => {}}
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

      <TouchableOpacity activeOpacity={0.85} style={styles.actionItem}>
        <View style={styles.actionRow}>
          <Ionicons name="time" size={18} color="#1D4ED8" />
          <Text style={styles.actionText}>None</Text>
        </View>
      </TouchableOpacity>

      {/* Buttons with feedback (TouchableOpacity) */}
      <View style={styles.actions}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.primaryBtn}
          onPress={() => {}}
        >
          <Text style={styles.primaryBtnText}>Message Doctor</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.secondaryBtn}
          onPress={() => {}}
        >
          <Text style={styles.secondaryBtnText} onPress={() => router.push("/bookAppointment")}>Schedule Appointment</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 24 }} />
    </RefreshableScroll>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // white background
  },
  contentContainer: {
    padding: 16,
    paddingTop: 56,
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
