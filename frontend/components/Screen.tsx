import React from "react";
import { View, StyleSheet, ViewProps } from "react-native";

export default function Screen(props: ViewProps) {
  return <View {...props} style={[styles.base, props.style]} />;
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});