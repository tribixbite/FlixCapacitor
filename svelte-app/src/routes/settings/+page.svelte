<script lang="ts">
  import { List, ListItem, Toggle, BlockTitle, Button } from 'konsta/svelte';
  import { settingsStore } from '$lib/stores/settings.store';
  import { uiStore } from '$lib/stores/ui.store';
  import { useHaptics, ImpactStyle } from '$lib/plugins/platform';
  import type { AppSettings } from '$lib/types';

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
    // TODO: Implement cache clearing
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
    { value: 'large', label: 'Large' }
  ];

  function openQualityPicker() {
    uiStore.openSheet('quality-picker');
  }

  // Derived values for display
  let qualityLabel = $derived(qualityOptions.find(o => o.value === settings?.preferredQuality)?.label || 'Auto');
  let subtitleSizeLabel = $derived(subtitleSizeOptions.find(o => o.value === settings?.subtitleSize)?.label || 'Medium');
  let downloadFolderName = $derived(settings?.downloadPath?.split('/').pop() || 'Default');
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
      onClick={openQualityPicker}
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
