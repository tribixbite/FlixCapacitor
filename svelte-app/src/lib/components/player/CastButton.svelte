<script lang="ts">
  /**
   * CastButton - Chromecast connection and control button
   * Shows device selection sheet and cast status
   */
  import { onMount, onDestroy } from 'svelte';
  import { Sheet, List, ListItem, Preloader } from 'konsta/svelte';
  import { chromecastService, type CastDevice } from '$services/chromecast.service';
  import { useHaptics, ImpactStyle } from '$plugins/platform';
  import { uiStore } from '$stores/ui.store';

  let {
    mediaUrl = '',
    mediaTitle = '',
    mediaSubtitle = '',
    mediaPoster = '',
    onCastStart,
    onCastEnd
  } = $props<{
    mediaUrl?: string;
    mediaTitle?: string;
    mediaSubtitle?: string;
    mediaPoster?: string;
    onCastStart?: () => void;
    onCastEnd?: () => void;
  }>();

  const { impact } = useHaptics();

  // State
  let available = $state(false);
  let casting = $state(false);
  let devices = $state<CastDevice[]>([]);
  let scanning = $state(false);
  let sheetOpen = $state(false);
  let connectedDevice = $state<CastDevice | null>(null);

  // Cleanup functions
  let unsubscribers: (() => void)[] = [];

  onMount(() => {
    // Check availability
    available = chromecastService.isAvailable();
    casting = chromecastService.isCasting();

    if (casting) {
      const session = chromecastService.getSession();
      connectedDevice = session?.device || null;
    }

    // Subscribe to events
    unsubscribers.push(
      chromecastService.on('deviceDiscovered', (device) => {
        devices = chromecastService.getDevices();
      }),

      chromecastService.on('deviceLost', () => {
        devices = chromecastService.getDevices();
      }),

      chromecastService.on('sessionStarted', (session) => {
        casting = true;
        connectedDevice = session.device;
        sheetOpen = false;
        onCastStart?.();
        uiStore.showToast(`Connected to ${session.device.name}`, 'success');
      }),

      chromecastService.on('sessionEnded', () => {
        casting = false;
        connectedDevice = null;
        onCastEnd?.();
        uiStore.showToast('Disconnected from Chromecast', 'info');
      }),

      chromecastService.on('error', ({ message }) => {
        uiStore.showToast(message, 'error');
      })
    );
  });

  onDestroy(() => {
    unsubscribers.forEach(unsub => unsub());
  });

  async function handleButtonClick() {
    impact(ImpactStyle.Light);

    if (casting) {
      // Show disconnect option
      sheetOpen = true;
    } else {
      // Start scanning and show device list
      sheetOpen = true;
      scanning = true;
      devices = await chromecastService.startDeviceScan();
      scanning = false;
    }
  }

  async function handleDeviceSelect(device: CastDevice) {
    impact(ImpactStyle.Medium);

    const success = await chromecastService.connect(device.id);

    if (success && mediaUrl) {
      // Auto-cast current media
      await chromecastService.castMedia({
        contentId: mediaUrl,
        contentType: 'video/mp4',
        streamType: 'BUFFERED',
        metadata: {
          title: mediaTitle,
          subtitle: mediaSubtitle,
          images: mediaPoster ? [mediaPoster] : undefined
        }
      });
    }
  }

  async function handleDisconnect() {
    impact(ImpactStyle.Medium);
    await chromecastService.disconnect();
    sheetOpen = false;
  }

  function handleCloseSheet() {
    sheetOpen = false;
    chromecastService.stopDeviceScan();
  }
</script>

{#if available}
  <!-- Cast Button -->
  <button
    type="button"
    class="cast-button p-2 rounded-lg transition-colors {casting ? 'text-red-500 bg-red-500/20' : 'text-white/70 hover:text-white'}"
    onclick={handleButtonClick}
    title={casting ? `Connected to ${connectedDevice?.name}` : 'Cast to device'}
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      class="w-6 h-6"
    >
      {#if casting}
        <!-- Connected icon (filled) -->
        <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/>
        <circle cx="2" cy="20" r="1" fill="currentColor"/>
      {:else}
        <!-- Disconnected icon -->
        <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/>
        <line x1="2" y1="20" x2="2.01" y2="20"/>
      {/if}
    </svg>
  </button>

  <!-- Device Selection Sheet -->
  <Sheet
    opened={sheetOpen}
    onBackdropClick={handleCloseSheet}
    class="!bg-zinc-900"
  >
    <div class="px-4 py-3 border-b border-zinc-800">
      <h3 class="font-semibold text-white text-lg">
        {casting ? 'Cast Controls' : 'Cast to Device'}
      </h3>
    </div>

    <div class="max-h-[60vh] overflow-y-auto pb-safe">
      {#if casting}
        <!-- Connected state -->
        <List strongIos inset>
          <ListItem
            title="Connected to"
            after={connectedDevice?.name || 'Unknown'}
          />
          <ListItem
            title="Disconnect"
            link
            onClick={handleDisconnect}
          >
            <span slot="after" class="text-red-500">Disconnect</span>
          </ListItem>
        </List>
      {:else if scanning}
        <!-- Scanning state -->
        <div class="flex flex-col items-center justify-center py-8">
          <Preloader />
          <p class="text-zinc-400 mt-4">Searching for devices...</p>
        </div>
      {:else if devices.length === 0}
        <!-- No devices found -->
        <div class="flex flex-col items-center justify-center py-8 text-zinc-500">
          <svg class="w-12 h-12 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/>
            <line x1="2" y1="20" x2="2.01" y2="20"/>
          </svg>
          <p>No devices found</p>
          <p class="text-sm mt-1">Make sure your Chromecast is on the same network</p>
          <button
            type="button"
            class="mt-4 px-4 py-2 bg-zinc-800 rounded-lg text-sm"
            onclick={async () => { scanning = true; devices = await chromecastService.startDeviceScan(); scanning = false; }}
          >
            Scan Again
          </button>
        </div>
      {:else}
        <!-- Device list -->
        <List strongIos inset>
          {#each devices as device}
            <ListItem
              title={device.name}
              subtitle={device.modelName}
              link
              onClick={() => handleDeviceSelect(device)}
            >
              <div slot="media" class="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
                  <polyline points="17 2 12 7 7 2"/>
                </svg>
              </div>
            </ListItem>
          {/each}
        </List>
      {/if}
    </div>
  </Sheet>
{/if}

<style>
  .cast-button {
    -webkit-tap-highlight-color: transparent;
  }
</style>
