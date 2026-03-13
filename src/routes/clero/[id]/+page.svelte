<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { dataService } from '$lib/dataService.js';

  let clerigo: any = null;
  let loading = false;
  let error = '';

  onMount(async () => {
    loading = true;
    try {
      const id = parseInt(page.params.id ?? '');
      clerigo = await dataService.getCleroById(id);
      if (!clerigo) error = 'Clérigo não encontrado.';
    } catch (e) {
      error = 'Erro ao carregar o clérigo.';
      console.error(e);
    } finally {
      loading = false;
    }
  });

</script>

<svelte:head>
  <title>{clerigo ? clerigo.nome_completo : 'Clero'} — Diretório Ortodoxo Brasil</title>
</svelte:head>

<div class="container">
  <header class="detail-header">
    <div class="breadcrumb">
      <a href="/">DIRETÓRIO ORTODOXO</a>
      <span>/</span>
      <a href="/clero">CLERO</a>
      <span>/</span>
      <span>{clerigo ? clerigo.nome_completo : '...'}</span>
    </div>

    {#if clerigo}
      <div class="header-content">
        <div class="entity-title">
          <h1>{clerigo.nome_completo}</h1>
          <p class="entity-type">{clerigo.titulo}</p>
        </div>
      </div>
    {/if}
  </header>

  <main class="main-content">
    {#if loading}
      <div class="loading">
        <div class="spinner"></div>
        <p>Carregando...</p>
      </div>
    {:else if error}
      <div class="error">{error}</div>
    {:else if clerigo}
      <section class="full-width-section">
        <div class="info-card">
          <h2>Informações</h2>
          <dl class="info-list">
            <div class="info-row">
              <dt>Título:</dt>
              <dd>{clerigo.titulo || '—'}</dd>
            </div>
            <div class="info-row">
              <dt>Nome:</dt>
              <dd>{clerigo.nome_completo}</dd>
            </div>
            {#if clerigo.email}
              <div class="info-row">
                <dt>E-mail:</dt>
                <dd><a href="mailto:{clerigo.email}">{clerigo.email}</a></dd>
              </div>
            {/if}
          </dl>
        </div>
      </section>
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
    margin: 0 0.5rem;
    color: var(--cor-cinza-neve);
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

  /* Main */
  .main-content {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }

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

  .full-width-section {
    margin-bottom: 1.5rem;
  }

  .info-card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem 2rem;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  }

  .info-card h2 {
    margin: 0 0 1.25rem;
    font-size: 1.1rem;
    color: var(--cor-azul-constantinopolitano, #1a3a5c);
    border-bottom: 2px solid var(--cor-ouro-bizantino, #c9a84c);
    padding-bottom: 0.5rem;
  }

  .info-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin: 0;
  }

  .info-row {
    display: grid;
    grid-template-columns: 160px 1fr;
    gap: 0.5rem;
    align-items: baseline;
  }

  dt {
    font-weight: 600;
    color: #555;
    font-size: 0.9rem;
  }

  dd {
    margin: 0;
    color: #1a1a1a;
    font-size: 0.95rem;
  }

  dd a {
    color: var(--cor-ouro-bizantino, #c9a84c);
    text-decoration: none;
  }

  dd a:hover {
    text-decoration: underline;
  }

  @media (max-width: 640px) {
    .entity-title h1 {
      font-size: 1.6rem;
    }

    .info-row {
      grid-template-columns: 1fr;
      gap: 0.1rem;
    }
  }
</style>
