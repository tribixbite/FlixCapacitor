<script lang="ts">
  import { onMount } from 'svelte';

  let {
    active = true,
    initialFocus,
    returnFocus = true,
    children
  } = $props<{
    /** Whether the focus trap is active */
    active?: boolean;
    /** Selector or element to focus initially */
    initialFocus?: string | HTMLElement;
    /** Return focus to previous element on deactivate */
    returnFocus?: boolean;
    /** Content to trap focus within */
    children: import('svelte').Snippet;
  }>();

  let container: HTMLDivElement;
  let previouslyFocused: Element | null = null;

  // Focusable element selector
  const focusableSelector = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(',');

  function getFocusableElements(): HTMLElement[] {
    if (!container) return [];
    return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector));
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!active || e.key !== 'Tab') return;

    const focusable = getFocusableElements();
    if (focusable.length === 0) return;

    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    if (e.shiftKey) {
      // Shift + Tab: go to last if at first
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab: go to first if at last
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  function focusInitial() {
    if (!active || !container) return;

    const focusable = getFocusableElements();
    if (focusable.length === 0) return;

    let elementToFocus: HTMLElement | null = null;

    if (initialFocus) {
      if (typeof initialFocus === 'string') {
        elementToFocus = container.querySelector(initialFocus);
      } else {
        elementToFocus = initialFocus;
      }
    }

    if (!elementToFocus) {
      elementToFocus = focusable[0];
    }

    elementToFocus?.focus();
  }

  function returnFocusToPrevious() {
    if (returnFocus && previouslyFocused instanceof HTMLElement) {
      previouslyFocused.focus();
    }
  }

  $effect(() => {
    if (active) {
      previouslyFocused = document.activeElement;
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => focusInitial());
    } else {
      returnFocusToPrevious();
    }
  });

  onMount(() => {
    return () => {
      if (active) {
        returnFocusToPrevious();
      }
    };
  });
</script>

<div
  bind:this={container}
  class="focus-trap"
  onkeydown={handleKeyDown}
  role="presentation"
>
  {@render children()}
</div>

<style>
  .focus-trap {
    display: contents;
  }
</style>
