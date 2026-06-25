<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  let {
    remainingSecs,
    totalSecs,
    mode,
  }: {
    remainingSecs: number;
    totalSecs: number;
    mode: 'sand' | 'breathing' | 'dissolve' | 'numeric';
  } = $props();

  // Canvas refs
  let sandCanvas = $state<HTMLCanvasElement | null>(null);
  let dissolveCanvas = $state<HTMLCanvasElement | null>(null);

  let mounted = false;
  let rafId = 0;

  // Derived progress: 0 = just started, 1 = finished
  const progress = $derived(totalSecs > 0 ? 1 - remainingSecs / totalSecs : 0);

  // Format MM:SS
  function fmt(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SAND HOURGLASS
  // ─────────────────────────────────────────────────────────────────────────
  const PARTICLE_COUNT = 180;

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
    color: string;
    settled: boolean;
    settleY: number;
  }

  const SAND_COLORS = ['#6C5CE7', '#FDCB6E', '#0984E3', '#E17055', '#A29BFE', '#55EFC4'];
  let particles: Particle[] = [];
  let sandInitialized = false;

  function initSand(w: number, h: number) {
    particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (w * 0.18);
      return {
        x: w / 2 + Math.cos(angle) * dist,
        y: h * 0.18 + Math.random() * h * 0.25,
        vx: (Math.random() - 0.5) * 0.4,
        vy: 0,
        r: 2 + Math.random() * 2.5,
        color: SAND_COLORS[i % SAND_COLORS.length],
        settled: false,
        settleY: 0,
      };
    });
    sandInitialized = true;
  }

  function drawSand(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const topCy = h * 0.28;
    const botCy = h * 0.72;
    const rx = w * 0.28;
    const ry = h * 0.24;
    const neckY = h * 0.5;
    const neckHalf = h * 0.04;

    // Glass outline
    ctx.save();
    ctx.strokeStyle = 'rgba(108,92,231,0.5)';
    ctx.lineWidth = 2;

    // Top chamber (ellipse approximated as bezier)
    ctx.beginPath();
    ctx.ellipse(cx, topCy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Bottom chamber
    ctx.beginPath();
    ctx.ellipse(cx, botCy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Neck lines
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.04, neckY - neckHalf);
    ctx.lineTo(cx + w * 0.04, neckY - neckHalf);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.04, neckY + neckHalf);
    ctx.lineTo(cx + w * 0.04, neckY + neckHalf);
    ctx.stroke();
    ctx.restore();

    // How many particles have "fallen" to the bottom based on progress
    const fallenCount = Math.floor(progress * PARTICLE_COUNT);
    const neckX = cx;
    const neckTopY = neckY - neckHalf;
    const neckBotY = neckY + neckHalf;

    particles.forEach((p, i) => {
      const shouldFall = i < fallenCount;

      if (shouldFall) {
        // Animate falling through neck
        if (!p.settled) {
          if (p.y < neckTopY) {
            // Funnel toward center
            p.vx += (neckX - p.x) * 0.04;
            p.vy += 0.35;
            p.vx *= 0.88;
            p.x += p.vx;
            p.y += p.vy;
          } else if (p.y < neckBotY) {
            // Through neck
            p.vy += 0.5;
            p.x += p.vx * 0.2;
            p.y += p.vy;
          } else {
            // Spread in bottom chamber
            p.vx += (Math.random() - 0.5) * 0.5;
            p.vy -= 0.1; // slight buoyancy when piling
            p.vx *= 0.85;
            p.vy *= 0.80;
            p.x += p.vx;
            p.y += p.vy;

            const distFromCenterBot = Math.sqrt((p.x - cx) ** 2 + (p.y - botCy) ** 2);
            const pile = botCy + ry * 0.6 - (fallenCount / PARTICLE_COUNT) * ry * 0.55;
            if (p.y > pile || distFromCenterBot > rx * 0.85) {
              p.settled = true;
              p.settleY = Math.min(p.y, pile);
              p.y = p.settleY;
            }
          }
        }
      }

      // Draw
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + (p.settled ? 'cc' : 'ff');
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.settled ? 0 : 4;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Falling stream from neck
    if (fallenCount > 0 && fallenCount < PARTICLE_COUNT) {
      const streamAlpha = 0.6 + Math.sin(Date.now() / 80) * 0.3;
      ctx.beginPath();
      ctx.moveTo(cx, neckTopY);
      ctx.lineTo(cx, neckBotY + h * 0.05);
      ctx.strokeStyle = `rgba(108,92,231,${streamAlpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function sandLoop() {
    if (!mounted || !sandCanvas) return;
    const ctx = sandCanvas.getContext('2d');
    if (!ctx) return;
    const w = sandCanvas.width;
    const h = sandCanvas.height;
    if (!sandInitialized) initSand(w, h);
    drawSand(ctx, w, h);
    rafId = requestAnimationFrame(sandLoop);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DISSOLVING MANDALA
  // ─────────────────────────────────────────────────────────────────────────
  let dissolveInitialized = false;
  let dissolvePixels: Uint8ClampedArray | null = null;
  let dissolveOrder: number[] = [];
  let dissolveImgData: ImageData | null = null;

  const MANDALA_COLORS = [
    [108, 92, 231],   // quantum.purple
    [9, 132, 227],    // cosmic.blue
    [253, 203, 110],  // hearth.gold
    [225, 112, 85],   // fire.base
    [162, 155, 254],  // purple light
    [85, 239, 196],   // mint
  ];

  function mandalaPixelColor(cx: number, cy: number, px: number, py: number, size: number): [number, number, number, number] {
    const dx = px - cx;
    const dy = py - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxR = size * 0.46;

    if (dist > maxR) return [0, 0, 0, 0]; // transparent outside

    const angle = (Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2);
    const arms = 6;
    const armAngle = (angle % (Math.PI * 2 / arms)) / (Math.PI * 2 / arms);
    const mirror = armAngle < 0.5 ? armAngle * 2 : (1 - armAngle) * 2;

    // Rings
    const rings = 5;
    const ring = Math.floor((dist / maxR) * rings);
    const ringFrac = (dist / maxR) * rings - ring;

    // Pattern value
    const wave = Math.sin(mirror * Math.PI * 3 + ring * 0.8) * 0.5 + 0.5;
    const spoke = Math.pow(Math.sin(mirror * Math.PI), 2);
    const combined = wave * 0.6 + spoke * 0.4;

    const colorIdx = (ring + Math.floor(mirror * 2)) % MANDALA_COLORS.length;
    const [r, g, b] = MANDALA_COLORS[colorIdx];

    const brightness = 0.4 + combined * 0.6;
    const fade = 1 - Math.pow(dist / maxR, 2.5) * 0.4;
    const alpha = Math.round(255 * fade * (0.7 + combined * 0.3));

    return [Math.round(r * brightness), Math.round(g * brightness), Math.round(b * brightness), alpha];
  }

  function buildMandala(w: number, h: number) {
    const cx = w / 2;
    const cy = h / 2;
    const size = Math.min(w, h);
    const imgData = new ImageData(w, h);
    const d = imgData.data;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const [r, g, b, a] = mandalaPixelColor(cx, cy, x, y, size);
        const idx = (y * w + x) * 4;
        d[idx] = r;
        d[idx + 1] = g;
        d[idx + 2] = b;
        d[idx + 3] = a;
      }
    }

    // Shuffle pixel indices for random dissolve order
    const total = w * h;
    const order = Array.from({ length: total }, (_, i) => i);
    for (let i = total - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    dissolveImgData = imgData;
    dissolvePixels = new Uint8ClampedArray(d);
    dissolveOrder = order;
    dissolveInitialized = true;
  }

  function drawDissolve(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (!dissolveImgData || !dissolvePixels) return;

    // Restore full mandala first
    const d = dissolveImgData.data;
    for (let i = 0; i < dissolvePixels.length; i++) {
      d[i] = dissolvePixels[i];
    }

    // Erase pixels proportional to progress
    const eraseCount = Math.floor(progress * dissolveOrder.length);
    for (let i = 0; i < eraseCount; i++) {
      const pixelIdx = dissolveOrder[i] * 4;
      d[pixelIdx + 3] = 0;
    }

    ctx.clearRect(0, 0, w, h);
    ctx.putImageData(dissolveImgData, 0, 0);
  }

  function dissolveLoop() {
    if (!mounted || !dissolveCanvas) return;
    const ctx = dissolveCanvas.getContext('2d');
    if (!ctx) return;
    const w = dissolveCanvas.width;
    const h = dissolveCanvas.height;
    if (!dissolveInitialized) buildMandala(w, h);
    drawDissolve(ctx, w, h);
    rafId = requestAnimationFrame(dissolveLoop);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Breathing circle uses pure SVG/CSS — no canvas needed
  // ─────────────────────────────────────────────────────────────────────────

  // Breathing cycle: expands/contracts ~5s, slows near end
  const breathCycleSecs = $derived(() => {
    const speed = 1 - progress * 0.5; // slows to 0.5x at end
    return 5 / speed;
  });

  // Color: warm gold→cool blue as time runs out
  const breathColor = $derived(() => {
    const r = Math.round(108 + (9 - 108) * progress);
    const g = Math.round(92 + (132 - 92) * progress);
    const b = Math.round(231 + (227 - 231) * progress);
    return `rgb(${r},${g},${b})`;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────────────────────────────
  onMount(() => {
    mounted = true;
    startLoop();
  });

  onDestroy(() => {
    mounted = false;
    cancelAnimationFrame(rafId);
  });

  function startLoop() {
    cancelAnimationFrame(rafId);
    if (mode === 'sand' && sandCanvas) sandLoop();
    else if (mode === 'dissolve' && dissolveCanvas) dissolveLoop();
  }

  $effect(() => {
    // Re-init dissolve if mode switches to dissolve (canvas may have changed)
    if (mode === 'dissolve') {
      dissolveInitialized = false;
    }
    if (mode === 'sand') {
      sandInitialized = false;
    }
    if (mounted) startLoop();
  });

  // Bind canvas refs after mount via $effect
  $effect(() => {
    if (sandCanvas && mode === 'sand' && mounted) {
      sandInitialized = false;
      startLoop();
    }
  });
  $effect(() => {
    if (dissolveCanvas && mode === 'dissolve' && mounted) {
      dissolveInitialized = false;
      startLoop();
    }
  });
</script>

{#if mode === 'numeric'}
  <div class="numeric">
    <span class="num-time">{fmt(remainingSecs)}</span>
    <div class="num-arc-wrap">
      <svg viewBox="0 0 120 120" class="num-arc">
        <circle class="arc-bg" cx="60" cy="60" r="52" />
        <circle
          class="arc-fg"
          cx="60" cy="60" r="52"
          stroke-dasharray="{2 * Math.PI * 52}"
          stroke-dashoffset="{2 * Math.PI * 52 * progress}"
        />
      </svg>
    </div>
  </div>

{:else if mode === 'breathing'}
  <div class="breathing">
    <div
      class="breath-outer"
      style="animation-duration: {breathCycleSecs()}s; --bc: {breathColor()}"
    >
      <div class="breath-inner" style="animation-duration: {breathCycleSecs()}s; --bc: {breathColor()}">
        <span class="breath-time">{fmt(remainingSecs)}</span>
      </div>
    </div>
    <p class="breath-hint">Breathe with the circle</p>
  </div>

{:else if mode === 'sand'}
  <canvas
    bind:this={sandCanvas}
    width="280"
    height="320"
    class="vis-canvas"
  ></canvas>

{:else if mode === 'dissolve'}
  <canvas
    bind:this={dissolveCanvas}
    width="300"
    height="300"
    class="vis-canvas"
  ></canvas>
{/if}

<style>
  /* ── Numeric ── */
  .numeric {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .num-time {
    font-size: 3.5rem;
    font-weight: 700;
    color: var(--accent);
    letter-spacing: 0.05em;
    font-variant-numeric: tabular-nums;
  }

  .num-arc-wrap {
    width: 120px;
    height: 120px;
  }

  .num-arc {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .arc-bg {
    fill: none;
    stroke: rgba(108, 92, 231, 0.15);
    stroke-width: 6;
  }

  .arc-fg {
    fill: none;
    stroke: var(--accent);
    stroke-width: 6;
    stroke-linecap: round;
    transition: stroke-dashoffset 1s linear;
  }

  /* ── Breathing ── */
  .breathing {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  .breath-outer {
    width: 220px;
    height: 220px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle, color-mix(in srgb, var(--bc) 20%, transparent), transparent 70%);
    box-shadow: 0 0 40px color-mix(in srgb, var(--bc) 35%, transparent);
    animation: breathe linear infinite alternate;
  }

  .breath-inner {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle, color-mix(in srgb, var(--bc) 30%, transparent), transparent 80%);
    border: 2px solid color-mix(in srgb, var(--bc) 60%, transparent);
    animation: breathe linear infinite alternate;
    animation-delay: calc(var(--d, 0s) * -0.3);
  }

  .breath-time {
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--text);
    font-variant-numeric: tabular-nums;
  }

  .breath-hint {
    font-size: 0.85rem;
    color: var(--text-secondary, #b2bec3);
    letter-spacing: 0.08em;
  }

  @keyframes breathe {
    from { transform: scale(0.82); }
    to   { transform: scale(1.12); }
  }

  /* ── Canvas modes ── */
  .vis-canvas {
    display: block;
    border-radius: 12px;
  }
</style>
