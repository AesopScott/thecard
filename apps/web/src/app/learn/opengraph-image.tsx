import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#0a0a0f",
          display: "flex",
          position: "relative",
        }}
      >
        {/* Red left bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 12,
            height: 630,
            background: "#ff3c3c",
            display: "flex",
          }}
        />

        {/* Ghost text behind */}
        <div
          style={{
            position: "absolute",
            left: 80,
            top: 60,
            display: "flex",
            flexDirection: "column",
            opacity: 0.08,
          }}
        >
          <span style={{ color: "white", fontSize: 180, fontWeight: 900, lineHeight: 0.9, letterSpacing: "-6px" }}>
            THE
          </span>
          <span style={{ color: "white", fontSize: 180, fontWeight: 900, lineHeight: 0.9, letterSpacing: "-6px" }}>
            CARD
          </span>
        </div>

        {/* Main content */}
        <div
          style={{
            position: "absolute",
            left: 80,
            top: 180,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span
            style={{
              color: "white",
              fontSize: 100,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-4px",
            }}
          >
            The Card.
          </span>
          <span style={{ color: "#888", fontSize: 28, marginTop: 24 }}>
            Sports prediction markets.
          </span>
          <span style={{ color: "#888", fontSize: 28, marginTop: 8 }}>
            Real odds. Live. No house edge.
          </span>
        </div>

        {/* Bottom line */}
        <div
          style={{
            position: "absolute",
            bottom: 100,
            left: 80,
            right: 80,
            height: 1,
            background: "#222",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 80,
            right: 80,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ color: "#333", fontSize: 20 }}>thecard.gg</span>
          <span style={{ color: "#ff3c3c", fontSize: 20, fontWeight: 700, letterSpacing: "0.1em" }}>
            TONIGHT&apos;S CARD IS LIVE →
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
