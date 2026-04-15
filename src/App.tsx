/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from "firebase/auth";
import { doc, getDoc, setDoc, collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { UserProfile, UserRole } from "./types";
import { cn, logAudit } from "./lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  Calendar, 
  UserPlus, 
  LogOut, 
  ShieldCheck,
  Menu,
  X,
  Bell,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Components (to be implemented in detail)
import Dashboard from "./components/Dashboard";
import ProviderManagement from "./components/ProviderManagement";
import FinanceAutomation from "./components/FinanceAutomation";
import Scheduling from "./components/Scheduling";
import PatientIntake from "./components/PatientIntake";

const AuthContext = createContext<{
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
} | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          // Default to provider role for new users, unless it's the admin email
          const role: UserRole = firebaseUser.email === "khanalpuspa@gmail.com" ? "admin" : "provider";
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            role,
            displayName: firebaseUser.displayName || "User",
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, "users", firebaseUser.uid), newProfile);
          setProfile(newProfile);
          logAudit(firebaseUser.uid, "user_created", "users", `User ${firebaseUser.email} registered with role ${role}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function Login() {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/50"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Agency Portal</h1>
          <p className="mt-2 text-slate-500">Ohio Home Health Operational & Financial Management</p>
        </div>
        <button
          onClick={handleLogin}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition-all hover:bg-slate-800 active:scale-95"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
          Sign in with Google
        </button>
        <p className="mt-6 text-center text-xs text-slate-400">
          HIPAA Compliant Environment • Secure Access Only
        </p>
      </motion.div>
    </div>
  );
}

function Sidebar() {
  const { profile } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Staff & Providers", path: "/providers", icon: Users },
    { name: "Financial Ledger", path: "/finance", icon: DollarSign },
    { name: "Scheduling", path: "/scheduling", icon: Calendar },
    { name: "Patient Intake", path: "/patients", icon: UserPlus },
  ];

  return (
    <div className="flex h-screen w-[240px] flex-col border-r border-border-subtle bg-sidebar">
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-primary text-white">
          <ShieldCheck size={14} />
        </div>
        <span className="font-bold text-lg text-brand-primary tracking-tight">OHH | Operations</span>
      </div>
      
      <nav className="flex-1 mt-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-6 py-3 text-[14px] font-medium transition-all border-r-3",
              location.pathname === item.path
                ? "bg-sky-50 text-brand-primary border-brand-primary"
                : "text-text-sub hover:bg-slate-50 hover:text-text-main border-transparent"
            )}
          >
            <item.icon size={18} />
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="p-6 border-t border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-text-sub border border-border-subtle">
            {profile?.displayName?.[0]}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-xs font-bold text-text-main">{profile?.displayName}</p>
            <p className="truncate text-[10px] text-text-sub uppercase tracking-wider">Admin: {profile?.role}</p>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="text-text-sub hover:text-accent-danger transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <div className="flex h-screen bg-bg-main text-text-main overflow-hidden">
      {user && <Sidebar />}
      <main className="flex-1 flex flex-col overflow-hidden">
        {user && (
          <header className="h-16 bg-white border-b border-border-subtle flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-sm">Operations Overview</span>
              <div className="status-badge-minimal">
                <span className="text-[8px]">●</span> HIPAA SECURE
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/patients" className="btn-minimal-primary">+ New Intake</Link>
              <div className="h-8 w-8 rounded-full bg-slate-100 border border-border-subtle"></div>
            </div>
          </header>
        )}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/providers" element={<PrivateRoute><ProviderManagement /></PrivateRoute>} />
              <Route path="/finance" element={<PrivateRoute><FinanceAutomation /></PrivateRoute>} />
              <Route path="/scheduling" element={<PrivateRoute><Scheduling /></PrivateRoute>} />
              <Route path="/patients" element={<PrivateRoute><PatientIntake /></PrivateRoute>} />
            </Routes>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

