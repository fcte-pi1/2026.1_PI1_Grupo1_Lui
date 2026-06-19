/// <reference types="vitest/config" />
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
    // Agora suporta dois diretórios: src/maze_runs/ (backend) e maze_runs/ (firmware)
    {
      name: 'maze-runs-api',
      configureServer(server) {
        const mazeRunsDirs = [
          path.resolve(__dirname, '../maze_runs'),       // src/maze_runs (backend)
          path.resolve(__dirname, '../../maze_runs'),     // maze_runs (firmware)
        ];

        // GET /api/maze_runs → lista os arquivos JSON disponíveis
        server.middlewares.use('/api/maze_runs', (req, res, next) => {
          // Se a URL é exatamente /api/maze_runs (listagem)
          if (req.url === '/' || req.url === '') {
            try {
              // Junta arquivos de ambos os diretórios, priorizando src/maze_runs
              const allFiles = new Map();
              for (const dir of mazeRunsDirs) {
                if (fs.existsSync(dir)) {
                  const files = fs.readdirSync(dir)
                    .filter(f => f.endsWith('.json'));
                  for (const file of files) {
                    // Não sobrescreve arquivos com mesmo nome (prioriza o primeiro diretório)
                    if (!allFiles.has(file)) {
                      allFiles.set(file, file);
                    }
                  }
                }
              }
              const files = Array.from(allFiles.keys()).sort().reverse();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(files));
            } catch {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Pastas maze_runs não encontradas' }));
            }
            return;
          }

          // GET /api/maze_runs/corrida_xxx.json → serve o arquivo
          const fileName = req.url?.replace(/^\//, '') || '';
          if (!fileName.endsWith('.json')) {
            next();
            return;
          }
          for (const dir of mazeRunsDirs) {
            const filePath = path.join(dir, fileName);
            if (fs.existsSync(filePath)) {
              const content = fs.readFileSync(filePath, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(content);
              return;
            }
          }

          next();
        });
      }
    }
  ],
  optimizeDeps: {
    include: ['react-is', 'recharts']
  },  
  build: {
    commonjsOptions: {
      include: [/react-is/, /node_modules/],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    exclude: ['__tests__/e2e/**', 'node_modules/**'],
  },
})