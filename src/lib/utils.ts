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
  'Paroquia': 'Paróquia',
  'Capela': 'Capela',
  'Missao': 'Missão',
  'Mosteiro': 'Mosteiro'
};

export const tipoEntidadeIcons: Record<string, string> = {
  'Catedral': '/icon-catedral.png',
  'Paroquia': '/icon-paroquia.png',
  'Capela': '/icon-capela.png',
  'Missao': '/icon-missao.png',
  'Mosteiro': '/icon-monasterio.png'
};

export const tipoEntidadeSvgIcons: Record<string, string> = {
  'Catedral': '/icon-catedral.png',
  'Paroquia': '/icon-paroquia.png',
  'Capela': '/icon-capela.png',
  'Missao': '/icon-missao.png',
  'Mosteiro': '/icon-monasterio.png'
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
