import { View, Text, TextInput, Button, FlatList } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";

export default function ChatScreen() {
  const { id } = useLocalSearchParams();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { id: "1", text: "Hello, how are you?", sender: "doctor",
        time: new Date().toLocaleTimeString([],{
            hour: "2-digit",
            minute: "2-digit",
        }),
     },
    { id: "2", text: "I am fine, thank you!", sender: "doctor",
        time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        }),
     },
  ]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: message,
      sender: "user",
      time: new Date().toLocaleTimeString([],{
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([...messages, newMessage]);
    setMessage("");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", padding: 16 }}>
      <Text style={{ fontWeight: "bold", marginBottom: 10 }}>
        Chat with Doctor {id}
      </Text>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => {
            const isUser = item.sender === "user";

            return (
                <View
                    style={{
                        alignSelf: isUser ? "flex-end" : "flex-start",
                        backgroundColor: isUser ? "#1D4ED8" : "#E5E7EB",
                        padding: 10,
                        borderRadius: 10,
                        marginVertical: 4,
                        maxWidth: "75%",
                    }}
                >
                    <Text style={{ color: isUser ? "#fff" : "#000" }}>
                        {item.text}
                    </Text>

                    <Text
                        style={{
                            fontSize: 10,
                            color: isUser ? "#ddd" : "#555",
                            marginTop: 4,
                            textAlign: "right",
                        }}
                    >
                        {item.time}
                    </Text>
                </View>
            );
        }}
      />
      
      {/* 💬 MESSAGE INPUT */}
      <View
        style={{
          flexDirection: "row",
          position: "absolute",
          bottom: 10,
          left: 10,
          right: 10,
          backgroundColor: "#fff",
        }}
      >
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            borderRadius: 8,
            marginRight: 10,
          }}
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
}