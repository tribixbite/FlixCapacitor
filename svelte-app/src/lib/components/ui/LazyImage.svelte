<script lang="ts">
  import { onMount } from 'svelte';

  let {
    src,
    alt = '',
    placeholder = '',
    width,
    height,
    class: className = '',
    loading = 'lazy',
    decoding = 'async',
    onLoad,
    onError
  } = $props<{
    /** Image source URL */
    src: string;
    /** Alt text for accessibility */
    alt?: string;
    /** Placeholder image or data URI while loading */
    placeholder?: string;
    /** Image width */
    width?: number | string;
    /** Image height */
    height?: number | string;
    /** Additional CSS classes */
    class?: string;
    /** Loading strategy */
    loading?: 'lazy' | 'eager';
    /** Decoding strategy */
    decoding?: 'async' | 'sync' | 'auto';
    /** Called when image loads */
    onLoad?: () => void;
    /** Called on load error */
    onError?: (error: Event) => void;
  }>();

  let imgElement: HTMLImageElement;
  let isLoaded = $state(false);
  let hasError = $state(false);
  let isIntersecting = $state(false);

  // Current source to display
  const currentSrc = $derived(
    hasError
      ? placeholder || generatePlaceholder()
      : isLoaded || loading === 'eager'
        ? src
        : placeholder || generatePlaceholder()
  );

  // Generate a simple placeholder gradient
  function generatePlaceholder(): string {
    // Return a tiny base64 gradient placeholder
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="150"%3E%3Crect fill="%2327272a" width="100" height="150"/%3E%3C/svg%3E';
  }

  function handleLoad() {
    isLoaded = true;
    onLoad?.();
  }

  function handleError(e: Event | string) {
    hasError = true;
    if (e instanceof Event) {
      onError?.(e);
    }
  }

  onMount(() => {
    // Use Intersection Observer for lazy loading
    if (loading === 'lazy' && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              isIntersecting = true;
              observer.disconnect();
            }
          }
        },
        {
          rootMargin: '200px', // Start loading 200px before visible
          threshold: 0
        }
      );

      if (imgElement) {
        observer.observe(imgElement);
      }

      return () => observer.disconnect();
    }

    // No IntersectionObserver support, load immediately
    isIntersecting = true;
    return undefined;
  });

  // Load actual image when intersecting
  $effect(() => {
    if (isIntersecting && !isLoaded && !hasError && imgElement) {
      // Preload the image
      const img = new Image();
      img.onload = handleLoad;
      img.onerror = handleError;
      img.src = src;
    }
  });
</script>

<img
  bind:this={imgElement}
  src={currentSrc}
  {alt}
  width={width}
  height={height}
  class="lazy-image {className}"
  class:loaded={isLoaded}
  class:error={hasError}
  loading={loading}
  decoding={decoding}
  onload={handleLoad}
  onerror={handleError}
/>

<style>
  .lazy-image {
    transition: opacity 0.3s ease-out;
    background-color: #27272a;
  }

  .lazy-image:not(.loaded) {
    opacity: 0.6;
  }

  .lazy-image.loaded {
    opacity: 1;
  }

  .lazy-image.error {
    opacity: 0.4;
  }
</style>
