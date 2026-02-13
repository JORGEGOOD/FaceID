"use client";

import { useState } from "react";
import FaceCam from "./FaceCam";
import ResultScreen from "./ResultScreen";
import { ShieldCheck } from "lucide-react";

type View = "identify" | "result";

interface ResultData {
  success: boolean;
  distance: number;
  matchedLabel?: string;
  totalProfiles: number;
}

export default function PageClient() {
  const [view,   setView]   = useState<View>("identify");
  const [result, setResult] = useState<ResultData | null>(null);

  function handleResult(success: boolean, distance: number, matchedLabel?: string) {
    // Leer cuántos perfiles hay en este momento
    let total = 0;
    try {
      const raw = localStorage.getItem("face_profiles");
      total = raw ? JSON.parse(raw).length : 0;
    } catch { total = 0; }

    setResult({ success, distance, matchedLabel, totalProfiles: total });
    setTimeout(() => setView("result"), 900);
  }

  function handleRetry() {
    setView("identify");
    setResult(null);
  }

  function handleChangeUser() {
    localStorage.removeItem("face_profiles");
    setView("identify");
    setResult(null);
  }

  // ── Vista B: Resultado ────────────────────────────────────────────────────
  if (view === "result" && result) {
    return (
      <ResultScreen
        success={result.success}
        distance={result.distance}
        matchedLabel={result.matchedLabel}
        totalProfiles={result.totalProfiles}
        onRetry={handleRetry}
        onChangeUser={handleChangeUser}
      />
    );
  }

  // ── Vista A: Identificación ───────────────────────────────────────────────
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "100vh", padding: "24px 16px",
      fontFamily: "'Courier New', monospace",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <ShieldCheck size={28} style={{ color: "#00ffff", filter: "drop-shadow(0 0 8px #00ffff)" }} />
          <span style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", letterSpacing: "0.15em", textTransform: "uppercase", textShadow: "0 0 20px rgba(0,255,255,0.4)" }}>
            FACE<span style={{ color: "#00ffff" }}>ID</span>
          </span>
        </div>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" }}>
          Sistema de identificación biométrica
        </p>
        <div style={{ height: 1, width: 120, margin: "14px auto 0", background: "linear-gradient(90deg, transparent, #00ffff44, transparent)" }} />
      </div>

      <FaceCam onResult={handleResult} />

      <p style={{ marginTop: 32, fontSize: 10, color: "rgba(255,255,255,0.15)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
        Los datos biométricos no salen de tu dispositivo · face-api.js
      </p>
    </div>
  );
}
