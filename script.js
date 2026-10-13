
"use strict";

const SAVE_KEY = "monsterArenaEvolution_v4";
const MAX_TEAM = 6;
const $ = id => document.getElementById(id);
const rand = n => Math.floor(Math.random() * n);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const ELEMENTS = {
  fire: "Fuego",
  water: "Agua",
  plant: "Planta",
  lightning: "Rayo",
  ice: "Hielo",
  earth: "Tierra",
  light: "Luz",
  shadow: "Sombra"
};

// Ventajas elementales: el atacante causa un 50% más de daño.
const ADVANTAGES = {
  fire: ["plant", "ice"],
  water: ["fire", "earth"],
  plant: ["water", "earth"],
  lightning: ["water", "shadow"],
  ice: ["plant", "earth"],
  earth: ["lightning", "fire"],
  light: ["shadow"],
  shadow: ["light"]
};

// Catálogo de monstruos disponibles.
const SPECIES = [
  ["Pyron", "🔥", "fire", 100, 20],
  ["Aquaris", "🌊", "water", 110, 18],
  ["Florantis", "🌿", "plant", 105, 19],
  ["Voltix", "⚡", "lightning", 85, 24],
  ["Glacius", "❄️", "ice", 95, 22],
  ["Terron", "🪨", "earth", 135, 17],
  ["Lumina", "✨", "light", 100, 21],
  ["Umbra", "🌑", "shadow", 105, 23],
  ["Slime", "🟢", "water", 75, 12],
  ["Goblin", "👺", "earth", 90, 16],
  ["Lobo", "🐺", "ice", 95, 19],
  ["Araña", "🕷️", "shadow", 85, 20],
  ["Troll", "👹", "earth", 150, 21],
  ["Fantasma", "👻", "shadow", 90, 23],
  ["Dragón Rojo", "🐉", "fire", 150, 28],
  ["Serpiente", "🐍", "plant", 100, 20],
  ["Fénix", "🦅", "fire", 125, 27],
  ["Kraken", "🐙", "water", 165, 25],
  ["Gólem", "🗿", "earth", 190, 22],
  ["Hada", "🧚", "light", 80, 25],
  ["Murciélago", "🦇", "shadow", 90, 20],
  ["Tigre", "🐅", "fire", 115, 27],
  ["Pingüino", "🐧", "ice", 100, 19],
  ["Cocodrilo", "🐊", "water", 135, 23],
  ["Escorpión", "🦂", "earth", 110, 25],
  ["Unicornio", "🦄", "light", 120, 26],
  ["Medusa", "🐙", "shadow", 105, 28],
  ["Fénix Azul", "🪽", "ice", 130, 29],
  ["Leviatán", "🐋", "water", 180, 30],
  ["Rey Demonio", "😈", "shadow", 175, 32],
  ["Dragón Celestial", "🐲", "light", 190, 34],
  ["Coloso Ígneo", "🌋", "fire", 210, 31],
  ["Reina de Hielo", "👸", "ice", 165, 33],
  ["Serafín", "😇", "light", 155, 35],
  ["Hidra", "🐲", "plant", 200, 32],
  ["Titán Oscuro", "👿", "shadow", 230, 37]
];

function createMonster(species, level = 1) {
  const [name, emoji, element, hp, attack] = species;
  const maxHp = Math.round(hp + (level - 1) * 12);

  return {
    uid: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name,
    emoji,
    element,
    level,
    xp: 0,
    maxHp,
    hp: maxHp,
    attack: Math.round(attack + (level - 1) * 3),
    energy: 100,
    maxEnergy: 100
  };
}

function newPlayer() {
  return {
    level: 1,
    xp: 0,
    gold: 0,
    wins: 0,
    potions: 3
  };
}

let player = newPlayer();
let team = [createMonster(SPECIES[0])];
let activeIndex = 0;
let enemy = null;
let busy = false;
let gameOver = false;

// Guardado
function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      player,
      team,
      activeIndex
    }));
  } catch (error) {
    console.warn("No se pudo guardar el progreso.", error);
  }
}

function loadGame() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (!data || !data.player || !Array.isArray(data.team)) return;

    player = { ...newPlayer(), ...data.player };

    team = data.team
      .filter(m => m && typeof m.name === "string")
      .slice(0, MAX_TEAM)
      .map(m => {
        const maxHp = Math.max(1, Number(m.maxHp) || 100);
        return {
          ...m,
          level: Math.max(1, Number(m.level) || 1),
          maxHp,
          hp: clamp(Number(m.hp) || 0, 0, maxHp),
          attack: Math.max(1, Number(m.attack) || 10),
          energy: clamp(Number(m.energy) || 0, 0, 100),
          maxEnergy: 100,
          xp: Math.max(0, Number(m.xp) || 0)
        };
      });

    if (!team.length) team = [createMonster(SPECIES[0])];

    player.level = Math.max(1, Number(player.level) || 1);
    player.gold = Math.max(0, Number(player.gold) || 0);
    player.wins = Math.max(0, Number(player.wins) || 0);
    player.potions = Math.max(0, Number(player.potions) || 0);
    player.xp = Math.max(0, Number(player.xp) || 0);

    activeIndex = clamp(
      Number(data.activeIndex) || 0, 0, team.length - 1
    );

    if (team.every(m => m.hp <= 0)) {
      team.forEach(m => {
        m.hp = Math.max(1, Math.ceil(m.maxHp * 0.35));
        m.energy = 100;
      });
    }

    if (team[activeIndex].hp <= 0) {
      activeIndex = team.findIndex(m => m.hp > 0);
    }
  } catch (error) {
    console.warn("Se iniciará una partida nueva.", error);
    player = newPlayer();
    team = [createMonster(SPECIES[0])];
    activeIndex = 0;
  }
}

function activeMonster() {
  return team[activeIndex];
}

// Registro de batalla
function log(message, type = "info") {
  const entry = document.createElement("div");
  entry.className = `log-entry ${type}`;
  entry.textContent = message;
  $("battleLog").prepend(entry);

  while ($("battleLog").children.length > 40) {
    $("battleLog").lastElementChild.remove();
  }
}

// Crear enemigo con dificultad progresiva
function createEnemy() {
  busy = false;
  gameOver = false;

  const isBoss = player.wins > 0 && player.wins % 10 === 0;
  const level = Math.max(
    1,
    player.level + Math.floor(player.wins / 3)
  );

  let species;

  if (isBoss) {
    const bosses = SPECIES.slice(29);
    species = bosses[rand(bosses.length)];
  } else {
    const pool = SPECIES.slice(
      8,
      Math.min(SPECIES.length, 17 + Math.floor(player.wins / 2))
    );
    species = pool[rand(pool.length)];
  }

  enemy = createMonster(species, level);

  if (isBoss) {
    enemy.name = "JEFE: " + enemy.name;
    enemy.maxHp = Math.round(enemy.maxHp * 1.8);
    enemy.hp = enemy.maxHp;
    enemy.attack = Math.round(enemy.attack * 1.3);
    enemy.isBoss = true;
  } else {
    enemy.isBoss = false;
  }

  $("battleStatus").textContent = isBoss
    ? "⚠ JEFE DE LA ARENA"
    : "COMBATE ACTIVO";

  $("weather").textContent = isBoss
    ? "☠ Desafío legendario"
    : "✦ Arena salvaje";

  if (isBoss) log("¡Un jefe legendario aparece en la arena!", "rare");

  update();
}

// Actualizar interfaz
function update() {
  const hero = activeMonster();

  $("playerLevel").textContent = player.level;
  $("playerXP").textContent = `${player.xp} / 100 XP`;
  $("playerXPBar").style.width = `${player.xp}%`;
  $("gold").textContent = player.gold;
  $("wins").textContent = player.wins;
  $("potions").textContent = player.potions;
  $("collectionCount").textContent = team.length;
  $("teamCount").textContent = `${team.length} / ${MAX_TEAM}`;
  $("round").textContent = player.wins + 1;

  $("heroSprite").textContent = hero.emoji;
  $("heroName").textContent = hero.name;
  $("heroLevel").textContent = hero.level;
  $("heroHPText").textContent = `${hero.hp} / ${hero.maxHp}`;
  $("heroHPBar").style.width = `${hero.hp / hero.maxHp * 100}%`;
  $("heroHPBar").classList.toggle("low", hero.hp / hero.maxHp < 0.3);
  $("heroAttack").textContent = hero.attack;
  $("heroEnergy").textContent = hero.energy;
  $("heroStatus").textContent = hero.hp <= 0
    ? "Debilitado"
    : "Listo para luchar";

  setElementTag("heroElement", hero.element);

  $("skillName").textContent = `Poder de ${ELEMENTS[hero.element]}`;

  if (enemy) {
    $("enemySprite").textContent = enemy.emoji;
    $("enemyName").textContent = enemy.name;
    $("enemyLevel").textContent = enemy.level;
    $("enemyHPText").textContent = `${enemy.hp} / ${enemy.maxHp}`;
    $("enemyHPBar").style.width = `${enemy.hp / enemy.maxHp * 100}%`;
    $("enemyHPBar").classList.toggle("low", enemy.hp / enemy.maxHp < 0.3);
    $("enemyAttack").textContent = enemy.attack;
    $("enemyThreat").textContent = enemy.isBoss ? "JEFE" : "NORMAL";
    $("enemyStatus").textContent = enemy.hp / enemy.maxHp < 0.25
      ? "Muy debilitado"
      : "Esperando tu movimiento";

    setElementTag("enemyElement", enemy.element);
  }

  renderTeam();

  const disabled = busy || gameOver || hero.hp <= 0;

  $("attackBtn").disabled = disabled;
  $("skillBtn").disabled = disabled || hero.energy < 25;
  $("healBtn").disabled = disabled || hero.hp >= hero.maxHp;
  $("captureBtn").disabled = disabled || team.length >= MAX_TEAM;
  $("escapeBtn").disabled = disabled;

  $("potionBtn").disabled =
    busy || gameOver || player.potions <= 0 ||
    hero.hp >= hero.maxHp;

  saveGame();
}

function setElementTag(id, element) {
  const tag = $(id);
  tag.className = `element-tag ${element}`;
  tag.textContent = ELEMENTS[element] || element;
}

function renderTeam() {
  const list = $("teamList");
  list.replaceChildren();

  team.forEach((monster, index) => {
    const button = document.createElement("button");
    button.className = "team-card";

    if (index === activeIndex) button.classList.add("active");
    if (monster.hp <= 0) button.classList.add("fainted");

    button.disabled = gameOver || index === activeIndex ||
      (busy && activeMonster().hp > 0);

    const emoji = document.createElement("span");
    emoji.className = "team-emoji";
    emoji.textContent = monster.emoji;

    const info = document.createElement("span");
    info.className = "team-info";

    const name = document.createElement("span");
    name.className = "team-name";
    name.textContent = monster.name;

    const meta = document.createElement("span");
    meta.className = "team-meta";
    meta.textContent = `Nv. ${monster.level} · ${monster.hp}/${monster.maxHp} HP`;

    const miniBar = document.createElement("div");
    miniBar.className = "mini-hp";

    const fill = document.createElement("div");
    fill.style.width = `${monster.hp / monster.maxHp * 100}%`;

    miniBar.appendChild(fill);
    info.append(name, meta, miniBar);
    button.append(emoji, info);

    button.addEventListener("click", () => switchMonster(index));
    list.appendChild(button);
  });
}

// CAMBIO DE MONSTRUO DURANTE EL COMBATE
function switchMonster(index) {
  if (index === activeIndex || index < 0 || index >= team.length) return;
  if (gameOver || team[index].hp <= 0) {
    log("Ese monstruo está debilitado o no puede combatir.", "bad");
    return;
  }

  const oldMonster = activeMonster();
  const emergencySwitch = oldMonster.hp <= 0;

  if (busy && !emergencySwitch) return;

  activeIndex = index;
  const chosen = activeMonster();

  log(
    `${oldMonster.name} deja el campo. ¡Entra ${chosen.name}!`,
    "info"
  );

  update();

  // Un cambio voluntario consume un turno.
  // Si el monstruo anterior cayó debilitado, el relevo es gratuito.
  if (!emergencySwitch) {
    busy = true;
    enemyTurn();
  }
}

// Ventajas y desventajas elementales
function elementalMultiplier(attacker, defender) {
  if (ADVANTAGES[attacker]?.includes(defender)) return 1.5;
  if (ADVANTAGES[defender]?.includes(attacker)) return 0.75;
  return 1;
}

function dealDamage(attacker, defender, power = 1) {
  const multiplier = elementalMultiplier(
    attacker.element, defender.element
  );

  const base = Math.round(
    (attacker.attack * power + rand(7)) * multiplier
  );

  defender.hp = Math.max(0, defender.hp - base);

  let message = `${attacker.name} causa ${base} de daño.`;

  if (multiplier > 1) message += " ¡Es muy eficaz!";
  if (multiplier < 1) message += " El enemigo resiste parte del daño.";

  return { damage: base, multiplier, message };
}

function animateHit(id) {
  const element = $(id);
  element.classList.remove("hit");
  void element.offsetWidth;
  element.classList.add("hit");
}

// Ataque normal
function attack() {
  if (busy || gameOver) return;

  const hero = activeMonster();
  if (hero.hp <= 0) return;

  const result = dealDamage(hero, enemy);
  animateHit("enemySprite");
  log(result.message, result.multiplier > 1 ? "rare" : "good");

  if (enemy.hp <= 0) {
    victory();
    return;
  }

  busy = true;
  update();
  enemyTurn();
}

// Habilidad especial
function useSkill() {
  const hero = activeMonster();

  if (busy || gameOver || hero.energy < 25 || hero.hp <= 0) return;

  hero.energy -= 25;

  const result = dealDamage(hero, enemy, 2);
  animateHit("enemySprite");

  log(
    `${hero.name} usa su poder de ${ELEMENTS[hero.element]}. ${result.message}`,
    "rare"
  );

  if (enemy.hp <= 0) {
    victory();
    return;
  }

  busy = true;
  update();
  enemyTurn();
}

// Curación
function heal() {
  const hero = activeMonster();

  if (busy || gameOver || hero.hp <= 0 || hero.hp >= hero.maxHp) return;

  const amount = Math.min(25, hero.maxHp - hero.hp);
  hero.hp += amount;

  log(`${hero.name} recupera ${amount} HP.`, "good");
  busy = true;
  update();
  enemyTurn();
}

function usePotion() {
  const hero = activeMonster();

  if (busy || gameOver || player.potions <= 0 ||
      hero.hp <= 0 || hero.hp >= hero.maxHp) return;

  const amount = Math.min(55, hero.maxHp - hero.hp);

  player.potions--;
  hero.hp += amount;

  log(`La poción restaura ${amount} HP a ${hero.name}.`, "good");
  busy = true;
  update();
  enemyTurn();
}

// Captura con probabilidad creciente según la salud del enemigo
function capture() {
  if (busy || gameOver || team.length >= MAX_TEAM) return;

  const chance = clamp(
    0.15 + (1 - enemy.hp / enemy.maxHp) * 0.7,
    0.15,
    0.85
  );

  if (Math.random() < chance) {
    const captured = createMonster(
      SPECIES.find(s => s[0] === enemy.name.replace("JEFE: ", "")) ||
      [enemy.name, enemy.emoji, enemy.element, enemy.maxHp, enemy.attack],
      enemy.level
    );

    team.push(captured);

    log(
      `¡Capturaste a ${captured.name}! Probabilidad: ${Math.round(chance * 100)}%.`,
      "rare"
    );

    victory(true);
    return;
  }

  log(`La captura falló (${Math.round(chance * 100)}%).`, "bad");
  busy = true;
  update();
  enemyTurn();
}

// Turno enemigo y relevo automático
function enemyTurn() {
  if (!enemy || gameOver) {
    busy = false;
    update();
    return;
  }

  const hero = activeMonster();

  if (hero.hp <= 0) {
    const replacement = team.findIndex(m => m.hp > 0);

    if (replacement === -1) {
      defeat();
      return;
    }

    activeIndex = replacement;
    log(`¡${team[replacement].name} entra para continuar la batalla!`, "rare");
    busy = false;
    update();
    return;
  }

  const result = dealDamage(enemy, hero);
  animateHit("heroSprite");

  log(
    `${enemy.name} ataca a ${hero.name}. ${result.message}`,
    "bad"
  );

  // Recuperación parcial de energía al finalizar el turno.
  hero.energy = clamp(hero.energy + 12, 0, hero.maxEnergy);

  if (hero.hp <= 0) {
    log(`${hero.name} ha quedado debilitado.`, "bad");

    const replacement = team.findIndex(m => m.hp > 0);

    if (replacement !== -1) {
      activeIndex = replacement;
      log(`¡Adelante, ${team[replacement].name}!`, "rare");
      busy = false;
      update();
      return;
    }

    defeat();
    return;
  }

  busy = false;
  update();
}

// Victoria, experiencia y niveles
function victory(captured = false) {
  const defeated = enemy;

  player.wins++;
  player.gold += defeated.isBoss ? 100 : 25;

  const gainedXP = defeated.isBoss ? 70 : 30;
  player.xp += gainedXP;

  const hero = activeMonster();
  hero.xp += gainedXP;

  log(
    `¡Victoria! +${defeated.isBoss ? 100 : 25} oro y +${gainedXP} XP.`,
    "rare"
  );

  while (hero.xp >= 100) {
    hero.xp -= 100;
    hero.level++;
    hero.maxHp += 15;
    hero.hp = hero.maxHp;
    hero.attack += 3;

    log(`${hero.name} alcanza el nivel ${hero.level}.`, "rare");
  }

  while (player.xp >= 100) {
    player.xp -= 100;
    player.level++;
    log(`¡Entrenador nivel ${player.level}!`, "rare");
  }

  // Pequeña recuperación tras la victoria.
  hero.hp = Math.min(hero.maxHp, hero.hp + 10);

  if (captured) {
    log("El monstruo capturado se une a tu equipo.", "good");
  }

  busy = false;
  saveGame();
  createEnemy();
}

// Si todo el equipo cae, se recupera parcialmente
function defeat() {
  gameOver = true;
  busy = false;

  player.gold = Math.max(0, player.gold - 15);

  team.forEach(monster => {
    monster.hp = Math.max(1, Math.round(monster.maxHp * 0.4));
    monster.energy = 100;
  });

  activeIndex = 0;

  log(
    "Equipo derrotado. Todos se recuperan con el 40% de salud. Pierdes 15 de oro.",
    "bad"
  );

  update();

  $("battleStatus").textContent = "EQUIPO RECUPERÁNDOSE";
  $("battleTip").textContent =
    "Pulsa el botón de reiniciar partida si quieres empezar de cero. El equipo se recuperará para el próximo combate.";

  createEnemy();
}

// Huir no da recompensas y no causa daño
function escapeBattle() {
  if (busy || gameOver) return;

  log("Has abandonado el combate. No recibes recompensas.", "info");
  createEnemy();
}

// Mejoras del equipo activo
function upgradeAttack() {
  if (busy || gameOver) return;

  if (player.gold < 80) {
    log("Necesitas 80 monedas de oro.", "bad");
    return;
  }

  player.gold -= 80;
  activeMonster().attack += 5;

  log(`El ataque de ${activeMonster().name} aumenta en 5.`, "good");
  update();
}

function upgradeHealth() {
  if (busy || gameOver) return;

  if (player.gold < 80) {
    log("Necesitas 80 monedas de oro.", "bad");
    return;
  }

  const hero = activeMonster();

  player.gold -= 80;
  hero.maxHp += 20;
  hero.hp += 20;

  log(`${hero.name} aumenta su salud máxima en 20.`, "good");
  update();
}

// Reinicio completo
function resetGame() {
  if (!confirm("¿Borrar la partida y comenzar de nuevo?")) return;

  localStorage.removeItem(SAVE_KEY);

  player = newPlayer();
  team = [createMonster(SPECIES[0])];
  activeIndex = 0;
  enemy = null;
  busy = false;
  gameOver = false;

  $("battleLog").replaceChildren();
  log("Nueva aventura iniciada. ¡Elige bien a tus campeones!", "good");

  createEnemy();
}

// Conectar botones
$("attackBtn").addEventListener("click", attack);
$("skillBtn").addEventListener("click", useSkill);
$("healBtn").addEventListener("click", heal);
$("captureBtn").addEventListener("click", capture);
$("escapeBtn").addEventListener("click", escapeBattle);
$("potionBtn").addEventListener("click", usePotion);
$("attackUpgradeBtn").addEventListener("click", upgradeAttack);
$("healthUpgradeBtn").addEventListener("click", upgradeHealth);
$("resetBtn").addEventListener("click", resetGame);

// Inicio
loadGame();
log("Bienvenido a Monster Arena: Evolution.", "good");
log("Selecciona monstruos de tu equipo para cambiar de campeón.", "info");
createEnemy();
