let gameReady = false;

const playerGrid = document.getElementById('playerGrid');
const enemyGrid = document.getElementById('enemyGrid');
const statusText = document.getElementById('status');

const shipSizes = [2, 3, 5];
let currentShip = 0;
let orientation = 'horizontal';
let placedShips = [];

document.addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 'r') {
    orientation = orientation === 'horizontal' ? 'vertical' : 'horizontal';
  }
});

function makeGrid(grid, clickHandler) {
  for (let r = 0; r < 10; r++) {
    for (let c = 1; c <= 10; c++) {
      const cell = String.fromCharCode(65 + r) + c;
      const btn = document.createElement('button');
      btn.textContent = cell;
      btn.onclick = () => clickHandler(btn, cell);
      grid.appendChild(btn);
    }
  }
}

makeGrid(playerGrid, placeShip);
makeGrid(enemyGrid, fire);

function placeShip(button, cell) {
  if (currentShip >= shipSizes.length) return;

  const size = shipSizes[currentShip];
  const cells = [];

  const row = cell.charCodeAt(0) - 65;
  const col = parseInt(cell.slice(1)) - 1;

  for (let i = 0; i < size; i++) {
    const r = orientation === 'horizontal' ? row : row + i;
    const c = orientation === 'horizontal' ? col + i : col;

    if (r > 9 || c > 9) return;

    const nextCell = String.fromCharCode(65 + r) + (c + 1);
    cells.push(nextCell);
  }

  if (cells.some(c => placedShips.includes(c))) return;

  cells.forEach(c => {
    [...playerGrid.children]
      .find(b => b.textContent === c)
      .classList.add('ship');
  });

  placedShips.push(...cells);
  currentShip++;

  if (currentShip < shipSizes.length) {
    statusText.textContent = `Place ship of size ${shipSizes[currentShip]}`;
  } else {
    statusText.textContent = 'Sending ships to server...';
    sendPlacement();
  }
}

function sendPlacement() {
  fetch('api/fire.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'place',
      ships: placedShips
    })
  })
    .then(r => r.json())
    .then(data => {
      if (data.ok) {
        gameReady = true;
        statusText.textContent = 'All ships placed. Fire at enemy!';
      } else {
        statusText.textContent = 'Placement failed.';
      }
    })
    .catch(() => {
      statusText.textContent = 'Server error during placement.';
    });
}

function fire(button, cell) {
  if (!gameReady) return;

  fetch('api/fire.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cell })
  })
    .then(r => r.json())
    .then(data => {
      button.classList.add(data.player.result);
      button.disabled = true;

      // CPU shot on player grid
      [...playerGrid.children].forEach(b => {
        if (b.textContent === data.computer.cell) {
          b.classList.add(data.computer.result);
        }
      });

      if (data.gameOver) {
        alert('You win!');
        gameReady = false;
      }
    })
    .catch(() => {
      alert('Server error.');
    });
}
