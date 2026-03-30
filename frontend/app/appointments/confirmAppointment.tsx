import React from "react";
import { StyleSheet, Text } from "react-native";

export default function ConfirmAppointmentScreen(){
    return(
        <Text style={[styles.container, {color: "#0B0F19"}]}>Welcome to confirm appointment</Text>
    )
}

const styles = StyleSheet.create({
    container: {
    padding: 16,
    textAlign: "center",
    paddingTop: 200,
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
})