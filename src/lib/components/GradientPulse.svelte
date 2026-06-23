<script lang="ts">
  import type { Snippet } from 'svelte';

  let { color, pulse, children }: {
    color: string;
    pulse: boolean;
    children: Snippet;
  } = $props();
</script>

<div class="gradient-pulse" style="--gp-color: {color}">
  <div class="glow" class:animating={pulse}></div>
  {@render children()}
</div>

<style>
  .gradient-pulse {
    position: relative;
    display: contents;
  }

  /* We need a wrapper element so display:contents propagates the child */
  .gradient-pulse > :global(*:not(.glow)) {
    position: relative;
    z-index: 1;
  }

  .glow {
    position: absolute;
    inset: -30px;
    border-radius: 50%;
    background: radial-gradient(
      ellipse at center,
      color-mix(in srgb, var(--gp-color) 40%, transparent) 0%,
      transparent 70%
    );
    pointer-events: none;
    z-index: 0;
    opacity: 0.6;
  }

  .glow.animating {
    animation: gp-breathe 2.5s ease-in-out infinite;
  }

  @keyframes gp-breathe {
    0%, 100% { opacity: 0.55; transform: scale(1); }
    50%       { opacity: 1;    transform: scale(1.08); }
  }

  @media (prefers-reduced-motion: reduce) {
    .glow.animating { animation: none; }
  }
</style>
