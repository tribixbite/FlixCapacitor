<script lang="ts">
  let {
    text = '',
    visible = true,
    fontSize = 'medium',
    position = 'bottom',
    backgroundColor = 'semi',
    offset = 0
  } = $props<{
    text?: string;
    visible?: boolean;
    fontSize?: 'small' | 'medium' | 'large' | 'xlarge';
    position?: 'top' | 'bottom';
    backgroundColor?: 'none' | 'semi' | 'solid';
    offset?: number; // Time offset in seconds (positive = delay, negative = advance)
  }>();

  // Font size classes
  const fontSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl'
  };

  // Background classes
  const backgrounds = {
    none: 'bg-transparent',
    semi: 'bg-black/60',
    solid: 'bg-black'
  };

  // Position classes
  const positions = {
    top: 'top-16',
    bottom: 'bottom-20'
  };

  // Parse subtitle text for styling (bold, italic, etc.)
  function parseSubtitleText(input: string): string {
    // Remove common formatting tags but preserve content
    let parsed = input
      .replace(/<\/?b>/gi, '') // Bold tags
      .replace(/<\/?i>/gi, '') // Italic tags
      .replace(/<\/?u>/gi, '') // Underline tags
      .replace(/<font[^>]*>/gi, '') // Font tags
      .replace(/<\/font>/gi, '')
      .replace(/\{\\[^}]+\}/g, '') // ASS/SSA tags like {\an8}
      .trim();

    return parsed;
  }

  // Split multiline subtitles
  let lines = $derived(
    text
      .split(/\r?\n/)
      .map(line => parseSubtitleText(line))
      .filter(line => line.length > 0)
  );
</script>

{#if visible && lines.length > 0}
  <div
    class="subtitle-overlay absolute left-0 right-0 {positions[position]} flex justify-center pointer-events-none z-20 px-4"
  >
    <div class="{backgrounds[backgroundColor]} rounded-lg px-4 py-2 max-w-[90%]">
      {#each lines as line}
        <p class="{fontSizes[fontSize]} text-white text-center font-medium leading-relaxed subtitle-text">
          {line}
        </p>
      {/each}
    </div>
  </div>
{/if}

<style>
  .subtitle-text {
    text-shadow:
      1px 1px 2px rgba(0, 0, 0, 0.9),
      -1px -1px 2px rgba(0, 0, 0, 0.9),
      1px -1px 2px rgba(0, 0, 0, 0.9),
      -1px 1px 2px rgba(0, 0, 0, 0.9);
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .subtitle-overlay {
    transition: opacity 0.15s ease;
  }
</style>
