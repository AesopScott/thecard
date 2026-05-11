import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#0a0a0f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 108,
            height: 136,
            borderRadius: 22,
            border: "8px solid #ff3c3c",
            background: "#111118",
            color: "#ff3c3c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 78,
            fontWeight: 900,
          }}
        >
          C
        </div>
      </div>
    ),
    { ...size },
  );
}
