import Constants from "expo-constants";
const extra = (Constants.expoConfig?.extra ?? {}) as { API_BASE_URL?: string };
export const API_BASE_URL =
  extra.API_BASE_URL?.trim() || "http://192.168.1.171:5000";