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
    briefing: 'Infiltrate the safehouse. Eliminate all hostiles. Remain undetected.',
    levels: [
      {
        enemies: 3,
        // House map: Living room, kitchen, bedroom, hallway, furniture
        walls: [
          // Exterior walls (front door gap at x: 380-420)
          { x: 120, y: 80, w: 560, h: 20 }, // top
          { x: 120, y: 80, w: 20, h: 440 }, // left
          { x: 120, y: 500, w: 260, h: 20 }, // bottom left
          // front door gap here (40px)
          { x: 420, y: 500, w: 260, h: 20 }, // bottom right
          { x: 660, y: 80, w: 20, h: 440 }, // right
          // Living room/kitchen divider
          { x: 260, y: 80, w: 20, h: 120 }, // left of kitchen
          { x: 260, y: 200, w: 120, h: 20 }, // kitchen top
          { x: 380, y: 80, w: 20, h: 120 }, // right of kitchen
          // Bedroom wall
          { x: 540, y: 320, w: 120, h: 20 }, // bedroom top
          { x: 540, y: 320, w: 20, h: 100 }, // bedroom left
          { x: 640, y: 320, w: 20, h: 100 }, // bedroom right
          { x: 540, y: 420, w: 120, h: 20 }, // bedroom bottom
          // Hallway
          { x: 380, y: 200, w: 20, h: 120 }, // hallway left
          { x: 540, y: 200, w: 20, h: 120 }, // hallway right
          // Furniture (sofa)
          { x: 170, y: 140, w: 60, h: 20 },
          // Furniture (table)
          { x: 320, y: 320, w: 60, h: 20 },
          // Furniture (bed)
          { x: 560, y: 360, w: 60, h: 20 },
        ],
        playerSpawn: { x: 400, y: 540 }, // just outside the front door
        enemySpawns: [
          { x: 200, y: 160 }, // living room
          { x: 320, y: 240 }, // kitchen
          { x: 600, y: 380 }, // bedroom
        ],
      },
      {
        enemies: 4,
        // House map, more rooms open, more furniture
        walls: [
          // Exterior walls (front door gap at x: 380-420)
          { x: 120, y: 80, w: 560, h: 20 },
          { x: 120, y: 80, w: 20, h: 440 },
          { x: 120, y: 500, w: 260, h: 20 },
          // front door gap here (40px)
          { x: 420, y: 500, w: 260, h: 20 },
          { x: 660, y: 80, w: 20, h: 440 },
          // Living room/kitchen divider
          { x: 260, y: 80, w: 20, h: 120 },
          { x: 260, y: 200, w: 120, h: 20 },
          { x: 380, y: 80, w: 20, h: 120 },
          // Bedroom wall
          { x: 540, y: 320, w: 120, h: 20 },
          { x: 540, y: 320, w: 20, h: 100 },
          { x: 640, y: 320, w: 20, h: 100 },
          { x: 540, y: 420, w: 120, h: 20 },
          // Hallway
          { x: 380, y: 200, w: 20, h: 120 },
          { x: 540, y: 200, w: 20, h: 120 },
          // Furniture (sofa)
          { x: 170, y: 140, w: 60, h: 20 },
          // Furniture (table)
          { x: 320, y: 320, w: 60, h: 20 },
          // Furniture (bed)
          { x: 560, y: 360, w: 60, h: 20 },
          // Furniture (kitchen counter)
          { x: 280, y: 120, w: 60, h: 20 },
        ],
        playerSpawn: { x: 400, y: 540 },
        enemySpawns: [
          { x: 200, y: 160 },
          { x: 320, y: 240 },
          { x: 600, y: 380 },
          { x: 400, y: 300 },
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
    desc: 'Rapid fire. Low damage, slight spread.',
    cost: 8,
    damage: 0.3,
    fireRate: 3,
    bulletSpeed: 5.2,
    spread: 0.18,
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
  {
    name: 'Burst Pistol',
    desc: 'Fires 3 quick shots per trigger.',
    cost: 14,
    damage: 0.6,
    fireRate: 24,
    burstCount: 3,
    burstDelay: 4,
    bulletSpeed: 6,
    color: '#6cf',
  },
  {
    name: 'Laser',
    desc: 'Instant hit, pierces enemies, long cooldown.',
    cost: 20,
    damage: 1.5,
    fireRate: 60,
    bulletSpeed: 999,
    pierce: true,
    color: '#fff',
  },
  {
    name: 'Heavy Revolver',
    desc: 'High damage, slow fire, big knockback.',
    cost: 18,
    damage: 2.5,
    fireRate: 48,
    bulletSpeed: 7,
    knockback: 18,
    color: '#f80',
  },
  {
    name: 'Auto Shotgun',
    desc: 'Burst of pellets, moderate fire rate, wide spread.',
    cost: 22,
    damage: 0.5,
    fireRate: 12,
    bulletSpeed: 4.2,
    spread: 5,
    pellets: 4,
    color: '#ffb347',
    auto: true,
  },
  {
    name: 'Rocket Launcher',
    desc: 'Slow fire, rocket explodes on impact (area damage).',
    cost: 30,
    damage: 2.5,
    fireRate: 48,
    bulletSpeed: 3.5,
    color: '#ff5252',
    rocket: true,
    explosionRadius: 60,
  },
  {
    name: 'Pulse Rifle',
    desc: 'Medium fire rate, bullets briefly stun enemies.',
    cost: 18,
    damage: 0.8,
    fireRate: 10,
    bulletSpeed: 6,
    color: '#00e6e6',
    pulse: true,
    stunDuration: 30,
  },
  {
    name: 'Flamethrower',
    desc: 'Short range, rapid fire, damage over time in a cone.',
    cost: 26,
    damage: 0.2,
    fireRate: 2,
    bulletSpeed: 3,
    color: '#ff9100',
    flame: true,
    cone: Math.PI / 6,
    range: 140,
    dot: 3, // damage over time ticks
  },
  {
    name: 'Railgun',
    desc: 'Piercing, high-speed shot, long cooldown, goes through all enemies in a line.',
    cost: 36,
    damage: 3.5,
    fireRate: 70,
    bulletSpeed: 16,
    color: '#b0f',
    rail: true,
    pierceEnemies: true,
  },
  {
    name: 'Admin Gun',
    desc: 'For devs only. Shoots in all directions, insta-kill, pierces walls.',
    cost: 9999,
    damage: 9999,
    fireRate: 6,
    bulletSpeed: 10,
    adminOnly: true,
    pierceWalls: true,
    circle: true,
    color: '#ff0',
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
  gunList.style.maxHeight = '48vh';
  gunList.style.overflowY = 'auto';
  for (let i = 0; i < GUNS.length; i++) {
    const gun = GUNS[i];
    if (gun.adminOnly) continue;
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

// --- Admin Panel ---
let adminPanel;
function showAdminPanel() {
  if (!adminPanel) {
    adminPanel = document.createElement('div');
    adminPanel.id = 'admin-panel';
    adminPanel.style.position = 'fixed';
    adminPanel.style.top = '0';
    adminPanel.style.left = '0';
    adminPanel.style.width = '100vw';
    adminPanel.style.height = '100vh';
    adminPanel.style.background = 'rgba(7,11,19,0.98)';
    adminPanel.style.zIndex = '400';
    adminPanel.style.display = 'flex';
    adminPanel.style.flexDirection = 'column';
    adminPanel.style.alignItems = 'center';
    adminPanel.style.justifyContent = 'center';
    adminPanel.style.fontFamily = 'inherit';
    adminPanel.innerHTML = `
      <div style="background:rgba(10,20,40,0.96);border-radius:18px;padding:36px 24px;min-width:320px;box-shadow:0 8px 48px #0cf8;border:2px solid #e33;text-align:center;position:relative;">
        <h2 style="color:#e33;letter-spacing:0.12em;margin-bottom:0.2em;">ADMIN PANEL</h2>
        <div style="color:#fff;font-size:1.1em;margin-bottom:1.2em;">Credits: <span id='admin-credits-value'>${credits}</span></div>
        <input id="gift-amount" type="number" min="1" max="9999" placeholder="Amount" style="font-size:1.2em;padding:8px 12px;border-radius:6px;border:1.5px solid #0cf;margin-bottom:1em;width:120px;">
        <br>
        <button id="gift-btn" class="mission-btn" style="margin-bottom:1.5em;">Gift Credits</button>
        <br>
        <button id="admin-gun-btn" class="mission-btn" style="background:#ff0;color:#222;margin-bottom:1.5em;">Equip Admin Gun</button>
        <br>
        <button id="close-admin" class="mission-btn">Back</button>
      </div>
    `;
    document.body.appendChild(adminPanel);
    document.getElementById('close-admin').onclick = hideAdminPanel;
    document.getElementById('gift-btn').onclick = () => {
      const amt = parseInt(document.getElementById('gift-amount').value, 10);
      if (!isNaN(amt) && amt > 0) {
        credits += amt;
        saveProgress();
        document.getElementById('admin-credits-value').textContent = credits;
        const creditsVal = document.getElementById('credits-value');
        if (creditsVal) creditsVal.textContent = credits;
        updateGunList && updateGunList();
      }
    };
    document.getElementById('admin-gun-btn').onclick = () => {
      selectedGun = GUNS.length - 1; // Admin Gun is last
      saveProgress();
      hideAdminPanel();
    };
  }
  document.getElementById('admin-credits-value').textContent = credits;
  adminPanel.style.display = '';
}
function hideAdminPanel() {
  if (adminPanel) adminPanel.style.display = 'none';
}

// Add "Admin Panel" button to start screen
function addAdminButton() {}

// Show admin panel with '=' key
window.addEventListener('keydown', e => {
  if (e.key === '=') {
    showAdminPanel();
  }
});

// --- Update showStartScreen to add Armory and Admin buttons ---
const origShowStartScreen = showStartScreen;
showStartScreen = function() {
  origShowStartScreen();
  addArmoryButton();
  addAdminButton();
};

// --- Main Menu Button Logic for New UI ---
window.addEventListener('DOMContentLoaded', () => {
  // Main menu buttons
  const playBtn = document.getElementById('play-btn');
  const armoryBtn = document.getElementById('armory-btn');
  const upgradesBtn = document.getElementById('upgrades-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const missionModal = document.getElementById('mission-modal');
  const closeMissionModal = document.getElementById('close-mission-modal');
  const creditsValue = document.getElementById('main-credits-value');

  if (creditsValue) creditsValue.textContent = credits;

  if (playBtn) playBtn.onclick = () => {
    missionModal.removeAttribute('hidden');
  };
  if (closeMissionModal) closeMissionModal.onclick = () => {
    missionModal.setAttribute('hidden', '');
  };
  if (armoryBtn) armoryBtn.onclick = showLoadoutScreen;
  if (upgradesBtn) upgradesBtn.onclick = showUpgradesScreen;
  if (settingsBtn) settingsBtn.onclick = () => {
    alert('Settings coming soon!');
  };

  // Make sure pointer events are enabled for overlays
  document.getElementById('start-screen').style.pointerEvents = 'auto';
  if (missionModal) missionModal.style.pointerEvents = 'auto';
});

// Patch mission select to work in modal
function showStartScreen() {
  startScreen.removeAttribute('hidden');
  document.getElementById('ui').style.display = 'none';
  canvas.style.display = 'none';
  // Populate mission select (for modal)
  const missionSelect = document.getElementById('mission-select');
  const missionModal = document.getElementById('mission-modal');
  if (missionSelect) {
    missionSelect.innerHTML = '';
    // Add operation briefing above mission list
    if (missionModal && typeof operation === 'undefined') {
      let briefingDiv = document.getElementById('operation-briefing');
      if (!briefingDiv) {
        briefingDiv = document.createElement('div');
        briefingDiv.id = 'operation-briefing';
        briefingDiv.style.fontSize = '1.08em';
        briefingDiv.style.color = '#39ff14';
        briefingDiv.style.margin = '0 0 1.2em 0';
        briefingDiv.style.textAlign = 'center';
        missionModal.querySelector('.modal-content').insertBefore(briefingDiv, missionSelect);
      }
      briefingDiv.textContent = 'Select an operation to view its briefing.';
    }
    for (let i = 0; i < OPERATIONS.length; i++) {
      const op = OPERATIONS[i];
      const wrap = document.createElement('div');
      wrap.className = 'mission-entry';
      const codename = document.createElement('div');
      codename.className = 'mission-codename';
      codename.textContent = op.codename;
      const briefing = document.createElement('div');
      briefing.className = 'mission-briefing';
      briefing.textContent = op.briefing;
      const btn = document.createElement('button');
      btn.className = 'mission-btn';
      btn.textContent = 'BEGIN';
      btn.onclick = () => {
        document.getElementById('mission-modal').setAttribute('hidden', '');
        startMission(i);
      };
      wrap.appendChild(codename);
      wrap.appendChild(briefing);
      wrap.appendChild(btn);
      missionSelect.appendChild(wrap);
      // Show operation briefing above if selected
      wrap.onmouseenter = () => {
        const briefingDiv = document.getElementById('operation-briefing');
        if (briefingDiv) {
          briefingDiv.textContent = op.briefing;
        }
      };
      wrap.onmouseleave = () => {
        const briefingDiv = document.getElementById('operation-briefing');
        if (briefingDiv) {
          briefingDiv.textContent = 'Select an operation to view its briefing.';
        }
      };
    }
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

// --- Enemy Types ---
const ENEMY_TYPES = {
  grunt: {
    name: 'Grunt',
    color: '#e33',
    size: 28,
    speed: 1.2,
    hp: 1,
    fireRate: 90,
    bulletSpeed: 5.5,
    bulletColor: '#f33',
    label: '',
  },
  heavy: {
    name: 'Heavy',
    color: '#a50',
    size: 38,
    speed: 0.7,
    hp: 3,
    fireRate: 120,
    bulletSpeed: 4,
    bulletColor: '#fa0',
    label: 'HEAVY',
  },
  scout: {
    name: 'Scout',
    color: '#0cf',
    size: 18,
    speed: 2.2,
    hp: 0.5,
    fireRate: 9999,
    bulletSpeed: 0,
    bulletColor: '',
    label: 'SCOUT',
  },
  sniper: {
    name: 'Sniper',
    color: '#fff',
    size: 24,
    speed: 1.0,
    hp: 0.8,
    fireRate: 180,
    bulletSpeed: 10,
    bulletColor: '#fff',
    label: 'SNIPER',
  },
};
const ENEMY_TYPE_LIST = ['grunt', 'heavy', 'scout', 'sniper'];

function startLevel() {
  const levelObj = OPERATIONS[operation].levels[opLevel];
  walls = levelObj.walls.map(w => ({ ...w }));
  gridBlocked = buildGridBlocked(walls);
  // Player spawn
  let px, py;
  if (levelObj.playerSpawn) {
    px = levelObj.playerSpawn.x;
    py = levelObj.playerSpawn.y;
  } else {
    px = canvas.width / 2;
    py = canvas.height - 60;
  }
  let playerCell = posToCell(px, py);
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
  // Enemy spawns
  if (levelObj.enemySpawns && Array.isArray(levelObj.enemySpawns)) {
    for (let i = 0; i < levelObj.enemySpawns.length && i < levelObj.enemies; i++) {
      const spawn = levelObj.enemySpawns[i];
      let ex = spawn.x, ey = spawn.y;
      let cell = posToCell(ex, ey);
      let walkable = !gridBlocked[cell.row][cell.col];
      if (!walkable) {
        const nearest = findNearestWalkableCell(cell, gridBlocked);
        if (nearest) {
          ex = nearest.col * GRID_SIZE + GRID_SIZE / 2;
          ey = nearest.row * GRID_SIZE + GRID_SIZE / 2;
        }
      }
      // Choose type: more grunts, some heavies, scouts, snipers
      let type = 'grunt';
      if (i > 0 && Math.random() < 0.18) type = 'heavy';
      else if (i > 0 && Math.random() < 0.22) type = 'scout';
      else if (i > 1 && Math.random() < 0.15) type = 'sniper';
      enemies.push(new Enemy(ex, ey, type));
    }
    // If more enemies than spawns, fill with randoms
    for (let i = levelObj.enemySpawns.length; i < levelObj.enemies; i++) {
      let ex, ey, tries = 0;
      let cell, walkable;
      do {
        ex = Math.random() * (canvas.width - ENEMY_TYPES.grunt.size) + ENEMY_TYPES.grunt.size / 2;
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
      let type = 'grunt';
      if (i > 0 && Math.random() < 0.18) type = 'heavy';
      else if (i > 0 && Math.random() < 0.22) type = 'scout';
      else if (i > 1 && Math.random() < 0.15) type = 'sniper';
      enemies.push(new Enemy(ex, ey, type));
    }
  } else {
    // Old random spawn logic
    for (let i = 0; i < levelObj.enemies; i++) {
      let ex, ey, tries = 0;
      let cell, walkable;
      do {
        ex = Math.random() * (canvas.width - ENEMY_TYPES.grunt.size) + ENEMY_TYPES.grunt.size / 2;
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
      let type = 'grunt';
      if (i > 0 && Math.random() < 0.18) type = 'heavy';
      else if (i > 0 && Math.random() < 0.22) type = 'scout';
      else if (i > 1 && Math.random() < 0.15) type = 'sniper';
      enemies.push(new Enemy(ex, ey, type));
    }
  }
  updateUI();
  // Handler/Director message at start of level
  const op = OPERATIONS[operation];
  const handlerMsg = `<b>DIRECTOR:</b> Agent, you are entering <span style='color:#39ff14;'>${op.codename}</span>, Level ${opLevel+1}.<br>${op.briefing}<br>Stay sharp. Your mission begins now.`;
  showMessage(handlerMsg, true);
  setTimeout(() => showMessage('', false), 2600);
}

function nextLevel() {
  opLevel++;
  credits += 3;
  saveProgress();
  if (opLevel >= OPERATIONS[operation].levels.length) {
    showMessage('<b>DIRECTOR:</b> Mission accomplished, Agent!<br>Operation complete.<br>Final Score: ' + score + '<br>Credits earned: 3<br><button onclick="showStartScreen()">Mission Select</button>', true);
    gameActive = false;
    return;
  }
  showMessage('<b>DIRECTOR:</b> Well done, Agent. Level complete.<br>Credits earned: 3<br><button onclick="startLevel()">Next Level</button>', true);
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
    this.burstShots = 0;
    this.burstTimer = 0;
    this.burstAngle = 0;
    this.burstTarget = { x: 0, y: 0 };
  }
  move(dx, dy) {
    let nx = this.x + dx;
    let ny = this.y + dy;
    nx = Math.max(this.size / 2, Math.min(canvas.width - this.size / 2, nx));
    ny = Math.max(this.size / 2, Math.min(canvas.height - this.size / 2, ny));
    if (!collidesWithWalls({ x: nx, y: ny, size: this.size })) {
      this.x = nx;
      this.y = ny;
    }
  }
  shoot(targetX, targetY) {
    const gun = GUNS[selectedGun];
    if (this.cooldown > 0) return;
    const angle = Math.atan2(targetY - this.y, targetX - this.x);
    // Admin Gun
    if (gun.adminOnly) {
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        bullets.push(new Bullet(
          this.x, this.y,
          Math.cos(a) * gun.bulletSpeed,
          Math.sin(a) * gun.bulletSpeed,
          'player', gun.damage, gun.color, 0, true // pierceWalls
        ));
      }
      this.cooldown = gun.fireRate;
      return;
    }
    // Burst Pistol
    if (gun.name === 'Burst Pistol') {
      this.burstShots = gun.burstCount;
      this.burstTimer = 0;
      this.burstAngle = angle;
      this.burstTarget = { x: targetX, y: targetY };
      this.cooldown = gun.fireRate;
      this.fireBurstShot();
      return;
    }
    // Laser (fast, piercing projectile with trail)
    if (gun.name === 'Laser') {
      const vx = Math.cos(angle) * gun.bulletSpeed;
      const vy = Math.sin(angle) * gun.bulletSpeed;
      const laserBullet = new Bullet(
        this.x, this.y, vx, vy, 'player', gun.damage, gun.color, 0, false, true, true // pierceEnemies, isLaser
      );
      bullets.push(laserBullet);
      // Add a laser trail
      addLaserTrail(this.x, this.y, this.x + vx * 40, this.y + vy * 40, gun.color);
      this.cooldown = gun.fireRate;
      return;
    }
    // Auto Shotgun
    if (gun.name === 'Auto Shotgun') {
      for (let i = 0; i < gun.pellets; i++) {
        const spread = (Math.random() - 0.5) * 0.5 * gun.spread;
        bullets.push(new Bullet(
          this.x, this.y,
          Math.cos(angle + spread) * gun.bulletSpeed,
          Math.sin(angle + spread) * gun.bulletSpeed,
          'player', gun.damage, gun.color
        ));
      }
      this.cooldown = gun.fireRate;
      return;
    }
    // Rocket Launcher
    if (gun.name === 'Rocket Launcher') {
      const vx = Math.cos(angle) * gun.bulletSpeed;
      const vy = Math.sin(angle) * gun.bulletSpeed;
      bullets.push(new Bullet(
        this.x, this.y, vx, vy, 'player', gun.damage, gun.color, 0, false, false, false, true, gun.explosionRadius
      ));
      this.cooldown = gun.fireRate;
      return;
    }
    // Pulse Rifle
    if (gun.name === 'Pulse Rifle') {
      bullets.push(new Bullet(
        this.x, this.y,
        Math.cos(angle) * gun.bulletSpeed,
        Math.sin(angle) * gun.bulletSpeed,
        'player', gun.damage, gun.color, 0, false, false, false, false, 0, gun.stunDuration
      ));
      this.cooldown = gun.fireRate;
      return;
    }
    // Heavy Revolver
    if (gun.name === 'Heavy Revolver') {
      bullets.push(new Bullet(
        this.x, this.y,
        Math.cos(angle) * gun.bulletSpeed,
        Math.sin(angle) * gun.bulletSpeed,
        'player', gun.damage, gun.color, gun.knockback
      ));
      this.cooldown = gun.fireRate;
      return;
    }
    // Shotgun
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
      this.cooldown = gun.fireRate;
      return;
    }
    // SMG
    if (gun.name === 'SMG') {
      const spread = (Math.random() - 0.5) * gun.spread;
      bullets.push(new Bullet(
        this.x, this.y,
        Math.cos(angle + spread) * gun.bulletSpeed,
        Math.sin(angle + spread) * gun.bulletSpeed,
        'player', gun.damage, gun.color
      ));
      this.cooldown = gun.fireRate;
      return;
    }
    // Flamethrower
    if (gun.name === 'Flamethrower') {
      // Flamethrower handled in game loop
      return;
    }
    // Railgun
    if (gun.name === 'Railgun') {
      const vx = Math.cos(angle) * gun.bulletSpeed;
      const vy = Math.sin(angle) * gun.bulletSpeed;
      const railBullet = new Bullet(
        this.x, this.y, vx, vy, 'player', gun.damage, gun.color, 0, false, true, true, false, 0, 0, false, 0, 0, true
      );
      bullets.push(railBullet);
      addLaserTrail(this.x, this.y, this.x + vx * 60, this.y + vy * 60, gun.color);
      this.cooldown = gun.fireRate;
      return;
    }
    // Default (Pistol, Sniper, etc.)
    bullets.push(new Bullet(
      this.x, this.y,
      Math.cos(angle) * gun.bulletSpeed,
      Math.sin(angle) * gun.bulletSpeed,
      'player', gun.damage, gun.color
    ));
    this.cooldown = gun.fireRate;
  }
  fireBurstShot() {
    const gun = GUNS[selectedGun];
    if (gun.name !== 'Burst Pistol' || this.burstShots <= 0) return;
    bullets.push(new Bullet(
      this.x, this.y,
      Math.cos(this.burstAngle) * gun.bulletSpeed,
      Math.sin(this.burstAngle) * gun.bulletSpeed,
      'player', gun.damage, gun.color
    ));
    this.burstShots--;
    if (this.burstShots > 0) {
      setTimeout(() => this.fireBurstShot(), gun.burstDelay * 16.67); // ~frames to ms
    }
  }
  update() {
    if (this.cooldown > 0) this.cooldown--;
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    // Glow/outline
    ctx.shadowColor = '#39ff14';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#222';
    ctx.fill();
    ctx.shadowBlur = 0;
    // Main body
    ctx.beginPath();
    ctx.arc(0, 0, this.size / 2 - 2, 0, Math.PI * 2);
    ctx.fillStyle = '#39ff14';
    ctx.fill();
    // Visor
    ctx.beginPath();
    ctx.arc(0, 0, this.size / 4, Math.PI * 0.15, Math.PI * 0.85);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.restore();
  }
}

class Enemy {
  constructor(x, y, type = 'grunt') {
    this.x = x;
    this.y = y;
    this.type = type;
    const t = ENEMY_TYPES[type];
    this.size = t.size;
    this.color = t.color;
    this.speed = t.speed;
    this.hp = t.hp;
    this.maxHp = t.hp;
    this.cooldown = Math.random() * t.fireRate + 30;
    this.fireRate = t.fireRate;
    this.bulletSpeed = t.bulletSpeed;
    this.bulletColor = t.bulletColor;
    this.label = t.label;
    this.aimTimer = 0;
  }
  update() {
    if (this.stun && this.stun > 0) {
      this.stun--;
      return;
    }
    // Scout: rush player, no shooting
    if (this.type === 'scout') {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 10) {
        const mx = (dx / dist) * this.speed;
        const my = (dy / dist) * this.speed;
        let nx = this.x + mx;
        let ny = this.y + my;
        if (!collidesWithWalls({ x: nx, y: ny, size: this.size })) {
          this.x = nx;
          this.y = ny;
        }
      }
      return;
    }
    // Sniper: keep distance, aim, shoot
    if (this.type === 'sniper') {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy);
      // Keep distance (200-350px)
      if (dist < 200) {
        const mx = -(dx / dist) * this.speed;
        const my = -(dy / dist) * this.speed;
        let nx = this.x + mx;
        let ny = this.y + my;
        if (!collidesWithWalls({ x: nx, y: ny, size: this.size })) {
          this.x = nx;
          this.y = ny;
        }
      } else if (dist > 350) {
        const mx = (dx / dist) * this.speed;
        const my = (dy / dist) * this.speed;
        let nx = this.x + mx;
        let ny = this.y + my;
        if (!collidesWithWalls({ x: nx, y: ny, size: this.size })) {
          this.x = nx;
          this.y = ny;
        }
      }
      // Aim, then shoot
      if (this.cooldown <= 0 && dist < 600) {
        this.aimTimer++;
        if (this.aimTimer > 30) {
          const angle = Math.atan2(dy, dx);
          // Use laser bullet logic
          const vx = Math.cos(angle) * ENEMY_TYPES.sniper.bulletSpeed;
          const vy = Math.sin(angle) * ENEMY_TYPES.sniper.bulletSpeed;
          const laserBullet = new Bullet(
            this.x, this.y, vx, vy, 'enemy', 1.5, '#fff', 0, false, true, true // pierceEnemies, isLaser
          );
          bullets.push(laserBullet);
          addLaserTrail(this.x, this.y, this.x + vx * 40, this.y + vy * 40, '#fff');
          this.cooldown = this.fireRate + Math.random() * 40;
          this.aimTimer = 0;
        }
      } else {
        this.cooldown--;
        this.aimTimer = 0;
      }
      return;
    }
    // Heavy/Grunt: move toward player, shoot
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 60) {
      const mx = (dx / dist) * this.speed;
      const my = (dy / dist) * this.speed;
      let nx = this.x + mx;
      let ny = this.y + my;
      if (!collidesWithWalls({ x: nx, y: ny, size: this.size })) {
        this.x = nx;
        this.y = ny;
      }
    }
    if (this.cooldown <= 0 && dist < 400) {
      const angle = Math.atan2(dy, dx);
      bullets.push(new Bullet(this.x, this.y, Math.cos(angle) * this.bulletSpeed, Math.sin(angle) * this.bulletSpeed, 'enemy', this.type === 'heavy' ? 2 : 1, this.bulletColor));
      this.cooldown = this.fireRate + Math.random() * 40;
    } else {
      this.cooldown--;
    }
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    // Burn effect
    if (this.burn && this.burn > 0) {
      ctx.shadowColor = '#ff9100';
      ctx.shadowBlur = 24;
      ctx.globalAlpha = 0.7;
      this.burn--;
    }
    // --- Visuals by type ---
    if (this.type === 'grunt') {
      // Red circle with a "visor"
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowColor = '#f33';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
      // Visor
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 3, Math.PI * 0.15, Math.PI * 0.85);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    } else if (this.type === 'heavy') {
      // Large orange circle with thick border and shield ring
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2 + 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#fa0';
      ctx.lineWidth = 7;
      ctx.globalAlpha = 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowColor = '#fa0';
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.shadowBlur = 0;
      // Core
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 3, 0, Math.PI * 2);
      ctx.fillStyle = '#fff2';
      ctx.fill();
    } else if (this.type === 'scout') {
      // Cyan triangle
      ctx.save();
      ctx.rotate(Math.atan2(player.y - this.y, player.x - this.x));
      ctx.beginPath();
      ctx.moveTo(0, -this.size / 2);
      ctx.lineTo(this.size / 2, this.size / 2);
      ctx.lineTo(-this.size / 2, this.size / 2);
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.shadowColor = '#0cf';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    } else if (this.type === 'sniper') {
      // White circle with scope cross
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
      // Scope cross
      ctx.strokeStyle = '#39ff14';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-this.size / 4, 0); ctx.lineTo(this.size / 4, 0);
      ctx.moveTo(0, -this.size / 4); ctx.lineTo(0, this.size / 4);
      ctx.stroke();
    }
    // Draw type label
    if (this.label) {
      ctx.font = 'bold 12px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.85;
      ctx.fillText(this.label, 0, -this.size / 2 - 2);
      ctx.globalAlpha = 1;
    }
    // Draw health bar for heavy
    if (this.type === 'heavy') {
      ctx.fillStyle = '#222';
      ctx.fillRect(-16, this.size / 2 + 4, 32, 5);
      ctx.fillStyle = '#fa0';
      ctx.fillRect(-16, this.size / 2 + 4, 32 * (this.hp / this.maxHp), 5);
    }
    ctx.restore();
  }
}

class Bullet {
  constructor(x, y, vx, vy, owner, damage = 1, color = null, knockback = 0, pierceWalls = false, pierceEnemies = false, isLaser = false, isRocket = false, explosionRadius = 0, stunDuration = 0, isFlame = false, flameRange = 0, dot = 0, isRail = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = isLaser ? 7 : (isRocket ? 16 : (isFlame ? 10 : (isRail ? 10 : BULLET_SIZE)));
    this.owner = owner; // 'player' or 'enemy'
    this.color = color || (owner === 'player' ? '#0cf' : '#f33');
    this.damage = damage;
    this.knockback = knockback || 0;
    this.pierceWalls = pierceWalls;
    this.pierceEnemies = pierceEnemies;
    this.isLaser = isLaser;
    this.isRocket = isRocket;
    this.explosionRadius = explosionRadius;
    this.stunDuration = stunDuration;
    this.isFlame = isFlame;
    this.flameRange = flameRange;
    this.dot = dot;
    this.isRail = isRail;
    this.hitEnemies = new Set();
    this.life = 0;
  }
  update() {
    this.life++;
    let nx = this.x + this.vx;
    let ny = this.y + this.vy;
    if (this.isFlame && this.life > 6) {
      this.dead = true;
      return;
    }
    if (this.isFlame && dist({ x: this.x, y: this.y }, player) > this.flameRange) {
      this.dead = true;
      return;
    }
    if (this.pierceWalls || !collidesWithWalls({ x: nx, y: ny, size: this.size })) {
      this.x = nx;
      this.y = ny;
    } else {
      this.x = nx;
      this.y = ny;
      this.dead = true;
      if (this.isRocket) {
        explodeAt(this.x, this.y, this.explosionRadius, this.damage, this.owner, this.color);
      }
    }
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.isFlame) {
      // Flame: orange, flicker, short
      ctx.globalAlpha = 0.7 + 0.3 * Math.sin(this.life * 2 + this.x);
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    } else if (this.isRail) {
      // Railgun: purple, glowing, with a long trail
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-this.vx * 12, -this.vy * 12);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (this.isRocket) {
      // Rocket: big, red/orange, with a flame
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.shadowBlur = 0;
      // Flame
      ctx.save();
      ctx.rotate(Math.atan2(this.vy, this.vx));
      ctx.beginPath();
      ctx.moveTo(-this.size / 2, 0);
      ctx.lineTo(-this.size / 2 - 8, -4);
      ctx.lineTo(-this.size / 2 - 8, 4);
      ctx.closePath();
      ctx.fillStyle = '#ff0';
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.restore();
    } else if (this.stunDuration > 0) {
      // Pulse: cyan, glowing, with a ring
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2 + 4, 0, Math.PI * 2);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (this.isLaser) {
      // Laser: thin, white, glowing, with a trail
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (this.owner === 'player') {
      // Player bullet: green, glow, tracer
      ctx.shadowColor = '#39ff14';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2 + 1, 0, Math.PI * 2);
      ctx.fillStyle = '#39ff14';
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2 - 1, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(-this.vx * 2, -this.vy * 2, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#39ff14';
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (this.color === '#fa0') {
      // Heavy: big, orange, core/glow
      ctx.shadowColor = '#fa0';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2 + 2, 0, Math.PI * 2);
      ctx.fillStyle = '#fa0';
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2 - 1, 0, Math.PI * 2);
      ctx.fillStyle = '#fff2';
      ctx.fill();
    } else if (this.color === '#fff') {
      // Sniper: thin, white, trail
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-this.vx * 4, -this.vy * 4);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (this.color === '#0cf') {
      // Scout: small, cyan
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#0cf';
      ctx.shadowColor = '#0cf';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // Default enemy bullet
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = this.color || '#f33';
      ctx.shadowColor = this.color || '#f33';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }
}

// --- Input ---
const keys = {};
window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
let flamethrowerActive = false;
let flamethrowerAngle = 0;

canvas.addEventListener('mousedown', e => {
  if (!gameActive) return;
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);
  const gun = GUNS[selectedGun];
  if (gun && gun.name === 'Flamethrower') {
    flamethrowerActive = true;
    flamethrowerAngle = Math.atan2(my - player.y, mx - player.x);
  } else {
    player.shoot(mx, my);
  }
});
canvas.addEventListener('mouseup', e => {
  flamethrowerActive = false;
});
canvas.addEventListener('mouseleave', () => { mouseOverCanvas = false; flamethrowerActive = false; });

// --- Aiming Indicator ---
let mouseX = null, mouseY = null, mouseOverCanvas = false;
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
  mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
  mouseOverCanvas = true;
});
canvas.addEventListener('mouseleave', () => { mouseOverCanvas = false; });

// --- Laser Trail Visuals ---
let laserTrails = [];
function addLaserTrail(x0, y0, x1, y1, color) {
  laserTrails.push({ x0, y0, x1, y1, color, time: 0 });
}
function drawLaserTrails(ctx) {
  for (let i = laserTrails.length - 1; i >= 0; i--) {
    const t = laserTrails[i];
    ctx.save();
    ctx.strokeStyle = t.color;
    ctx.globalAlpha = 0.5 * (1 - t.time / 16);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(t.x0, t.y0);
    ctx.lineTo(t.x1, t.y1);
    ctx.stroke();
    ctx.restore();
    t.time++;
    if (t.time > 16) laserTrails.splice(i, 1);
  }
}

// --- Main Loop ---
function gameLoop(ts) {
  if (!startScreen.hasAttribute('hidden')) {
    requestAnimationFrame(gameLoop);
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.fillStyle = '#888';
  for (const w of walls) {
    ctx.fillRect(w.x, w.y, w.w, w.h);
  }
  ctx.restore();
  // Draw laser trails
  drawLaserTrails(ctx);

  // --- Flamethrower logic ---
  if (gameActive && GUNS[selectedGun].name === 'Flamethrower' && flamethrowerActive && timeMoving) {
    flamethrowerAngle = Math.atan2(mouseY - player.y, mouseX - player.x);
    // Visual: draw cone of flames
    const flameRange = 140;
    drawFlamethrowerCone(player.x, player.y, flamethrowerAngle, flameRange, GUNS[selectedGun].cone, ts);
    // Damage enemies in cone
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (enemyInFlameCone(player.x, player.y, flamethrowerAngle, flameRange, GUNS[selectedGun].cone, e)) {
        // Only apply if not blocked by wall
        if (!lineBlockedByWall(player.x, player.y, e.x, e.y, walls)) {
          e.hp -= GUNS[selectedGun].damage * 1.1; // Lower DPS
          e.burn = 6; // frames of burn effect
          // Knockback: push enemy away from player
          const dx = e.x - player.x;
          const dy = e.y - player.y;
          const dist = Math.hypot(dx, dy) || 1;
          const knockback = 2.2; // pixels per frame
          e.x += (dx / dist) * knockback;
          e.y += (dy / dist) * knockback;
          if (e.hp <= 0) {
            enemies.splice(i, 1);
            score += 100;
            updateUI();
          }
        }
      }
    }
  }

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
      for (const enemy of enemies) enemy.update();
      for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        if (bullets[i].dead) bullets.splice(i, 1);
      }
    }
    player.update();

    // --- Collision detection ---
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (b.x < -20 || b.x > canvas.width + 20 || b.y < -20 || b.y > canvas.height + 20) {
        if (b.isRocket) explodeAt(b.x, b.y, b.explosionRadius, b.damage, b.owner, b.color);
        bullets.splice(i, 1);
        continue;
      }
      if (b.owner === 'enemy' && dist(b, player) < (PLAYER_SIZE + BULLET_SIZE) / 2) {
        bullets.splice(i, 1);
        if (player.shield) {
          player.shield = false;
        } else {
          health -= b.damage || 1;
        }
        if (b.knockback && b.knockback > 0) {
          const dx = player.x - b.x;
          const dy = player.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d > 0) {
            player.x += (dx / d) * b.knockback;
            player.y += (dy / d) * b.knockback;
          }
        }
        updateUI();
        if (health <= 0) {
          showMessage('<b>DIRECTOR:</b> Agent down. You have been neutralized.<br>Score: ' + score + '<br><button onclick="resetGame()">Restart</button>', true);
          gameActive = false;
        }
        continue;
      }
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (b.owner === 'player' && dist(b, e) < (e.size + BULLET_SIZE) / 2) {
          if (b.pierceEnemies) {
            if (b.hitEnemies.has(e)) continue;
            b.hitEnemies.add(e);
          }
          if (b.stunDuration > 0) {
            e.stun = b.stunDuration;
          }
          // Flamethrower: damage over time
          if (b.isFlame && b.dot > 0) {
            e.hp = (e.hp || 1) - b.damage * b.dot;
          } else {
            e.hp = (e.hp || 1) - (b.damage || 1);
          }
          if (b.knockback && b.knockback > 0) {
            const dx = e.x - b.x;
            const dy = e.y - b.y;
            const d = Math.hypot(dx, dy);
            if (d > 0) {
              e.x += (dx / d) * b.knockback;
              e.y += (dy / d) * b.knockback;
            }
          }
          if (b.isRocket) explodeAt(b.x, b.y, b.explosionRadius, b.damage, b.owner, b.color);
          if (!b.pierceEnemies && !b.isRocket) bullets.splice(i, 1);
          if (e.hp <= 0) {
            enemies.splice(j, 1);
            score += 100;
            updateUI();
          }
          if (b.pierceEnemies) break;
          else break;
        }
      }
    }
    // Enemy collision with player
    for (const e of enemies) {
      if (dist(e, player) < (PLAYER_SIZE + ENEMY_SIZE) / 2) {
        health = 0;
        updateUI();
        showMessage('<b>DIRECTOR:</b> Agent down. You have been neutralized.<br>Score: ' + score + '<br><button onclick="resetGame()">Restart</button>', true);
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
  // --- Draw aiming indicator ---
  if (gameActive && mouseOverCanvas && mouseX !== null && mouseY !== null) {
    drawCrosshair(mouseX, mouseY);
  }
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

function drawCrosshair(x, y) {
  ctx.save();
  ctx.strokeStyle = '#0cf';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.85;
  // Outer circle
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.stroke();
  // Cross lines
  ctx.beginPath();
  ctx.moveTo(x - 24, y); ctx.lineTo(x - 8, y);
  ctx.moveTo(x + 8, y); ctx.lineTo(x + 24, y);
  ctx.moveTo(x, y - 24); ctx.lineTo(x, y - 8);
  ctx.moveTo(x, y + 8); ctx.lineTo(x, y + 24);
  ctx.stroke();
  // Center dot
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#0cf';
  ctx.globalAlpha = 1;
  ctx.fill();
  ctx.restore();
}

function explodeAt(x, y, radius, damage, owner, color) {
  // Draw explosion
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 32;
  ctx.fill();
  ctx.restore();
  // Damage enemies in radius
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (dist({ x, y }, e) < radius + e.size / 2) {
      e.hp = (e.hp || 1) - damage;
      if (e.hp <= 0) {
        enemies.splice(i, 1);
        score += 100;
        updateUI();
      }
    }
  }
}

function drawFlamethrowerCone(x, y, angle, range, cone, ts) {
  // Draw main cone sector, but clip at walls
  ctx.save();
  ctx.globalAlpha = 0.22 + 0.08 * Math.sin(ts * 0.12);
  const rays = 36;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i <= rays; i++) {
    const a = angle - cone / 2 + (cone * i) / rays;
    let r = range;
    // Raycast to wall
    for (let d = 8; d <= range; d += 8) {
      const px = x + Math.cos(a) * d;
      const py = y + Math.sin(a) * d;
      let blocked = false;
      for (const w of walls) {
        if (px >= w.x && px <= w.x + w.w && py >= w.y && py <= w.y + w.h) {
          r = d - 8;
          blocked = true;
          break;
        }
      }
      if (blocked) break;
    }
    const ex = x + Math.cos(a) * r;
    const ey = y + Math.sin(a) * r;
    ctx.lineTo(ex, ey);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,180,0,0.45)';
  ctx.shadowColor = '#ff9100';
  ctx.shadowBlur = 32;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  // Overlay animated flame flickers, but only if not blocked by wall
  for (let i = 0; i < 10; i++) {
    const a = angle + (Math.random() - 0.5) * cone * 1.1;
    const r = range * (0.7 + Math.random() * 0.3);
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (!lineBlockedByWall(x, y, px, py, walls)) {
      ctx.save();
      ctx.globalAlpha = 0.18 + 0.18 * Math.random();
      ctx.beginPath();
      ctx.arc(px, py, 18 + Math.random() * 10, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,${180 + Math.floor(Math.random()*60)},0,1)`;
      ctx.shadowColor = '#ff9100';
      ctx.shadowBlur = 24;
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}
function enemyInFlameCone(x, y, angle, range, cone, enemy) {
  const dx = enemy.x - x;
  const dy = enemy.y - y;
  const distToEnemy = Math.hypot(dx, dy);
  if (distToEnemy > range + enemy.size / 2) return false;
  const angToEnemy = Math.atan2(dy, dx);
  let da = Math.abs(angToEnemy - angle);
  da = Math.min(da, Math.abs(da - 2 * Math.PI));
  return da < cone / 2;
}

// Add a helper for line-of-sight check
function lineBlockedByWall(x0, y0, x1, y1, walls) {
  // Step along the line and check for wall collision
  const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 6);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    for (const w of walls) {
      if (x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h) {
        return true;
      }
    }
  }
  return false;
}

// --- Start Game ---
showStartScreen();
gameLoop(); 