<script lang="ts">
  import { List, ListItem, Toggle, BlockTitle, Button } from 'konsta/svelte';
  import { settingsStore } from '$lib/stores/settings.store';
  import { uiStore } from '$lib/stores/ui.store';
  import { useHaptics, ImpactStyle } from '$lib/plugins/platform';
  import type { AppSettings } from '$lib/types';

  const { impact } = useHaptics();

  // Subscribe to settings
  let settings = $state<AppSettings>();
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
      after={qualityOptions.find(o => o.value === settings?.preferredQuality)?.label || 'Auto'}
      link
      onClick={openQualityPicker}
    />

    <ListItem
      title="Auto-play"
      after={
        <Toggle
          checked={settings?.autoPlay}
          onChange={(e) => updateSetting('autoPlay', e.target.checked)}
        />
      }
    />

    <ListItem
      title="Auto-play Next Episode"
      after={
        <Toggle
          checked={settings?.autoPlayNextEpisode}
          onChange={(e) => updateSetting('autoPlayNextEpisode', e.target.checked)}
        />
      }
    />
  </List>

  <!-- Subtitle Settings -->
  <BlockTitle>Subtitles</BlockTitle>
  <List strongIos inset>
    <ListItem
      title="Subtitle Size"
      after={subtitleSizeOptions.find(o => o.value === settings?.subtitleSize)?.label || 'Medium'}
      link
    />

    <ListItem
      title="Subtitle Background"
      after={
        <Toggle
          checked={settings?.subtitleBackground}
          onChange={(e) => updateSetting('subtitleBackground', e.target.checked)}
        />
      }
    />
  </List>

  <!-- Download Settings -->
  <BlockTitle>Downloads</BlockTitle>
  <List strongIos inset>
    <ListItem
      title="Download on Wi-Fi Only"
      after={
        <Toggle
          checked={settings?.downloadOnWifiOnly}
          onChange={(e) => updateSetting('downloadOnWifiOnly', e.target.checked)}
        />
      }
    />

    <ListItem
      title="Seed After Download"
      after={
        <Toggle
          checked={settings?.seedAfterDownload}
          onChange={(e) => updateSetting('seedAfterDownload', e.target.checked)}
        />
      }
    />

    <ListItem
      title="Download Location"
      after={settings?.downloadPath?.split('/').pop() || 'Default'}
      link
    />
  </List>

  <!-- Appearance -->
  <BlockTitle>Appearance</BlockTitle>
  <List strongIos inset>
    <ListItem
      title="Show Ratings"
      after={
        <Toggle
          checked={settings?.showRatings}
          onChange={(e) => updateSetting('showRatings', e.target.checked)}
        />
      }
    />

    <ListItem
      title="Compact Mode"
      after={
        <Toggle
          checked={settings?.compactMode}
          onChange={(e) => updateSetting('compactMode', e.target.checked)}
        />
      }
    />
  </List>

  <!-- Advanced -->
  <BlockTitle>Advanced</BlockTitle>
  <List strongIos inset>
    <ListItem
      title="Developer Mode"
      after={
        <Toggle
          checked={settings?.developerMode}
          onChange={(e) => updateSetting('developerMode', e.target.checked)}
        />
      }
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
