<script lang="ts">
  import { useHaptics, ImpactStyle } from '$plugins/platform';

  type Category = { id: string; label: string };

  let {
    categories,
    selected = categories[0]?.id || '',
    onChange
  } = $props<{
    categories: Category[];
    selected?: string;
    onChange?: (id: string) => void;
  }>();

  const { impact } = useHaptics();

  async function handleChange(id: string) {
    if (id !== selected) {
      await impact(ImpactStyle.Light);
      onChange?.(id);
    }
  }
</script>

<div class="px-4 mb-4">
  <div class="flex bg-zinc-900 rounded-xl p-1 gap-1">
    {#each categories as category (category.id)}
      <button
        type="button"
        class="flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all duration-200
          {selected === category.id
            ? 'bg-red-600 text-white shadow-lg'
            : 'text-zinc-400 hover:text-white active:bg-zinc-800'}"
        onclick={() => handleChange(category.id)}
      >
        {category.label}
      </button>
    {/each}
  </div>
</div>
