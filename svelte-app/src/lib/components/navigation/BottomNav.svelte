<script lang="ts">
  import { Tabbar, TabbarLink } from 'konsta/svelte';
  import { page } from '$app/stores';
  import { useHaptics, ImpactStyle } from '$plugins/platform';

  const { impact } = useHaptics();

  // Navigation items with icons (using emoji for now, replace with proper icons)
  const navItems = [
    { href: '/', label: 'Browse', icon: '🎬', activeIcon: '🎬' },
    { href: '/favorites', label: 'Favorites', icon: '🤍', activeIcon: '❤️' },
    { href: '/library', label: 'Library', icon: '📁', activeIcon: '📂' },
    { href: '/downloads', label: 'Downloads', icon: '⬇️', activeIcon: '⬇️' },
    { href: '/collections', label: 'Collections', icon: '📚', activeIcon: '📚' },
    { href: '/settings', label: 'Settings', icon: '⚙️', activeIcon: '⚙️' }
  ];

  function isActive(href: string, currentPath: string): boolean {
    if (href === '/') return currentPath === '/';
    return currentPath.startsWith(href);
  }

  async function handleNavClick(href: string) {
    await impact(ImpactStyle.Light);
  }
</script>

<Tabbar
  class="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
  labels={true}
  icons={true}
>
  {#each navItems as item}
    {@const active = isActive(item.href, $page.url.pathname)}
    <TabbarLink
      href={item.href}
      active={active}
      onClick={() => handleNavClick(item.href)}
      icon={
        <span class="text-xl">
          {active ? item.activeIcon : item.icon}
        </span>
      }
      label={item.label}
    />
  {/each}
</Tabbar>

<style>
  :global(.k-tabbar) {
    --k-tabbar-bg-ios: rgba(10, 10, 10, 0.95);
    --k-tabbar-bg-material: rgba(10, 10, 10, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  :global(.k-tabbar-link-active) {
    --k-tabbar-link-active-color: #dc2626;
  }
</style>
