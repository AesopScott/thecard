import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PICKS = [
  { q: "Chiefs cover the spread", you: true, them: true },
  { q: "LeBron drops 30+", you: true, them: false },
  { q: "Jones retains title", you: false, them: true },
];

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, background: "#0a0a0f", display: "flex" }}>
        {/* VS divider */}
        <div
          style={{
            position: "absolute",
            left: 586,
            top: 0,
            width: 28,
            height: 630,
            background: "#ff3c3c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              color: "white",
              fontSize: 20,
              fontWeight: 900,
              writingMode: "vertical-rl",
              display: "flex",
            }}
          >
            VS
          </span>
        </div>

        {/* Left: YOU */}
        <div
          style={{
            width: 586,
            height: 630,
            background: "#111118",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "50px 60px",
          }}
        >
          <span style={{ color: "#555", fontSize: 14, fontWeight: 700, letterSpacing: "0.2em" }}>
            YOU
          </span>
          <span style={{ fontSize: 72, marginTop: 12 }}>🧠</span>
          <span style={{ color: "white", fontSize: 26, fontWeight: 700, marginTop: 8 }}>
            Anonymous
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 28, width: "100%" }}>
            {PICKS.map(({ q, you }) => (
              <div
                key={q}
                style={{
                  background: "#1a1a28",
                  borderRadius: 8,
                  padding: "14px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span style={{ color: you ? "#4cff88" : "#ff6666", fontSize: 18, fontWeight: 700 }}>
                  {you ? "✓" : "✗"}
                </span>
                <span style={{ color: "white", fontSize: 16 }}>{q}</span>
              </div>
            ))}
          </div>
          <span style={{ color: "#ff3c3c", fontSize: 32, fontWeight: 900, marginTop: "auto" }}>
            2 / 3
          </span>
        </div>

        {/* Right: THEM */}
        <div
          style={{
            width: 586,
            height: 630,
            background: "#13131e",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "50px 60px",
            marginLeft: 28,
          }}
        >
          <span style={{ color: "#555", fontSize: 14, fontWeight: 700, letterSpacing: "0.2em" }}>
            THEM
          </span>
          <span style={{ fontSize: 72, marginTop: 12 }}>🎯</span>
          <span style={{ color: "white", fontSize: 26, fontWeight: 700, marginTop: 8 }}>
            SharpScott
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 28, width: "100%" }}>
            {PICKS.map(({ q, them }) => (
              <div
                key={q}
                style={{
                  background: "#1d1d2e",
                  borderRadius: 8,
                  padding: "14px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span style={{ color: them ? "#4cff88" : "#ff6666", fontSize: 18, fontWeight: 700 }}>
                  {them ? "✓" : "✗"}
                </span>
                <span style={{ color: "white", fontSize: 16 }}>{q}</span>
              </div>
            ))}
          </div>
          <span style={{ color: "#ff3c3c", fontSize: 32, fontWeight: 900, marginTop: "auto" }}>
            2 / 3
          </span>
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "#333", fontSize: 18 }}>thecard.gg/h2h</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
