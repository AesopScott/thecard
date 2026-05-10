import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MARKETS = [
  { sport: "NFL", q: "Chiefs cover the spread tonight", yes: 58, no: 42 },
  { sport: "NBA", q: "LeBron drops 30+ vs the Celtics", yes: 44, no: 56 },
  { sport: "UFC", q: "Jones retains the heavyweight title", yes: 71, no: 29 },
  { sport: "MLB", q: "Dodgers win Game 3", yes: 62, no: 38 },
];

function Row({ sport, q, yes, no }: { sport: string; q: string; yes: number; no: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0 28px",
        height: 70,
        background: "#161620",
        borderRadius: 8,
        marginBottom: 8,
        gap: 16,
      }}
    >
      <span style={{ color: "#888", fontSize: 13, fontWeight: 700, width: 40 }}>{sport}</span>
      <span style={{ color: "white", fontSize: 18, fontWeight: 500, flex: 1 }}>{q}</span>
      <div style={{ display: "flex", gap: 8 }}>
        <div
          style={{
            background: "#1d3d1d",
            borderRadius: 6,
            padding: "6px 14px",
            color: "#4cff88",
            fontSize: 16,
            fontWeight: 800,
            display: "flex",
          }}
        >
          {yes}¢
        </div>
        <div
          style={{
            background: "#3d1d1d",
            borderRadius: 6,
            padding: "6px 14px",
            color: "#ff6666",
            fontSize: 16,
            fontWeight: 800,
            display: "flex",
          }}
        >
          {no}¢
        </div>
      </div>
    </div>
  );
}

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, background: "#0a0a0f", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div
          style={{
            background: "#ff3c3c",
            padding: "0 60px",
            height: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: "white", fontSize: 36, fontWeight: 900, letterSpacing: "-1px" }}>
              THE CARD
            </span>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 18 }}>
              Tonight&apos;s Prediction Markets
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "white",
                display: "flex",
              }}
            />
            <span style={{ color: "white", fontSize: 18, fontWeight: 700 }}>LIVE</span>
          </div>
        </div>

        {/* Markets */}
        <div style={{ flex: 1, padding: "20px 60px", display: "flex", flexDirection: "column" }}>
          {MARKETS.map((m) => (
            <Row key={m.sport} {...m} />
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            background: "#111",
            height: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 60px",
          }}
        >
          <span style={{ color: "#555", fontSize: 20 }}>thecard.gg</span>
          <div
            style={{
              background: "#ff3c3c",
              borderRadius: 10,
              padding: "14px 32px",
              color: "white",
              fontSize: 20,
              fontWeight: 700,
              display: "flex",
            }}
          >
            Make Your Picks →
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
