<script lang="ts">
  import { onMount } from "svelte";
  import { decryptPayload, encryptPayload } from "../../crypto";
  import { localDB } from "../../pb";

  let {
    doc,
    updateNotes,
    masterKey,
  }: { masterKey: string; doc: any; updateNotes: () => Promise<void> } =
    $props();

  let error = $state<any>();

  let decryptedContent = $state<any>();

  const inputHandler = async (e: Event) => {
    const target = e.target as HTMLTextAreaElement;

    if (target) {
      const encryptedPayload = encryptPayload(target.value, masterKey);

      const update = await localDB.put({
        ...doc,
        content: encryptedPayload,
      });

      if (update.ok) {
        updateNotes();
      }
    }
  };

  onMount(async () => {
    try {
      const decryptedPayload = decryptPayload(doc.content, masterKey);
      decryptedContent = decryptedPayload;
    } catch (e) {
      error = e;
      console.error(e);
    }
  });
</script>

{#if !decryptedContent}
  {#if !error}
    <div>loading</div>
  {:else}
    <div class="error">
      {error} <br />
      Decoding probably failed (wrong master-key) <br />
      Either delete master-key in localStorage and reinput the correct password
      <br />
      Or delete the data in Indexed DB (probably "_pouch_local_notes")
    </div>
  {/if}
{:else}
  <textarea value={decryptedContent} oninput={inputHandler}></textarea>
{/if}

<style lang="scss">
  textarea {
    height: 90vh;
  }

  .error {
    padding: 10px;
    border: 1px solid red;
    color: red;
  }
</style>
