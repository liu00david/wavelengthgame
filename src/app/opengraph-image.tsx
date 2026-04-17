import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Consensus — Wisdom of the Crowds";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#081c48",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* +1 badge */}
        <div
          style={{
            background: "#0a1f52",
            borderRadius: 22,
            padding: "12px 32px",
            marginBottom: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 72, fontWeight: 900, color: "#f6dc53" }}>+1</span>
        </div>

        {/* Title */}
        <div style={{ fontSize: 96, fontWeight: 900, color: "white", letterSpacing: -2, display: "flex" }}>
          CONSENSUS
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: 36, fontWeight: 500, color: "#4dd9d2", letterSpacing: 6, marginTop: 16, display: "flex" }}>
          WISDOM OF THE CROWDS
        </div>

        {/* Description */}
        <div style={{ fontSize: 28, color: "#a8c0e8", marginTop: 32, display: "flex" }}>
          Predict what your group thinks. Score points for getting close.
        </div>

        {/* URL */}
        <div style={{ fontSize: 26, fontWeight: 600, color: "#7862FF", marginTop: 48, display: "flex" }}>
          consensusgame.vercel.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
