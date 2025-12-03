<script lang="ts">
  import type { PageProps } from './$types.js';
  import { getTipoEntidadeLabel, getJurisdicaoLabel, formatTelefone, formatCEP, getTipoEntidadeIconForDisplay } from '$lib/utils.js';
  
  let { data }: PageProps = $props();
  
  const entidade = $derived(data.entidade);
  
  // Photo gallery state
  let galleryExpanded = $state(false);
  let currentPhotoIndex = $state(0);
  
  function toggleGallery() {
    galleryExpanded = !galleryExpanded;
    if (galleryExpanded) {
      currentPhotoIndex = 0;
    }
  }
  
  function nextPhoto() {
    if (entidade.fotos && currentPhotoIndex < entidade.fotos.length - 1) {
      currentPhotoIndex++;
    }
  }
  
  function prevPhoto() {
    if (currentPhotoIndex > 0) {
      currentPhotoIndex--;
    }
  }
  
  function goToPhoto(index: number) {
    currentPhotoIndex = index;
  }
</script>

<svelte:head>
  <title>{entidade.nome} - Diretório Ortodoxo</title>
  <meta name="description" content="Detalhes sobre {entidade.nome} - {getTipoEntidadeLabel(entidade.tipo)} ortodoxa em {entidade.cidade}, {entidade.estado}" />
</svelte:head>

<div class="container">
  <header class="detail-header">
    <div class="breadcrumb">
      <a href="/">DIRETÓRIO ORTODOXO</a>
      <span>/</span>
      <a href="/">BRASIL</a>
      <span>/</span>
      <span>{entidade.nome}</span>
    </div>
    
    <div class="header-content">
      <div class="entity-title">
        <h1>{entidade.nome}</h1>
        <p class="entity-type">{getTipoEntidadeLabel(entidade.tipo)} • {entidade.cidade}, {entidade.estado}</p>
      </div>
    </div>
  </header>

  <main class="main-content">
    <!-- Informações Gerais - Full Width -->
    <section class="full-width-section">
      <div class="info-card">
        <h2>Informações Gerais</h2>
        <dl class="info-list">
          <div class="info-row">
            <dt>Nome:</dt>
            <dd>{entidade.nome}</dd>
          </div>
          <div class="info-row">
            <dt>Tipo:</dt>
            <dd>{getTipoEntidadeLabel(entidade.tipo)}</dd>
          </div>
          <div class="info-row">
            <dt>Reitor/Responsável:</dt>
            <dd>{entidade.reitor}</dd>
          </div>
          <div class="info-row">
            <dt>Diocese:</dt>
            <dd>{entidade.diocese.nome}</dd>
          </div>
          <div class="info-row">
            <dt>Jurisdição:</dt>
            <dd>{getJurisdicaoLabel(entidade.diocese.jurisdicao)}</dd>
          </div>
          {#if entidade.diocese.bispo}
            <div class="info-row">
              <dt>Bispo:</dt>
              <dd>S.E.R. {entidade.diocese.bispo}</dd>
            </div>
          {/if}
        </dl>
      </div>
    </section>

    <!-- Descrição - Full Width -->
    {#if entidade.descricao}
      <section class="full-width-section">
        <div class="info-card">
          <h2>Descrição</h2>
          <p class="description">{entidade.descricao}</p>
        </div>
      </section>
    {/if}

    <!-- Two Column Section: Photos and Location -->
    <div class="two-column-grid">
      <!-- Photo Gallery Preview -->
      {#if entidade.fotos && entidade.fotos.length > 0}
        <section class="photo-section">
          <div class="info-card photo-card">
            <h2>Fotos ({entidade.fotos.length})</h2>
            
            <!-- Preview with expand button -->
            <div class="gallery-preview" onclick={toggleGallery} onkeydown={(e) => e.key === 'Enter' && toggleGallery()} role="button" tabindex="0">
              <img src={entidade.fotos[0].url_foto} alt={entidade.fotos[0].legenda || entidade.nome} />
              <div class="expand-overlay">
                <div class="expand-button">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="16"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                  <span>Ver todas as fotos</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      {/if}

      <!-- Informações de Localização e Contato -->
      <section class="location-section">
        <div class="info-card">
          <h2>Localização e Contato</h2>
          
          <div class="contact-section">
            <h3>📍 Endereço</h3>
            <div class="address">
              <p>{entidade.endereco}</p>
              <p>{entidade.cidade}, {entidade.estado}</p>
              <p>CEP: {formatCEP(entidade.cep)}</p>
            </div>
          </div>

          {#if entidade.telefone}
            <div class="contact-section">
              <h3>📞 Telefone</h3>
              <p><a href="tel:{entidade.telefone}" class="contact-link">{formatTelefone(entidade.telefone)}</a></p>
            </div>
          {/if}

          {#if entidade.email}
            <div class="contact-section">
              <h3>✉️ Email</h3>
              <p><a href="mailto:{entidade.email}" class="contact-link">{entidade.email}</a></p>
            </div>
          {/if}

          {#if entidade.website}
            <div class="contact-section">
              <h3>🌐 Website</h3>
              <p><a href="{entidade.website}" target="_blank" rel="noopener noreferrer" class="contact-link">Visitar Website</a></p>
            </div>
          {/if}
        </div>
      </section>
    </div>

    <!-- Botão Voltar -->
    <div class="back-section">
      <a href="/" class="back-button">← Voltar ao Diretório</a>
    </div>
  </main>

  <!-- Footer -->
  <footer class="footer">
    <div class="footer-content">
      <p>© ECCLESIA - Diretório Ortodoxo 2025, Todos os direitos reservados</p>
    </div>
  </footer>
</div>

<!-- Photo Gallery Modal -->
{#if galleryExpanded && entidade.fotos && entidade.fotos.length > 0}
  <div class="modal-overlay" onclick={toggleGallery} onkeydown={(e) => e.key === 'Escape' && toggleGallery()} role="button" tabindex="0" aria-label="Fechar modal">
    <div class="modal-content" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
      <button class="modal-close" onclick={toggleGallery} aria-label="Fechar galeria">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      
      <div class="modal-carousel">
        <div class="carousel-main">
          {#if entidade.fotos[currentPhotoIndex]}
            <img src={entidade.fotos[currentPhotoIndex].url_foto} alt={entidade.fotos[currentPhotoIndex].legenda || entidade.nome} />
          {/if}
        </div>

        {#if entidade.fotos[currentPhotoIndex]?.legenda}
          <p class="carousel-caption">{entidade.fotos[currentPhotoIndex].legenda}</p>
        {/if}

        {#if entidade.fotos.length > 1}
          <button 
            class="carousel-nav prev" 
            onclick={prevPhoto} 
            disabled={currentPhotoIndex === 0}
            aria-label="Foto anterior"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          
          <button 
            class="carousel-nav next" 
            onclick={nextPhoto} 
            disabled={currentPhotoIndex === entidade.fotos.length - 1}
            aria-label="Próxima foto"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          <div class="carousel-footer">
            <div class="carousel-indicators">
              {#each entidade.fotos as _, index}
                <button 
                  class="indicator" 
                  class:active={index === currentPhotoIndex}
                  onclick={() => goToPhoto(index)}
                  aria-label="Ir para foto {index + 1}"
                ></button>
              {/each}
            </div>
            
            <div class="carousel-counter">
              {currentPhotoIndex + 1} / {entidade.fotos.length}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    font-family: 'Georgia', 'Times New Roman', serif;
    background-color: var(--cor-cinza-neve);
    color: var(--cor-azul-marinho-escuro);
    line-height: 1.6;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    min-height: 100vh;
    background: #ffffff;
    box-shadow: 0 0 30px rgba(42, 77, 122, 0.1);
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
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  }

  .entity-type {
    margin: 0.5rem 0 0 0;
    font-size: 1.1rem;
    opacity: 0.9;
    font-weight: 500;
  }

  .main-content {
    padding: 2rem;
  }

  .photo-card {
    background: white;
  }

  .gallery-preview {
    position: relative;
    cursor: pointer;
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.3s;
  }

  .gallery-preview:hover {
    transform: scale(1.02);
  }

  .gallery-preview img {
    width: 100%;
    height: 300px;
    object-fit: cover;
    display: block;
  }

  .expand-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s;
  }

  .gallery-preview:hover .expand-overlay {
    opacity: 1;
  }

  .expand-button {
    color: white;
    text-align: center;
    font-size: 1rem;
    font-weight: 600;
  }

  .expand-button svg {
    display: block;
    margin: 0 auto 0.5rem;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .modal-content {
    position: relative;
    max-width: 1200px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      transform: translateY(50px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: var(--cor-vermelho-bizantino);
    color: white;
    border: none;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    transition: all 0.3s;
  }

  .modal-close:hover {
    background: var(--cor-azul-constantinopolitano);
    transform: scale(1.1);
  }

  .modal-carousel {
    position: relative;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  }

  .modal-carousel .carousel-main {
    overflow: hidden;
    background: white;
  }

  .modal-carousel .carousel-main img {
    width: 100%;
    height: 70vh;
    max-height: 600px;
    object-fit: contain;
    display: block;
    background: white;
  }

  .carousel-caption {
    padding: 1rem;
    text-align: center;
    color: var(--cor-azul-marinho-escuro);
    background: white;
    margin: 0;
    border-top: 2px solid var(--cor-cinza-neve);
    font-size: 1rem;
  }

  .carousel-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: var(--cor-vermelho-bizantino);
    color: white;
    border: none;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
    z-index: 5;
  }

  .carousel-nav.prev {
    left: 1rem;
  }

  .carousel-nav.next {
    right: 1rem;
  }

  .carousel-nav:hover:not(:disabled) {
    background: var(--cor-azul-constantinopolitano);
    transform: translateY(-50%) scale(1.1);
  }

  .carousel-nav:disabled {
    background: rgba(100, 100, 100, 0.5);
    cursor: not-allowed;
    opacity: 0.3;
  }

  .carousel-footer {
    padding: 1.5rem;
    background: white;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }

  .carousel-indicators {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .indicator {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid var(--cor-azul-constantinopolitano);
    background: white;
    cursor: pointer;
    transition: all 0.3s;
    padding: 0;
  }

  .indicator:hover {
    transform: scale(1.3);
  }

  .indicator.active {
    background: var(--cor-azul-constantinopolitano);
    transform: scale(1.2);
  }

  .carousel-counter {
    text-align: center;
    color: var(--cor-azul-marinho-escuro);
    font-weight: 600;
    font-size: 1.1rem;
  }

  .full-width-section {
    margin-bottom: 2rem;
  }

  .two-column-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
  }

  .info-card {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(42, 77, 122, 0.1);
    border: 2px solid var(--cor-cinza-neve);
    margin-bottom: 1.5rem;
  }

  .info-card h2 {
    color: var(--cor-azul-constantinopolitano);
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    font-weight: 600;
    border-bottom: 2px solid var(--cor-azul-constantinopolitano);
    padding-bottom: 0.5rem;
  }

  .info-list {
    margin: 0;
  }

  .info-row {
    display: grid;
    grid-template-columns: 150px 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--cor-cinza-neve);
  }

  .info-row:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  .info-row dt {
    font-weight: 600;
    color: var(--cor-azul-constantinopolitano);
    margin: 0;
  }

  .info-row dd {
    color: var(--cor-azul-marinho-escuro);
    margin: 0;
  }

  .description {
    color: var(--cor-azul-marinho-escuro);
    font-size: 1.05rem;
    line-height: 1.7;
    margin: 0;
  }

  .contact-section {
    margin-bottom: 1.5rem;
  }

  .contact-section:last-child {
    margin-bottom: 0;
  }

  .contact-section h3 {
    color: var(--cor-azul-constantinopolitano);
    margin-bottom: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
  }

  .contact-section p {
    margin: 0;
    color: var(--cor-azul-marinho-escuro);
  }

  .address p {
    margin-bottom: 0.25rem;
  }

  .contact-link {
    color: var(--cor-azul-constantinopolitano);
    text-decoration: none;
    font-weight: 500;
  }

  .contact-link:hover {
    text-decoration: underline;
  }

  .back-section {
    text-align: center;
    padding: 2rem 0;
  }

  .back-button {
    background: var(--cor-azul-constantinopolitano);
    color: #ffffff;
    text-decoration: none;
    padding: 1rem 2rem;
    border-radius: 6px;
    font-weight: 600;
    transition: all 0.3s;
    border: 2px solid transparent;
  }

  .back-button:hover {
    background: var(--cor-azul-constantinopolitano);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(42, 77, 122, 0.3);
  }

  .footer {
    background: linear-gradient(135deg, var(--cor-azul-constantinopolitano), var(--cor-azul-constantinopolitano));
    color: #ffffff;
    padding: 2rem;
    text-align: center;
    border-top: 4px solid var(--cor-azul-constantinopolitano);
  }

  .footer-content p {
    margin: 0;
  }

  /* Responsividade */
  @media (max-width: 768px) {
    .two-column-grid {
      grid-template-columns: 1fr;
    }
    
    .header-content {
      flex-direction: column;
      text-align: center;
      gap: 1rem;
    }
    
    .entity-title h1 {
      font-size: 2rem;
    }

    .info-row {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .info-row dt {
      font-weight: 700;
      color: var(--cor-azul-constantinopolitano);
    }

    .main-content {
      padding: 1rem;
    }

    .gallery-preview img {
      height: 200px;
    }

    .modal-overlay {
      padding: 1rem;
    }

    .modal-close {
      top: 1rem;
      right: 1rem;
      width: 45px;
      height: 45px;
    }

    .modal-carousel .carousel-main img {
      height: 50vh;
    }

    .carousel-nav {
      width: 50px;
      height: 50px;
    }

    .carousel-nav.prev {
      left: 0.5rem;
    }

    .carousel-nav.next {
      right: 0.5rem;
    }

    .carousel-footer {
      padding: 1rem;
    }
  }
</style>
