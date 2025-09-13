// components/Confetti.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadConfettiPreset } from "@tsparticles/preset-confetti";

export default function Confetti() {
  const [init, setInit] = useState(false);

  // initialize the confetti preset
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadConfettiPreset(engine);
      setInit(true);
    });
  }, []);

  // memoized options for performance
  const options = useMemo(
    () => ({
      preset: "confetti",
      fullScreen: { enable: true },
      particles: {
        number: { value: 200 },
        color: {
          value: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"]
        },
        shape: {
          type: "circle"
        },
        size: {
          value: { min: 2, max: 8 }
        },
        move: {
          enable: true,
          speed: 1,
          direction: "bottom" as const,
          random: true,
          straight: false,
          outModes: {
            default: "destroy" as const
          }
        }
      }
    }),
    []
  );

  if (init) {
    return (
      <Particles
        id="tsparticles"
        options={options}
        style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 100000, pointerEvents: "none" }}
      />
    );
  }

  return <></>;
}
