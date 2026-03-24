import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";//this
import { IconSymbol } from "@/components/ui/icon-symbol";//this
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,//this
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E6EAF2",//this
          borderTopWidth: 1,//this
        },
        tabBarActiveTintColor: "#1D4ED8",
        tabBarInactiveTintColor: "rgba(11, 15, 25, 0.6)",
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />//this
            //<Ionicons name="home" size={24} color={color} />  //added now to test
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: "messages",
          tabBarIcon: ({ color, size}) => (
            <Ionicons name="chatbubble" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
