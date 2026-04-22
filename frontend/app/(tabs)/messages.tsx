import React, { useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import {
  fetchMessages,
  buildThreads,
  Thread,
} from "../../src/services/messages";
import { fetchDoctors } from "../../src/services/appointments";
import { API_BASE_URL } from "../../src/config/api";


export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadThreads();
  }, [user]);
  
  useFocusEffect(
    React.useCallback(() => {
      if (!user) return;
      loadThreads();
    }, [user])
  );

  async function loadThreads() {
    try {
      setLoading(true);
      setError(null);

      const [messages, providers] = await Promise.all([
        fetchMessages(),
        fetchDoctors(),
      ]);

      let allUsers = [...providers];
      if (user!.role === "provider") {
        const res = await fetch(`${API_BASE_URL}/api/users`);
        if (res.ok) {
          allUsers = await res.json();
        }
      }

      const userNames: Record<string, string> = {};
      for (const u of allUsers) {
        userNames[u._id] =
          u.role === "provider"
            ? `Dr. ${u.firstName} ${u.lastName}`
            : `${u.firstName} ${u.lastName}`;
      }

      setThreads(buildThreads(messages, user!._id, userNames));
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Ionicons name="lock-closed-outline" size={40} color="#1D4ED8" />
          <Text style={styles.emptyText}>Please log in to view messages.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Messages</Text>
            <Text style={styles.headerSubtitle}>Secure chat with your care team</Text>
          </View>
          <TouchableOpacity
            style={styles.composeBtn}
            onPress={() => router.push("/message-doctor")}
          >
            <Ionicons name="create-outline" size={22} color="#1D4ED8" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#1D4ED8" />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadThreads}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : threads.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="chatbubbles-outline" size={48} color="#1D4ED8" />
            <Text style={styles.emptyText}>No conversations yet.</Text>
            <Text style={styles.emptySubText}>
              Your messages with your care team will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={threads}
            keyExtractor={(item) => item.otherPartyId}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push(`/chat/${item.otherPartyId}`)}
                style={styles.threadItem}
              >
                {/* Avatar */}
                <View style={styles.avatar}>
                  <Ionicons name="person" size={20} color="#1D4ED8" />
                </View>

                {/* Content */}
                <View style={styles.threadContent}>
                  <View style={styles.threadTopRow}>
                    <Text style={styles.threadName} numberOfLines={1}>
                      {item.otherPartyName}
                    </Text>
                    <Text style={styles.threadTimestamp}>{item.timestamp}</Text>
                  </View>
                  <Text style={styles.threadLastMessage} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={16} color="#E6EAF2" />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E6EAF2",
  },
  composeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0B0F19",
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#0B0F19",
    opacity: 0.6,
  },
  listContent: {
    paddingVertical: 8,
  },
  separator: {
    height: 1,
    backgroundColor: "#E6EAF2",
    marginLeft: 72,
  },
  threadItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    justifyContent: "center",
    alignItems: "center",
  },
  threadContent: {
    flex: 1,
    gap: 4,
  },
  threadTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  threadName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0B0F19",
    flexShrink: 1,
  },
  threadTimestamp: {
    fontSize: 12,
    color: "#0B0F19",
    opacity: 0.5,
    marginLeft: 8,
  },
  threadLastMessage: {
    fontSize: 13,
    color: "#0B0F19",
    opacity: 0.6,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0B0F19",
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    color: "#0B0F19",
    opacity: 0.55,
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    color: "#EF4444",
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: "#1D4ED8",
    borderRadius: 10,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});