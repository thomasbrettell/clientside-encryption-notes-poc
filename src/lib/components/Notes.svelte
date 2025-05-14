<script lang="ts">
  import { onMount } from "svelte";
  import { localDB } from "../../pb";
  import { encryptPayload } from "../../crypto";
  import Note from "./Note.svelte";

  let { masterKey }: { masterKey: string } = $props();

  let notes = $state<any[]>([]);

  let selectedNoteId = $state<string>();
  let selectedNote = $derived(
    notes.find((note) => note._id === selectedNoteId)
  );

  const updateNotes = async () => {
    const allDocs = await localDB.allDocs({
      include_docs: true,
    });
    notes = allDocs.rows.map((row) => row.doc);
  };

  const createNewNote = async () => {
    const encryptedPayload = encryptPayload("secret", masterKey);
    await localDB.post({
      content: encryptedPayload,
    });

    updateNotes();
  };

  onMount(() => {
    updateNotes();
  });
</script>

{#if !selectedNote}
  <button onclick={createNewNote}>create new note</button>
{:else}
  <button onclick={() => (selectedNoteId = undefined)}>close</button>
{/if}

{#if !selectedNote}
  <div class="notes">
    {#if notes.length}
      {#each notes as note}
        <button class="note" onclick={() => (selectedNoteId = note._id)}
          >{note._id}</button
        >
      {/each}
    {:else}
      no notes
    {/if}
  </div>
{:else}
  <Note doc={selectedNote} {updateNotes} {masterKey} />
{/if}

<style lang="scss">
  .notes {
    border: 1px solid black;
    padding: 10px;
    display: flex;
    gap: 10px;
    flex-direction: column;
  }

  .note {
    border: 1px solid black;
    padding: 10px;
  }
</style>
