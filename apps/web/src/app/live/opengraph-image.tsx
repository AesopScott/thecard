import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MARKETS = [
  { sport: "NFL", q: "Chiefs cover the spread tonight", yes: 58 },
  { sport: "NBA", q: "LeBron drops 30+ vs the Celtics", yes: 44 },
  { sport: "UFC", q: "Jones retains the heavyweight title", yes: 71 },
  { sport: "MLB", q: "Dodgers win Game 3", yes: 62 },
];

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, background: "#0d0d18", display: "flex" }}>
        {/* Left */}
        <div
          style={{
            width: 480,
            display: "flex",
            flexDirection: "column",
            padding: "80px 60px",
            borderRight: "3px solid #ff3c3c",
          }}
        >
          <span style={{ color: "white", fontSize: 80, fontWeight: 900, lineHeight: 1, letterSpacing: "-3px" }}>
            The
          </span>
          <span style={{ color: "#ff3c3c", fontSize: 80, fontWeight: 900, lineHeight: 1, letterSpacing: "-3px" }}>
            Card.
          </span>
          <span style={{ color: "#555", fontSize: 22, marginTop: 24 }}>
            Real markets. Live odds. No house edge.
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: "auto",
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#ff3c3c",
                display: "flex",
              }}
            />
            <span style={{ color: "#ff3c3c", fontSize: 18, fontWeight: 700, letterSpacing: "0.15em" }}>
              LIVE NOW
            </span>
          </div>
        </div>

        {/* Right: market feed */}
        <div
          style={{
            flex: 1,
            padding: "60px 48px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <span
            style={{
              color: "#ff3c3c",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.2em",
              marginBottom: 8,
            }}
          >
            TONIGHT&apos;S MARKETS
          </span>
          {MARKETS.map(({ sport, q, yes }) => (
            <div
              key={sport}
              style={{
                background: "#1a1a2e",
                borderRadius: 10,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <span style={{ color: "#888", fontSize: 12, fontWeight: 700, width: 36 }}>{sport}</span>
              <span style={{ color: "white", fontSize: 17, fontWeight: 500, flex: 1 }}>{q}</span>
              <div
                style={{
                  background: "#1d3d1d",
                  borderRadius: 6,
                  padding: "6px 14px",
                  color: "#4cff88",
                  fontSize: 15,
                  fontWeight: 800,
                  display: "flex",
                }}
              >
                {yes}¢
              </div>
            </div>
          ))}
          {/* Jackpot bar */}
          <div
            style={{
              background: "#ff3c3c",
              borderRadius: 10,
              padding: "16px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 8,
            }}
          >
            <span style={{ color: "white", fontSize: 16, fontWeight: 700 }}>PERFECT 10 JACKPOT</span>
            <span style={{ color: "white", fontSize: 32, fontWeight: 900 }}>$42,000</span>
          </div>
          <span style={{ color: "#444", fontSize: 16, marginTop: 4 }}>thecard.gg</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
