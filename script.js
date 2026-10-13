
"use strict";

const SAVE_KEY = "monsterArenaSave_v3";

const monsters = [
  { name: "Slime", emoji: "🟢", hp: 75, attack: 10 },
  { name: "Goblin", emoji: "👺", hp: 90, attack: 13 },
  { name: "Lobo", emoji: "🐺", hp: 95, attack: 14 },
  { name: "Araña", emoji: "🕷️", hp: 85, attack: 12 },
  { name: "Troll", emoji: "👹", hp: 135, attack: 18 },
  { name: "Fantasma", emoji: "👻", hp: 100, attack: 15 },
  { name: "Dragón", emoji: "🐉", hp: 160, attack: 21 },
  { name: "Serpiente", emoji: "🐍", hp: 105, attack: 16 },
  { name: "Fénix", emoji: "🦅", hp: 145, attack: 19 }
];

function newPlayer() {
  return {
    level: 1, xp: 0, gold: 0, wins: 0,
    hp: 120, maxHp: 120, attack: 20,
    potions: 2, energy: 100, maxEnergy: 100
  };
}

let player = newPlayer();
let team = [{ name: "Pyron", emoji: "🔥", level: 1 }];
let enemy = null;
let busy = false;

const $ = id => document.getElementById(id);
const randomInt = max => Math.floor(Math.random() * max);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ player, team }));
  } catch (error) {
    console.warn("No se pudo guardar la partida.", error);
  }
}

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (!data || !data.player || !Array.isArray(data.team)) return;

    player = { ...newPlayer(), ...data.player };
    team = data.team;
    player.hp = clamp(Number(player.hp) || 1, 1, player.maxHp);
    player.gold = Math.max(0, Number(player.gold) || 0);
    player.energy = clamp(Number(player.energy) || 0, 0, player.maxEnergy);
    team = team.slice(0, 6);
    if (!team.length) team = [{ name: "Pyron", emoji: "🔥", level: 1 }];
  } catch (error) {
    player = newPlayer();
    team = [{ name: "Pyron", emoji: "🔥", level: 1 }];
  }
}

function addLog(message, type = "") {
  const entry = document.createElement("div");
  entry.className = "log-entry " + type;
  entry.textContent = message;
  $("log").prepend(entry);

  while ($("log").children.length > 35) {
    $("log").lastElementChild.remove();
  }
}

function createEnemy() {
  busy = false;

  const boss = player.wins > 0 && player.wins % 10 === 0;
  const base = monsters[randomInt(monsters.length)];
  const scale = 1 + player.wins * 0.07;

  if (boss) {
    const hp = Math.round(260 + player.wins * 8);
    enemy = {
      name: "Titán de la Arena",
      emoji: "🐲",
      hp, maxHp: hp,
      attack: 22 + Math.floor(player.wins * 1.3),
      boss: true
    };
    addLog("¡Ha aparecido el jefe de la arena!", "rare");
  } else {
    const hp = Math.round((base.hp + player.wins * 3) * scale);
    enemy = {
      ...base,
      hp, maxHp: hp,
      attack: Math.round(base.attack + player.wins * 0.6),
      boss: false
    };
  }

  update();
}

function update() {
  $("level").textContent = player.level;
  $("xp").textContent = player.xp;
  $("gold").textContent = player.gold;
  $("wins").textContent = player.wins;
  $("playerHpStat").textContent = player.hp;
  $("attackStat").textContent = player.attack;
  $("potions").textContent = player.potions;
  $("round").textContent = player.wins + 1;

  $("xpFill").style.width = player.xp + "%";

  $("heroHpText").textContent = `${player.hp} / ${player.maxHp}`;
  $("heroHpFill").style.width = (player.hp / player.maxHp * 100) + "%";
  $("heroHpFill").classList.toggle("low", player.hp / player.maxHp < 0.3);

  $("heroInfo").textContent =
    `Ataque ${player.attack} · Energía ${player.energy}/${player.maxEnergy}`;

  $("teamCount").textContent = `${team.length}/6`;
  $("teamList").replaceChildren();

  team.forEach((monster, index) => {
    const item = document.createElement("div");
    item.className = "team-member";
    item.textContent = `${monster.emoji || "👾"} ${monster.name}`;

    const small = document.createElement("small");
    small.textContent = index === 0
      ? "Campeón principal"
      : `Compañero · Nv. ${monster.level || 1}`;

    item.appendChild(small);
    $("teamList").appendChild(item);
  });

  if (enemy) {
    $("enemyName").textContent = enemy.name;
    $("enemySprite").textContent = enemy.emoji;
    $("enemyType").textContent = enemy.boss ? "⚠ JEFE DE ZONA" : "Enemigo salvaje";
    $("enemyHpText").textContent = `${Math.max(0, enemy.hp)} / ${enemy.maxHp}`;
    $("enemyHpFill").style.width =
      (Math.max(0, enemy.hp) / enemy.maxHp * 100) + "%";
    $("enemyHpFill").classList.toggle("low", enemy.hp / enemy.maxHp < 0.3);
    $("enemyInfo").textContent = `Ataque ${enemy.attack}`;
  }

  const disabled = busy || player.hp <= 0;
  $("basicBtn").disabled = disabled;
  $("specialBtn").disabled = disabled || player.energy < 25;
  $("healBtn").disabled = disabled || player.hp >= player.maxHp;
  $("captureBtn").disabled = disabled || team.length >= 6;
  $("potionBtn").disabled = disabled || player.potions < 1 || player.hp >= player.maxHp;

  save();
}

function animateHit(id) {
  const element = $(id);
  element.classList.remove("hit");
  void element.offsetWidth;
  element.classList.add("hit");
}

function attackEnemy(damage, message) {
  if (busy || !enemy) return;

  busy = true;
  enemy.hp = Math.max(0, enemy.hp - damage);
  animateHit("enemySprite");
  addLog(message, "good");

  if (enemy.hp <= 0) {
    update();
    victory();
    return;
  }

  update();
  enemyTurn();
}

function basicAttack() {
  const damage = player.attack + randomInt(9);
  attackEnemy(damage, `Tu ataque básico inflige ${damage} de daño.`);
}

function specialAttack() {
  if (busy || player.energy < 25) return;

  player.energy -= 25;
  const damage = player.attack * 2 + randomInt(13);
  attackEnemy(damage, `¡Ataque especial! Infliges ${damage} de daño.`);
}

function heal() {
  if (busy || player.hp >= player.maxHp) return;

  const amount = Math.min(30, player.maxHp - player.hp);
  player.hp += amount;
  addLog(`Recuperas ${amount} puntos de salud.`, "good");
  update();
  enemyTurn();
}

function usePotion() {
  if (busy || player.potions < 1 || player.hp >= player.maxHp) return;

  const amount = Math.min(55, player.maxHp - player.hp);
  player.potions--;
  player.hp += amount;

  addLog(`Usas una poción y recuperas ${amount} HP.`, "good");
  update();
}

function capture() {
  if (busy || !enemy || team.length >= 6) return;

  const chance = clamp(
    0.2 + (1 - enemy.hp / enemy.maxHp) * 0.62,
    0.2, 0.82
  );

  if (Math.random() < chance) {
    team.push({
      name: enemy.name,
      emoji: enemy.emoji,
      level: player.level
    });

    addLog(`¡Capturaste a ${enemy.name}!`, "rare");
    victory(true);
  } else {
    addLog(`La captura falló. Probabilidad: ${Math.round(chance * 100)}%.`, "bad");
    busy = true;
    enemyTurn();
  }
}

function enemyTurn() {
  if (!enemy) return;

  const damage = Math.max(
    1,
    enemy.attack + randomInt(7) - Math.floor(player.level / 3)
  );

  player.hp = Math.max(0, player.hp - damage);
  player.energy = clamp(player.energy + 12, 0, player.maxEnergy);
  animateHit("heroSprite");

  addLog(`${enemy.name} te golpea y causa ${damage} de daño.`, "bad");

  if (player.hp <= 0) {
    player.gold = Math.max(0, player.gold - 15);
    player.hp = Math.max(1, Math.round(player.maxHp * 0.55));
    player.energy = player.maxEnergy;

    addLog("Has caído. Te recuperas con el 55% de tu salud y pierdes hasta 15 de oro.", "bad");
    createEnemy();
    return;
  }

  busy = false;
  update();
}

function victory(captured = false) {
  player.wins++;
  player.gold += enemy.boss ? 75 : 20;
  player.xp += enemy.boss ? 60 : 25;
  player.energy = clamp(player.energy + 15, 0, player.maxEnergy);

  addLog(
    `¡Victoria! Ganas ${enemy.boss ? 75 : 20} de oro y ${enemy.boss ? 60 : 25} XP.`,
    "rare"
  );

  while (player.xp >= 100) {
    player.xp -= 100;
    player.level++;
    player.maxHp += 20;
    player.attack += 4;
    player.hp = player.maxHp;
    player.energy = player.maxEnergy;
    addLog(`¡Subes al nivel ${player.level}! Aumentan tu salud y ataque.`, "rare");
  }

  if (!captured) player.hp = Math.min(player.maxHp, player.hp + 8);

  save();
  createEnemy();
}

function buyUpgrade(type) {
  if (busy) return;

  const prices = { attack: 60, health: 60, potion: 35 };
  const cost = prices[type];

  if (player.gold < cost) {
    addLog(`No tienes suficiente oro. Necesitas ${cost} monedas.`);
    return;
  }

  player.gold -= cost;

  if (type === "attack") {
    player.attack += 5;
    addLog("Tu arma mejora: +5 de ataque.", "good");
  } else if (type === "health") {
    player.maxHp += 20;
    player.hp += 20;
    addLog("Entrenamiento completado: +20 salud máxima y actual.", "good");
  } else if (type === "potion") {
    player.potions++;
    addLog("Has comprado una poción.", "good");
  }

  update();
}

function resetGame() {
  if (!confirm("¿Seguro que quieres borrar todo el progreso?")) return;

  localStorage.removeItem(SAVE_KEY);
  player = newPlayer();
  team = [{ name: "Pyron", emoji: "🔥", level: 1 }];
  $("log").replaceChildren();

  addLog("Nueva partida iniciada. ¡A por la primera victoria!", "good");
  createEnemy();
}

$("basicBtn").addEventListener("click", basicAttack);
$("specialBtn").addEventListener("click", specialAttack);
$("healBtn").addEventListener("click", heal);
$("captureBtn").addEventListener("click", capture);
$("potionBtn").addEventListener("click", usePotion);
$("resetBtn").addEventListener("click", resetGame);
$("attackUpgrade").addEventListener("click", () => buyUpgrade("attack"));
$("healthUpgrade").addEventListener("click", () => buyUpgrade("health"));
$("buyPotion").addEventListener("click", () => buyUpgrade("potion"));

load();
addLog("Bienvenido a Monster Arena. ¡Derrota enemigos y reúne tu equipo!", "good");
createEnemy();
