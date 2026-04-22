import { API_BASE_URL } from "../config/api";
import { Appointment } from "./appointments";
 
export type User = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "patient" | "provider" | "admin";
  createdAt?: string;
};
 
export async function fetchAllUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE_URL}/api/users`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch users");
  return data as User[];
}
 
export async function fetchAllAppointments(): Promise<Appointment[]> {
  const res = await fetch(`${API_BASE_URL}/appointments/all`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch appointments");
  return data.appointments as Appointment[];
}
 
export async function deleteUser(userId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to delete user");
}
 
export async function deleteAppointment(appointmentId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to delete appointment");
}