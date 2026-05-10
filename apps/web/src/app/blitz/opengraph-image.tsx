import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function Box({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div
      style={{
        width: 200,
        height: 200,
        background: accent ? "#ff3c3c" : "#161620",
        border: accent ? "none" : "2px solid #ff3c3c",
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <span
        style={{
          color: "white",
          fontSize: accent ? 48 : 96,
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span style={{ color: accent ? "rgba(255,255,255,0.8)" : "#555", fontSize: 18 }}>
        {label}
      </span>
    </div>
  );
}

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
        }}
      >
        {/* Top gradient bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #ff3c3c, #ff8800, #ff3c3c)",
            display: "flex",
          }}
        />

        <span
          style={{
            color: "#ff3c3c",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.3em",
            marginTop: 60,
          }}
        >
          MARKETS CLOSE IN
        </span>

        <div style={{ display: "flex", gap: 24, marginTop: 32 }}>
          <Box value="02" label="HOURS" />
          <Box value="37" label="MINS" />
          <Box value="14" label="SECS" />
          <Box value="Pick" label="now →" accent />
        </div>

        <span
          style={{
            color: "white",
            fontSize: 40,
            fontWeight: 900,
            letterSpacing: "-1px",
            marginTop: 48,
          }}
        >
          Blitz — 5 markets, 15 seconds each
        </span>
        <span style={{ color: "#555", fontSize: 22, marginTop: 12 }}>thecard.gg/blitz</span>
      </div>
    ),
    { ...size },
  );
}
