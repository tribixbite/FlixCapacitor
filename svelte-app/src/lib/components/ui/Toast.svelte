<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { toasts, uiStore } from '$stores';

  // Icon paths for each toast type
  const icons = {
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
  };

  // Colors for each toast type
  const colors = {
    info: {
      bg: 'bg-zinc-800',
      border: 'border-zinc-600',
      icon: 'text-blue-400'
    },
    success: {
      bg: 'bg-zinc-800',
      border: 'border-green-500/50',
      icon: 'text-green-400'
    },
    warning: {
      bg: 'bg-zinc-800',
      border: 'border-yellow-500/50',
      icon: 'text-yellow-400'
    },
    error: {
      bg: 'bg-zinc-800',
      border: 'border-red-500/50',
      icon: 'text-red-400'
    }
  };

  function dismiss(id: string) {
    uiStore.dismissToast(id);
  }
</script>

{#if $toasts.length > 0}
  <div
    class="fixed bottom-20 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
    aria-live="polite"
    aria-label="Notifications"
  >
    {#each $toasts as toast (toast.id)}
      <div
        class="pointer-events-auto {colors[toast.type].bg} {colors[toast.type].border} border rounded-xl shadow-lg backdrop-blur-sm"
        in:fly={{ y: 50, duration: 200 }}
        out:fade={{ duration: 150 }}
        animate:flip={{ duration: 200 }}
        role="alert"
      >
        <button
          type="button"
          class="w-full flex items-center gap-3 p-3 text-left"
          onclick={() => dismiss(toast.id)}
        >
          <!-- Icon -->
          <svg
            class="w-5 h-5 flex-shrink-0 {colors[toast.type].icon}"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d={icons[toast.type]}
            />
          </svg>

          <!-- Message -->
          <span class="flex-1 text-sm text-white">{toast.message}</span>

          <!-- Close indicator -->
          <svg class="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    {/each}
  </div>
{/if}
