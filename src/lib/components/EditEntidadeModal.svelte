<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { dataService } from '../dataService.js';
  import { apiService } from '../api.js';
  import { storageService } from '../storageService.js';
  import { supabaseService } from '../supabaseService.js';
  import type { ApiEntidade, ApiDiocese, ApiClero } from '../api.js';
  import { fade } from 'svelte/transition';
  import { getJurisdicaoLabel } from '../utils.js';
  import type { Jurisdicao } from '../types.js';
  import { ESTADOS_BRASIL } from '../estados.js';

  export let entidade: ApiEntidade | null = null;
  export let showModal: boolean;

  const dispatch = createEventDispatcher();

  let editedEntidade: ApiEntidade;
  let tipos: string[] = [];
  let dioceses: ApiDiocese[] = [];
  let cleroList: ApiClero[] = [];
  let cleroSearchQuery: string = '';
  let showCleroDropdown: boolean = false;
  let selectedCleroName: string = '';
  let originalAddress: string = '';
  let isGeocodingLoading = false;
  let geocodingError: string | null = null;
  let showDeleteConfirmation = false;
  
  // Image upload state
  let imageFiles: File[] = [];
  let imagePreviews: string[] = [];
  let isUploadingImage = false;
  let uploadError: string | null = null;
  let allPhotos: Array<{id: number, url_foto: string, legenda?: string, ordem: number}> = [];
  let isLoadingPhotos = false;
  let isDragging = false;

  // Validation state
  let validationErrors: Record<string, string> = {};
  let isSaving = false;

  $: if (entidade) {
    editedEntidade = { ...entidade };
    originalAddress = `${entidade.cep}, ${entidade.cidade}`;
    
    // Load all photos if exists
    if (entidade.id) {
      loadAllPhotos(entidade.id);
    }
  } else {
    // Create mode - initialize with empty values
    editedEntidade = {
      id: 0,
      nome: '',
      tipo: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      telefone: '',
      email: '',
      website: '',
      link_maps: null,
      descricao: '',
      latitude: undefined,
      longitude: undefined,
      url_foto: null,
      status: 'ativa'
    };
    originalAddress = '';
    
    allPhotos = [];
  }
  
  // Monitora mudanças no CEP e cidade para determinar se precisa recalcular coordenadas
  $: currentAddress = `${editedEntidade.cep}, ${editedEntidade.cidade}`;
  $: addressChanged = originalAddress && originalAddress !== currentAddress;

  // Filter clero based on search query
  $: filteredCleroList = cleroList.filter(clerigo => {
    if (!cleroSearchQuery) return true;
    const searchLower = cleroSearchQuery.toLowerCase();
    const nomeMatch = clerigo.nome_completo.toLowerCase().includes(searchLower);
    const tituloMatch = clerigo.titulo?.toLowerCase().includes(searchLower);
    const emailMatch = clerigo.email?.toLowerCase().includes(searchLower);
    return nomeMatch || tituloMatch || emailMatch;
  });

  // Update selected clero name when id_reitor changes
  $: {
    if (editedEntidade.id_reitor && cleroList.length > 0) {
      const selectedClerigo = cleroList.find(c => c.id === editedEntidade.id_reitor);
      if (selectedClerigo) {
        selectedCleroName = `${selectedClerigo.titulo ? selectedClerigo.titulo + ' ' : ''}${selectedClerigo.nome_completo}`;
        cleroSearchQuery = selectedCleroName;
      }
    } else if (!editedEntidade.id_reitor) {
      selectedCleroName = '';
      cleroSearchQuery = '';
    }
  }

  function selectClerigo(clerigo: ApiClero) {
    editedEntidade.id_reitor = clerigo.id;
    selectedCleroName = `${clerigo.titulo ? clerigo.titulo + ' ' : ''}${clerigo.nome_completo}`;
    cleroSearchQuery = selectedCleroName;
    showCleroDropdown = false;
  }

  function clearCleroSelection() {
    editedEntidade.id_reitor = undefined;
    selectedCleroName = '';
    cleroSearchQuery = '';
    showCleroDropdown = false;
  }

  function handleCleroInputFocus() {
    showCleroDropdown = true;
  }

  function handleCleroInputBlur() {
    // Delay to allow click on dropdown item
    setTimeout(() => {
      showCleroDropdown = false;
    }, 200);
  }


  onMount(async () => {
    try {
      tipos = await dataService.getTipos();

      // Load dioceses
      const diocesesData = await dataService.getDioceses();
      dioceses = diocesesData.map(d => ({
        id: d.id,
        nome: d.nome,
        jurisdicao: d.jurisdicao,
        loc_sede: d.loc_sede
      }));
      
      // Load clero
      const cleroData = await dataService.getClero();
      cleroList = cleroData || [];
      
      if (entidade) {
        originalAddress = `${entidade.cep}, ${entidade.cidade}`;
        if (entidade.id) {
          loadAllPhotos(entidade.id);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load dropdown data:', error);
    }
  });

  async function loadAllPhotos(entidadeId: number) {
    isLoadingPhotos = true;
    try {
      const photos = await supabaseService.getFotosByEntidade(entidadeId);
      allPhotos = photos;
      
      // Set the main photo URL
      if (photos.length > 0) {
        editedEntidade.url_foto = photos[0].url_foto;
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      isLoadingPhotos = false;
    }
  }

  function closeModal() {
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }

  async function recalcularCoordenadas() {
    if (!editedEntidade.cidade) {
      geocodingError = 'Cidade é obrigatória para calcular coordenadas';
      return;
    }

    isGeocodingLoading = true;
    geocodingError = null;

    try {
      const coordinates = await apiService.geocodeAddress(
        editedEntidade.endereco,
        editedEntidade.cidade,
        editedEntidade.estado,
        editedEntidade.cep
      );

      if (coordinates) {
        editedEntidade.latitude = coordinates.latitude;
        editedEntidade.longitude = coordinates.longitude;
        originalAddress = currentAddress; // Atualiza o endereço de referência
      } else {
        geocodingError = 'Não foi possível encontrar coordenadas para esta localização. Verifique se os dados estão corretos.';
      }
    } catch (error) {
      geocodingError = 'Erro ao buscar coordenadas. Tente novamente.';
      console.error('Erro na geocodificação:', error);
    } finally {
      isGeocodingLoading = false;
    }
  }

  async function handleSubmit() {
    // Validate form
    if (!validateForm()) {
      return;
    }

    isSaving = true;
    
    try {
      // If we have imageFiles and this is an existing entity, upload them first
      if (imageFiles.length > 0 && editedEntidade.id) {
        await uploadImages();
      }
      
      // Send the save event
      dispatch('save', { entidade: editedEntidade, imageFile: null });
    } catch (error) {
      console.error('❌ Error during save:', error);
      uploadError = error instanceof Error ? error.message : 'Erro ao salvar';
    } finally {
      isSaving = false;
    }
  }

  function handleDelete() {
    showDeleteConfirmation = true;
  }

  function confirmDelete() {
    dispatch('delete', editedEntidade.id);
    showDeleteConfirmation = false;
  }

  function cancelDelete() {
    showDeleteConfirmation = false;
  }

  // Função para formatar CEP automaticamente
  function formatCep(value: string): string {
    // Remove tudo que não for número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 8 dígitos
    const limitedNumbers = numbers.slice(0, 8);
    
    // Aplica a formatação se tiver 8 dígitos
    if (limitedNumbers.length === 8) {
      return `${limitedNumbers.slice(0, 5)}-${limitedNumbers.slice(5)}`;
    }
    
    return limitedNumbers;
  }

  function handleCepInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const formattedValue = formatCep(input.value);
    editedEntidade.cep = formattedValue;
    // Clear CEP validation error when user types
    if (validationErrors.cep) {
      delete validationErrors.cep;
      validationErrors = validationErrors;
    }
  }

  // Validation functions
  function validateEmail(email: string): boolean {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function validateCep(cep: string): boolean {
    if (!cep) return true; // CEP is optional
    const cepRegex = /^\d{5}-?\d{3}$/;
    return cepRegex.test(cep);
  }

  function validateUrl(url: string): boolean {
    if (!url) return true; // URL is optional
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  }

  function validateForm(): boolean {
    validationErrors = {};

    // Required fields
    if (!editedEntidade.nome?.trim()) {
      validationErrors.nome = 'Nome é obrigatório';
    }

    if (!editedEntidade.tipo?.trim()) {
      validationErrors.tipo = 'Tipo é obrigatório';
    }

    if (!editedEntidade.endereco?.trim()) {
      validationErrors.endereco = 'Endereço é obrigatório';
    }

    if (!editedEntidade.cidade?.trim()) {
      validationErrors.cidade = 'Cidade é obrigatória';
    }

    if (!editedEntidade.estado?.trim()) {
      validationErrors.estado = 'Estado é obrigatório';
    }

    if (!editedEntidade.cep?.trim()) {
      validationErrors.cep = 'CEP é obrigatório';
    } else if (!validateCep(editedEntidade.cep)) {
      validationErrors.cep = 'CEP inválido (formato: 12345-678)';
    }

    // Format validations
    if (editedEntidade.email && !validateEmail(editedEntidade.email)) {
      validationErrors.email = 'Email inválido';
    }

    if (editedEntidade.website && !validateUrl(editedEntidade.website)) {
      validationErrors.website = 'URL inválida';
    }

    if (editedEntidade.link_maps && !validateUrl(editedEntidade.link_maps)) {
      validationErrors.link_maps = 'URL inválida';
    }

    // Coordinate validation
    if (editedEntidade.latitude !== undefined && (editedEntidade.latitude < -90 || editedEntidade.latitude > 90)) {
      validationErrors.latitude = 'Latitude deve estar entre -90 e 90';
    }

    if (editedEntidade.longitude !== undefined && (editedEntidade.longitude < -180 || editedEntidade.longitude > 180)) {
      validationErrors.longitude = 'Longitude deve estar entre -180 e 180';
    }

    return Object.keys(validationErrors).length === 0;
  }

  function clearFieldError(fieldName: string) {
    if (validationErrors[fieldName]) {
      delete validationErrors[fieldName];
      validationErrors = validationErrors;
    }
  }

  // Image handling functions
  function handleImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    
    if (!files || files.length === 0) return;
    
    processFiles(files);
  }
  
  function processFiles(files: FileList) {
    const newFiles: File[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        uploadError = 'Por favor, selecione apenas arquivos de imagem';
        continue;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        uploadError = 'Cada imagem deve ter no máximo 5MB';
        continue;
      }
      
      newFiles.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreviews = [...imagePreviews, e.target?.result as string];
      };
      reader.readAsDataURL(file);
    }
    
    imageFiles = [...imageFiles, ...newFiles];
    if (newFiles.length > 0) {
      uploadError = null;
    }
  }
  
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragging = true;
  }
  
  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragging = false;
  }
  
  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }

  function cancelImageSelection() {
    imageFiles = [];
    imagePreviews = [];
    uploadError = null;
    
    // Reset the file input
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
  
  function removeSelectedImage(index: number) {
    imageFiles = imageFiles.filter((_, i) => i !== index);
    imagePreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Reset the file input
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  async function uploadImages() {
    if (imageFiles.length === 0 || !editedEntidade.id) {
      return;
    }
    
    isUploadingImage = true;
    uploadError = null;
    
    try {
      // Get the starting ordem number
      let nextOrdem = allPhotos.length > 0 
        ? Math.max(...allPhotos.map(p => p.ordem)) + 1 
        : 1;
      
      // Upload all images
      for (const imageFile of imageFiles) {
        const result = await storageService.uploadImage(imageFile, editedEntidade.id);
        
        // Create new foto record
        const newFoto = await supabaseService.createFoto({
          id_entidade: editedEntidade.id,
          url_foto: result.url,
          legenda: '',
          ordem: nextOrdem
        });
        
        // Add to local array
        allPhotos = [...allPhotos, newFoto];
        
        // If this is the first photo, set it as main
        if (allPhotos.length === 1) {
          editedEntidade.url_foto = result.url;
        }
        
        nextOrdem++;
      }
      
      // Clear the selected files after successful upload
      imageFiles = [];
      imagePreviews = [];
      
    } catch (error) {
      console.error('❌ Error uploading images:', error);
      uploadError = error instanceof Error ? error.message : 'Erro ao fazer upload das imagens';
      throw error; // Re-throw to prevent save if upload fails
    } finally {
      isUploadingImage = false;
    }
  }

  async function removePhotoById(photoId: number, photoUrl: string) {
    if (!confirm('Tem certeza que deseja remover esta imagem?')) {
      return;
    }
    
    isUploadingImage = true;
    uploadError = null;
    
    try {
      // Delete from storage
      const path = storageService.extractPathFromUrl(photoUrl);
      if (path) {
        await storageService.deleteImage(path);
      }
      
      // Delete the foto record from database
      await supabaseService.deleteFoto(photoId);
      
      // Remove from local array
      allPhotos = allPhotos.filter(p => p.id !== photoId);
      
      // Update main photo if needed
      if (allPhotos.length > 0) {
        editedEntidade.url_foto = allPhotos[0].url_foto;
      } else {
        editedEntidade.url_foto = null;
      }
      
    } catch (error) {
      console.error('❌ Error removing image:', error);
      uploadError = error instanceof Error ? error.message : 'Erro ao remover imagem';
    } finally {
      isUploadingImage = false;
    }
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
      <h2 id="modal-title">{entidade ? 'Editar' : 'Criar'} Entidade</h2>
      
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
            bind:value={editedEntidade.nome}
            on:input={() => clearFieldError('nome')}
            class:error={validationErrors.nome}
            required
          />
          {#if validationErrors.nome}
            <span class="field-error">{validationErrors.nome}</span>
          {/if}
        </div>
        <div class="form-group">
          <label for="tipo">Tipo: <span class="required">*</span></label>
          <select 
            id="tipo" 
            bind:value={editedEntidade.tipo}
            on:change={() => clearFieldError('tipo')}
            class:error={validationErrors.tipo}
            required
          >
            <option value="">Selecione um tipo</option>
            {#each tipos as tipo}
              <option value={tipo}>{tipo}</option>
            {/each}
          </select>
          {#if validationErrors.tipo}
            <span class="field-error">{validationErrors.tipo}</span>
          {/if}
        </div>
        <div class="form-group">
          <label for="diocese">Diocese:</label>
          <select 
            id="diocese" 
            bind:value={editedEntidade.id_diocese}
          >
            <option value={null}>Selecione uma diocese</option>
            {#each dioceses as diocese}
              <option value={diocese.id}>
                {diocese.nome} - {diocese.loc_sede || ''} ({getJurisdicaoLabel(diocese.jurisdicao as Jurisdicao)})
              </option>
            {/each}
          </select>
        </div>
        <div class="form-group">
          <label for="reitor">Reitor</label>
          <div class="clero-dropdown-container">
            <div class="clero-input-wrapper">
              <input 
                type="text" 
                placeholder="Buscar e selecionar clérigo..."
                bind:value={cleroSearchQuery}
                on:focus={handleCleroInputFocus}
                on:blur={handleCleroInputBlur}
                class="clero-search-input"
                autocomplete="off"
              />
              {#if editedEntidade.id_reitor}
                <button 
                  type="button" 
                  class="clear-selection-btn"
                  on:click={clearCleroSelection}
                  title="Limpar seleção"
                >
                  ✕
                </button>
              {/if}
            </div>
            {#if showCleroDropdown}
              <div class="clero-dropdown-list" transition:fade={{ duration: 150 }}>
                {#if filteredCleroList.length > 0}
                  {#each filteredCleroList as clerigo}
                    <div 
                      class="clero-dropdown-item"
                      class:selected={editedEntidade.id_reitor === clerigo.id}
                      on:mousedown={() => selectClerigo(clerigo)}
                      role="button"
                      tabindex="0"
                    >
                      <div class="clerigo-name">
                        {clerigo.titulo ? `${clerigo.titulo} ` : ''}{clerigo.nome_completo}
                      </div>
                      {#if clerigo.email}
                        <div class="clerigo-email">{clerigo.email}</div>
                      {/if}
                    </div>
                  {/each}
                {:else}
                  <div class="clero-dropdown-item no-results">
                    Nenhum clérigo encontrado
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </div>
        <div class="form-group">
          <label for="status">Status:</label>
          <select 
            id="status" 
            bind:value={editedEntidade.status}
          >
            <option value="">Selecione um status</option>
            <option value="ativa">Ativa</option>
            <option value="desativada">Desativada</option>
          </select>
        </div>
        <div class="form-group">
          <label for="endereco">Endereço: <span class="required">*</span></label>
          <input 
            id="endereco" 
            type="text" 
            bind:value={editedEntidade.endereco}
            on:input={() => clearFieldError('endereco')}
            class:error={validationErrors.endereco}
            required
          />
          {#if validationErrors.endereco}
            <span class="field-error">{validationErrors.endereco}</span>
          {/if}
        </div>
        <div class="form-group">
          <label for="cidade">Cidade: <span class="required">*</span></label>
          <input 
            id="cidade" 
            type="text" 
            bind:value={editedEntidade.cidade}
            on:input={() => clearFieldError('cidade')}
            class:error={validationErrors.cidade}
            required
          />
          {#if validationErrors.cidade}
            <span class="field-error">{validationErrors.cidade}</span>
          {/if}
        </div>
        <div class="form-group">
          <label for="estado">Estado: <span class="required">*</span></label>
          <select 
            id="estado" 
            bind:value={editedEntidade.estado}
            on:change={() => clearFieldError('estado')}
            class:error={validationErrors.estado}
            required
          >
            <option value="">Selecione um estado</option>
            {#each ESTADOS_BRASIL as estado}
              <option value={estado.sigla}>{estado.sigla} - {estado.nome}</option>
            {/each}
          </select>
          {#if validationErrors.estado}
            <span class="field-error">{validationErrors.estado}</span>
          {/if}
        </div>
        <div class="form-group">
          <label for="cep">CEP: <span class="required">*</span></label>
          <input 
            id="cep" 
            type="text" 
            bind:value={editedEntidade.cep} 
            on:input={handleCepInput}
            placeholder="12345-678 ou 12345678"
            maxlength="9"
            class:error={validationErrors.cep}
            required
          />
          {#if validationErrors.cep}
            <span class="field-error">{validationErrors.cep}</span>
          {/if}
        </div>
        <div class="form-group">
          <label for="telefone">Telefone:</label>
          <input 
            id="telefone" 
            type="text" 
            bind:value={editedEntidade.telefone}
            on:input={() => clearFieldError('telefone')}
          />
        </div>
        <div class="form-group">
          <label for="email">Email:</label>
          <input 
            id="email" 
            type="email" 
            bind:value={editedEntidade.email}
            on:input={() => clearFieldError('email')}
            class:error={validationErrors.email}
          />
          {#if validationErrors.email}
            <span class="field-error">{validationErrors.email}</span>
          {/if}
        </div>
        <div class="form-group">
          <label for="website">Website:</label>
          <input 
            id="website" 
            type="text" 
            bind:value={editedEntidade.website}
            on:input={() => clearFieldError('website')}
            class:error={validationErrors.website}
            placeholder="https://exemplo.com"
          />
          {#if validationErrors.website}
            <span class="field-error">{validationErrors.website}</span>
          {/if}
        </div>
        <div class="form-group">
          <label for="link_maps">Link do Google Maps:</label>
          <input 
            id="link_maps" 
            type="text" 
            bind:value={editedEntidade.link_maps}
            on:input={() => clearFieldError('link_maps')}
            class:error={validationErrors.link_maps}
            placeholder="https://maps.google.com/..."
          />
          {#if validationErrors.link_maps}
            <span class="field-error">{validationErrors.link_maps}</span>
          {/if}
        </div>
        <div class="form-group">
          <label for="descricao">Descrição:</label>
          <textarea 
            id="descricao" 
            value={editedEntidade.descricao || ''}
            on:input={(e) => {
              editedEntidade.descricao = e.currentTarget.value;
              clearFieldError('descricao');
            }}
            rows="4"
            placeholder="Digite uma descrição sobre a entidade..."
          ></textarea>
        </div>
        
        <!-- Image Upload Section -->
        <div class="image-section">
          <h3>Imagens da Entidade</h3>
          
          {#if !editedEntidade.id}
            <!-- Create mode - show info message only -->
            <p class="info-message">
              ℹ️ Salve a entidade primeiro clicando em "Criar", depois você poderá adicionar imagens.
            </p>
          {:else}
            <!-- Edit mode - show image gallery and upload options -->
            {#if isLoadingPhotos}
              <p class="info-message">Carregando imagens...</p>
            {:else if allPhotos.length > 0}
              <div class="image-gallery">
                {#each allPhotos as photo (photo.id)}
                  <div class="gallery-item">
                    <img src={photo.url_foto} alt={photo.legenda || 'Imagem da entidade'} />
                    <div class="gallery-item-actions">
                      <button 
                        type="button" 
                        class="btn-danger-small" 
                        on:click={() => removePhotoById(photo.id, photo.url_foto)}
                        disabled={isUploadingImage}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="info-message">Nenhuma imagem adicionada ainda.</p>
            {/if}
            
            <!-- Drag and Drop Area -->
            <div 
              class="drop-zone {isDragging ? 'dragging' : ''}"
              on:dragover={handleDragOver}
              on:dragleave={handleDragLeave}
              on:drop={handleDrop}
              on:click={() => document.getElementById('image-upload')?.click()}
              on:keydown={(e) => e.key === 'Enter' && document.getElementById('image-upload')?.click()}
              role="button"
              tabindex="0"
            >
              <div class="drop-zone-content">
                <svg class="upload-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p class="drop-zone-text">
                  {#if isDragging}
                    Solte as imagens aqui
                  {:else}
                    Arraste imagens aqui ou clique para selecionar
                  {/if}
                </p>
                <p class="drop-zone-hint">Suporta múltiplas imagens (máx. 5MB cada)</p>
              </div>
            </div>
            
            <input 
              id="image-upload" 
              type="file" 
              accept="image/*"
              multiple
              on:change={handleImageSelect}
              disabled={isUploadingImage}
              style="display: none;"
            />
            
            {#if imageFiles.length > 0}
              <div class="selected-images">
                <h4>Imagens selecionadas ({imageFiles.length})</h4>
                <div class="image-gallery">
                  {#each imagePreviews as preview, index (index)}
                    <div class="gallery-item">
                      <img src={preview} alt="Imagem selecionada {index + 1}" />
                      <div class="gallery-item-actions">
                        <button 
                          type="button" 
                          class="btn-danger-small" 
                          on:click={() => removeSelectedImage(index)}
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  {/each}
                </div>
                <div class="preview-actions">
                  <p class="image-ready-message">✓ {imageFiles.length} imagem(ns) pronta(s) para ser(em) enviada(s) ao salvar</p>
                  <button 
                    type="button" 
                    class="btn-cancel-image" 
                    on:click={cancelImageSelection}
                  >
                    ✕ Cancelar todas
                  </button>
                </div>
              </div>
            {/if}
            
            {#if uploadError}
              <div class="error-message">
                {uploadError}
              </div>
            {/if}
          {/if}
        </div>
        
        <!-- Seção de Coordenadas -->
        <div class="coordinates-section">
          <h3>Coordenadas Geográficas</h3>
          
          {#if addressChanged}
            <div class="address-changed-warning">
              <p>⚠️ O CEP ou cidade foi alterado. Recalcule as coordenadas para manter a localização atualizada.</p>
              <button type="button" class="btn-geocode" on:click={recalcularCoordenadas} disabled={isGeocodingLoading}>
                {isGeocodingLoading ? 'Calculando...' : 'Recalcular Coordenadas'}
              </button>
            </div>
          {:else}
            <button type="button" class="btn-geocode" on:click={recalcularCoordenadas} disabled={isGeocodingLoading}>
              {isGeocodingLoading ? 'Calculando...' : 'Calcular Coordenadas'}
            </button>
          {/if}
          
          {#if geocodingError}
            <div class="error-message">
              {geocodingError}
            </div>
          {/if}
          
          <div class="coordinates-display">
            <div class="coordinate-item">
              <strong>Latitude:</strong> {editedEntidade.latitude ? editedEntidade.latitude.toFixed(6) : 'Não calculada'}
            </div>
            <div class="coordinate-item">
              <strong>Longitude:</strong> {editedEntidade.longitude ? editedEntidade.longitude.toFixed(6) : 'Não calculada'}
            </div>
          </div>
        </div>
        <div class="actions">
          {#if entidade && entidade.id}
            <button type="button" class="btn-danger" on:click={handleDelete} disabled={isSaving}>Excluir</button>
          {/if}
          <button type="submit" class="btn-primary" disabled={isSaving}>
            {#if isSaving}
              {imageFiles.length > 0 && editedEntidade.id ? `Salvando e enviando ${imageFiles.length} imagem(ns)...` : entidade ? 'Salvando...' : 'Criando...'}
            {:else}
              {entidade ? 'Salvar' : 'Criar'}
            {/if}
          </button>
          <button type="button" class="btn-secondary" on:click={closeModal} disabled={isSaving}>Cancelar</button>
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
      <h3>Confirmar Exclusão</h3>
      <p>Tem certeza de que deseja excluir esta entidade? Esta ação não pode ser desfeita.</p>
      <div class="confirmation-actions">
        <button type="button" class="btn-danger" on:click={confirmDelete}>Sim, Excluir</button>
        <button type="button" class="btn-secondary" on:click={cancelDelete}>Cancelar</button>
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
    max-height: 90vh;
    overflow-y: auto;
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
  textarea {
    padding: 0.75rem;
    border: 1px solid #E6D7CC;
    border-radius: 4px;
    font-size: 1rem;
    transition: border-color 0.2s;
    font-family: inherit;
    resize: vertical;
    min-height: 100px;
  }
  input:focus, select:focus {
    outline: none;
    border-color: #CF4A46;
    box-shadow: 0 0 0 2px rgba(207, 74, 70, 0.25);
  }
  textarea:focus {
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
  
  .coordinates-section {
    border-top: 1px solid #F9F5F2;
    padding-top: 1.5rem;
    margin-top: 1rem;
  }
  
  .coordinates-section h3 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 1.1rem;
    font-weight: 600;
  }
  
  .coordinates-display {
    background-color: #F9F5F2;
    border: 1px solid #E6D7CC;
    border-radius: 4px;
    padding: 1rem;
    margin-top: 1rem;
  }
  
  .coordinate-item {
    margin-bottom: 0.5rem;
    font-size: 0.95rem;
  }
  
  .coordinate-item:last-child {
    margin-bottom: 0;
  }
  
  .btn-geocode {
    background-color: #28a745;
    color: white;
    margin-bottom: 1rem;
  }
  
  .btn-geocode:hover:not(:disabled) {
    background-color: #218838;
  }
  
  .btn-geocode:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
  
  .address-changed-warning {
    background-color: #fff3cd;
    border: 1px solid #ffeeba;
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .address-changed-warning p {
    margin: 0 0 0.5rem 0;
    color: #856404;
    font-size: 0.9rem;
  }
  
  .error-message {
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
    padding: 0.75rem;
    margin-bottom: 1rem;
    color: #721c24;
    font-size: 0.9rem;
  }
  
  .image-section {
    border-top: 1px solid #F9F5F2;
    padding-top: 1.5rem;
    margin-top: 1rem;
  }
  
  .image-section h3 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 1.1rem;
    font-weight: 600;
  }
  
  .image-gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .gallery-item {
    position: relative;
    border: 1px solid #E6D7CC;
    border-radius: 4px;
    overflow: hidden;
    background-color: #F9F5F2;
  }
  
  .gallery-item img {
    width: 100%;
    height: 150px;
    object-fit: cover;
    display: block;
  }
  
  .gallery-item-actions {
    padding: 0.5rem;
    background-color: #F9F5F2;
    display: flex;
    justify-content: center;
  }
  
  .selected-images {
    margin-top: 1rem;
    border: 1px solid #E6D7CC;
    border-radius: 4px;
    padding: 1rem;
    background-color: #F9F5F2;
  }
  
  .selected-images h4 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 1rem;
    font-weight: 600;
  }
  
  .preview-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  
  .image-ready-message {
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
    padding: 0.75rem;
    border-radius: 4px;
    text-align: center;
    margin: 0;
    font-size: 0.95rem;
    font-weight: 500;
    flex: 1;
  }
  
  .btn-cancel-image {
    padding: 0.75rem 1rem;
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.2s;
    white-space: nowrap;
  }
  
  .btn-cancel-image:hover {
    background-color: #5a6268;
  }
  
  .drop-zone {
    position: relative;
    border: 2px dashed #E6D7CC;
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    background-color: #FDFCFB;
    transition: all 0.3s ease;
    cursor: pointer;
    margin-bottom: 1rem;
  }
  
  .drop-zone:hover {
    border-color: #CF4A46;
    background-color: #FFF5F4;
  }
  
  .drop-zone.dragging {
    border-color: #CF4A46;
    background-color: #FFF5F4;
    border-width: 3px;
    transform: scale(1.02);
  }
  
  .drop-zone-content {
    pointer-events: none;
  }
  
  .upload-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 1rem;
    color: #CF4A46;
  }
  
  .drop-zone-text {
    font-size: 1.1rem;
    color: #333;
    margin: 0 0 0.5rem 0;
    font-weight: 500;
  }
  
  .drop-zone-hint {
    font-size: 0.9rem;
    color: #666;
    margin: 0;
  }
  
  .btn-danger-small {
    padding: 0.5rem 1rem;
    background-color: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .btn-danger-small:hover:not(:disabled) {
    background-color: #c82333;
  }
  
  .btn-danger-small:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
  
  .info-message {
    background-color: #d1ecf1;
    border: 1px solid #bee5eb;
    border-radius: 4px;
    padding: 0.75rem;
    margin-bottom: 1rem;
    color: #0c5460;
    font-size: 0.9rem;
  }

  /* Clero Dropdown Styles */
  .clero-dropdown-container {
    position: relative;
    width: 100%;
  }

  .clero-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .clero-search-input {
    width: 100%;
    padding: 0.75rem;
    padding-right: 2.5rem;
    border: 1px solid #E6D7CC;
    border-radius: 4px;
    font-size: 0.95rem;
    background-color: #FDFCFB;
    transition: all 0.2s;
  }

  .clero-search-input:focus {
    outline: none;
    border-color: #CF4A46;
    background-color: white;
    box-shadow: 0 0 0 3px rgba(207, 74, 70, 0.1);
  }

  .clear-selection-btn {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #999;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    transition: all 0.2s;
    line-height: 1;
  }

  .clear-selection-btn:hover {
    background-color: #f8f8f8;
    color: #CF4A46;
  }

  .clero-dropdown-list {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    max-height: 300px;
    overflow-y: auto;
    background-color: white;
    border: 1px solid #E6D7CC;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
  }

  .clero-dropdown-item {
    padding: 0.75rem;
    cursor: pointer;
    transition: background-color 0.15s;
    border-bottom: 1px solid #F9F5F2;
  }

  .clero-dropdown-item:last-child {
    border-bottom: none;
  }

  .clero-dropdown-item:hover {
    background-color: #FFF5F4;
  }

  .clero-dropdown-item.selected {
    background-color: #FFF5F4;
    border-left: 3px solid #CF4A46;
  }

  .clero-dropdown-item.no-results {
    color: #999;
    cursor: default;
    text-align: center;
    font-style: italic;
  }

  .clero-dropdown-item.no-results:hover {
    background-color: transparent;
  }

  .clerigo-name {
    font-weight: 500;
    color: #333;
    margin-bottom: 0.25rem;
  }

  .clerigo-email {
    font-size: 0.85rem;
    color: #666;
  }

  .clero-dropdown-list::-webkit-scrollbar {
    width: 8px;
  }

  .clero-dropdown-list::-webkit-scrollbar-track {
    background: #F9F5F2;
  }

  .clero-dropdown-list::-webkit-scrollbar-thumb {
    background: #E6D7CC;
    border-radius: 4px;
  }

  .clero-dropdown-list::-webkit-scrollbar-thumb:hover {
    background: #CF4A46;
  }
</style>


