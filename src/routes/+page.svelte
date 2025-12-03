<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import Map from '$lib/Map.svelte';
  import type { EntidadeEclesiastica, Diocese, TipoEntidade, Jurisdicao } from '$lib/types.js';
  import { dataService } from '$lib/dataService.js';
  import { getTipoEntidadeLabel, getJurisdicaoLabel } from '$lib/utils.js';

  // Dados das entidades eclesiásticas
  let entidades: (EntidadeEclesiastica & { diocese: Diocese })[] = [];
  let filteredEntidades: (EntidadeEclesiastica & { diocese: Diocese })[] = [];
  let selectedTipos: Set<string> = new Set();
  let selectedJurisdicoes: Set<string> = new Set();
  let selectedEstados: Set<string> = new Set();
  let showMap = true;
  let loading = false;
  let isUsingApi = false;
  let isUsingSupabase = false;

  // Dropdown states
  let tiposDropdownOpen = false;
  let jurisdicoesDropdownOpen = false;
  let estadosDropdownOpen = false;

  // Funcionalidade "Próximo a Mim"
  let showNearMe = false;
  let userLocation: [number, number] | null = null;
  let radiusKm = 50; // Raio padrão em km
  let gettingLocation = false;
  let locationError = '';

  // Listas dinâmicas para filtros
  let tipos: Record<string, number> = { 'All': 0 };
  let jurisdicoes: Record<string, number> = { 'All': 0 };
  let estados: Record<string, number> = { 'All': 0 };
  
  // Listas completas da API
  let allTipos: string[] = [];
  let allJurisdicoes: string[] = [];
  let allEstados: string[] = [];

  onMount(async () => {
    loading = true;
    try {
      // Verificar se está usando Supabase ou API
      isUsingSupabase = await dataService.isUsingSupabase();
      isUsingApi = await dataService.isUsingApi();
      
      if (isUsingSupabase) {
        // Carregar listas completas do Supabase
        allTipos = await dataService.getTipos();
        allJurisdicoes = await dataService.getJurisdicoes();
        allEstados = await dataService.getEstados();
      } else if (isUsingApi) {
        // Carregar listas completas da API
        allTipos = await dataService.getTipos();
        allJurisdicoes = await dataService.getJurisdicoes();
        allEstados = await dataService.getEstados();
      }
      
      // Carregar entidades
      entidades = await dataService.getEntidades();
      filteredEntidades = entidades;
      
      // Calcular contadores para filtros
      updateFilterCounts();
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      loading = false;
    }
  });

  onDestroy(() => {
    if (browser) {
      document.removeEventListener('click', handleClickOutside);
    }
  });

  // Add click outside listener for dropdowns
  onMount(() => {
    if (browser) {
      document.addEventListener('click', handleClickOutside);
    }
  });

  function updateFilterCounts() {
    // Tipos de entidades - usar todos os tipos da API
    const novostipos: Record<string, number> = { 'All': entidades.length };
    
    if (isUsingApi && allTipos.length > 0) {
      // Usar todos os tipos da API
      allTipos.forEach(tipo => {
        novostipos[tipo] = entidades.filter(e => e.tipo === tipo).length;
      });
    } else {
      // Fallback: usar apenas tipos que existem nas entidades
      const tiposUnicos = [...new Set(entidades.map(e => e.tipo))];
      tiposUnicos.forEach(tipo => {
        novostipos[tipo] = entidades.filter(e => e.tipo === tipo).length;
      });
    }
    tipos = novostipos;

    // Jurisdições - usar todas as jurisdições da API
    const novasJurisdicoes: Record<string, number> = { 'All': entidades.length };
    
    if (isUsingApi && allJurisdicoes.length > 0) {
      // Mapear jurisdições da API para formato local e contar
      allJurisdicoes.forEach(jurisdicaoApi => {
        const jurisdicaoLocal = mapJurisdicaoApiToLocal(jurisdicaoApi);
        novasJurisdicoes[jurisdicaoLocal] = entidades.filter(e => e.diocese.jurisdicao === jurisdicaoLocal).length;
      });
    } else {
      // Fallback: usar apenas jurisdições que existem nas entidades
      const jurisdicoesUnicas = [...new Set(entidades.map(e => e.diocese.jurisdicao))];
      jurisdicoesUnicas.forEach(jurisdicao => {
        novasJurisdicoes[jurisdicao] = entidades.filter(e => e.diocese.jurisdicao === jurisdicao).length;
      });
    }
    jurisdicoes = novasJurisdicoes;

    // Estados - usar todos os estados da API
    const novosEstados: Record<string, number> = { 'All': entidades.length };
    
    if (isUsingApi && allEstados.length > 0) {
      // Usar todos os estados da API
      allEstados.forEach(estado => {
        novosEstados[estado] = entidades.filter(e => e.estado === estado).length;
      });
    } else {
      // Fallback: usar apenas estados que existem nas entidades
      const estadosUnicos = [...new Set(entidades.map(e => e.estado))];
      estadosUnicos.forEach(estado => {
        novosEstados[estado] = entidades.filter(e => e.estado === estado).length;
      });
    }
    estados = novosEstados;
  }

  // Função para mapear jurisdições da API para o formato local
  function mapJurisdicaoApiToLocal(jurisdicaoApi: string): string {
    const mapping: Record<string, string> = {
      'Patriarcado Ecumênico': 'PatriarcadoEcumenico',
      'Patriarcado de Antioquia': 'PatriarcadoDeAntioquia', 
      'Patriarcado de Moscou': 'PatriarcadoDeMoscou',
      'Patriarcado da Sérvia': 'PatriarcadoDaServia',
      'Igreja Autocéfala da Polônia': 'IgrejaAutocefalaDoPolonia'
    };
    
    return mapping[jurisdicaoApi] || 'PatriarcadoDeAntioquia';
  }

  async function filterEntidades() {
    loading = true;
    try {
      // Aplicar filtros usando o data service
      const filtros: any = {};
      
      // Apply multiple filter values
      if (selectedTipos.size > 0) {
        filtros.tipos = Array.from(selectedTipos);
      }
      if (selectedJurisdicoes.size > 0) {
        filtros.jurisdicoes = Array.from(selectedJurisdicoes);
      }
      if (selectedEstados.size > 0) {
        filtros.estados = Array.from(selectedEstados);
      }
      
      // Filter locally since API might not support multiple values
      let results = entidades.filter(entidade => {
        const tipoMatch = selectedTipos.size === 0 || selectedTipos.has(entidade.tipo);
        const jurisdicaoMatch = selectedJurisdicoes.size === 0 || selectedJurisdicoes.has(entidade.diocese.jurisdicao);
        const estadoMatch = selectedEstados.size === 0 || selectedEstados.has(entidade.estado);
        
        return tipoMatch && jurisdicaoMatch && estadoMatch;
      });
      
      // Aplicar filtro de proximidade se ativo
      if (showNearMe && userLocation) {
        results = results.filter(entidade => {
          // Só filtra entidades que têm coordenadas
          if (!entidade.latitude || !entidade.longitude) return false;
          
          const distance = calculateDistance(
            userLocation![0], userLocation![1],
            entidade.latitude, entidade.longitude
          );
          
          return distance <= radiusKm;
        });
        
        // Ordena por distância (mais próximas primeiro)
        results.sort((a, b) => {
          if (!a.latitude || !a.longitude || !b.latitude || !b.longitude) return 0;
          
          const distanceA = calculateDistance(
            userLocation![0], userLocation![1],
            a.latitude, a.longitude
          );
          const distanceB = calculateDistance(
            userLocation![0], userLocation![1],
            b.latitude, b.longitude
          );
          
          return distanceA - distanceB;
        });
      }
      
      filteredEntidades = results;
    } catch (error) {
      console.error('Erro ao filtrar entidades:', error);
      filteredEntidades = entidades;
    } finally {
      loading = false;
    }
  }

  // Funções para "Próximo a Mim"
  async function toggleNearMe() {
    if (showNearMe) {
      showNearMe = false;
      userLocation = null;
      locationError = '';
      filterEntidades();
    } else {
      // Ativar "Próximo a Mim"
      await getUserLocation();
    }
  }

  async function getUserLocation() {
    if (!navigator.geolocation) {
      locationError = 'Geolocalização não suportada pelo navegador';
      return;
    }

    gettingLocation = true;
    locationError = '';

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutos
        });
      });

      userLocation = [position.coords.latitude, position.coords.longitude];
      showNearMe = true;
      locationError = '';
      filterEntidades();
    } catch (error: any) {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          locationError = 'Permissão de localização negada';
          break;
        case error.POSITION_UNAVAILABLE:
          locationError = 'Localização indisponível';
          break;
        case error.TIMEOUT:
          locationError = 'Tempo limite excedido';
          break;
        default:
          locationError = 'Erro ao obter localização';
          break;
      }
    } finally {
      gettingLocation = false;
    }
  }

  // Função para calcular distância entre dois pontos (Haversine)
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Reactive filtering when filter values change
  $: if (selectedTipos !== undefined) {
    filterEntidades();
  }

  $: if (selectedJurisdicoes !== undefined) {
    filterEntidades();
  }

  $: if (selectedEstados !== undefined) {
    filterEntidades();
  }

  // Reactive filtering when radius changes
  $: if (radiusKm !== undefined && showNearMe && userLocation) {
    filterEntidades();
  }

  // Function to clear all filters
  function clearAllFilters() {
    selectedTipos = new Set();
    selectedJurisdicoes = new Set();
    selectedEstados = new Set();
    showNearMe = false;
    userLocation = null;
    locationError = '';
    radiusKm = 50; // Reset to default
    filterEntidades();
  }

  // Check if any filters are active
  function hasActiveFilters(): boolean {
    return selectedTipos.size > 0 || 
           selectedJurisdicoes.size > 0 || 
           selectedEstados.size > 0 || 
           showNearMe;
  }

  // Toggle filter selection
  function toggleFilter(filterSet: Set<string>, value: string) {
    const newSet = new Set(filterSet);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    return newSet;
  }

  function toggleTipo(tipo: string) {
    selectedTipos = toggleFilter(selectedTipos, tipo);
  }

  function toggleJurisdicao(jurisdicao: string) {
    selectedJurisdicoes = toggleFilter(selectedJurisdicoes, jurisdicao);
  }

  function toggleEstado(estado: string) {
    selectedEstados = toggleFilter(selectedEstados, estado);
  }

  // Handle click outside dropdowns to close them
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-container')) {
      tiposDropdownOpen = false;
      jurisdicoesDropdownOpen = false;
      estadosDropdownOpen = false;
    }
  }

  // Toggle dropdown visibility
  function toggleDropdown(dropdown: 'tipos' | 'jurisdicoes' | 'estados') {
    if (dropdown === 'tipos') {
      tiposDropdownOpen = !tiposDropdownOpen;
      jurisdicoesDropdownOpen = false;
      estadosDropdownOpen = false;
    } else if (dropdown === 'jurisdicoes') {
      jurisdicoesDropdownOpen = !jurisdicoesDropdownOpen;
      tiposDropdownOpen = false;
      estadosDropdownOpen = false;
    } else if (dropdown === 'estados') {
      estadosDropdownOpen = !estadosDropdownOpen;
      tiposDropdownOpen = false;
      jurisdicoesDropdownOpen = false;
    }
  }

</script>

<svelte:head>
  <title>Diretório Ortodoxo - Brasil</title>
  <meta name="description" content="Diretório completo de igrejas, catedrais, mosteiros e missões ortodoxas no Brasil" />
</svelte:head>

<div class="container">
  <header class="header">
    <div class="header-content">
      <div class="logo-section">
        <h1 class="main-title" style="color: white;">Diretório Ortodoxo do Brasil</h1>
      </div>
      <nav class="header-nav">
        <a href="https://ecclesia.org.br" target="_blank" rel="noopener noreferrer" class="nav-link">ECCLESIA.ORG</a>
        <a href="#sobre" class="nav-link">SOBRE</a>
        <a href="#footer" class="nav-link">CONTATO</a>
      </nav>
    </div>
    
    <div class="breadcrumb">
      <a href="/">DIRETÓRIO ORTODOXO</a>
      <span>/</span>
      <span>BRASIL</span>
    </div>
  </header>

  <main class="main-content">
    {#if loading}
      <div class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>Carregando entidades ortodoxas...</p>
      </div>
    {/if}
    
    <div class="sidebar">
      <!-- Filtro por Tipo -->
      <section class="filter-section">
        <h3>Tipo</h3>
        {#if loading}
          <div class="filter-loading">Carregando tipos...</div>
        {:else}
          <div class="dropdown-container">
            <button 
              class="dropdown-toggle" 
              onclick={() => toggleDropdown('tipos')}
              disabled={loading}
            >
              <span class="dropdown-label">
                {selectedTipos.size > 0 ? `${selectedTipos.size} selecionado${selectedTipos.size > 1 ? 's' : ''}` : 'Selecione...'}
              </span>
              <span class="dropdown-arrow">{tiposDropdownOpen ? '▲' : '▼'}</span>
            </button>
            {#if tiposDropdownOpen}
              <div class="dropdown-menu">
                {#each Object.entries(tipos) as [tipo, count]}
                  {#if tipo !== 'All'}
                    <label class="dropdown-item">
                      <input 
                        type="checkbox" 
                        checked={selectedTipos.has(tipo)}
                        onchange={() => toggleTipo(tipo)}
                        disabled={loading}
                      />
                      <span class="dropdown-item-text">
                        {getTipoEntidadeLabel(tipo)}
                        <span class="filter-count">({count})</span>
                      </span>
                    </label>
                  {/if}
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      </section>

      <!-- Filtro por Jurisdição -->
      <section class="filter-section">
        <h3>Jurisdição</h3>
        {#if loading}
          <div class="filter-loading">Carregando jurisdições...</div>
        {:else}
          <div class="dropdown-container">
            <button 
              class="dropdown-toggle" 
              onclick={() => toggleDropdown('jurisdicoes')}
              disabled={loading}
            >
              <span class="dropdown-label">
                {selectedJurisdicoes.size > 0 ? `${selectedJurisdicoes.size} selecionado${selectedJurisdicoes.size > 1 ? 's' : ''}` : 'Selecione...'}
              </span>
              <span class="dropdown-arrow">{jurisdicoesDropdownOpen ? '▲' : '▼'}</span>
            </button>
            {#if jurisdicoesDropdownOpen}
              <div class="dropdown-menu">
                {#each Object.entries(jurisdicoes) as [jurisdicao, count]}
                  {#if jurisdicao !== 'All'}
                    <label class="dropdown-item">
                      <input 
                        type="checkbox" 
                        checked={selectedJurisdicoes.has(jurisdicao)}
                        onchange={() => toggleJurisdicao(jurisdicao)}
                        disabled={loading}
                      />
                      <span class="dropdown-item-text">
                        {getJurisdicaoLabel(jurisdicao as Jurisdicao)}
                        <span class="filter-count">({count})</span>
                      </span>
                    </label>
                  {/if}
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      </section>

      <!-- Filtro por Estado -->
      <section class="filter-section">
        <h3>Estado</h3>
        {#if loading}
          <div class="filter-loading">Carregando estados...</div>
        {:else}
          <div class="dropdown-container">
            <button 
              class="dropdown-toggle" 
              onclick={() => toggleDropdown('estados')}
              disabled={loading}
            >
              <span class="dropdown-label">
                {selectedEstados.size > 0 ? `${selectedEstados.size} selecionado${selectedEstados.size > 1 ? 's' : ''}` : 'Selecione...'}
              </span>
              <span class="dropdown-arrow">{estadosDropdownOpen ? '▲' : '▼'}</span>
            </button>
            {#if estadosDropdownOpen}
              <div class="dropdown-menu">
                {#each Object.entries(estados) as [estado, count]}
                  {#if estado !== 'All'}
                    <label class="dropdown-item">
                      <input 
                        type="checkbox" 
                        checked={selectedEstados.has(estado)}
                        onchange={() => toggleEstado(estado)}
                        disabled={loading}
                      />
                      <span class="dropdown-item-text">
                        {estado}
                        <span class="filter-count">({count})</span>
                      </span>
                    </label>
                  {/if}
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      </section>

      <!-- Clear Filters Button -->
      <section class="clear-filters-section">
        <button 
          class="clear-filters-btn"
          onclick={clearAllFilters}
          disabled={loading}
        >
          Limpar Filtros
        </button>
      </section>
    </div>

    <div class="content">
      <!-- Título Principal -->
      <section class="main-title-section">
        <h2>Entidades Eclesiásticas Ortodoxas no Brasil</h2>
      </section>

      <!-- Mobile Filters Section (visible only on mobile) -->
      <section class="mobile-filters">
        <!-- Filtro por Tipo -->
        <div class="mobile-filter-item">
          <div class="mobile-filter-label">Tipo:</div>
          {#if loading}
            <div class="filter-loading">Carregando tipos...</div>
          {:else}
            <div class="dropdown-container">
              <button 
                class="dropdown-toggle" 
                onclick={() => toggleDropdown('tipos')}
                disabled={loading}
              >
                <span class="dropdown-label">
                  {selectedTipos.size > 0 ? `${selectedTipos.size} selecionado${selectedTipos.size > 1 ? 's' : ''}` : 'Selecione...'}
                </span>
                <span class="dropdown-arrow">{tiposDropdownOpen ? '▲' : '▼'}</span>
              </button>
              {#if tiposDropdownOpen}
                <div class="dropdown-menu">
                  {#each Object.entries(tipos) as [tipo, count]}
                    {#if tipo !== 'All'}
                      <label class="dropdown-item">
                        <input 
                          type="checkbox" 
                          checked={selectedTipos.has(tipo)}
                          onchange={() => toggleTipo(tipo)}
                          disabled={loading}
                        />
                        <span class="dropdown-item-text">
                          {getTipoEntidadeLabel(tipo)}
                          <span class="filter-count">({count})</span>
                        </span>
                      </label>
                    {/if}
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Filtro por Jurisdição -->
        <div class="mobile-filter-item">
          <div class="mobile-filter-label">Jurisdição:</div>
          {#if loading}
            <div class="filter-loading">Carregando jurisdições...</div>
          {:else}
            <div class="dropdown-container">
              <button 
                class="dropdown-toggle" 
                onclick={() => toggleDropdown('jurisdicoes')}
                disabled={loading}
              >
                <span class="dropdown-label">
                  {selectedJurisdicoes.size > 0 ? `${selectedJurisdicoes.size} selecionado${selectedJurisdicoes.size > 1 ? 's' : ''}` : 'Selecione...'}
                </span>
                <span class="dropdown-arrow">{jurisdicoesDropdownOpen ? '▲' : '▼'}</span>
              </button>
              {#if jurisdicoesDropdownOpen}
                <div class="dropdown-menu">
                  {#each Object.entries(jurisdicoes) as [jurisdicao, count]}
                    {#if jurisdicao !== 'All'}
                      <label class="dropdown-item">
                        <input 
                          type="checkbox" 
                          checked={selectedJurisdicoes.has(jurisdicao)}
                          onchange={() => toggleJurisdicao(jurisdicao)}
                          disabled={loading}
                        />
                        <span class="dropdown-item-text">
                          {getJurisdicaoLabel(jurisdicao as Jurisdicao)}
                          <span class="filter-count">({count})</span>
                        </span>
                      </label>
                    {/if}
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Filtro por Estado -->
        <div class="mobile-filter-item">
          <div class="mobile-filter-label">Estado:</div>
          {#if loading}
            <div class="filter-loading">Carregando estados...</div>
          {:else}
            <div class="dropdown-container">
              <button 
                class="dropdown-toggle" 
                onclick={() => toggleDropdown('estados')}
                disabled={loading}
              >
                <span class="dropdown-label">
                  {selectedEstados.size > 0 ? `${selectedEstados.size} selecionado${selectedEstados.size > 1 ? 's' : ''}` : 'Selecione...'}
                </span>
                <span class="dropdown-arrow">{estadosDropdownOpen ? '▲' : '▼'}</span>
              </button>
              {#if estadosDropdownOpen}
                <div class="dropdown-menu">
                  {#each Object.entries(estados) as [estado, count]}
                    {#if estado !== 'All'}
                      <label class="dropdown-item">
                        <input 
                          type="checkbox" 
                          checked={selectedEstados.has(estado)}
                          onchange={() => toggleEstado(estado)}
                          disabled={loading}
                        />
                        <span class="dropdown-item-text">
                          {estado}
                          <span class="filter-count">({count})</span>
                        </span>
                      </label>
                    {/if}
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Clear Filters Button -->
        <button 
          class="mobile-clear-filters-btn"
          onclick={clearAllFilters}
          disabled={loading}
        >
          Limpar Filtros
        </button>
      </section>

      <!-- Cabeçalho do Conteúdo -->
      <div class="content-header">
        <div class="filters-display">
          <div class="active-filters">
            {#each Array.from(selectedTipos) as tipo}
              <span class="filter-tag">
                {getTipoEntidadeLabel(tipo)}
              </span>
            {/each}
            {#each Array.from(selectedJurisdicoes) as jurisdicao}
              <span class="filter-tag">
                {getJurisdicaoLabel(jurisdicao as Jurisdicao)}
              </span>
            {/each}
            {#each Array.from(selectedEstados) as estado}
              <span class="filter-tag">
                {estado}
              </span>
            {/each}
            {#if showNearMe && userLocation}
              <span class="filter-tag">
                Próximo a Mim ({radiusKm}km)
              </span>
            {/if}
          </div>
          <p class="results-count">
            {filteredEntidades.length} entidade{filteredEntidades.length !== 1 ? 's' : ''} encontrada{filteredEntidades.length !== 1 ? 's' : ''}
            {#if loading}
              <span class="loading-text">• Carregando...</span>
            {/if}
          </p>
        </div>
        <button 
          class="view-switch-btn"
          onclick={() => showMap = !showMap}
          disabled={loading}
        >
          {showMap ? 'Mostrar Lista' : 'Mostrar Mapa'}
        </button>
      </div>
      
      <!-- Mapa ou Tabela -->
      {#if showMap}
        <section class="map-section">
          <Map 
            entidades={filteredEntidades} 
            userLocation={userLocation}
            radiusKm={showNearMe ? radiusKm : null}
            showNearMe={showNearMe}
          />
        </section>
      {:else}
        <!-- Tabela Principal -->
        <section class="churches-table">
          <!-- Desktop Table View -->
          <div class="table-wrapper desktop-table">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Cidade</th>
                  <th>Estado</th>
                  <th>Jurisdição</th>
                  {#if showNearMe && userLocation}
                    <th>Distância</th>
                  {/if}
                </tr>
              </thead>
              <tbody>
                {#each filteredEntidades as entidade}
                  <tr onclick={() => goto(`/entidade/${entidade.id}`)} style="cursor: pointer;">
                    <td class="church-name">{entidade.nome}</td>
                    <td>{getTipoEntidadeLabel(entidade.tipo)}</td>
                    <td>{entidade.cidade}</td>
                    <td>{entidade.estado}</td>
                    <td>{getJurisdicaoLabel(entidade.diocese.jurisdicao)}</td>
                    {#if showNearMe && userLocation && entidade.latitude && entidade.longitude}
                      <td class="distance-cell">
                        {calculateDistance(userLocation[0], userLocation[1], entidade.latitude, entidade.longitude).toFixed(1)} km
                      </td>
                    {:else if showNearMe && userLocation}
                      <td class="distance-cell">-</td>
                    {/if}
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          <!-- Mobile List View -->
          <div class="mobile-list">
            <div class="mobile-list-container">
              {#each filteredEntidades as entidade}
                <div 
                  class="mobile-list-item" 
                  onclick={() => goto(`/entidade/${entidade.id}`)}
                  onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') goto(`/entidade/${entidade.id}`); }}
                  role="button"
                  tabindex="0"
                >
                  <div class="mobile-item-main">
                    <div class="mobile-item-name">{entidade.nome}</div>
                    <div class="mobile-item-type">{getTipoEntidadeLabel(entidade.tipo)}</div>
                  </div>
                  <div class="mobile-item-location">
                    {entidade.cidade}, {entidade.estado}
                  </div>
                  <div class="mobile-item-jurisdiction">
                    {getJurisdicaoLabel(entidade.diocese.jurisdicao)}
                  </div>
                  {#if showNearMe && userLocation && entidade.latitude && entidade.longitude}
                    <div class="mobile-item-distance">
                      {calculateDistance(userLocation[0], userLocation[1], entidade.latitude, entidade.longitude).toFixed(1)} km
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
          
          <div class="pagination">
            <span>Mostrando 1 a {filteredEntidades.length} de {filteredEntidades.length} entradas</span>
          </div>
        </section>
      {/if}

      <!-- Seção Próximo a Mim (sempre visível) -->
      <section class="near-me-section">
        <h2>Próximo a Mim</h2>
        <div class="near-me-controls-horizontal">
          <button 
            class="near-me-btn {showNearMe ? 'active' : ''}"
            onclick={toggleNearMe}
            disabled={loading || gettingLocation}
          >
            {#if gettingLocation}
              <span class="loading-spinner-small"></span>
              Obtendo localização...
            {:else if showNearMe}
              Mostrar Todas
            {:else}
              Encontrar Próximas
            {/if}
          </button>
          
          {#if showNearMe}
            <div class="radius-control">
              <label for="radius-main">Raio de busca:</label>
              <select id="radius-main" bind:value={radiusKm}>
                <option value={10}>10 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
                <option value={200}>200 km</option>
              </select>
            </div>
          {/if}
          
          {#if locationError}
            <div class="location-error">
              <small>⚠️ {locationError}</small>
            </div>
          {/if}
        </div>
      </section>

      <!-- Seção de Estatísticas -->
      <section class="stats-section">
        <h2>Estatísticas</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <h3>{entidades.length}</h3>
            <p>Total de Entidades</p>
          </div>
          <div class="stat-card">
            <h3>{new Set(entidades.map(e => e.estado)).size}</h3>
            <p>Estados Atendidos</p>
          </div>
        </div>
        <div class="stats-by-type">
          <div class="type-stats-list">
            {#each Object.entries(tipos) as [tipo, count]}
              {#if tipo !== 'All'}
                <div class="type-stat-item">
                  <span class="type-label">{getTipoEntidadeLabel(tipo)} </span>
                  <span class="type-count">{count}</span>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      </section>

      <!-- Seção Sobre -->
      <section id="sobre" class="sobre-section">
        <h2>Sobre o Diretório</h2>
        <div class="sobre-content">
          <h3>Diretório de Paróquias, Comunidades e Missões Ortodoxas no Brasil</h3>
          <p>
            Apresentamos abaixo uma lista com os principais dados e endereços das paróquias, comunidades missionárias e monásticas pertencentes às Igrejas Ortodoxas Canônicas com presença no Brasil.
          </p>
          <p>Estão incluídas:</p>
          <ul>
            <li>Igrejas Gregas e Ucranianas, sob jurisdição do Patriarcado Ecumênico de Constantinopla;</li>
            <li>Igrejas Antioquenas, sob o Patriarcado de Antioquia;</li>
            <li>Igrejas Russas, vinculadas ao Patriarcado de Moscou e de Toda a Rússia;</li>
            <li>Igrejas Missionárias da Eparquia do Rio de Janeiro e Olinda-Recife, sob a proteção canônica da Igreja Ortodoxa Autocéfala da Polônia;</li>
            <li>Missões sob o Patriarcado da Sérvia, ligadas à Diocese Ortodoxa Sérvia de Buenos Aires e América do Sul.</li>
          </ul>
          <h4>Encontrou alguma informação incorreta?</h4>
          <p>
            Se você identificar erros ou dados desatualizados, pedimos a gentileza de entrar em contato com a administração do site.  Clique no botão abaixo para nos enviar uma correção:
          </p>
          <a href="mailto:info@ecclesia.org.br?subject=Correção - Diretório Ortodoxo" class="sobre-btn-link">
            <button class="sobre-btn">Enviar correção</button>
          </a>
        </div>
      </section>
    </div>
  </main>

  <!-- Footer -->
  <footer id="footer" class="footer">
    <div class="footer-content">
      <div class="footer-main">
        <div class="footer-logo-section">
          <img src="/ecclesia-icon.png" alt="Orthodox Cross" class="footer-logo" />
          <h3 class="footer-title">Info-contato</h3>
        </div>
        
        <div class="footer-contact">
          <div class="footer-contact-item">
            <svg class="footer-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
            </svg>
            <span>Florianópolis, SC (Brasil)</span>
          </div>
          
          <div class="footer-contact-item">
            <svg class="footer-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="currentColor"/>
            </svg>
            <a href="tel:+554898456700" class="footer-link">+55 (48) 98456-7000</a>
          </div>
          
          <div class="footer-contact-item">
            <svg class="footer-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
            </svg>
            <a href="mailto:ecclesia@ecclesia.org.br" class="footer-link">ecclesia@ecclesia.org.br</a>
          </div>
          
          <div class="footer-contact-item">
            <svg class="footer-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
            </svg>
            <a href="https://ecclesia.org.br/" target="_blank" rel="noopener noreferrer" class="footer-link">ECCLESIA BRASIL</a>
          </div>
        </div>
      </div>
      
      <div class="footer-copyright">
        <p>© Diretório Ortodoxo 2025, Todos os direitos reservados</p>
      </div>
    </div>
  </footer>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: 'Georgia', 'Times New Roman', serif;
    background-color: #fefefe;
    color: #2c1810;
    line-height: 1.6;
    scroll-behavior: smooth;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    min-height: 100vh;
    background: #ffffff;
    box-shadow: 0 0 30px rgba(181, 101, 118, 0.1);
  }

  .header {
    background: linear-gradient(135deg, var(--cor-azul-constantinopolitano), var(--cor-azul-marinho-escuro));
    color: #f5f3f0;
    padding: 2rem;
    position: relative;
    border-bottom: 4px solid var(--cor-ouro-bizantino);
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .logo-section .main-title {
    font-size: 2.5rem;
    margin: 0;
    font-weight: 700;
    letter-spacing: 3px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  }

  .subtitle {
    margin: 0.5rem 0 0 0;
    font-size: 1rem;
    opacity: 0.9;
    font-style: italic;
  }

  .header-nav {
    display: flex;
    gap: 2rem;
  }

  .nav-link {
    color: #f5f3f0;
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 1px;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: background-color 0.3s;
  }

  .nav-link:hover, .nav-link.active {
    background-color: rgba(255,255,255,0.2);
  }

  .breadcrumb {
    font-size: 0.85rem;
    opacity: 0.8;
  }

  .breadcrumb a {
    color: #f5f3f0;
    text-decoration: none;
  }

  .breadcrumb a:hover {
    text-decoration: underline;
  }

  .breadcrumb span {
    margin: 0 0.5rem;
    color: #ddd;
  }

  .main-content {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 2rem;
    padding: 2rem;
  }

  .sidebar {
    background: #FAFAFA;
    padding: 1.5rem;
    border-radius: 8px;
    height: fit-content;
    border: 2px solid var(--cor-cinza-neve);
    box-shadow: 0 4px 8px rgba(181, 101, 118, 0.1);
  }

  .filter-section {
    margin-bottom: 2rem;
  }

  .filter-section h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: var(--cor-azul-constantinopolitano);
    font-size: 1.1rem;
    font-weight: 600;
    border-bottom: 2px solid var(--cor-azul-constantinopolitano);
    padding-bottom: 0.5rem;
  }

  /* Dropdown Styles */
  .dropdown-container {
    position: relative;
    width: 100%;
  }

  .dropdown-toggle {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: white;
    border: 2px solid var(--cor-cinza-neve);
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.9rem;
    color: #2c1810;
    transition: all 0.2s ease;
    text-align: left;
  }

  .dropdown-toggle:hover {
    border-color: var(--cor-azul-constantinopolitano);
    background-color: #FAFAFA;
  }

  .dropdown-toggle:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .dropdown-label {
    flex: 1;
    color: #2c1810;
    font-weight: 500;
  }

  .dropdown-arrow {
    color: var(--cor-azul-constantinopolitano);
    font-size: 0.75rem;
    margin-left: 0.5rem;
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 0.25rem);
    left: 0;
    right: 0;
    background: white;
    border: 2px solid var(--cor-azul-constantinopolitano);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(207, 74, 70, 0.2);
    max-height: 300px;
    overflow-y: auto;
    z-index: 100;
    animation: dropdownSlide 0.2s ease-out;
  }

  @keyframes dropdownSlide {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .dropdown-menu::-webkit-scrollbar {
    width: 8px;
  }

  .dropdown-menu::-webkit-scrollbar-track {
    background: #FAFAFA;
    border-radius: 4px;
  }

  .dropdown-menu::-webkit-scrollbar-thumb {
    background: var(--cor-azul-constantinopolitano);
    border-radius: 4px;
  }

  .dropdown-menu::-webkit-scrollbar-thumb:hover {
    background: var(--cor-azul-marinho-escuro);
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
    border-bottom: 1px solid #FAFAFA;
  }

  .dropdown-item:last-child {
    border-bottom: none;
  }

  .dropdown-item:hover {
    background-color: #FAFAFA;
  }

  .dropdown-item input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: var(--cor-azul-constantinopolitano);
    flex-shrink: 0;
  }

  .dropdown-item input[type="checkbox"]:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .dropdown-item-text {
    font-size: 0.9rem;
    color: #2c1810;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    flex-wrap: wrap;
    flex: 1;
  }

  .filter-count {
    color: #888;
    font-size: 0.85rem;
    font-weight: 500;
  }

  /* Cabeçalho do Conteúdo */
  .content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #FAFAFA;
  }

  .filters-display {
    flex: 1;
  }

  .active-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .filter-tag {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: 500;
    color: #666;
    background: #F5F5F5;
    border: 1px solid #E0E0E0;
  }

  .results-count {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .view-switch-btn {
    background: linear-gradient(135deg, var(--cor-azul-constantinopolitano), var(--cor-azul-constantinopolitano));
    color: white;
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(207, 74, 70, 0.2);
  }

  .view-switch-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(207, 74, 70, 0.3);
  }

  .view-switch-btn:active {
    transform: translateY(0);
  }

  .view-switch-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .loading-text {
    color: var(--cor-azul-constantinopolitano);
    font-weight: 600;
  }

  .content {
    flex: 1;
  }

  .main-title-section {
    margin-bottom: 2rem;
  }

  .main-title-section h2 {
    color: var(--cor-azul-constantinopolitano);
    margin: 0;
    font-size: 2rem;
    font-weight: 600;
    border-bottom: 3px solid var(--cor-azul-constantinopolitano);
    padding-bottom: 0.75rem;
    text-align: left;
  }

  .map-section, .churches-table {
    margin-bottom: 3rem;
  }

  .table-wrapper {
    overflow-x: auto;
    overflow-y: auto;
    max-height: 600px;
    border: 2px solid var(--cor-cinza-neve);
    border-radius: 8px;
    background: white;
    box-shadow: 0 4px 12px rgba(207, 74, 70, 0.1);
  }

  .table-wrapper::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .table-wrapper::-webkit-scrollbar-track {
    background: #FAFAFA;
    border-radius: 4px;
  }

  .table-wrapper::-webkit-scrollbar-thumb {
    background: var(--cor-azul-constantinopolitano);
    border-radius: 4px;
  }

  .table-wrapper::-webkit-scrollbar-thumb:hover {
    background: var(--cor-azul-marinho-escuro);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 500px; /* Reduced minimum width since we removed Reitor column */
  }

  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #FAFAFA;
  }

  th {
    background: linear-gradient(135deg, var(--cor-azul-constantinopolitano), var(--cor-azul-constantinopolitano));
    color: #f5f3f0;
    font-weight: 600;
    font-size: 0.95rem;
    position: sticky;
    top: 0;
    z-index: 10;
    white-space: nowrap; /* Prevent header text wrapping */
  }

  tr:hover {
    background: #FAFAFA;
    transition: all 0.2s ease;
  }

  tr[style*="cursor: pointer"]:hover {
    background: var(--cor-cinza-neve);
    box-shadow: 0 2px 8px rgba(207, 74, 70, 0.15);
  }

  .church-name {
    font-weight: 600;
    color: var(--cor-azul-constantinopolitano);
    min-width: 200px; /* Ensure church name has adequate space */
  }

  /* Mobile list layout */
  .mobile-list {
    display: none;
  }

  /* Mobile filters - hidden by default, shown only on mobile */
  .mobile-filters {
    display: none;
  }

  .mobile-list-container {
    max-height: 70vh; /* Limit height to 70% of viewport */
    overflow-y: auto; /* Enable vertical scrolling */
    border: 2px solid var(--cor-cinza-neve);
    border-radius: 8px;
    background: white;
    box-shadow: 0 4px 12px rgba(207, 74, 70, 0.1);
  }

  .mobile-list-container::-webkit-scrollbar {
    width: 8px;
  }

  .mobile-list-container::-webkit-scrollbar-track {
    background: #FAFAFA;
    border-radius: 4px;
  }

  .mobile-list-container::-webkit-scrollbar-thumb {
    background: var(--cor-azul-constantinopolitano);
    border-radius: 4px;
  }

  .mobile-list-container::-webkit-scrollbar-thumb:hover {
    background: var(--cor-azul-marinho-escuro);
  }

  .mobile-list-item {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #FAFAFA;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .mobile-list-item:last-child {
    border-bottom: none;
  }

  .mobile-list-item:hover, .mobile-list-item:focus {
    background: #FAFAFA;
    outline: none;
  }

  .mobile-list-item:focus {
    background: var(--cor-cinza-neve);
    box-shadow: inset 3px 0 0 var(--cor-azul-constantinopolitano);
  }

  .mobile-item-main {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .mobile-item-name {
    font-weight: 600;
    color: var(--cor-azul-constantinopolitano);
    font-size: 1rem;
    line-height: 1.3;
    flex: 1;
  }

  .mobile-item-type {
    background: var(--cor-azul-constantinopolitano);
    color: white;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-size: 0.7rem;
    font-weight: 600;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .mobile-item-location {
    font-size: 0.85rem;
    color: #666;
    font-weight: 500;
  }

  .mobile-item-jurisdiction {
    font-size: 0.8rem;
    color: #888;
    font-style: italic;
  }

  .mobile-item-distance {
    font-size: 0.75rem;
    color: var(--cor-azul-constantinopolitano);
    font-weight: 600;
    background: #FAFAFA;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    align-self: flex-start;
    margin-top: 0.25rem;
  }

  .stats-section {
    margin-bottom: 3rem;
  }

  .stats-section h2 {
    color: var(--cor-azul-constantinopolitano);
    margin-bottom: 1.5rem;
    font-size: 1.8rem;
    font-weight: 600;
    border-bottom: 3px solid var(--cor-azul-constantinopolitano);
    padding-bottom: 0.5rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .stat-card {
    background: linear-gradient(135deg, #FAFAFA, var(--cor-cinza-neve));
    padding: 2rem;
    border-radius: 8px;
    text-align: center;
    border: 2px solid var(--cor-cinza-neve);
    box-shadow: 0 4px 8px rgba(207, 74, 70, 0.1);
    transition: transform 0.3s;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    border-color: var(--cor-azul-constantinopolitano);
  }

  .stat-card h3 {
    font-size: 2.5rem;
    color: var(--cor-azul-constantinopolitano);
    margin: 0 0 0.5rem 0;
    font-weight: 700;
  }

  .stats-by-type {
    margin-top: 2rem;
  }

  .type-stats-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.75rem;
  }

  .type-stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: #FAFAFA;
    border-radius: 6px;
    border: 1px solid var(--cor-cinza-neve);
    transition: all 0.2s ease;
  }

  .type-stat-item:hover {
    background: var(--cor-cinza-neve);
    border-color: var(--cor-azul-constantinopolitano);
  }

  .type-label {
    font-weight: 500;
    color: #2c1810;
  }

  .type-count {
    font-weight: 700;
    color: var(--cor-azul-constantinopolitano);
    font-size: 1.1rem;
  }

  /* Sobre Section Styles */
  .sobre-section {
    margin-bottom: 3rem;
    background: #FAFAFA;
    padding: 2rem;
    border-radius: 8px;
    border: 2px solid var(--cor-cinza-neve);
    box-shadow: 0 4px 8px rgba(207, 74, 70, 0.1);
  }

  .sobre-section h2 {
    color: var(--cor-azul-constantinopolitano);
    margin-bottom: 1.5rem;
    font-size: 1.8rem;
    font-weight: 600;
    border-bottom: 3px solid var(--cor-azul-constantinopolitano);
    padding-bottom: 0.5rem;
  }

  .sobre-content h3 {
    color: var(--cor-azul-constantinopolitano);
    font-size: 1.4rem;
    margin-bottom: 1rem;
    font-weight: 700;
    border-bottom: 2px solid var(--cor-ouro-bizantino);
    padding-bottom: 0.5rem;
  }

  .sobre-content h4 {
    color: var(--cor-azul-constantinopolitano);
    font-size: 1.1rem;
    margin-top: 2rem;
    margin-bottom: 1rem;
    font-weight: 600;
    border-bottom: 2px solid var(--cor-ouro-bizantino);
    padding-bottom: 0.3rem;
  }

  .sobre-content ul {
    margin: 1.5rem 0 2rem 2rem;
    padding: 0;
    color: #2c1810;
  }

  .sobre-content li {
    margin-bottom: 0.7rem;
    font-size: 1rem;
  }

  .sobre-content p {
    margin-bottom: 1.2rem;
    font-size: 1.05rem;
    line-height: 1.6;
  }

  .sobre-btn-link {
    text-decoration: none;
    display: inline-block;
  }

  .sobre-btn {
    background: linear-gradient(135deg, var(--cor-azul-constantinopolitano), var(--cor-azul-constantinopolitano));
    color: #fff;
    border: none;
    padding: 0.85rem 1.7rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    margin-top: 1.2rem;
    box-shadow: 0 2px 4px rgba(207, 74, 70, 0.2);
    transition: background 0.2s, transform 0.2s;
  }

  .sobre-btn:hover {
    background: var(--cor-azul-marinho-escuro);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(207, 74, 70, 0.3);
  }

  .sobre-btn:active {
    transform: translateY(0);
  }

  .sobre-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .pagination {
    padding: 1rem;
    text-align: center;
    color: #666;
    font-size: 0.9rem;
    background: #FAFAFA;
  }

  .footer {
    background: linear-gradient(135deg, var(--cor-azul-constantinopolitano), var(--cor-azul-constantinopolitano));
    color: #f5f3f0;
    padding: 3rem 2rem 1.5rem;
    margin-top: 3rem;
    border-top: 4px solid var(--cor-azul-marinho-escuro);
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
  }

  .footer-main {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    margin-bottom: 2rem;
  }

  .footer-logo-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .footer-logo {
    width: 40px;
    height: 40px;
    filter: brightness(0) invert(1);
  }

  .footer-title {
    color: white;
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
    letter-spacing: 1px;
  }

  .footer-contact {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
    max-width: 900px;
    margin: 0 auto;
  }

  .footer-contact-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    color: white;
    font-size: 1rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    border-left: 4px solid var(--cor-ouro-bizantino);
    transition: all 0.3s ease;
  }

  .footer-contact-item:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateX(5px);
  }

  .footer-icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    color: var(--cor-ouro-bizantino);
  }

  .footer-link {
    color: white;
    text-decoration: none;
    transition: color 0.2s;
  }

  .footer-link:hover {
    color: var(--cor-ouro-bizantino);
    text-decoration: underline;
  }

  .footer-copyright {
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    text-align: center;
  }

  .footer-copyright p {
    margin: 0;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .pagination {
    padding: 1rem;
    text-align: center;
    color: #666;
    font-size: 0.9rem;
    background: #FAFAFA;
  }

  /* Responsividade */
  @media (max-width: 768px) {
    .main-content {
      grid-template-columns: 1fr;
      padding: 1rem;
      gap: 1.5rem;
    }
    
    .header {
      padding: 1.5rem 1rem;
    }
    
    .header-content {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }
    
    .logo-section .main-title {
      font-size: 1.8rem;
      letter-spacing: 2px;
    }
    
    .header-nav {
      gap: 1rem;
      justify-content: center;
    }
    
    .nav-link {
      font-size: 0.8rem;
      padding: 0.4rem 0.8rem;
    }

    .sidebar {
      display: none; /* Hide sidebar completely on mobile */
    }

    .content {
      order: 1;
    }

    /* Mobile Filters Styles */
    .mobile-filters {
      display: block; /* Show on mobile */
      background: #FAFAFA;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      border: 2px solid var(--cor-cinza-neve);
      box-shadow: 0 2px 8px rgba(181, 101, 118, 0.1);
    }

    .mobile-filter-item {
      margin-bottom: 1rem;
    }

    .mobile-filter-item:last-of-type {
      margin-bottom: 1.5rem;
    }

    .mobile-filter-label {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--cor-azul-constantinopolitano);
      font-size: 0.9rem;
      font-weight: 600;
    }

    /* Mobile dropdown adjustments */
    .mobile-filter-item .dropdown-menu {
      max-height: 250px;
    }

    .mobile-clear-filters-btn {
      width: 100%;
      background: linear-gradient(135deg, #dc3545, #c82333);
      color: white;
      border: none;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.9rem;
      font-weight: 600;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(220, 53, 69, 0.2);
    }

    .mobile-clear-filters-btn:hover {
      background: linear-gradient(135deg, #c82333, #bd2130);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
    }

    .mobile-clear-filters-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    /* Show mobile list, hide desktop table */
    .desktop-table {
      display: none;
    }

    .mobile-list {
      display: block;
    }

    /* Responsive content header */
    .content-header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
      padding: 0.75rem 0;
    }

    .filters-display {
      text-align: center;
    }

    .active-filters {
      justify-content: center;
      margin-bottom: 0.5rem;
    }

    .filter-tag {
      font-size: 0.75rem;
      padding: 0.2rem 0.6rem;
    }

    .main-title-section h2 {
      font-size: 1.5rem;
      text-align: center;
    }

    /* Responsive stats by type */
    .type-stats-list {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .type-stat-item {
      padding: 0.6rem 0.8rem;
    }

    .type-label {
      font-size: 0.9rem;
    }

    .type-count {
      font-size: 1rem;
    }

    /* Responsive sobre section */
    .sobre-section {
      padding: 1rem;
      margin-bottom: 2rem;
    }

    .sobre-section h2 {
      font-size: 1.5rem;
      padding-bottom: 0.3rem;
    }

    .sobre-content h3 {
      font-size: 1.2rem;
      padding-bottom: 0.3rem;
    }

    .sobre-content h4 {
      font-size: 1rem;
      padding-bottom: 0.2rem;
    }

    .sobre-content ul {
      margin-left: 1rem;
    }

    .sobre-btn {
      width: 100%;
      font-size: 0.95rem;
      padding: 0.7rem 1rem;
    }

    /* Responsive near me controls */
    .near-me-controls-horizontal {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    .near-me-controls-horizontal .radius-control {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }

    .near-me-controls-horizontal .radius-control label {
      text-align: left;
    }

    /* Footer responsive */
    .footer {
      padding: 2rem 1rem 1rem;
    }

    .footer-main {
      gap: 1.5rem;
    }

    .footer-title {
      font-size: 1.3rem;
    }

    .footer-contact {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .footer-contact-item {
      font-size: 0.9rem;
      padding: 0.6rem 0.8rem;
    }

    .footer-icon {
      width: 20px;
      height: 20px;
    }
  }

  /* Tablet view - still show table but with smaller padding */
  @media (min-width: 769px) and (max-width: 1024px) {
    .main-content {
      grid-template-columns: 250px 1fr;
      gap: 1.5rem;
      padding: 1.5rem;
    }

    .sidebar {
      padding: 1.25rem;
    }

    th, td {
      padding: 0.75rem 0.5rem;
      font-size: 0.9rem;
    }

    .church-name {
      min-width: 150px;
    }

    table {
      min-width: 400px; /* Reduced for tablet since we removed Reitor column */
    }

    /* Keep desktop table visible on tablet */
    .desktop-table {
      display: block;
    }

    .mobile-list {
      display: none;
    }
  }

  /* Large desktop - maintain current layout */
  @media (min-width: 1025px) {
    .desktop-table {
      display: block;
    }

    .mobile-list {
      display: none;
    }
  }

  /* Loading Styles */
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    gap: 1rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid var(--cor-azul-constantinopolitano);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-overlay p {
    color: #666;
    font-size: 1.1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Disabled button styles */
  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Filter loading styles */
  .filter-loading {
    padding: 0.75rem 1rem;
    text-align: center;
    color: #666;
    font-style: italic;
    background: rgba(249, 245, 242, 0.8);
    border-radius: 6px;
    margin: 0.5rem 0;
  }

  /* Near Me Section Styles (always visible) */
  .near-me-section {
    background: linear-gradient(135deg, var(--cor-azul-constantinopolitano), var(--cor-azul-constantinopolitano));
    color: white;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 12px rgba(207, 74, 70, 0.2);
    position: relative;
    z-index: 1;
  }

  .near-me-section h2 {
    color: white;
    margin: 0 0 1rem 0;
    font-size: 1.3rem;
    font-weight: 600;
    border-bottom: 2px solid rgba(255,255,255,0.3);
    padding-bottom: 0.5rem;
  }

  .near-me-controls-horizontal {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .near-me-controls-horizontal .near-me-btn {
    background: rgba(255,255,255,0.1);
    border: 2px solid rgba(255,255,255,0.3);
    color: white;
    padding: 0.6rem 1.2rem;
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    white-space: nowrap;
  }

  .near-me-controls-horizontal .near-me-btn:hover {
    background: rgba(255,255,255,0.2);
    border-color: rgba(255,255,255,0.5);
  }

  .near-me-controls-horizontal .near-me-btn.active {
    background: white;
    color: var(--cor-azul-constantinopolitano);
    border-color: white;
  }

  .near-me-controls-horizontal .near-me-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .near-me-controls-horizontal .radius-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
  }

  .near-me-controls-horizontal .radius-control label {
    font-size: 0.85rem;
    font-weight: 600;
    color: rgba(255,255,255,0.9);
    white-space: nowrap;
    line-height: 1;
    display: flex;
    align-items: center;
  }

  .near-me-controls-horizontal .radius-control select {
    padding: 0.5rem 0.7rem;
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 4px;
    background: rgba(255,255,255,0.1);
    color: white;
    font-family: inherit;
    cursor: pointer;
    min-width: 80px;
    font-size: 0.85rem;
    line-height: 1;
    height: auto;
    position: relative;
    z-index: 10;
  }

  .near-me-controls-horizontal .radius-control select:focus {
    outline: none;
    border-color: rgba(255,255,255,0.6);
    background: rgba(255,255,255,0.15);
  }

  .near-me-controls-horizontal .radius-control select option {
    background: #333;
    color: white;
    padding: 0.5rem;
  }

  .near-me-controls-horizontal .location-error {
    padding: 0.5rem 1rem;
    background: rgba(255,100,100,0.2);
    border: 1px solid rgba(255,100,100,0.4);
    border-radius: 6px;
  }

  .near-me-controls-horizontal .location-error small {
    color: #ffcccc;
    font-weight: 500;
  }

  .near-me-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .loading-spinner-small {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .radius-control {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }

  .radius-control label {
    font-size: 0.85rem;
    font-weight: 600;
    color: rgba(255,255,255,0.9);
    white-space: nowrap;
  }

  .radius-control select {
    padding: 0.5rem;
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 6px;
    background: rgba(255,255,255,0.1);
    color: white;
    font-family: inherit;
    cursor: pointer;
  }

  .radius-control select:focus {
    outline: none;
    border-color: rgba(255,255,255,0.6);
  }

  .radius-control option {
    background: var(--cor-azul-constantinopolitano);
    color: white;
  }

  .location-error {
    text-align: center;
    padding: 0.5rem;
    background: rgba(255,100,100,0.2);
    border: 1px solid rgba(255,100,100,0.4);
    border-radius: 6px;
  }

  .location-error small {
    color: #ffcccc;
    font-weight: 500;
  }

  .distance-cell {
    font-weight: 600;
    color: var(--cor-azul-constantinopolitano);
    text-align: right;
  }

  /* Clear Filters Button Styles */
  .clear-filters-section {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 2px solid var(--cor-cinza-neve);
  }

  .clear-filters-btn {
    width: 100%;
    background: linear-gradient(135deg, var(--cor-azul-constantinopolitano), var(--cor-azul-constantinopolitano));
    color: white;
    border: none;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(207, 74, 70, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .clear-filters-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(207, 74, 70, 0.3);
  }

  .clear-filters-btn:active {
    transform: translateY(0);
  }

  .clear-filters-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 2px 4px rgba(207, 74, 70, 0.1);
  }

  /* Mobile responsiveness for Near Me */
  @media (max-width: 768px) {
    .near-me-section {
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .near-me-controls-horizontal {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
      position: relative;
    }

    .near-me-controls-horizontal .near-me-btn {
      width: 100%;
      justify-content: center;
    }

    .near-me-controls-horizontal .radius-control {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
      position: relative;
    }

    .near-me-controls-horizontal .radius-control label {
      text-align: left;
    }

    .near-me-controls-horizontal .radius-control select {
      width: 100%;
      position: relative;
    }
  }
</style>
