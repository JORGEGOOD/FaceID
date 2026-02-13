"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function FogBackground() {
  const vantaRef = useRef<HTMLDivElement | null>(null);
  const [vantaEffect, setVantaEffect] = useState<any>(null);

  useEffect(() => {
    let VANTA: any = null;

    async function loadVanta() {
      if (!vantaEffect && vantaRef.current) {
        // VANTA = (await import("vanta/dist/vanta.fog.min")).default;

        setVantaEffect(
          VANTA({
            el: vantaRef.current,
            THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200,
            minWidth: 200,

            // Paleta Cyberpunk
            highlightColor: 0x00ffff,   // cyan eléctrico
            midtoneColor:   0xff00ff,   // magenta neón
            lowlightColor:  0x7b00ff,   // violeta profundo
            baseColor:      0x020010,   // negro casi puro con tinte azul

            blurFactor: 0.55,
            speed: 1.4,
            zoom: 0.85,
          })
        );
      }
    }

    loadVanta();

    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  return (
    <>
      {/* Capa Vanta */}
      <div
        ref={vantaRef}
        style={{
          width: "100vw",
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: -10,
        }}
      />

      {/* Grid scanline overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -9,
          backgroundImage: `
            linear-gradient(rgba(0,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      {/* Scanline horizontal sweep */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -8,
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
          pointerEvents: "none",
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -7,
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,10,0.85) 100%)",
          pointerEvents: "none",
        }}
      />
    </>
  );
}
