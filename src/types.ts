export type UserRole = "admin" | "manager" | "provider";

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  createdAt: string;
}

export interface Provider {
  id: string;
  name: string;
  type: "W2" | "Contractor" | "Outsourced_PT" | "Outsourced_OT" | "Maintenance";
  email: string;
  phone: string;
  certifications: any[];
  licenseExpiry: string;
  backgroundCheckDate: string;
  status: "active" | "inactive" | "pending";
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  providerId?: string;
  status: "pending" | "categorized" | "validated";
  taxForm?: "1120-S" | "1099" | "W-2";
}

export interface Patient {
  id: string;
  name: string;
  dob: string;
  medicaidId: string;
  careRequirements: string;
  region: string;
  intakeStatus: "pending" | "completed";
  eSignature?: string;
}

export interface Schedule {
  id: string;
  patientId: string;
  providerId: string;
  visitDate: string;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
}
