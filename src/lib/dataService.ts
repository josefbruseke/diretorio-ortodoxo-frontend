import { apiService, mapApiEntidadeToLocal, mapApiDioceseToLocal, type EntidadeFiltros, type DioceseFiltros } from './api.js';
import { supabaseService, mapSupabaseEntidadeToLocal, mapSupabaseDioceseToLocal } from './supabaseService.js';
import type { EntidadeEclesiastica, Diocese } from './types.js';

export interface DataServiceFiltros {
  estado?: string;
  cidade?: string;
  tipo?: string;
  dioceseId?: number;
  jurisdicao?: string;
}

export class DataService {
  private useSupabase = true; // Switch to control data source
  private apiAvailable = false; // Track if API is available
  
  // Obter todas as entidades com filtros
  async getEntidades(filtros: DataServiceFiltros = {}, fetchFn?: typeof fetch): Promise<(EntidadeEclesiastica & { diocese: Diocese })[]> {
    if (this.useSupabase) {
      try {
        // Use Supabase service
        const entidades = await supabaseService.getEntidades();
        
        // Apply filters
        let filtered = entidades.filter(entidade => {
          if (filtros.estado && entidade.estado !== filtros.estado) return false;
          if (filtros.cidade && entidade.cidade !== filtros.cidade) return false;
          if (filtros.tipo && entidade.tipo !== filtros.tipo) return false;
          if (filtros.dioceseId && entidade.id_diocese !== filtros.dioceseId) return false;
          if (filtros.jurisdicao && entidade.diocese?.jurisdicao !== filtros.jurisdicao) return false;
          return true;
        });
        
        return filtered.map(entity => {
          const mapped = mapSupabaseEntidadeToLocal(entity);
          return {
            ...mapped,
            diocese: mapped.diocese!
          };
        });
      } catch (error) {
        console.error('Erro ao buscar entidades do Supabase:', error);
        throw error; // Don't fallback, just throw the error
      }
    }
    
    if (!this.apiAvailable) {
      throw new Error('API não está disponível. Configure o Supabase ou inicie o backend.');
    }
    
    // Fallback to API service
    const apiFiltros: EntidadeFiltros = {
      estado: filtros.estado,
      cidade: filtros.cidade,
      tipo: filtros.tipo,
      diocese_id: filtros.dioceseId,
      jurisdicao: filtros.jurisdicao
    };
    
    const response = await apiService.getEntidades(apiFiltros, fetchFn);
    
    return response.entidades.map(entity => {
      const mapped = mapApiEntidadeToLocal(entity);
      return {
        ...mapped,
        diocese: mapped.diocese!
      };
    });
  }

  // Obter entidade por ID
  async getEntidade(id: number, fetchFn?: typeof fetch): Promise<(EntidadeEclesiastica & { diocese: Diocese }) | undefined> {
    if (this.useSupabase) {
      try {
        const supabaseEntidade = await supabaseService.getEntidadeById(id);
        if (supabaseEntidade) {
          const mapped = mapSupabaseEntidadeToLocal(supabaseEntidade);
          return {
            ...mapped,
            diocese: mapped.diocese!
          };
        }
        return undefined;
      } catch (error) {
        console.error('Supabase error, falling back to API:', error);
        this.useSupabase = false;
      }
    }
    
    // Fallback to API
    try {
      const apiEntidade = await apiService.getEntidade(id, fetchFn);
      const mapped = mapApiEntidadeToLocal(apiEntidade);
      return {
        ...mapped,
        diocese: mapped.diocese!
      };
    } catch (error) {
      console.error('Erro ao buscar entidade da API:', error);
      
      // If it's a 404 error, return undefined instead of falling back
      if (error instanceof Error && error.message.includes('404')) {
        return undefined;
      }
      
      // Fallback: buscar na lista de entidades carregadas
      try {
        const allEntidades = await this.getEntidades({}, fetchFn);
        const entidade = allEntidades.find(e => e.id === id);
        return entidade;
      } catch (fallbackError) {
        console.error('Erro no fallback:', fallbackError);
        return undefined;
      }
    }
  }

  // Obter todas as dioceses
  async getDioceses(filtros: { jurisdicao?: string } = {}, fetchFn?: typeof fetch): Promise<Diocese[]> {
    if (this.useSupabase) {
      try {
        const dioceses = await supabaseService.getDioceses();
        
        // Apply filters
        let filtered = dioceses;
        if (filtros.jurisdicao) {
          filtered = dioceses.filter(diocese => diocese.jurisdicao === filtros.jurisdicao);
        }
        
        return filtered.map(mapSupabaseDioceseToLocal);
      } catch (error) {
        console.error('Supabase error, falling back to API:', error);
        this.useSupabase = false;
      }
    }
    
    // Fallback to API
    const apiFiltros: DioceseFiltros = {
      jurisdicao: filtros.jurisdicao
    };
    
    const response = await apiService.getDioceses(apiFiltros, fetchFn);
    return response.dioceses.map(mapApiDioceseToLocal);
  }

  // Obter diocese por ID
  async getDiocese(id: number, fetchFn?: typeof fetch): Promise<Diocese | undefined> {
    if (this.useSupabase) {
      try {
        const diocese = await supabaseService.getDioceseById(id);
        return diocese ? mapSupabaseDioceseToLocal(diocese) : undefined;
      } catch (error) {
        console.error('Supabase error, falling back to API:', error);
        this.useSupabase = false;
      }
    }
    
    // Fallback to API
    try {
      const apiDiocese = await apiService.getDiocese(id, fetchFn);
      return mapApiDioceseToLocal(apiDiocese);
    } catch (error) {
      console.error('Erro ao buscar diocese da API:', error);
      return undefined;
    }
  }

  // Obter listas para filtros
  async getEstados(fetchFn?: typeof fetch): Promise<string[]> {
    if (this.useSupabase) {
      try {
        return await supabaseService.getEstados();
      } catch (error) {
        console.error('Supabase error, falling back to API:', error);
        this.useSupabase = false;
      }
    }
    
    return await apiService.getEstados(fetchFn);
  }

  async getTipos(fetchFn?: typeof fetch): Promise<string[]> {
    if (this.useSupabase) {
      try {
        return await supabaseService.getTipos();
      } catch (error) {
        console.error('Supabase error, falling back to API:', error);
        this.useSupabase = false;
      }
    }
    
    return await apiService.getTipos(fetchFn);
  }

  async getJurisdicoes(fetchFn?: typeof fetch): Promise<string[]> {
    if (this.useSupabase) {
      try {
        return await supabaseService.getJurisdicoes();
      } catch (error) {
        console.error('Supabase error, falling back to API:', error);
        this.useSupabase = false;
      }
    }
    
    return await apiService.getJurisdicoes(fetchFn);
  }

  async getCidades(estado?: string, fetchFn?: typeof fetch): Promise<string[]> {
    if (this.useSupabase) {
      try {
        return await supabaseService.getCidades(estado);
      } catch (error) {
        console.error('Supabase error, falling back to API:', error);
        this.useSupabase = false;
      }
    }
    
    // Fallback to API (getCidades from entidades)
    const entidades = await this.getEntidades(estado ? { estado } : {}, fetchFn);
    return [...new Set(entidades.map(e => e.cidade))].sort();
  }

  // Método para verificar se está usando Supabase
  async isUsingSupabase(): Promise<boolean> {
    if (this.useSupabase) {
      try {
        const health = await supabaseService.healthCheck();
        return health.success;
      } catch {
        this.useSupabase = false;
        return false;
      }
    }
    return false;
  }

  // Método para verificar se a API está funcionando
  async isUsingApi(fetchFn?: typeof fetch): Promise<boolean> {
    if (this.useSupabase) {
      return !(await this.isUsingSupabase());
    }
    
    try {
      await apiService.health(fetchFn);
      return true;
    } catch {
      return false;
    }
  }

  // Update methods for admin functionality
  async updateEntidade(id: number, data: any, fetchFn?: typeof fetch): Promise<any> {
    if (this.useSupabase) {
      try {
        // Map data to Supabase format (excluding url_foto as it's in fotosentidade table)
        const supabaseData = {
          nome: data.nome,
          tipo: data.tipo,
          endereco: data.endereco,
          cidade: data.cidade,
          estado: data.estado,
          cep: data.cep,
          telefone: data.telefone,
          email: data.email,
          website: data.website,
          descricao: data.descricao,
          latitude: data.latitude,
          longitude: data.longitude
        };
        
        const result = await supabaseService.updateEntidade(id, supabaseData);
        return mapSupabaseEntidadeToLocal({ ...result } as any);
      } catch (error) {
        console.error('Erro ao atualizar entidade no Supabase:', error);
        throw error; // Don't fallback, just throw the error
      }
    }
    
    if (!this.apiAvailable) {
      throw new Error('API não está disponível. Configure o Supabase ou inicie o backend.');
    }
    
    // Fallback to API
    const apiResult = await apiService.updateEntidade(id, data, fetchFn);
    return mapApiEntidadeToLocal(apiResult);
  }

  async updateDiocese(id: number, data: any, fetchFn?: typeof fetch): Promise<any> {
    if (this.useSupabase) {
      try {
        const supabaseData = {
          nome: data.nome,
          jurisdicao: data.jurisdicao,
          loc_sede: data.loc_sede
        };
        
        const result = await supabaseService.updateDiocese(id, supabaseData);
        return mapSupabaseDioceseToLocal(result);
      } catch (error) {
        console.error('Supabase error, falling back to API:', error);
        this.useSupabase = false;
      }
    }
    
    // Fallback to API
    const apiResult = await apiService.updateDiocese(id, data, fetchFn);
    return mapApiDioceseToLocal(apiResult);
  }

  async updateClero(id: number, data: any, fetchFn?: typeof fetch): Promise<any> {
    if (this.useSupabase) {
      try {
        const supabaseData = {
          nome_completo: data.nome_completo,
          titulo: data.titulo,
          email: data.email
        };
        
        const result = await supabaseService.updateClero(id, supabaseData);
        return result;
      } catch (error) {
        console.error('Supabase error, falling back to API:', error);
        this.useSupabase = false;
      }
    }
    
    // Fallback to API
    const apiResult = await apiService.updateClero(id, data, fetchFn);
    return apiResult;
  }

  // Create methods for admin functionality
  async createEntidade(data: any, fetchFn?: typeof fetch): Promise<any> {
    if (this.useSupabase) {
      try {
        // Map data to Supabase format (excluding url_foto as it's in fotosentidade table)
        const supabaseData = {
          id_diocese: data.id_diocese,
          nome: data.nome,
          tipo: data.tipo,
          endereco: data.endereco,
          cidade: data.cidade,
          estado: data.estado,
          cep: data.cep,
          telefone: data.telefone,
          email: data.email,
          website: data.website,
          descricao: data.descricao,
          latitude: data.latitude,
          longitude: data.longitude
        };
        
        const result = await supabaseService.createEntidade(supabaseData);
        return mapSupabaseEntidadeToLocal({ ...result } as any);
      } catch (error) {
        console.error('Erro ao criar entidade no Supabase:', error);
        throw error; // Don't fallback, just throw the error
      }
    }
    
    if (!this.apiAvailable) {
      throw new Error('API não está disponível. Configure o Supabase ou inicie o backend.');
    }
    
    // Fallback to API
    const apiResult = await apiService.createEntidade(data, fetchFn);
    return mapApiEntidadeToLocal(apiResult);
  }

  async createDiocese(data: any, fetchFn?: typeof fetch): Promise<any> {
    if (this.useSupabase) {
      try {
        const supabaseData = {
          nome: data.nome,
          jurisdicao: data.jurisdicao,
          loc_sede: data.loc_sede
        };
        
        const result = await supabaseService.createDiocese(supabaseData);
        return mapSupabaseDioceseToLocal(result);
      } catch (error) {
        console.error('Supabase error, falling back to API:', error);
        this.useSupabase = false;
      }
    }
    
    // Fallback to API
    const apiResult = await apiService.createDiocese(data, fetchFn);
    return mapApiDioceseToLocal(apiResult);
  }

  async createClero(data: any, fetchFn?: typeof fetch): Promise<any> {
    if (this.useSupabase) {
      try {
        const supabaseData = {
          nome_completo: data.nome_completo,
          titulo: data.titulo,
          email: data.email,
          id_diocese_auxiliar: data.id_diocese_auxiliar
        };
        
        const result = await supabaseService.createClero(supabaseData);
        return result;
      } catch (error) {
        console.error('Supabase error, falling back to API:', error);
        this.useSupabase = false;
      }
    }
    
    // Fallback to API
    const apiResult = await apiService.createClero(data, fetchFn);
    return apiResult;
  }

  // Delete methods for admin functionality
  async deleteEntidade(id: number, fetchFn?: typeof fetch): Promise<void> {
    if (this.useSupabase) {
      try {
        await supabaseService.deleteEntidade(id);
        return;
      } catch (error) {
        console.error('Supabase error, falling back to API:', error);
        this.useSupabase = false;
      }
    }
    
    // Fallback to API
    await apiService.deleteEntidade(id, fetchFn);
  }

  async deleteDiocese(id: number, fetchFn?: typeof fetch): Promise<void> {
    if (this.useSupabase) {
      try {
        await supabaseService.deleteDiocese(id);
        return;
      } catch (error) {
        console.error('Supabase error, falling back to API:', error);
        this.useSupabase = false;
      }
    }
    
    // Fallback to API
    await apiService.deleteDiocese(id, fetchFn);
  }

  async deleteClero(id: number, fetchFn?: typeof fetch): Promise<void> {
    if (this.useSupabase) {
      try {
        await supabaseService.deleteClero(id);
        return;
      } catch (error) {
        console.error('Supabase error, falling back to API:', error);
        this.useSupabase = false;
      }
    }
    
    // Fallback to API
    await apiService.deleteClero(id, fetchFn);
  }

  async getClero(fetchFn?: typeof fetch): Promise<any[]> {
    if (this.useSupabase) {
      try {
        return await supabaseService.getClero();
      } catch (error) {
        console.error('Supabase error, falling back to API:', error);
        this.useSupabase = false;
      }
    }
    
    // Fallback to API
    const response = await apiService.getClero(fetchFn);
    return response.clero;
  }
}

export const dataService = new DataService();
