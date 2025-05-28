// Superwarm 2D (Superhot Clone)
// Main game logic

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI elements
const healthEl = document.getElementById('health-value');
const scoreEl = document.getElementById('score-value');
const levelEl = document.getElementById('level-value');
const messageEl = document.getElementById('message');

// Game constants
const PLAYER_SIZE = 32;
const ENEMY_SIZE = 28;
const BULLET_SIZE = 8;
const PLAYER_SPEED = 3.2;
const ENEMY_SPEED = 1.2;
const BULLET_SPEED = 5.5;

const GRID_SIZE = 20;
const GRID_COLS = Math.floor(canvas.width / GRID_SIZE);
const GRID_ROWS = Math.floor(canvas.height / GRID_SIZE);

// Game state
let player, enemies, bullets, operation, opLevel, score, health, gameActive, timeMoving, walls, gridBlocked;

// --- Start Screen & Mission Select ---
const startScreen = document.getElementById('start-screen');
const missionSelect = document.getElementById('mission-select');

// Spy-themed operations: each with multiple levels
const OPERATIONS = [
  {
    codename: 'Operation Nightfall',
    briefing: 'Infiltrate the warehouse. Eliminate all hostiles. Remain undetected.',
    levels: [
      {
        enemies: 3,
        walls: [
          { x: 200, y: 200, w: 400, h: 20 },
          { x: 100, y: 400, w: 200, h: 20 },
          { x: 500, y: 100, w: 20, h: 200 },
        ],
      },
      {
        enemies: 4,
        walls: [
          { x: 150, y: 150, w: 500, h: 20 },
          { x: 300, y: 300, w: 20, h: 200 },
          { x: 100, y: 500, w: 600, h: 20 },
        ],
      },
    ],
  },
  {
    codename: 'Silent Protocol',
    briefing: 'Breach the data vault. Avoid alarms. Neutralize resistance.',
    levels: [
      {
        enemies: 5,
        walls: [
          { x: 100, y: 100, w: 600, h: 20 },
          { x: 100, y: 480, w: 600, h: 20 },
          { x: 390, y: 120, w: 20, h: 360 },
        ],
      },
      {
        enemies: 6,
        walls: [
          { x: 250, y: 250, w: 300, h: 20 },
          { x: 250, y: 350, w: 300, h: 20 },
          { x: 250, y: 250, w: 20, h: 120 },
          { x: 530, y: 250, w: 20, h: 120 },
        ],
      },
    ],
  },
  {
    codename: 'Phantom Circuit',
    briefing: 'Sabotage enemy comms. Expect heavy patrols. Stay sharp.',
    levels: [
      {
        enemies: 7,
        walls: [
          { x: 100, y: 100, w: 600, h: 20 },
          { x: 100, y: 480, w: 600, h: 20 },
          { x: 100, y: 120, w: 20, h: 360 },
          { x: 680, y: 120, w: 20, h: 360 },
        ],
      },
      {
        enemies: 8,
        walls: [
          { x: 350, y: 250, w: 100, h: 100 },
          { x: 200, y: 200, w: 400, h: 20 },
          { x: 500, y: 100, w: 20, h: 200 },
        ],
      },
    ],
  },
  {
    codename: 'Ghost Run',
    briefing: 'Escape the trap. Enemies are closing in. Move fast, agent.',
    levels: [
      {
        enemies: 10,
        walls: [
          { x: 100, y: 100, w: 600, h: 20 },
          { x: 100, y: 480, w: 600, h: 20 },
          { x: 390, y: 120, w: 20, h: 360 },
        ],
      },
      {
        enemies: 12,
        walls: [
          { x: 100, y: 120, w: 20, h: 360 },
          { x: 680, y: 120, w: 20, h: 360 },
          { x: 350, y: 250, w: 100, h: 100 },
        ],
      },
    ],
  },
  {
    codename: 'Redline Directive',
    briefing: 'Final operation. Maximum security. Complete your mission.',
    levels: [
      {
        enemies: 14,
        walls: [
          { x: 100, y: 100, w: 600, h: 20 },
          { x: 100, y: 480, w: 600, h: 20 },
          { x: 100, y: 120, w: 20, h: 360 },
          { x: 680, y: 120, w: 20, h: 360 },
        ],
      },
      {
        enemies: 16,
        walls: [
          { x: 350, y: 250, w: 100, h: 100 },
          { x: 250, y: 250, w: 300, h: 20 },
          { x: 250, y: 350, w: 300, h: 20 },
        ],
      },
    ],
  },
];

// --- Gun System ---
const GUNS = [
  {
    name: 'Pistol',
    desc: 'Standard issue. Balanced.',
    cost: 0,
    damage: 1,
    fireRate: 18, // frames
    bulletSpeed: 5.5,
    color: '#0cf',
  },
  {
    name: 'SMG',
    desc: 'Rapid fire. Low damage.',
    cost: 8,
    damage: 0.5,
    fireRate: 7,
    bulletSpeed: 5.2,
    color: '#0f8',
  },
  {
    name: 'Shotgun',
    desc: 'Spread. High damage, slow.',
    cost: 12,
    damage: 0.7,
    fireRate: 36,
    bulletSpeed: 4.5,
    spread: 3,
    pellets: 5,
    color: '#fa0',
  },
  {
    name: 'Sniper',
    desc: 'High damage, slow fire.',
    cost: 16,
    damage: 2,
    fireRate: 40,
    bulletSpeed: 9,
    color: '#f33',
  },
];
let credits = Number(sessionStorage.getItem('credits') || 0);
let unlockedGuns = JSON.parse(sessionStorage.getItem('unlockedGuns') || '[0]'); // indices
let selectedGun = Number(sessionStorage.getItem('selectedGun') || 0);

function saveProgress() {
  sessionStorage.setItem('credits', credits);
  sessionStorage.setItem('unlockedGuns', JSON.stringify(unlockedGuns));
  sessionStorage.setItem('selectedGun', selectedGun);
}

// --- Loadout/Shop Screen ---
let loadoutScreen;
function showLoadoutScreen() {
  if (!loadoutScreen) {
    loadoutScreen = document.createElement('div');
    loadoutScreen.id = 'loadout-screen';
    loadoutScreen.style.position = 'fixed';
    loadoutScreen.style.top = '0';
    loadoutScreen.style.left = '0';
    loadoutScreen.style.width = '100vw';
    loadoutScreen.style.height = '100vh';
    loadoutScreen.style.background = 'rgba(7,11,19,0.98)';
    loadoutScreen.style.zIndex = '300';
    loadoutScreen.style.display = 'flex';
    loadoutScreen.style.flexDirection = 'column';
    loadoutScreen.style.alignItems = 'center';
    loadoutScreen.style.justifyContent = 'center';
    loadoutScreen.style.fontFamily = 'inherit';
    loadoutScreen.innerHTML = `
      <div style="background:rgba(10,20,40,0.96);border-radius:18px;padding:36px 24px;min-width:320px;box-shadow:0 8px 48px #0cf8;border:2px solid #0cf6;text-align:center;position:relative;">
        <h2 style="color:#0cf;letter-spacing:0.12em;margin-bottom:0.2em;">AGENT ARMORY</h2>
        <div style="color:#fff;font-size:1.1em;margin-bottom:1.2em;">Credits: <span id='credits-value'>${credits}</span></div>
        <div id="gun-list" style="display:flex;flex-wrap:wrap;gap:18px;justify-content:center;"></div>
        <button id="close-loadout" class="mission-btn" style="margin-top:2em;">Back</button>
      </div>
    `;
    document.body.appendChild(loadoutScreen);
    document.getElementById('close-loadout').onclick = hideLoadoutScreen;
  }
  updateGunList();
  loadoutScreen.style.display = '';
}
function hideLoadoutScreen() {
  if (loadoutScreen) loadoutScreen.style.display = 'none';
}
function updateGunList() {
  const gunList = document.getElementById('gun-list');
  gunList.innerHTML = '';
  for (let i = 0; i < GUNS.length; i++) {
    const gun = GUNS[i];
    const owned = unlockedGuns.includes(i);
    const gunDiv = document.createElement('div');
    gunDiv.style.background = 'rgba(0,255,255,0.07)';
    gunDiv.style.border = `2px solid ${gun.color}`;
    gunDiv.style.borderRadius = '10px';
    gunDiv.style.padding = '18px 16px';
    gunDiv.style.minWidth = '180px';
    gunDiv.style.boxShadow = '0 2px 12px #0cf2';
    gunDiv.style.display = 'flex';
    gunDiv.style.flexDirection = 'column';
    gunDiv.style.alignItems = 'center';
    gunDiv.style.margin = '0 4px';
    gunDiv.innerHTML = `
      <div style="color:${gun.color};font-size:1.2em;font-weight:bold;letter-spacing:0.08em;margin-bottom:0.2em;">${gun.name}</div>
      <div style="color:#fff;font-size:0.98em;margin-bottom:0.7em;">${gun.desc}</div>
      <div style="color:#0cf;font-size:0.95em;margin-bottom:0.7em;">Damage: <b>${gun.damage}</b> | Fire Rate: <b>${(60/gun.fireRate).toFixed(1)}/s</b><br>Bullet Speed: <b>${gun.bulletSpeed}</b></div>
      ${gun.spread ? `<div style='color:#fa0;font-size:0.9em;margin-bottom:0.7em;'>Spread: ${gun.pellets} pellets</div>` : ''}
      <div style="margin-bottom:0.7em;">${owned ? '<span style="color:#0f8;">Unlocked</span>' : `<span style="color:#fa0;">${gun.cost} credits</span>`}</div>
      <button class="mission-btn" style="background:${owned ? (selectedGun===i?'#0f8':'#0cf') : '#fa0'};color:#fff;" ${owned ? '' : (credits>=gun.cost?'':'disabled')}>
        ${owned ? (selectedGun===i?'Equipped':'Equip') : 'Unlock'}
      </button>
    `;
    const btn = gunDiv.querySelector('button');
    btn.onclick = () => {
      if (owned) {
        selectedGun = i;
        saveProgress();
        updateGunList();
      } else if (credits >= gun.cost) {
        credits -= gun.cost;
        unlockedGuns.push(i);
        selectedGun = i;
        saveProgress();
        updateGunList();
        document.getElementById('credits-value').textContent = credits;
      }
    };
    gunList.appendChild(gunDiv);
  }
}

// Add "Armory" button to start screen
function addArmoryButton() {
  let btn = document.getElementById('armory-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'armory-btn';
    btn.className = 'mission-btn';
    btn.textContent = 'AGENT ARMORY';
    btn.style.margin = '2em auto 0 auto';
    btn.onclick = showLoadoutScreen;
    document.querySelector('.start-content').appendChild(btn);
  }
}

// --- Update showStartScreen to add Armory button ---
const origShowStartScreen = showStartScreen;
showStartScreen = function() {
  origShowStartScreen();
  addArmoryButton();
};

function showStartScreen() {
  startScreen.removeAttribute('hidden');
  document.getElementById('ui').style.display = 'none';
  canvas.style.display = 'none';
  // Populate mission select
  missionSelect.innerHTML = '';
  for (let i = 0; i < OPERATIONS.length; i++) {
    const op = OPERATIONS[i];
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.alignItems = 'center';
    wrap.style.margin = '0 8px';
    const codename = document.createElement('div');
    codename.className = 'mission-codename';
    codename.textContent = op.codename;
    const briefing = document.createElement('div');
    briefing.className = 'mission-briefing';
    briefing.textContent = op.briefing;
    const btn = document.createElement('button');
    btn.className = 'mission-btn';
    btn.textContent = 'BEGIN';
    btn.onclick = () => startMission(i);
    wrap.appendChild(codename);
    wrap.appendChild(briefing);
    wrap.appendChild(btn);
    missionSelect.appendChild(wrap);
  }
}
function hideStartScreen() {
  startScreen.setAttribute('hidden', '');
  document.getElementById('ui').style.display = '';
  canvas.style.display = '';
}
function startMission(opIdx) {
  operation = opIdx;
  opLevel = 0;
  score = 0;
  health = 3;
  hideStartScreen();
  startLevel();
  gameActive = true;
  showMessage('', false);
}

function resetGame() {
  showStartScreen();
}

function startLevel() {
  const levelObj = OPERATIONS[operation].levels[opLevel];
  // Find a walkable spawn for player
  let px = canvas.width / 2, py = canvas.height - 60;
  let playerCell = posToCell(px, py);
  walls = levelObj.walls.map(w => ({ ...w }));
  gridBlocked = buildGridBlocked(walls);
  if (gridBlocked && gridBlocked[playerCell.row] && gridBlocked[playerCell.row][playerCell.col]) {
    const walkable = findNearestWalkableCell(playerCell, gridBlocked);
    if (walkable) {
      px = walkable.col * GRID_SIZE + GRID_SIZE / 2;
      py = walkable.row * GRID_SIZE + GRID_SIZE / 2;
    }
  }
  player = new Player(px, py);
  enemies = [];
  bullets = [];
  timeMoving = false;
  gameActive = true;
  // Spawn enemies
  for (let i = 0; i < levelObj.enemies; i++) {
    let ex, ey, tries = 0;
    let cell, walkable;
    do {
      ex = Math.random() * (canvas.width - ENEMY_SIZE) + ENEMY_SIZE / 2;
      ey = Math.random() * 120 + 40;
      cell = posToCell(ex, ey);
      walkable = !gridBlocked[cell.row][cell.col];
      tries++;
      if (!walkable) {
        const nearest = findNearestWalkableCell(cell, gridBlocked);
        if (nearest) {
          ex = nearest.col * GRID_SIZE + GRID_SIZE / 2;
          ey = nearest.row * GRID_SIZE + GRID_SIZE / 2;
          walkable = true;
        }
      }
    } while (!walkable && tries < 20);
    enemies.push(new Enemy(ex, ey));
  }
  updateUI();
  showMessage('', false);
}

function nextLevel() {
  opLevel++;
  credits += 3;
  saveProgress();
  if (opLevel >= OPERATIONS[operation].levels.length) {
    showMessage('OPERATION COMPLETE!<br>Final Score: ' + score + '<br>Credits earned: 3<br><button onclick="showStartScreen()">Mission Select</button>', true);
    gameActive = false;
    return;
  }
  showMessage('LEVEL COMPLETE!<br>Credits earned: 3<br><button onclick="startLevel()">Next Level</button>', true);
  gameActive = false;
}

function updateUI() {
  healthEl.textContent = health;
  scoreEl.textContent = score;
  levelEl.textContent = `${opLevel + 1} / ${OPERATIONS[operation].levels.length}`;
}

function showMessage(msg, show = true) {
  messageEl.innerHTML = msg;
  messageEl.style.display = show ? 'block' : 'none';
}

function buildGridBlocked(walls) {
  // Returns a 2D array [row][col] of booleans
  const grid = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    grid[y] = [];
    for (let x = 0; x < GRID_COLS; x++) {
      const cellRect = { x: x * GRID_SIZE, y: y * GRID_SIZE, w: GRID_SIZE, h: GRID_SIZE };
      grid[y][x] = walls.some(w => rectsOverlap(cellRect, w));
    }
  }
  return grid;
}
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// --- Classes ---
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = PLAYER_SIZE;
    this.color = '#fff';
    this.cooldown = 0;
    this.gun = selectedGun;
  }
  move(dx, dy) {
    let nx = this.x + dx;
    let ny = this.y + dy;
    // Clamp to canvas
    nx = Math.max(this.size / 2, Math.min(canvas.width - this.size / 2, nx));
    ny = Math.max(this.size / 2, Math.min(canvas.height - this.size / 2, ny));
    // Wall collision
    if (!collidesWithWalls({ x: nx, y: ny, size: this.size })) {
      this.x = nx;
      this.y = ny;
    }
  }
  shoot(targetX, targetY) {
    const gun = GUNS[selectedGun];
    if (this.cooldown > 0) return;
    const angle = Math.atan2(targetY - this.y, targetX - this.x);
    if (gun.name === 'Shotgun') {
      for (let i = 0; i < gun.pellets; i++) {
        const spread = (Math.random() - 0.5) * 0.3 * gun.spread;
        bullets.push(new Bullet(
          this.x, this.y,
          Math.cos(angle + spread) * gun.bulletSpeed,
          Math.sin(angle + spread) * gun.bulletSpeed,
          'player', gun.damage, gun.color
        ));
      }
    } else {
      bullets.push(new Bullet(
        this.x, this.y,
        Math.cos(angle) * gun.bulletSpeed,
        Math.sin(angle) * gun.bulletSpeed,
        'player', gun.damage, gun.color
      ));
    }
    this.cooldown = gun.fireRate;
  }
  update() {
    if (this.cooldown > 0) this.cooldown--;
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = ENEMY_SIZE;
    this.color = '#e33';
    this.cooldown = Math.random() * 60 + 30;
    this.path = [];
    this.pathTimer = 0;
  }
  update() {
    // Pathfinding to player
    let startCell = posToCell(this.x, this.y);
    let endCell = posToCell(player.x, player.y);
    // If start or end is blocked, find nearest walkable
    if (gridBlocked[startCell.row][startCell.col]) {
      const nearest = findNearestWalkableCell(startCell, gridBlocked);
      if (nearest) startCell = nearest;
    }
    if (gridBlocked[endCell.row][endCell.col]) {
      const nearest = findNearestWalkableCell(endCell, gridBlocked);
      if (nearest) endCell = nearest;
    }
    if (this.pathTimer <= 0 || !this.path || this.path.length === 0 || !sameCell(this.path[this.path.length - 1], endCell)) {
      this.path = findPath(startCell, endCell, gridBlocked);
      this.pathTimer = 10; // recalc every 10 frames
    } else {
      this.pathTimer--;
    }
    // Move along path
    if (this.path && this.path.length > 1) {
      const next = this.path[1];
      const tx = next.col * GRID_SIZE + GRID_SIZE / 2;
      const ty = next.row * GRID_SIZE + GRID_SIZE / 2;
      const dx = tx - this.x;
      const dy = ty - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 2) {
        const mx = (dx / dist) * ENEMY_SPEED;
        const my = (dy / dist) * ENEMY_SPEED;
        let nx = this.x + mx;
        let ny = this.y + my;
        if (!collidesWithWalls({ x: nx, y: ny, size: this.size })) {
          this.x = nx;
          this.y = ny;
        }
      }
    }
    // Shoot at player
    const pdx = player.x - this.x;
    const pdy = player.y - this.y;
    const pdist = Math.hypot(pdx, pdy);
    if (this.cooldown <= 0 && pdist < 400) {
      const angle = Math.atan2(pdy, pdx);
      bullets.push(new Bullet(this.x, this.y, Math.cos(angle) * BULLET_SPEED, Math.sin(angle) * BULLET_SPEED, 'enemy'));
      this.cooldown = 90 + Math.random() * 60;
    } else {
      this.cooldown--;
    }
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Bullet {
  constructor(x, y, vx, vy, owner, damage = 1, color = null) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = BULLET_SIZE;
    this.owner = owner; // 'player' or 'enemy'
    this.color = color || (owner === 'player' ? '#0cf' : '#f33');
    this.damage = damage;
  }
  update() {
    let nx = this.x + this.vx;
    let ny = this.y + this.vy;
    // Wall collision
    if (!collidesWithWalls({ x: nx, y: ny, size: this.size })) {
      this.x = nx;
      this.y = ny;
    } else {
      this.x = nx;
      this.y = ny;
      this.dead = true;
    }
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// --- Input ---
const keys = {};
window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('mousedown', e => {
  if (!gameActive) return;
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);
  player.shoot(mx, my);
});

// --- Main Loop ---
function gameLoop() {
  // Don't run game loop if on start screen
  if (!startScreen.hasAttribute('hidden')) {
    requestAnimationFrame(gameLoop);
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw walls
  ctx.save();
  ctx.fillStyle = '#888';
  for (const w of walls) {
    ctx.fillRect(w.x, w.y, w.w, w.h);
  }
  ctx.restore();

  // --- Player movement ---
  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup']) dy -= PLAYER_SPEED;
  if (keys['s'] || keys['arrowdown']) dy += PLAYER_SPEED;
  if (keys['a'] || keys['arrowleft']) dx -= PLAYER_SPEED;
  if (keys['d'] || keys['arrowright']) dx += PLAYER_SPEED;
  timeMoving = dx !== 0 || dy !== 0;

  if (gameActive) {
    if (timeMoving) {
      player.move(dx, dy);
      // Enemies and bullets move only when player moves
      for (const enemy of enemies) enemy.update();
      for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        if (bullets[i].dead) bullets.splice(i, 1);
      }
    }
    player.update();

    // --- Collision detection ---
    // Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      // Remove if out of bounds
      if (b.x < -20 || b.x > canvas.width + 20 || b.y < -20 || b.y > canvas.height + 20) {
        bullets.splice(i, 1);
        continue;
      }
      // Player hit
      if (b.owner === 'enemy' && dist(b, player) < (PLAYER_SIZE + BULLET_SIZE) / 2) {
        bullets.splice(i, 1);
        health -= b.damage || 1;
        updateUI();
        if (health <= 0) {
          showMessage('YOU DIED<br>Score: ' + score + '<br><button onclick="resetGame()">Restart</button>', true);
          gameActive = false;
        }
        continue;
      }
      // Enemy hit
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (b.owner === 'player' && dist(b, e) < (ENEMY_SIZE + BULLET_SIZE) / 2) {
          e.hp = (e.hp || 1) - (b.damage || 1);
          bullets.splice(i, 1);
          if (e.hp <= 0) {
            enemies.splice(j, 1);
            score += 100;
            updateUI();
          }
          break;
        }
      }
    }
    // Enemy collision with player
    for (const e of enemies) {
      if (dist(e, player) < (PLAYER_SIZE + ENEMY_SIZE) / 2) {
        health = 0;
        updateUI();
        showMessage('YOU DIED<br>Score: ' + score + '<br><button onclick="resetGame()">Restart</button>', true);
        gameActive = false;
      }
    }
    // Level complete
    if (enemies.length === 0 && gameActive) {
      nextLevel();
    }
  }

  // --- Draw ---
  player.draw();
  for (const enemy of enemies) enemy.draw();
  for (const bullet of bullets) bullet.draw();

  requestAnimationFrame(gameLoop);
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// --- Wall collision helpers ---
function collidesWithWalls(obj) {
  // obj: {x, y, size}
  for (const w of walls) {
    if (rectCircleCollide(obj.x, obj.y, obj.size / 2, w)) return true;
  }
  return false;
}
function rectCircleCollide(cx, cy, cr, rect) {
  // Circle-rect collision
  const rx = rect.x, ry = rect.y, rw = rect.w, rh = rect.h;
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return (dx * dx + dy * dy) < (cr * cr);
}

// --- Pathfinding helpers ---
function posToCell(x, y) {
  return {
    col: Math.floor(x / GRID_SIZE),
    row: Math.floor(y / GRID_SIZE),
  };
}
function sameCell(a, b) {
  return a && b && a.col === b.col && a.row === b.row;
}
function findPath(start, end, grid) {
  // A* pathfinding
  const open = [];
  const closed = new Set();
  const cameFrom = {};
  const gScore = {};
  const fScore = {};
  function cellKey(c) { return c.col + ',' + c.row; }
  open.push({ ...start, g: 0, f: heuristic(start, end) });
  gScore[cellKey(start)] = 0;
  fScore[cellKey(start)] = heuristic(start, end);
  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift();
    if (sameCell(current, end)) {
      // Reconstruct path
      const path = [current];
      let ck = cellKey(current);
      while (cameFrom[ck]) {
        path.unshift(cameFrom[ck]);
        ck = cellKey(cameFrom[ck]);
      }
      return path;
    }
    closed.add(cellKey(current));
    for (const dir of [
      { dc: 0, dr: -1 }, { dc: 1, dr: 0 }, { dc: 0, dr: 1 }, { dc: -1, dr: 0 },
      { dc: 1, dr: -1 }, { dc: 1, dr: 1 }, { dc: -1, dr: 1 }, { dc: -1, dr: -1 },
    ]) {
      const neighbor = { col: current.col + dir.dc, row: current.row + dir.dr };
      if (
        neighbor.col < 0 || neighbor.col >= GRID_COLS ||
        neighbor.row < 0 || neighbor.row >= GRID_ROWS ||
        grid[neighbor.row][neighbor.col]
      ) continue;
      const nKey = cellKey(neighbor);
      if (closed.has(nKey)) continue;
      const tentativeG = gScore[cellKey(current)] + ((dir.dc === 0 || dir.dr === 0) ? 1 : 1.4);
      if (gScore[nKey] === undefined || tentativeG < gScore[nKey]) {
        cameFrom[nKey] = current;
        gScore[nKey] = tentativeG;
        fScore[nKey] = tentativeG + heuristic(neighbor, end);
        if (!open.some(n => sameCell(n, neighbor))) {
          open.push({ ...neighbor, g: gScore[nKey], f: fScore[nKey] });
        }
      }
    }
  }
  return [start]; // No path found
}
function heuristic(a, b) {
  // Euclidean distance
  return Math.hypot(a.col - b.col, a.row - b.row);
}

function findNearestWalkableCell(cell, grid) {
  // BFS to find nearest walkable cell
  const visited = new Set();
  const queue = [cell];
  function cellKey(c) { return c.col + ',' + c.row; }
  while (queue.length > 0) {
    const c = queue.shift();
    if (
      c.col >= 0 && c.col < GRID_COLS &&
      c.row >= 0 && c.row < GRID_ROWS &&
      !grid[c.row][c.col]
    ) {
      return c;
    }
    visited.add(cellKey(c));
    for (const dir of [
      { dc: 0, dr: -1 }, { dc: 1, dr: 0 }, { dc: 0, dr: 1 }, { dc: -1, dr: 0 },
      { dc: 1, dr: -1 }, { dc: 1, dr: 1 }, { dc: -1, dr: 1 }, { dc: -1, dr: -1 },
    ]) {
      const neighbor = { col: c.col + dir.dc, row: c.row + dir.dr };
      if (!visited.has(cellKey(neighbor))) {
        queue.push(neighbor);
      }
    }
  }
  return null;
}

// --- Start Game ---
showStartScreen();
gameLoop(); 