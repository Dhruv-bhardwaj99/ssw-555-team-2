import { Redirect } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";

export default function Index() {
  const { user } = useAuth();
  console.log("check__1", user)
  return <Redirect href={user ? "/(tabs)/dashboard" : "/login"} />;
}
