import { API_BASE_URL } from "../config/api";

export type Message = {
  _id: string;
  patient_id: string;
  doctor_id: string;
  sender_id: string;
  sender_role: "patient" | "provider" | "admin";
  subject: string;
  body: string;
  encrypted: boolean;
  read: boolean;
  timestamp: string;
};

export type Thread = {
  otherPartyId: string;
  otherPartyName: string;
  lastMessage: string;
  timestamp: string;
};

export async function fetchMessages(): Promise<Message[]> {
  const res = await fetch(`${API_BASE_URL}/messages`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Failed to fetch messages");
  }
  return data as Message[];
}

export async function sendMessage(payload: {
  patient_id: string;
  doctor_id: string;
  sender_id: string;
  sender_role: "patient" | "provider" | "admin";
  subject: string;
  body: string;
  encrypted?: boolean;
}): Promise<Message> {
  const res = await fetch(`${API_BASE_URL}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      encrypted: payload.encrypted ?? false,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || "Failed to send message");
  }

  return data as Message;
}

export async function markMessageAsRead(id: string): Promise<Message> {
  const res = await fetch(`${API_BASE_URL}/messages/${id}/read`, {
    method: "PUT",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Failed to mark message as read");
  }
  return data as Message;
}

export function buildThreads(
  messages: Message[],
  userId: string,
  userNames: Record<string, string>
): Thread[] {
  const relevant = messages.filter(
    (m) => m.patient_id === userId || m.doctor_id === userId
  );

  const threadMap: Record<string, Message> = {};
  for (const msg of relevant) {
    const otherId = msg.patient_id === userId ? msg.doctor_id : msg.patient_id;
    const existing = threadMap[otherId];
    if (!existing || new Date(msg.timestamp) > new Date(existing.timestamp)) {
      threadMap[otherId] = msg;
    }
  }

  return Object.entries(threadMap)
    .sort(
      ([, a], [, b]) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .map(([otherId, msg]) => ({
      otherPartyId: otherId,
      otherPartyName: userNames[otherId] ?? "Unknown",
      lastMessage: msg.body,
      timestamp: formatTimestamp(msg.timestamp),
    }));
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}