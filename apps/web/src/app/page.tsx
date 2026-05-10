"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Static export can't use server redirect — there's no server.
// Client-side redirect with a noscript fallback so SEO crawlers and
// no-JS visitors still find /card.
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/card");
  }, [router]);

  return (
    <noscript>
      <meta httpEquiv="refresh" content="0; url=/card/" />
      <a href="/card/">Continue to The Card</a>
    </noscript>
  );
}
