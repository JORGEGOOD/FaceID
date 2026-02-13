"use client";

import { useEffect, useState } from "react";

type ScanState = "idle" | "scanning" | "success" | "error";

interface ScanOverlayProps {
  state: ScanState;
}

export default function ScanOverlay({ state }: ScanOverlayProps) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (state !== "scanning") return;
    const interval = setInterval(() => setPulse((p) => !p), 600);
    return () => clearInterval(interval);
  }, [state]);

  const cornerColor =
    state === "success"
      ? "#00ff88"
      : state === "error"
      ? "#ff003c"
      : "#00ffff";

  const cornerStyle: React.CSSProperties = {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: cornerColor,
    borderStyle: "solid",
    transition: "border-color 0.3s ease",
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      {/* ── Esquinas ── */}
      <div style={{ ...cornerStyle, top: 12, left: 12, borderWidth: "3px 0 0 3px" }} />
      <div style={{ ...cornerStyle, top: 12, right: 12, borderWidth: "3px 3px 0 0" }} />
      <div style={{ ...cornerStyle, bottom: 12, left: 12, borderWidth: "0 0 3px 3px" }} />
      <div style={{ ...cornerStyle, bottom: 12, right: 12, borderWidth: "0 3px 3px 0" }} />

      {/* ── Línea de escaneo (solo cuando scanning) ── */}
      {state === "scanning" && (
        <div
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${cornerColor}, transparent)`,
            animation: "scanline 2s linear infinite",
            boxShadow: `0 0 12px ${cornerColor}`,
          }}
        />
      )}

      {/* ── Cruz central (crosshair) ── */}
      {state !== "idle" && (
        <>
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 1,
              height: 30,
              background: cornerColor,
              opacity: pulse ? 1 : 0.3,
              transition: "opacity 0.3s",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 30,
              height: 1,
              background: cornerColor,
              opacity: pulse ? 1 : 0.3,
              transition: "opacity 0.3s",
            }}
          />
        </>
      )}

      {/* ── Pulso de éxito/fallo ── */}
      {(state === "success" || state === "error") && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            background:
              state === "success"
                ? "rgba(0,255,136,0.08)"
                : "rgba(255,0,60,0.08)",
            animation: "flashPulse 0.5s ease-out",
          }}
        />
      )}

      {/* ── Estilos de animación ── */}
      <style>{`
        @keyframes scanline {
          0%   { top: 12px; opacity: 1; }
          90%  { opacity: 1; }
          100% { top: calc(100% - 12px); opacity: 0; }
        }
        @keyframes flashPulse {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
