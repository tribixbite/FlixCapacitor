<script lang="ts">
  import { App, Page } from 'konsta/svelte';
  import { page } from '$app/stores';
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
</script>

<!-- Offline Banner (renders at top when offline) -->
<OfflineBanner />

<App theme="ios" dark={true} class="h-full">
  <Page class="!bg-black min-h-screen">
    <!-- Top Navigation -->
    <TopNavbar showBack={showBackButton} />

    <!-- Search Overlay -->
    <SearchBar />

    <!-- Main Content Area -->
    <div
      class="pt-14 pb-20 min-h-screen overflow-y-auto"
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
</App>

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
