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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Red glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 700,
            height: 700,
            marginTop: -350,
            marginLeft: -350,
            background: "radial-gradient(ellipse at center, rgba(255,60,60,0.3) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        {/* Rings */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 480,
            height: 480,
            marginTop: -240,
            marginLeft: -240,
            border: "1px solid rgba(255,60,60,0.12)",
            borderRadius: "50%",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 580,
            height: 580,
            marginTop: -290,
            marginLeft: -290,
            border: "1px solid rgba(255,60,60,0.07)",
            borderRadius: "50%",
            display: "flex",
          }}
        />

        <span
          style={{
            color: "#ff3c3c",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "0.3em",
            zIndex: 1,
          }}
        >
          PERFECT 10 JACKPOT
        </span>
        <span
          style={{
            color: "white",
            fontSize: 180,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-8px",
            zIndex: 1,
            marginTop: 8,
          }}
        >
          $42K
        </span>
        <span style={{ color: "#555", fontSize: 24, marginTop: 16, zIndex: 1 }}>
          Call all 10 markets right. Split it.
        </span>
        <span style={{ color: "#ff3c3c", fontSize: 20, fontWeight: 700, marginTop: 12, zIndex: 1 }}>
          Rolling 2 weeks — 847 picks in
        </span>
        <span style={{ color: "#333", fontSize: 18, marginTop: 40, zIndex: 1 }}>thecard.gg</span>
      </div>
    ),
    { ...size },
  );
}
