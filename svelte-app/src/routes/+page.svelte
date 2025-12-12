<script lang="ts">
  import { App, Page, Navbar, Block } from 'konsta/svelte';
</script>

<App theme="ios" dark>
  <Page>
    <Navbar title="FlixCapacitor v2" class="safe-top" />
    <Block>
      <h1 class="text-2xl font-bold mb-4">Welcome to FlixCapacitor v2</h1>
      <p class="text-gray-400">Built with Svelte 5 + Konsta UI</p>
    </Block>
  </Page>
</App>
