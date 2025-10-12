<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ApiClero } from '../api.js';
  import { fade } from 'svelte/transition';

  export let clerigo: ApiClero | null = null;
  export let showModal: boolean;

  const dispatch = createEventDispatcher();

  let editedClerigo: ApiClero;
  let showDeleteConfirmation = false;

  // Validation state
  let validationErrors: Record<string, string> = {};
  let isSaving = false;

  $: if (clerigo) {
    editedClerigo = { ...clerigo };
  } else {
    // Create mode - initialize with empty values
    editedClerigo = {
      id: 0,
      nome_completo: '',
      titulo: '',
      email: '',
      id_diocese_auxiliar: null
    };
  }

  function closeModal() {
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }

  function validateEmail(email: string): boolean {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function validateForm(): boolean {
    validationErrors = {};

    // Required fields
    if (!editedClerigo.nome_completo?.trim()) {
      validationErrors.nome_completo = 'Nome completo é obrigatório';
    }

    if (!editedClerigo.titulo?.trim()) {
      validationErrors.titulo = 'Título é obrigatório';
    }

    // Format validations
    if (editedClerigo.email && !validateEmail(editedClerigo.email)) {
      validationErrors.email = 'Email inválido';
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
      dispatch('save', editedClerigo);
    } finally {
      isSaving = false;
    }
  }

  function handleDelete() {
    showDeleteConfirmation = true;
  }

  function confirmDelete() {
    dispatch('delete', editedClerigo.id);
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
      <h2 id="modal-title">{clerigo ? 'Edit' : 'Create'} Clerigo</h2>
      
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
          <label for="nome_completo">Nome Completo: <span class="required">*</span></label>
          <input 
            id="nome_completo" 
            type="text" 
            bind:value={editedClerigo.nome_completo}
            on:input={() => clearFieldError('nome_completo')}
            class:error={validationErrors.nome_completo}
            required
          />
          {#if validationErrors.nome_completo}
            <span class="field-error">{validationErrors.nome_completo}</span>
          {/if}
        </div>
        <div class="form-group">
          <label for="titulo">Título: <span class="required">*</span></label>
          <input 
            id="titulo" 
            type="text" 
            bind:value={editedClerigo.titulo}
            on:input={() => clearFieldError('titulo')}
            class:error={validationErrors.titulo}
            required
          />
          {#if validationErrors.titulo}
            <span class="field-error">{validationErrors.titulo}</span>
          {/if}
        </div>
        <div class="form-group">
          <label for="email">Email:</label>
          <input 
            id="email" 
            type="email" 
            bind:value={editedClerigo.email}
            on:input={() => clearFieldError('email')}
            class:error={validationErrors.email}
          />
          {#if validationErrors.email}
            <span class="field-error">{validationErrors.email}</span>
          {/if}
        </div>
        <div class="actions">
          {#if clerigo && clerigo.id}
            <button type="button" class="btn-danger" on:click={handleDelete} disabled={isSaving}>Delete</button>
          {/if}
          <button type="submit" class="btn-primary" disabled={isSaving}>
            {#if isSaving}
              {clerigo ? 'Salvando...' : 'Criando...'}
            {:else}
              {clerigo ? 'Save' : 'Create'}
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
      <p>Are you sure you want to delete this clerigo? This action cannot be undone.</p>
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
  input {
    padding: 0.75rem;
    border: 1px solid #E6D7CC;
    border-radius: 4px;
    font-size: 1rem;
    transition: border-color 0.2s;
  }
  input:focus {
    outline: none;
    border-color: #CF4A46;
    box-shadow: 0 0 0 2px rgba(207, 74, 70, 0.25);
  }
  
  input.error {
    border-color: #dc3545;
  }
  
  input.error:focus {
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
  
  .btn-danger:hover {
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
