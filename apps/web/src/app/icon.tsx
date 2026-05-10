import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#1a1a24",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 20,
            height: 26,
            background: "#111118",
            borderRadius: 3,
            border: "2px solid #ff3c3c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ff3c3c",
            fontSize: 14,
            fontWeight: 900,
            lineHeight: 1,
          }}
        >
          ♠
        </div>
      </div>
    ),
    { ...size },
  );
}
