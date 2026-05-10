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
  reload,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { upsertUserProfile, getUserUsername } from "@/lib/user-store";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  needsOnboarding: boolean;
  username: string | null;
  emailVerified: boolean;
  verificationRequired: boolean;
  completeOnboarding: () => void;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setEmailVerified(Boolean(u?.emailVerified));
      setLoading(false);
      if (u) {
        await upsertUserProfile(u).catch((error) => {
          console.warn("User profile sync failed:", error);
        });
        const username = await getUserUsername(u.uid).catch(() => null);
        setUsername(username);
        setNeedsOnboarding(Boolean(u.emailVerified && !username));
      } else {
        setUsername(null);
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

  async function refreshUser() {
    if (!auth || !auth.currentUser) return;
    await reload(auth.currentUser);
    await auth.currentUser.getIdToken(true);
    setUser(auth.currentUser);
    setEmailVerified(auth.currentUser.emailVerified);
    if (auth.currentUser.emailVerified) {
      const username = await getUserUsername(auth.currentUser.uid).catch(() => null);
      setUsername(username);
      setNeedsOnboarding(!username);
    }
  }

  async function signOut() {
    if (!auth) return;
    await fbSignOut(auth);
  }

  const verificationRequired = Boolean(user && !emailVerified);

  return (
    <AuthContext.Provider value={{ user, loading, needsOnboarding, username, emailVerified, verificationRequired, completeOnboarding, signInWithGoogle, signUpWithEmail, signInWithEmail, sendVerificationEmail, refreshUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
