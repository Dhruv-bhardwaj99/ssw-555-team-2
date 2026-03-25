import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

const threads = [
  {
    id: "1",
    doctor: "Dr. Smith",
    lastMessage: "Please take your medication regularly.",
    timestamp: "10:30 AM",
  },
  {
    id: "2",
    doctor: "Dr. John",
    lastMessage: "Your test reports look good.",
    timestamp: "Yesterday",
  },
  {
    id: "3",
    doctor: "Dr. Emily",
    lastMessage: "Schedule your follow-up visit.",
    timestamp: "2 days ago",
  },
];

export default function MessagesScreen() {
  console.log("Messages screen loaded");
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <FlatList
        data={threads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/chat/${item.id}`)}
            style={{
              padding: 16,
              borderBottomWidth: 1,
              borderColor: "#eee",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>
              {item.doctor}
            </Text>

            <Text style={{ color: "gray", marginTop: 4 }}>
              {item.lastMessage}
            </Text>

            <Text
              style={{
                fontSize: 12,
                color: "gray",
                marginTop: 6,
                textAlign: "right",
              }}
            >
              {item.timestamp}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}