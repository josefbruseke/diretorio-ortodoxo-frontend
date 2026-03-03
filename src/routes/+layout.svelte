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
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }

  .footer-section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .footer-section:nth-child(2) {
    justify-self: center;
  }

  .footer-section:nth-child(3) {
    justify-self: end;
  }

  .footer-section h3 {
    color: var(--cor-ouro-bizantino);
    font-size: 1.125rem;
    margin-bottom: 1rem;
  }

  @media (max-width: 768px) {
    .footer-content {
      grid-template-columns: 1fr;
    }
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

  .footer-developer {
    margin-top: 0.5rem;
    font-size: 0.8rem;
    opacity: 0.8;
  }

  .footer-developer a {
    color: var(--cor-ouro-bizantino);
    text-decoration: none;
  }

  .footer-developer a:hover {
    text-decoration: underline;
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

<footer id="footer" class="footer">
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
      <h3>Dados Incompletos?</h3>
      <p class="footer-text">
        Solicite uma atualização:<br />
        <a href="https://form.jotform.com/260157201328650" target="_blank" rel="noopener noreferrer" style="color: var(--cor-ouro-bizantino); text-decoration: none;">
          Formulário de atualização →
        </a>
      </p>
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
    <p class="footer-developer">
      Developed and maintained by <a href="https://www.linkedin.com/in/josefbruseke/" target="_blank" rel="noopener noreferrer">Josef Bruseke</a>
    </p>
  </div>
</footer>
