# Diretório Ortodoxo do - 🗺️ **Visualização em Mapa**: Interface interativa com Leaflet para localização das entidades
- 🔍 **Filtros Avançados**: Filtragem por tipo, jurisdição e estado
- 🔎 **Busca por Nome**: Busca textual focada no nome das entidades
- 📊 **Ordenação por Precedência Canônica**: Resultados organizados seguindo hierarquia eclesiástica ortodoxa
- 📍 **Próximo a Mim**: Funcionalidade de geolocalização para encontrar entidades próximas
- 📱 **Design Responsivo**: Otimizado para desktop e dispositivos móveis
- 👨‍💼 **Painel Administrativo**: Interface para gerenciamento de dioceses e entidades
- 🗃️ **Backend Supabase**: Armazenamento e gerenciamento de dados na nuvemUm diretório completo e interativo de igrejas, catedrais, monastérios e missões ortodoxas no Brasil. Construído com SvelteKit, Supabase e Leaflet.

## Sobre o Projeto

Este projeto é uma aplicação web que oferece um diretório abrangente das entidades eclesiásticas ortodoxas no Brasil, incluindo:

- **Catedrais**
- **Paróquias**
- **Capelas**
- **Missões**
- **Monastérios**

### Jurisdições Incluídas

- Patriarcado Ecumênico de Constantinopla
- Patriarcado de Antioquia
- Patriarcado de Moscou e Toda a Rússia
- Patriarcado da Sérvia
- Igreja Ortodoxa Autocéfala da Polônia

## Funcionalidades

- 🗺️ **Visualização em Mapa**: Interface interativa com Leaflet para localização das entidades
- 🔍 **Filtros Avançados**: Filtragem por tipo, jurisdição e estado
- � **Busca Textual**: Busca inteligente em nome, cidade, padroeiro, reitor e outros campos
- 📊 **Ordenação por Precedência Canônica**: Resultados organizados seguindo hierarquia eclesiástica ortodoxa
- �📍 **Próximo a Mim**: Funcionalidade de geolocalização para encontrar entidades próximas
- 📱 **Design Responsivo**: Otimizado para desktop e dispositivos móveis
- 👨‍💼 **Painel Administrativo**: Interface para gerenciamento de dioceses e entidades
- 🗃️ **Backend Supabase**: Armazenamento e gerenciamento de dados na nuvem

## Ordem de Precedência Canônica

O sistema implementa uma ordenação automática das entidades eclesiásticas seguindo a hierarquia canônica da Igreja Ortodoxa. Esta ordenação respeita a tradição e protocolo eclesiástico, organizando as entidades em 7 níveis hierárquicos:

### Hierarquia de Ordenação

#### 1. **Jurisdição (Patriarcado)**
```
1. Patriarcado Ecumênico
2. Patriarcado de Antioquia
3. Patriarcado de Moscou
4. Patriarcado da Sérvia
5. Igreja Autocéfala da Polônia
```

#### 2. **Subdivisão Eclesiástica** (ordem alfabética)
- Arquidiocese
- Eparquia
- Vicariato Patriarcal
- Vicariato

Exemplos:
- Patriarcado Ecumênico
  - Sacra Arquidiocese de Buenos Aires e América do Sul
  - Eparquia Ucraniana
- Patriarcado de Antioquia
  - Arquidiocese de São Paulo e Todo Brasil
  - Vicariato Patriarcal do Rio de Janeiro

#### 3. **Tipo de Entidade**
```
1. Catedral
2. Paróquia
3. Capela
4. Missão
5. Monastério
```

#### 4. **Região Geográfica**
```
1. Sudeste
2. Sul
3. Centro-Oeste
4. Nordeste
5. Norte
```

#### 5. **Estado** (ordem específica por região)
- **Sudeste:** SP → RJ → MG → ES
- **Sul:** PR → SC → RS
- **Centro-Oeste:** DF → GO → MT → MS
- **Nordeste:** AL → BA → CE → MA → PB → PE → PI → RN → SE
- **Norte:** AC → AP → AM → PA → RO → RR → TO

#### 6. **Capital vs Interior**
- Capitais aparecem primeiro
- Cidades do interior depois (ordem alfabética)

#### 7. **Ordem Alfabética**
- Dentro de capital ou interior, ordena por nome da cidade

### Sistema de Busca

O sistema inclui busca textual focada no **nome da entidade**.

**Recursos da busca:**
- 🔎 **Busca no nome** - Pesquisa apenas no nome oficial da entidade
- ⚡ **Debounce de 300ms** - Otimização de performance
- 🔤 **Case-insensitive** - Não diferencia maiúsculas/minúsculas
- 🎯 **Busca parcial** - "Paulo" encontra "São Paulo"
- 📊 **Contador de resultados** - Mostra quantidade em tempo real
- 🔄 **Integração com filtros** - Combina com filtros de Tipo, Jurisdição e Estado
- 📋 **Mantém ordem de precedência** - Resultados seguem hierarquia canônica

### Modo "Próximo a Mim"

Quando ativado, o sistema:
1. Solicita permissão de geolocalização
2. Filtra entidades dentro do raio selecionado
3. **Ordena por distância** (mais próximas primeiro)
4. Mostra distância em km de cada entidade


## Tecnologias Utilizadas

- **Frontend**: SvelteKit, TypeScript
- **Backend**: Supabase (PostgreSQL)
- **Mapas**: Leaflet com clustering de marcadores
- **Styling**: CSS customizado
- **Build Tool**: Vite

## Instalação e Configuração

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Conta no Supabase

### Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd diretorio-ortodoxo-frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente do Supabase no arquivo `.env`:
```env
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Execute o projeto em modo de desenvolvimento:
```bash
npm run dev
```

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Visualiza o build de produção localmente
- `npm run check` - Executa verificação de tipos e linting

## Estrutura do Projeto

```
src/
├── lib/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── EditCleroModal.svelte
│   │   ├── EditDioceseModal.svelte
│   │   └── EditEntidadeModal.svelte
│   ├── supabaseClient.ts    # Configuração do Supabase
│   ├── dataService.ts       # Serviço de dados
│   ├── Map.svelte          # Componente do mapa
│   ├── types.ts            # Definições de tipos TypeScript
│   └── utils.ts            # Utilitários (ordenação, formatação)
├── routes/
│   ├── +page.svelte        # Página principal do diretório
│   ├── entidade/[id]/      # Página de detalhes da entidade
│   ├── sobre/              # Página sobre o projeto
│   └── admin/              # Rotas administrativas
└── static/                 # Assets estáticos (imagens, ícones)
```

## Implementação Técnica

### Sistema de Ordenação por Precedência

A ordenação é implementada na função `sortByPrecedence()` em `src/lib/utils.ts`:

```typescript
import { sortByPrecedence } from '$lib/utils.js';

// Ordenar lista de entidades
const entidadesOrdenadas = sortByPrecedence(entidades);
```

**Características:**
- Type-safe com TypeScript
- Não muta o array original
- Ordenação estável (mantém ordem quando valores são iguais)
- Performance otimizada para grandes conjuntos de dados

### Sistema de Busca

Implementado em `src/routes/+page.svelte` com:

```typescript
// Variáveis de estado
let searchQuery = '';
let searchDebounceTimer: number;

// Busca com debounce
function handleSearchInput(event: Event) {
  searchQuery = input.value;
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    filterEntidades();
  }, 300);
}

// Filtragem integrada
function filterEntidades() {
  let results = entidades.filter(/* filtros de tipo, jurisdição, estado */);
  
  // Aplicar busca textual (apenas no nome)
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    results = results.filter(entidade => {
      const nomeMatch = entidade.nome?.toLowerCase().includes(query);
      return nomeMatch;
    });
  }
  
  // Ordenar por precedência canônica
  results = sortByPrecedence(results);
}
```

**Separação de responsabilidades:**
- **Busca** → Filtra pelo nome
- **Filtros** → Refinam por tipo, jurisdição, estado  
- **Ordenação** → Organiza por precedência usando todos os campos (jurisdição, tipo, região, estado, capital, cidade)

### Integração com Supabase

O projeto usa Supabase para:
- Autenticação de administradores
- Armazenamento de entidades eclesiásticas
- Gerenciamento de dioceses e clero
- Upload de fotos das entidades
- Row Level Security (RLS) para proteção de dados

### Mapa Interativo

Implementado com Leaflet:
- Clustering de marcadores para performance
- Ícones customizados por tipo de entidade
- Popups informativos
- Geolocalização do usuário
- Cálculo de distâncias

## Contribuição

Encontrou alguma informação incorreta ou desatualizada? Entre em contato através do email: info@ecclesia.org.br

## Documentação Adicional

Para informações detalhadas sobre o sistema de ordenação e busca, consulte:
- **[ORDEM_PRECEDENCIA.md](./ORDEM_PRECEDENCIA.md)** - Documentação completa sobre precedência canônica, sistema de busca, performance e exemplos de uso.

## Roadmap / Melhorias Futuras

- [ ] **Agrupamento visual** por jurisdição com separadores
- [ ] **Breadcrumb de precedência** mostrando caminho hierárquico completo
- [ ] **Filtro hierárquico** para selecionar diocese dentro de jurisdição
- [ ] **Exportação** da lista em PDF/Excel com ordenação
- [ ] **Busca inteligente** com priorização por precedência
- [ ] **Highlight** do termo buscado nos resultados
- [ ] **Histórico de buscas** do usuário
- [ ] **Autocomplete** baseado em entidades existentes
- [ ] **Busca fonética** para maior flexibilidade
- [ ] **Modo escuro** para melhor usabilidade noturna
- [ ] **PWA** (Progressive Web App) para instalação no dispositivo
- [ ] **Notificações** de novos eventos/missas

## Performance

O sistema é otimizado para:
- **Busca rápida:** < 50ms para 1000 entidades
- **Debounce inteligente:** 300ms para evitar buscas excessivas
- **Renderização eficiente:** Virtual scrolling para grandes listas
- **Cache local:** Reduz requisições ao servidor
- **Lazy loading:** Carrega imagens sob demanda

## Acessibilidade

O projeto segue as diretrizes WCAG 2.1:
- ✅ Navegação por teclado completa
- ✅ Labels e aria-labels apropriados
- ✅ Contraste de cores adequado
- ✅ Estados disabled visíveis
- ✅ Feedback visual e textual
- ✅ Responsivo para leitores de tela

## Contato

Para adicionar ou atualizar informações sobre sua paróquia:
- **Telefone:** +55 (48) 98456-7000
- **Email:** ecclesia@ecclesia.org.br
- **Site:** [ecclesia.org.br](https://ecclesia.org.br)

## Licença

© Diretório Ortodoxo 2025-2026, Todos os direitos reservados

---

**Desenvolvido com ❤️ para a comunidade ortodoxa no Brasil** 🇧🇷 ☦️
