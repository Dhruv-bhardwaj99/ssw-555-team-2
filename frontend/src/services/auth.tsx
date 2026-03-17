import { API_BASE_URL } from "../config/api";
export type LoginResponse = {
  message: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "patient" | "provider" | "admin";
    createdAt?: string;
    updatedAt?: string;
  };
};

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Login failed");

  return data as LoginResponse;
}

export type SignupPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "patient" | "provider" | "admin";
};

export type SignupResponse = {
  message: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "patient" | "provider" | "admin";
    createdAt?: string;
    updatedAt?: string;
  };
};

export async function signup(payload: SignupPayload): Promise<SignupResponse> {
  const res = await fetch(`${API_BASE_URL}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Signup failed");
  return { message: "Signup successful", user: data } as SignupResponse;
}
