"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { SignInSheet } from "./sign-in-sheet";

interface AuthCtaProps {
  href: string;
  signedOutLabel: string;
  signedInLabel?: string;
  className: string;
}

export function AuthCta({ href, signedOutLabel, signedInLabel, className }: AuthCtaProps) {
  const { user, loading } = useAuth();
  const [signInOpen, setSignInOpen] = useState(false);

  if (user) {
    return (
      <Link href={href} className={className}>
        {signedInLabel ?? signedOutLabel}
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setSignInOpen(true)}
        disabled={loading}
        className={className}
      >
        {signedOutLabel}
      </button>
      <SignInSheet open={signInOpen} onClose={() => setSignInOpen(false)} />
    </>
  );
}
