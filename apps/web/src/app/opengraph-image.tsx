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
          background: "#0a0a0f",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Red glow from top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 400,
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(255,60,60,0.35) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Live badge */}
        <div
          style={{
            position: "absolute",
            top: 60,
            right: 80,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#ff3c3c",
              display: "flex",
            }}
          />
          <span
            style={{
              color: "#ff3c3c",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "0.15em",
            }}
          >
            LIVE
          </span>
        </div>

        {/* Main text */}
        <div
          style={{
            position: "absolute",
            left: 80,
            top: 160,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span
            style={{
              color: "white",
              fontSize: 112,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-4px",
            }}
          >
            Tonight&apos;s
          </span>
          <span
            style={{
              color: "#ff3c3c",
              fontSize: 112,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-4px",
            }}
          >
            Card.
          </span>
          <span
            style={{
              color: "#666",
              fontSize: 28,
              fontWeight: 400,
              marginTop: 24,
              letterSpacing: "0px",
            }}
          >
            Sports prediction markets for fans, not traders.
          </span>
        </div>

        {/* Bottom domain */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 80,
            display: "flex",
          }}
        >
          <span
            style={{
              color: "#ff3c3c",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "0.2em",
            }}
          >
            THECARD.GG
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
