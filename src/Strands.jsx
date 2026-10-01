import React, { useEffect, useRef } from "react";
import "./Strands.css";

function hexToRgb(hex) {
  const clean = hex.replace("#", "");

  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;

  const value = parseInt(full, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function rgbToHsl({ r, g, b }) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h = 0;
  let s = 0;

  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;

    s =
      l > 0.5
        ? d / (2 - max - min)
        : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;

      case g:
        h = (b - r) / d + 2;
        break;

      default:
        h = (r - g) / d + 4;
    }

    h /= 6;
  }

  return { h, s, l };
}

function hslToRgb({ h, s, l }) {
  if (s === 0) {
    const v = Math.round(l * 255);

    return {
      r: v,
      g: v,
      b: v
    };
  }

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;

    if (t < 1 / 6) {
      return p + (q - p) * 6 * t;
    }

    if (t < 1 / 2) {
      return q;
    }

    if (t < 2 / 3) {
      return (
        p +
        (q - p) *
          (2 / 3 - t) *
          6
      );
    }

    return p;
  };

  const q =
    l < 0.5
      ? l * (1 + s)
      : l + s - l * s;

  const p = 2 * l - q;

  return {
    r: Math.round(
      hue2rgb(p, q, h + 1 / 3) * 255
    ),
    g: Math.round(
      hue2rgb(p, q, h) * 255
    ),
    b: Math.round(
      hue2rgb(p, q, h - 1 / 3) * 255
    )
  };
}

function adjustColor(
  hex,
  saturation,
  hueShift
) {
  const hsl =
    rgbToHsl(
      hexToRgb(hex)
    );

  hsl.s = Math.min(
    1,
    Math.max(
      0,
      hsl.s * saturation
    )
  );

  hsl.h =
    (hsl.h + hueShift / 360) % 1;

  if (hsl.h < 0) {
    hsl.h += 1;
  }

  return hslToRgb(hsl);
}

function Strands({
  colors = [
    "#6EA8FF",
    "#7DE3F4",
    "#A98CFF"
  ],

  count = 3,
  speed = 0.5,
  amplitude = 1,
  waviness = 1,
  thickness = 0.7,
  glow = 2.6,
  taper = 3,
  spread = 1,

  hueShift = 0,

  intensity = 0.6,
  saturation = 1.5,
  opacity = 1,
  scale = 1.5,

  glass = false,
  refraction = 1,
  dispersion = 1,
  glassSize = 1,

  className = "",
  style
}) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  /*
   * Keep the latest props available to the
   * animation without restarting it.
   */
  const propsRef = useRef({
    colors,
    count,
    speed,
    amplitude,
    waviness,
    thickness,
    glow,
    taper,
    spread,
    hueShift,
    intensity,
    saturation,
    opacity,
    scale,
    glass,
    refraction,
    dispersion,
    glassSize
  });

  /*
   * Update the ref whenever React receives
   * new values from the parent.
   *
   * The canvas animation itself does NOT restart.
   */
  propsRef.current = {
    colors,
    count,
    speed,
    amplitude,
    waviness,
    thickness,
    glow,
    taper,
    spread,
    hueShift,
    intensity,
    saturation,
    opacity,
    scale,
    glass,
    refraction,
    dispersion,
    glassSize
  };

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const container =
      canvas.parentElement;

    if (!container) return;

    const ctx =
      canvas.getContext("2d");

    if (!ctx) return;

    let width = 0;
    let height = 0;

    const dpr = Math.min(
      window.devicePixelRatio || 1,
      2
    );

    /*
     * --------------------------------------------------
     * RESIZE
     * --------------------------------------------------
     */

    const resize = () => {
      width =
        container.clientWidth;

      height =
        container.clientHeight;

      if (
        width <= 0 ||
        height <= 0
      ) {
        return;
      }

      canvas.width =
        width * dpr;

      canvas.height =
        height * dpr;

      canvas.style.width =
        `${width}px`;

      canvas.style.height =
        `${height}px`;

      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      );
    };

    resize();

    const resizeObserver =
      new ResizeObserver(
        resize
      );

    resizeObserver.observe(
      container
    );

    /*
     * --------------------------------------------------
     * ANIMATION STATE
     * --------------------------------------------------
     *
     * This is intentionally kept outside
     * the React render cycle.
     *
     * Changing country does NOT reset time.
     */

    let time = 0;

    /*
     * --------------------------------------------------
     * DRAW
     * --------------------------------------------------
     */

    const draw = () => {
      /*
       * Always use the latest props.
       *
       * This is what allows:
       *
       * country A
       *     ↓
       * same animation
       *     ↓
       * country B
       *     ↓
       * new speed/color/amplitude/intensity
       */

      const current =
        propsRef.current;

      /*
       * Recalculate the adjusted colors
       * from the CURRENT country.
       */

      const adjustedColors =
        current.colors.map(
          (color) =>
            adjustColor(
              color,
              current.saturation,
              current.hueShift
            )
        );

      /*
       * If the container has no size yet,
       * keep the animation alive.
       */

      if (
        width <= 0 ||
        height <= 0
      ) {
        animationRef.current =
          requestAnimationFrame(
            draw
          );

        return;
      }

      /*
       * Clear previous frame.
       */

      ctx.clearRect(
        0,
        0,
        width,
        height
      );

      /*
       * --------------------------------------------------
       * SETTINGS
       * --------------------------------------------------
       */

      const strandCount =
        Math.max(
          1,
          Math.round(
            current.count
          )
        );

      const centerY =
        height * 0.5;

      /*
       * Overall vertical size.
       */

      const waveHeight =
        height *
        0.28 *
        current.amplitude;

      /*
       * Taper controls how quickly
       * the strands disappear near edges.
       */

      const taperPower =
        Math.max(
          1.5,
          current.taper + 1
        );

      /*
       * --------------------------------------------------
       * CREATE STRAND PATHS
       * --------------------------------------------------
       */

      const paths = [];

      for (
        let i = 0;
        i < strandCount;
        i++
      ) {
        const normalized =
          strandCount === 1
            ? 0
            : i /
              (strandCount - 1);

        /*
         * Spread strands vertically
         * around the central ribbon.
         */

        const strandOffset =
          (normalized - 0.5) *
          waveHeight *
          0.55 *
          current.spread;

        paths.push({
          offset:
            strandOffset,

          phase:
            i * 1.8,

          frequency:
            1.3 +
            i * 0.15
        });
      }

      /*
       * --------------------------------------------------
       * COLOR INTERPOLATION
       * --------------------------------------------------
       */

      const getColor =
        (position) => {
          if (
            adjustedColors.length ===
            1
          ) {
            return adjustedColors[0];
          }

          if (
            adjustedColors.length ===
            0
          ) {
            return {
              r: 255,
              g: 255,
              b: 255
            };
          }

          const scaled =
            position *
            (
              adjustedColors.length -
              1
            );

          const index =
            Math.floor(
              scaled
            );

          const next =
            Math.min(
              index + 1,
              adjustedColors.length -
                1
            );

          const amount =
            scaled - index;

          const a =
            adjustedColors[index];

          const b =
            adjustedColors[next];

          return {
            r:
              a.r +
              (b.r - a.r) *
                amount,

            g:
              a.g +
              (b.g - a.g) *
                amount,

            b:
              a.b +
              (b.b - a.b) *
                amount
          };
        };

      /*
       * --------------------------------------------------
       * DRAW EACH STRAND
       * --------------------------------------------------
       */

      for (
        let i = 0;
        i < paths.length;
        i++
      ) {
        const path =
          paths[i];

        const colorPosition =
          paths.length === 1
            ? 0.5
            : i /
              (paths.length - 1);

        const color =
          getColor(
            colorPosition
          );

        /*
         * Draw one strand with
         * glow layers.
         */

        const drawPath = (
          lineWidth,
          alpha,
          blur
        ) => {
          ctx.save();

          ctx.beginPath();

          ctx.lineCap =
            "round";

          ctx.lineJoin =
            "round";

          ctx.lineWidth =
            lineWidth;

          ctx.globalAlpha =
            alpha;

          ctx.shadowColor =
            `rgb(
              ${color.r},
              ${color.g},
              ${color.b}
            )`;

          ctx.shadowBlur =
            blur;

          /*
           * Gradient following the strand.
           */

          const gradient =
            ctx.createLinearGradient(
              0,
              0,
              width,
              0
            );

          const c1 =
            getColor(
              Math.max(
                0,
                colorPosition -
                  0.18
              )
            );

          const c2 =
            getColor(
              colorPosition
            );

          const c3 =
            getColor(
              Math.min(
                1,
                colorPosition +
                  0.18
              )
            );

          gradient.addColorStop(
            0,
            `rgba(
              ${c1.r},
              ${c1.g},
              ${c1.b},
              0
            )`
          );

          gradient.addColorStop(
            0.15,
            `rgb(
              ${c1.r},
              ${c1.g},
              ${c1.b}
            )`
          );

          gradient.addColorStop(
            0.5,
            `rgb(
              ${c2.r},
              ${c2.g},
              ${c2.b}
            )`
          );

          gradient.addColorStop(
            0.85,
            `rgb(
              ${c3.r},
              ${c3.g},
              ${c3.b}
            )`
          );

          gradient.addColorStop(
            1,
            `rgba(
              ${c3.r},
              ${c3.g},
              ${c3.b},
              0
            )`
          );

          ctx.strokeStyle =
            gradient;

          /*
           * Smooth flowing path.
           */

          const steps = 120;

          for (
            let s = 0;
            s <= steps;
            s++
          ) {
            const x =
              s / steps;

            /*
             * Strong taper toward
             * both edges.
             */

            const edge =
              Math.sin(
                x * Math.PI
              );

            const envelope =
              Math.pow(
                Math.max(
                  0,
                  edge
                ),
                taperPower
              );

            /*
             * Main flowing wave.
             */

            const wave1 =
              Math.sin(
                x *
                  Math.PI *
                  2.0 *
                  current.waviness +
                  time *
                    current.speed +
                  path.phase
              );

            /*
             * Secondary subtle movement.
             */

            const wave2 =
              Math.sin(
                x *
                  Math.PI *
                  4.0 *
                  current.waviness -
                  time *
                    current.speed *
                    0.55 +
                  path.phase *
                    1.7
              );

            /*
             * Combine waves.
             */

            const wave =
              wave1 * 0.72 +
              wave2 * 0.28;

            /*
             * Keep the strands close
             * together around the center.
             */

            const y =
              centerY +
              path.offset *
                envelope +
              wave *
                waveHeight *
                0.48 *
                envelope;

            /*
             * Pull everything toward
             * the center.
             */

            const centerPull =
              Math.pow(
                Math.sin(
                  x * Math.PI
                ),
                1.4
              );

            const finalY =
              centerY +
              (y - centerY) *
                centerPull;

            if (
              s === 0
            ) {
              ctx.moveTo(
                x * width,
                finalY
              );
            } else {
              ctx.lineTo(
                x * width,
                finalY
              );
            }
          }

          ctx.stroke();

          ctx.restore();
        };

        /*
         * --------------------------------------------------
         * OUTER LARGE GLOW
         * --------------------------------------------------
         */

        drawPath(
          current.thickness *
            7 *
            current.scale,

          0.035 *
            current.intensity *
            current.opacity,

          current.glow *
            10
        );

        /*
         * --------------------------------------------------
         * MEDIUM GLOW
         * --------------------------------------------------
         */

        drawPath(
          current.thickness *
            4 *
            current.scale,

          0.07 *
            current.intensity *
            current.opacity,

          current.glow *
            6
        );

        /*
         * --------------------------------------------------
         * SOFT LIGHT
         * --------------------------------------------------
         */

        drawPath(
          current.thickness *
            2.2 *
            current.scale,

          0.16 *
            current.intensity *
            current.opacity,

          current.glow *
            3
        );

        /*
         * --------------------------------------------------
         * MAIN STRAND
         * --------------------------------------------------
         */

        drawPath(
          Math.max(
            1,
            current.thickness *
              1.3 *
              current.scale
          ),

          0.7 *
            current.intensity *
            current.opacity,

          current.glow
        );
      }

      /*
       * --------------------------------------------------
       * CENTRAL LIGHT BLOOM
       * --------------------------------------------------
       */

      const bloom =
        ctx.createRadialGradient(
          width * 0.5,
          centerY,
          0,
          width * 0.5,
          centerY,
          width * 0.34
        );

      const middleColor =
        getColor(0.5);

      bloom.addColorStop(
        0,
        `rgba(
          ${middleColor.r},
          ${middleColor.g},
          ${middleColor.b},
          ${0.10 *
            current.intensity}
        )`
      );

      bloom.addColorStop(
        0.35,
        `rgba(
          ${middleColor.r},
          ${middleColor.g},
          ${middleColor.b},
          ${0.035 *
            current.intensity}
        )`
      );

      bloom.addColorStop(
        1,
        "rgba(0,0,0,0)"
      );

      ctx.save();

      ctx.globalCompositeOperation =
        "screen";

      ctx.fillStyle =
        bloom;

      ctx.fillRect(
        0,
        0,
        width,
        height
      );

      ctx.restore();

      /*
       * --------------------------------------------------
       * CONTINUE ANIMATION
       * --------------------------------------------------
       *
       * IMPORTANT:
       * We do NOT reset time when the
       * country changes.
       *
       * Only speed changes.
       */

      time +=
        0.016 *
        current.speed;

      animationRef.current =
        requestAnimationFrame(
          draw
        );
    };

    /*
     * Start ONE animation loop.
     */

    animationRef.current =
      requestAnimationFrame(
        draw
      );

    /*
     * --------------------------------------------------
     * CLEANUP
     * --------------------------------------------------
     */

    return () => {
      resizeObserver.disconnect();

      if (
        animationRef.current
      ) {
        cancelAnimationFrame(
          animationRef.current
        );
      }
    };
  }, []);

  return (
    <div
      className={`strands-container ${className}`}
      style={style}
    >
      <canvas
        ref={canvasRef}
      />
    </div>
  );
}

export default React.memo(
  Strands
);