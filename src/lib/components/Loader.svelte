<script lang="ts">
  import { onMount } from "svelte";
  import sodium from "libsodium-wrappers-sumo";
  import App from "../../App.svelte";

  let ready = $state(false);

  onMount(async () => {
    // since libsodium is wasm based we need to wait for it to be ready
    // this is a simple way of ensuring the rest of the app doesnt use it before its ready
    await sodium.ready;
    ready = true;
  });
</script>

{#if ready}
  <App />
{:else}
  <p>loading...</p>
{/if}
