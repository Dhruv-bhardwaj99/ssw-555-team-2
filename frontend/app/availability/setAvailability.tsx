import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { API_BASE_URL } from "@/src/config/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type DayConfig = {
  day: string;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const ALL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Must match the format used by the backend slot generator: "HH:MM AM/PM"
const TIME_OPTIONS = [
  "06:00 AM", "06:30 AM",
  "07:00 AM", "07:30 AM",
  "08:00 AM", "08:30 AM",
  "09:00 AM", "09:30 AM",
  "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM",
  "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM",
  "07:00 PM", "07:30 PM",
  "08:00 PM",
];

const DEFAULT_SCHEDULE: DayConfig[] = ALL_DAYS.map((day) => ({
  day,
  isAvailable: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(day),
  startTime: "09:00 AM",
  endTime: "05:00 PM",
}));

// ─── Time picker row ──────────────────────────────────────────────────────────
// minAfter: every option AT or BEFORE this index is disabled (used for end time)
// maxBefore: every option AT or AFTER this index is disabled (used for start time)
function TimePickerRow({
  label,
  value,
  onChange,
  minAfterIndex,   // end-time picker: disable indices <= minAfterIndex
  maxBeforeIndex,  // start-time picker: disable indices >= maxBeforeIndex
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  minAfterIndex?: number;
  maxBeforeIndex?: number;
}) {
  return (
    <View style={styles.timePickerBlock}>
      <Text style={styles.timePickerLabel}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timeScrollContent}
      >
        {TIME_OPTIONS.map((t, idx) => {
          const isDisabled =
            (minAfterIndex !== undefined && idx <= minAfterIndex) ||
            (maxBeforeIndex !== undefined && idx >= maxBeforeIndex);
          const isActive = value === t;
          return (
            <TouchableOpacity
              key={t}
              style={[
                styles.timeChip,
                isActive && styles.timeChipActive,
                isDisabled && styles.timeChipDisabled,
              ]}
              onPress={() => !isDisabled && onChange(t)}
              activeOpacity={isDisabled ? 1 : 0.8}
            >
              <Text
                style={[
                  styles.timeChipText,
                  isActive && styles.timeChipTextActive,
                  isDisabled && styles.timeChipTextDisabled,
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Day row ──────────────────────────────────────────────────────────────────
function DayRow({
  config,
  expanded,
  onToggleExpand,
  onToggleAvailable,
  onChangeStart,
  onChangeEnd,
}: {
  config: DayConfig;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleAvailable: (val: boolean) => void;
  onChangeStart: (t: string) => void;
  onChangeEnd: (t: string) => void;
}) {
  const startIdx = TIME_OPTIONS.indexOf(config.startTime);
  const endIdx   = TIME_OPTIONS.indexOf(config.endTime);

  return (
    <View style={[styles.dayCard, !config.isAvailable && styles.dayCardOff]}>
      {/* Header row */}
      <View style={styles.dayHeader}>
        <TouchableOpacity
          onPress={onToggleExpand}
          activeOpacity={0.8}
          style={styles.dayHeaderLeft}
          disabled={!config.isAvailable}
        >
          <View
            style={[
              styles.dayDot,
              { backgroundColor: config.isAvailable ? "#16A34A" : "#D1D5DB" },
            ]}
          />
          <View>
            <Text style={[styles.dayName, !config.isAvailable && styles.dayNameOff]}>
              {config.day}
            </Text>
            {config.isAvailable ? (
              <Text style={styles.dayHours}>
                {config.startTime} – {config.endTime}
              </Text>
            ) : (
              <Text style={styles.dayUnavailable}>Unavailable</Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.dayHeaderRight}>
          {config.isAvailable && (
            <TouchableOpacity
              onPress={onToggleExpand}
              activeOpacity={0.7}
              style={styles.expandBtn}
              hitSlop={8}
            >
              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={18}
                color="#1D4ED8"
              />
            </TouchableOpacity>
          )}
          <Switch
            value={config.isAvailable}
            onValueChange={onToggleAvailable}
            trackColor={{ false: "#E5E7EB", true: "#DBEAFE" }}
            thumbColor={config.isAvailable ? "#1D4ED8" : "#9CA3AF"}
          />
        </View>
      </View>

      {/* Expanded time pickers */}
      {expanded && config.isAvailable && (
        <View style={styles.timePickers}>
          <View style={styles.dividerLine} />
          {/* Start time: disable any option >= current endIdx so start < end always */}
          <TimePickerRow
            label="Start time"
            value={config.startTime}
            onChange={(t) => {
              onChangeStart(t);
              // If the new start is >= current end, push end to the next slot
              const newStartIdx = TIME_OPTIONS.indexOf(t);
              if (newStartIdx >= endIdx) {
                const nextEndIdx = Math.min(newStartIdx + 1, TIME_OPTIONS.length - 1);
                onChangeEnd(TIME_OPTIONS[nextEndIdx]);
              }
            }}
            maxBeforeIndex={endIdx}
          />
          {/* End time: disable any option <= current startIdx so end > start always */}
          <TimePickerRow
            label="End time"
            value={config.endTime}
            onChange={onChangeEnd}
            minAfterIndex={startIdx}
          />
        </View>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
export default function SetAvailabilityScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [schedule, setSchedule] = useState<DayConfig[]>(DEFAULT_SCHEDULE);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Load existing availability ──────────────────────────────────────────────
  const loadAvailability = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE_URL}/appointments/doctors/${user._id}/working-hours`
      );
      const data = await res.json();

      if (res.ok && Array.isArray(data.workingHours) && data.workingHours.length > 0) {
        // Merge saved workingHours into our ordered DEFAULT_SCHEDULE so the
        // day order (Mon→Sun) stays consistent even if the DB has a different order
        setSchedule(
          DEFAULT_SCHEDULE.map((defaultDay) => {
            const saved = data.workingHours.find(
              (h: DayConfig) => h.day === defaultDay.day
            );
            if (saved) {
              return {
                day: defaultDay.day,
                isAvailable: saved.isAvailable ?? defaultDay.isAvailable,
                startTime: saved.startTime ?? defaultDay.startTime,
                endTime: saved.endTime ?? defaultDay.endTime,
              };
            }
            return defaultDay;
          })
        );
      }
      // If workingHours is empty the doctor hasn't saved yet — keep defaults
    } catch {
      // Network error — silently fall back to defaults
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const updateDay = (day: string, patch: Partial<DayConfig>) => {
    setSchedule((prev) =>
      prev.map((d) => (d.day === day ? { ...d, ...patch } : d))
    );
  };

  const validateSchedule = (): string | null => {
    for (const d of schedule) {
      if (!d.isAvailable) continue;
      const startIdx = TIME_OPTIONS.indexOf(d.startTime);
      const endIdx = TIME_OPTIONS.indexOf(d.endTime);
      if (startIdx >= endIdx) {
        return `${d.day}: End time must be after start time.`;
      }
    }
    return null;
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const error = validateSchedule();
    if (error) {
      Alert.alert("Invalid schedule", error);
      return;
    }
    if (!user) return;

    try {
      setSaving(true);
      const res = await fetch(`${API_BASE_URL}/appointments/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: user._id,
          workingHours: schedule,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to save");

      Alert.alert("Saved!", "Your availability has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not save availability");
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  const activeDays = schedule.filter((d) => d.isAvailable).length;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color="#1D4ED8" />
          <Text style={styles.backText}>Dashboard</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Set Availability</Text>
        <Text style={styles.subheader}>
          Choose which days and hours you accept patients
        </Text>

        {/* Summary pill */}
        <View style={styles.summaryPill}>
          <Ionicons name="calendar" size={16} color="#1D4ED8" />
          <Text style={styles.summaryText}>
            {activeDays === 0
              ? "No days selected"
              : `${activeDays} day${activeDays > 1 ? "s" : ""} available per week`}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#1D4ED8" style={{ marginTop: 40 }} />
        ) : (
          <>
            <Text style={styles.sectionLabel}>WEEKLY SCHEDULE</Text>

            {schedule.map((config) => (
              <DayRow
                key={config.day}
                config={config}
                expanded={expandedDay === config.day}
                onToggleExpand={() =>
                  setExpandedDay((prev) =>
                    prev === config.day ? null : config.day
                  )
                }
                onToggleAvailable={(val) => {
                  updateDay(config.day, { isAvailable: val });
                  if (!val && expandedDay === config.day) setExpandedDay(null);
                }}
                onChangeStart={(t) => updateDay(config.day, { startTime: t })}
                onChangeEnd={(t) => updateDay(config.day, { endTime: t })}
              />
            ))}

            {/* Info note */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color="#0EA5E9" />
              <Text style={styles.infoText}>
                Tap a day to expand and set your start and end times. Appointment
                slots are generated in 30-minute increments within those hours.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Save button — pinned to bottom */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Save Availability</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },

  topBar: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 4,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  backText: { fontSize: 15, color: "#1D4ED8", fontWeight: "600" },

  scroll: { flex: 1 },
  contentContainer: { paddingHorizontal: 18, paddingTop: 8 },

  header: { fontSize: 26, fontWeight: "800", color: "#0B0F19", marginBottom: 4 },
  subheader: { fontSize: 13, color: "rgba(11,15,25,0.5)", marginBottom: 16 },

  summaryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  summaryText: { fontSize: 13, fontWeight: "700", color: "#1D4ED8" },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(11,15,25,0.45)",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  // Day card
  dayCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E6EAF2",
    marginBottom: 10,
    overflow: "hidden",
  },
  dayCardOff: { opacity: 0.65 },

  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  dayHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  dayHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },

  dayDot: { width: 10, height: 10, borderRadius: 5 },
  dayName: { fontSize: 15, fontWeight: "700", color: "#0B0F19" },
  dayNameOff: { color: "#9CA3AF" },
  dayHours: { fontSize: 12, color: "#1D4ED8", marginTop: 1, fontWeight: "600" },
  dayUnavailable: { fontSize: 12, color: "#9CA3AF", marginTop: 1 },

  expandBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  // Time pickers
  timePickers: { paddingHorizontal: 14, paddingBottom: 14 },
  dividerLine: { height: 1, backgroundColor: "#E6EAF2", marginBottom: 12 },

  timePickerBlock: { marginBottom: 10 },
  timePickerLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(11,15,25,0.45)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  timeScrollContent: { gap: 6, paddingRight: 8 },
  timeChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  timeChipActive: {
    backgroundColor: "#1D4ED8",
    borderColor: "#1D4ED8",
  },
  timeChipDisabled: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    opacity: 0.4,
  },
  timeChipText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  timeChipTextActive: { color: "#FFFFFF" },
  timeChipTextDisabled: { color: "#CBD5E1" },

  // Info box
  infoBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#BAE6FD",
    marginTop: 6,
    marginBottom: 16,
  },
  infoText: { flex: 1, fontSize: 12, color: "#0369A1", lineHeight: 17 },

  // Footer save button
  footer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E6EAF2",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1D4ED8",
    borderRadius: 14,
    paddingVertical: 15,
  },
  saveBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
});