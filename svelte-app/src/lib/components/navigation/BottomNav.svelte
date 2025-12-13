<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { useHaptics, ImpactStyle } from '$lib/plugins/platform';

  const { impact } = useHaptics();

  // Navigation items - reduced to 5 for better UX
  const navItems = [
    { href: '/', label: 'Browse', id: 'browse' },
    { href: '/favorites', label: 'Favorites', id: 'favorites' },
    { href: '/library', label: 'Library', id: 'library' },
    { href: '/downloads', label: 'Downloads', id: 'downloads' },
    { href: '/settings', label: 'Settings', id: 'settings' }
  ];

  function isActive(href: string, currentPath: string): boolean {
    if (href === '/') return currentPath === '/';
    return currentPath.startsWith(href);
  }

  async function handleNavClick(href: string) {
    await impact(ImpactStyle.Light);
    goto(href);
  }
</script>

<nav class="bottom-nav fixed bottom-0 left-0 right-0 z-50 safe-bottom">
  <div class="nav-container">
    {#each navItems as item}
      {@const active = isActive(item.href, $page.url.pathname)}
      <button
        type="button"
        class="nav-item"
        class:active
        onclick={() => handleNavClick(item.href)}
      >
        <div class="nav-icon">
          {#if item.id === 'browse'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
            </svg>
          {:else if item.id === 'favorites'}
            <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          {:else if item.id === 'library'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          {:else if item.id === 'downloads'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          {:else if item.id === 'settings'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          {/if}
        </div>
        <span class="nav-label">{item.label}</span>
      </button>
    {/each}
  </div>
</nav>

<style>
  .bottom-nav {
    background: rgba(10, 10, 10, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: env(safe-area-inset-bottom);
  }

  .nav-container {
    display: flex;
    justify-content: space-around;
    align-items: center;
    height: 56px;
    max-width: 500px;
    margin: 0 auto;
  }

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 6px 12px;
    color: #71717a;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: color 0.2s;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .nav-item.active {
    color: #dc2626;
  }

  .nav-icon {
    width: 24px;
    height: 24px;
  }

  .nav-icon svg {
    width: 100%;
    height: 100%;
  }

  .nav-label {
    font-size: 10px;
    font-weight: 500;
    line-height: 1;
  }
</style>
