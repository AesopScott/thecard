import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function WebAppIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: "#0a0a0f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 300,
            height: 380,
            borderRadius: 52,
            border: "22px solid #ff3c3c",
            background: "#111118",
            boxShadow: "0 0 90px rgba(255,60,60,0.35)",
            color: "#ff3c3c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 210,
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
