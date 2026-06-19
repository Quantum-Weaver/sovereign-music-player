<script lang="ts">
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors } from '$lib/theme/theme';

  const colors = $derived(getThemeColors(themeStore.config));
</script>

<div class="library-page">
  <div class="header">
    <h1 style="color: var(--text);">Library</h1>
    <button class="scan-btn" style="background-color: var(--accent);">
      Scan Library
    </button>
  </div>
  <div class="placeholder" style="color: var(--text-secondary);">
    <span style="font-size: 4rem;">🎵</span>
    <p>Your music library will appear here</p>
  </div>
</div>

<style>
  .library-page {
    padding: 2rem;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  h1 {
    font-size: 1.75rem;
    font-weight: 700;
  }
  .scan-btn {
    color: white;
    border: none;
    padding: 0.5rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 0 20px rgba(108, 92, 231, 0.2);
  }
  .scan-btn:hover {
    box-shadow: 0 0 30px rgba(108, 92, 231, 0.4);
    transform: translateY(-1px);
  }
  .placeholder {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    font-size: 1.1rem;
  }
</style>