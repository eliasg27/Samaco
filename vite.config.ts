import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';

/**
 * En desarrollo, sirve las funciones de `api/` (las mismas que corre Vercel) para poder probar
 * el Círculo de Profesionales con `npm run dev`. Cada archivo exporta GET/POST/PATCH(request) → Response.
 */
function apiLocal(): Plugin {
  return {
    name: 'api-local',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();
        const ruta = req.url.split('?')[0].replace(/\/$/, '');
        try {
          const mod = await server.ssrLoadModule(path.resolve(__dirname, `.${ruta}.ts`));
          const handler = mod[req.method ?? 'GET'];
          if (typeof handler !== 'function') { res.statusCode = 405; return res.end(); }
          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          const request = new Request(`http://localhost${req.url}`, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          });
          const response: Response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (e) {
          server.config.logger.error(`[api] ${ruta}: ${(e as Error).message}`);
          res.statusCode = 404;
          res.end();
        }
      });
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  // Las funciones de api/ leen process.env (como en Vercel): en local salen de .env.local.
  for (const [k, v] of Object.entries(env)) process.env[k] ??= v;
  return {
    plugins: [react(), tailwindcss(), apiLocal()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
