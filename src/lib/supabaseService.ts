import { supabase } from './supabaseClient.js';
import type { 
  EntidadeEclesiastica, 
  Diocese, 
  TipoEntidade, 
  Jurisdicao 
} from './types.js';

// Supabase table interfaces based on your actual schema
export interface SupabaseEntidade {
  id: number;
  nome_comunidade: string;
  tipo: 'Catedral' | 'Paróquia' | 'Mosteiro' | 'Missão' | 'Capela';
  santo_padroeiro?: string;
  jurisdicao_imediata?: string;
  patriarcado?: string;
  id_reitor?: number;
  reitor?: string;
  telefone?: string;
  email?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  status?: string;
  observacoes?: string;
  ultima_atualizacao?: string;
  link_maps?: string;
  cep?: string;
  endereco?: string;
  latitude?: number;
  longitude?: number;
  uf?: string;
  cidade?: string;
  descricao?: string;
}

export interface SupabaseDiocese {
  id: number;
  nome: string;
  jurisdicao: 'PatriarcadoEcumenico' | 'PatriarcadoDeAntioquia' | 'PatriarcadoDeMoscou' | 'PatriarcadoDaServia' | 'IgrejaAutocefalaDaPolonia';
  id_bispo_titular?: number;
  loc_sede?: string;
}

export interface SupabaseClero {
  id: number;
  nome_completo: string;
  titulo?: string;
  id_diocese_auxiliar?: number;
  email?: string;
}

export interface SupabaseFotoEntidade {
  id: number;
  id_entidade: number;
  url_foto: string;
  legenda?: string;
  ordem: number;
}

// Extended interfaces for joins
export interface SupabaseEntidadeWithRelations extends SupabaseEntidade {
  diocese?: SupabaseDiocese;
  clero?: SupabaseClero;
  fotosentidade?: SupabaseFotoEntidade[];
}

class SupabaseService {
  // Health check
  async healthCheck(): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase
        .from('clero')
        .select('id')
        .limit(1);
      
      if (error) {
        return { success: false, message: error.message };
      }
      
      return { success: true, message: 'Connection successful' };
    } catch (err) {
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }

  // Entidades Eclesiásticas
  async getEntidades(limit = 1000): Promise<SupabaseEntidadeWithRelations[]> {
    const { data, error } = await supabase
      .from('entidade_eclesiastica')
      .select(`
        *,
        clero:id_reitor (
          id,
          nome_completo,
          titulo,
          email
        ),
        fotosentidade (
          id,
          url_foto,
          legenda,
          ordem
        )
      `)
      .limit(limit);

    if (error) {
      console.error('Error fetching entidades:', error);
      throw new Error(error.message);
    }

    return data || [];
  }

  async getEntidadeById(id: number): Promise<SupabaseEntidadeWithRelations | null> {
    const { data, error } = await supabase
      .from('entidade_eclesiastica')
      .select(`
        *,
        clero:id_reitor (
          id,
          nome_completo,
          titulo,
          email
        ),
        fotosentidade (
          id,
          url_foto,
          legenda,
          ordem
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching entidade:', error);
      return null;
    }

    return data;
  }

  async getEntidadesByDiocese(dioceseId: number): Promise<SupabaseEntidade[]> {
    // Note: Since the new schema doesn't have id_diocese,
    // this method will need to be refactored or deprecated
    const { data, error } = await supabase
      .from('entidade_eclesiastica')
      .select('*')
      .eq('jurisdicao_imediata', dioceseId); // This won't work properly - needs redesign

    if (error) {
      console.error('Error fetching entidades by diocese:', error);
      throw new Error(error.message);
    }

    return data || [];
  }

  async getEntidadesByEstado(estado: string): Promise<SupabaseEntidade[]> {
    const { data, error } = await supabase
      .from('entidade_eclesiastica')
      .select('*')
      .eq('uf', estado);

    if (error) {
      console.error('Error fetching entidades by estado:', error);
      throw new Error(error.message);
    }

    return data || [];
  }

  // Dioceses
  async getDioceses(): Promise<SupabaseDiocese[]> {
    const { data, error } = await supabase
      .from('diocese')
      .select('*')
      .order('nome');

    if (error) {
      console.error('Error fetching dioceses:', error);
      throw new Error(error.message);
    }

    return data || [];
  }

  async getDioceseById(id: number): Promise<SupabaseDiocese | null> {
    const { data, error } = await supabase
      .from('diocese')
      .select(`
        *,
        clero:id_bispo_titular (
          id,
          nome_completo,
          titulo,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching diocese:', error);
      return null;
    }

    return data;
  }

  // Clero
  async getClero(): Promise<SupabaseClero[]> {
    const { data, error } = await supabase
      .from('clero')
      .select('*')
      .order('nome_completo');

    if (error) {
      console.error('Error fetching clero:', error);
      throw new Error(error.message);
    }

    return data || [];
  }

  async getCleroById(id: number): Promise<SupabaseClero | null> {
    const { data, error } = await supabase
      .from('clero')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching clero member:', error);
      return null;
    }

    return data;
  }

  // Utility functions
  async getEstados(): Promise<string[]> {
    const { data, error } = await supabase
      .from('entidade_eclesiastica')
      .select('uf')
      .not('uf', 'is', null);

    if (error) {
      console.error('Error fetching estados:', error);
      return [];
    }

    const estados = [...new Set(data.map(item => item.uf))].filter(Boolean);
    return estados.sort();
  }

  async getCidades(estado?: string): Promise<string[]> {
    let query = supabase
      .from('entidade_eclesiastica')
      .select('cidade')
      .not('cidade', 'is', null);

    if (estado) {
      query = query.eq('uf', estado);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching cidades:', error);
      return [];
    }

    const cidades = [...new Set(data.map(item => item.cidade))].filter(Boolean);
    return cidades.sort();
  }

  async getTipos(): Promise<string[]> {
    return ['Catedral', 'Paróquia', 'Mosteiro', 'Missão', 'Capela'];
  }

  async getJurisdicoes(): Promise<string[]> {
    return [
      'PatriarcadoEcumenico',
      'PatriarcadoDeAntioquia', 
      'PatriarcadoDeMoscou',
      'PatriarcadoDaServia',
      'IgrejaAutocefalaDoPolonia'
    ];
  }

  // Search functionality
  async searchEntidades(searchTerm: string): Promise<SupabaseEntidade[]> {
    const { data, error } = await supabase
      .from('entidade_eclesiastica')
      .select('*')
      .or(`nome_comunidade.ilike.%${searchTerm}%,cidade.ilike.%${searchTerm}%,endereco.ilike.%${searchTerm}%`)
      .limit(20);

    if (error) {
      console.error('Error searching entidades:', error);
      throw new Error(error.message);
    }

    return data || [];
  }

  // Statistics
  async getStats() {
    try {
      const [entidadesCount, diocesesCount, cleroCount] = await Promise.all([
        supabase.from('entidade_eclesiastica').select('*', { count: 'exact', head: true }),
        supabase.from('diocese').select('*', { count: 'exact', head: true }),
        supabase.from('clero').select('*', { count: 'exact', head: true })
      ]);

      return {
        entidades: entidadesCount.count || 0,
        dioceses: diocesesCount.count || 0,
        clero: cleroCount.count || 0
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return { entidades: 0, dioceses: 0, clero: 0 };
    }
  }

  // Update methods for admin functionality
  async updateEntidade(id: number, data: Partial<SupabaseEntidade>): Promise<SupabaseEntidade> {
    const { data: result, error } = await supabase
      .from('entidade_eclesiastica')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating entidade:', error);
      throw new Error(error.message);
    }

    return result;
  }

  async updateDiocese(id: number, data: Partial<SupabaseDiocese>): Promise<SupabaseDiocese> {
    const { data: result, error } = await supabase
      .from('diocese')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating diocese:', error);
      throw new Error(error.message);
    }

    return result;
  }

  async updateClero(id: number, data: Partial<SupabaseClero>): Promise<SupabaseClero> {
    const { data: result, error } = await supabase
      .from('clero')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating clero:', error);
      throw new Error(error.message);
    }

    return result;
  }

  // Create methods for admin functionality
  async createEntidade(data: Omit<SupabaseEntidade, 'id'>): Promise<SupabaseEntidade> {
    const { data: result, error } = await supabase
      .from('entidade_eclesiastica')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating entidade:', error);
      throw new Error(error.message);
    }

    return result;
  }

  async createDiocese(data: Omit<SupabaseDiocese, 'id'>): Promise<SupabaseDiocese> {
    const { data: result, error } = await supabase
      .from('diocese')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating diocese:', error);
      throw new Error(error.message);
    }

    return result;
  }

  async createClero(data: Omit<SupabaseClero, 'id'>): Promise<SupabaseClero> {
    const { data: result, error } = await supabase
      .from('clero')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating clero:', error);
      throw new Error(error.message);
    }

    return result;
  }

  // Delete methods for admin functionality
  async deleteEntidade(id: number): Promise<void> {
    const { error } = await supabase
      .from('entidade_eclesiastica')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting entidade:', error);
      throw new Error(error.message);
    }
  }

  async deleteDiocese(id: number): Promise<void> {
    const { error } = await supabase
      .from('diocese')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting diocese:', error);
      throw new Error(error.message);
    }
  }

  async deleteClero(id: number): Promise<void> {
    const { error } = await supabase
      .from('clero')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting clero:', error);
      throw new Error(error.message);
    }
  }

  // FotosEntidade methods
  async getFotosByEntidade(idEntidade: number): Promise<SupabaseFotoEntidade[]> {
    const { data, error } = await supabase
      .from('fotosentidade')
      .select('*')
      .eq('id_entidade', idEntidade)
      .order('ordem', { ascending: true });

    if (error) {
      console.error('Error fetching fotos:', error);
      throw new Error(error.message);
    }

    return data || [];
  }

  async createFoto(fotoData: Omit<SupabaseFotoEntidade, 'id'>): Promise<SupabaseFotoEntidade> {
    const { data, error } = await supabase
      .from('fotosentidade')
      .insert(fotoData)
      .select()
      .single();

    if (error) {
      console.error('Error creating foto:', error);
      throw new Error(error.message);
    }

    return data;
  }

  async updateFoto(id: number, fotoData: Partial<SupabaseFotoEntidade>): Promise<SupabaseFotoEntidade> {
    const { data, error } = await supabase
      .from('fotosentidade')
      .update(fotoData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating foto:', error);
      throw new Error(error.message);
    }

    return data;
  }

  async deleteFoto(id: number): Promise<void> {
    const { error } = await supabase
      .from('fotosentidade')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting foto:', error);
      throw new Error(error.message);
    }
  }

  async getMainFotoByEntidade(idEntidade: number): Promise<SupabaseFotoEntidade | null> {
    const { data, error } = await supabase
      .from('fotosentidade')
      .select('*')
      .eq('id_entidade', idEntidade)
      .order('ordem', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      console.error('Error fetching main foto:', error);
      throw new Error(error.message);
    }

    return data;
  }
}

export const supabaseService = new SupabaseService();

// Mapping functions to convert Supabase data to your local types
export function mapSupabaseEntidadeToLocal(supabaseEntidade: SupabaseEntidadeWithRelations): EntidadeEclesiastica & { diocese?: Diocese } {
  // Get the main photo (first one by ordem) if exists
  const mainPhoto = supabaseEntidade.fotosentidade && supabaseEntidade.fotosentidade.length > 0 
    ? supabaseEntidade.fotosentidade[0].url_foto 
    : null;
  
  // Map all photos sorted by ordem
  const fotos = supabaseEntidade.fotosentidade 
    ? supabaseEntidade.fotosentidade
        .sort((a, b) => a.ordem - b.ordem)
        .map(foto => ({
          id: foto.id,
          id_entidade: foto.id_entidade,
          url_foto: foto.url_foto,
          legenda: foto.legenda,
          ordem: foto.ordem
        }))
    : [];
  
  // Map patriarcado text to Jurisdicao enum
  const mapPatriarcadoToJurisdicao = (patriarcado: string | undefined): Jurisdicao => {
    if (!patriarcado) return 'PatriarcadoEcumenico'; // default
    
    const p = patriarcado.trim().toLowerCase();
    
    if (p.includes('ecumênico') || p.includes('ecumenico')) {
      return 'PatriarcadoEcumenico';
    } else if (p.includes('antioquia')) {
      return 'PatriarcadoDeAntioquia';
    } else if (p.includes('moscou')) {
      return 'PatriarcadoDeMoscou';
    } else if (p.includes('sérvia') || p.includes('servia') || p.includes('sérvio')) {
      return 'PatriarcadoDaServia';
    } else if (p.includes('polônia') || p.includes('polonia') || p.includes('polónia')) {
      return 'IgrejaAutocefalaDoPolonia';
    }
    return 'PatriarcadoEcumenico'; // default
  };
  
  const jurisdicaoEnum = mapPatriarcadoToJurisdicao(supabaseEntidade.patriarcado);
    
  return {
    id: supabaseEntidade.id,
    id_diocese: undefined, // Not in new schema
    nome: supabaseEntidade.nome_comunidade,
    tipo: supabaseEntidade.tipo as TipoEntidade,
    santo_padroeiro: supabaseEntidade.santo_padroeiro,
    jurisdicao_imediata: supabaseEntidade.jurisdicao_imediata,
    patriarcado: supabaseEntidade.patriarcado,
    reitor: supabaseEntidade.reitor || supabaseEntidade.clero?.nome_completo || '',
    cep: supabaseEntidade.cep || '',
    estado: supabaseEntidade.uf || '',
    cidade: supabaseEntidade.cidade || '',
    endereco: supabaseEntidade.endereco || '',
    telefone: supabaseEntidade.telefone || '',
    email: supabaseEntidade.email || '',
    website: supabaseEntidade.website || '',
    facebook: supabaseEntidade.facebook,
    instagram: supabaseEntidade.instagram,
    status: supabaseEntidade.status,
    observacoes: supabaseEntidade.observacoes,
    ultima_atualizacao: supabaseEntidade.ultima_atualizacao,
    link_maps: supabaseEntidade.link_maps,
    descricao: supabaseEntidade.descricao || '',
    latitude: supabaseEntidade.latitude,
    longitude: supabaseEntidade.longitude,
    url_foto: mainPhoto,
    fotos: fotos,
    // Create a fake diocese object for compatibility
    diocese: {
      id: 0,
      nome: supabaseEntidade.jurisdicao_imediata || '',
      jurisdicao: jurisdicaoEnum,
      bispo: '',
      bispos_auxiliares: [],
      loc_sede: ''
    }
  };
}

export function mapSupabaseDioceseToLocal(supabaseDiocese: SupabaseDiocese): Diocese {
  return {
    id: supabaseDiocese.id,
    nome: supabaseDiocese.nome,
    jurisdicao: supabaseDiocese.jurisdicao as Jurisdicao,
    bispo: '', // Would need to fetch from clero relation
    bispos_auxiliares: [],
    loc_sede: supabaseDiocese.loc_sede || ''
  };
}
