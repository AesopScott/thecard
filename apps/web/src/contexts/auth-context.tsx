"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { upsertUserProfile, getUserUsername } from "@/lib/user-store";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  needsOnboarding: boolean;
  completeOnboarding: () => void;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        await upsertUserProfile(u);
        const username = await getUserUsername(u.uid);
        setNeedsOnboarding(!username);
      } else {
        setNeedsOnboarding(false);
      }
    });
    return unsub;
  }, []);

  function completeOnboarding() {
    setNeedsOnboarding(false);
  }

  async function signInWithGoogle() {
    if (!auth) throw new Error("Firebase not configured");
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  async function signUpWithEmail(email: string, password: string) {
    if (!auth) throw new Error("Firebase not configured");
    await createUserWithEmailAndPassword(auth, email, password);
    await sendVerificationEmail();
  }

  async function signInWithEmail(email: string, password: string) {
    if (!auth) throw new Error("Firebase not configured");
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function sendVerificationEmail() {
    if (!auth || !auth.currentUser) throw new Error("No user signed in");
    await sendEmailVerification(auth.currentUser);
  }

  async function signOut() {
    if (!auth) return;
    await fbSignOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, needsOnboarding, completeOnboarding, signInWithGoogle, signUpWithEmail, signInWithEmail, sendVerificationEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
