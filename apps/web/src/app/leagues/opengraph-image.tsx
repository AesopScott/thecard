import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#0c0c14",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Background emoji grid */}
        {[
          { x: 50,   y: 60,   e: "🏈", s: 70 },
          { x: 200,  y: 20,   e: "🏀", s: 60 },
          { x: 360,  y: 80,   e: "⚾", s: 65 },
          { x: 500,  y: 10,   e: "🏒", s: 70 },
          { x: 680,  y: 50,   e: "🥊", s: 60 },
          { x: 820,  y: 15,   e: "🏈", s: 65 },
          { x: 980,  y: 70,   e: "🏀", s: 70 },
          { x: 1100, y: 20,   e: "⚾", s: 60 },
          { x: 30,   y: 260,  e: "🥊", s: 65 },
          { x: 180,  y: 220,  e: "🏒", s: 70 },
          { x: 1060, y: 240,  e: "🏈", s: 65 },
          { x: 80,   y: 460,  e: "⚾", s: 70 },
          { x: 260,  y: 500,  e: "🏒", s: 60 },
          { x: 1000, y: 480,  e: "🏈", s: 65 },
          { x: 1100, y: 540,  e: "🥊", s: 60 },
        ].map(({ x, y, e, s }, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              fontSize: s,
              opacity: 0.06,
              display: "flex",
            }}
          >
            {e}
          </div>
        ))}

        {/* Center card */}
        <div
          style={{
            background: "rgba(10,10,15,0.88)",
            border: "1px solid #222",
            borderRadius: 20,
            padding: "60px 80px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            minWidth: 580,
          }}
        >
          <span
            style={{ color: "white", fontSize: 72, fontWeight: 900, lineHeight: 1, letterSpacing: "-2px" }}
          >
            Leagues
          </span>
          <span style={{ color: "#555", fontSize: 24, textAlign: "center" }}>
            Sport-specific seasons. Compete with your crew.
          </span>
          <div
            style={{
              background: "#ff3c3c",
              borderRadius: 12,
              padding: "16px 40px",
              color: "white",
              fontSize: 20,
              fontWeight: 700,
              marginTop: 16,
              display: "flex",
            }}
          >
            Join a League →
          </div>
          <span style={{ color: "#333", fontSize: 16 }}>thecard.gg/leagues</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
