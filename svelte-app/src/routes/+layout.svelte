<script lang="ts">
  import { onMount } from 'svelte';
  import { App as KonstaApp, Page } from 'konsta/svelte';
  import { App } from '@capacitor/app';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { BottomNav, TopNavbar, SearchBar } from '$components/navigation';
  import { OfflineBanner } from '$components/ui';
  import { settingsStore } from '$stores/settings.store';
  import { watchHistoryStore } from '$stores/watch-history.store';
  import { errorReportingService } from '$services';
  import { platform, useStatusBar } from '$plugins/platform';
  import '../app.css';

  let { children } = $props();

  const { setDark } = useStatusBar();

  // Pages that should hide bottom nav (player, detail views)
  let hideBottomNav = $derived(
    $page.url.pathname.startsWith('/player') ||
    $page.url.pathname.includes('/watch')
  );

  // Pages that need back button
  let showBackButton = $derived(
    $page.url.pathname.split('/').length > 2 ||
    $page.url.pathname.startsWith('/player')
  );

  // Initialize platform-specific settings
  $effect(() => {
    if (platform.isNative) {
      setDark();
    }
  });

  // Load settings and watch history on mount
  $effect(() => {
    settingsStore.load();
    watchHistoryStore.load();
  });

  // Initialize error reporting
  $effect(() => {
    errorReportingService.init();
  });

  // Handle deep links (flixcapacitor://path)
  onMount(() => {
    const handleDeepLink = (url: string) => {
      try {
        // Parse URL: flixcapacitor://path or https://flixcapacitor.app/path
        const parsed = new URL(url);
        const path = parsed.pathname || parsed.host;

        // Route mapping
        const routes: Record<string, string> = {
          'settings': '/settings',
          'downloads': '/downloads',
          'library': '/library',
          'favorites': '/favorites',
          'search': '/search',
          'learning': '/learning',
          'movies': '/movies',
          'shows': '/shows'
        };

        // Check for direct path match
        if (routes[path]) {
          goto(routes[path]);
          return;
        }

        // Handle movie/show deep links: flixcapacitor://movies/123
        if (path.startsWith('movies/')) {
          const id = path.replace('movies/', '');
          if (id) goto(`/movies/${id}`);
          return;
        }
        if (path.startsWith('shows/')) {
          const id = path.replace('shows/', '');
          if (id) goto(`/shows/${id}`);
          return;
        }

        // Default: go to home
        console.log('[DeepLink] Unhandled path:', path);
      } catch (e) {
        console.error('[DeepLink] Parse error:', e);
      }
    };

    // Listen for deep links
    App.addListener('appUrlOpen', (event) => {
      console.log('[DeepLink] Received:', event.url);
      handleDeepLink(event.url);
    });

    return () => {
      App.removeAllListeners();
    };
  });
</script>

<!-- Offline Banner (renders at top when offline) -->
<OfflineBanner />

<KonstaApp theme="ios" dark={true} class="h-full">
  <Page class="!bg-black min-h-screen">
    <!-- Top Navigation -->
    <TopNavbar showBack={showBackButton} />

    <!-- Search Overlay -->
    <SearchBar />

    <!-- Main Content Area - accounts for fixed navbar (44px) + safe area + spacing, min for Android -->
    <div
      class="pb-20 min-h-screen overflow-y-auto"
      style="padding-top: max(calc(env(safe-area-inset-top, 0px) + 5rem), 5.5rem)"
      class:!pb-0={hideBottomNav}
      data-sveltekit-preload-data="hover"
    >
      {@render children()}
    </div>

    <!-- Bottom Navigation -->
    {#if !hideBottomNav}
      <BottomNav />
    {/if}
  </Page>
</KonstaApp>

<style>
  :global(html, body) {
    height: 100%;
    overflow: hidden;
  }

  :global(.k-page) {
    --k-page-bg-ios: #000000;
    --k-page-bg-material: #000000;
  }
</style>
