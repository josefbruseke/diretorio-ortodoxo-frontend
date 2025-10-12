# Diretório Ortodoxo do Brasil

Um diretório completo e interativo de igrejas, catedrais, mosteiros e missões ortodoxas no Brasil. Construído com SvelteKit, Supabase e Leaflet.

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
- 📍 **Próximo a Mim**: Funcionalidade de geolocalização para encontrar entidades próximas
- 📱 **Design Responsivo**: Otimizado para desktop e dispositivos móveis
- 👨‍💼 **Painel Administrativo**: Interface para gerenciamento de dioceses e entidades
- 🗃️ **Backend Supabase**: Armazenamento e gerenciamento de dados na nuvem

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
│   ├── supabaseClient.ts    # Configuração do Supabase
│   ├── dataService.ts       # Serviço de dados
│   ├── Map.svelte          # Componente do mapa
│   └── types.ts            # Definições de tipos TypeScript
├── routes/
│   ├── +page.svelte        # Página principal do diretório
│   ├── entidade/[id]/      # Página de detalhes da entidade
│   └── admin/              # Rotas administrativas
└── static/                 # Assets estáticos
```

## Contribuição

Encontrou alguma informação incorreta ou desatualizada? Entre em contato através do email: info@ecclesia.org.br

## Licença

© Diretório Ortodoxo 2025, Todos os direitos reservados
