import fs from 'fs';
import path from 'path';

const SIZE_MAP = {
  '16x16': 16,
  '16x16_standard': 16,
  '8x8': 8,
  '8x8_test': 8,
  '4x4': 4,
  '4x4_test': 4
};

const DX = [0, 1, 0, -1];
const DY = [1, 0, -1, 0];
const DIR = { NORTE: 0, LESTE: 1, SUL: 2, OESTE: 3 };

class MazeState {
  constructor() {
    this.grid = [];
    this.size = 16;
    this.id_corrida = null;
    this.id_labirinto = null;
    this.initialized = false;
  }

  initialize(id_labirinto, id_corrida) {
    let newSize = 16;
    for (const key in SIZE_MAP) {
      if (id_labirinto.includes(key)) {
        newSize = SIZE_MAP[key];
        break;
      }
    }
    
    if (this.initialized && this.id_corrida === id_corrida) return;

    this.size = newSize;
    this.id_corrida = id_corrida;
    this.id_labirinto = id_labirinto;
    this.grid = [];

    for (let x = 0; x < this.size; x++) {
      let col = [];
      for (let y = 0; y < this.size; y++) {
        col.push({
          x: x, y: y,
          norte: false, sul: false,
          leste: false, oeste: false,
          visitada: false
        });
      }
      this.grid.push(col);
    }

    for (let i = 0; i < this.size; i++) {
      this.grid[i][0].sul = true;
      this.grid[i][this.size - 1].norte = true;
      this.grid[0][i].oeste = true;
      this.grid[this.size - 1][i].leste = true;
    }

    this.initialized = true;
  }

  setWall(x, y, dir_str) {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) return;
    
    const d = DIR[dir_str];
    if (d === undefined) return;

    if (d === DIR.NORTE) this.grid[x][y].norte = true;
    if (d === DIR.LESTE) this.grid[x][y].leste = true;
    if (d === DIR.SUL)   this.grid[x][y].sul = true;
    if (d === DIR.OESTE) this.grid[x][y].oeste = true;

    const nx = x + DX[d];
    const ny = y + DY[d];
    if (nx >= 0 && nx < this.size && ny >= 0 && ny < this.size) {
      if (d === DIR.NORTE) this.grid[nx][ny].sul = true;
      if (d === DIR.LESTE) this.grid[nx][ny].oeste = true;
      if (d === DIR.SUL)   this.grid[nx][ny].norte = true;
      if (d === DIR.OESTE) this.grid[nx][ny].leste = true;
    }
  }

  processTelemetry(data) {
    const id_labirinto = data.id_labirinto || '16x16_standard';
    const id_corrida = data.id_corrida || 'default';
    
    this.initialize(id_labirinto, id_corrida);

    const rx = data.posicao_x !== undefined ? data.posicao_x : data.pos_x;
    const ry = data.posicao_y !== undefined ? data.posicao_y : data.pos_y;
    
    if (rx !== undefined && ry !== undefined && rx >= 0 && rx < this.size && ry >= 0 && ry < this.size) {
      this.grid[rx][ry].visitada = true;
    }

    if (data.paredes && Array.isArray(data.paredes)) {
      data.paredes.forEach(p => {
        this.setWall(p.x, p.y, p.dir);
      });
    }
  }

  getFlattenedCells() {
    let cells = [];
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        cells.push(this.grid[x][y]);
      }
    }
    return cells;
  }

  saveToJson() {
    if (!this.initialized) return;

    const exportData = {
      id_corrida: this.id_corrida,
      id_labirinto: this.id_labirinto,
      tamanho: this.size,
      estado_fsm: 'GOAL_REACHED',
      timestamp: Date.now(),
      celulas_descobertas: this.getFlattenedCells()
    };

    const dir = path.resolve('./maze_runs');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filename = `maze_${this.id_corrida}_${Date.now()}.json`;
    const filepath = path.join(dir, filename);

    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2), 'utf8');

    this.initialized = false;
  }
}

export const mazeState = new MazeState();
