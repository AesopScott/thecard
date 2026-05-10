import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ROWS = [
  { q: "Chiefs to win Super Bowl LX",      crowd: 62, yours: 65, result: "✓" },
  { q: "LeBron scores 30+ tonight",         crowd: 38, yours: 35, result: "✓" },
  { q: "Jones retains heavyweight title",   crowd: 71, yours: 80, result: "✓" },
  { q: "Dodgers win the World Series",      crowd: 55, yours: 45, result: "✗" },
];

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, background: "#0a0a0f", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ background: "#161620", padding: "0 60px", height: 110, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #ff3c3c" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: "white", fontSize: 40, fontWeight: 900, letterSpacing: "-1px" }}>Forecast</span>
            <span style={{ color: "#888", fontSize: 20 }}>Build your calibration record</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ color: "#ff3c3c", fontSize: 48, fontWeight: 900 }}>87%</span>
            <span style={{ color: "#888", fontSize: 18 }}>calibration score</span>
          </div>
        </div>

        {/* Rows */}
        <div style={{ flex: 1, padding: "20px 60px", display: "flex", flexDirection: "column", gap: 10 }}>
          {ROWS.map((r) => (
            <div key={r.q} style={{ display: "flex", alignItems: "center", background: "#161620", borderRadius: 8, padding: "0 24px", height: 72, gap: 16 }}>
              <span style={{ color: r.result === "✓" ? "#4cff88" : "#ff6666", fontSize: 24, fontWeight: 900, width: 32 }}>{r.result}</span>
              <span style={{ color: "white", fontSize: 18, flex: 1 }}>{r.q}</span>
              <div style={{ display: "flex", gap: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ color: "#888", fontSize: 13 }}>Crowd</span>
                  <span style={{ color: "#aaa", fontSize: 20, fontWeight: 700 }}>{r.crowd}%</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ color: "#888", fontSize: 13 }}>You</span>
                  <span style={{ color: "white", fontSize: 20, fontWeight: 700 }}>{r.yours}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ background: "#111", height: 80, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 60px" }}>
          <span style={{ color: "#555", fontSize: 20 }}>thecard.bet</span>
          <div style={{ background: "#ff3c3c", borderRadius: 10, padding: "14px 32px", color: "white", fontSize: 20, fontWeight: 700, display: "flex" }}>
            Start Forecasting →
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
