import type { PageLoad } from './$types.js';
import { dataService } from '$lib/dataService.js';
import { error } from '@sveltejs/kit';

export const prerender = false;
export const ssr = false;

export const load: PageLoad = async ({ params }) => {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    throw error(400, 'ID inválido');
  }

  const clerigo = await dataService.getCleroById(id);

  if (!clerigo) {
    throw error(404, 'Clérigo não encontrado');
  }

  return { clerigo };
};
