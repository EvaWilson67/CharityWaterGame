const gameArea = document.getElementById("gameArea");
const scoreValue = document.getElementById("scoreValue");
const livesValue = document.getElementById("livesValue");
const messageEl = document.getElementById("message");
const centerNotice = document.getElementById("centerNotice");
const centerNoticeText = document.getElementById("centerNoticeText");
const overlay = document.getElementById("gameOverOverlay");
const finalScore = document.getElementById("finalScore");
const restartBtn = document.getElementById("restartBtn");

const PLAYER_WIDTH = 86;
const PLAYER_HEIGHT = 112;

let gameWidth = window.innerWidth;
let gameHeight = window.innerHeight;
let playerX = gameWidth / 2 - PLAYER_WIDTH / 2;
let score = 0;
let lives = 3;
let running = true;
let rafId = null;
let spawnTimer = null;
let keys = { left: false, right: false };
let droplets = [];
let lastTime = 0;
let feedbackHideTimer = null;
let playerMessageHideTimer = null;
let noticeHideTimer = null;

const player = document.createElement("img");
player.src = "png/jerry_can_yellow.png";
player.id = "player";
player.alt = "Player";
gameArea.appendChild(player);

const playerKeyMessage = document.createElement("div");
playerKeyMessage.id = "playerKeyMessage";
gameArea.appendChild(playerKeyMessage);

player.style.width = PLAYER_WIDTH + "px";
player.style.height = PLAYER_HEIGHT + "px";
player.style.left = playerX + "px";
player.style.bottom = "28px";

function updatePlayerKeyMessagePosition() {
  // playerKeyMessage.style.left = playerX + PLAYER_WIDTH / 2 + "px";
  playerKeyMessage.style.bottom = 10;
  playerKeyMessage.style.left = playerX;
}

function showPlayerKeyMessage(text) {
  clearTimeout(playerMessageHideTimer);
  playerKeyMessage.textContent = text;
  playerKeyMessage.classList.add("show");
  updatePlayerKeyMessagePosition();

  playerMessageHideTimer = setTimeout(() => {
    playerKeyMessage.classList.remove("show");
  }, 1800);
}

function initGame() {
  score = 0;
  lives = 3;
  playerX = Math.max(0, gameWidth / 2 - PLAYER_WIDTH / 2);

  droplets.forEach(d => d.el.remove());
  droplets = [];

  scoreValue.textContent = score;
  livesValue.textContent = lives;
  overlay.classList.add("hidden");
  messageEl.classList.remove("show");
  centerNotice.classList.remove("show");
  playerKeyMessage.classList.remove("show");
  player.style.left = playerX + "px";
  updatePlayerKeyMessagePosition();

  running = true;
  lastTime = performance.now();

  if (spawnTimer) clearInterval(spawnTimer);
  if (rafId) cancelAnimationFrame(rafId);

  spawnTimer = setInterval(spawnDroplet, 800);
  rafId = requestAnimationFrame(loop);
}

function spawnDroplet() {
  if (!running) return;

  const el = document.createElement("div");
  const isGood = Math.random() < 0.68;

  el.className = "droplet " + (isGood ? "blue" : "black");

  const x = Math.random() * (gameWidth - 40);
  const speed = isGood ? (0.9 + Math.random() * 0.8) : (1.0 + Math.random() * 0.9);
  const size = isGood ? 34 : 30;

  el.style.left = x + "px";
  el.style.top = "-60px";
  el.style.width = size + "px";
  el.style.height = size * 1.9 + "px";

  gameArea.appendChild(el);

  droplets.push({
    el,
    x,
    y: -60,
    speed,
    isGood,
    width: size,
    height: size * 1.9
  });
}

function movePlayer(dt) {
  const speed = 0.45 * dt;

  if (keys.left) playerX -= speed;
  if (keys.right) playerX += speed;

  playerX = Math.max(0, Math.min(gameWidth - PLAYER_WIDTH, playerX));
  player.style.left = playerX + "px";
  // updatePlayerKeyMessagePosition();
}

function updateDroplets(dt) {
  const playerRect = {
    x: playerX,
    y: gameHeight - 28 - PLAYER_HEIGHT,
    w: PLAYER_WIDTH,
    h: PLAYER_HEIGHT
  };

  const toRemove = [];

  droplets.forEach((d, index) => {
    d.y += d.speed * dt;
    d.el.style.top = d.y + "px";
    d.el.style.left = d.x + "px";

    if (intersects(d, playerRect)) {
      toRemove.push(index);

      if (d.isGood) {
        score += 1;
        scoreValue.textContent = score;

        if (score % 5 === 0) {
          showFeedback("Great job!");
          showPlayerKeyMessage("100% of public donations go directly to water projects");
        }
      } else {
        lives -= 1;
        livesValue.textContent = lives;
        showCenterNotice(`${lives} lives left`);

        if (lives <= 0) {
          gameOver();
        }
      }
    } else if (d.y > gameHeight + 60) {
      toRemove.push(index);
    }
  });

  [...new Set(toRemove)]
    .sort((a, b) => b - a)
    .forEach(i => {
      droplets[i]?.el.remove();
      droplets.splice(i, 1);
    });
}

function intersects(d, p) {
  const dx1 = d.x;
  const dy1 = d.y;
  const dx2 = d.x + d.width;
  const dy2 = d.y + d.height;
  const px1 = p.x;
  const py1 = p.y;
  const px2 = p.x + p.w;
  const py2 = p.y + p.h;

  return dx1 < px2 && dx2 > px1 && dy1 < py2 && dy2 > py1;
}

function showFeedback(text) {
  clearTimeout(feedbackHideTimer);
  messageEl.textContent = text;
  messageEl.classList.add("show");
  feedbackHideTimer = setTimeout(() => messageEl.classList.remove("show"), 1400);
}

function showCenterNotice(text) {
  clearTimeout(noticeHideTimer);
  centerNoticeText.textContent = text;
  centerNotice.classList.add("show");
  noticeHideTimer = setTimeout(() => centerNotice.classList.remove("show"), 1000);
}

function gameOver() {
  running = false;
  clearInterval(spawnTimer);
  finalScore.textContent = score;
  overlay.classList.remove("hidden");
}

function loop(time) {
  if (!running) return;

  const dt = Math.min(32, time - lastTime || 16);
  lastTime = time;

  movePlayer(dt);
  updateDroplets(dt);

  rafId = requestAnimationFrame(loop);
}

function resize() {
  gameWidth = window.innerWidth;
  gameHeight = window.innerHeight;

  if (gameWidth < PLAYER_WIDTH) playerX = 0;
  else playerX = Math.max(0, Math.min(gameWidth - PLAYER_WIDTH, playerX));

  player.style.left = playerX + "px";
  updatePlayerKeyMessagePosition();
}

window.addEventListener("resize", resize);

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") keys.left = true;
  if (e.key === "ArrowRight") keys.right = true;
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") keys.left = false;
  if (e.key === "ArrowRight") keys.right = false;
});

window.addEventListener("mousemove", (e) => {
  if (!running) return;
  playerX = Math.max(0, Math.min(gameWidth - PLAYER_WIDTH, e.clientX - PLAYER_WIDTH / 2));
  player.style.left = playerX + "px";
  // updatePlayerKeyMessagePosition();
});

restartBtn.addEventListener("click", () => {
  initGame();
});

player.style.left = playerX + "px";
updatePlayerKeyMessagePosition();
resize();
initGame();