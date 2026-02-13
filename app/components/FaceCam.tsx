"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Camera, ScanFace, AlertTriangle, Loader2, Users, Trash2 } from "lucide-react";
import ScanOverlay from "./ScanOverlay";

type AppState =
  | "loading_models"
  | "camera_starting"
  | "camera_blocked"
  | "no_registration"
  | "ready"
  | "scanning"
  | "done_success"
  | "done_error";

export interface FaceProfile {
  id: string;       // "face_profile_1", "face_profile_2"...
  label: string;    // "Registro 1", "Registro 2"...
  descriptor: number[];
}

interface FaceCamProps {
  onResult: (success: boolean, distance: number, matchedLabel?: string) => void;
}

const THRESHOLD = 0.55;
const MODEL_URL = "/models";
const STORAGE_KEY = "face_profiles";

function euclideanDistance(a: number[], b: number[]) {
  return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0));
}

// ── Helpers de localStorage ───────────────────────────────────────────────────
function loadProfiles(): FaceProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveProfiles(profiles: FaceProfile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

const LABELS: Record<AppState, string> = {
  loading_models:  "Cargando modelos de IA…",
  camera_starting: "Iniciando cámara…",
  camera_blocked:  "Cámara bloqueada",
  no_registration: "Sin perfiles registrados",
  ready:           "Sistema listo",
  scanning:        "Analizando rostro…",
  done_success:    "Identidad verificada",
  done_error:      "Verificación fallida",
};

const COLORS: Record<AppState, string> = {
  loading_models:  "#00ffff",
  camera_starting: "#00ffff",
  camera_blocked:  "#ff003c",
  no_registration: "#ffaa00",
  ready:           "#00ff88",
  scanning:        "#00ffff",
  done_success:    "#00ff88",
  done_error:      "#ff003c",
};

export default function FaceCam({ onResult }: FaceCamProps) {
  const videoRef  = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [appState,   setAppState]   = useState<AppState>("loading_models");
  const [modelProgress, setModelProgress] = useState(0);
  const [profiles,   setProfiles]   = useState<FaceProfile[]>([]);
  const [scanDots,   setScanDots]   = useState("");
  const [showProfiles, setShowProfiles] = useState(false);

  // ── Puntos animados ───────────────────────────────────────────────────────
  useEffect(() => {
    if (appState !== "scanning") return;
    let n = 0;
    const iv = setInterval(() => { n = (n + 1) % 4; setScanDots(".".repeat(n)); }, 400);
    return () => clearInterval(iv);
  }, [appState]);

  // ── Flujo principal ───────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setModelProgress(5);
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        if (cancelled) return;
        setModelProgress(40);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        if (cancelled) return;
        setModelProgress(75);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        if (cancelled) return;
        setModelProgress(100);
        await new Promise((r) => setTimeout(r, 350));
        if (cancelled) return;
      } catch (err) {
        console.error("Error modelos:", err);
        if (!cancelled) setAppState("camera_blocked");
        return;
      }

      setAppState("camera_starting");
      if (cancelled) return;

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
      } catch (err) {
        console.error("Error cámara:", err);
        if (!cancelled) setAppState("camera_blocked");
        return;
      }

      if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video || cancelled) return;
      video.srcObject = stream;
      try { await video.play(); } catch (err) { console.error("Error play:", err); }
      if (cancelled) return;

      const stored = loadProfiles();
      setProfiles(stored);
      setAppState(stored.length > 0 ? "ready" : "no_registration");
    }

    init();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // ── Capturar frame ────────────────────────────────────────────────────────
  async function captureFrame(): Promise<HTMLCanvasElement | null> {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return null;
    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);
    return canvas;
  }

  // ── Registrar nueva cara ──────────────────────────────────────────────────
  async function registerFace() {
    const canvas = await captureFrame();
    if (!canvas) return;

    setAppState("scanning");
    await new Promise((r) => setTimeout(r, 1400));

    const detection = await faceapi
      .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      // No detectó cara, volver al estado anterior
      setAppState(profiles.length > 0 ? "ready" : "no_registration");
      return;
    }

    const current = loadProfiles();
    const nextNum  = current.length + 1;
    const newProfile: FaceProfile = {
      id:         `face_profile_${Date.now()}`,
      label:      `Registro ${nextNum}`,
      descriptor: Array.from(detection.descriptor),
    };

    const updated = [...current, newProfile];
    saveProfiles(updated);
    setProfiles(updated);
    setAppState("ready");
  }

  // ── Login: comparar contra todos los perfiles ─────────────────────────────
  async function loginWithFace() {
    const canvas = await captureFrame();
    if (!canvas) return;

    const current = loadProfiles();
    if (current.length === 0) { setAppState("no_registration"); return; }

    setAppState("scanning");
    await new Promise((r) => setTimeout(r, 1400));

    const detection = await faceapi
      .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      setAppState("done_error");
      setTimeout(() => onResult(false, 1.0), 600);
      return;
    }

    const descriptor = Array.from(detection.descriptor);

    // Buscar el perfil más cercano
    let bestMatch: FaceProfile | null = null;
    let bestDist = Infinity;

    for (const profile of current) {
      const d = euclideanDistance(profile.descriptor, descriptor);
      if (d < bestDist) { bestDist = d; bestMatch = profile; }
    }

    const ok = bestDist < THRESHOLD;
    setAppState(ok ? "done_success" : "done_error");
    setTimeout(() => onResult(ok, bestDist, ok ? bestMatch?.label : undefined), 700);
  }

  // ── Borrar un perfil ──────────────────────────────────────────────────────
  function deleteProfile(id: string) {
    const updated = profiles.filter((p) => p.id !== id);
    // Re-numerar labels
    const renumbered = updated.map((p, i) => ({ ...p, label: `Registro ${i + 1}` }));
    saveProfiles(renumbered);
    setProfiles(renumbered);
    if (renumbered.length === 0) setAppState("no_registration");
  }

  function deleteAllProfiles() {
    saveProfiles([]);
    setProfiles([]);
    setAppState("no_registration");
    setShowProfiles(false);
  }

  // ── Derivados ─────────────────────────────────────────────────────────────
  const accent     = COLORS[appState];
  const isLoading  = appState === "loading_models" || appState === "camera_starting";
  const showCam    = !isLoading && appState !== "camera_blocked";
  const isScanning = appState === "scanning";
  const overlayState =
    isScanning                    ? "scanning"
    : appState === "done_success" ? "success"
    : appState === "done_error"   ? "error"
    : "idle";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, width: "100%", maxWidth: 560, fontFamily: "'Courier New', monospace" }}>

      {/* Badge estado */}
      <Badge style={{
        background: "transparent", border: `1px solid ${accent}`, color: accent,
        fontSize: 10, letterSpacing: "0.25em", padding: "3px 14px",
        textTransform: "uppercase", fontFamily: "'Courier New', monospace",
        boxShadow: `0 0 10px ${accent}44`, transition: "all 0.3s ease",
      }}>
        {isScanning ? `ESCANEANDO${scanDots}` : LABELS[appState]}
      </Badge>

      {/* ── Panel carga ── */}
      {isLoading && (
        <Card style={{ background: "rgba(2,0,16,0.85)", border: "1px solid rgba(0,255,255,0.2)", borderRadius: 12, width: "100%", backdropFilter: "blur(16px)" }}>
          <CardContent style={{ padding: "32px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <Loader2 size={18} style={{ color: "#00ffff", animation: "spin 1s linear infinite", flexShrink: 0 }} />
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, letterSpacing: "0.05em" }}>
                {appState === "loading_models" ? "Cargando núcleo biométrico…" : "Iniciando cámara…"}
              </span>
            </div>
            <Progress value={appState === "camera_starting" ? 100 : modelProgress} style={{ height: 4, background: "rgba(255,255,255,0.08)" }} className="[&>div]:bg-cyan-400 [&>div]:shadow-[0_0_8px_#00ffff]" />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>
              <span>{appState === "loading_models" ? "INICIALIZANDO MODELOS" : "ABRIENDO DISPOSITIVO"}</span>
              <span style={{ color: "#00ffff" }}>{appState === "camera_starting" ? "100%" : `${modelProgress}%`}</span>
            </div>
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "TINY_FACE_DETECTOR",   done: modelProgress >= 33 },
                { label: "FACE_LANDMARK_68",      done: modelProgress >= 66 },
                { label: "FACE_RECOGNITION_NET",  done: modelProgress >= 99 },
              ].map(({ label, done }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, opacity: done ? 1 : 0.3, transition: "opacity 0.4s" }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: done ? "#00ff88" : "#00ffff", flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: "0.1em", flex: 1 }}>{label}</span>
                  <span style={{ fontSize: 10, color: done ? "#00ff88" : "rgba(255,255,255,0.2)" }}>{done ? "OK" : "···"}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Cámara bloqueada ── */}
      {appState === "camera_blocked" && (
        <Alert style={{ background: "rgba(255,0,60,0.08)", border: "1px solid rgba(255,0,60,0.4)", borderRadius: 12, width: "100%" }}>
          <AlertTriangle size={15} style={{ color: "#ff003c" }} />
          <AlertDescription style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginLeft: 8 }}>
            <strong style={{ color: "#ff003c", display: "block", marginBottom: 6 }}>Sin acceso a cámara</strong>
            Revisa los permisos en la barra del navegador y recarga la página.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Vista cámara — SIEMPRE en DOM ── */}
      <Card style={{
        background: "rgba(2,0,16,0.85)", border: `1px solid ${accent}44`,
        borderRadius: 12, width: "100%", backdropFilter: "blur(16px)",
        overflow: "hidden", boxShadow: `0 0 30px ${accent}22`,
        transition: "border-color 0.4s, box-shadow 0.4s",
        display: showCam ? "block" : "none",
      }}>
        <CardContent style={{ padding: 0, position: "relative" }}>
          <video ref={videoRef} playsInline muted style={{ width: "100%", display: "block", borderRadius: 12, filter: isScanning ? "brightness(1.05) contrast(1.1)" : "none", transition: "filter 0.3s" }} />
          <ScanOverlay state={overlayState} />
          <div style={{ position: "absolute", top: 12, left: 14, fontSize: 9, letterSpacing: "0.2em", color: accent, opacity: 0.6 }}>CAM_01 ● LIVE</div>
        </CardContent>
      </Card>

      {/* ── Sin registro ── */}
      {appState === "no_registration" && (
        <Alert style={{ background: "rgba(255,170,0,0.06)", border: "1px solid rgba(255,170,0,0.35)", borderRadius: 10, width: "100%" }}>
          <AlertTriangle size={14} style={{ color: "#ffaa00" }} />
          <AlertDescription style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginLeft: 8 }}>
            No hay perfiles registrados. Registra al menos una cara para poder identificarte.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Lista de perfiles registrados ── */}
      {showCam && profiles.length > 0 && (
        <div style={{ width: "100%" }}>
          <button
            onClick={() => setShowProfiles(!showProfiles)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: "0.1em", marginBottom: showProfiles ? 10 : 0, padding: 0, fontFamily: "'Courier New', monospace" }}
          >
            <Users size={13} />
            {profiles.length} PERFIL{profiles.length !== 1 ? "ES" : ""} REGISTRADO{profiles.length !== 1 ? "S" : ""}
            <span style={{ marginLeft: 4 }}>{showProfiles ? "▲" : "▼"}</span>
          </button>

          {showProfiles && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {profiles.map((p) => (
                <div key={p.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8, padding: "8px 12px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ff88" }} />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em" }}>{p.label}</span>
                  </div>
                  <button
                    onClick={() => deleteProfile(p.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,0,60,0.5)", padding: 4, display: "flex", alignItems: "center" }}
                    title="Eliminar perfil"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button
                onClick={deleteAllProfiles}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,0,60,0.4)", fontSize: 10, letterSpacing: "0.1em", textAlign: "right", padding: "4px 0", fontFamily: "'Courier New', monospace" }}
              >
                BORRAR TODOS
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Botones ── */}
      {showCam && !isScanning && appState !== "done_success" && appState !== "done_error" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>

          {/* Identificar — solo si hay perfiles */}
          {profiles.length > 0 && (
            <Button onClick={loginWithFace} style={{
              background: "transparent", border: "1px solid #00ffff", color: "#00ffff",
              fontFamily: "'Courier New', monospace", letterSpacing: "0.15em",
              fontSize: 12, padding: "12px 0", cursor: "pointer", width: "100%",
              boxShadow: "0 0 20px rgba(0,255,255,0.12)", transition: "all 0.2s",
            }}>
              <ScanFace size={15} style={{ marginRight: 9 }} />
              INICIAR IDENTIFICACIÓN
            </Button>
          )}

          {/* Registrar siempre disponible */}
          <Button onClick={registerFace} style={{
            background: "transparent",
            border: `1px solid ${profiles.length === 0 ? "#ffaa00" : "rgba(255,170,0,0.4)"}`,
            color: profiles.length === 0 ? "#ffaa00" : "rgba(255,170,0,0.6)",
            fontFamily: "'Courier New', monospace", letterSpacing: "0.15em",
            fontSize: 12, padding: "12px 0", cursor: "pointer", width: "100%",
            transition: "all 0.2s",
          }}>
            <Camera size={15} style={{ marginRight: 9 }} />
            {profiles.length === 0 ? "REGISTRAR ROSTRO" : `AÑADIR REGISTRO ${profiles.length + 1}`}
          </Button>
        </div>
      )}

      {/* ── Escaneando ── */}
      {isScanning && (
        <div style={{ color: "rgba(0,255,255,0.7)", fontSize: 12, letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8 }}>
          <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
          Procesando datos biométricos{scanDots}
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
