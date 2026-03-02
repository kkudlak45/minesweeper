const GRID_SIZE = 25;
const MINE_COUNT = 100;

let grid = [];
let revealed = [];
let flagged = [];
let gameOver = false;
let flagCount = 0;

function initGame() {
    grid = [];
    revealed = [];
    flagged = [];
    gameOver = false;
    flagCount = 0;

    // Initialize empty grid
    for (let i = 0; i < GRID_SIZE; i++) {
        grid[i] = [];
        revealed[i] = [];
        flagged[i] = [];
        for (let j = 0; j < GRID_SIZE; j++) {
            grid[i][j] = 0;
            revealed[i][j] = false;
            flagged[i][j] = false;
        }
    }

    // Place mines randomly
    let minesPlaced = 0;
    while (minesPlaced < MINE_COUNT) {
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);

        if (grid[row][col] !== -1) {
            grid[row][col] = -1;
            minesPlaced++;
        }
    }

    // Calculate numbers
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (grid[i][j] === -1) continue;

            let count = 0;
            for (let di = -1; di <= 1; di++) {
                for (let dj = -1; dj <= 1; dj++) {
                    if (di === 0 && dj === 0) continue;
                    const ni = i + di;
                    const nj = j + dj;
                    if (ni >= 0 && ni < GRID_SIZE && nj >= 0 && nj < GRID_SIZE) {
                        if (grid[ni][nj] === -1) count++;
                    }
                }
            }
            grid[i][j] = count;
        }
    }

    renderGrid();
    updateFlagCount();
    revealStarterSquare();
}

function revealStarterSquare() {
    // Find a cell with no adjacent mines (count = 0)
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (grid[i][j] === 0) {
                revealCell(i, j);
                return;
            }
        }
    }

    // If no zero cells exist (very rare), find a cell with lowest count
    let minCount = 8;
    let minRow = 0;
    let minCol = 0;
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (grid[i][j] !== -1 && grid[i][j] < minCount) {
                minCount = grid[i][j];
                minRow = i;
                minCol = j;
            }
        }
    }
    revealCell(minRow, minCol);
}

let cellElements = [];

function renderGrid() {
    const gridElement = document.getElementById('grid');
    gridElement.innerHTML = '';
    cellElements = [];

    for (let i = 0; i < GRID_SIZE; i++) {
        cellElements[i] = [];
        for (let j = 0; j < GRID_SIZE; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;

            cell.addEventListener('click', handleLeftClick);
            cell.addEventListener('contextmenu', handleRightClick);

            cellElements[i][j] = cell;
            updateCell(cell, i, j);
            gridElement.appendChild(cell);
        }
    }
}

function updateCell(cell, row, col) {
    // Clear previous state
    cell.className = 'cell';
    cell.textContent = '';

    if (flagged[row][col]) {
        cell.classList.add('flagged');
        cell.textContent = '🚩';

        // If game is over, show if flag is correct or false
        if (gameOver) {
            if (grid[row][col] === -1) {
                cell.classList.add('correct-flag');
            } else {
                cell.classList.add('false-flag');
            }
        }
    } else if (revealed[row][col]) {
        cell.classList.add('revealed');
        if (grid[row][col] === -1) {
            cell.classList.add('mine');
            cell.textContent = '💣';
        } else if (grid[row][col] > 0) {
            cell.textContent = grid[row][col];
            cell.classList.add(`count-${grid[row][col]}`);
        }
    }
}

function handleLeftClick(e) {
    if (gameOver) return;
    if (e.shiftKey) handleRightClick(e);

    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);

    if (flagged[row][col]) return;
    if (revealed[row][col]) return;

    revealCell(row, col);
}

function handleRightClick(e) {
    e.preventDefault();
    if (gameOver) return;

    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);

    if (revealed[row][col]) return;

    flagged[row][col] = !flagged[row][col];
    flagCount += flagged[row][col] ? 1 : -1;
    updateCell(e.target, row, col);
    updateFlagCount();
}

function revealCell(row, col) {
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return;
    if (revealed[row][col]) return;
    if (flagged[row][col]) return;

    revealed[row][col] = true;

    const cell = cellElements[row][col];
    updateCell(cell, row, col);

    if (grid[row][col] === -1) {
        gameOver = true;
        revealAllMines();
        return;
    }

    // If cell has no adjacent mines, reveal neighbors
    if (grid[row][col] === 0) {
        for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
                if (di === 0 && dj === 0) continue;
                const ni = row + di;
                const nj = col + dj;
                if (ni >= 0 && ni < GRID_SIZE && nj >= 0 && nj < GRID_SIZE) {
                    revealCell(ni, nj);
                }
            }
        }
    }

    checkWin();
}

function revealAllMines() {
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (grid[i][j] === -1) {
                revealed[i][j] = true;
                const cell = cellElements[i][j];
                updateCell(cell, i, j);
            } else if (flagged[i][j]) {
                // Update flagged cells to show false flags
                const cell = cellElements[i][j];
                updateCell(cell, i, j);
            }
        }
    }
}

function checkWin() {
    let revealedCount = 0;
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (revealed[i][j]) revealedCount++;
        }
    }

    if (revealedCount === GRID_SIZE * GRID_SIZE - MINE_COUNT) {
        gameOver = true;
        revealWinningMines();
    }
}

function revealWinningMines() {
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (grid[i][j] === -1 && !revealed[i][j]) {
                const cell = cellElements[i][j];
                cell.classList.add('revealed', 'mine-win');
                cell.textContent = '💣';
            }
        }
    }
}

function updateFlagCount() {
    document.getElementById('flag-count').textContent = flagCount;
}

document.getElementById('reset').addEventListener('click', initGame);

initGame();
