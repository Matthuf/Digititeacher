import { ImageResponse } from "next/og";

const size = { width: 192, height: 192 };

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1f2e2c",
          color: "#d68a4c",
          fontSize: 130,
          fontWeight: 700,
        }}
      >
        S
      </div>
    ),
    size,
  );
}
