const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Configuración de la nave espacial
const ship = {
    width: 44,
    height: 38,
    x: canvas.width / 2 - 22,
    y: canvas.height - 100,
    speed: 5,
    color: '#222', // cuerpo principal negro
    cockpitColor: '#b0bec5', // cabina gris claro
    wingColor: '#757575', // alas gris oscuro
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

// Explosión de pantalla completa
let screenExplosion = {
    active: false,
    particles: [],
    frame: 0
};

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
let destroyedChaserRocks = 0; // Nuevo contador para rocas perseguidoras
let laserMultiplier = 1;
const baseShootCooldown = 200;
let shootCooldown = baseShootCooldown;
let totalDestroyed = 0; // Contador total de obstáculos destruidos

// Fragmentos de destrucción de la nave
let shipDestructionFragments = [];

// Estado del escudo con dos usos
let shieldActive = false;
let shieldAvailable = true; // Siempre disponible
let shieldUses = 2; // Dos usos disponibles
let shieldDuration = 3000; // ms
let shieldEndTime = 0;

// Array de naves aliadas (múltiples naves)
let allyShips = [];

// Boss final
let boss = null;
let bossActive = false;
let bossLasers = [];

function drawShip() {
    if (!ship.alive) return;
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
        // Dibujar fragmentos de destrucción realistas
        drawShipDestructionFragments();
        return;
    }
    ctx.save();
    ctx.translate(ship.x + ship.width / 2, ship.y + ship.height / 2);
    // Cuerpo principal (negro con bordes azulados futuristas)
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(18, 16);
    ctx.lineTo(0, 10);
    ctx.lineTo(-18, 16);
    ctx.closePath();
    ctx.fillStyle = ship.color;
    ctx.shadowColor = '#00eaff';
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Borde exterior azul neón
    ctx.save();
    ctx.strokeStyle = '#00eaff';
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.7;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
    // Cabina (gris claro con brillo)
    ctx.beginPath();
    ctx.ellipse(0, -4, 7, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = ship.cockpitColor;
    ctx.globalAlpha = 0.92;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    // Alas (gris oscuro con borde azul)
    ctx.beginPath();
    ctx.moveTo(-18, 16);
    ctx.lineTo(-28, 24);
    ctx.lineTo(-10, 12);
    ctx.closePath();
    ctx.fillStyle = ship.wingColor;
    ctx.fill();
    ctx.save();
    ctx.strokeStyle = '#00eaff';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(18, 16);
    ctx.lineTo(28, 24);
    ctx.lineTo(10, 12);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.strokeStyle = '#00eaff';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
    // Fuego trasero potente (igual que antes)
    let fuegoLong = 38 + Math.sin(Date.now()/60)*6 + Math.random()*6;
    let fuegoAncho = 18 + Math.sin(Date.now()/80)*3 + Math.random()*2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-fuegoAncho/2, 18);
    ctx.lineTo(0, fuegoLong);
    ctx.lineTo(fuegoAncho/2, 18);
    ctx.closePath();
    let gradFuego = ctx.createLinearGradient(0, 18, 0, fuegoLong);
    gradFuego.addColorStop(0, 'rgba(0,255,255,0.7)');
    gradFuego.addColorStop(0.3, 'rgba(0,180,255,0.5)');
    gradFuego.addColorStop(0.7, 'rgba(0,80,255,0.3)');
    gradFuego.addColorStop(1, 'rgba(255,255,255,0.1)');
    ctx.fillStyle = gradFuego;
    ctx.shadowColor = '#00eaff';
    ctx.shadowBlur = 32;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-5, 18);
    ctx.lineTo(0, fuegoLong - 10);
    ctx.lineTo(5, 18);
    ctx.closePath();
    let gradNucleo = ctx.createLinearGradient(0, 18, 0, fuegoLong-10);
    gradNucleo.addColorStop(0, 'rgba(255,255,255,0.95)');
    gradNucleo.addColorStop(1, 'rgba(0,255,255,0.2)');
    ctx.fillStyle = gradNucleo;
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    ctx.restore();
}

function drawLaser(laser) {
    ctx.save();
    // Gradiente de energía para el láser
    let grad = ctx.createLinearGradient(laser.x, laser.y + laserHeight, laser.x, laser.y);
    grad.addColorStop(0, 'rgba(255, 80, 80, 0.1)'); // base suave
    grad.addColorStop(0.2, 'rgba(255, 80, 80, 0.5)');
    grad.addColorStop(0.5, 'rgba(255, 0, 0, 1)'); // centro intenso
    grad.addColorStop(0.8, 'rgba(255, 255, 80, 0.7)'); // energía amarilla
    grad.addColorStop(1, 'rgba(255,255,255,0.9)'); // punta brillante

    // Estela breve (fade out)
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 18;
    ctx.fillStyle = grad;
    ctx.fillRect(laser.x - 2, laser.y + 10, laserWidth + 4, laserHeight * 1.8);
    ctx.restore();

    // Cuerpo principal del láser
    ctx.save();
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 16;
    ctx.fillStyle = grad;
    ctx.fillRect(laser.x, laser.y, laserWidth, laserHeight);
    ctx.restore();

    // Resplandor animado alrededor del láser
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.2 * Math.sin(Date.now() / 80 + laser.x);
    ctx.shadowColor = '#ff2222';
    ctx.shadowBlur = 24;
    ctx.fillStyle = 'rgba(255, 40, 40, 0.2)';
    ctx.fillRect(laser.x - 4, laser.y - 6, laserWidth + 8, laserHeight + 12);
    ctx.restore();

    ctx.restore();
}

function drawObstacle(obstacle) {
    ctx.save();
    ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
    ctx.rotate(obstacle.angle);
    
    // Aura radioactiva para rocas perseguidoras
    if (obstacle.isChaser) {
        const pulse = Math.sin(Date.now() * 0.012 + obstacle.t) * 0.3 + 0.7;
        const auraSize = 28 + pulse * 16;
        
        // Aura exterior (rojo neón)
        ctx.beginPath();
        ctx.arc(0, 0, obstacle.width/2 + auraSize, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, obstacle.width/2 + auraSize);
        gradient.addColorStop(0, `rgba(255, 23, 68, ${0.13 * pulse})`);
        gradient.addColorStop(0.5, `rgba(255, 23, 68, ${0.07 * pulse})`);
        gradient.addColorStop(1, 'rgba(255, 23, 68, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Aura interior (más intensa)
        ctx.beginPath();
        ctx.arc(0, 0, obstacle.width/2 + auraSize/2, 0, Math.PI * 2);
        const innerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, obstacle.width/2 + auraSize/2);
        innerGradient.addColorStop(0, `rgba(255, 23, 68, ${0.35 * pulse})`);
        innerGradient.addColorStop(1, 'rgba(255, 23, 68, 0)');
        ctx.fillStyle = innerGradient;
        ctx.fill();
        
        // Partículas flotantes rojas
        for (let i = 0; i < 10; i++) {
            const angle = (Date.now() * 0.002 + i * Math.PI / 5) % (Math.PI * 2);
            const radius = obstacle.width/2 + auraSize + Math.sin(Date.now() * 0.005 + i) * 7;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            ctx.beginPath();
            ctx.arc(x, y, 2.5 + Math.sin(Date.now() * 0.01 + i) * 1.2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 23, 68, ${0.7 * pulse})`;
            ctx.shadowColor = '#ff1744';
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
    
    ctx.shadowColor = obstacle.isChaser ? '#ff1744' : '#888';
    ctx.shadowBlur = obstacle.isChaser ? 18 : 10;
    if (obstacle.type === 'rock') {
        // Roca futurista (roja neón si es perseguidora)
        ctx.fillStyle = obstacle.isChaser ? '#ff1744' : obstacle.color;
        ctx.beginPath();
        ctx.moveTo(-obstacle.width/2, -obstacle.height/2);
        ctx.lineTo(obstacle.width/2, -obstacle.height/2 + 5);
        ctx.lineTo(obstacle.width/2 - 5, obstacle.height/2);
        ctx.lineTo(-obstacle.width/2 + 7, obstacle.height/2 - 3);
        ctx.closePath();
        ctx.fill();
        // Grietas futuristas
        if (obstacle.isChaser) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(-obstacle.width/4, 0);
            ctx.lineTo(obstacle.width/4, obstacle.height/4);
            ctx.moveTo(0, -obstacle.height/4);
            ctx.lineTo(0, obstacle.height/4);
            ctx.stroke();
            // Líneas de energía
            ctx.strokeStyle = '#ff1744';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-obstacle.width/4, -obstacle.height/4);
            ctx.lineTo(obstacle.width/4, obstacle.height/4);
            ctx.moveTo(obstacle.width/4, -obstacle.height/4);
            ctx.lineTo(-obstacle.width/4, obstacle.height/4);
            ctx.stroke();
        } else {
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-obstacle.width/4, 0);
        ctx.lineTo(obstacle.width/4, obstacle.height/4);
        ctx.moveTo(0, -obstacle.height/4);
        ctx.lineTo(0, obstacle.height/4);
        ctx.stroke();
        }
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
        maxHp,
        isChaser: false
    });
}

function createChaserRocks() {
    // NO eliminar obstáculos existentes, solo agregar las piedras radiactivas
    for (let i = 0; i < 3; i++) {
        const width = 34 + Math.random() * 18;
        const height = 22 + Math.random() * 10;
        const startX = Math.random() * (canvas.width - width);
        const baseHp = 40;
        const reducedHp = Math.round(baseHp * 0.95); // 5% menos
        obstacles.push({
            x: startX,
            y: -height,
            width,
            height,
            color: '#ff1744',
            angle: Math.random() * Math.PI * 2,
            type: 'rock',
            baseX: startX,
            phase: 0,
            radius: 0,
            freq: 0,
            t: 0,
            hp: reducedHp,
            maxHp: reducedHp,
            isChaser: true,
            effectFrame: 0,
            chaserSpeed: 1.1
        });
    }
    // Agregar una nueva nave aliada cada vez
    createAllyShip();
    // Asegurar que todas las naves estén vivas
    ship.alive = true;
    ship.destroyed = false;
    ship.explosionFrame = 0;
    for (let allyShip of allyShips) {
        allyShip.alive = true;
        allyShip.destroyed = false;
        allyShip.explosionFrame = 0;
    }
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
        if (obs.isChaser && obs.chaserSpeed) {
            obs.y += obs.chaserSpeed;
        } else {
        obs.y += obstacleSpeed;
        }
        if (obs.isChaser) {
            // Las rocas perseguidoras se mueven hacia la nave
            const targetX = ship.x + ship.width / 2;
            const currentX = obs.x + obs.width / 2;
            const diffX = targetX - currentX;
            // Movimiento suave hacia la nave, pero siempre cayendo
            obs.x += diffX * 0.02; // Factor de persecución
        } else {
            // Movimiento circular normal
            obs.x = obs.baseX + Math.sin(obs.phase + obs.t * obs.freq) * obs.radius;
        }
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

function createScreenExplosion() {
    screenExplosion.active = true;
    screenExplosion.frame = 0;
    screenExplosion.particles = [];
    
    // Crear múltiples explosiones por toda la pantalla
    for (let explosion = 0; explosion < 8; explosion++) {
        const centerX = Math.random() * canvas.width;
        const centerY = Math.random() * canvas.height;
        
        // Crear partículas para cada explosión
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 12;
            const size = 4 + Math.random() * 12;
            
            screenExplosion.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                color: `hsl(${Math.random() * 60 + 10}, 100%, 50%)`, // Naranjas y rojos
                alpha: 1.0,
                decay: 0.015 + Math.random() * 0.02,
                explosionId: explosion
            });
        }
    }
}

function updateScreenExplosion() {
    if (!screenExplosion.active) return;
    
    screenExplosion.frame++;
    
    for (let particle of screenExplosion.particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.alpha -= particle.decay;
        particle.size *= 0.99;
        
        // Hacer que las partículas se expandan más
        particle.vx *= 1.02;
        particle.vy *= 1.02;
    }
    
    screenExplosion.particles = screenExplosion.particles.filter(p => p.alpha > 0);
    
    if (screenExplosion.particles.length === 0) {
        screenExplosion.active = false;
    }
}

function drawScreenExplosion() {
    if (!screenExplosion.active) return;
    
    // Fondo de explosión más intenso
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#ff2200';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    ctx.restore();
    
    // Partículas de explosión con más efectos
    for (let particle of screenExplosion.particles) {
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Efecto de resplandor adicional
        ctx.globalAlpha = particle.alpha * 0.5;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function triggerObstaclesDestruccionNatural(callback) {
    let i = 0;
    function destruirSiguiente() {
        if (i < obstacles.length) {
            // Simula destrucción normal: fragmentos y eliminación
            createFragments(obstacles[i]);
            obstacles.splice(i, 1);
            setTimeout(destruirSiguiente, 120); // Rápido, como destrucción normal
        } else {
            if (callback) callback();
        }
    }
    destruirSiguiente();
}

function createObstacleDestructionFragments(obs) {
    const cx = obs.x + obs.width / 2;
    const cy = obs.y + obs.height / 2;
    for (let i = 0; i < 32 + Math.random()*16; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3.5;
        const color = Math.random() < 0.5 ?
            `rgba(${180 + Math.random()*75},${30 + Math.random()*30},${30 + Math.random()*30},${0.85 - Math.random()*0.3})` : // rojo
            `rgba(${120 + Math.random()*80},${120 + Math.random()*80},${120 + Math.random()*80},${0.7 - Math.random()*0.2})`; // gris
        fragments.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 1.5 + Math.random() * 2.5,
            color: color,
            alpha: 1.0,
            decay: 0.014 + Math.random() * 0.012
        });
    }
}

function checkCollisions() {
    // Colisión nave principal
    if (ship.alive && !ship.destroyed) {
        for (let obs of obstacles.slice()) {
            if (
                ship.x < obs.x + obs.width &&
                ship.x + ship.width > obs.x &&
                ship.y < obs.y + obs.height &&
                ship.y + ship.height > obs.y
            ) {
                if (shieldActive) {
                    createObstacleDestructionFragments(obs);
                    obstacles.splice(obstacles.indexOf(obs), 1);
                    shieldActive = false;
                    continue;
                }
                ship.destroyed = true;
                ship.alive = false;
                ship.explosionFrame = 0;
                createShipDestructionFragments();
                setTimeout(() => {
                    triggerObstaclesDestruccionNatural(() => {
                        setTimeout(() => { 
                            gameOver = allyShips.every(s => !s.alive);
                        }, 700);
                    });
                }, 100);
            }
        }
    }
    // Colisión naves aliadas
    for (let allyShip of allyShips) {
        if (allyShip && allyShip.alive && !allyShip.destroyed) {
            for (let obs of obstacles.slice()) {
                if (
                    allyShip.x < obs.x + obs.width &&
                    allyShip.x + allyShip.width > obs.x &&
                    allyShip.y < obs.y + obs.height &&
                    allyShip.y + allyShip.height > obs.y
                ) {
                    if (shieldActive) {
                        createObstacleDestructionFragments(obs);
                        obstacles.splice(obstacles.indexOf(obs), 1);
                        shieldActive = false;
                        continue;
                    }
                    allyShip.destroyed = true;
                    allyShip.alive = false;
                    allyShip.explosionFrame = 0;
                    break;
                }
            }
        }
    }
    // Colisiones láser-obstáculo
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
                if (obs.hp > 0) {
                    // Fragmentos de desmoronamiento
                    for (let k = 0; k < 4 + Math.random()*2; k++) {
                        const angle = Math.random() * Math.PI * 2;
                        const speed = 0.8 + Math.random() * 1.8;
                        const color = Math.random() < 0.5 ?
                            `rgba(${180 + Math.random()*75},${30 + Math.random()*30},${30 + Math.random()*30},${0.7 - Math.random()*0.3})` :
                            `rgba(${120 + Math.random()*80},${120 + Math.random()*80},${120 + Math.random()*80},${0.5 - Math.random()*0.2})`;
                        fragments.push({
                            x: obs.x + obs.width/2,
                            y: obs.y + obs.height/2,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed,
                            radius: 1 + Math.random() * 1.5,
                            color: color,
                            alpha: 1.0,
                            decay: 0.018 + Math.random() * 0.012
                        });
                    }
                }
                if (obs.hp <= 0) {
                    totalDestroyed++;
                    if (totalDestroyed === 50 && !bossActive) {
                        createBoss();
                    }
                    if (totalDestroyed % 10 === 0 && totalDestroyed < 50) {
                        createChaserRocks();
                        if (laserMultiplier < 40) {
                            laserMultiplier = Math.min(laserMultiplier * 2, 40);
                        }
                    }
                    if (totalDestroyed === 10 && !allyShips.length) {
                        createAllyShip();
                    }
                    if (obs.isChaser) {
                        destroyedChaserRocks++;
                    }
                    createObstacleDestructionFragments(obs);
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
    ctx.fillText(`Total: ${totalDestroyed}  Radiactivas: ${destroyedChaserRocks}`, 18, 32);
    ctx.shadowBlur = 0;
    ctx.restore();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Si hay explosión activa, solo mostrar la explosión
    if (screenExplosion.active) {
        drawScreenExplosion();
        return;
    }
    
    // Si no hay explosión, mostrar el juego normal
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
    drawAllyShips();
    drawBoss();
    drawShield();
    drawShieldButton();
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
    updateAllyShips();
}

function resetGame() {
    ship.x = canvas.width / 2 - ship.width / 2;
    ship.y = canvas.height - 100;
    ship.destroyed = false;
    ship.explosionFrame = 0;
    ship.alive = true;
    obstacles = [];
    lasers = [];
    fragments = [];
    lastObstacleTime = 0;
    gameOver = false;
    destroyedRocks = 0;
    powerUpActive = false;
    destroyedTrees = 0;
    destroyedChaserRocks = 0;
    laserMultiplier = 1;
    totalDestroyed = 0;
    screenExplosion.active = false;
    shipDestructionFragments = [];
    shieldActive = false;
    shieldUses = 2;
    shieldEndTime = 0;
    allyShips = [];
    boss = null;
    bossActive = false;
    bossLasers = [];
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
        // Fondo negro para el game over
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '40px Arial';
        if (boss && !boss.alive) {
            ctx.fillText('¡VICTORIA!', 90, canvas.height / 2);
        } else {
            ctx.fillText('¡Game Over!', 90, canvas.height / 2);
        }
        ctx.font = '20px Arial';
        ctx.fillText('Presiona Ctrl+R para reiniciar', 70, canvas.height / 2 + 40);
        return;
    }
    
    update();
    updateStars();
    updateScreenExplosion(); // Actualizar explosión de pantalla
    if (!bossActive) {
        if (!lastObstacleTime || timestamp - lastObstacleTime > obstacleInterval) {
            createObstacle();
            lastObstacleTime = timestamp;
        }
        updateObstacles();
    } else {
        updateBoss();
        updateBossLasers();
    }
    updateLasers();
    updateFragments();
    updateShipDestructionFragments(); // Actualizar fragmentos de destrucción de la nave
    updateShield();
    checkCollisions();
    if (bossActive) {
        checkBossCollisions();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

setInterval(() => {
    if (!gameOver && canShoot) {
        if (powerUpActive || laserMultiplier > 1) {
            let n = Math.max(laserMultiplier, powerUpActive ? 2 : 1);
            let spread = 16;
            if (ship.alive && !ship.destroyed) {
            for (let i = 0; i < n; i++) {
                let offset = (i - (n - 1) / 2) * spread;
                lasers.push({
                    x: ship.x + ship.width / 2 - laserWidth / 2 + offset,
                    y: ship.y - laserHeight
                });
                }
            }
            for (let allyShip of allyShips) {
                if (allyShip && allyShip.alive && !allyShip.destroyed) {
                    for (let i = 0; i < n; i++) {
                        let offset = (i - (n - 1) / 2) * spread;
                        lasers.push({
                            x: allyShip.x + allyShip.width / 2 - laserWidth / 2 + offset,
                            y: allyShip.y - laserHeight
                        });
                    }
                }
            }
        } else {
            if (ship.alive && !ship.destroyed) {
            lasers.push({
                x: ship.x + ship.width / 2 - laserWidth / 2,
                y: ship.y - laserHeight
            });
            }
            for (let allyShip of allyShips) {
                if (allyShip && allyShip.alive && !allyShip.destroyed) {
                    lasers.push({
                        x: allyShip.x + allyShip.width / 2 - laserWidth / 2,
                        y: allyShip.y - laserHeight
                    });
                }
            }
        }
        canShoot = false;
        lastShootTime = Date.now();
    }
    if (!canShoot && Date.now() - lastShootTime > shootCooldown) {
        canShoot = true;
    }
}, 20);

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') moveLeft = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') moveRight = true;
    // Reiniciar solo con Ctrl+R
    if ((e.key === 'r' || e.key === 'R') && e.ctrlKey) {
        if (gameOver) {
            resetGame();
        }
    }
});
document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') moveLeft = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') moveRight = false;
});

function createShipDestructionFragments() {
    shipDestructionFragments = [];
    const cx = ship.x + ship.width / 2;
    const cy = ship.y + ship.height / 2;
    for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        const color = Math.random() < 0.5 ?
            `rgba(${180 + Math.random()*75},${30 + Math.random()*30},${30 + Math.random()*30},${0.85 - Math.random()*0.3})` : // rojo
            `rgba(${120 + Math.random()*80},${120 + Math.random()*80},${120 + Math.random()*80},${0.7 - Math.random()*0.2})`; // gris
        shipDestructionFragments.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 2 + Math.random() * 3.5,
            color: color,
            alpha: 1.0,
            decay: 0.012 + Math.random() * 0.012
        });
    }
}

function updateShipDestructionFragments() {
    for (let frag of shipDestructionFragments) {
        frag.x += frag.vx;
        frag.y += frag.vy;
        frag.alpha -= frag.decay;
        frag.vx *= 0.98;
        frag.vy *= 0.98;
    }
    shipDestructionFragments = shipDestructionFragments.filter(frag => frag.alpha > 0 && frag.y < canvas.height);
}

function drawShipDestructionFragments() {
    for (let frag of shipDestructionFragments) {
        ctx.save();
        ctx.globalAlpha = frag.alpha;
        ctx.fillStyle = frag.color;
        ctx.beginPath();
        ctx.arc(frag.x, frag.y, frag.radius, 0, Math.PI * 2);
        ctx.shadowColor = frag.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
    }
}

function createAllyShip() {
    const newAllyShip = {
        width: ship.width,
        height: ship.height,
        x: ship.x + 100 + (allyShips.length * 80), // Posición escalonada
        y: ship.y,
        speed: ship.speed,
        color: '#0d47a1', // azul oscuro
        cockpitColor: '#263238', // negro azulado
        wingColor: '#1976d2', // azul más claro
        fireColor: '#00eaff',
        laserColor: '#00eaff',
        alive: true,
        destroyed: false,
        explosionFrame: 0
    };
    allyShips.push(newAllyShip);
}

function drawAllyShips() {
    for (let allyShip of allyShips) {
        if (!allyShip || !allyShip.alive) continue;
        ctx.save();
        ctx.translate(allyShip.x + allyShip.width / 2, allyShip.y + allyShip.height / 2);
        // Cuerpo principal (azul con bordes neón)
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(18, 16);
        ctx.lineTo(0, 10);
        ctx.lineTo(-18, 16);
        ctx.closePath();
        ctx.fillStyle = allyShip.color;
        ctx.shadowColor = '#00eaff';
        ctx.shadowBlur = 18;
        ctx.fill();
        ctx.shadowBlur = 0;
        // Borde exterior azul neón
        ctx.save();
        ctx.strokeStyle = '#00eaff';
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
        // Cabina (negro azulado con brillo)
        ctx.beginPath();
        ctx.ellipse(0, -4, 7, 10, 0, 0, Math.PI * 2);
        ctx.fillStyle = allyShip.cockpitColor;
        ctx.globalAlpha = 0.92;
        ctx.shadowColor = '#00eaff';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        // Alas (azul claro con borde azul neón)
        ctx.beginPath();
        ctx.moveTo(-18, 16);
        ctx.lineTo(-28, 24);
        ctx.lineTo(-10, 12);
        ctx.closePath();
        ctx.fillStyle = allyShip.wingColor;
        ctx.fill();
        ctx.save();
        ctx.strokeStyle = '#00eaff';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
        ctx.beginPath();
        ctx.moveTo(18, 16);
        ctx.lineTo(28, 24);
        ctx.lineTo(10, 12);
        ctx.closePath();
        ctx.fill();
        ctx.save();
        ctx.strokeStyle = '#00eaff';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
        // Fuego trasero azul neón
        let fuegoLong = 38 + Math.sin(Date.now()/60)*6 + Math.random()*6;
        let fuegoAncho = 18 + Math.sin(Date.now()/80)*3 + Math.random()*2;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(-fuegoAncho/2, 18);
        ctx.lineTo(0, fuegoLong);
        ctx.lineTo(fuegoAncho/2, 18);
        ctx.closePath();
        let gradFuego = ctx.createLinearGradient(0, 18, 0, fuegoLong);
        gradFuego.addColorStop(0, 'rgba(0,255,255,0.7)');
        gradFuego.addColorStop(0.3, 'rgba(0,180,255,0.5)');
        gradFuego.addColorStop(0.7, 'rgba(0,80,255,0.3)');
        gradFuego.addColorStop(1, 'rgba(255,255,255,0.1)');
        ctx.fillStyle = gradFuego;
        ctx.shadowColor = '#00eaff';
        ctx.shadowBlur = 32;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(-5, 18);
        ctx.lineTo(0, fuegoLong - 10);
        ctx.lineTo(5, 18);
        ctx.closePath();
        let gradNucleo = ctx.createLinearGradient(0, 18, 0, fuegoLong-10);
        gradNucleo.addColorStop(0, 'rgba(255,255,255,0.95)');
        gradNucleo.addColorStop(1, 'rgba(0,255,255,0.2)');
        ctx.fillStyle = gradNucleo;
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
        ctx.restore();
    }
}

function updateAllyShips() {
    for (let allyShip of allyShips) {
        if (!allyShip || !allyShip.alive) continue;
        if (moveLeft) {
            allyShip.x -= allyShip.speed;
            if (allyShip.x < 0) allyShip.x = 0;
        }
        if (moveRight) {
            allyShip.x += allyShip.speed;
            if (allyShip.x + allyShip.width > canvas.width) allyShip.x = canvas.width - allyShip.width;
        }
    }
}

// Dibuja el escudo alrededor de todas las naves
function drawShield() {
    if (!shieldActive) return;
    // Escudo nave principal
    ctx.save();
    ctx.translate(ship.x + ship.width / 2, ship.y + ship.height / 2);
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,255,255,0.7)';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#00eaff';
    ctx.shadowBlur = 18;
    ctx.globalAlpha = 0.7 + 0.2 * Math.sin(Date.now()/120);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.restore();
    // Escudo naves aliadas
    for (let allyShip of allyShips) {
        if (allyShip && allyShip.alive) {
            ctx.save();
            ctx.translate(allyShip.x + allyShip.width / 2, allyShip.y + allyShip.height / 2);
            ctx.beginPath();
            ctx.arc(0, 0, 32, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0,255,255,0.7)';
            ctx.lineWidth = 6;
            ctx.shadowColor = '#00eaff';
            ctx.shadowBlur = 18;
            ctx.globalAlpha = 0.7 + 0.2 * Math.sin(Date.now()/120);
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            ctx.restore();
        }
    }
}

// Dibuja el botón de escudo con contador de usos
function drawShieldButton() {
    if (shieldUses <= 0) return;
    const btnX = canvas.width - 110;
    const btnY = canvas.height - 60;
    const btnW = 90;
    const btnH = 40;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#222';
    ctx.strokeStyle = '#00eaff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 12);
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#00eaff';
    ctx.globalAlpha = 1;
    ctx.fillText(`ESCUDO (${shieldUses})`, btnX + 8, btnY + 26);
    ctx.restore();
}

// Detectar click en el botón de escudo - sin tiempo límite
canvas.addEventListener('mousedown', (e) => {
    if (shieldUses <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const btnX = canvas.width - 110;
    const btnY = canvas.height - 60;
    const btnW = 90;
    const btnH = 40;
    if (mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH) {
        shieldActive = true;
        shieldUses--;
    }
});

// Actualizar estado del escudo - solo se desactiva al chocar
function updateShield() {
    // El escudo no se desactiva por tiempo, solo al chocar
    // if (shieldActive && Date.now() > shieldEndTime) {
    //     shieldActive = false;
    // }
}

// Crear el boss final
function createBoss() {
    boss = {
        width: 120,
        height: 80,
        x: canvas.width / 2 - 60,
        y: -80,
        speed: 1.5,
        hp: 100,
        maxHp: 100,
        alive: true,
        destroyed: false,
        explosionFrame: 0,
        lastShootTime: 0,
        shootCooldown: 800,
        moveDirection: 1,
        moveTimer: 0
    };
    bossActive = true;
    
    // Eliminar todos los obstáculos existentes
    obstacles = [];
    
    // Crear dos naves aliadas para la batalla final
    createAllyShip();
    createAllyShip();
    
    // Asegurar que todas las naves estén vivas
    ship.alive = true;
    ship.destroyed = false;
    ship.explosionFrame = 0;
    for (let allyShip of allyShips) {
        allyShip.alive = true;
        allyShip.destroyed = false;
        allyShip.explosionFrame = 0;
    }
}

// Dibujar el boss
function drawBoss() {
    if (!boss || !boss.alive) return;
    
    ctx.save();
    ctx.translate(boss.x + boss.width / 2, boss.y + boss.height / 2);
    
    // Cuerpo principal del boss (rojo oscuro)
    ctx.beginPath();
    ctx.moveTo(-boss.width/2, -boss.height/2);
    ctx.lineTo(boss.width/2, -boss.height/2);
    ctx.lineTo(boss.width/2 - 10, boss.height/2);
    ctx.lineTo(-boss.width/2 + 10, boss.height/2);
    ctx.closePath();
    ctx.fillStyle = '#8b0000';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Borde rojo neón
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Cabina del boss
    ctx.beginPath();
    ctx.ellipse(0, -10, 25, 15, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4444';
    ctx.globalAlpha = 0.8;
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Alas del boss
    ctx.beginPath();
    ctx.moveTo(-boss.width/2, 0);
    ctx.lineTo(-boss.width/2 - 30, 20);
    ctx.lineTo(-boss.width/2 + 10, 10);
    ctx.closePath();
    ctx.fillStyle = '#660000';
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(boss.width/2, 0);
    ctx.lineTo(boss.width/2 + 30, 20);
    ctx.lineTo(boss.width/2 - 10, 10);
    ctx.closePath();
    ctx.fill();
    
    // Cañones del boss
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(-15, boss.height/2, 8, 15);
    ctx.fillRect(7, boss.height/2, 8, 15);
    
    // Barra de vida del boss
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#222';
    ctx.fillRect(-boss.width/2, -boss.height/2 - 15, boss.width, 8);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(-boss.width/2, -boss.height/2 - 15, boss.width * (boss.hp/boss.maxHp), 8);
    ctx.globalAlpha = 1;
    ctx.restore();
    
    ctx.restore();
}

// Actualizar el boss
function updateBoss() {
    if (!boss || !boss.alive) return;
    
    // Movimiento del boss
    boss.moveTimer++;
    if (boss.moveTimer > 120) {
        boss.moveDirection *= -1;
        boss.moveTimer = 0;
    }
    
    boss.x += boss.speed * boss.moveDirection;
    
    // Limitar movimiento del boss
    if (boss.x < 0) boss.x = 0;
    if (boss.x + boss.width > canvas.width) boss.x = canvas.width - boss.width;
    
    // Disparar del boss
    if (Date.now() - boss.lastShootTime > boss.shootCooldown) {
        bossLasers.push({
            x: boss.x + boss.width/2 - 4,
            y: boss.y + boss.height,
            width: 8,
            height: 20,
            speed: 4
        });
        boss.lastShootTime = Date.now();
    }
}

// Dibujar láseres del boss
function drawBossLasers() {
    for (let laser of bossLasers) {
        ctx.save();
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 15;
        ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

// Actualizar láseres del boss
function updateBossLasers() {
    for (let laser of bossLasers) {
        laser.y += laser.speed;
    }
    bossLasers = bossLasers.filter(laser => laser.y < canvas.height);
}

// Verificar colisiones con el boss
function checkBossCollisions() {
    if (!boss || !boss.alive) return;
    
    // Colisión láseres del jugador con el boss
    for (let i = lasers.length - 1; i >= 0; i--) {
        const laser = lasers[i];
        if (
            laser.x < boss.x + boss.width &&
            laser.x + laserWidth > boss.x &&
            laser.y < boss.y + boss.height &&
            laser.y + laserHeight > boss.y
        ) {
            boss.hp--;
            if (boss.hp <= 0) {
                boss.destroyed = true;
                boss.alive = false;
                bossActive = false;
                // Crear explosión masiva del boss
                createBossExplosion();
                setTimeout(() => {
                    gameOver = true;
                }, 2000);
            }
            lasers.splice(i, 1);
        }
    }
    
    // Colisión láseres del boss con las naves
    for (let i = bossLasers.length - 1; i >= 0; i--) {
        const bossLaser = bossLasers[i];
        
        // Colisión con nave principal
        if (ship.alive && !ship.destroyed) {
            if (
                bossLaser.x < ship.x + ship.width &&
                bossLaser.x + bossLaser.width > ship.x &&
                bossLaser.y < ship.y + ship.height &&
                bossLaser.y + bossLaser.height > ship.y
            ) {
                if (shieldActive) {
                    bossLasers.splice(i, 1);
                    shieldActive = false;
                    continue;
                }
                ship.destroyed = true;
                ship.alive = false;
                ship.explosionFrame = 0;
                createShipDestructionFragments();
                bossLasers.splice(i, 1);
                continue;
            }
        }
        
        // Colisión con naves aliadas
        for (let allyShip of allyShips) {
            if (allyShip && allyShip.alive && !allyShip.destroyed) {
                if (
                    bossLaser.x < allyShip.x + allyShip.width &&
                    bossLaser.x + bossLaser.width > allyShip.x &&
                    bossLaser.y < allyShip.y + allyShip.height &&
                    bossLaser.y + bossLaser.height > allyShip.y
                ) {
                    if (shieldActive) {
                        bossLasers.splice(i, 1);
                        shieldActive = false;
                        break;
                    }
                    allyShip.destroyed = true;
                    allyShip.alive = false;
                    allyShip.explosionFrame = 0;
                    bossLasers.splice(i, 1);
                    break;
                }
            }
        }
    }
}

// Crear explosión masiva del boss
function createBossExplosion() {
    for (let i = 0; i < 100; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 8;
        const color = Math.random() < 0.5 ?
            `rgba(255, 0, 0, ${0.8 - Math.random()*0.3})` :
            `rgba(255, 255, 0, ${0.7 - Math.random()*0.2})`;
        fragments.push({
            x: boss.x + boss.width/2,
            y: boss.y + boss.height/2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 3 + Math.random() * 4,
            color: color,
            alpha: 1.0,
            decay: 0.008 + Math.random() * 0.008
        });
    }
}

requestAnimationFrame(gameLoop); 