# The Card — Roadmap

## In Progress
- Real data integration — wire LIVE_MARKETS, UPCOMING_EVENTS, and LEADERBOARD to live Kalshi exchange data (currently all hardcoded mock)
- Firebase auth — user accounts, session persistence

## Planned

### Mobile App (iOS + Android)
- **Approach:** Capacitor — wraps the existing Next.js/React app in a native WebView shell, minimal code changes required
- **Build:** EAS Build (Expo Application Services) for cloud iOS compilation — no Mac required on Windows dev machine
- **Requires:** Apple Developer Account ($99/yr); resolve Firebase Firestore permissions first
- **Scope:** Define which surfaces to include in v1 before starting
- **Status:** Deferred — not started

## Deferred
- LMS / embed integrations
- Certification / payment layer
- React Native rewrite (only if native feel becomes a hard requirement post-launch)
