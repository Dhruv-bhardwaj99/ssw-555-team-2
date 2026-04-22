import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import {
  fetchMessages,
  sendMessage,
  formatTimestamp,
  Message,
} from "../../src/services/messages";
import { validateChatBody } from "../../src/utils/messageValidation";

type ChatMessage = {
  _id: string;
  text: string;
  sender: "user" | "other";
  senderName: string;
  time: string;
};

function toChatMessage(
  msg: Message,
  userId: string,
  userRole: "patient" | "provider" | "admin"
): ChatMessage {
  const isUser = msg.sender_id === userId;

  return {
    _id: msg._id,
    text: msg.body,
    sender: isUser ? "user" : "other",
    senderName: isUser
      ? "You"
      : userRole === "patient"
      ? "Doctor"
      : "Patient",
    time: formatTimestamp(msg.timestamp),
  };
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!user || !id) return;
    loadMessages();
  }, [user, id]);

  async function loadMessages() {
    try {
      setLoading(true);
      setError(null);

      const all = await fetchMessages();
      const conversation = all
        .filter(
          (m) =>
            (m.patient_id === user!._id && m.doctor_id === id) ||
            (m.doctor_id === user!._id && m.patient_id === id)
        )
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

      setChatMessages(
        conversation.map((m) => toChatMessage(m, user!._id, user!.role))
      );
    } catch (err: any) {
      setError(err.message ?? "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!user || !id || sending) return;

    const check = validateChatBody(input);
    if (!check.valid) {
      setError(check.error);
      return;
    }

    const body = input.trim();
    setInput("");
    setSending(true);
    setError(null);

    try {
      const isPatient = user.role === "patient";
      const saved = await sendMessage({
        patient_id: isPatient ? user._id : id,
        doctor_id: isPatient ? id : user._id,
        sender_id: user._id,
        sender_role: user.role,
        subject: "Chat message",
        body,
        encrypted: false,
      });

      setChatMessages((prev) => [
        ...prev,
        toChatMessage(saved, user._id, user.role),
      ]);
    } catch (err: any) {
      setError(err.message ?? "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Please log in to chat.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1D4ED8" />
          </TouchableOpacity>
          <View style={styles.headerAvatar}>
            <Ionicons name="person" size={18} color="#1D4ED8" />
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Chat
          </Text>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#1D4ED8" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={chatMessages}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            ListEmptyComponent={
              <View style={styles.centered}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={48}
                  color="#1D4ED8"
                />
                <Text style={styles.emptyText}>No messages yet.</Text>
                <Text style={styles.emptySubText}>
                  Send a message to start the conversation.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isUser = item.sender === "user";

              return (
                <View
                  style={[
                    styles.bubble,
                    isUser ? styles.bubbleUser : styles.bubbleOther,
                  ]}
                >
                  <Text
                    style={[
                      styles.senderLabel,
                      isUser ? styles.senderLabelUser : styles.senderLabelOther,
                    ]}
                  >
                    {item.senderName}
                  </Text>

                  <Text
                    style={[
                      styles.bubbleText,
                      isUser ? styles.bubbleTextUser : styles.bubbleTextOther,
                    ]}
                  >
                    {item.text}
                  </Text>

                  <Text
                    style={[
                      styles.bubbleTime,
                      isUser ? styles.bubbleTimeUser : styles.bubbleTimeOther,
                    ]}
                  >
                    {item.time}
                  </Text>
                </View>
              );
            }}
          />
        )}

        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor="rgba(11,15,25,0.4)"
            style={styles.textInput}
            multiline
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={sending || !input.trim()}
            style={[
              styles.sendBtn,
              (!input.trim() || sending) && styles.sendBtnDisabled,
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E6EAF2",
    backgroundColor: "#FFFFFF",
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#0B0F19",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorBannerText: {
    fontSize: 13,
    color: "#EF4444",
    flexShrink: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  bubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginVertical: 2,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: "#1D4ED8",
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E6EAF2",
    borderBottomLeftRadius: 4,
  },
  senderLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
  },
  senderLabelUser: {
    color: "rgba(255,255,255,0.8)",
  },
  senderLabelOther: {
    color: "rgba(11,15,25,0.55)",
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextUser: {
    color: "#FFFFFF",
  },
  bubbleTextOther: {
    color: "#0B0F19",
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
    textAlign: "right",
  },
  bubbleTimeUser: {
    color: "rgba(255,255,255,0.65)",
  },
  bubbleTimeOther: {
    color: "rgba(11,15,25,0.45)",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E6EAF2",
    backgroundColor: "#FFFFFF",
    gap: 10,
  },
  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#E6EAF2",
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0B0F19",
    backgroundColor: "#F8FAFC",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1D4ED8",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "#BFDBFE",
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
    fontSize: 15,
    color: "#EF4444",
    textAlign: "center",
  },
});