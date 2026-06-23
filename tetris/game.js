// === CONSTANTS ===
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = {
  I: '#00f5d4',
  O: '#ffd166',
  T: '#7b2ff7',
  S: '#06d6a0',
  Z: '#f72585',
  J: '#4361ee',
  L: '#fb8500',
};

// Tetromino shapes (each rotation state)
const SHAPES = {
  I: [
    [[0,0],[1,0],[2,0],[3,0]],
    [[0,0],[0,1],[0,2],[0,3]],
    [[0,0],[1,0],[2,0],[3,0]],
    [[0,0],[0,1],[0,2],[0,3]],
  ],
  O: [
    [[0,0],[1,0],[0,1],[1,1]],
    [[0,0],[1,0],[0,1],[1,1]],
    [[0,0],[1,0],[0,1],[1,1]],
    [[0,0],[1,0],[0,1],[1,1]],
  ],
  T: [
    [[0,0],[1,0],[2,0],[1,1]],
    [[0,0],[0,1],[0,2],[1,1]],
    [[0,1],[1,1],[2,1],[1,0]],
    [[1,0],[1,1],[1,2],[0,1]],
  ],
  S: [
    [[1,0],[2,0],[0,1],[1,1]],
    [[0,0],[0,1],[1,1],[1,2]],
    [[1,0],[2,0],[0,1],[1,1]],
    [[0,0],[0,1],[1,1],[1,2]],
  ],
  Z: [
    [[0,0],[1,0],[1,1],[2,1]],
    [[1,0],[0,1],[1,1],[0,2]],
    [[0,0],[1,0],[1,1],[2,1]],
    [[1,0],[0,1],[1,1],[0,2]],
  ],
  J: [
    [[0,0],[0,1],[1,1],[2,1]],
    [[0,0],[1,0],[0,1],[0,2]],
    [[0,0],[1,0],[2,0],[2,1]],
    [[1,0],[1,1],[0,2],[1,2]],
  ],
  L: [
    [[2,0],[0,1],[1,1],[2,1]],
    [[0,0],[0,1],[0,2],[1,2]],
    [[0,0],[1,0],[2,0],[0,1]],
    [[0,0],[1,0],[1,1],[1,2]],
  ],
};

const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

// Scoring
const LINE_SCORES = { 1: 100, 2: 300, 3: 500, 4: 800 };

// === DOM ELEMENTS ===
const welcomeScreen = document.getElementById('welcome-screen');
const helpScreen = document.getElementById('help-screen');
const scoresScreen = document.getElementById('scores-screen');
const gameScreen = document.getElementById('game-screen');
const gameoverScreen = document.getElementById('gameover-screen');

const btnPlay = document.getElementById('btn-play');
const btnHelp = document.getElementById('btn-help');
const btnScores = document.getElementById('btn-scores');
const btnBackHelp = document.getElementById('btn-back-help');
const btnBackScores = document.getElementById('btn-back-scores');
const btnQuit = document.getElementById('btn-quit');
const btnRestart = document.getElementById('btn-restart');
const btnMenu = document.getElementById('btn-menu');

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');

const scoreDisplay = document.getElementById('score-display');
const levelDisplay = document.getElementById('level-display');
const linesDisplay = document.getElementById('lines-display');
const finalScore = document.getElementById('final-score');
const finalLevel = document.getElementById('final-level');
const scoresList = document.getElementById('scores-list');

// === GAME STATE ===
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let gameLoop = null;
let dropInterval = 1000;
let lastDrop = 0;
let paused = false;
let gameOver = false;

// === SCREEN NAVIGATION ===
function showScreen(screen) {
  [welcomeScreen, helpScreen, scoresScreen, gameScreen, gameoverScreen]
    .forEach(s => s.classList.add('hidden'));
  screen.classList.remove('hidden');
}

btnPlay.addEventListener('click', startGame);
btnHelp.addEventListener('click', () => showScreen(helpScreen));
btnScores.addEventListener('click', () => { renderScores(); showScreen(scoresScreen); });
btnBackHelp.addEventListener('click', () => showScreen(welcomeScreen));
btnBackScores.addEventListener('click', () => showScreen(welcomeScreen));
btnQuit.addEventListener('click', () => { stopGame(); showScreen(welcomeScreen); });
btnRestart.addEventListener('click', startGame);
btnMenu.addEventListener('click', () => showScreen(welcomeScreen));

// === HIGH SCORES ===
function getHighScores() {
  const data = localStorage.getItem('tetris-scores');
  return data ? JSON.parse(data) : [];
}

function saveHighScore(score) {
  const scores = getHighScores();
  scores.push(score);
  scores.sort((a, b) => b - a);
  localStorage.setItem('tetris-scores', JSON.stringify(scores.slice(0, 10)));
}

function renderScores() {
  const scores = getHighScores();
  scoresList.innerHTML = scores.length
    ? scores.map((s, i) => `<li>${s.toLocaleString()}</li>`).join('')
    : '<li>No scores yet</li>';
}

// === BOARD ===
function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

// === PIECES ===
function randomPiece() {
  const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  return {
    type,
    rotation: 0,
    x: Math.floor(COLS / 2) - 1,
    y: 0,
  };
}

function getBlocks(piece) {
  return SHAPES[piece.type][piece.rotation].map(([bx, by]) => ({
    x: piece.x + bx,
    y: piece.y + by,
  }));
}

function isValidPosition(piece) {
  const blocks = getBlocks(piece);
  return blocks.every(({ x, y }) =>
    x >= 0 && x < COLS && y < ROWS && (y < 0 || board[y][x] === null)
  );
}

// === GAME ACTIONS ===
function movePiece(dx, dy) {
  const moved = { ...currentPiece, x: currentPiece.x + dx, y: currentPiece.y + dy };
  if (isValidPosition(moved)) {
    currentPiece = moved;
    return true;
  }
  return false;
}

function rotatePiece(direction) {
  const newRotation = (currentPiece.rotation + direction + 4) % 4;
  const rotated = { ...currentPiece, rotation: newRotation };
  if (isValidPosition(rotated)) {
    currentPiece = rotated;
    return;
  }
  // Wall kick: try shifting left/right
  for (const kick of [-1, 1, -2, 2]) {
    const kicked = { ...rotated, x: rotated.x + kick };
    if (isValidPosition(kicked)) {
      currentPiece = kicked;
      return;
    }
  }
}

function hardDrop() {
  while (movePiece(0, 1)) {}
  lockPiece();
}

function lockPiece() {
  const blocks = getBlocks(currentPiece);
  blocks.forEach(({ x, y }) => {
    if (y >= 0) board[y][x] = currentPiece.type;
  });
  clearLines();
  spawnPiece();
}

function clearLines() {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(cell => cell !== null)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(null));
      cleared++;
      y++; // recheck same row
    }
  }
  if (cleared > 0) {
    score += LINE_SCORES[cleared] || 0;
    lines += cleared;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level - 1) * 80);
    updateDisplay();
  }
}

function spawnPiece() {
  currentPiece = nextPiece || randomPiece();
  nextPiece = randomPiece();
  if (!isValidPosition(currentPiece)) {
    endGame();
  }
}

// === RENDERING ===
function drawBlock(context, x, y, color, size = BLOCK_SIZE) {
  context.fillStyle = color;
  context.fillRect(x * size, y * size, size - 1, size - 1);
  // Highlight
  context.fillStyle = 'rgba(255,255,255,0.15)';
  context.fillRect(x * size, y * size, size - 1, 3);
  context.fillRect(x * size, y * size, 3, size - 1);
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Draw placed blocks
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x]) {
        drawBlock(ctx, x, y, COLORS[board[y][x]]);
      }
    }
  }
  // Draw ghost piece
  if (currentPiece) {
    const ghost = { ...currentPiece };
    while (isValidPosition({ ...ghost, y: ghost.y + 1 })) ghost.y++;
    getBlocks(ghost).forEach(({ x, y }) => {
      if (y >= 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
      }
    });
    // Draw current piece
    getBlocks(currentPiece).forEach(({ x, y }) => {
      if (y >= 0) drawBlock(ctx, x, y, COLORS[currentPiece.type]);
    });
  }
  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * BLOCK_SIZE, 0);
    ctx.lineTo(x * BLOCK_SIZE, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * BLOCK_SIZE);
    ctx.lineTo(canvas.width, y * BLOCK_SIZE);
    ctx.stroke();
  }
}

function drawNext() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  if (!nextPiece) return;
  const blocks = SHAPES[nextPiece.type][0];
  const size = 25;
  const offsetX = (nextCanvas.width - 4 * size) / 2 / size;
  const offsetY = (nextCanvas.height - 4 * size) / 2 / size;
  blocks.forEach(([bx, by]) => {
    drawBlock(nextCtx, bx + offsetX, by + offsetY, COLORS[nextPiece.type], size);
  });
}

function updateDisplay() {
  scoreDisplay.textContent = score.toLocaleString();
  levelDisplay.textContent = level;
  linesDisplay.textContent = lines;
}

// === GAME LOOP ===
function gameFrame(timestamp) {
  if (gameOver) return;
  if (paused) {
    gameLoop = requestAnimationFrame(gameFrame);
    return;
  }

  if (timestamp - lastDrop > dropInterval) {
    if (!movePiece(0, 1)) {
      lockPiece();
    }
    lastDrop = timestamp;
  }

  drawBoard();
  drawNext();
  gameLoop = requestAnimationFrame(gameFrame);
}

function startGame() {
  board = createBoard();
  score = 0;
  level = 1;
  lines = 0;
  dropInterval = 1000;
  lastDrop = 0;
  paused = false;
  gameOver = false;
  currentPiece = null;
  nextPiece = null;
  spawnPiece();
  updateDisplay();
  showScreen(gameScreen);
  gameLoop = requestAnimationFrame(gameFrame);
}

function stopGame() {
  gameOver = true;
  if (gameLoop) cancelAnimationFrame(gameLoop);
}

function endGame() {
  stopGame();
  saveHighScore(score);
  finalScore.textContent = score.toLocaleString();
  finalLevel.textContent = level;
  showScreen(gameoverScreen);
}

// === INPUT ===
document.addEventListener('keydown', (e) => {
  if (gameOver || !gameScreen.classList.contains('hidden') === false) return;
  if (gameScreen.classList.contains('hidden')) return;

  switch (e.key) {
    case 'ArrowLeft':
      movePiece(-1, 0);
      break;
    case 'ArrowRight':
      movePiece(1, 0);
      break;
    case 'ArrowDown':
      movePiece(0, 1);
      break;
    case 'ArrowUp':
      rotatePiece(1);
      break;
    case 'z':
    case 'Z':
      rotatePiece(-1);
      break;
    case ' ':
      e.preventDefault();
      hardDrop();
      break;
    case 'p':
    case 'P':
      paused = !paused;
      break;
  }
});

// Prevent scrolling with arrow keys
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
    e.preventDefault();
  }
});
