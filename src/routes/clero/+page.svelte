<script lang="ts">
  import { onMount } from 'svelte';
  import { dataService } from '$lib/dataService.js';
  import type { ApiClero } from '$lib/api.js';

  let clero: ApiClero[] = [];
  let filteredClero: ApiClero[] = [];
  let searchQuery = '';
  let loading = false;
  let error = '';

  onMount(async () => {
    loading = true;
    try {
      clero = await dataService.getClero();
      filteredClero = clero;
    } catch (e) {
      error = 'Erro ao carregar o clero. Tente novamente mais tarde.';
      console.error(e);
    } finally {
      loading = false;
    }
  });

  function handleSearch() {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      filteredClero = clero;
      return;
    }
    filteredClero = clero.filter(
      (c) =>
        c.nome_completo.toLowerCase().includes(q) ||
        c.titulo.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }

  function clearSearch() {
    searchQuery = '';
    filteredClero = clero;
  }
</script>

<svelte:head>
  <title>Clero — Diretório Ortodoxo Brasil</title>
  <meta name="description" content="Lista de todo o clero cadastrado no Diretório Ortodoxo Brasil" />
</svelte:head>

<div class="container">
  <header class="detail-header">
    <div class="breadcrumb">
      <a href="/">DIRETÓRIO ORTODOXO</a>
      <span>/</span>
      <span>CLERO</span>
    </div>
    <div class="header-content">
      <div class="entity-title">
        <h1>Clero Ortodoxo</h1>
        <p class="entity-type">Lista completa do clero cadastrado no Diretório</p>
      </div>
    </div>
  </header>

  <main class="main-content">
    <div class="search-bar">
      <div class="search-wrapper">
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Buscar por nome, título ou e-mail..."
          bind:value={searchQuery}
          on:input={handleSearch}
          class="search-input"
        />
        {#if searchQuery}
          <button class="clear-btn" on:click={clearSearch} aria-label="Limpar busca">✕</button>
        {/if}
      </div>
      {#if searchQuery}
        <p class="results-count">
          {filteredClero.length} resultado{filteredClero.length !== 1 ? 's' : ''} encontrado{filteredClero.length !== 1 ? 's' : ''}
        </p>
      {/if}
    </div>

    {#if loading}
      <div class="loading">
        <div class="spinner"></div>
        <p>Carregando clero...</p>
      </div>
    {:else if error}
      <div class="error">{error}</div>
    {:else if filteredClero.length === 0}
      <div class="empty">
        {#if searchQuery}
          Nenhum resultado encontrado para "<strong>{searchQuery}</strong>".
        {:else}
          Nenhum clero cadastrado.
        {/if}
      </div>
    {:else}
      <div class="clero-grid">
        {#each filteredClero as clerigo (clerigo.id)}
          <a class="clero-card" href="/clero/{clerigo.id}">
            <div class="card-avatar">
              <span class="avatar-initials">
                {clerigo.nome_completo.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <h2 class="card-nome">{clerigo.nome_completo}</h2>
          </a>
        {/each}
      </div>
    {/if}
  </main>
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    min-height: 100vh;
    background: #ffffff;
    box-shadow: 0 0 30px rgba(181, 101, 118, 0.1);
  }

  /* Header */
  .detail-header {
    background: linear-gradient(135deg, var(--cor-azul-constantinopolitano), var(--cor-azul-constantinopolitano));
    color: #ffffff;
    padding: 2rem;
    border-bottom: 4px solid var(--cor-ouro-bizantino);
  }

  .breadcrumb {
    margin-bottom: 1.5rem;
    font-size: 0.85rem;
    opacity: 0.9;
  }

  .breadcrumb a {
    color: #ffffff;
    text-decoration: none;
  }

  .breadcrumb a:hover {
    text-decoration: underline;
  }

  .breadcrumb span {
    margin: 0 0.35rem;
    color: var(--cor-cinza-neve);
  }

  .breadcrumb span:last-child {
    margin-right: 0;
    color: rgba(255, 255, 255, 0.75);
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  .entity-title h1 {
    margin: 0;
    font-size: 2.5rem;
    font-weight: 600;
    color: #ffffff;
  }

  .entity-type {
    margin: 0.5rem 0 0;
    font-size: 1rem;
    opacity: 0.85;
    color: var(--cor-ouro-bizantino, #c9a84c);
    font-weight: 500;
  }

  /* Search */
  .main-content {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }

  .search-bar {
    margin-bottom: 2rem;
  }

  .search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    width: 1.1rem;
    height: 1.1rem;
    color: #888;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.85rem 3rem 0.85rem 2.8rem;
    font-size: 1rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    background: white;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--cor-ouro-bizantino, #c9a84c);
  }

  .clear-btn {
    position: absolute;
    right: 0.75rem;
    background: none;
    border: none;
    color: #888;
    font-size: 1rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    transition: color 0.2s;
  }

  .clear-btn:hover {
    color: #333;
  }

  .results-count {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: #666;
  }

  /* Loading / Error / Empty */
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 4rem 0;
    color: #666;
  }

  .spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid #ddd;
    border-top-color: var(--cor-ouro-bizantino, #c9a84c);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error {
    background: #fee;
    border: 1px solid #fcc;
    color: #c33;
    padding: 1rem 1.5rem;
    border-radius: 8px;
  }

  .empty {
    text-align: center;
    padding: 4rem 0;
    color: #666;
    font-size: 1rem;
  }

  /* Grid */
  .clero-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.25rem;
  }

  .clero-card {
    background: white;
    border-radius: 10px;
    padding: 1.25rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    transition: box-shadow 0.2s, transform 0.2s;
    text-decoration: none;
    color: inherit;
  }

  .clero-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }

  .card-avatar {
    flex-shrink: 0;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background: var(--cor-ouro-bizantino, #c9a84c);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .avatar-initials {
    color: white;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .card-nome {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    color: #1a1a1a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 640px) {
    .entity-title h1 {
      font-size: 1.6rem;
    }

    .clero-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
