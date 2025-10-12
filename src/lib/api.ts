const API_BASE = '/api';

export interface ApiResponse<T> {
  status: string;
  data: T;
  message: string;
  timestamp?: string;
}

export interface ApiError {
  status: string;
  message: string;
  timestamp: string;
}

export interface ApiEntidadesResponse {
  total: number;
  entidades: ApiEntidade[];
}

export interface ApiDiocesesResponse {
  total: number;
  dioceses: ApiDiocese[];
}

export interface ApiEntidade {
  id: number;
  nome: string;
  tipo: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  website: string | null;
  descricao?: string;
  latitude?: number;
  longitude?: number;
  url_foto?: string | null;
  diocese?: {
    id: number;
    nome: string;
    jurisdicao: string;
    loc_sede: string;
  };
  reitor?: {
    id: number;
    nome_completo: string;
    titulo: string;
    email: string;
  };
  fotos?: {
    id: number;
    url_foto: string;
    legenda: string;
    ordem: number;
  }[];
}

export interface ApiDiocese {
  id: number;
  nome: string;
  jurisdicao: string;
  loc_sede: string;
  bispo_titular?: {
    id: number;
    nome_completo: string;
    titulo: string;
    email: string;
  };
  bispos_auxiliares?: {
    id: number;
    nome_completo: string;
    titulo: string;
    email: string;
  }[];
}

export interface ApiClero {
  id: number;
  nome_completo: string;
  titulo: string;
  email: string;
  id_diocese_auxiliar: number | null;
}

export interface ApiCleroResponse {
  total: number;
  clero: ApiClero[];
}

// Parâmetros de filtro para entidades
export interface EntidadeFiltros {
  estado?: string;
  cidade?: string;
  tipo?: string;
  diocese_id?: number;
  jurisdicao?: string;
}

// Parâmetros de filtro para dioceses  
export interface DioceseFiltros {
  jurisdicao?: string;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}, fetchFn?: typeof fetch): Promise<T> {
    try {
      const actualFetch = fetchFn || fetch;
      const response = await actualFetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Recurso não encontrado');
        }
        const errorData = await response.json().catch(() => ({ message: `Erro HTTP: ${response.status}` }));
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }
      
      if (response.status === 204) {
        return {} as T;
      }

      const data: ApiResponse<T> = await response.json();

      if (data.status === 'error') {
        throw new Error(data.message);
      }

      return data.data;
    } catch (error) {
      console.error('Erro na requisição API:', error);
      throw error instanceof Error ? error : new Error('Erro desconhecido na API');
    }
  }

  // Health check
  async health(fetchFn?: typeof fetch): Promise<{ status: string; message: string; timestamp: string }> {
    return this.request('/health', {}, fetchFn);
  }

  // Entidades Eclesiásticas
  async getEntidades(filtros: EntidadeFiltros = {}, fetchFn?: typeof fetch): Promise<ApiEntidadesResponse> {
    const params = new URLSearchParams();

    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const endpoint = `/entidades${queryString ? '?' + queryString : ''}`;

    return this.request<ApiEntidadesResponse>(endpoint, {}, fetchFn);
  }

  async getEntidade(id: number, fetchFn?: typeof fetch): Promise<ApiEntidade> {
    return this.request<ApiEntidade>(`/entidades/${id}`, {}, fetchFn);
  }

  async updateEntidade(id: number, data: Partial<ApiEntidade>, fetchFn?: typeof fetch): Promise<ApiEntidade> {
    return this.request<ApiEntidade>(`/entidades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, fetchFn);
  }

  async createEntidade(data: Omit<ApiEntidade, 'id'>, fetchFn?: typeof fetch): Promise<ApiEntidade> {
    return this.request<ApiEntidade>('/entidades', {
      method: 'POST',
      body: JSON.stringify(data),
    }, fetchFn);
  }

  // Dioceses
  async getDioceses(filtros: DioceseFiltros = {}, fetchFn?: typeof fetch): Promise<ApiDiocesesResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const endpoint = `/dioceses${queryString ? '?' + queryString : ''}`;
    
    return this.request<ApiDiocesesResponse>(endpoint, {}, fetchFn);
  }

  async getDiocese(id: number, fetchFn?: typeof fetch): Promise<ApiDiocese> {
    return this.request<ApiDiocese>(`/dioceses/${id}`, {}, fetchFn);
  }

  async updateDiocese(id: number, data: Partial<ApiDiocese>, fetchFn?: typeof fetch): Promise<ApiDiocese> {
    return this.request<ApiDiocese>(`/dioceses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, fetchFn);
  }

  async createDiocese(data: Omit<ApiDiocese, 'id'>, fetchFn?: typeof fetch): Promise<ApiDiocese> {
    return this.request<ApiDiocese>('/dioceses', {
      method: 'POST',
      body: JSON.stringify(data),
    }, fetchFn);
  }

  // Clero
  async getClero(fetchFn?: typeof fetch): Promise<ApiCleroResponse> {
    return this.request<ApiCleroResponse>('/clero', {}, fetchFn);
  }

  async getClerigoById(id: number, fetchFn?: typeof fetch): Promise<ApiClero> {
    return this.request<ApiClero>(`/clero/${id}`, {}, fetchFn);
  }

  async updateClero(id: number, data: Partial<ApiClero>, fetchFn?: typeof fetch): Promise<ApiClero> {
    return this.request<ApiClero>(`/clero/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, fetchFn);
  }

  async createClero(data: Omit<ApiClero, 'id'>, fetchFn?: typeof fetch): Promise<ApiClero> {
    return this.request<ApiClero>('/clero', {
      method: 'POST',
      body: JSON.stringify(data),
    }, fetchFn);
  }

  async deleteEntidade(id: number, fetchFn?: typeof fetch): Promise<void> {
    return this.request<void>(`/entidades/${id}`, {
      method: 'DELETE',
    }, fetchFn);
  }

  async deleteDiocese(id: number, fetchFn?: typeof fetch): Promise<void> {
    return this.request<void>(`/dioceses/${id}`, {
      method: 'DELETE',
    }, fetchFn);
  }

  async deleteClero(id: number, fetchFn?: typeof fetch): Promise<void> {
    return this.request<void>(`/clero/${id}`, {
      method: 'DELETE',
    }, fetchFn);
  }

  // Endpoints utilitários
  async getJurisdicoes(fetchFn?: typeof fetch): Promise<string[]> {
    return this.request<string[]>('/jurisdicoes', {}, fetchFn);
  }

  async getTipos(fetchFn?: typeof fetch): Promise<string[]> {
    return this.request<string[]>('/tipos', {}, fetchFn);
  }

  async getEstados(fetchFn?: typeof fetch): Promise<string[]> {
    return this.request<string[]>('/estados', {}, fetchFn);
  }

  // Geocodificação - buscar coordenadas usando múltiplas estratégias
  async geocodeAddress(endereco: string, cidade: string, estado: string, cep: string): Promise<{latitude: number, longitude: number} | null> {
    try {
      // Normaliza os dados de entrada
      const normalizedCidade = cidade?.trim();
      const normalizedEstado = estado?.trim();
      const normalizedEndereco = endereco?.trim();
      const normalizedCep = cep?.replace(/\D/g, ''); // Remove caracteres não numéricos do CEP
      
      // Lista de estratégias de busca, da mais específica para a mais geral
      const searchStrategies = [
        // Estratégia 1: Endereço completo
        normalizedEndereco && normalizedCidade && normalizedEstado && normalizedCep ? 
          `${normalizedEndereco}, ${normalizedCidade}, ${normalizedEstado}, ${normalizedCep}, Brasil` : null,
        
        // Estratégia 2: CEP formatado
        normalizedCep && normalizedCidade ? 
          `${normalizedCep.slice(0,5)}-${normalizedCep.slice(5)}, ${normalizedCidade}, Brasil` : null,
        
        // Estratégia 3: CEP sem formatação
        normalizedCep && normalizedCidade ? 
          `${normalizedCep}, ${normalizedCidade}, Brasil` : null,
        
        // Estratégia 4: Endereço, cidade e estado (sem CEP)
        normalizedEndereco && normalizedCidade && normalizedEstado ? 
          `${normalizedEndereco}, ${normalizedCidade}, ${normalizedEstado}, Brasil` : null,
        
        // Estratégia 5: Apenas CEP formatado
        normalizedCep ? 
          `${normalizedCep.slice(0,5)}-${normalizedCep.slice(5)}, Brasil` : null,
        
        // Estratégia 6: Apenas CEP
        normalizedCep ? 
          `${normalizedCep}, Brasil` : null,
        
        // Estratégia 7: Cidade e estado
        normalizedCidade && normalizedEstado ? 
          `${normalizedCidade}, ${normalizedEstado}, Brasil` : null,
        
        // Estratégia 8: Apenas cidade
        normalizedCidade ? 
          `${normalizedCidade}, Brasil` : null
      ].filter(Boolean); // Remove valores null

      // Tenta cada estratégia sequencialmente
      for (const searchAddress of searchStrategies) {
        if (!searchAddress) continue; // Skip null values
        
        const encodedAddress = encodeURIComponent(searchAddress);
        
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=br`);
        
        if (!response.ok) {
          console.warn('Erro na resposta para:', searchAddress);
          continue;
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
          const result = data[0];
          return {
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon)
          };
        }
        
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar coordenadas:', error);
      return null;
    }
  }
}

export const apiService = new ApiService();

// Função de mapeamento para converter dados da API para o formato local
export function mapApiEntidadeToLocal(apiEntidade: ApiEntidade): import('./types.js').EntidadeEclesiastica & { diocese?: import('./types.js').Diocese } {
  return {
    id: apiEntidade.id,
    id_diocese: apiEntidade.diocese?.id || 0,
    nome: apiEntidade.nome,
    tipo: apiEntidade.tipo as any,
    reitor: apiEntidade.reitor?.nome_completo || '',
    cep: apiEntidade.cep,
    estado: apiEntidade.estado,
    cidade: apiEntidade.cidade,
    endereco: apiEntidade.endereco,
    telefone: apiEntidade.telefone,
    email: apiEntidade.email,
    website: apiEntidade.website || '',
    descricao: apiEntidade.descricao || '',
    latitude: apiEntidade.latitude,
    longitude: apiEntidade.longitude,
    url_foto: apiEntidade.url_foto,
    diocese: apiEntidade.diocese ? {
      id: apiEntidade.diocese.id,
      nome: apiEntidade.diocese.nome,
      jurisdicao: mapJurisdicaoToLocal(apiEntidade.diocese.jurisdicao),
      bispo: apiEntidade.diocese.loc_sede,
      bispos_auxiliares: [],
      loc_sede: apiEntidade.diocese.loc_sede
    } : undefined
  };
}

export function mapApiDioceseToLocal(apiDiocese: ApiDiocese): import('./types.js').Diocese {
  return {
    id: apiDiocese.id,
    nome: apiDiocese.nome,
    jurisdicao: mapJurisdicaoToLocal(apiDiocese.jurisdicao),
    bispo: apiDiocese.bispo_titular?.nome_completo || '',
    bispos_auxiliares: apiDiocese.bispos_auxiliares?.map(b => b.nome_completo) || [],
    loc_sede: apiDiocese.loc_sede
  };
}

// Mapeamento de jurisdições da API para o formato local
function mapJurisdicaoToLocal(jurisdicao: string): import('./types.js').Jurisdicao {
  const mapping: Record<string, import('./types.js').Jurisdicao> = {
    'Patriarcado Ecumênico': 'PatriarcadoEcumenico',
    'Patriarcado de Antioquia': 'PatriarcadoDeAntioquia',
    'Patriarcado de Moscou': 'PatriarcadoDeMoscou',
    'Patriarcado da Sérvia': 'PatriarcadoDaServia',
    'Igreja Autocéfala da Polônia': 'IgrejaAutocefalaDoPolonia'
  };
  
  return mapping[jurisdicao] || 'PatriarcadoEcumenico';
}

// Função para verificar se a API está disponível
export async function checkApiHealth(fetchFn?: typeof fetch): Promise<boolean> {
  try {
    await apiService.health(fetchFn);
    return true;
  } catch (error) {
    console.warn('API não está disponível, usando dados mock:', error);
    return false;
  }
}
