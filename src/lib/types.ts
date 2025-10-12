export type Jurisdicao = 
  | 'PatriarcadoEcumenico'
  | 'PatriarcadoDeAntioquia' 
  | 'PatriarcadoDeMoscou'
  | 'PatriarcadoDaServia'
  | 'IgrejaAutocefalaDoPolonia';

export type TipoEntidade = 
  | 'Catedral'
  | 'Paroquia' 
  | 'Capela'
  | 'Missao'
  | 'Mosteiro';

export interface Diocese {
  id: number;
  nome: string;
  jurisdicao: Jurisdicao;
  bispo: string;
  bispos_auxiliares: string[];
  loc_sede: string;
}

export interface FotoEntidade {
  id: number;
  id_entidade: number;
  url_foto: string;
  legenda?: string;
  ordem: number;
}

export interface EntidadeEclesiastica {
  id: number;
  id_diocese: number;
  nome: string;
  tipo: TipoEntidade;
  reitor: string;
  cep: string;
  estado: string;
  cidade: string;
  endereco: string;
  telefone: string;
  email: string;
  website: string;
  descricao: string;
  latitude?: number;
  longitude?: number;
  url_foto?: string | null;
  diocese?: Diocese; // Opcional para quando fazemos JOIN
  fotos?: FotoEntidade[]; // Photos from fotosentidade table
}
