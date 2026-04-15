import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { SafeAreaView } from "react-native-safe-area-context";
import RefreshableScroll from "@/components/RefreshableScroll";
import { useAuth } from "@/src/context/AuthContext";

function capitalize(str: string){
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(iso?: string){
  if(!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year:"numeric",
    month: "long",
    day: "numeric"
  });
}

export default function ProfileTab(){
  const {user, setUser} = useAuth();

  useEffect(() => {
    if(!user){
      router.replace("/login");
    }
  }, [user]);

  if(!user){
    return null;
  }

  const handleLogout = () =>{
    Alert.alert("Log out", "Are you sure you want to log out?", [
      {text: "Cancel", style: "cancel"},
      {
        text: "Log out",
        style: "destructive",
        onPress: () =>{
          setUser(null);
          router.replace("/login");
        },
      },
    ]);
  };

  const handleAppointmentHistory = () => {
    router.push("/appointments/appointmentHistory");
  };

  return(
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarWrapper}>
          <Ionicons name="person-circle" size={120} color="#1D4ED8" />
        </View>
        <Text style={styles.fullName}>
          {user.firstName} {user.lastName}
        </Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{capitalize(user.role)}</Text>
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.card}>
        <InfoRow label="First Name" value={user.firstName} />
        <Divider />
        <InfoRow label="Last Name" value={user.lastName} />
        <Divider />
        <InfoRow label="Email" value={user.email} />
        <Divider />
        <InfoRow label="Role" value={capitalize(user.role)} />
        <Divider />
        <InfoRow label="Member Since" value={formatDate(user.createdAt)} />
      </View>

       {/* Appointment History */}
      <Pressable style={styles.card} onPress={handleAppointmentHistory}>
        <View style={styles.historyRow}>
          <View style={styles.historyLeft}>
            <Ionicons name="calendar-outline" size={22} color="#1D4ED8" />
            <Text style={styles.historyLabel}>Appointment History</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>
      </Pressable>

      {/* Logout */}
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </SafeAreaView>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}
function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#F8FAFC",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0B0F19",
  },

  // Avatar section
  avatarSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  avatarWrapper: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  fullName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0B0F19",
  },
  roleBadge: {
    marginTop: 6,
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  roleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1D4ED8",
  },

  // Card
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E6EAF2",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },

  // Info rows
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
  },
  infoLabel: {
    fontSize: 14,
    color: "#687076",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#0B0F19",
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#E6EAF2",
  },

  // History row
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  historyLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0B0F19",
  },

  // Logout
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 4,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    backgroundColor: "#FFF5F5",
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EF4444",
  },
});
