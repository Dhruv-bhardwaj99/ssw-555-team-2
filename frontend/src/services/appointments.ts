import { API_BASE_URL } from "../config/api";

export type Doctor = {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "provider";
};

export type Patient = {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "patient";
};

export type AvailabilitySlot = string;

export type DoctorAvailabilityResponse ={
    doctor: {
        id: string,
        firstName: string,
        lastName: string,
        role: string
    };
    date: string,
    availableSlots: AvailabilitySlot[];
};

export type Appointment = {
    _id: string;
    patient_id: string | Patient;
    doctor_id: string | Doctor;
    date: string;
    time: string;
    status: "scheduled" | "cancelled" | "completed";
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
};

export async function fetchDoctors(): Promise<Doctor[]>{
    const res = await fetch(`${API_BASE_URL}/api/users/providers`);
    const data = await res.json();
    if(!res.ok){
        throw new Error(data?.message || "Failed to fetch doctors");
    }
    return data as Doctor[];
}

export async function fetchDoctorAvailability(doctorId:string,
    date: string,
): Promise<DoctorAvailabilityResponse>{
    const res = await fetch(
        `${API_BASE_URL}/appointments/doctors/${doctorId}/availability?date=${date}`,
    );
    const data = await res.json();
    if(!res.ok){
        throw new Error(data?.message || "Failed to fetch availability");
    }
    return data as DoctorAvailabilityResponse;
}

export async function createAppointment(payload: {
    patient_id: string; 
    doctor_id: string;
    date: string;
    time: string;
    notes?: string;
}): Promise<{message: string; appointment: Appointment}>{
    const res = await fetch(`${API_BASE_URL}/appointments`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if(!res.ok){
        throw new Error(data?.message || data?.error || "Failed to book appointment");
    }
    return data;
}

export async function cancelAppointment(
    appointmentId: string,
): Promise<{message: string; appointment: Appointment}>{
    const res = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/cancel`, {
        method: 'PUT'
    });
    const data = await res.json();
    if(!res.ok){
        throw new Error(data?.message || data?.error || "Failed to cancel appointment");
    }
    return data;
}

export async function fetchUserAppointments(
    userId: string,
): Promise<Appointment[]> {
    const res = await fetch(`${API_BASE_URL}/appointments/user/${userId}`);
    const data = await res.json();
    if(!res.ok){
        throw new Error(data?.message || data?.error || "Failed to fetch appointments");
    }
    return data.appointments as Appointment[];
}

export async function fetchDoctorSchedule(doctorId: string): Promise<string[]> {
  const res = await fetch(`${API_BASE_URL}/appointments/doctors/${doctorId}/schedule`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Failed to fetch doctor schedule");
  }
  return data.availableDays as string[];
}