<script lang="ts">
  import { onMount } from 'svelte';
  import type { Map as LeafletMap } from 'leaflet';
  import type { EntidadeEclesiastica } from './types.js';
  import { getTipoEntidadeLabel, getTipoEntidadeIconForDisplay } from './utils.js';
  import 'leaflet.markercluster/dist/MarkerCluster.css';
  import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
  
  export let entidades: EntidadeEclesiastica[] = [];
  export let userLocation: [number, number] | null = null;
  export let radiusKm: number | null = null;
  export let showNearMe: boolean = false;
  
  let mapContainer: HTMLElement;
  let map: LeafletMap;
  let coordinatesCache = new Map<string, [number, number]>();
  let markerClusterGroup: any = null;
  let userLocationMarker: any = null;
  let radiusCircle: any = null;
  let loadingMarkers = false;
  let isUpdatingMarkers = false;
  
  onMount(async () => {
    // Importa Leaflet dinamicamente para evitar problemas com SSR
    const L = await import('leaflet');
    
    // Cria o mapa centrado no Brasil com configurações de zoom
    map = L.default.map(mapContainer, {
      center: [-15.7942, -47.8822],
      zoom: 5,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      dragging: true,
      zoomAnimation: true,
      zoomAnimationThreshold: 4,
      fadeAnimation: true,
      markerZoomAnimation: true
    });
    
    // Adiciona tiles do OpenStreetMap
    L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      minZoom: 3
    }).addTo(map);
    
    // Cria grupo de clusters para marcadores
    await import('leaflet.markercluster');
    markerClusterGroup = L.default.markerClusterGroup({
      disableClusteringAtZoom: 15,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 50
    });
    map.addLayer(markerClusterGroup);
    
    // Adiciona marcadores iniciais
    await updateMarkers(L);
    
    // Adiciona listener para recalcular tamanho após zoom
    map.on('zoomend', () => {
      setTimeout(() => {
        map.invalidateSize();
      }, 50);
    });
    
    // Adiciona listener para recalcular tamanho após movimentação
    map.on('moveend', () => {
      setTimeout(() => {
        map.invalidateSize();
      }, 50);
    });
    
    // Adiciona listener específico para zoom start
    map.on('zoomstart', () => {
      map.invalidateSize();
    });
    
    // Força recalculo inicial após um pequeno delay
    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  });
  // Reativo: atualiza marcadores quando entidades mudam
  $: if (map && markerClusterGroup && entidades) {
    import('leaflet').then(L => updateMarkers(L));
  }

  // Reativo: atualiza localização do usuário e zoom quando showNearMe muda
  $: if (map && userLocation && showNearMe && radiusKm) {
    import('leaflet').then(L => updateUserLocationAndZoom(L));
  }

  // Reativo: remove localização do usuário quando showNearMe é desativado
  $: if (map && !showNearMe) {
    import('leaflet').then(L => clearUserLocationAndZoom(L));
  }

  async function updateMarkers(L: any) {
    if (!markerClusterGroup || isUpdatingMarkers) return;
    
    isUpdatingMarkers = true;
    loadingMarkers = true;
    
    // Remove marcadores existentes do grupo de clusters
    markerClusterGroup.clearLayers();
    
    // Adiciona novos marcadores
    await addMarkersToMap(L, entidades);
    
    loadingMarkers = false;
    isUpdatingMarkers = false;
  }

  async function updateUserLocationAndZoom(L: any) {
    if (!userLocation || !radiusKm) return;

    // Remove marcador e círculo anteriores se existirem
    clearUserLocationAndZoom(L, false);

    // Adiciona marcador da localização do usuário
    const userIcon = L.default.divIcon({
      html: '📍',
      iconSize: [24, 24],
      className: 'user-location-marker'
    });

    userLocationMarker = L.default.marker(userLocation, { icon: userIcon }).addTo(map);
    userLocationMarker.bindPopup(`
      <div class="user-location-popup">
        <h4>Sua Localização</h4>
        <p>Buscando igrejas em um raio de ${radiusKm}km</p>
      </div>
    `);

    // Adiciona círculo do raio
    radiusCircle = L.default.circle(userLocation, {
      radius: radiusKm * 1000, // Converte km para metros
      fillColor: '#4C8EA1',
      fillOpacity: 0.1,
      color: '#2A4D7A',
      weight: 2,
      opacity: 0.6
    }).addTo(map);

    // Usa fitBounds para ajustar o zoom automaticamente para mostrar todo o círculo
    // Adiciona um padding menor para o círculo ficar mais próximo (mais zoom)
    const bounds = radiusCircle.getBounds();
    map.fitBounds(bounds, {
      padding: [20, 20], // Padding reduzido em pixels (de 50 para 20)
      maxZoom: 16, // Permite um pouco mais de zoom próximo (de 15 para 16)
      animate: true,
      duration: 0.5
    });
    
    // Força recalculo do tamanho do mapa após a mudança de visualização
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }

  function clearUserLocationAndZoom(L: any, setViewToDefault = true) {
    // Remove marcador do usuário se existir
    if (userLocationMarker) {
      map.removeLayer(userLocationMarker);
      userLocationMarker = null;
    }

    // Remove círculo do raio se existir
    if (radiusCircle) {
      map.removeLayer(radiusCircle);
      radiusCircle = null;
    }

    if (setViewToDefault) {
      // Volta para a visualização padrão do Brasil
      map.setView([-15.7942, -47.8822], 5);
      
      // Força recalculo do tamanho do mapa após voltar à visualização padrão
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }

  async function addMarkersToMap(L: any, entidades: EntidadeEclesiastica[]) {
    if (!markerClusterGroup) return;
    
    for (const entidade of entidades) {
      let coordinates: [number, number] | null = null;
      
      // Primeiro tenta usar coordenadas do backend
      if (entidade.latitude && entidade.longitude) {
        coordinates = [entidade.latitude, entidade.longitude];
      } else {
        // Fallback: calcula coordenadas como antes (para compatibilidade)
        coordinates = await getCoordinatesFromCEP(entidade);
      }
      
      if (coordinates) {
        const icon = L.default.divIcon({
          html: getTipoEntidadeIconForDisplay(entidade.tipo),
          iconSize: [100, 100],
          className: 'orthodox-marker'
        });
        
        const marker = L.default.marker(coordinates, { icon });
        
        const popupContent = `
          <div class="marker-popup">
            <h4>${entidade.nome}</h4>
            <p><strong>Tipo:</strong> ${getTipoEntidadeLabel(entidade.tipo)}</p>
            <p><strong>Reitor:</strong> ${entidade.reitor}</p>
            <p><strong>Local:</strong> ${entidade.cidade}, ${entidade.estado}</p>
            <p><strong>Endereço:</strong> ${entidade.endereco}</p>
            ${entidade.telefone ? `<p><strong>Telefone:</strong> ${entidade.telefone}</p>` : ''}
            ${entidade.website ? `<p><a href="${entidade.website}" target="_blank" class="popup-link">Website</a></p>` : ''}
            <div class="popup-actions">
              <a href="/entidade/${entidade.id}" class="details-button">Detalhes</a>
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // Adiciona o marcador ao grupo de clusters
        markerClusterGroup.addLayer(marker);
      }
    }
  }

  async function getCoordinatesFromCEP(entidade: EntidadeEclesiastica): Promise<[number, number] | null> {
    // Se já temos as coordenadas em cache, retorna
    const cacheKey = `${entidade.cep}-${entidade.cidade}-${entidade.estado}`;
    if (coordinatesCache.has(cacheKey)) {
      return coordinatesCache.get(cacheKey)!;
    }

    let coordinates: [number, number] | null = null;

    // 1. Primeiro tenta por CEP (se disponível e válido)
    if (entidade.cep && entidade.cep.trim()) {
      coordinates = await getCoordinatesByCEP(entidade.cep);
    }

    // 2. Se não conseguiu por CEP, tenta por cidade/estado
    if (!coordinates) {
      coordinates = await getCoordinatesByCity(entidade.cidade, entidade.estado);
    }

    // Salva no cache se encontrou
    if (coordinates) {
      coordinatesCache.set(cacheKey, coordinates);
    }

    return coordinates;
  }

  async function getCoordinatesByCEP(cep: string): Promise<[number, number] | null> {
    try {
      // Remove caracteres não numéricos do CEP
      const cleanCEP = cep.replace(/\D/g, '');
      
      if (cleanCEP.length !== 8) return null;

      // Usa a API do ViaCEP que também retorna coordenadas aproximadas
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      if (data.erro) return null;

      // Se ViaCEP não tem coordenadas, usa a API do Nominatim com o endereço completo
      const address = `${data.logradouro}, ${data.localidade}, ${data.uf}, Brasil`;
      return await getCoordinatesByAddress(address);
      
    } catch (error) {
      console.warn('Erro ao buscar coordenadas por CEP:', error);
      return null;
    }
  }

  async function getCoordinatesByCity(cidade: string, estado: string): Promise<[number, number] | null> {
    try {
      const address = `${cidade}, ${estado}, Brasil`;
      return await getCoordinatesByAddress(address);
    } catch (error) {
      console.warn('Erro ao buscar coordenadas por cidade:', error);
      return null;
    }
  }

  async function getCoordinatesByAddress(address: string): Promise<[number, number] | null> {
    try {
      // Usa a API do Nominatim (OpenStreetMap) para geocoding
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=br`
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      if (data.length === 0) return null;
      
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      
      if (isNaN(lat) || isNaN(lon)) return null;
      
      return [lat, lon];
      
    } catch (error) {
      console.warn('Erro ao buscar coordenadas por endereço:', error);
      return null;
    }
  }

</script>

<div class="map-container">
  {#if loadingMarkers}
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Carregando localizações...</p>
    </div>
  {/if}
  <div class="map" bind:this={mapContainer}></div>
</div>

<style>
  .map-container {
    height: 400px;
    width: 100%;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    margin-bottom: 2rem;
    position: relative;
    min-height: 400px;
  }
  
  .map {
    height: 100%;
    width: 100%;
    position: relative;
    z-index: 1;
  }
  
  /* Garante que os tiles do Leaflet sejam renderizados corretamente */
  :global(.leaflet-container) {
    height: 100%;
    width: 100%;
    position: relative;
    outline: none;
  }
  
  :global(.leaflet-tile-container) {
    position: absolute;
  }

  .loading-overlay {
    position: absolute;
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
    border: 4px solid var(--cor-cinza-neve);
    border-top: 4px solid var(--cor-azul-constantinopolitano);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-overlay p {
    color: #666;
    font-weight: 500;
    margin: 0;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  :global(.orthodox-marker) {
    background: none;
    border: none;
    font-size: 20px;
  }

  :global(.user-location-marker) {
    background: none;
    border: none;
    font-size: 24px;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  }
  
  :global(.marker-popup h4) {
    margin: 0 0 8px 0;
    color: var(--cor-azul-constantinopolitano);
    font-size: 1rem;
  }

  :global(.user-location-popup h4) {
    margin: 0 0 8px 0;
    color: var(--cor-azul-constantinopolitano);
    font-size: 1rem;
  }

  :global(.user-location-popup p) {
    margin: 4px 0;
    font-size: 0.9rem;
    color: #555;
  }
  
  :global(.marker-popup p) {
    margin: 4px 0;
    font-size: 0.9rem;
    color: #555;
  }
  
  :global(.marker-popup) {
    font-family: inherit;
    min-width: 200px;
  }

  :global(.user-location-popup) {
    font-family: inherit;
    min-width: 200px;
  }

  :global(.popup-actions) {
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid #eee;
    text-align: center;
  }

  :global(.details-button) {
    background: var(--cor-azul-constantinopolitano);
    color: white !important;
    text-decoration: none !important;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 600;
    display: inline-block;
    transition: all 0.3s;
    border: 1px solid var(--cor-azul-constantinopolitano);
  }

  :global(.details-button:hover) {
    background: var(--cor-azul-marinho-escuro);
    border-color: var(--cor-azul-marinho-escuro);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(42, 77, 122, 0.3);
  }

  :global(.popup-link) {
    color: var(--cor-azul-constantinopolitano) !important;
    text-decoration: none !important;
    font-weight: 500;
  }

  :global(.popup-link:hover) {
    text-decoration: underline !important;
  }

  /* Custom marker cluster colors */
  :global(.marker-cluster-small) {
    background-color: rgba(42, 77, 122, 0.6);
    border: 2px solid var(--cor-azul-constantinopolitano);
  }

  :global(.marker-cluster-small div) {
    background-color: rgba(42, 77, 122, 0.6);
    color: white;
    font-weight: bold;
    text-align: center;
  }

  :global(.marker-cluster-medium) {
    background-color: rgba(42, 77, 122, 0.7);
    border: 2px solid var(--cor-azul-constantinopolitano);
  }

  :global(.marker-cluster-medium div) {
    background-color: rgba(42, 77, 122, 0.7);
    color: white;
    font-weight: bold;
    text-align: center;
  }

  :global(.marker-cluster-large) {
    background-color: rgba(42, 77, 122, 0.8);
    border: 2px solid var(--cor-azul-constantinopolitano);
  }

  :global(.marker-cluster-large div) {
    background-color: rgba(42, 77, 122, 0.8);
    color: white;
    font-weight: bold;
    text-align: center;
  }

  :global(.marker-cluster) {
    background-color: rgba(42, 77, 122, 0.9);
    border: 2px solid var(--cor-azul-constantinopolitano);
  }

  :global(.marker-cluster div) {
    background-color: rgba(42, 77, 122, 0.9);
    color: white;
    font-weight: bold;
    text-align: center;
  }

</style>
