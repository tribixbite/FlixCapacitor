<script lang="ts">
  import { List, ListItem, Toggle, BlockTitle, Button, ListInput } from 'konsta/svelte';
  import { settingsStore } from '$lib/stores/settings.store';
  import { uiStore } from '$lib/stores/ui.store';
  import { useHaptics, ImpactStyle } from '$lib/plugins/platform';
  import { EXTERNAL_PLAYERS, type AppSettings, type ExternalPlayer } from '$types/settings.types';

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

  const qualityOptions = [
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

    <ListItem title="Auto-play">
      <Toggle
        slot="after"
        checked={settings?.autoPlay ?? true}
        onChange={(e) => updateSetting('autoPlay', e.target.checked)}
      />
    </ListItem>

    <ListItem title="Auto-play Next Episode">
      <Toggle
        slot="after"
        checked={settings?.autoPlayNextEpisode ?? true}
        onChange={(e) => updateSetting('autoPlayNextEpisode', e.target.checked)}
      />
    </ListItem>

    <ListItem title="Remember Playback Position">
      <Toggle
        slot="after"
        checked={settings?.rememberPlaybackPosition ?? true}
        onChange={(e) => updateSetting('rememberPlaybackPosition', e.target.checked)}
      />
    </ListItem>
  </List>

  <!-- External Player Settings -->
  <BlockTitle>External Player</BlockTitle>
  <List strongIos inset>
    <ListItem title="Use External Player">
      <Toggle
        slot="after"
        checked={settings?.useExternalPlayer ?? false}
        onChange={(e) => updateSetting('useExternalPlayer', e.target.checked)}
      />
    </ListItem>

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
    <ListItem title="Enable Chromecast">
      <Toggle
        slot="after"
        checked={settings?.enableChromecast ?? true}
        onChange={(e) => updateSetting('enableChromecast', e.target.checked)}
      />
    </ListItem>

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

    <ListItem title="Subtitle Background">
      <Toggle
        slot="after"
        checked={settings?.subtitleBackground ?? true}
        onChange={(e) => updateSetting('subtitleBackground', e.target.checked)}
      />
    </ListItem>
  </List>

  <!-- Torrent Providers -->
  <BlockTitle>Content Sources</BlockTitle>
  <List strongIos inset>
    <ListItem title="YTS (Movies)">
      <Toggle
        slot="after"
        checked={settings?.enableYTS ?? true}
        onChange={(e) => updateSetting('enableYTS', e.target.checked)}
      />
    </ListItem>

    <ListItem title="EZTV (TV Shows)">
      <Toggle
        slot="after"
        checked={settings?.enableEZTV ?? true}
        onChange={(e) => updateSetting('enableEZTV', e.target.checked)}
      />
    </ListItem>

    <ListItem title="1337x (Movies & TV)">
      <Toggle
        slot="after"
        checked={settings?.enable1337x ?? false}
        onChange={(e) => updateSetting('enable1337x', e.target.checked)}
      />
    </ListItem>

    <ListItem title="Academic Torrents (Learning)">
      <Toggle
        slot="after"
        checked={settings?.enableAcademicTorrents ?? false}
        onChange={(e) => updateSetting('enableAcademicTorrents', e.target.checked)}
      />
    </ListItem>

    <ListItem
      title="Minimum Seeders"
      after={String(settings?.minSeeders ?? 5)}
      link
    />
  </List>

  <!-- Network Settings -->
  <BlockTitle>Network / VPN</BlockTitle>
  <List strongIos inset>
    <ListItem title="Use VPN">
      <Toggle
        slot="after"
        checked={settings?.useVpn ?? false}
        onChange={(e) => updateSetting('useVpn', e.target.checked)}
      />
    </ListItem>

    {#if settings?.useVpn}
      <ListItem
        title="VPN Provider"
        after={vpnProviderLabel}
        link
      />
    {/if}

    <ListItem title="Enable Proxy">
      <Toggle
        slot="after"
        checked={settings?.proxyEnabled ?? false}
        onChange={(e) => updateSetting('proxyEnabled', e.target.checked)}
      />
    </ListItem>

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
    <ListItem title="Download on Wi-Fi Only">
      <Toggle
        slot="after"
        checked={settings?.downloadOnWifiOnly ?? true}
        onChange={(e) => updateSetting('downloadOnWifiOnly', e.target.checked)}
      />
    </ListItem>

    <ListItem title="Seed After Download">
      <Toggle
        slot="after"
        checked={settings?.seedAfterDownload ?? false}
        onChange={(e) => updateSetting('seedAfterDownload', e.target.checked)}
      />
    </ListItem>

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
    <ListItem title="Show Ratings">
      <Toggle
        slot="after"
        checked={settings?.showRatings ?? true}
        onChange={(e) => updateSetting('showRatings', e.target.checked)}
      />
    </ListItem>

    <ListItem title="Compact Mode">
      <Toggle
        slot="after"
        checked={settings?.compactMode ?? false}
        onChange={(e) => updateSetting('compactMode', e.target.checked)}
      />
    </ListItem>

    <ListItem title="Enable Animations">
      <Toggle
        slot="after"
        checked={settings?.enableAnimations ?? true}
        onChange={(e) => updateSetting('enableAnimations', e.target.checked)}
      />
    </ListItem>
  </List>

  <!-- Advanced -->
  <BlockTitle>Advanced</BlockTitle>
  <List strongIos inset>
    <ListItem title="Developer Mode">
      <Toggle
        slot="after"
        checked={settings?.developerMode ?? false}
        onChange={(e) => updateSetting('developerMode', e.target.checked)}
      />
    </ListItem>

    <ListItem title="Hardware Acceleration">
      <Toggle
        slot="after"
        checked={settings?.hardwareAcceleration ?? true}
        onChange={(e) => updateSetting('hardwareAcceleration', e.target.checked)}
      />
    </ListItem>

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
