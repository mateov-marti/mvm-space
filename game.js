const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Configuración de la nave espacial
const ship = {
    width: 44,
    height: 38,
    x: canvas.width / 2 - 22,
    y: canvas.height - 100,
    speed: 5,
    color: '#b3e5fc', // cuerpo principal
    cockpitColor: '#00bcd4',
    wingColor: '#90caf9',
    fireColor: '#ff9800',
    laserColor: '#ff2222', // Rojo intenso
    alive: true,
    destroyed: false,
    explosionFrame: 0
};

// Láseres
let lasers = [];
const laserSpeed = 8;
const laserWidth = 4;
const laserHeight = 18;
let canShoot = true;
let lastShootTime = 0;

// Obstáculos (autos, rocas, pedazos de árbol)
let obstacles = [];
let obstacleSpeed = 2.5;
let obstacleInterval = 500; // ms
let lastObstacleTime = 0;

// Fragmentos de desmoronamiento
let fragments = [];

// Estrellas para el fondo
const stars = Array.from({length: 100}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.5,
    speed: 0.5 + Math.random() * 1.2
}));

// Movimiento
let moveLeft = false;
let moveRight = false;
// let moveUp = false;
// let moveDown = false;
let shooting = false;

// Estado del juego
let gameOver = false;

let destroyedRocks = 0;
let powerUpActive = false;
let destroyedTrees = 0;
let laserMultiplier = 1;
const baseShootCooldown = 200;
let shootCooldown = baseShootCooldown;

function drawShip() {
    if (ship.destroyed) {
        // Animación de explosión
        for (let i = 0; i < 18; i++) {
            ctx.save();
            ctx.translate(ship.x + ship.width / 2, ship.y + ship.height / 2);
            ctx.rotate((Math.PI * 2 * i) / 18);
            ctx.beginPath();
            ctx.arc(0, 0, 10 + ship.explosionFrame * 2, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255,${100 + Math.random()*155},0,${1 - ship.explosionFrame/15})`;
            ctx.lineWidth = 2 + Math.random() * 2;
            ctx.stroke();
            ctx.restore();
        }
        return;
    }
    ctx.save();
    ctx.translate(ship.x + ship.width / 2, ship.y + ship.height / 2);
    // Cuerpo principal
    ctx.beginPath();
    ctx.moveTo(0, -18); // punta
    ctx.lineTo(18, 16); // derecha
    ctx.lineTo(0, 10); // base
    ctx.lineTo(-18, 16); // izquierda
    ctx.closePath();
    ctx.fillStyle = ship.color;
    ctx.shadowColor = '#00bcd4';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Cabina
    ctx.beginPath();
    ctx.ellipse(0, -4, 7, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = ship.cockpitColor;
    ctx.globalAlpha = 0.8;
    ctx.fill();
    ctx.globalAlpha = 1;
    // Alas
    ctx.beginPath();
    ctx.moveTo(-18, 16);
    ctx.lineTo(-28, 24);
    ctx.lineTo(-10, 12);
    ctx.closePath();
    ctx.fillStyle = ship.wingColor;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(18, 16);
    ctx.lineTo(28, 24);
    ctx.lineTo(10, 12);
    ctx.closePath();
    ctx.fill();
    // Fuego trasero
    ctx.beginPath();
    ctx.moveTo(-7, 18);
    ctx.lineTo(0, 32 + Math.random() * 6);
    ctx.lineTo(7, 18);
    ctx.closePath();
    ctx.fillStyle = ship.fireColor;
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
}

function drawLaser(laser) {
    ctx.save();
    let color = powerUpActive ? '#00ff44' : ship.laserColor;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = color;
    ctx.fillRect(laser.x, laser.y, laserWidth, laserHeight);
    ctx.shadowBlur = 0;
    ctx.restore();
}

function drawObstacle(obstacle) {
    ctx.save();
    ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
    ctx.rotate(obstacle.angle);
    ctx.shadowColor = '#888';
    ctx.shadowBlur = 10;
    if (obstacle.type === 'rock') {
        // Roca realista (gris, con grietas)
        ctx.fillStyle = obstacle.color;
        ctx.beginPath();
        ctx.moveTo(-obstacle.width/2, -obstacle.height/2);
        ctx.lineTo(obstacle.width/2, -obstacle.height/2 + 5);
        ctx.lineTo(obstacle.width/2 - 5, obstacle.height/2);
        ctx.lineTo(-obstacle.width/2 + 7, obstacle.height/2 - 3);
        ctx.closePath();
        ctx.fill();
        // Grietas
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-obstacle.width/4, 0);
        ctx.lineTo(obstacle.width/4, obstacle.height/4);
        ctx.moveTo(0, -obstacle.height/4);
        ctx.lineTo(0, obstacle.height/4);
        ctx.stroke();
    } else if (obstacle.type === 'car') {
        // Auto (rectángulo con detalles)
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(-obstacle.width/2, -obstacle.height/2, obstacle.width, obstacle.height);
        // Ventanas
        ctx.fillStyle = '#fff';
        ctx.fillRect(-obstacle.width/4, -obstacle.height/4, obstacle.width/2, obstacle.height/2);
        // Ruedas
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(-obstacle.width/2 + 5, obstacle.height/2 - 3, 3, 0, Math.PI * 2);
        ctx.arc(obstacle.width/2 - 5, obstacle.height/2 - 3, 3, 0, Math.PI * 2);
        ctx.fill();
    } else if (obstacle.type === 'tree') {
        // Pedazo de árbol (marrón con ramas)
        ctx.fillStyle = '#6d4c23';
        ctx.beginPath();
        ctx.moveTo(-obstacle.width/2, obstacle.height/2);
        ctx.lineTo(0, -obstacle.height/2);
        ctx.lineTo(obstacle.width/2, obstacle.height/2);
        ctx.closePath();
        ctx.fill();
        // Ramas
        ctx.strokeStyle = '#a1887f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-obstacle.width/4, -obstacle.height/4);
        ctx.moveTo(0, 0);
        ctx.lineTo(obstacle.width/4, -obstacle.height/4);
        ctx.stroke();
    }
    // Barra de vida
    if (obstacle.hp < obstacle.maxHp) {
        ctx.save();
        ctx.rotate(-obstacle.angle); // barra siempre horizontal
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#222';
        ctx.fillRect(-obstacle.width/2, -obstacle.height/2 - 8, obstacle.width, 6);
        ctx.fillStyle = obstacle.type === 'car' ? '#e53935' : (obstacle.type === 'rock' ? '#888' : '#6d4c23');
        ctx.fillRect(-obstacle.width/2, -obstacle.height/2 - 8, obstacle.width * (obstacle.hp/obstacle.maxHp), 6);
        ctx.globalAlpha = 1;
        ctx.restore();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
}

function drawFragment(fragment) {
    ctx.save();
    ctx.globalAlpha = fragment.alpha;
    ctx.fillStyle = fragment.color;
    ctx.beginPath();
    ctx.arc(fragment.x, fragment.y, fragment.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
}

function createObstacle() {
    // Selección aleatoria de tipo
    const types = ['rock', 'car', 'tree'];
    const type = types[Math.floor(Math.random() * types.length)];
    let width, height, color, hp, maxHp;
    if (type === 'rock') {
        width = 30 + Math.random() * 20;
        height = 18 + Math.random() * 12;
        color = '#888';
        maxHp = hp = 10; // 10% vida
    } else if (type === 'car') {
        width = 36 + Math.random() * 10;
        height = 18 + Math.random() * 6;
        color = '#e53935';
        maxHp = hp = 5; // 5% vida
    } else if (type === 'tree') {
        width = 28 + Math.random() * 18;
        height = 32 + Math.random() * 18;
        color = '#6d4c23';
        maxHp = hp = 2; // 2% vida
    }
    // Movimiento circular
    const baseX = Math.random() * (canvas.width - width);
    const phase = Math.random() * Math.PI * 2;
    const radius = 20 + Math.random() * 60;
    const freq = 0.008 + Math.random() * 0.012;
    obstacles.push({
        x: baseX,
        y: -height,
        width,
        height,
        color,
        angle: Math.random() * Math.PI * 2,
        type,
        baseX,
        phase,
        radius,
        freq,
        t: 0,
        hp,
        maxHp
    });
}

function createFragments(obs) {
    for (let i = 0; i < 10 + Math.random() * 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 2.5;
        fragments.push({
            x: obs.x + obs.width / 2,
            y: obs.y + obs.height / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed + 1.5,
            radius: 2 + Math.random() * 3,
            color: '#bbb',
            alpha: 1.0,
            decay: 0.015 + Math.random() * 0.01
        });
    }
}

function updateObstacles() {
    for (let obs of obstacles) {
        obs.t += 1;
        obs.y += obstacleSpeed;
        // Movimiento circular
        obs.x = obs.baseX + Math.sin(obs.phase + obs.t * obs.freq) * obs.radius;
    }
    obstacles = obstacles.filter(obs => obs.y < canvas.height);
}

function updateFragments() {
    for (let frag of fragments) {
        frag.x += frag.vx;
        frag.y += frag.vy;
        frag.alpha -= frag.decay;
    }
    fragments = fragments.filter(frag => frag.alpha > 0 && frag.y < canvas.height);
}

function updateLasers() {
    for (let laser of lasers) {
        laser.y -= laserSpeed;
    }
    lasers = lasers.filter(laser => laser.y + laserHeight > 0);
}

function checkCollisions() {
    if (ship.destroyed) return;
    for (let obs of obstacles) {
        if (
            ship.x < obs.x + obs.width &&
            ship.x + ship.width > obs.x &&
            ship.y < obs.y + obs.height &&
            ship.y + ship.height > obs.y
        ) {
            ship.destroyed = true;
            ship.explosionFrame = 0;
            setTimeout(() => { gameOver = true; }, 700);
        }
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
        for (let j = lasers.length - 1; j >= 0; j--) {
            const obs = obstacles[i];
            const laser = lasers[j];
            if (
                laser.x < obs.x + obs.width &&
                laser.x + laserWidth > obs.x &&
                laser.y < obs.y + obs.height &&
                laser.y + laserHeight > obs.y
            ) {
                obs.hp--;
                if (obs.hp <= 0) {
                    if (obs.type === 'rock' || obs.type === 'tree') {
                        destroyedRocks++;
                        if (destroyedRocks > 15) powerUpActive = true;
                    }
                    if (obs.type === 'tree') {
                        destroyedTrees++;
                        // Disparo más rápido
                        shootCooldown = Math.max(40, shootCooldown - 10);
                        // Cada 10 árboles destruidos, duplica el disparo
                        if (destroyedTrees % 10 === 0) {
                            laserMultiplier *= 2;
                        }
                    }
                    createFragments(obs);
                    obstacles.splice(i, 1);
                }
                lasers.splice(j, 1);
                break;
            }
        }
    }
}

function drawFuturisticOverlay() {
    // Líneas y detalles futuristas
    ctx.save();
    ctx.strokeStyle = 'rgba(0,255,255,0.08)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, 80 + i*50, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,255,255,0.12)';
    ctx.beginPath();
    ctx.moveTo(canvas.width/2, 0);
    ctx.lineTo(canvas.width/2, canvas.height);
    ctx.moveTo(0, canvas.height/2);
    ctx.lineTo(canvas.width, canvas.height/2);
    ctx.stroke();
    ctx.restore();
}

function drawScore() {
    ctx.save();
    ctx.font = '20px Arial';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#00bcd4';
    ctx.shadowBlur = 6;
    ctx.fillText(`Rocas: ${destroyedRocks}  Árboles: ${destroyedTrees}`, 18, 32);
    ctx.shadowBlur = 0;
    ctx.restore();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Fondo negro
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Estrellas
    for (let s of stars) {
        ctx.save();
        ctx.globalAlpha = 0.7 + Math.sin(Date.now()/400 + s.x) * 0.2;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    drawFuturisticOverlay();
    drawScore();
    for (let frag of fragments) {
        drawFragment(frag);
    }
    for (let obs of obstacles) {
        drawObstacle(obs);
    }
    for (let laser of lasers) {
        drawLaser(laser);
    }
    drawShip();
}

function update() {
    if (moveLeft) {
        ship.x -= ship.speed;
        if (ship.x < 0) ship.x = 0;
    }
    if (moveRight) {
        ship.x += ship.speed;
        if (ship.x + ship.width > canvas.width) ship.x = canvas.width - ship.width;
    }
    // Las teclas de arriba/abajo no hacen nada
    if (ship.destroyed && ship.explosionFrame < 15) {
        ship.explosionFrame++;
    }
}

function resetGame() {
    ship.x = canvas.width / 2 - ship.width / 2;
    ship.y = canvas.height - 100;
    ship.destroyed = false;
    ship.explosionFrame = 0;
    obstacles = [];
    lasers = [];
    fragments = [];
    lastObstacleTime = 0;
    gameOver = false;
    destroyedRocks = 0;
    powerUpActive = false;
    destroyedTrees = 0;
    laserMultiplier = 1;
}

function updateStars() {
    for (let s of stars) {
        s.y += s.speed;
        if (s.y > canvas.height) {
            s.y = 0;
            s.x = Math.random() * canvas.width;
        }
    }
}

function gameLoop(timestamp) {
    if (gameOver) {
        ctx.fillStyle = '#fff';
        ctx.font = '40px Arial';
        ctx.fillText('¡Game Over!', 90, canvas.height / 2);
        ctx.font = '20px Arial';
        ctx.fillText('Presiona Enter para reiniciar', 70, canvas.height / 2 + 40);
        return;
    }
    update();
    updateStars();
    if (!lastObstacleTime || timestamp - lastObstacleTime > obstacleInterval) {
        createObstacle();
        lastObstacleTime = timestamp;
    }
    updateObstacles();
    updateLasers();
    updateFragments();
    checkCollisions();
    draw();
    requestAnimationFrame(gameLoop);
}

// Eliminar toda la lógica de teclas para disparar y disparar automáticamente en el setInterval
setInterval(() => {
    if (!gameOver && !ship.destroyed && canShoot) {
        if (powerUpActive || laserMultiplier > 1) {
            // Disparo múltiple
            let n = Math.max(laserMultiplier, powerUpActive ? 2 : 1);
            let spread = 16;
            for (let i = 0; i < n; i++) {
                let offset = (i - (n - 1) / 2) * spread;
                lasers.push({
                    x: ship.x + ship.width / 2 - laserWidth / 2 + offset,
                    y: ship.y - laserHeight
                });
            }
        } else {
            lasers.push({
                x: ship.x + ship.width / 2 - laserWidth / 2,
                y: ship.y - laserHeight
            });
        }
        canShoot = false;
        lastShootTime = Date.now();
    }
    if (!canShoot && Date.now() - lastShootTime > shootCooldown) {
        canShoot = true;
    }
}, 20);

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') moveLeft = true;
    if (e.key === 'ArrowRight') moveRight = true;
});
document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') moveLeft = false;
    if (e.key === 'ArrowRight') moveRight = false;
});

requestAnimationFrame(gameLoop); 