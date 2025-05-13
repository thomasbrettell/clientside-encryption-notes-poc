<script lang="ts">
  import { onMount } from "svelte";
  import Notes from "./lib/components/Notes.svelte";
  import { createMasterKey, deriveKeys, encryptPayload } from "./crypto";

  let authed = $state(false);

  let passwordRef = $state<HTMLInputElement>();

  const submitHandler = async (e: SubmitEvent) => {
    e.preventDefault();

    if (passwordRef?.value) {
      const rootKey = await deriveKeys(passwordRef.value, "random-salt");

      localStorage.setItem("master-key", rootKey.masterKey);

      authed = true;
    }
  };

  onMount(async () => {
    const rootkey = await createMasterKey("brian", "password");
    console.log(rootkey);

    const encryptedPayload = encryptPayload("secret", rootkey.masterKey);
    console.log(encryptedPayload);

    if (localStorage.getItem("master-key")) {
      authed = true;
    }
  });
</script>

<div class="app">
  {#if !authed}
    <form onsubmit={submitHandler}>
      <input placeholder="password" type="password" bind:this={passwordRef} />
      <button>submit</button>
    </form>
  {:else}
    <Notes />
  {/if}
</div>

<style lang="scss">
  .app {
    display: flex;
    gap: 20px;
    flex-direction: column;
  }
</style>
