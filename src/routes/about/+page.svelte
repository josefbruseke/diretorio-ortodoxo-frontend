<script>
  import { goto } from '$app/navigation';
</script>

<svelte:head>
  <title>Sobre o Diretório Ortodoxo Brasil - Ecclesia</title>
  <meta name="description" content="Conheça a história e a missão do Diretório Ortodoxo Brasil, mantido por Ecclesia desde 2003" />
</svelte:head>

<div class="about-container">
  <header class="about-header">
    <div class="header-content">
      <button on:click={() => goto('/')} class="back-button">
        ← Voltar ao Diretório
      </button>
      <h1>Apresentação do Diretório Brasil</h1>
    </div>
  </header>

  <article class="content">
    <section>
      <h2>1. Um serviço a favor da Comunidade Ortodoxa no Brasil</h2>
      <p>
        Desde 2003, <strong>Ecclesia Brasil</strong> tem se dedicado a preservar e difundir a memória, a vida e a presença da Igreja Ortodoxa em nosso país. Entre os diversos serviços oferecidos ao longo desses anos, um dos mais úteis — tanto pastoral quanto ecumenicamente — foi o <strong>Diretório Brasil das Igrejas Ortodoxas</strong>, mantido com grande esforço e atualizado continuamente graças às informações enviadas pelas próprias comunidades.
      </p>
      <p>
        Em um cenário nacional no qual proliferam denominações que usam indevidamente o nome "ortodoxa", esse diretório tornou-se referência segura para organismos ecumênicos, instituições civis, veículos de comunicação, pesquisadores e fiéis que buscavam informações fidedignas sobre a presença ortodoxa canônica no país.
      </p>
      <p>
        Trata-se, portanto, de um serviço eclesial que Ecclesia Brasil assumiu ao longo de mais de vinte anos, com responsabilidade, zelo e plena consciência de que a boa ordem também edifica o Corpo de Cristo.
      </p>
    </section>

    <section>
      <h2>2. Os limites do antigo diretório em PDF</h2>
      <p>
        O diretório, em seu formato tradicional — primeiro como uma página em HTML e, posteriormente, como um arquivo PDF hospedado no Ecclesia Brasil — cumpriu sua missão com dignidade durante muitos anos. Contudo, à medida que novas paróquias surgiam, endereços eram alterados, comunidades eram elevadas ou transferidas de jurisdição, tornou-se cada vez mais difícil:
      </p>
      <ul>
        <li>garantir que todas as atualizações se refletissem imediatamente;</li>
        <li>revisar e corrigir dados imprecisos;</li>
        <li>identificar duplicidades ou inconsistências;</li>
        <li>manter uma única versão estável e facilmente acessível.</li>
      </ul>
      <p>
        O processo exigia revisões constantes, recebimento manual de informações, reedição do PDF, verificação de layout e republicação. Em suma: um trabalho artesanal, extenso e pouco sustentável a longo prazo.
      </p>
    </section>

    <section>
      <h2>3. A inspiração: uma plataforma viva e dinâmica</h2>
      <p>
        Observando iniciativas internacionais — especialmente o <em>Orthodox World</em>, criado em 2006 como diretório global da presença ortodoxa — percebemos a necessidade de evoluir para um formato mais dinâmico, interativo e fácil de atualizar.
      </p>
      <p>
        O objetivo nunca foi copiar modelos prontos, mas adaptar ao Brasil uma solução que atendesse à nossa realidade, preservando a seriedade e a ordem canônica que sempre distinguiram o trabalho de Ecclesia.
      </p>
    </section>

    <section>
      <h2>4. O novo Diretório Ortodoxo Brasil</h2>
      <p>
        Com grande alegria, apresentamos a nova plataforma digital do <strong>Diretório das Igrejas Ortodoxas no Brasil</strong>.
      </p>
      <p>
        O desenvolvimento — conduzido por um jovem de nossa comunidade, profissional da área de programação — já avançou significativamente, integrando:
      </p>
      <ul>
        <li>informações atualizadas de todas as paróquias, missões, capelas e monastérios canônicos no país;</li>
        <li>infraestrutura ágil e moderna, hospedada na Vercel;</li>
        <li>atualização permanente sincronizada com planilha de base (Google Sheets);</li>
        <li>visual limpo e organizado por Estado → Cidade → Comunidade;</li>
        <li>foco na precisão dos dados, evitando duplicidades e registros obsoletos;</li>
        <li>navegação fluida, adaptada também para dispositivos móveis.</li>
      </ul>
      <p>
        Esse novo diretório representa um salto de qualidade na forma como a presença ortodoxa no Brasil é apresentada, consultada e preservada.
      </p>
    </section>

    <section>
      <h2>5. Uma obra colaborativa: precisamos de sua participação</h2>
      <p>
        O diretório não será estático. Ele nasce para ser:
      </p>
      <ul class="highlight-list">
        <li>vivo,</li>
        <li>colaborativo,</li>
        <li>verificável,</li>
        <li>atualizado pelas próprias comunidades.</li>
      </ul>
      <p>
        Assim, convidamos:
      </p>
      <ul>
        <li>paróquias, missões e monastérios;</li>
        <li>clérigos, reitores e responsáveis eclesiásticos;</li>
        <li>fiéis engajados na vida comunitária;</li>
      </ul>
      <p>
        a colaborar com envio de correções, atualizações e complementações.
      </p>
      <p>
        Esse é um serviço a toda a Igreja no Brasil. Um diretório completo, confiável e canônico fortalece nossa presença, evita confusões, e testemunha a unidade da fé ortodoxa no território nacional.
      </p>
    </section>

    <section>
      <h2>6. Nosso compromisso</h2>
      <p>
        Ecclesia Brasil reafirma seu compromisso de:
      </p>
      <ul>
        <li>manter a plataforma organizada,</li>
        <li>garantir a correção das informações,</li>
        <li>promover o intercâmbio entre as comunidades,</li>
        <li>e servir como instrumento de comunhão e boa ordem.</li>
      </ul>
      <p>
        Que este trabalho, iniciado há duas décadas e agora renovado com recursos modernos, permaneça ao serviço do povo ortodoxo, dos nossos hierarcas e de todos que buscam a Verdade.
      </p>
    </section>

    <section class="conclusion">
      <p>
        <strong>O Diretório Ortodoxo Brasil é mais do que uma listagem de endereços</strong>: é um mapa vivo da presença ortodoxa em nossa pátria, um elo de unidade entre nossas comunidades e um testemunho público da fé que recebemos.
      </p>
      <p class="benediction">
        Que o Senhor abençoe este esforço comum e que, pela intercessão da Theotokos, possamos sempre caminhar "na boa ordem e na firmeza da fé de Cristo".
      </p>
    </section>

    <div class="cta-section">
      <a href="https://form.jotform.com/260157201328650" target="_blank" rel="noopener noreferrer" class="cta-button">
        Solicitar Atualização de Dados
      </a>
    </div>

    <div class="cta-section">
      <button on:click={() => window.scrollTo({ top: 0, behavior: 'smooth' })} class="scroll-top-button">
        ↑ Voltar ao topo
      </button>
    </div>
  </article>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }

  .about-container {
    min-height: 100vh;
    background: linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%);
  }

  .about-header {
    color: white;
    padding: 2rem 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    position: relative;
  }

  .header-content {
    max-width: 900px;
    margin: 0 auto;
    position: relative;
  }

  .back-button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.95rem;
    transition: all 0.3s ease;
    margin-bottom: 1.5rem;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .back-button:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateX(-4px);
  }

  .ecclesia-logo {
    height: 60px;
    margin-bottom: 1rem;
    display: block;
  }

  .about-header h1 {
    font-size: 2.5rem;
    margin: 0;
    font-weight: 700;
    color: var(--cor-ouro-bizantino);
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  }

  .content {
    max-width: 900px;
    margin: 0 auto;
    padding: 3rem 2rem;
  }

  section {
    margin-bottom: 3rem;
  }

  h2 {
    color: var(--cor-azul-marinho-escuro);
    font-size: 1.75rem;
    margin-bottom: 1.25rem;
    font-weight: 600;
    border-left: 4px solid var(--cor-ouro-bizantino);
    padding-left: 1rem;
  }

  p {
    line-height: 1.8;
    color: #333;
    font-size: 1.1rem;
    margin-bottom: 1rem;
    text-align: justify;
  }

  ul {
    line-height: 1.8;
    color: #333;
    font-size: 1.1rem;
    margin: 1rem 0 1rem 2rem;
  }

  li {
    margin-bottom: 0.5rem;
  }

  .highlight-list {
    list-style: none;
    margin-left: 1rem;
  }

  .highlight-list li {
    color: var(--cor-azul-marinho);
    font-weight: 600;
    font-style: italic;
  }

  strong {
    color: var(--cor-azul-marinho-escuro);
    font-weight: 600;
  }

  em {
    color: var(--cor-azul-marinho);
  }

  .conclusion {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    padding: 2rem;
    border-radius: 8px;
    border-left: 4px solid var(--cor-ouro-bizantino);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .benediction {
    font-style: italic;
    color: var(--cor-azul-marinho);
    font-weight: 500;
    margin-top: 1.5rem;
    text-align: center;
    font-size: 1.15rem;
  }

  .cta-section {
    text-align: center;
    margin-top: 3rem;
  }

  .cta-button {
    display: inline-block;
    text-decoration: none;
    background: linear-gradient(135deg, var(--cor-azul-marinho) 0%, var(--cor-azul-mariano) 100%);
    color: white;
    border: none;
    padding: 1rem 2.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    border-radius: 50px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0, 48, 87, 0.3);
    transition: all 0.3s ease;
  }

  .cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 48, 87, 0.4);
  }

  .scroll-top-button {
    background: transparent;
    color: var(--cor-azul-marinho-escuro);
    border: 2px solid var(--cor-azul-marinho-escuro);
    padding: 0.75rem 2rem;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .scroll-top-button:hover {
    background: var(--cor-azul-marinho-escuro);
    color: white;
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    .about-header h1 {
      font-size: 1.75rem;
    }

    .content {
      padding: 2rem 1rem;
    }

    h2 {
      font-size: 1.4rem;
    }

    p, ul {
      font-size: 1rem;
      text-align: left;
    }

    .ecclesia-logo {
      height: 50px;
    }

    .conclusion {
      padding: 1.5rem;
    }

    .cta-button {
      padding: 0.875rem 2rem;
      font-size: 1rem;
    }
  }
</style>
