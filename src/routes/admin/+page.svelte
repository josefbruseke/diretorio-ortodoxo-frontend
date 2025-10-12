<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
  import { supabase } from '$lib/supabaseClient.js';
  import { dataService } from '$lib/dataService.js';
  import type { ApiEntidade, ApiDiocese, ApiClero } from '$lib/api.js';
  import type { EntidadeEclesiastica, Diocese } from '$lib/types.js';
  import EditEntidadeModal from '$lib/components/EditEntidadeModal.svelte';
  import EditDioceseModal from '$lib/components/EditDioceseModal.svelte';
  import EditCleroModal from '$lib/components/EditCleroModal.svelte';

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

  async function loadData(table: 'entidades' | 'dioceses' | 'clero') {
    loading = true;
    error = null;
    activeTable = table;

    try {
      if (table === 'entidades') {
        const data = await dataService.getEntidades();
        // Convert to ApiEntidade format for compatibility with existing modals
        entidades = data.map((e: EntidadeEclesiastica & { diocese: Diocese }): ApiEntidade => ({
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
          diocese: e.diocese ? {
            id: e.diocese.id,
            nome: e.diocese.nome,
            jurisdicao: e.diocese.jurisdicao,
            loc_sede: e.diocese.loc_sede
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
        descricao: updatedEntidade.descricao,
        latitude: updatedEntidade.latitude,
        longitude: updatedEntidade.longitude,
        url_foto: updatedEntidade.url_foto
      };
      
      let savedEntidade: ApiEntidade | undefined;
      if (selectedEntidade && selectedEntidade.id) {
        // Update existing
        savedEntidade = await dataService.updateEntidade(updatedEntidade.id, dataToSave);
        
        if (savedEntidade) {
          const index = entidades.findIndex((e) => e.id === savedEntidade!.id);
          if (index !== -1) {
            // Convert back to ApiEntidade format
            entidades[index] = {
              ...entidades[index],
              id: savedEntidade.id,
              nome: savedEntidade.nome,
              tipo: savedEntidade.tipo,
              endereco: savedEntidade.endereco,
              cidade: savedEntidade.cidade,
              estado: savedEntidade.estado,
              cep: savedEntidade.cep,
              telefone: savedEntidade.telefone,
              email: savedEntidade.email,
              website: savedEntidade.website,
              descricao: savedEntidade.descricao,
              latitude: savedEntidade.latitude,
              longitude: savedEntidade.longitude,
              url_foto: savedEntidade.url_foto
            };
            entidades = entidades; // Trigger reactivity
          }
        }
      } else {
        // Create new
        // For create, we need to include id_diocese
        const createData = {
          ...dataToSave,
          id_diocese: 1 // Default diocese, should be made configurable
        };
        savedEntidade = await dataService.createEntidade(createData);
        
        if (savedEntidade) {
          // Add to the list
          entidades = [...entidades, savedEntidade];
          
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
      error = `Failed to delete entidade: ${e.message}`;
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
      error = `Failed to delete diocese: ${e.message}`;
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
      error = `Failed to delete clerigo: ${e.message}`;
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
      <div class="table-header">
        <button class="create-btn" on:click={openCreateEntidadeModal}>Create New Entidade</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Tipo</th>
            <th>Cidade</th>
            <th>Estado</th>
            <th>Latitude</th>
            <th>Longitude</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {#each entidades as entidade}
            <tr>
              <td>{entidade.id}</td>
              <td>{entidade.nome}</td>
              <td>{entidade.tipo}</td>
              <td>{entidade.cidade}</td>
              <td>{entidade.estado}</td>
              <td>{entidade.latitude ? entidade.latitude.toFixed(6) : '-'}</td>
              <td>{entidade.longitude ? entidade.longitude.toFixed(6) : '-'}</td>
              <td><button on:click={() => openEditEntidadeModal(entidade)}>Edit</button></td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else if activeTable === 'dioceses'}
      <!-- Dioceses Table -->
      <div class="table-header">
        <button class="create-btn" on:click={openCreateDioceseModal}>Create New Diocese</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Jurisdição</th>
            <th>Sede</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {#each dioceses as diocese}
            <tr>
              <td>{diocese.id}</td>
              <td>{diocese.nome}</td>
              <td>{diocese.jurisdicao}</td>
              <td>{diocese.loc_sede}</td>
              <td><button on:click={() => openEditDioceseModal(diocese)}>Edit</button></td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else if activeTable === 'clero'}
      <!-- Clero Table -->
      <div class="table-header">
        <button class="create-btn" on:click={openCreateCleroModal}>Create New Clerigo</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome Completo</th>
            <th>Título</th>
            <th>Email</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {#each clero as clerigo}
            <tr>
              <td>{clerigo.id}</td>
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
