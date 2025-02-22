import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import type { Container } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

const ParticleBackground = () => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      // loadSlim gives you the essentials for a smaller bundle size
      await loadSlim(engine);
      // if you wanted everything, you'd do: await loadFull(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  // Called when particles successfully load
const particlesLoaded = async (container?: Container): Promise<void> => {
  console.log(container, "particles loaded");
};

  // Memoize the options so they don’t re-init on every render
  const options = useMemo(() => ({
    /* The key: fill the screen and put canvas behind everything */
    fullScreen: {
      enable: true,
      zIndex: -1, 
    },
    background: {
      /* This is the dark purple background from tsParticles itself */
      color: { value: "#2c003e" }
    },
    fpsLimit: 120,
    interactivity: {
      events: {
        onClick: {
          enable: true,
          mode: "repulse",
        },
        onHover: {
          enable: true,
          mode: "grab",
        },
      },
      modes: {
        repulse: {
          distance: 200,
          duration: 1,
        },
        grab: {
          distance: 150,
        },
      },
    },
    particles: {
      color: {
        value: "#FFFFFF",
      },
      links: {
        color: "#FFFFFF",
        distance: 150,
        enable: true,
        opacity: 0.3,
        width: 1,
      },
      move: {
        enable: true,
        speed: 1,
        outModes: {
          default: "bounce" as const,
        },
        random: true,
        straight: false,
      },
      number: {
        value: 100,
        density: {
          enable: true,
          area: 800,
        },
      },
      opacity: {
        value: 0.9,
      },
      shape: {
        type: "circle",
      },
      size: {
        value: { min: 1, max: 3 },
      },
    },
    detectRetina: true,
  }), []);

  // Render only after engine is initialized
  if (!init) return null;
  return <Particles id="tsparticles" particlesLoaded={particlesLoaded} options={options} />;
};

export default ParticleBackground;
