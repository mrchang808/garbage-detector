import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import type { Container, ISourceOptions, MoveDirection } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

const ParticleBackground = () => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = async (container?: Container): Promise<void> => {
    console.log(container, "particles loaded");
  };

  const options: ISourceOptions = useMemo(() => ({
    fullScreen: {
      enable: true,
      zIndex: -1,
    },
    background: {
      color: { value: "#1a1a1a" },
    },
    fpsLimit: 120,
    interactivity: {
      events: {
        onClick: {
          enable: true,
          mode: "push",
        },
        onHover: {
          enable: true,
          mode: "grab",
        },
      },
      modes: {
        push: {
          quantity: 4,
        },
        grab: {
          distance: 150,
          links: {
            opacity: 0.5
          }
        },
      },
    },
    particles: {
      color: {
        value: ["#E8C74D", "#A3DADC", "#FFFFFF"],
      },
      links: {
        color: "#4a4a4a",
        distance: 150,
        enable: true,
        opacity: 0.3,
        width: 1,
      },
      move: {
        direction: "none" as MoveDirection,
        enable: true,
        outModes: {
          default: "bounce",
        },
        random: false,
        speed: 0.8,
        straight: false,
      },
      number: {
        value: 80,
        density: {
          enable: true,
          area: 800,
        },
      },
      opacity: {
        value: 0.7,
        random: true,
        animation: {
          enable: true,
          speed: 1,
          minimumValue: 0.1,
          sync: false
        }
      },
      shape: {
        type: "circle",
      },
      size: {
        value: { min: 1, max: 3 },
        random: true,
        animation: {
          enable: true,
          speed: 2,
          minimumValue: 0.1,
          sync: false
        }
      },
    },
    detectRetina: true,
  }), []);

  if (!init) return null;
  return <Particles id="tsparticles" particlesLoaded={particlesLoaded} options={options} />;
};

export default ParticleBackground;
