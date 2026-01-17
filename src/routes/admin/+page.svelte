<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
  import { supabase } from '$lib/supabaseClient.js';
  import { dataService } from '$lib/dataService.js';
  import type { ApiEntidade, ApiDiocese, ApiClero } from '$lib/api.js';
  import type { EntidadeEclesiastica, Diocese, Jurisdicao } from '$lib/types.js';
  import EditEntidadeModal from '$lib/components/EditEntidadeModal.svelte';
  import EditDioceseModal from '$lib/components/EditDioceseModal.svelte';
  import EditCleroModal from '$lib/components/EditCleroModal.svelte';
  import { getJurisdicaoLabel } from '$lib/utils.js';

  // Auth state
  let user = writable<User | null>(null);
  let authLoading = true;
  let loginEmail = '';
  let loginPassword = '';
  let loginError = '';

  let activeTable: 'entidades' | 'dioceses' | 'clero' = 'entidades';
  let entidades: ApiEntidade[] = [];
  let dioceses: ApiDiocese[] = [];
  let clero: ApiClero[] = [];
  let error: string | null = null;
  let loading = true;

  let showEditEntidadeModal = false;
  let selectedEntidade: ApiEntidade | null = null;

  let showEditDioceseModal = false;
  let selectedDiocese: ApiDiocese | null = null;

  let showEditCleroModal = false;
  let selectedClerigo: ApiClero | null = null;

  // Search and filter state
  let searchQuery = '';
  let selectedTipo = '';
  let selectedEstado = '';
  let selectedStatus = '';
  let selectedJurisdicao = '';

  // Computed filtered data
  $: filteredEntidades = entidades.filter(e => {
    const matchesSearch = !searchQuery || 
      e.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.cidade && e.cidade.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.endereco && e.endereco.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTipo = !selectedTipo || e.tipo === selectedTipo;
    const matchesEstado = !selectedEstado || e.estado === selectedEstado;
    const matchesStatus = !selectedStatus || e.status === selectedStatus;
    return matchesSearch && matchesTipo && matchesEstado && matchesStatus;
  });

  $: filteredDioceses = dioceses.filter(d => {
    const matchesSearch = !searchQuery || 
      d.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.loc_sede && d.loc_sede.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesJurisdicao = !selectedJurisdicao || d.jurisdicao === selectedJurisdicao;
    return matchesSearch && matchesJurisdicao;
  });

  $: filteredClero = clero.filter(c => {
    const matchesSearch = !searchQuery || 
      c.nome_completo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.titulo && c.titulo.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  // Get unique values for filters
  $: tipoOptions = [...new Set(entidades.map(e => e.tipo))].sort();
  $: estadoOptions = [...new Set(entidades.map(e => e.estado))].filter(Boolean).sort();
  $: statusOptions = [...new Set(entidades.map(e => e.status))].filter(Boolean).sort();
  $: jurisdicaoOptions = [...new Set(dioceses.map(d => d.jurisdicao))].filter(Boolean).sort();

  function resetFilters() {
    searchQuery = '';
    selectedTipo = '';
    selectedEstado = '';
    selectedStatus = '';
    selectedJurisdicao = '';
  }

  async function loadData(table: 'entidades' | 'dioceses' | 'clero') {
    loading = true;
    error = null;
    activeTable = table;
    resetFilters(); // Reset filters when switching tables

    try {
      if (table === 'entidades') {
        const data = await dataService.getEntidades();
        // Convert to ApiEntidade format for compatibility with existing modals
        entidades = data.map((e: EntidadeEclesiastica & { diocese?: Diocese }): ApiEntidade => ({
          id: e.id,
          nome: e.nome,
          tipo: e.tipo,
          endereco: e.endereco,
          cidade: e.cidade,
          estado: e.estado,
          cep: e.cep,
          telefone: e.telefone,
          email: e.email,
          website: e.website,
          descricao: e.descricao,
          url_foto: e.url_foto,
          latitude: e.latitude,
          longitude: e.longitude,
          status: e.status,
          id_diocese: e.id_diocese,
          id_reitor: e.id_reitor,
          diocese: e.diocese ? {
            id: e.diocese.id,
            nome: e.diocese.nome,
            jurisdicao: e.diocese.jurisdicao,
            loc_sede: e.diocese.loc_sede
          } : undefined,
          reitor: (e as any).reitorInfo ? {
            id: (e as any).reitorInfo.id,
            nome_completo: (e as any).reitorInfo.nome_completo,
            titulo: (e as any).reitorInfo.titulo || '',
            email: (e as any).reitorInfo.email || ''
          } : undefined
        }));
      } else if (table === 'dioceses') {
        const data = await dataService.getDioceses();
        // Convert to ApiDiocese format for compatibility with existing modals
        dioceses = data.map((d: Diocese): ApiDiocese => ({
          id: d.id,
          nome: d.nome,
          jurisdicao: d.jurisdicao,
          loc_sede: d.loc_sede
        }));
      } else if (table === 'clero') {
        const data = await dataService.getClero();
        clero = data || [];
      }
    } catch (e: any) {
      console.error('Error loading data:', e);
      error = e.message;
    } finally {
      loading = false;
    }
  }

  // Entidade Modal
  function openEditEntidadeModal(entidade: ApiEntidade) {
    selectedEntidade = entidade;
    showEditEntidadeModal = true;
  }

  function openCreateEntidadeModal() {
    selectedEntidade = null;
    showEditEntidadeModal = true;
  }

  function closeEditEntidadeModal() {
    showEditEntidadeModal = false;
    selectedEntidade = null;
  }

  async function handleSaveEntidade(event: CustomEvent<{entidade: ApiEntidade, imageFile: File | null}>) {
    const { entidade: updatedEntidade, imageFile } = event.detail;
    
    try {
      const dataToSave: Partial<ApiEntidade> = {
        nome: updatedEntidade.nome,
        tipo: updatedEntidade.tipo,
        endereco: updatedEntidade.endereco,
        cidade: updatedEntidade.cidade,
        estado: updatedEntidade.estado,
        cep: updatedEntidade.cep,
        telefone: updatedEntidade.telefone,
        email: updatedEntidade.email,
        website: updatedEntidade.website,
        link_maps: updatedEntidade.link_maps,
        descricao: updatedEntidade.descricao,
        latitude: updatedEntidade.latitude,
        longitude: updatedEntidade.longitude,
        url_foto: updatedEntidade.url_foto,
        status: updatedEntidade.status,
        id_diocese: updatedEntidade.id_diocese,
        id_reitor: updatedEntidade.id_reitor
      };
      
      let savedEntidade: ApiEntidade | undefined;
      if (selectedEntidade && selectedEntidade.id) {
        // Update existing
        savedEntidade = await dataService.updateEntidade(updatedEntidade.id, dataToSave);
        
        if (savedEntidade) {
          // Reload the full entidade with relations to get the reitor info
          const fullEntidade = await dataService.getEntidade(savedEntidade.id);
          
          if (fullEntidade) {
            const index = entidades.findIndex((e) => e.id === savedEntidade!.id);
            if (index !== -1) {
              // Convert to ApiEntidade format with all relations
              entidades[index] = {
                id: fullEntidade.id,
                nome: fullEntidade.nome,
                tipo: fullEntidade.tipo,
                endereco: fullEntidade.endereco,
                cidade: fullEntidade.cidade,
                estado: fullEntidade.estado,
                cep: fullEntidade.cep,
                telefone: fullEntidade.telefone,
                email: fullEntidade.email,
                website: fullEntidade.website,
                link_maps: fullEntidade.link_maps,
                descricao: fullEntidade.descricao,
                latitude: fullEntidade.latitude,
                longitude: fullEntidade.longitude,
                url_foto: fullEntidade.url_foto,
                status: fullEntidade.status,
                id_diocese: fullEntidade.id_diocese,
                id_reitor: fullEntidade.id_reitor,
                diocese: fullEntidade.diocese ? {
                  id: fullEntidade.diocese.id,
                  nome: fullEntidade.diocese.nome,
                  jurisdicao: fullEntidade.diocese.jurisdicao,
                  loc_sede: fullEntidade.diocese.loc_sede
                } : undefined,
                reitor: (fullEntidade as any).reitorInfo ? {
                  id: (fullEntidade as any).reitorInfo.id,
                  nome_completo: (fullEntidade as any).reitorInfo.nome_completo,
                  titulo: (fullEntidade as any).reitorInfo.titulo || '',
                  email: (fullEntidade as any).reitorInfo.email || ''
                } : undefined
              };
              entidades = entidades; // Trigger reactivity
            }
          }
        }
      } else {
        // Create new
        savedEntidade = await dataService.createEntidade(dataToSave);
        
        if (savedEntidade) {
          // Reload the full entidade with relations to get the reitor info
          const fullEntidade = await dataService.getEntidade(savedEntidade.id);
          
          if (fullEntidade) {
            // Add to the list with complete data
            const newEntidade: ApiEntidade = {
              id: fullEntidade.id,
              nome: fullEntidade.nome,
              tipo: fullEntidade.tipo,
              endereco: fullEntidade.endereco,
              cidade: fullEntidade.cidade,
              estado: fullEntidade.estado,
              cep: fullEntidade.cep,
              telefone: fullEntidade.telefone,
              email: fullEntidade.email,
              website: fullEntidade.website,
              link_maps: fullEntidade.link_maps,
              descricao: fullEntidade.descricao,
              latitude: fullEntidade.latitude,
              longitude: fullEntidade.longitude,
              url_foto: fullEntidade.url_foto,
              status: fullEntidade.status,
              id_diocese: fullEntidade.id_diocese,
              id_reitor: fullEntidade.id_reitor,
              diocese: fullEntidade.diocese ? {
                id: fullEntidade.diocese.id,
                nome: fullEntidade.diocese.nome,
                jurisdicao: fullEntidade.diocese.jurisdicao,
                loc_sede: fullEntidade.diocese.loc_sede
              } : undefined,
              reitor: (fullEntidade as any).reitorInfo ? {
                id: (fullEntidade as any).reitorInfo.id,
                nome_completo: (fullEntidade as any).reitorInfo.nome_completo,
                titulo: (fullEntidade as any).reitorInfo.titulo || '',
                email: (fullEntidade as any).reitorInfo.email || ''
              } : undefined
            };
            
            entidades = [...entidades, newEntidade];
          }
          
          // If there's an image file to upload, update the modal with the new ID
          if (imageFile) {
            selectedEntidade = savedEntidade;
            // Don't close modal yet - let user upload the image
            error = null;
            return;
          }
        }
      }
      
      closeEditEntidadeModal();
      error = null; // Clear any previous errors
    } catch (e: any) {
      error = `Failed to save entidade: ${e.message}`;
    }
  }

  // Diocese Modal
  function openEditDioceseModal(diocese: ApiDiocese) {
    selectedDiocese = diocese;
    showEditDioceseModal = true;
  }

  function openCreateDioceseModal() {
    selectedDiocese = null;
    showEditDioceseModal = true;
  }

  function closeEditDioceseModal() {
    showEditDioceseModal = false;
    selectedDiocese = null;
  }

  async function handleSaveDiocese(event: CustomEvent<ApiDiocese>) {
    const updatedDiocese = event.detail;
    
    try {
      const dataToSave: Partial<ApiDiocese> = {
        nome: updatedDiocese.nome,
        jurisdicao: updatedDiocese.jurisdicao,
        loc_sede: updatedDiocese.loc_sede,
      };
      
      let savedDiocese: ApiDiocese | undefined;
      if (selectedDiocese && selectedDiocese.id) {
        // Update existing
        savedDiocese = await dataService.updateDiocese(updatedDiocese.id, dataToSave);
        
        if (savedDiocese) {
          const index = dioceses.findIndex((d) => d.id === savedDiocese!.id);
          if (index !== -1) {
            dioceses[index] = {
              ...dioceses[index],
              id: savedDiocese.id,
              nome: savedDiocese.nome,
              jurisdicao: savedDiocese.jurisdicao,
              loc_sede: savedDiocese.loc_sede
            };
            dioceses = dioceses; // Trigger reactivity
          }
        }
      } else {
        // Create new
        savedDiocese = await dataService.createDiocese(dataToSave);
        
        if (savedDiocese) {
          // Add to the list
          dioceses = [...dioceses, savedDiocese];
        }
      }
      
      closeEditDioceseModal();
      error = null; // Clear any previous errors
    } catch (e: any) {
      error = `Failed to save diocese: ${e.message}`;
    }
  }

  // Clero Modal
  function openEditCleroModal(clerigo: ApiClero) {
    selectedClerigo = clerigo;
    showEditCleroModal = true;
  }

  function openCreateCleroModal() {
    selectedClerigo = null;
    showEditCleroModal = true;
  }

  function closeEditCleroModal() {
    showEditCleroModal = false;
    selectedClerigo = null;
  }

  async function handleSaveClero(event: CustomEvent<ApiClero>) {
    const updatedClero = event.detail;
    
    try {
      const dataToSave: Partial<ApiClero> = {
        nome_completo: updatedClero.nome_completo,
        titulo: updatedClero.titulo,
        email: updatedClero.email,
        id_diocese_auxiliar: updatedClero.id_diocese_auxiliar
      };
      
      let savedClero: ApiClero | undefined;
      if (selectedClerigo && selectedClerigo.id) {
        // Update existing
        savedClero = await dataService.updateClero(updatedClero.id, dataToSave);
        
        if (savedClero) {
          const index = clero.findIndex((c) => c.id === savedClero!.id);
          if (index !== -1) {
            clero[index] = savedClero;
            clero = clero; // Trigger reactivity
          }
        }
      } else {
        // Create new
        savedClero = await dataService.createClero(dataToSave);
        
        if (savedClero) {
          // Add to the list
          clero = [...clero, savedClero];
        }
      }
      
      closeEditCleroModal();
      error = null; // Clear any previous errors
    } catch (e: any) {
      error = `Failed to save clero: ${e.message}`;
    }
  }

  async function handleDeleteEntidade(event: CustomEvent<number>) {
    const id = event.detail;
    
    try {
      await dataService.deleteEntidade(id);
      
      // Remove from local array
      entidades = entidades.filter((e) => e.id !== id);
      closeEditEntidadeModal();
      error = null; // Clear any previous errors
    } catch (e: any) {
      error = `Erro ao deletar entidade: ${e.message}`;
    }
  }

  async function handleDeleteDiocese(event: CustomEvent<number>) {
    const id = event.detail;
    
    try {
      await dataService.deleteDiocese(id);
      
      // Remove from local array
      dioceses = dioceses.filter((d) => d.id !== id);
      closeEditDioceseModal();
      error = null; // Clear any previous errors
    } catch (e: any) {
      error = `Erro ao deletar diocese: ${e.message}`;
    }
  }

  async function handleDeleteClero(event: CustomEvent<number>) {
    const id = event.detail;
    
    try {
      await dataService.deleteClero(id);
      
      // Remove from local array
      clero = clero.filter((c) => c.id !== id);
      closeEditCleroModal();
      error = null; // Clear any previous errors
    } catch (e: any) {
      error = `Erro ao deletar clérigo: ${e.message}`;
    }
  }

  async function handleLogin() {
    try {
      loginError = '';
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) {
        loginError = error.message;
      } else {
        // Login successful, user will be set via auth state change
      }
    } catch (err) {
      loginError = 'An unexpected error occurred';
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  onMount(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      user.set(session?.user ?? null);
      authLoading = false;
      if (session?.user) {
        loadData('entidades');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      user.set(session?.user ?? null);
      authLoading = false;
      if (session?.user) {
        loadData('entidades');
      }
    });

    return () => subscription.unsubscribe();
  });
</script>

<style>
  .container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  h1 {
    color: #333;
    margin-bottom: 2rem;
  }

  .tabs {
    display: flex;
    margin-bottom: 2rem;
    border-bottom: 2px solid #F9F5F2;
  }

  .tabs button {
    padding: 1rem 1.5rem;
    border: none;
    background-color: transparent;
    cursor: pointer;
    font-size: 1rem;
    color: #555;
    transition: all 0.3s ease;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
  }

  .tabs button.active {
    color: #CF4A46;
    border-bottom: 2px solid #CF4A46;
  }

  .tabs button:hover {
    background-color: #F9F5F2;
  }

  .table-header {
    margin-bottom: 1rem;
    text-align: right;
  }

  .create-btn {
    padding: 0.75rem 1.5rem;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.3s ease;
  }

  .create-btn:hover {
    background-color: #218838;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
    background-color: #fff;
    border-radius: 8px;
    overflow: hidden;
  }

  th,
  td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #F9F5F2;
  }

  th {
    background-color: #F9F5F2;
    font-weight: 600;
    color: #333;
  }

  tbody tr:hover {
    background-color: #F2EDE8;
  }

  td button {
    padding: 0.5rem 1rem;
    border: 1px solid #CF4A46;
    background-color: #CF4A46;
    color: white;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  td button:hover {
    background-color: #CF4A46;
    border-color: #CF4A46;
  }

  p {
    font-size: 1.2rem;
    text-align: center;
    margin-top: 3rem;
  }

  p[style*='color: red'] {
    color: #dc3545 !important;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    padding: 1rem;
    border-radius: 5px;
  }

  .login-container {
    max-width: 400px;
    margin: 2rem auto;
    padding: 2rem;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
  }

  .login-container h2 {
    text-align: center;
    margin-bottom: 2rem;
    color: #333;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #555;
  }

  .form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 1rem;
  }

  .form-group input:focus {
    outline: none;
    border-color: #CF4A46;
  }

  .login-btn {
    width: 100%;
    padding: 0.75rem;
    background-color: #CF4A46;
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .login-btn:hover {
    background-color: #b83c38;
  }

  .error {
    color: #dc3545;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    padding: 0.75rem;
    border-radius: 5px;
    margin-bottom: 1rem;
  }

  .logout-btn {
    float: right;
    padding: 0.5rem 1rem;
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .logout-btn:hover {
    background-color: #5a6268;
  }

  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: capitalize;
  }

  .status-ativa {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .status-desativada {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .forgot-password {
    text-align: center;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #eee;
  }

  .link-btn {
    background: none;
    border: none;
    color: #CF4A46;
    cursor: pointer;
    text-decoration: underline;
    font-size: 0.9rem;
    padding: 0;
  }

  .link-btn:hover {
    color: #b83c38;
  }

  .search-filters {
    margin-bottom: 1.5rem;
    padding: 1.5rem;
    background-color: #F9F5F2;
    border-radius: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: flex-end;
  }

  .filter-group {
    flex: 1;
    min-width: 200px;
  }

  .filter-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #555;
    font-size: 0.9rem;
  }

  .filter-group input,
  .filter-group select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 0.9rem;
    background-color: white;
  }

  .filter-group input:focus,
  .filter-group select:focus {
    outline: none;
    border-color: #CF4A46;
  }

  .reset-filters-btn {
    padding: 0.5rem 1rem;
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.9rem;
    align-self: flex-end;
  }

  .reset-filters-btn:hover {
    background-color: #5a6268;
  }

  .results-count {
    margin: 1rem 0;
    color: #666;
    font-size: 0.9rem;
  }
</style>

<div class="container">
  {#if authLoading}
    <p>Loading authentication...</p>
  {:else if $user}
    <h1>Admin Dashboard</h1>
    <button class="logout-btn" on:click={handleLogout}>Logout</button>

    <div class="tabs">
      <button class:active={activeTable === 'entidades'} on:click={() => loadData('entidades')}>
        Entidades
      </button>
      <button class:active={activeTable === 'dioceses'} on:click={() => loadData('dioceses')}>
        Dioceses
      </button>
      <button class:active={activeTable === 'clero'} on:click={() => loadData('clero')}>
        Clero
      </button>
    </div>

  {#if loading}
    <p>Loading...</p>
  {:else if error}
    <p style="color: red;">{error}</p>
  {:else}
    {#if activeTable === 'entidades'}
      <!-- Entidades Table -->
      <!-- Search and Filters -->
      <div class="search-filters">
        <div class="filter-group">
          <label for="search">Pesquisar</label>
          <input 
            type="text" 
            id="search" 
            placeholder="Buscar por nome, cidade ou endereço..." 
            bind:value={searchQuery}
          />
        </div>
        <div class="filter-group">
          <label for="tipo-filter">Tipo</label>
          <select id="tipo-filter" bind:value={selectedTipo}>
            <option value="">Todos os Tipos</option>
            {#each tipoOptions as tipo}
              <option value={tipo}>{tipo}</option>
            {/each}
          </select>
        </div>
        <div class="filter-group">
          <label for="estado-filter">Estado</label>
          <select id="estado-filter" bind:value={selectedEstado}>
            <option value="">Todos os Estados</option>
            {#each estadoOptions as estado}
              <option value={estado}>{estado}</option>
            {/each}
          </select>
        </div>
        <div class="filter-group">
          <label for="status-filter">Status</label>
          <select id="status-filter" bind:value={selectedStatus}>
            <option value="">Todos os Status</option>
            {#each statusOptions as status}
              <option value={status}>{status}</option>
            {/each}
          </select>
        </div>
        <button class="reset-filters-btn" on:click={resetFilters}>Limpar</button>
      </div>
      
      <div class="results-count">
        Mostrando {filteredEntidades.length} de {entidades.length} entidades
      </div>

      <div class="table-header">
        <button class="create-btn" on:click={openCreateEntidadeModal}>Create New Entidade</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Tipo</th>
            <th>Diocese</th>
            <th>Reitor</th>
            <th>Cidade</th>
            <th>Estado</th>
            <th>Status</th>
            <th>Latitude</th>
            <th>Longitude</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredEntidades as entidade}
            <tr>
              <td>{entidade.nome}</td>
              <td>{entidade.tipo}</td>
              <td>{entidade.diocese?.nome || '-'}</td>
              <td>{entidade.reitor ? `${entidade.reitor.titulo ? entidade.reitor.titulo + ' ' : ''}${entidade.reitor.nome_completo}` : '-'}</td>
              <td>{entidade.cidade}</td>
              <td>{entidade.estado}</td>
              <td>
                <span class="status-badge" class:status-ativa={entidade.status === 'ativa'} class:status-desativada={entidade.status === 'desativada'}>
                  {entidade.status || 'N/A'}
                </span>
              </td>
              <td>{entidade.latitude ? entidade.latitude.toFixed(6) : '-'}</td>
              <td>{entidade.longitude ? entidade.longitude.toFixed(6) : '-'}</td>
              <td><button on:click={() => openEditEntidadeModal(entidade)}>Edit</button></td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else if activeTable === 'dioceses'}
      <!-- Dioceses Table -->
      <!-- Search and Filters -->
      <div class="search-filters">
        <div class="filter-group">
          <label for="search">Pesquisar</label>
          <input 
            type="text" 
            id="search" 
            placeholder="Buscar por nome ou localização..." 
            bind:value={searchQuery}
          />
        </div>
        <div class="filter-group">
          <label for="jurisdicao-filter">Jurisdição</label>
          <select id="jurisdicao-filter" bind:value={selectedJurisdicao}>
            <option value="">Todas as Jurisdições</option>
            {#each jurisdicaoOptions as jurisdicao}
              <option value={jurisdicao}>{getJurisdicaoLabel(jurisdicao as Jurisdicao)}</option>
            {/each}
          </select>
        </div>
        <button class="reset-filters-btn" on:click={resetFilters}>Limpar</button>
      </div>
      
      <div class="results-count">
        Mostrando {filteredDioceses.length} de {dioceses.length} dioceses
      </div>

      <div class="table-header">
        <button class="create-btn" on:click={openCreateDioceseModal}>Create New Diocese</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Jurisdição</th>
            <th>Sede</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredDioceses as diocese}
            <tr>
              <td>{diocese.nome}</td>
              <td>{getJurisdicaoLabel(diocese.jurisdicao as Jurisdicao)}</td>
              <td>{diocese.loc_sede}</td>
              <td><button on:click={() => openEditDioceseModal(diocese)}>Edit</button></td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else if activeTable === 'clero'}
      <!-- Clero Table -->
      <!-- Search and Filters -->
      <div class="search-filters">
        <div class="filter-group">
          <label for="search">Pesquisar</label>
          <input 
            type="text" 
            id="search" 
            placeholder="Buscar por nome, título ou email..." 
            bind:value={searchQuery}
          />
        </div>
        <button class="reset-filters-btn" on:click={resetFilters}>Limpar</button>
      </div>
      
      <div class="results-count">
        Mostrando {filteredClero.length} de {clero.length} membros do clero
      </div>

      <div class="table-header">
        <button class="create-btn" on:click={openCreateCleroModal}>Create New Clerigo</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Nome Completo</th>
            <th>Título</th>
            <th>Email</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredClero as clerigo}
            <tr>
              <td>{clerigo.nome_completo}</td>
              <td>{clerigo.titulo}</td>
              <td>{clerigo.email}</td>
              <td><button on:click={() => openEditCleroModal(clerigo)}>Edit</button></td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  {/if}

  <!-- Modals -->
  {#if showEditEntidadeModal}
    <EditEntidadeModal
      entidade={selectedEntidade}
      showModal={showEditEntidadeModal}
      on:close={closeEditEntidadeModal}
      on:save={handleSaveEntidade}
      on:delete={handleDeleteEntidade}
    />
  {/if}

  {#if showEditDioceseModal}
    <EditDioceseModal
      diocese={selectedDiocese}
      showModal={showEditDioceseModal}
      on:close={closeEditDioceseModal}
      on:save={handleSaveDiocese}
      on:delete={handleDeleteDiocese}
    />
  {/if}

  {#if showEditCleroModal}
    <EditCleroModal
      clerigo={selectedClerigo}
      showModal={showEditCleroModal}
      on:close={closeEditCleroModal}
      on:save={handleSaveClero}
      on:delete={handleDeleteClero}
    />
  {/if}
  {/if}
</div>

<!-- Login Form -->
{#if !authLoading && !$user}
<div class="container">
  <div class="login-container">
    <h2>Admin Login</h2>
    <form on:submit|preventDefault={handleLogin}>
      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" bind:value={loginEmail} required />
      </div>
      <div class="form-group">
        <label for="password">Password:</label>
        <input type="password" id="password" bind:value={loginPassword} required />
      </div>
      {#if loginError}
        <p class="error">{loginError}</p>
      {/if}
      <button type="submit" class="login-btn">Login</button>
    </form>
    
    <div class="forgot-password">
      <button type="button" class="link-btn" on:click={() => window.location.href = '/admin/reset-password'}>
        Forgot your password?
      </button>
    </div>
  </div>
</div>
{/if}
