import type { PageLoad } from './$types.js';
import { dataService } from '$lib/dataService.js';
import { error } from '@sveltejs/kit';

export const prerender = false;
export const ssr = false;

export const load: PageLoad = async ({ params, fetch }) => {
  const id = parseInt(params.id);
  
  if (isNaN(id)) {
    throw error(400, 'ID inválido');
  }
  
  try {
    const entidade = await dataService.getEntidade(id, fetch);
    
    if (!entidade) {
      throw error(404, 'Entidade não encontrada');
    }
    
    return {
      entidade
    };
  } catch (err) {
    console.error('Erro ao carregar entidade:', err);
    
    // Check if it's a 404 error and throw the appropriate error
    if (err instanceof Error && err.message.includes('404')) {
      throw error(404, 'Entidade não encontrada');
    }
    
    throw error(500, 'Erro interno do servidor');
  }
};
