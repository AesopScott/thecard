import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BOARD = [
  { rank: 1, name: "SharpScott", w: 14, l: 3, pct: 82 },
  { rank: 2, name: "MarketMike", w: 11, l: 4, pct: 73 },
  { rank: 3, name: "CalibKing", w: 19, l: 8, pct: 70 },
];

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, background: "#0d0d18", display: "flex" }}>
        {/* Left: headline */}
        <div
          style={{
            width: 420,
            display: "flex",
            flexDirection: "column",
            padding: "80px 60px",
          }}
        >
          <span
            style={{ color: "white", fontSize: 72, fontWeight: 900, lineHeight: 1, letterSpacing: "-2px" }}
          >
            Top
          </span>
          <span
            style={{ color: "#ff3c3c", fontSize: 72, fontWeight: 900, lineHeight: 1, letterSpacing: "-2px" }}
          >
            Fore-casters
          </span>
          <span style={{ color: "#555", fontSize: 22, marginTop: 24, lineHeight: 1.4 }}>
            Who&apos;s got the sharpest read tonight?
          </span>
          <span
            style={{ color: "#ff3c3c", fontSize: 18, fontWeight: 700, marginTop: "auto" }}
          >
            thecard.gg/leaderboard
          </span>
        </div>

        {/* Right: leaderboard */}
        <div
          style={{
            flex: 1,
            margin: "60px 60px 60px 0",
            background: "#111122",
            border: "1px solid #222",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <div
            style={{
              background: "#1a1a30",
              padding: "16px 32px",
              display: "flex",
              gap: 0,
            }}
          >
            <span style={{ color: "#666", fontSize: 14, fontWeight: 700, width: 40, letterSpacing: "0.1em" }}>#</span>
            <span style={{ color: "#666", fontSize: 14, fontWeight: 700, flex: 1, letterSpacing: "0.1em" }}>FORECASTER</span>
            <span style={{ color: "#666", fontSize: 14, fontWeight: 700, width: 80, letterSpacing: "0.1em" }}>W–L</span>
            <span style={{ color: "#666", fontSize: 14, fontWeight: 700, width: 60, textAlign: "right", letterSpacing: "0.1em" }}>WIN%</span>
          </div>

          {/* Rows */}
          {BOARD.map(({ rank, name, w, l, pct }, i) => (
            <div
              key={rank}
              style={{
                padding: "20px 32px",
                background: i % 2 === 0 ? "#141428" : "#111120",
                display: "flex",
                alignItems: "center",
                borderBottom: "1px solid #1a1a2e",
              }}
            >
              <span
                style={{
                  color: rank === 1 ? "#ff3c3c" : "#888",
                  fontSize: 22,
                  fontWeight: 900,
                  width: 40,
                }}
              >
                {rank}
              </span>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ color: "white", fontSize: 20, fontWeight: 700 }}>{name}</span>
                <div style={{ display: "flex", width: 280, height: 6, background: "#222", borderRadius: 3 }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: 6,
                      background: "#ff3c3c",
                      borderRadius: 3,
                      opacity: 1 - i * 0.25,
                      display: "flex",
                    }}
                  />
                </div>
              </div>
              <span style={{ color: "#888", fontSize: 18, width: 80 }}>
                {w}W–{l}L
              </span>
              <span style={{ color: "#4cff88", fontSize: 22, fontWeight: 800, width: 60, textAlign: "right" }}>
                {pct}%
              </span>
            </div>
          ))}

          {/* Fade rows */}
          {[4, 5, 6].map((n) => (
            <div
              key={n}
              style={{
                padding: "20px 32px",
                background: n % 2 === 0 ? "#141428" : "#111120",
                display: "flex",
                opacity: (7 - n) * 0.12,
              }}
            >
              <span style={{ color: "#888", fontSize: 20, width: 40 }}>{n}</span>
              <div style={{ flex: 1, height: 20, background: "#222", borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
