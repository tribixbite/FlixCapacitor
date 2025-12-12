<script lang="ts">
  import { Navbar, NavbarBackLink, Link } from 'konsta/svelte';
  import { page } from '$app/stores';
  import { useHaptics, ImpactStyle } from '$lib/plugins/platform';
  import { uiStore } from '$lib/stores/ui.store';

  let {
    title = '',
    showBack = false,
    showSearch = true,
    transparent = false,
    rightSlot
  } = $props<{
    title?: string;
    showBack?: boolean;
    showSearch?: boolean;
    transparent?: boolean;
    rightSlot?: import('svelte').Snippet;
  }>();

  const { impact } = useHaptics();

  // Derive title from route if not provided
  let displayTitle = $derived(() => {
    if (title) return title;

    const pathname = $page.url.pathname;
    const routeTitles: Record<string, string> = {
      '/': 'Browse',
      '/movies': 'Movies',
      '/shows': 'TV Shows',
      '/anime': 'Anime',
      '/favorites': 'Favorites',
      '/library': 'Library',
      '/downloads': 'Downloads',
      '/collections': 'Collections',
      '/settings': 'Settings'
    };

    return routeTitles[pathname] || 'FlixCapacitor';
  });

  async function handleBack() {
    await impact(ImpactStyle.Light);
    history.back();
  }

  async function handleSearchClick() {
    await impact(ImpactStyle.Light);
    uiStore.toggleSearch();
  }
</script>

<Navbar
  title={displayTitle()}
  class="fixed top-0 left-0 right-0 z-40 safe-top"
  transparent={transparent}
  bgClass={transparent ? '' : 'bg-black/95 backdrop-blur-xl'}
  innerClass="!px-4"
>
  {#if showBack}
    <NavbarBackLink slot="left" onClick={handleBack} />
  {/if}

  <div slot="right" class="flex items-center gap-2">
    {#if showSearch}
      <Link
        navbar
        onClick={handleSearchClick}
        class="!text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </Link>
    {/if}
    {#if rightSlot}
      {@render rightSlot()}
    {/if}
  </div>
</Navbar>

<style>
  :global(.k-navbar) {
    --k-navbar-bg-ios: transparent;
    --k-navbar-bg-material: transparent;
  }

  :global(.k-navbar-title) {
    color: white;
    font-weight: 600;
  }

  :global(.k-navbar-back-link) {
    color: white;
  }
</style>
