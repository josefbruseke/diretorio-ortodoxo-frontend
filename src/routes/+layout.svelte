<script>
  import '../app.css';
</script>

<style>
  main {
    min-height: 100vh;
  }

  .footer {
    background: var(--cor-azul-marinho-escuro);
    color: white;
    padding: 2rem 1rem;
    margin-top: 3rem;
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
  }

  .footer-section h3 {
    color: var(--cor-ouro-bizantino);
    font-size: 1.125rem;
    margin-bottom: 1rem;
  }

  .jurisdiction-seals {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    align-items: flex-start;
  }

  .seal-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    max-width: 120px;
  }

  .seal {
    height: 60px;
    width: auto;
    opacity: 0.9;
    transition: opacity 0.3s ease;
  }

  .seal:hover {
    opacity: 1;
  }

  .seal-label {
    font-size: 0.75rem;
    text-align: center;
    line-height: 1.2;
    color: rgba(255, 255, 255, 0.9);
  }

  .footer-text {
    font-size: 0.875rem;
    line-height: 1.6;
  }

  .footer-bottom {
    text-align: center;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 0.875rem;
  }

  @media (max-width: 768px) {
    .jurisdiction-seals {
      justify-content: center;
    }

    .seal {
      height: 50px;
    }
  }
</style>

<main>
  <slot />
</main>

<footer class="footer">
  <div class="footer-content">
    <div class="footer-section">
      <h3>Sobre o Diretório</h3>
      <p class="footer-text">
        O Diretório Ortodoxo Brasil é uma iniciativa para mapear e conectar 
        todas as paróquias, catedrais, capelas e monastérios ortodoxos no Brasil.
      </p>
      <p class="footer-text">
        <a href="/sobre" style="color: var(--cor-ouro-bizantino); text-decoration: none;">
          Saiba mais sobre o projeto →
        </a>
      </p>
    </div>
    
    <div class="footer-section">
      <h3>Jurisdições Canônicas</h3>
      <div class="jurisdiction-seals">
        <div class="seal-item">
          <img src="/1-Patriarcado-Ecumenico.png" alt="Patriarcado Ecumênico" class="seal" title="Patriarcado Ecumênico" />
          <span class="seal-label">Patriarcado Ecumênico</span>
        </div>
        <div class="seal-item">
          <img src="/2-Patriarcado-de-Antioquia.png" alt="Patriarcado de Antioquia" class="seal" title="Patriarcado de Antioquia" />
          <span class="seal-label">Patriarcado de Antioquia</span>
        </div>
        <div class="seal-item">
          <img src="/3-Patriarcado-de-Moscou.png" alt="Patriarcado de Moscou" class="seal" title="Patriarcado de Moscou" />
          <span class="seal-label">Patriarcado de Moscou</span>
        </div>
        <div class="seal-item">
          <img src="/4-Patriarcado-da-Servia.png" alt="Patriarcado da Sérvia" class="seal" title="Patriarcado da Sérvia" />
          <span class="seal-label">Patriarcado da Sérvia</span>
        </div>
        <div class="seal-item">
          <img src="/5-Igreja-da-Polonia.png" alt="Igreja da Polônia" class="seal" title="Igreja da Polônia" />
          <span class="seal-label">Igreja da Polônia</span>
        </div>
      </div>
    </div>
    
    <div class="footer-section">
      <h3>Contato</h3>
      <p class="footer-text">
        Para adicionar ou atualizar informações sobre sua paróquia:<br />
        Telefone: <a href="tel:+554898456700" style="color: var(--cor-ouro-bizantino);">+55 (48) 98456-7000</a><br />
        Email: <a href="mailto:ecclesia@ecclesia.org.br" style="color: var(--cor-ouro-bizantino);">ecclesia@ecclesia.org.br</a><br />
        Site: <a href="https://ecclesia.org.br" style="color: var(--cor-ouro-bizantino);">Ecclesia.org.br</a>
      </p>
    </div>
  </div>
  
  <div class="footer-bottom">
    © {new Date().getFullYear()} Ecclesia - Diretório Ortodoxo Brasil. Todos os direitos reservados.
  </div>
</footer>
