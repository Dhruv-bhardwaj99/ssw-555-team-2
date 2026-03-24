import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";

export default function MessageComposer() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  const addBold = () => {
    setBody((prev) => prev + "**bold text**");
  };

  const addItalic = () => {
    setBody((prev) => prev + "*italic text*");
  };

  const addBullet = () => {
    setBody((prev) => prev + "\n• ");
  };

  const pickAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        setAttachmentName(result.assets[0].name);
      }
    } catch (error) {
      Alert.alert("Error", "Could not pick file");
    }
  };

const sendMessage = async () => {
  const badWords = ["badword1", "badword2", "stupid"];

  if (!subject.trim() || !body.trim()) {
    Alert.alert("Error", "Please enter subject and message");
    return;
  }

  if (body.length > 5000) {
    Alert.alert("Error", "Message should be less than 5000 characters");
    return;
  }

  const lowerBody = body.toLowerCase();
  const hasBadWord = badWords.some((word) => lowerBody.includes(word));

  if (hasBadWord) {
    Alert.alert("Error", "Message contains inappropriate words");
    return;
  }

  try {
    const response = await fetch("http://localhost:5001/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        patient_id: "65f111111111111111111111",
        doctor_id: "65f222222222222222222222",
        subject,
        body,
        encrypted: false,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      Alert.alert("Success", "Message sent successfully");
      setSubject("");
      setBody("");
      setAttachmentName("");
    } else {
      Alert.alert("Error", data.message || "Could not send message");
    }
  } catch (error) {
    Alert.alert("Error", "Server connection failed");
  }
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Message Doctor</Text>

      <Text style={styles.label}>Subject</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter subject"
        value={subject}
        onChangeText={setSubject}
      />

      <Text style={styles.label}>Formatting</Text>
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolButton} onPress={addBold}>
          <Text style={styles.toolText}>B</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolButton} onPress={addItalic}>
          <Text style={styles.toolText}>I</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolButton} onPress={addBullet}>
          <Text style={styles.toolText}>•</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Message</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Write your message"
        value={body}
        onChangeText={setBody}
        multiline
      />

      <TouchableOpacity style={styles.attachButton} onPress={pickAttachment}>
        <Text style={styles.attachText}>Attach File</Text>
      </TouchableOpacity>

      {attachmentName ? (
        <Text style={styles.fileName}>Selected: {attachmentName}</Text>
      ) : null}

      <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
        <Text style={styles.sendText}>Send Message</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    minHeight: 140,
    textAlignVertical: "top",
  },
  toolbar: {
    flexDirection: "row",
    marginBottom: 10,
  },
  toolButton: {
    backgroundColor: "#e6e6e6",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  toolText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  attachButton: {
    backgroundColor: "#f0f0f0",
    padding: 14,
    borderRadius: 8,
    marginTop: 16,
  },
  attachText: {
    fontSize: 15,
    fontWeight: "600",
  },
  fileName: {
    marginTop: 10,
    fontSize: 14,
    color: "#444",
  },
  sendButton: {
    backgroundColor: "#007bff",
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    alignItems: "center",
  },
  sendText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});