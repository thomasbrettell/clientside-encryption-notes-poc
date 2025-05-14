<script lang="ts">
  import Notes from "./lib/components/Notes.svelte";
  import { computerRootKey, createRootKey } from "./crypto";

  let masterKey = $state<string>();

  let isLogin = $state(true);

  let identifierRef = $state<HTMLInputElement>();
  let passwordRef = $state<HTMLInputElement>();

  const submitHandler = async () => {
    if (passwordRef?.value && identifierRef?.value) {
      if (isLogin) {
        const nonce = localStorage.getItem("nonce");

        if (nonce) {
          const rootkey = await computerRootKey(
            identifierRef.value,
            passwordRef.value,
            nonce
          );

          masterKey = rootkey.masterKey;
        } else {
          console.warn("no nonce");
        }
      } else {
        const rootkey = await createRootKey(
          identifierRef.value,
          passwordRef.value
        );

        masterKey = rootkey.masterKey;

        localStorage.setItem("nonce", rootkey.nonce);
      }
    }
  };
</script>

<div class="app">
  {#if !masterKey}
    <div>
      <button onclick={() => (isLogin = !isLogin)}>
        {isLogin ? "login" : "signup"}
      </button>

      <input placeholder="identifier" bind:this={identifierRef} />
      <input placeholder="password" type="password" bind:this={passwordRef} />
      <button onclick={submitHandler}>submit</button>
    </div>
  {:else}
    <Notes {masterKey} />
  {/if}
</div>

<style lang="scss">
  .app {
    display: flex;
    gap: 20px;
    flex-direction: column;
  }
</style>
