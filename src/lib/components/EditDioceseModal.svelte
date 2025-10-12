<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { dataService } from '../dataService.js';
  import type { ApiEntidade, ApiDiocese, ApiClero } from '../api.js';
  import { fade } from 'svelte/transition';

  export let diocese: ApiDiocese | null = null;
  export let showModal: boolean;

  const dispatch = createEventDispatcher();

  let editedDiocese: ApiDiocese;
  let jurisdicoes: string[] = [];
  let showDeleteConfirmation = false;

  // Validation state
  let validationErrors: Record<string, string> = {};
  let isSaving = false;

  $: if (diocese) {
    editedDiocese = { ...diocese };
  } else {
    // Create mode - initialize with empty values
    editedDiocese = {
      id: 0,
      nome: '',
      jurisdicao: '',
      loc_sede: ''
    };
  }

  onMount(async () => {
    try {
      jurisdicoes = await dataService.getJurisdicoes();
    } catch (error) {
      console.error('❌ Failed to load jurisdicoes:', error);
    }
  });

  function closeModal() {
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }

  function validateForm(): boolean {
    validationErrors = {};

    // Required fields
    if (!editedDiocese.nome?.trim()) {
      validationErrors.nome = 'Nome é obrigatório';
    }

    if (!editedDiocese.jurisdicao?.trim()) {
      validationErrors.jurisdicao = 'Jurisdição é obrigatória';
    }

    if (!editedDiocese.loc_sede?.trim()) {
      validationErrors.loc_sede = 'Sede é obrigatória';
    }

    return Object.keys(validationErrors).length === 0;
  }

  function clearFieldError(fieldName: string) {
    if (validationErrors[fieldName]) {
      delete validationErrors[fieldName];
      validationErrors = validationErrors;
    }
  }

  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    isSaving = true;
    
    try {
      dispatch('save', editedDiocese);
    } finally {
      isSaving = false;
    }
  }

  function handleDelete() {
    showDeleteConfirmation = true;
  }

  function confirmDelete() {
    dispatch('delete', editedDiocese.id);
    showDeleteConfirmation = false;
  }

  function cancelDelete() {
    showDeleteConfirmation = false;
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if showModal}
  <div
    class="modal-backdrop"
    on:click={closeModal}
    role="button"
    tabindex="0"
    on:keydown={(e) => e.key === 'Enter' && closeModal()}
    transition:fade={{ duration: 200 }}
  >
    <div
      class="modal"
      on:click|stopPropagation
      on:keydown|stopPropagation
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabindex="-1"
    >
      <h2 id="modal-title">{diocese ? 'Edit' : 'Create'} Diocese</h2>
      
      {#if Object.keys(validationErrors).length > 0}
        <div class="validation-summary">
          <p><strong>⚠️ Por favor, corrija os seguintes erros:</strong></p>
          <ul>
            {#each Object.entries(validationErrors) as [field, error]}
              <li>{error}</li>
            {/each}
          </ul>
        </div>
      {/if}
      
      <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
          <label for="nome">Nome: <span class="required">*</span></label>
          <input 
            id="nome" 
            type="text" 
            bind:value={editedDiocese.nome}
            on:input={() => clearFieldError('nome')}
            class:error={validationErrors.nome}
            required
          />
          {#if validationErrors.nome}
            <span class="field-error">{validationErrors.nome}</span>
          {/if}
        </div>
        <div class="form-group">
          <label for="jurisdicao">Jurisdição: <span class="required">*</span></label>
          <select 
            id="jurisdicao" 
            bind:value={editedDiocese.jurisdicao}
            on:change={() => clearFieldError('jurisdicao')}
            class:error={validationErrors.jurisdicao}
            required
          >
            <option value="">Selecione uma jurisdição</option>
            {#each jurisdicoes as jurisdicao}
              <option value={jurisdicao}>{jurisdicao}</option>
            {/each}
          </select>
          {#if validationErrors.jurisdicao}
            <span class="field-error">{validationErrors.jurisdicao}</span>
          {/if}
        </div>
        <div class="form-group">
          <label for="loc_sede">Sede: <span class="required">*</span></label>
          <input 
            id="loc_sede" 
            type="text" 
            bind:value={editedDiocese.loc_sede}
            on:input={() => clearFieldError('loc_sede')}
            class:error={validationErrors.loc_sede}
            required
          />
          {#if validationErrors.loc_sede}
            <span class="field-error">{validationErrors.loc_sede}</span>
          {/if}
        </div>
        <div class="actions">
          {#if diocese && diocese.id}
            <button type="button" class="btn-danger" on:click={handleDelete} disabled={isSaving}>Delete</button>
          {/if}
          <button type="submit" class="btn-primary" disabled={isSaving}>
            {#if isSaving}
              {diocese ? 'Salvando...' : 'Criando...'}
            {:else}
              {diocese ? 'Save' : 'Create'}
            {/if}
          </button>
          <button type="button" class="btn-secondary" on:click={closeModal} disabled={isSaving}>Cancel</button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if showDeleteConfirmation}
  <div class="modal-backdrop" 
       role="button" 
       tabindex="0"
       on:click={cancelDelete} 
       on:keydown={(e) => e.key === 'Escape' && cancelDelete()}
       transition:fade={{ duration: 200 }}>
    <div class="confirmation-modal" 
         role="dialog"
         tabindex="-1"
         on:click|stopPropagation
         on:keydown|stopPropagation>
      <h3>Confirm Deletion</h3>
      <p>Are you sure you want to delete this diocese? This action cannot be undone.</p>
      <div class="confirmation-actions">
        <button type="button" class="btn-danger" on:click={confirmDelete}>Yes, Delete</button>
        <button type="button" class="btn-secondary" on:click={cancelDelete}>Cancel</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  .modal {
    background: #fff;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    width: 1000px;
    max-width: 90%;
    color: #333;
  }
  #modal-title {
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: #333;
    font-weight: 600;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .form-group {
    display: flex;
    flex-direction: column;
  }
  label {
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  input, select {
    padding: 0.75rem;
    border: 1px solid #E6D7CC;
    border-radius: 4px;
    font-size: 1rem;
    transition: border-color 0.2s;
  }
  input:focus, select:focus {
    outline: none;
    border-color: #CF4A46;
    box-shadow: 0 0 0 2px rgba(207, 74, 70, 0.25);
  }
  
  input.error, select.error {
    border-color: #dc3545;
  }
  
  input.error:focus, select.error:focus {
    border-color: #dc3545;
    box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.25);
  }
  
  .field-error {
    color: #dc3545;
    font-size: 0.85rem;
    margin-top: 0.25rem;
    display: block;
  }
  
  .required {
    color: #dc3545;
    font-weight: bold;
  }
  
  .validation-summary {
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    color: #721c24;
  }
  
  .validation-summary p {
    margin: 0 0 0.5rem 0;
  }
  
  .validation-summary ul {
    margin: 0;
    padding-left: 1.5rem;
  }
  
  .validation-summary li {
    margin-bottom: 0.25rem;
  }
  
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-primary {
    background-color: #CF4A46;
    color: white;
  }
  .btn-primary:hover:not(:disabled) {
    background-color: #b33d39;
  }
  .btn-secondary {
    background-color: #F9F5F2;
    color: #333;
    border: 1px solid #E6D7CC;
  }
  .btn-secondary:hover:not(:disabled) {
    background-color: #F2EDE8;
  }
  
  .btn-danger {
    background-color: #dc3545;
    color: white;
  }
  
  .btn-danger:hover:not(:disabled) {
    background-color: #c82333;
  }
  
  .confirmation-modal {
    background: #fff;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    width: 400px;
    max-width: 90%;
    text-align: center;
    color: #333;
  }
  
  .confirmation-modal h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #333;
    font-weight: 600;
  }
  
  .confirmation-modal p {
    margin-bottom: 1.5rem;
    color: #666;
  }
  
  .confirmation-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }
</style>
