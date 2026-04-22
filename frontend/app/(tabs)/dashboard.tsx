import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import RefreshableScroll from "@/components/RefreshableScroll";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { router } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import {
  Appointment,
  fetchUserAppointments,
} from "@/src/services/appointments";
import {
  fetchAllUsers,
  fetchAllAppointments,
  deleteUser,
  deleteAppointment,
  User,
} from "@/src/services/admin";
 
// ─── Shared card component ───────────────────────────────────────────────────
type CardProps = {
  title: string;
  value: string;
  subtitle?: string;
  variant?: "blue" | "green" | "neutral" | "orange" | "sky";
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
  const v = variantStyles[variant] ?? variantStyles.neutral;
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      style={[styles.card, v.card]}
    >
      <View style={[styles.cardAccent, v.accent]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          {iconName ? (
            <Ionicons name={iconName} size={20} color={iconColor ?? "#0B0F19"} />
          ) : null}
          <Text style={styles.cardTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <Text style={[styles.cardValue, v.value]} numberOfLines={1}>
          {value}
        </Text>
        {subtitle ? (
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
 
// ─── Shared helpers ───────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}
 
function formatDate(dateStr: string) {
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
}
 
const STATUS_CONFIG = {
  scheduled: { label: "Scheduled", color: "#1D4ED8", bg: "#DBEAFE" },
  completed: { label: "Completed", color: "#16A34A", bg: "#DCFCE7" },
  cancelled: { label: "Cancelled", color: "#EF4444", bg: "#FEE2E2" },
} as const;
 
function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.scheduled;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}
 
// ═══════════════════════════════════════════════════════════════════════════════
// PATIENT DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function PatientDashboard() {
  const { user } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [totalVisits, setTotalVisits] = useState(0);
  const [lastVisit, setLastVisit] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchUserAppointments(user._id);
      const upcoming = data
        .filter((a) => a.status === "scheduled")
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setUpcomingAppointments(upcoming);
      const completed = data.filter((a) => a.status === "completed");
      setTotalVisits(completed.length);
      if (completed.length > 0) {
        const sorted = [...completed].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setLastVisit(formatDate(sorted[0].date));
      }
    } catch {
      // silently fail
    }
  }, [user]);
 
  useEffect(() => {
    load();
  }, [load]);
 
  const { refreshing, onRefresh } = usePullToRefresh(load);
 
  const getDoctorName = (appt: Appointment) => {
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
 
        {/* Stat cards */}
        <View style={styles.grid}>
          <Card
            title="Next Appointment"
            value={upcomingAppointments.length > 0 ? getDoctorName(upcomingAppointments[0]) : "None scheduled"}
            subtitle={upcomingAppointments.length > 0 ? formatDate(upcomingAppointments[0].date) : undefined}
            variant="blue"
            iconName="calendar"
            iconColor="#1D4ED8"
          />
          <Card
            title="Completed Visits"
            value={String(totalVisits)}
            subtitle="All time"
            variant="green"
            iconName="checkmark-circle"
            iconColor="#16A34A"
          />
        </View>
        <View style={styles.grid}>
          <Card
            title="Last Visit"
            value={lastVisit ?? "No visits yet"}
            variant="sky"
            iconName="time"
            iconColor="#0EA5E9"
          />
          <Card
            title="Upcoming"
            value={String(upcomingAppointments.length)}
            subtitle="Scheduled"
            variant="neutral"
            iconName="hourglass"
            iconColor="#F59E0B"
          />
        </View>

        {/* Actions */}
        <SectionLabel>QUICK ACTIONS</SectionLabel>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/appointments/bookAppointment")}
          >
            <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Book an Appointment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/appointments/myAppointments")}
          >
            <Ionicons name="list-outline" size={18} color="#0B0F19" style={{ marginRight: 8 }} />
            <Text style={styles.secondaryBtnText}>View My Appointments</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming appointments list */}
        {upcomingAppointments.length > 0 && (
          <>
            <SectionLabel>UPCOMING APPOINTMENTS ({upcomingAppointments.length})</SectionLabel>
            {upcomingAppointments.map((appt, idx) => (
              <View key={appt._id} style={styles.apptCard}>
                <View style={styles.apptCardLeft}>
                  <View style={styles.apptIconWrap}>
                    <Ionicons name="medical" size={20} color="#1D4ED8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.apptName}>{getDoctorName(appt)}</Text>
                    <Text style={styles.apptMeta}>
                      {formatDate(appt.date)} · {appt.time}
                    </Text>
                    {appt.notes ? (
                      <Text style={styles.apptNotes} numberOfLines={1}>
                        {appt.notes}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <StatusBadge status={appt.status} />
              </View>
            ))}
          </>
        )}
      </RefreshableScroll>
    </SafeAreaView>
  );
}
 
// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function ProviderDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tab, setTab] = useState<"today" | "upcoming">("today");
  const [loading, setLoading] = useState(true);
 
  const load = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await fetchUserAppointments(user._id);
      setAppointments(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [user]);
 
  useEffect(() => {
    load();
  }, [load]);
 
  const { refreshing, onRefresh } = usePullToRefresh(load);
 
  const todayStr = new Date().toISOString().split("T")[0];
 
  const todayAppts = appointments.filter(
    (a) => a.status === "scheduled" && a.date.startsWith(todayStr)
  );
  const upcomingAppts = appointments
    .filter((a) => a.status === "scheduled" && a.date > todayStr)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
 
  const completedToday = appointments.filter(
    (a) => a.status === "completed" && a.date.startsWith(todayStr)
  ).length;
 
  const displayAppts = tab === "today" ? todayAppts : upcomingAppts;
 
  const getPatientName = (appt: Appointment) => {
    if (typeof appt.patient_id === "object" && appt.patient_id !== null) {
      return `${appt.patient_id.firstName} ${appt.patient_id.lastName}`;
    }
    return "Patient";
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
        {/* Header */}
        <View style={styles.providerHeaderRow}>
          <View>
            <Text style={styles.providerGreeting}>Good morning,</Text>
            <Text style={styles.header}>
              Dr. {user?.firstName} {user?.lastName}
            </Text>
          </View>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={26} color="#1D4ED8" />
          </View>
        </View>
 
        {/* Stats row */}
        <View style={styles.grid3}>
          <Card
            title="Today"
            value={String(todayAppts.length + completedToday)}
            subtitle="patients"
            variant="blue"
            iconName="people"
            iconColor="#1D4ED8"
          />
          <Card
            title="Done"
            value={String(completedToday)}
            subtitle="today"
            variant="green"
            iconName="checkmark-done"
            iconColor="#16A34A"
          />
          <Card
            title="Remaining"
            value={String(todayAppts.length)}
            subtitle="upcoming"
            variant="orange"
            iconName="hourglass"
            iconColor="#F59E0B"
          />
        </View>
 
        {/* Availability shortcut */}
        <TouchableOpacity
          style={styles.availabilityCard}
          activeOpacity={0.85}
          onPress={() => router.push("/availability/setAvailability")}
        >
          <View>
            <Text style={styles.availabilityTitle}>🟢  Manage Availability</Text>
            <Text style={styles.availabilitySubtitle}>
              Set your working hours & days
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#1D4ED8" />
        </TouchableOpacity>
 
        {/* Tab switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "today" && styles.tabBtnActive]}
            onPress={() => setTab("today")}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabBtnText, tab === "today" && styles.tabBtnTextActive]}>
              Todays Patients
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "upcoming" && styles.tabBtnActive]}
            onPress={() => setTab("upcoming")}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabBtnText, tab === "upcoming" && styles.tabBtnTextActive]}>
              Upcoming
            </Text>
          </TouchableOpacity>
        </View>
 
        {/* Appointment list */}
        {loading ? (
          <ActivityIndicator color="#1D4ED8" style={{ marginTop: 24 }} />
        ) : displayAppts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={38} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              {tab === "today" ? "No patients today" : "No upcoming appointments"}
            </Text>
          </View>
        ) : (
          displayAppts.map((appt) => (
            <View key={appt._id} style={styles.apptCard}>
              <View style={styles.apptCardLeft}>
                <View style={styles.apptIconWrap}>
                  <Ionicons name="person" size={18} color="#1D4ED8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.apptName}>{getPatientName(appt)}</Text>
                  <Text style={styles.apptMeta}>
                    {formatDate(appt.date)} · {appt.time}
                  </Text>
                  {appt.notes ? (
                    <Text style={styles.apptNotes} numberOfLines={1}>
                      {appt.notes}
                    </Text>
                  ) : null}
                </View>
              </View>
              <StatusBadge status={appt.status} />
            </View>
          ))
        )}
 
        {/* Actions */}
        <SectionLabel>QUICK ACTIONS</SectionLabel>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/appointments/myAppointments")}
          >
            <Ionicons name="list-outline" size={18} color="#0B0F19" style={{ marginRight: 8 }} />
            <Text style={styles.secondaryBtnText}>All My Appointments</Text>
          </TouchableOpacity>
        </View>
      </RefreshableScroll>
    </SafeAreaView>
  );
}
 
// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"appointments" | "patients" | "providers">(
    "appointments"
  );
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<User[]>([]);
  const [providers, setProviders] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
 
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [appts, users] = await Promise.all([
        fetchAllAppointments(),
        fetchAllUsers(),
      ]);
      setAppointments(appts);
      setPatients(users.filter((u) => u.role === "patient"));
      setProviders(users.filter((u) => u.role === "provider"));
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);
 
  useEffect(() => {
    load();
  }, [load]);
 
  const { refreshing, onRefresh } = usePullToRefresh(load);
 
  const handleDeleteUser = (userId: string, name: string) => {
    Alert.alert(
      "Delete User",
      `Are you sure you want to delete ${name}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteUser(userId);
              setPatients((prev) => prev.filter((u) => u._id !== userId));
              setProviders((prev) => prev.filter((u) => u._id !== userId));
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Failed to delete user");
            }
          },
        },
      ]
    );
  };
 
  const handleDeleteAppointment = (appointmentId: string) => {
    Alert.alert(
      "Delete Appointment",
      "Are you sure you want to delete this appointment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAppointment(appointmentId);
              setAppointments((prev) => prev.filter((a) => a._id !== appointmentId));
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Failed to delete appointment");
            }
          },
        },
      ]
    );
  };
 
  const getAppointmentLabel = (appt: Appointment) => {
    const patientName =
      typeof appt.patient_id === "object" && appt.patient_id !== null
        ? `${appt.patient_id.firstName} ${appt.patient_id.lastName}`
        : "Patient";
    const doctorName =
      typeof appt.doctor_id === "object" && appt.doctor_id !== null
        ? `Dr. ${appt.doctor_id.firstName} ${appt.doctor_id.lastName}`
        : "Doctor";
    return { patientName, doctorName };
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
        {/* Header */}
        <View style={styles.adminHeaderRow}>
          <View>
            <Text style={styles.adminBadgeText}>Admin Panel</Text>
            <Text style={styles.header}>Control Center</Text>
          </View>
          <View style={styles.adminShield}>
            <Ionicons name="shield-checkmark" size={24} color="#7C3AED" />
          </View>
        </View>
 
        {/* Overview stats */}
        <View style={styles.grid3}>
          <Card title="Patients" value={String(patients.length)} variant="blue" iconName="people" iconColor="#1D4ED8" />
          <Card title="Providers" value={String(providers.length)} variant="green" iconName="medkit" iconColor="#16A34A" />
          <Card title="Appts" value={String(appointments.length)} variant="neutral" iconName="calendar" iconColor="#7C3AED" />
        </View>
 
        {/* Tab switcher */}
        <View style={styles.tabRow3}>
          {(["appointments", "patients", "providers"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab3Btn, activeTab === t && styles.tab3BtnActive]}
              onPress={() => setActiveTab(t)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tab3BtnText, activeTab === t && styles.tab3BtnTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
 
        {loading ? (
          <ActivityIndicator color="#1D4ED8" style={{ marginTop: 24 }} />
        ) : (
          <>
            {/* APPOINTMENTS */}
            {activeTab === "appointments" && (
              <>
                <SectionLabel>ALL APPOINTMENTS</SectionLabel>
                {appointments.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={38} color="#9CA3AF" />
                    <Text style={styles.emptyText}>No appointments found</Text>
                  </View>
                ) : (
                  appointments.map((appt) => {
                    const { patientName, doctorName } = getAppointmentLabel(appt);
                    return (
                      <View key={appt._id} style={styles.adminRow}>
                        <View style={styles.adminRowIcon}>
                          <Ionicons name="calendar" size={18} color="#1D4ED8" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.adminRowTitle} numberOfLines={1}>
                            {patientName}
                          </Text>
                          <Text style={styles.adminRowMeta} numberOfLines={1}>
                            {doctorName} · {formatDate(appt.date)} · {appt.time}
                          </Text>
                        </View>
                        <View style={styles.adminRowRight}>
                          <StatusBadge status={appt.status} />
                          <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => handleDeleteAppointment(appt._id)}
                            hitSlop={8}
                          >
                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </>
            )}
 
            {/* PATIENTS */}
            {activeTab === "patients" && (
              <>
                <SectionLabel>PATIENT ACCOUNTS ({patients.length})</SectionLabel>
                {patients.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={38} color="#9CA3AF" />
                    <Text style={styles.emptyText}>No patients found</Text>
                  </View>
                ) : (
                  patients.map((p) => (
                    <View key={p._id} style={styles.adminRow}>
                      <View style={[styles.adminRowIcon, { backgroundColor: "#DBEAFE" }]}>
                        <Text style={styles.adminAvatarLetter}>
                          {p.firstName[0].toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.adminRowTitle}>
                          {p.firstName} {p.lastName}
                        </Text>
                        <Text style={styles.adminRowMeta} numberOfLines={1}>
                          {p.email}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() =>
                          handleDeleteUser(p._id, `${p.firstName} ${p.lastName}`)
                        }
                        hitSlop={8}
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </>
            )}
 
            {/* PROVIDERS */}
            {activeTab === "providers" && (
              <>
                <SectionLabel>PROVIDER ACCOUNTS ({providers.length})</SectionLabel>
                {providers.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="medkit-outline" size={38} color="#9CA3AF" />
                    <Text style={styles.emptyText}>No providers found</Text>
                  </View>
                ) : (
                  providers.map((p) => (
                    <View key={p._id} style={styles.adminRow}>
                      <View style={[styles.adminRowIcon, { backgroundColor: "#DCFCE7" }]}>
                        <Text style={[styles.adminAvatarLetter, { color: "#16A34A" }]}>
                          {p.firstName[0].toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.adminRowTitle}>
                          Dr. {p.firstName} {p.lastName}
                        </Text>
                        <Text style={styles.adminRowMeta} numberOfLines={1}>
                          {p.email}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() =>
                          handleDeleteUser(p._id, `Dr. ${p.firstName} ${p.lastName}`)
                        }
                        hitSlop={8}
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </>
            )}
          </>
        )}
      </RefreshableScroll>
    </SafeAreaView>
  );
}
 
// ═══════════════════════════════════════════════════════════════════════════════
// ROOT — Role router
// ═══════════════════════════════════════════════════════════════════════════════
export default function DashboardScreen() {
  const { user } = useAuth();
 
  if (user?.role === "provider") return <ProviderDashboard />;
  if (user?.role === "admin") return <AdminDashboard />;
  return <PatientDashboard />;
}
 
// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1 },
  contentContainer: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 32 },
 
  // Typography
  header: { fontSize: 26, fontWeight: "800", color: "#0B0F19", marginBottom: 2 },
  subheader: { fontSize: 13, color: "rgba(11,15,25,0.5)", marginBottom: 18 },
  sectionLabel: {
    fontSize: 11, fontWeight: "700", color: "rgba(11,15,25,0.45)",
    letterSpacing: 1.1, textTransform: "uppercase", marginTop: 20, marginBottom: 10,
  },
 
  // Card grid
  grid: { flexDirection: "row", gap: 10, marginBottom: 10 },
  grid3: { flexDirection: "row", gap: 8, marginBottom: 14 },
 
  card: {
    flex: 1, borderRadius: 14, overflow: "hidden",
    borderWidth: 1, borderColor: "#E6EAF2", flexDirection: "row",
  },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 12 },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 },
  cardTitle: { fontSize: 11, color: "rgba(11,15,25,0.5)", fontWeight: "600", flex: 1 },
  cardValue: { fontSize: 18, fontWeight: "800", color: "#0B0F19" },
  cardSubtitle: { fontSize: 11, color: "rgba(11,15,25,0.45)", marginTop: 2 },
 
  // Appointment card
  apptCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#FFFFFF", borderRadius: 14, padding: 13,
    borderWidth: 1, borderColor: "#E6EAF2", marginBottom: 8,
    borderLeftWidth: 4, borderLeftColor: "#1D4ED8",
  },
  apptCardLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 10, marginRight: 8 },
  apptIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center",
  },
  apptName: { fontSize: 14, fontWeight: "700", color: "#0B0F19" },
  apptMeta: { fontSize: 12, color: "rgba(11,15,25,0.5)", marginTop: 2 },
  apptNotes: { fontSize: 11, color: "rgba(11,15,25,0.4)", marginTop: 2, fontStyle: "italic" },
 
  // Badge
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: "700" },
 
  // Buttons
  actions: { gap: 10, marginBottom: 8 },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 14, borderRadius: 14, backgroundColor: "#1D4ED8",
  },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  secondaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 14, borderRadius: 14, backgroundColor: "#ECFDF3",
    borderWidth: 1, borderColor: "#A7F3D0",
  },
  secondaryBtnText: { color: "#0B0F19", fontWeight: "800", fontSize: 15 },
 
  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 36, gap: 10 },
  emptyText: { fontSize: 14, color: "#9CA3AF", fontWeight: "600" },
 
  // Provider-specific
  providerHeaderRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 16,
  },
  providerGreeting: { fontSize: 13, color: "rgba(11,15,25,0.5)", marginBottom: 2 },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 999, backgroundColor: "#EFF6FF",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#1D4ED8",
  },
  availabilityCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#E6EAF2", marginBottom: 14,
  },
  availabilityTitle: { fontSize: 14, fontWeight: "700", color: "#0B0F19" },
  availabilitySubtitle: { fontSize: 12, color: "rgba(11,15,25,0.5)", marginTop: 2 },
 
  // Tab switcher (2-tab)
  tabRow: {
    flexDirection: "row", backgroundColor: "#EFF6FF",
    borderRadius: 12, padding: 3, marginBottom: 12,
  },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  tabBtnActive: { backgroundColor: "#1D4ED8" },
  tabBtnText: { fontSize: 13, fontWeight: "700", color: "rgba(11,15,25,0.5)" },
  tabBtnTextActive: { color: "#FFFFFF" },
 
  // Admin-specific
  adminHeaderRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 14,
  },
  adminBadgeText: { fontSize: 11, color: "#7C3AED", fontWeight: "700", letterSpacing: 0.8 },
  adminShield: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: "#F5F3FF",
    alignItems: "center", justifyContent: "center",
  },
  tabRow3: {
    flexDirection: "row", backgroundColor: "#EFF6FF",
    borderRadius: 12, padding: 3, marginBottom: 12,
  },
  tab3Btn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  tab3BtnActive: { backgroundColor: "#1D4ED8" },
  tab3BtnText: { fontSize: 11, fontWeight: "700", color: "rgba(11,15,25,0.5)" },
  tab3BtnTextActive: { color: "#FFFFFF" },
 
  adminRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "#E6EAF2", marginBottom: 8,
  },
  adminRowIcon: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: "#EFF6FF",
    alignItems: "center", justifyContent: "center",
  },
  adminRowTitle: { fontSize: 13, fontWeight: "700", color: "#0B0F19" },
  adminRowMeta: { fontSize: 11, color: "rgba(11,15,25,0.5)", marginTop: 2 },
  adminRowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  adminAvatarLetter: { fontSize: 16, fontWeight: "800", color: "#1D4ED8" },
 
  deleteBtn: {
    width: 30, height: 30, borderRadius: 8, backgroundColor: "#FEE2E2",
    alignItems: "center", justifyContent: "center",
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
  orange: StyleSheet.create({
    card: { backgroundColor: "#FFFBEB" },
    accent: { backgroundColor: "#F59E0B" },
    value: { color: "#0B0F19" },
  }),
  sky: StyleSheet.create({
    card: { backgroundColor: "#F0F9FF" },
    accent: { backgroundColor: "#0EA5E9" },
    value: { color: "#0B0F19" },
  }),
};