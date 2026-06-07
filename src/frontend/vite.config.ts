import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Plugin para listar e servir os JSONs de maze_runs
    {
      name: 'maze-runs-api',
      configureServer(server) {
        const mazeRunsDir = path.resolve(__dirname, '../maze_runs');

        // GET /api/maze_runs → lista os arquivos JSON disponíveis
        server.middlewares.use('/api/maze_runs', (req, res, next) => {
          // Se a URL é exatamente /api/maze_runs (listagem)
          if (req.url === '/' || req.url === '') {
            try {
              const files = fs.readdirSync(mazeRunsDir)
                .filter(f => f.endsWith('.json'))
                .sort()
                .reverse(); // mais recente primeiro (timestamp no nome)
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(files));
            } catch {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Pasta maze_runs não encontrada' }));
            }
            return;
          }

          // GET /api/maze_runs/corrida_xxx.json → serve o arquivo
          const fileName = req.url?.replace(/^\//, '') || '';
          const filePath = path.join(mazeRunsDir, fileName);
          if (fs.existsSync(filePath) && fileName.endsWith('.json')) {
            const content = fs.readFileSync(filePath, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(content);
            return;
          }

          next();
        });
      }
    }
  ],
})