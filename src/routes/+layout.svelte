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
    gap: 1rem;
    align-items: center;
  }

  .seal {
    height: 60px;
    width: auto;
    filter: brightness(0) invert(1);
    opacity: 0.8;
    transition: opacity 0.3s ease;
  }

  .seal:hover {
    opacity: 1;
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
    </div>
    
    <div class="footer-section">
      <h3>Jurisdições Canônicas</h3>
      <div class="jurisdiction-seals">
        <img src="/selo-patriarcado-ecumenico.png" alt="Patriarcado Ecumênico" class="seal" title="Patriarcado Ecumênico" />
        <img src="/selo-vicariato-patriarcal-rj.png" alt="Vicariato Patriarcal RJ" class="seal" title="Vicariato Patriarcal RJ" />
        <img src="/selo-antioquia-sp.png" alt="Patriarcado de Antioquia" class="seal" title="Patriarcado de Antioquia" />
        <img src="/selo-vicariato-russo.png" alt="Patriarcado de Moscou" class="seal" title="Patriarcado de Moscou" />
        <img src="/selo-vicariato-servio.png" alt="Patriarcado da Sérvia" class="seal" title="Patriarcado da Sérvia" />
        <img src="/selo-eparquia-polonia.png" alt="Igreja da Polônia" class="seal" title="Igreja da Polônia" />
      </div>
    </div>
    
    <div class="footer-section">
      <h3>Contato</h3>
      <p class="footer-text">
        Para adicionar ou atualizar informações sobre sua paróquia,<br />
        entre em contato através do site <a href="https://ecclesia.org.br" style="color: var(--cor-ouro-bizantino);">Ecclesia.org.br</a>
      </p>
    </div>
  </div>
  
  <div class="footer-bottom">
    © {new Date().getFullYear()} Ecclesia - Diretório Ortodoxo Brasil. Todos os direitos reservados.
  </div>
</footer>
