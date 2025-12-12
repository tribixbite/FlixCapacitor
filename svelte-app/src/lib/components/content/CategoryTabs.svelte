<script lang="ts">
  import { Segmented, SegmentedButton } from 'konsta/svelte';
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
  <Segmented strong rounded>
    {#each categories as category (category.id)}
      <SegmentedButton
        strong
        rounded
        active={selected === category.id}
        onClick={() => handleChange(category.id)}
      >
        {category.label}
      </SegmentedButton>
    {/each}
  </Segmented>
</div>
