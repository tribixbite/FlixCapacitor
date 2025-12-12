<script lang="ts">
  import { tmdbService } from '$services/tmdb.service';
  import type { Cast } from '$types';

  let { cast, maxItems = 10 } = $props<{
    cast: Cast[];
    maxItems?: number;
  }>();

  let displayCast = $derived(cast.slice(0, maxItems));
</script>

<section class="mb-6">
  <h3 class="text-lg font-semibold text-white px-4 mb-3">Cast</h3>

  <div class="flex overflow-x-auto gap-3 px-4 pb-2 scrollbar-hide">
    {#each displayCast as person (person.id)}
      <div class="flex-shrink-0 w-20 text-center">
        <div class="w-20 h-20 rounded-full overflow-hidden bg-zinc-800 mb-2">
          <img
            src={tmdbService.getProfileUrl(person.profilePath, 'small')}
            alt={person.name}
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <p class="text-xs text-white font-medium truncate">{person.name}</p>
        <p class="text-xs text-zinc-500 truncate">{person.character}</p>
      </div>
    {/each}
  </div>
</section>

<style>
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
</style>
