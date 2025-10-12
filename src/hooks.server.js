import { sequence } from '@sveltejs/kit/hooks';

export const handle = sequence(async ({ event, resolve }) => {
    const response = await resolve(event);

    // Set Cache-Control header for better caching
    response.headers.set('Cache-Control', 'public, max-age=86400');

    return response;
});
