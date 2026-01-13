import type { Jurisdicao, TipoEntidade } from './types.js';

export const jurisdicaoLabels: Record<Jurisdicao, string> = {
  'PatriarcadoEcumenico': 'Patriarcado Ecumênico',
  'PatriarcadoDeAntioquia': 'Patriarcado de Antioquia',
  'PatriarcadoDeMoscou': 'Patriarcado de Moscou',
  'PatriarcadoDaServia': 'Patriarcado da Sérvia',
  'IgrejaAutocefalaDoPolonia': 'Igreja Autocéfala da Polônia'
};

export const tipoEntidadeLabels: Record<string, string> = {
  'Catedral': 'Catedral',
  'Paróquia': 'Paróquia',
  'Capela': 'Capela',
  'Missão': 'Missão',
  'Monastério': 'Monastério'
};

export const tipoEntidadeIcons: Record<string, string> = {
  'Catedral': '/icon-catedral.png',
  'Paróquia': '/icon-paroquia.png',
  'Capela': '/icon-capela.png',
  'Missão': '/icon-missao.png',
  'Monastério': '/icon-monasterio.png'
};

export const tipoEntidadeSvgIcons: Record<string, string> = {
  'Catedral': '/icon-catedral.png',
  'Paróquia': '/icon-paroquia.png',
  'Capela': '/icon-capela.png',
  'Missão': '/icon-missao.png',
  'Monastério': '/icon-monasterio.png'
};

export function getJurisdicaoLabel(jurisdicao: Jurisdicao): string {
  return jurisdicaoLabels[jurisdicao];
}

export function getTipoEntidadeLabel(tipo: string): string {
  return tipoEntidadeLabels[tipo] || tipo;
}

export function getTipoEntidadeIcon(tipo: string): string {
  return tipoEntidadeIcons[tipo] || '/paroquia.svg';
}

export function getTipoEntidadeSvgIcon(tipo: string): string {
  return tipoEntidadeSvgIcons[tipo] || '/paroquia.svg';
}

export function getTipoEntidadeIconForDisplay(tipo: string): string {
  const iconPath = tipoEntidadeIcons[tipo] || '/paroquia.svg';
  
  // Catedral gets a larger size for better visibility
  const size = tipo === 'Catedral' ? 80 : 48;
  
  return `<div style="position: relative; width: 100px; height: 100px;"><img src="${iconPath}" alt="${tipo}" style="width: ${size}px; height: ${size}px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);" /></div>`;
}

export function formatTelefone(telefone: string | null): string {
  if (!telefone) return '';
  
  // Remove todos os caracteres não numéricos
  const numbers = telefone.replace(/\D/g, '');
  
  // Formata baseado no tamanho
  if (numbers.length === 11) {
    // Celular: (XX) XXXXX-XXXX
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  } else if (numbers.length === 10) {
    // Fixo: (XX) XXXX-XXXX
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  
  return telefone;
}

export function formatCEP(cep: string | null): string {
  if (!cep) return '';
  
  const numbers = cep.replace(/\D/g, '');
  if (numbers.length === 8) {
    return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
  }
  return cep;
}

// Ordem de precedência das jurisdições
const jurisdicaoPrecedencia: Record<Jurisdicao, number> = {
  'PatriarcadoEcumenico': 1,
  'PatriarcadoDeAntioquia': 2,
  'PatriarcadoDeMoscou': 3,
  'PatriarcadoDaServia': 4,
  'IgrejaAutocefalaDoPolonia': 5
};

// Ordem de precedência dos tipos de entidade
const tipoEntidadePrecedencia: Record<TipoEntidade, number> = {
  'Catedral': 1,
  'Paróquia': 2,
  'Capela': 3,
  'Missão': 4,
  'Monastério': 5
};

// Ordem de precedência das regiões
const regiaoPrecedencia: Record<string, number> = {
  'Sudeste': 1,
  'Sul': 2,
  'Centro-Oeste': 3,
  'Nordeste': 4,
  'Norte': 5
};

// Ordem de precedência dos estados por região
const estadoPrecedenciaPorRegiao: Record<string, Record<string, number>> = {
  'Sudeste': { 'SP': 1, 'RJ': 2, 'MG': 3, 'ES': 4 },
  'Sul': { 'PR': 1, 'SC': 2, 'RS': 3 },
  'Centro-Oeste': { 'DF': 1, 'GO': 2, 'MT': 3, 'MS': 4 },
  'Nordeste': { 'AL': 1, 'BA': 2, 'CE': 3, 'MA': 4, 'PB': 5, 'PE': 6, 'PI': 7, 'RN': 8, 'SE': 9 },
  'Norte': { 'AC': 1, 'AP': 2, 'AM': 3, 'PA': 4, 'RO': 5, 'RR': 6, 'TO': 7 }
};

// Mapa de estados para regiões
const estadoParaRegiao: Record<string, string> = {
  // Sudeste
  'SP': 'Sudeste', 'RJ': 'Sudeste', 'MG': 'Sudeste', 'ES': 'Sudeste',
  // Sul
  'PR': 'Sul', 'SC': 'Sul', 'RS': 'Sul',
  // Centro-Oeste
  'DF': 'Centro-Oeste', 'GO': 'Centro-Oeste', 'MT': 'Centro-Oeste', 'MS': 'Centro-Oeste',
  // Nordeste
  'AL': 'Nordeste', 'BA': 'Nordeste', 'CE': 'Nordeste', 'MA': 'Nordeste',
  'PB': 'Nordeste', 'PE': 'Nordeste', 'PI': 'Nordeste', 'RN': 'Nordeste', 'SE': 'Nordeste',
  // Norte
  'AC': 'Norte', 'AP': 'Norte', 'AM': 'Norte', 'PA': 'Norte',
  'RO': 'Norte', 'RR': 'Norte', 'TO': 'Norte'
};

// Capitais brasileiras
const capitais = new Set([
  'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Vitória',
  'Curitiba', 'Florianópolis', 'Porto Alegre',
  'Brasília', 'Goiânia', 'Cuiabá', 'Campo Grande',
  'Maceió', 'Salvador', 'Fortaleza', 'São Luís',
  'João Pessoa', 'Recife', 'Teresina', 'Natal', 'Aracaju',
  'Rio Branco', 'Macapá', 'Manaus', 'Belém',
  'Porto Velho', 'Boa Vista', 'Palmas'
]);

/**
 * Função para ordenar entidades seguindo a ordem de precedência canônica
 * Ordem: Jurisdição -> Diocese/Subdivisão -> Tipo Entidade -> Região -> Estado -> Capital/Interior -> Cidade alfabética
 */
export function sortByPrecedence<T extends { 
  patriarcado?: string | null;
  jurisdicao_imediata?: string | null;
  tipo: string;
  estado: string;
  cidade: string;
}>(entidades: T[]): T[] {
  return [...entidades].sort((a, b) => {
    // 1. Ordenar por jurisdição (Patriarcado)
    const jurisdicaoA = getJurisdicaoFromString(a.patriarcado || '');
    const jurisdicaoB = getJurisdicaoFromString(b.patriarcado || '');
    
    const precJurA = jurisdicaoA ? jurisdicaoPrecedencia[jurisdicaoA] : 999;
    const precJurB = jurisdicaoB ? jurisdicaoPrecedencia[jurisdicaoB] : 999;
    
    if (precJurA !== precJurB) {
      return precJurA - precJurB;
    }
    
    // 2. Ordenar por subdivisão (Diocese, Arquidiocese, etc.) - alfabeticamente
    const subdivA = (a.jurisdicao_imediata || '').toLowerCase();
    const subdivB = (b.jurisdicao_imediata || '').toLowerCase();
    
    if (subdivA !== subdivB) {
      return subdivA.localeCompare(subdivB, 'pt-BR');
    }
    
    // 3. Ordenar por tipo de entidade
    const tipoA = a.tipo as TipoEntidade;
    const tipoB = b.tipo as TipoEntidade;
    
    const precTipoA = tipoEntidadePrecedencia[tipoA] || 999;
    const precTipoB = tipoEntidadePrecedencia[tipoB] || 999;
    
    if (precTipoA !== precTipoB) {
      return precTipoA - precTipoB;
    }
    
    // 4. Ordenar por região
    const regiaoA = estadoParaRegiao[a.estado] || 'Desconhecida';
    const regiaoB = estadoParaRegiao[b.estado] || 'Desconhecida';
    
    const precRegiaoA = regiaoPrecedencia[regiaoA] || 999;
    const precRegiaoB = regiaoPrecedencia[regiaoB] || 999;
    
    if (precRegiaoA !== precRegiaoB) {
      return precRegiaoA - precRegiaoB;
    }
    
    // 5. Ordenar por estado dentro da região
    const precEstadoA = estadoPrecedenciaPorRegiao[regiaoA]?.[a.estado] || 999;
    const precEstadoB = estadoPrecedenciaPorRegiao[regiaoB]?.[b.estado] || 999;
    
    if (precEstadoA !== precEstadoB) {
      return precEstadoA - precEstadoB;
    }
    
    // 6. Ordenar capital antes de interior
    const isCapitalA = capitais.has(a.cidade);
    const isCapitalB = capitais.has(b.cidade);
    
    if (isCapitalA && !isCapitalB) return -1;
    if (!isCapitalA && isCapitalB) return 1;
    
    // 7. Ordenar por cidade alfabeticamente
    return a.cidade.localeCompare(b.cidade, 'pt-BR');
  });
}

/**
 * Converte string de patriarcado para o enum Jurisdicao
 */
function getJurisdicaoFromString(patriarcado: string): Jurisdicao | null {
  const normalized = patriarcado.toLowerCase();
  
  if (normalized.includes('ecumênico') || normalized.includes('ecumenico')) {
    return 'PatriarcadoEcumenico';
  }
  if (normalized.includes('antioquia')) {
    return 'PatriarcadoDeAntioquia';
  }
  if (normalized.includes('moscou') || normalized.includes('rússia') || normalized.includes('russia')) {
    return 'PatriarcadoDeMoscou';
  }
  if (normalized.includes('sérvia') || normalized.includes('servia')) {
    return 'PatriarcadoDaServia';
  }
  if (normalized.includes('polônia') || normalized.includes('polonia')) {
    return 'IgrejaAutocefalaDoPolonia';
  }
  
  return null;
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return '';
  }
}
