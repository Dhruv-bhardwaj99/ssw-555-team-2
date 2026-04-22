import { Redirect, Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";//this
import { IconSymbol } from "@/components/ui/icon-symbol";//this
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";

export default function TabLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E6EAF2",
          borderTopWidth: 1,
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
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "messages",
          href: user?.role === "admin" ? null : undefined,
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubble" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: user ? "Profile" : "Log In",
          tabBarIcon: ({ color }) => (
            <Ionicons
              name={user ? "person" : "log-in-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
