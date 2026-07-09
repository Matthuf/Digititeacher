import { ImageResponse } from "next/og";

const size = { width: 512, height: 512 };

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
          background: "#18312b",
          color: "#b6672a",
          fontSize: 340,
          fontWeight: 700,
        }}
      >
        S
      </div>
    ),
    size,
  );
}
