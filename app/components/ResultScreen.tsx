"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RotateCcw, UserX, User } from "lucide-react";
import { useEffect, useState } from "react";

interface ResultScreenProps {
  success: boolean;
  distance: number;
  matchedLabel?: string;   // "Registro 1", "Registro 2"...
  totalProfiles: number;   // cuántos registros hay en total
  onRetry: () => void;
  onChangeUser: () => void;
}

const THRESHOLD = 0.55;

function humanDistance(d: number): string {
    if (d < 0.3) return "Eres literalmente la misma persona";
    if (d < 0.45) return "Te pareces lo suficiente, pasa";
    if (d < 0.55) return "Meh… te dejamos entrar pero con desconfianza";
    if (d < 0.7)  return "Pareces tú… pero de muy mal día";
    return "Ni de coña eres tú, impostor";
}

function confidencePercent(d: number): number {
    return Math.round(Math.min(100, Math.max(0, (1 - d / THRESHOLD) * 100)));
}

interface MoodAnalysis { emoji: string; mood: string; roast: string; }

function analyzeMood(distance: number, success: boolean): MoodAnalysis {
  const seed = Math.round(distance * 1000) % 10;

  if (!success) {
    const list: MoodAnalysis[] = [
        { emoji: "💀", mood: "RECHAZADO EXISTENCIAL",     roast: "Ni tu madre te reconocería con esa cara, no jodas." },
        { emoji: "🕵️", mood: "SOSPECHOSO NIVEL FBI",      roast: "¿Te operaste la cara o simplemente te odias?" },
        { emoji: "🥸",  mood: "CARETA DE CLOWN",          roast: "O te pusiste disfraz o te dio un ictus, elige." },
        { emoji: "👻", mood: "FANTASMA DIGITAL",          roast: "El sistema dice: ‘este cabrón no existe’. Y tiene razón." },
        { emoji: "🤡", mood: "HACKEADO POR TU PROPIA CARA", roast: "Hasta tu reflejo te está troleando, asúmelo." },
    ];
    return list[seed % list.length];
  }

  const list: MoodAnalysis[] = [
    { emoji: "😴", mood: "CADÁVER RECIENTE",          roast: "Te verificamos, pero pareces que vienes del tanatorio." },
    { emoji: "😤", mood: "CARA DE MALAS PULGAS",      roast: "Te conocemos, pero esa mala hostia no disimulas ni con filtro." },
    { emoji: "🧍", mood: "ESTATUA DE CEMENTO",        roast: "Ni una puta expresión. ¿Estás vivo o es Deepfake?" },
    { emoji: "😎", mood: "CREÍDO NIVEL DIOS",         roast: "Te abrimos la puerta… pero bájale al ego, gilipollas." },
    { emoji: "🤓", mood: "PROGRAMADOR EN RUTA",       roast: "Cara de ‘me he pasado 14 horas sin cagar’. Te creo." },
    { emoji: "😬", mood: "MIEDO ESCÉNICO TARDÍO",     roast: "Funciona… ¿y ahora te cagas? Tarde, campeón." },
    { emoji: "🥱", mood: "ABURRIMIENTO TERMINAL",     roast: "Tu cara dice: ‘si no reviento ya me piro’. Normal." },
    { emoji: "😏", mood: "SONRISA DE HIJO DE PUTA",   roast: "Te verificamos y encima te ríes como cabrón. Clásico." },
    { emoji: "🫥", mood: "HUMANO EN 144p",            roast: "Te detectamos… pero tu personalidad está en baja resolución." },
    { emoji: "🤨", mood: "DESCONFIANZA CRÓNICA",      roast: "Sí, eres tú. Deja de mirarme como si te fuera a robar el DNI." },
  ];
  return list[seed % list.length];
}

export default function ResultScreen({
  success,
  distance,
  matchedLabel,
  totalProfiles,
  onRetry,
  onChangeUser,
}: ResultScreenProps) {
  const [visible,  setVisible]  = useState(false);
  const [barWidth, setBarWidth] = useState(0);
  const [showMood, setShowMood] = useState(false);

  const confidence  = confidencePercent(distance);
  const accentColor = success ? "#00ff88" : "#ff003c";
  const glowColor   = success ? "rgba(0,255,136,0.25)" : "rgba(255,0,60,0.25)";
  const mood        = analyzeMood(distance, success);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 50);
    const t2 = setTimeout(() => setBarWidth(success ? confidence : Math.round((1 - distance) * 100)), 400);
    const t3 = setTimeout(() => setShowMood(true), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [success, confidence, distance]);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "100vh", padding: "24px",
      fontFamily: "'Courier New', monospace",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(24px)",
      transition: "opacity 0.5s ease, transform 0.5s ease",
    }}>
      <Card style={{
        background: "rgba(2,0,16,0.85)",
        border: `1px solid ${accentColor}`,
        boxShadow: `0 0 40px ${glowColor}, inset 0 0 40px rgba(0,0,0,0.5)`,
        borderRadius: 16, maxWidth: 480, width: "100%",
        backdropFilter: "blur(16px)", overflow: "hidden",
      }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`, boxShadow: `0 0 12px ${accentColor}` }} />

        <CardContent style={{ padding: "32px 28px", textAlign: "center" }}>

          {/* Icono */}
          <div style={{ marginBottom: 16, animation: "iconPop 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.3s both" }}>
            {success
              ? <CheckCircle2 size={64} style={{ color: accentColor, filter: `drop-shadow(0 0 16px ${accentColor})` }} />
              : <XCircle      size={64} style={{ color: accentColor, filter: `drop-shadow(0 0 16px ${accentColor})` }} />
            }
          </div>

          {/* Badge veredicto */}
          <Badge style={{
            background: "transparent", border: `1px solid ${accentColor}`, color: accentColor,
            fontSize: 10, letterSpacing: "0.2em", padding: "3px 14px", marginBottom: 12,
            textTransform: "uppercase", fontFamily: "'Courier New', monospace",
          }}>
            {success ? "ACCESO CONCEDIDO" : "ACCESO DENEGADO"}
          </Badge>

          <h2 style={{ fontSize: 26, fontWeight: 700, color: "#ffffff", marginBottom: 6, letterSpacing: "-0.02em" }}>
            {success ? "Identidad verificada" : "No te reconozco, amigo"}
          </h2>

          {/* ── REGISTRO DETECTADO ── */}
          {success && matchedLabel && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(0,255,136,0.06)",
              border: "1px solid rgba(0,255,136,0.3)",
              borderRadius: 8, padding: "8px 16px", marginBottom: 16, marginTop: 4,
              animation: "fadeIn 0.4s ease 0.5s both",
            }}>
              <User size={14} style={{ color: "#00ff88" }} />
              <span style={{ fontSize: 13, color: "#00ff88", letterSpacing: "0.1em", fontWeight: 600 }}>
                {matchedLabel}
              </span>
              <span style={{ fontSize: 10, color: "rgba(0,255,136,0.5)", letterSpacing: "0.1em" }}>
                · {totalProfiles} perfil{totalProfiles !== 1 ? "es" : ""} en sistema
              </span>
            </div>
          )}

          {!success && (
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              Tu cara no coincide con ninguno de los {totalProfiles} perfil{totalProfiles !== 1 ? "es" : ""} registrado{totalProfiles !== 1 ? "s" : ""}. ¿Te afeitaste o algo?
            </p>
          )}

          {/* ── Diagnóstico burlón ── */}
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, padding: "16px 18px", marginBottom: 20, marginTop: success ? 0 : 4,
            opacity: showMood ? 1 : 0,
            transform: showMood ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
            textAlign: "left",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 26 }}>{mood.emoji}</span>
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 3 }}>
                  DIAGNÓSTICO EMOCIONAL 
                </div>
                <Badge style={{
                  background: "transparent", border: `1px solid ${accentColor}66`, color: accentColor,
                  fontSize: 9, letterSpacing: "0.15em", padding: "1px 8px",
                  fontFamily: "'Courier New', monospace", textTransform: "uppercase",
                }}>
                  {mood.mood}
                </Badge>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
              "{mood.roast}"
            </p>
          </div>

          {/* Barra de confianza */}
          <div style={{ marginBottom: 16, textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              <span>NIVEL DE CONFIANZA</span>
              <span style={{ color: accentColor }}>{success ? `${confidence}%` : `${Math.round((1 - distance) * 100)}%`}</span>
            </div>
            <div style={{ height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${barWidth}%`,
                background: `linear-gradient(90deg, ${accentColor}88, ${accentColor})`,
                boxShadow: `0 0 10px ${accentColor}`, borderRadius: 3,
                transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
              }} />
            </div>
          </div>

          {/* Similitud técnica */}
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8, padding: "10px 14px", marginBottom: 24,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>SIMILITUD BIOMÉTRICA</span>
            <span style={{ fontSize: 12, color: accentColor, fontWeight: 600 }}>{humanDistance(distance)}</span>
          </div>

          {/* Botones */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Button onClick={onRetry} style={{
              background: "transparent", border: `1px solid ${accentColor}`, color: accentColor,
              fontFamily: "'Courier New', monospace", letterSpacing: "0.15em", fontSize: 11,
              padding: "10px 0", cursor: "pointer", width: "100%", transition: "all 0.2s",
            }}>
              <RotateCcw size={13} style={{ marginRight: 8 }} />
              REINTENTAR IDENTIFICACIÓN
            </Button>
            <Button onClick={onChangeUser} style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.4)", fontFamily: "'Courier New', monospace",
              letterSpacing: "0.15em", fontSize: 11, padding: "10px 0",
              cursor: "pointer", width: "100%", transition: "all 0.2s",
            }}>
              <UserX size={13} style={{ marginRight: 8 }} />
              BORRAR TODOS LOS REGISTROS
            </Button>
          </div>
        </CardContent>

        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`, boxShadow: `0 0 12px ${accentColor}` }} />
      </Card>

      <style>{`
        @keyframes iconPop {
          0%   { transform: scale(0) rotate(-10deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg);  opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
