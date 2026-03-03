import { useState, useEffect } from "react";

export interface PatientProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  allergies: string;
  profile_image: string;
}

export interface DoctorProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  specialization: string;
  experience_years: number;
  clinic_address: string;
  profile_image: string;
}

export type ProfileData = PatientProfile | DoctorProfile;

interface UseProfileDataReturn {
  profile: ProfileData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  updateProfile: (payload: Record<string, any>) => Promise<{ success: boolean; error?: string }>;
}

export function useProfileData(): UseProfileDataReturn {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user data from localStorage
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        setError("No user data found in localStorage");
        setLoading(false);
        return;
      }

      const user = JSON.parse(userStr);
      const role = user.role?.toLowerCase();
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }

      let apiUrl = "";
      if (role === "patient") {
        apiUrl = `${import.meta.env.VITE_API_URL}/api/patients/profile`;
      } else if (role === "doctor") {
        apiUrl = `${import.meta.env.VITE_API_URL}/api/doctors/profile`;
      } else {
        setError(`Unknown role: ${role}`);
        setLoading(false);
        return;
      }

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setProfile(data.data);
      } else {
        setError("Invalid response format from server");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error fetching profile:", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const updateProfile = async (payload: Record<string, any>) => {
    try {
      setLoading(true);
      setError(null);

      const userStr = localStorage.getItem("user");
      if (!userStr) return { success: false, error: "No user in localStorage" };
      const user = JSON.parse(userStr);
      const role = user.role?.toLowerCase();
      const token = localStorage.getItem("token");
      if (!token) return { success: false, error: "No token found" };

      let apiUrl = "";
      if (role === "patient") apiUrl = `${import.meta.env.VITE_API_URL}/api/patients/profile`;
      else if (role === "doctor") apiUrl = `${import.meta.env.VITE_API_URL}/api/doctors/profile`;
      else return { success: false, error: `Unknown role: ${role}` };

      const res = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        return { success: false, error: `Request failed: ${res.status} ${text}` };
      }

      const data = await res.json();
      if (data.success && data.data) {
        setProfile(data.data);
        return { success: true };
      }

      return { success: false, error: "Invalid server response" };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    error,
    refetch: fetchProfileData,
    updateProfile,
  };
}
