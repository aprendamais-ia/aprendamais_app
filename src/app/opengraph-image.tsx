import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Aprendez — O jeito mais leve de passar no concurso";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(135deg, #0A0E14 0%, #1A2330 100%)",
          color: "#E8EEF5",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              width: 18,
              height: 18,
              borderRadius: 9,
              background: "#009C3B",
            }}
          />
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: "#94A3B8",
              letterSpacing: 4,
            }}
          >
            APRENDEZ.COM.BR
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 200,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-6px",
            }}
          >
            <div style={{ display: "flex" }}>Aprende</div>
            <div style={{ display: "flex", color: "#009C3B" }}>z</div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 44,
              color: "#BCC9D6",
              marginTop: 24,
              lineHeight: 1.2,
            }}
          >
            O jeito mais leve de passar no concurso.
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          <div
            style={{
              display: "flex",
              padding: "14px 28px",
              border: "2px solid #2A3441",
              borderRadius: 9999,
              fontSize: 28,
              color: "#BCC9D6",
            }}
          >
            CPA-10
          </div>
          <div
            style={{
              display: "flex",
              padding: "14px 28px",
              border: "2px solid #2A3441",
              borderRadius: 9999,
              fontSize: 28,
              color: "#BCC9D6",
            }}
          >
            OAB
          </div>
          <div
            style={{
              display: "flex",
              padding: "14px 28px",
              background: "#FFDF00",
              borderRadius: 9999,
              fontSize: 28,
              color: "#0A0E14",
              fontWeight: 700,
            }}
          >
            Beta
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
