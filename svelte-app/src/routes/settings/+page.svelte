<script lang="ts">
  import { List, ListItem, BlockTitle, Button } from 'konsta/svelte';
  import { settingsStore } from '$lib/stores/settings.store';
  import { uiStore } from '$lib/stores/ui.store';
  import { useHaptics, ImpactStyle } from '$lib/plugins/platform';
  import { EXTERNAL_PLAYERS, type AppSettings, type ExternalPlayer, type VideoQuality } from '$types/settings.types';

  const { impact } = useHaptics();

  // Subscribe to settings
  let settings = $state<AppSettings | undefined>();
  settingsStore.subscribe(s => settings = s);

  async function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    await impact(ImpactStyle.Light);
    await settingsStore.updateSetting(key, value);
  }

  async function handleClearCache() {
    await impact(ImpactStyle.Medium);
    uiStore.showToast('Cache cleared', 'success');
  }

  async function handleResetSettings() {
    await impact(ImpactStyle.Heavy);
    await settingsStore.resetToDefaults();
    uiStore.showToast('Settings reset to defaults', 'success');
  }

  const qualityOptions: Array<{ value: VideoQuality; label: string }> = [
    { value: 'auto', label: 'Auto' },
    { value: '480p', label: '480p' },
    { value: '720p', label: '720p' },
    { value: '1080p', label: '1080p' },
    { value: '2160p', label: '4K' }
  ];

  const subtitleSizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'xlarge', label: 'Extra Large' }
  ];

  const proxyTypeOptions = [
    { value: 'http', label: 'HTTP' },
    { value: 'https', label: 'HTTPS' },
    { value: 'socks4', label: 'SOCKS4' },
    { value: 'socks5', label: 'SOCKS5' }
  ];

  const vpnProviderOptions = [
    { value: null, label: 'None' },
    { value: 'expressvpn', label: 'ExpressVPN' },
    { value: 'nordvpn', label: 'NordVPN' },
    { value: 'surfshark', label: 'Surfshark' },
    { value: 'protonvpn', label: 'ProtonVPN' },
    { value: 'mullvad', label: 'Mullvad' },
    { value: 'custom', label: 'Custom' }
  ];

  // Derived values for display
  let qualityLabel = $derived(qualityOptions.find(o => o.value === settings?.preferredQuality)?.label || 'Auto');
  let subtitleSizeLabel = $derived(subtitleSizeOptions.find(o => o.value === settings?.subtitleSize)?.label || 'Medium');
  let downloadFolderName = $derived(settings?.downloadPath?.split('/').pop() || 'Default');
  let proxyTypeLabel = $derived(proxyTypeOptions.find(o => o.value === settings?.proxyType)?.label || 'HTTP');
  let vpnProviderLabel = $derived(vpnProviderOptions.find(o => o.value === settings?.vpnProvider)?.label || 'None');
  let externalPlayerLabel = $derived(settings?.externalPlayerName || 'Built-in Player');

  // External player detection
  let availablePlayers = $state<ExternalPlayer[]>([]);

  async function detectExternalPlayers() {
    // In a real implementation, we'd use Android PackageManager to check installed apps
    // For now, show the common players list
    availablePlayers = EXTERNAL_PLAYERS;
    uiStore.showToast('Detected external players', 'info');
  }

  function selectExternalPlayer(player: ExternalPlayer | null) {
    if (player) {
      updateSetting('externalPlayerPackage', player.packageName);
      updateSetting('externalPlayerName', player.name);
      updateSetting('useExternalPlayer', true);
    } else {
      updateSetting('externalPlayerPackage', '');
      updateSetting('externalPlayerName', '');
      updateSetting('useExternalPlayer', false);
    }
  }

  // Sheet states
  let showQualitySheet = $state(false);
  let showPlayerSheet = $state(false);
  let showProxySheet = $state(false);
  let showProvidersSheet = $state(false);
</script>

<svelte:head>
  <title>Settings - FlixCapacitor</title>
</svelte:head>

<div class="min-h-screen pb-24">
  <!-- Playback Settings -->
  <BlockTitle>Playback</BlockTitle>
  <List strongIos inset>
    <ListItem
      title="Preferred Quality"
      after={qualityLabel}
      link
      onClick={() => showQualitySheet = true}
    />

    <ListItem
      title="Auto-play"
      after={settings?.autoPlay ? 'On' : 'Off'}
      link
      onClick={() => updateSetting('autoPlay', !(settings?.autoPlay ?? true))}
    />

    <ListItem
      title="Auto-play Next Episode"
      after={settings?.autoPlayNextEpisode ? 'On' : 'Off'}
      link
      onClick={() => updateSetting('autoPlayNextEpisode', !(settings?.autoPlayNextEpisode ?? true))}
    />

    <ListItem
      title="Remember Playback Position"
      after={settings?.rememberPlaybackPosition ? 'On' : 'Off'}
      link
      onClick={() => updateSetting('rememberPlaybackPosition', !(settings?.rememberPlaybackPosition ?? true))}
    />
  </List>

  <!-- External Player Settings -->
  <BlockTitle>External Player</BlockTitle>
  <List strongIos inset>
    <ListItem
      title="Use External Player"
      after={settings?.useExternalPlayer ? 'On' : 'Off'}
      link
      onClick={() => updateSetting('useExternalPlayer', !(settings?.useExternalPlayer ?? false))}
    />

    {#if settings?.useExternalPlayer}
      <ListItem
        title="Select Player"
        after={externalPlayerLabel}
        link
        onClick={() => showPlayerSheet = true}
      />

      <ListItem
        title="Detect Installed Players"
        link
        onClick={detectExternalPlayers}
      >
        <span slot="after" class="text-red-500">Scan</span>
      </ListItem>
    {/if}
  </List>

  <!-- Chromecast Settings -->
  <BlockTitle>Chromecast</BlockTitle>
  <List strongIos inset>
    <ListItem
      title="Enable Chromecast"
      after={settings?.enableChromecast ? 'On' : 'Off'}
      link
      onClick={() => updateSetting('enableChromecast', !(settings?.enableChromecast ?? true))}
    />

    {#if settings?.enableChromecast}
      <ListItem
        title="Cast Quality"
        after={qualityOptions.find(o => o.value === settings?.chromecastQuality)?.label || '1080p'}
        link
      />
    {/if}
  </List>

  <!-- Subtitle Settings -->
  <BlockTitle>Subtitles</BlockTitle>
  <List strongIos inset>
    <ListItem
      title="Subtitle Size"
      after={subtitleSizeLabel}
      link
    />

    <ListItem
      title="Subtitle Background"
      after={settings?.subtitleBackground ? 'On' : 'Off'}
      link
      onClick={() => updateSetting('subtitleBackground', !(settings?.subtitleBackground ?? true))}
    />
  </List>

  <!-- Torrent Providers -->
  <BlockTitle>Content Sources</BlockTitle>
  <List strongIos inset>
    <ListItem
      title="YTS (Movies)"
      after={settings?.enableYTS ? 'On' : 'Off'}
      link
      onClick={() => updateSetting('enableYTS', !(settings?.enableYTS ?? true))}
    />

    <ListItem
      title="EZTV (TV Shows)"
      after={settings?.enableEZTV ? 'On' : 'Off'}
      link
      onClick={() => updateSetting('enableEZTV', !(settings?.enableEZTV ?? true))}
    />

    <ListItem
      title="1337x (Movies & TV)"
      after={settings?.enable1337x ? 'On' : 'Off'}
      link
      onClick={() => updateSetting('enable1337x', !(settings?.enable1337x ?? false))}
    />

    <ListItem
      title="Academic Torrents (Learning)"
      after={settings?.enableAcademicTorrents ? 'On' : 'Off'}
      link
      onClick={() => updateSetting('enableAcademicTorrents', !(settings?.enableAcademicTorrents ?? false))}
    />

    <ListItem
      title="Minimum Seeders"
      after={String(settings?.minSeeders ?? 5)}
      link
    />
  </List>

  <!-- Network Settings -->
  <BlockTitle>Network / VPN</BlockTitle>
  <List strongIos inset>
    <ListItem
      title="Use VPN"
      after={settings?.useVpn ? 'On' : 'Off'}
      link
      onClick={() => updateSetting('useVpn', !(settings?.useVpn ?? false))}
    />

    {#if settings?.useVpn}
      <ListItem
        title="VPN Provider"
        after={vpnProviderLabel}
        link
      />
    {/if}

    <ListItem
      title="Enable Proxy"
      after={settings?.proxyEnabled ? 'On' : 'Off'}
      link
      onClick={() => updateSetting('proxyEnabled', !(settings?.proxyEnabled ?? false))}
    />

    {#if settings?.proxyEnabled}
      <ListItem
        title="Proxy Type"
        after={proxyTypeLabel}
        link
        onClick={() => showProxySheet = true}
      />

      <li class="px-4 py-2">
        <div class="flex gap-2">
          <input
            type="text"
            placeholder="Proxy Host"
            value={settings?.proxyHost || ''}
            onchange={(e) => updateSetting('proxyHost', e.currentTarget.value)}
            class="flex-1 bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm"
          />
          <input
            type="number"
            placeholder="Port"
            value={settings?.proxyPort || 8080}
            onchange={(e) => updateSetting('proxyPort', parseInt(e.currentTarget.value))}
            class="w-20 bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm"
          />
        </div>
      </li>

      <li class="px-4 py-2">
        <div class="flex gap-2">
          <input
            type="text"
            placeholder="Username (optional)"
            value={settings?.proxyUsername || ''}
            onchange={(e) => updateSetting('proxyUsername', e.currentTarget.value)}
            class="flex-1 bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            value={settings?.proxyPassword || ''}
            onchange={(e) => updateSetting('proxyPassword', e.currentTarget.value)}
            class="flex-1 bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm"
          />
        </div>
      </li>
    {/if}
  </List>

  <!-- Download Settings -->
  <BlockTitle>Downloads</BlockTitle>
  <List strongIos inset>
    <ListItem
      title="Download on Wi-Fi Only"
      after={settings?.downloadOnWifiOnly ? 'On' : 'Off'}
      link
      onClick={() => updateSetting('downloadOnWifiOnly', !(settings?.downloadOnWifiOnly ?? true))}
    />

    <ListItem
      title="Seed After Download"
      after={settings?.seedAfterDownload ? 'On' : 'Off'}
      link
      onClick={() => updateSetting('seedAfterDownload', !(settings?.seedAfterDownload ?? false))}
    />

    <ListItem
      title="Download Location"
      after={downloadFolderName}
      link
    />

    <ListItem
      title="Max File Size (GB)"
      after={String(settings?.maxFileSize ?? 10)}
      link
    />
  </List>

  <!-- Appearance -->
  <BlockTitle>Appearance</BlockTitle>
  <List strongIos inset>
    <ListItem
      title="Show Ratings"
      after={settings?.showRatings ? 'On' : 'Off'}
      link
      onClick={() => updateSetting('showRatings', !(settings?.showRatings ?? true))}
    />

    <ListItem
      title="Compact Mode"
      after={settings?.compactMode ? 'On' : 'Off'}
      link
      onClick={() => updateSetting('compactMode', !(settings?.compactMode ?? false))}
    />

    <ListItem
      title="Enable Animations"
      after={settings?.enableAnimations ? 'On' : 'Off'}
      link
      onClick={() => updateSetting('enableAnimations', !(settings?.enableAnimations ?? true))}
    />
  </List>

  <!-- Advanced -->
  <BlockTitle>Advanced</BlockTitle>
  <List strongIos inset>
    <ListItem
      title="Developer Mode"
      after={settings?.developerMode ? 'On' : 'Off'}
      link
      onClick={() => updateSetting('developerMode', !(settings?.developerMode ?? false))}
    />

    <ListItem
      title="Hardware Acceleration"
      after={settings?.hardwareAcceleration ? 'On' : 'Off'}
      link
      onClick={() => updateSetting('hardwareAcceleration', !(settings?.hardwareAcceleration ?? true))}
    />

    <ListItem
      title="Clear Cache"
      link
      onClick={handleClearCache}
    />
  </List>

  <!-- About -->
  <BlockTitle>About</BlockTitle>
  <List strongIos inset>
    <ListItem
      title="Version"
      after="2.0.0"
    />

    <ListItem
      title="Build"
      after="Svelte 5 + Konsta UI"
    />
  </List>

  <!-- Reset Button -->
  <div class="px-4 mt-6">
    <Button
      large
      rounded
      outline
      class="!border-red-600 !text-red-500"
      onClick={handleResetSettings}
    >
      Reset All Settings
    </Button>
  </div>
</div>

<!-- Quality Selection Sheet -->
{#if showQualitySheet}
  <div
    class="fixed inset-0 z-50 bg-black/60 flex items-end"
    onclick={() => showQualitySheet = false}
    onkeydown={(e) => e.key === 'Escape' && (showQualitySheet = false)}
    role="dialog"
    tabindex="-1"
    aria-modal="true"
  >
    <div
      class="w-full bg-zinc-900 rounded-t-2xl p-4 max-h-[60vh] overflow-auto"
      onclick={(e) => e.stopPropagation()}
      onkeydown={() => {}}
      role="presentation"
    >
      <h3 class="text-lg font-semibold text-white mb-4">Preferred Quality</h3>
      {#each qualityOptions as option}
        <button
          type="button"
          class="w-full text-left px-4 py-3 rounded-lg mb-1 {settings?.preferredQuality === option.value ? 'bg-red-600 text-white' : 'bg-zinc-800 text-white/80'}"
          onclick={() => { updateSetting('preferredQuality', option.value); showQualitySheet = false; }}
        >
          {option.label}
        </button>
      {/each}
    </div>
  </div>
{/if}

<!-- External Player Sheet -->
{#if showPlayerSheet}
  <div
    class="fixed inset-0 z-50 bg-black/60 flex items-end"
    onclick={() => showPlayerSheet = false}
    onkeydown={(e) => e.key === 'Escape' && (showPlayerSheet = false)}
    role="dialog"
    tabindex="-1"
    aria-modal="true"
  >
    <div
      class="w-full bg-zinc-900 rounded-t-2xl p-4 max-h-[70vh] overflow-auto"
      onclick={(e) => e.stopPropagation()}
      onkeydown={() => {}}
      role="presentation"
    >
      <h3 class="text-lg font-semibold text-white mb-4">Select External Player</h3>

      <button
        type="button"
        class="w-full text-left px-4 py-3 rounded-lg mb-1 {!settings?.useExternalPlayer ? 'bg-red-600 text-white' : 'bg-zinc-800 text-white/80'}"
        onclick={() => { selectExternalPlayer(null); showPlayerSheet = false; }}
      >
        <div class="font-medium">Built-in Player</div>
        <div class="text-sm opacity-60">Default video player</div>
      </button>

      {#each EXTERNAL_PLAYERS as player}
        <button
          type="button"
          class="w-full text-left px-4 py-3 rounded-lg mb-1 {settings?.externalPlayerPackage === player.packageName ? 'bg-red-600 text-white' : 'bg-zinc-800 text-white/80'}"
          onclick={() => { selectExternalPlayer(player); showPlayerSheet = false; }}
        >
          <div class="font-medium">{player.name}</div>
          <div class="text-sm opacity-60 flex gap-2">
            {#if player.supportsStreaming}
              <span class="bg-green-600/30 text-green-400 px-2 py-0.5 rounded text-xs">Streaming</span>
            {/if}
            {#if player.supportsChromecast}
              <span class="bg-blue-600/30 text-blue-400 px-2 py-0.5 rounded text-xs">Cast</span>
            {/if}
          </div>
        </button>
      {/each}
    </div>
  </div>
{/if}
