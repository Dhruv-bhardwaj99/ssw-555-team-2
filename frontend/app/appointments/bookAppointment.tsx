import React, { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import RefreshableScroll from "@/components/RefreshableScroll";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import {
  type AvailabilitySlot,
  fetchDoctors,
  type Doctor,
  fetchDoctorAvailability,
  fetchDoctorSchedule,
} from "@/src/services/appointments";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function toLocalDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildMarkedDates(availableDays: string[]): Record<string, any> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const marked: Record<string, any> = {};
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayName = DAY_NAMES[d.getDay()];
    const key = toLocalDateString(d);
    if (availableDays.includes(dayName)) {
      marked[key] = {
        customStyles: {
          container: {
            backgroundColor: "#DBEAFE",
            borderRadius: 8,
          },
          text: {
            color: "#1D4ED8",
            fontWeight: "700",
          },
        },
      };
    }
  }
  return marked;
}

function getTodayString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function BookAppointmentScreen() {
  const insets = useSafeAreaInsets();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState(getTodayString());
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slotsLoaded, setSlotsLoaded] = useState(false);
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [availableDays, setAvailableDays] = useState<string[]>([]);

  const resetSelections = () => {
    setSelectedDoctor(null);
    setSelectedSlot(null);
    setSlotsLoaded(false);
    setAvailableSlots([]);
    setMarkedDates({});
    setAvailableDays([]);
    setDate(getTodayString());
  };

  const loadDoctors = useCallback(async () => {
    try {
      setLoadingDoctors(true);
      resetSelections();
      const docs = await fetchDoctors();
      setDoctors(docs);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Could not load doctors");
    } finally {
      setLoadingDoctors(false);
    }
  }, []);

  console.log("doctors__!", doctors)

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const { refreshing, onRefresh } = usePullToRefresh(loadDoctors);

  const handleSelectDoctor = async (doc: Doctor) => {
    setSelectedDoctor(doc);
    setSlotsLoaded(false);
    setAvailableSlots([]);
    setSelectedSlot(null);
    setMarkedDates({});
    try {
      const days = await fetchDoctorSchedule(doc._id);
      setAvailableDays(days);
      setMarkedDates(buildMarkedDates(days));
    } catch {
      // schedule not configured — calendar stays empty
    }
  };

  const handleDayPress = (day: { dateString: string }) => {
    const selected = day.dateString;
    // Prevent selecting past dates
    if (selected < getTodayString()) return;
    setDate(selected);
    setSlotsLoaded(false);
    setAvailableSlots([]);
    setSelectedSlot(null);
  };

  const handleCheckAvailability = async () => {
    if (!selectedDoctor) {
      Alert.alert("Select a doctor", "Please select a doctor first");
      return;
    }
    try {
      setLoadingSlots(true);
      setSlotsLoaded(false);
      setSelectedSlot(null);
      const result = await fetchDoctorAvailability(selectedDoctor._id, date);
      setAvailableSlots(result.availableSlots);
      setSlotsLoaded(true);
      if (result.availableSlots.length === 0) {
        Alert.alert(
          "No availability",
          "This doctor has no available slots on the selected date. Try another date",
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Could not check availability");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleContinue = () => {
    if (!selectedSlot) {
      Alert.alert("Select a time", "Please pick an available time slot");
      return;
    }
    router.push({
      pathname: "/appointments/confirmAppointment",
      params: {
        doctorId: selectedDoctor!._id,
        doctorFirstName: selectedDoctor!.firstName,
        doctorLastName: selectedDoctor!.lastName,
        date,
        time: selectedSlot,
      },
    });
  };

  const getInitials = (doc: Doctor) =>
    `${doc.firstName?.[0] ?? ""}${doc.lastName?.[0] ?? ""}`.toUpperCase();

  const calendarMarked = {
    ...markedDates,
    [date]: {
      customStyles: {
        container: {
          backgroundColor: "#1D4ED8",
          borderRadius: 8,
        },
        text: {
          color: "#FFFFFF",
          fontWeight: "700",
        },
      },
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backRow}
          activeOpacity={0.7}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={22} color="#1D4ED8" />
          <Text style={styles.backText}>Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.header}>Book Appointment</Text>
        <Text style={styles.subheader}>
          Choose your doctor and preferred date
        </Text>

        {/* Doctor selection card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select doctor</Text>
          {loadingDoctors ? (
            <ActivityIndicator
              size="small"
              color="#1D4ED8"
              style={{ marginVertical: 20 }}
            />
          ) : doctors.length === 0 ? (
            <Text style={styles.emptyText}>No provider available</Text>
          ) : (
            doctors.map((doc, idx) => {
              const isSelected = selectedDoctor?._id === doc._id;
              return (
                <TouchableOpacity
                  key={doc._id}
                  activeOpacity={0.7}
                  style={[
                    styles.docRow,
                    idx === doctors.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => handleSelectDoctor(doc)}
                >
                  <View style={styles.docAvatar}>
                    <Text style={styles.docAvatarText}>{getInitials(doc)}</Text>
                  </View>
                  <View style={styles.docInfo}>
                    <Text style={styles.docName}>
                      Dr. {doc.firstName} {doc.lastName}
                    </Text>
                    <Text style={styles.docSpec}>Provider</Text>
                  </View>
                  <View
                    style={[
                      styles.radioDot,
                      isSelected && styles.radioDotSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioDotInner} />}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Date selection card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select date</Text>
          <Calendar
            current={date}
            minDate={getTodayString()}
            onDayPress={handleDayPress}
            markedDates={calendarMarked}
            markingType="custom"
            theme={{
              todayTextColor: "#1D4ED8",
              arrowColor: "#1D4ED8",
              textDayFontWeight: "500",
              textMonthFontWeight: "700",
              calendarBackground: "#FFFFFF",
            }}
          />
          {availableDays.length > 0 && (
            <Text style={styles.dateHint}>
              Dots mark days this doctor is available
            </Text>
          )}
        </View>

        {/* Check availability button */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.primaryBtn}
          onPress={handleCheckAvailability}
          disabled={loadingSlots}
        >
          {loadingSlots ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryBtnText}>Check availability</Text>
          )}
        </TouchableOpacity>

        {/* Available slots */}
        {slotsLoaded && availableSlots.length > 0 && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Pick a time</Text>
              <View style={styles.slotsWrap}>
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      activeOpacity={0.7}
                      style={[styles.slot, isSelected && styles.slotSelected]}
                      onPress={() => setSelectedSlot(slot)}
                    >
                      <Text
                        style={[
                          styles.slotText,
                          isSelected && styles.slotTextSelected,
                        ]}
                      >
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Continue button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.primaryBtn, !selectedSlot && { opacity: 0.5 }]}
              onPress={handleContinue}
              disabled={!selectedSlot}
            >
              <Text style={styles.primaryBtnText}>Continue to confirm</Text>
            </TouchableOpacity>
          </>
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
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    padding: 16,
    paddingTop: 12,
  },
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
    color: "#0B0F19",
    opacity: 0.85,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 13,
    color: "#0B0F19",
    opacity: 0.5,
    textAlign: "center",
    paddingVertical: 16,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E6EAF2",
    gap: 12,
  },
  docAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  docAvatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0B0F19",
  },
  docSpec: {
    fontSize: 12,
    color: "#0B0F19",
    opacity: 0.55,
    marginTop: 1,
  },
  radioDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E6EAF2",
    alignItems: "center",
    justifyContent: "center",
  },
  radioDotSelected: {
    borderColor: "#1D4ED8",
    backgroundColor: "#1D4ED8",
  },
  radioDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  dateHint: {
    fontSize: 11,
    color: "#0B0F19",
    opacity: 0.45,
    marginTop: 6,
  },
  slotsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slot: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E6EAF2",
    backgroundColor: "#F8FAFC",
  },
  slotSelected: {
    backgroundColor: "#1D4ED8",
    borderColor: "#1D4ED8",
  },
  slotText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0B0F19",
  },
  slotTextSelected: {
    color: "#FFFFFF",
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#1D4ED8",
    alignItems: "center",
    marginBottom: 8,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
