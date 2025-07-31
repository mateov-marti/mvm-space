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
    explosionFrame: 0,
    maxHp: 15, // 15% de vida
    hp: 0 // vida actual, inicia en 0
};

// Láseres
let lasers = [];
let laserSpeed = 14; // Antes: 8. Ahora los disparos van más rápido
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

// Efectos de impacto del láser
let laserImpactEffects = [];

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
let victory = false;

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

// Estado del piloto automático
let autoPilotActive = false;
let autoPilotTargetX = 0;

// Láseres especiales para piloto automático
let specialLasers = [];
let specialLaserActive = false;

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
    
    // Efectos de partículas de energía alrededor del láser
    for (let i = 0; i < 8; i++) {
        const angle = (Date.now() * 0.01 + i * Math.PI / 4) % (Math.PI * 2);
        const radius = 12 + Math.sin(Date.now() * 0.02 + i) * 4;
        const x = laser.x + laserWidth/2 + Math.cos(angle) * radius;
        const y = laser.y + laserHeight/2 + Math.sin(angle) * radius;
        
        ctx.save();
        ctx.globalAlpha = 0.6 + 0.3 * Math.sin(Date.now() * 0.015 + i);
        ctx.fillStyle = `rgba(255, ${100 + Math.random()*155}, 0, 0.8)`;
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(x, y, 2 + Math.sin(Date.now() * 0.01 + i) * 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    // Gradiente de energía mejorado para el láser
    let grad = ctx.createLinearGradient(laser.x, laser.y + laserHeight, laser.x, laser.y);
    grad.addColorStop(0, 'rgba(255, 40, 40, 0.2)'); // base más suave
    grad.addColorStop(0.1, 'rgba(255, 60, 60, 0.6)');
    grad.addColorStop(0.3, 'rgba(255, 0, 0, 0.9)'); // centro intenso
    grad.addColorStop(0.6, 'rgba(255, 255, 0, 1)'); // energía amarilla brillante
    grad.addColorStop(0.8, 'rgba(255, 255, 255, 1)'); // punta blanca
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.95)'); // extremo brillante

    // Estela de energía mejorada (más larga y brillante)
    ctx.save();
    ctx.globalAlpha = 0.4 + 0.2 * Math.sin(Date.now() / 60);
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 25;
    ctx.fillStyle = grad;
    ctx.fillRect(laser.x - 3, laser.y + 15, laserWidth + 6, laserHeight * 2.5);
    ctx.restore();

    // Cuerpo principal del láser con más efectos
    ctx.save();
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 20;
    ctx.fillStyle = grad;
    ctx.fillRect(laser.x, laser.y, laserWidth, laserHeight);
    ctx.restore();

    // Resplandor animado más intenso alrededor del láser
    ctx.save();
    ctx.globalAlpha = 0.6 + 0.3 * Math.sin(Date.now() / 50 + laser.x);
    ctx.shadowColor = '#ff2222';
    ctx.shadowBlur = 35;
    ctx.fillStyle = 'rgba(255, 40, 40, 0.3)';
    ctx.fillRect(laser.x - 6, laser.y - 8, laserWidth + 12, laserHeight + 16);
    ctx.restore();

    // Efecto de ondas de energía
    ctx.save();
    ctx.globalAlpha = 0.3 + 0.2 * Math.sin(Date.now() / 40);
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(laser.x - 8, laser.y + laserHeight/2);
    ctx.lineTo(laser.x + laserWidth + 8, laser.y + laserHeight/2);
    ctx.stroke();
    ctx.restore();

    // Efecto de chispas en la punta del láser
    for (let i = 0; i < 5; i++) {
        const sparkX = laser.x + laserWidth/2 + (Math.random() - 0.5) * 8;
        const sparkY = laser.y + (Math.random() - 0.5) * 4;
        
        ctx.save();
        ctx.globalAlpha = 0.8 + 0.2 * Math.random();
        ctx.fillStyle = `rgba(255, 255, ${100 + Math.random()*155}, 1)`;
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 1 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    ctx.restore();
}

function drawObstacle(obstacle) {
    ctx.save();
    ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
    ctx.rotate(obstacle.angle);
    
    // Aura radioactiva para soles perseguidores
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
    for (let i = 0; i < 2; i++) { // Solo 2
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

function createLaserImpactEffect(x, y) {
    // Crear múltiples efectos de impacto
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        const size = 3 + Math.random() * 6;
        
        laserImpactEffects.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: size,
            color: `hsl(${Math.random() * 60 + 10}, 100%, 60%)`, // Naranjas y rojos
            alpha: 1.0,
            decay: 0.02 + Math.random() * 0.015,
            type: Math.random() < 0.5 ? 'spark' : 'explosion'
        });
    }
    
    // Crear ondas de choque
    for (let i = 0; i < 3; i++) {
        laserImpactEffects.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            size: 10 + i * 15,
            color: '#ff6600',
            alpha: 0.8,
            decay: 0.03,
            type: 'shockwave',
            waveIndex: i
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

function updateLaserImpactEffects() {
    for (let effect of laserImpactEffects) {
        if (effect.type === 'shockwave') {
            effect.size += 2;
        } else {
            effect.x += effect.vx;
            effect.y += effect.vy;
            effect.vx *= 0.95;
            effect.vy *= 0.95;
        }
        effect.alpha -= effect.decay;
    }
    laserImpactEffects = laserImpactEffects.filter(effect => effect.alpha > 0);
}

function drawLaserImpactEffects() {
    for (let effect of laserImpactEffects) {
        ctx.save();
        ctx.globalAlpha = effect.alpha;
        
        if (effect.type === 'shockwave') {
            // Dibujar ondas de choque
            ctx.strokeStyle = effect.color;
            ctx.lineWidth = 3 - effect.waveIndex;
            ctx.shadowColor = effect.color;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Dibujar partículas de explosión
            ctx.fillStyle = effect.color;
            ctx.shadowColor = effect.color;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
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
    // Colisiones de la nave principal
    if (ship.alive && !ship.destroyed) {
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            if (
                ship.x < obs.x + obs.width &&
                ship.x + ship.width > obs.x &&
                ship.y < obs.y + obs.height &&
                ship.y + ship.height > obs.y
            ) {
                if (shieldActive) {
                    shieldActive = false;
                    shieldEndTime = 0;
                } else if (autoPilotActive) {
                    // Con piloto automático, la nave destruye el obstáculo y continúa
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
                    // Solo crear nave aliada si no hay ninguna viva (máximo 1)
                    let aliveAllyShips = allyShips.filter(ship => ship && ship.alive);
                    if (totalDestroyed === 10 && aliveAllyShips.length === 0) {
                        createAllyShip();
                    }
                    if (obs.isChaser) {
                        destroyedChaserRocks++;
                    }
                    createObstacleDestructionFragments(obs);
                    obstacles.splice(i, 1);
                    laserSpeed += 1; // Aumentar velocidad del láser
                } else {
                    if (bossActive && ship.hp > 0) {
                        if (ship.hp > 1) {
                            ship.hp -= 1;
                        } else {
                            ship.hp = 0;
                            ship.destroyed = true;
                            ship.explosionFrame = 0;
                            createShipDestructionFragments(ship);
                            ship.alive = false;
                        }
                    } else {
                        ship.destroyed = true;
                        ship.explosionFrame = 0;
                        createShipDestructionFragments(ship);
                        ship.alive = false;
                    }
                }
                break;
            }
        }
    }

    // Colisiones de naves aliadas
    for (let allyShip of allyShips) {
        if (allyShip && allyShip.alive && !allyShip.destroyed) {
            for (let i = obstacles.length - 1; i >= 0; i--) {
                const obs = obstacles[i];
                if (
                    allyShip.x < obs.x + obs.width &&
                    allyShip.x + allyShip.width > obs.x &&
                    allyShip.y < obs.y + obs.height &&
                    allyShip.y + allyShip.height > obs.y
                ) {
                    if (shieldActive) {
                        shieldActive = false;
                        shieldEndTime = 0;
                    } else if (autoPilotActive) {
                        // Con piloto automático, las naves aliadas también destruyen obstáculos
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
                        // Solo crear nave aliada si no hay ninguna viva (máximo 1)
                        let aliveAllyShips = allyShips.filter(ship => ship && ship.alive);
                        if (totalDestroyed === 10 && aliveAllyShips.length === 0) {
                            createAllyShip();
                        }
                        if (obs.isChaser) {
                            destroyedChaserRocks++;
                        }
                        createObstacleDestructionFragments(obs);
                        obstacles.splice(i, 1);
                        laserSpeed += 1; // Aumentar velocidad del láser
                    } else {
                        allyShip.destroyed = true;
                        allyShip.explosionFrame = 0;
                        createShipDestructionFragments(allyShip);
                        allyShip.alive = false;
                        gameOver = true; // Activar game over al destruirse la nave
                    }
                    break;
                }
            }
        }
    }

    // Colisiones de láseres con obstáculos
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
                // Aumentar el daño del láser - ahora hace 3 veces más daño
                obs.hp -= 3;
                // Crear efecto de explosión de impacto
                createLaserImpactEffect(obs.x + obs.width/2, obs.y + obs.height/2);
                
                if (obs.hp <= 0) {
                    // Si es un sol que puede dividirse, crear dos soles más pequeños
                    if (obs.type === 'sun' && obs.canSplit) {
                        createSplitSuns(obs);
                    }
                    
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
                    // Solo crear nave aliada si no hay ninguna viva (máximo 1)
                    let aliveAllyShips = allyShips.filter(ship => ship && ship.alive);
                    if (totalDestroyed === 10 && aliveAllyShips.length === 0) {
                        createAllyShip();
                    }
                    if (obs.isChaser) {
                        destroyedChaserRocks++;
                    }
                    createObstacleDestructionFragments(obs);
                    obstacles.splice(i, 1);
                    laserSpeed += 1; // Aumentar velocidad del láser
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
    ctx.fillText(`Total: ${totalDestroyed}  Soles Radiactivos: ${destroyedChaserRocks}`, 18, 32);
    // Barra de vida de la nave
    ctx.fillStyle = '#222';
    ctx.fillRect(18, 44, 120, 12);
    ctx.fillStyle = '#00eaff';
    ctx.fillRect(18, 44, 120 * (ship.hp / ship.maxHp), 12);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 44, 120, 12);
    ctx.font = '14px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Vida: ${ship.hp}/${ship.maxHp}`, 22, 54);
    ctx.shadowBlur = 0;
    ctx.restore();
}

function drawShipHpBar() {
    const barWidth = 160;
    const barHeight = 16;
    const x = canvas.width / 2 - barWidth / 2;
    const y = 18; // Arriba de la pantalla
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#222';
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.fillStyle = '#00eaff';
    ctx.fillRect(x, y, barWidth * (ship.hp / ship.maxHp), barHeight);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);
    ctx.globalAlpha = 1;
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
    if (bossActive) drawShipHpBar();
    for (let frag of fragments) {
        drawFragment(frag);
    }
    drawLaserImpactEffects(); // Dibujar efectos de impacto del láser
    for (let obs of obstacles) {
        drawObstacle(obs);
    }
    for (let laser of lasers) {
        drawLaser(laser);
    }
    drawSpecialLasers();
    drawShip();
    drawAllyShips();
    drawBoss();
    drawShield();
    drawShieldButton();
    drawAutoPilotButton();
}

function update() {
    if (moveLeft && !autoPilotActive) {
        ship.x -= ship.speed;
        if (ship.x < 0) ship.x = 0;
    }
    if (moveRight && !autoPilotActive) {
        ship.x += ship.speed;
        if (ship.x + ship.width > canvas.width) ship.x = canvas.width - ship.width;
    }
    if (ship.destroyed && ship.explosionFrame < 15) {
        ship.explosionFrame++;
    }
    // Activar gameOver solo después de la animación de explosión
    if (ship.destroyed && ship.explosionFrame >= 15 && !gameOver) {
        gameOver = true;
    }
    updateAllyShips();
    updateAutoPilot();
}

function resetGame() {
    ship.x = canvas.width / 2 - ship.width / 2;
    ship.y = canvas.height - 100;
    ship.destroyed = false;
    ship.explosionFrame = 0;
    ship.alive = true;
    ship.hp = 0;
    obstacles = [];
    lasers = [];
    specialLasers = [];
    fragments = [];
    laserImpactEffects = [];
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
    autoPilotActive = false;
    autoPilotTargetX = 0;
    specialLaserActive = false;
    victory = false;
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
        if (victory) {
            ctx.fillText('¡HAS GANADO!', 70, canvas.height / 2);
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
    // Los obstáculos siguen apareciendo incluso con el boss
    if (!bossActive && (!lastObstacleTime || timestamp - lastObstacleTime > obstacleInterval)) {
        createObstacle();
        lastObstacleTime = timestamp;
    }
    updateObstacles();
    
    // Actualizar boss si está activo
    if (bossActive) {
        updateBoss();
        updateBossLasers();
    }
    updateLasers();
    updateSpecialLasers();
    updateFragments();
    updateLaserImpactEffects(); // Actualizar efectos de impacto del láser
    updateShipDestructionFragments(); // Actualizar fragmentos de destrucción de la nave
    updateShield();
    checkCollisions();
    checkSpecialLaserCollisions();
    if (bossActive) {
        checkBossCollisions();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

setInterval(() => {
    if (!gameOver && canShoot) {
        if ((autoPilotActive && obstacles.some(o => o.isChaser)) || bossActive) {
            createSpecialLaser();
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
}, 200); // Ritmo tun tun tun (200ms)

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
    // Solo crear nave aliada si hay menos de 1 nave aliada viva (máximo 2 naves total)
    let aliveAllyShips = allyShips.filter(ship => ship && ship.alive);
    if (aliveAllyShips.length >= 1) return; // Máximo 1 nave aliada
    
    allyShips.push({
        x: canvas.width / 2 - ship.width / 2 + 60,
        y: canvas.height - 100,
        width: ship.width,
        height: ship.height,
        speed: ship.speed,
        alive: true,
        destroyed: false,
        explosionFrame: 0
    });
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
        width: 200,
        height: 150,
        x: canvas.width / 2 - 100,
        y: -200, // Empieza fuera de la pantalla
        speed: 1,
        hp: Math.round(50 * 1.20), // 20% más vida
        maxHp: Math.round(50 * 1.20),
        alive: true,
        destroyed: false,
        explosionFrame: 0,
        lastShootTime: 0,
        shootCooldown: 800,
        moveDirection: 1,
        moveTimer: 0,
        targetY: 50 // Posición final en Y
    };
    bossActive = true;
    // Inicializar vida de la nave solo cuando aparece el boss
    ship.hp = ship.maxHp;
    
    // NO eliminar obstáculos existentes - que sigan apareciendo
    // NO crear naves aliadas adicionales - mantener las existentes
    // Las naves pequeñas siguen funcionando normalmente
}

// Dibujar el boss
function drawBoss() {
    if (!boss || !boss.alive) return;
    ctx.save();
    ctx.translate(boss.x + boss.width / 2, boss.y + boss.height / 2);

    // Sombra y resplandor general
    ctx.save();
    ctx.shadowColor = '#00eaff';
    ctx.shadowBlur = 60;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(0, 20, boss.width * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,255,255,0.18)';
    ctx.fill();
    ctx.restore();

    // Cuerpo principal: núcleo central con gradiente neón
    let gradCuerpo = ctx.createRadialGradient(0, 0, 30, 0, 0, boss.width/2);
    gradCuerpo.addColorStop(0, '#222');
    gradCuerpo.addColorStop(0.4, '#00eaff');
    gradCuerpo.addColorStop(0.7, '#ffe600');
    gradCuerpo.addColorStop(1, '#111');
    ctx.beginPath();
    ctx.ellipse(0, 0, boss.width/2, boss.height/2, 0, 0, Math.PI * 2);
    ctx.fillStyle = gradCuerpo;
    ctx.shadowColor = '#ffe600';
    ctx.shadowBlur = 30;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Núcleo energético central
    ctx.save();
    let gradNucleo = ctx.createRadialGradient(0, 0, 0, 0, 0, 38);
    gradNucleo.addColorStop(0, '#fff');
    gradNucleo.addColorStop(0.4, '#00eaff');
    gradNucleo.addColorStop(1, 'rgba(0,255,255,0)');
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.fillStyle = gradNucleo;
    ctx.globalAlpha = 0.85 + 0.1 * Math.sin(Date.now()/200);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    // Anillos giratorios exteriores
    for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate(Date.now()/1200 + i * Math.PI/3);
        ctx.beginPath();
        ctx.ellipse(0, 0, boss.width/2 + 18 + i*12, boss.height/2 + 8 + i*8, 0, 0, Math.PI * 2);
        ctx.strokeStyle = i % 2 === 0 ? '#00eaff' : '#ffe600';
        ctx.lineWidth = 3.5 - i;
        ctx.globalAlpha = 0.18 + 0.08 * Math.sin(Date.now()/600 + i);
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 16;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // Alas/faldones laterales con detalles neón
    ctx.save();
    ctx.rotate(Math.sin(Date.now()/800)*0.08);
    ctx.beginPath();
    ctx.moveTo(-boss.width/2, 0);
    ctx.lineTo(-boss.width/2 - 50, 40);
    ctx.lineTo(-boss.width/2 + 30, boss.height/2 - 10);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,238,255,0.25)';
    ctx.shadowColor = '#00eaff';
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
    ctx.save();
    ctx.rotate(-Math.sin(Date.now()/800)*0.08);
    ctx.beginPath();
    ctx.moveTo(boss.width/2, 0);
    ctx.lineTo(boss.width/2 + 50, 40);
    ctx.lineTo(boss.width/2 - 30, boss.height/2 - 10);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,230,0,0.18)';
    ctx.shadowColor = '#ffe600';
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Detalles de "circuitos" y líneas de energía
    for (let i = 0; i < 8; i++) {
        ctx.save();
        ctx.rotate((Math.PI * 2 * i) / 8 + Math.sin(Date.now()/1000 + i));
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(boss.width/2 + 18, 0);
        ctx.strokeStyle = i % 2 === 0 ? '#00eaff' : '#ffe600';
        ctx.lineWidth = 2.2;
        ctx.globalAlpha = 0.22 + 0.12 * Math.abs(Math.sin(Date.now()/700 + i));
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // Cabina central brillante
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, -boss.height/4, 38, 22, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.7;
    ctx.shadowColor = '#00eaff';
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.restore();

    // Barra de vida del boss
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#222';
    ctx.fillRect(-boss.width/2, -boss.height/2 - 22, boss.width, 12);
    ctx.fillStyle = '#00eaff';
    ctx.fillRect(-boss.width/2, -boss.height/2 - 22, boss.width * (boss.hp/boss.maxHp), 12);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-boss.width/2, -boss.height/2 - 22, boss.width, 12);
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.restore();
}

// Actualizar el boss
function updateBoss() {
    if (!boss || !boss.alive) return;
    
    // Movimiento de entrada del boss
    if (boss.y < boss.targetY) {
        boss.y += boss.speed;
    } else {
        // Movimiento hacia abajo constante
        boss.y += boss.speed * 0.7; // Puedes ajustar la velocidad aquí
        // Movimiento lateral una vez en posición
        boss.moveTimer++;
        if (boss.moveTimer > 120) {
            boss.moveDirection *= -1;
            boss.moveTimer = 0;
        }
        boss.x += boss.speed * boss.moveDirection;
        if (boss.x < 0) boss.x = 0;
        if (boss.x + boss.width > canvas.width) boss.x = canvas.width - boss.width;
    }
    // (Eliminado: disparo de láser)
}

// Dibujar láseres del boss
function drawBossLasers() {}

// Actualizar láseres del boss
function updateBossLasers() {}

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
                createBossExplosion();
                // Marcar victoria
                victory = true;
                gameOver = true;
            }
            lasers.splice(i, 1);
        }
    }
    // Colisión física boss-nave principal
    if (ship.alive && !ship.destroyed) {
        if (
            boss.x < ship.x + ship.width &&
            boss.x + boss.width > ship.x &&
            boss.y < ship.y + ship.height &&
            boss.y + boss.height > ship.y
        ) {
            ship.destroyed = true;
            ship.alive = false;
            ship.explosionFrame = 0;
            createShipDestructionFragments();
            gameOver = true;
            victory = false;
        }
    }
    // Colisión física boss-naves aliadas
    for (let allyShip of allyShips) {
        if (allyShip && allyShip.alive && !allyShip.destroyed) {
            if (
                boss.x < allyShip.x + allyShip.width &&
                boss.x + boss.width > allyShip.x &&
                boss.y < allyShip.y + allyShip.height &&
                boss.y + boss.height > allyShip.y
            ) {
                allyShip.destroyed = true;
                allyShip.alive = false;
                allyShip.explosionFrame = 0;
                gameOver = true;
                victory = false;
            }
        }
    }
    // Si todas las naves están destruidas, game over
    let allDestroyed = !ship.alive && allyShips.every(s => !s.alive);
    if (allDestroyed) {
        gameOver = true;
        victory = false;
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

// Función para activar/desactivar piloto automático
function toggleAutoPilot() {
    autoPilotActive = !autoPilotActive;
    if (autoPilotActive) {
        autoPilotTargetX = ship.x;
    }
}

// Función para el piloto automático
function updateAutoPilot() {
    if (!autoPilotActive) return;
    
    // Encontrar el obstáculo más cercano y peligroso
    let closestObstacle = null;
    let minDistance = Infinity;
    
    for (let obs of obstacles) {
        if (obs.y + obs.height > ship.y - 50 && obs.y < ship.y + ship.height + 50) {
            const distance = Math.abs(obs.x + obs.width/2 - (ship.x + ship.width/2));
            if (distance < minDistance) {
                minDistance = distance;
                closestObstacle = obs;
            }
        }
    }
    
    // Si hay un obstáculo cercano, esquivarlo
    if (closestObstacle && minDistance < 100) {
        const obstacleCenterX = closestObstacle.x + closestObstacle.width/2;
        const shipCenterX = ship.x + ship.width/2;
        
        if (obstacleCenterX > shipCenterX) {
            // Obstáculo a la derecha, moverse a la izquierda
            autoPilotTargetX = Math.max(0, ship.x - 30);
        } else {
            // Obstáculo a la izquierda, moverse a la derecha
            autoPilotTargetX = Math.min(canvas.width - ship.width, ship.x + 30);
        }
    } else {
        // Sin obstáculos cercanos, moverse hacia el centro
        const centerX = canvas.width / 2 - ship.width / 2;
        autoPilotTargetX = centerX + Math.sin(Date.now() / 2000) * 100;
        autoPilotTargetX = Math.max(0, Math.min(canvas.width - ship.width, autoPilotTargetX));
    }
    
    // Mover la nave hacia el objetivo
    if (ship.x < autoPilotTargetX - 5) {
        ship.x += ship.speed;
    } else if (ship.x > autoPilotTargetX + 5) {
        ship.x -= ship.speed;
    }
    
    // Mover naves aliadas también
    for (let allyShip of allyShips) {
        if (allyShip && allyShip.alive) {
            const allyTargetX = ship.x + (allyShips.indexOf(allyShip) + 1) * 80;
            if (allyShip.x < allyTargetX - 5) {
                allyShip.x += allyShip.speed;
            } else if (allyShip.x > allyTargetX + 5) {
                allyShip.x -= allyShip.speed;
            }
        }
    }
    
    // Si hay boss, apuntar hacia él
    if (boss && boss.alive) {
        const bossCenterX = boss.x + boss.width/2;
        const shipCenterX = ship.x + ship.width/2;
        
        if (bossCenterX > shipCenterX + 20) {
            ship.x += ship.speed;
        } else if (bossCenterX < shipCenterX - 20) {
            ship.x -= ship.speed;
        }
    }
}

// Dibuja el botón de piloto automático
function drawAutoPilotButton() {
    const btnX = 20;
    const btnY = canvas.height - 60;
    const btnW = 140;
    const btnH = 40;
    
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = autoPilotActive ? '#ff4444' : '#222';
    ctx.strokeStyle = autoPilotActive ? '#ff0000' : '#00eaff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 12);
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = autoPilotActive ? '#fff' : '#00eaff';
    ctx.globalAlpha = 1;
    ctx.fillText(autoPilotActive ? 'AUTO: ON' : 'PILOTO AUTO', btnX + 8, btnY + 26);
    ctx.restore();
}

// Detectar click en el botón de piloto automático
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    // Botón de escudo
    const shieldBtnX = canvas.width - 110;
    const shieldBtnY = canvas.height - 60;
    const shieldBtnW = 90;
    const shieldBtnH = 40;
    
    if (mx >= shieldBtnX && mx <= shieldBtnX + shieldBtnW && my >= shieldBtnY && my <= shieldBtnY + shieldBtnH) {
        if (shieldUses > 0) {
            shieldActive = true;
            shieldUses--;
        }
        return;
    }
    
    // Botón de piloto automático
    const autoBtnX = 20;
    const autoBtnY = canvas.height - 60;
    const autoBtnW = 140;
    const autoBtnH = 40;
    
    if (mx >= autoBtnX && mx <= autoBtnX + autoBtnW && my >= autoBtnY && my <= autoBtnY + autoBtnH) {
        toggleAutoPilot();
        return;
    }
});

// Crear láser especial para piloto automático
function createSpecialLaser() {
    if (!autoPilotActive && !bossActive) return;
    // Láser especial más ancho y potente
    specialLasers.push({
        x: ship.x + ship.width / 2 - 8,
        y: ship.y - 30,
        width: 16,
        height: 30,
        speed: 10,
        damage: 5 // Hace 5 veces más daño
    });
    // Láseres especiales para naves aliadas también
    for (let allyShip of allyShips) {
        if (allyShip && allyShip.alive) {
            specialLasers.push({
                x: allyShip.x + allyShip.width / 2 - 8,
                y: allyShip.y - 30,
                width: 16,
                height: 30,
                speed: 10,
                damage: 5
            });
        }
    }
}

// Dibujar láseres especiales
function drawSpecialLasers() {
    for (let laser of specialLasers) {
        ctx.save();
        // Gradiente especial para láseres del piloto automático
        let grad = ctx.createLinearGradient(laser.x, laser.y + laser.height, laser.x, laser.y);
        grad.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
        grad.addColorStop(0.3, 'rgba(0, 255, 255, 0.8)');
        grad.addColorStop(0.7, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(1, 'rgba(0, 255, 255, 0.9)');
        
        ctx.fillStyle = grad;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 25;
        ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
        ctx.shadowBlur = 0;
        
        // Efecto de resplandor adicional
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(laser.x - 2, laser.y - 2, laser.width + 4, laser.height + 4);
        ctx.globalAlpha = 1;
        ctx.restore();
    }
}

// Actualizar láseres especiales
function updateSpecialLasers() {
    for (let laser of specialLasers) {
        laser.y -= laser.speed;
    }
    specialLasers = specialLasers.filter(laser => laser.y + laser.height > 0);
}

// Verificar colisiones de láseres especiales
function checkSpecialLaserCollisions() {
    // Daño a obstáculos
    for (let i = obstacles.length - 1; i >= 0; i--) {
        for (let j = specialLasers.length - 1; j >= 0; j--) {
            const obs = obstacles[i];
            const laser = specialLasers[j];
            if (
                laser.x < obs.x + obs.width &&
                laser.x + laser.width > obs.x &&
                laser.y < obs.y + obs.height &&
                laser.y + laser.height > obs.y
            ) {
                obs.hp -= laser.damage;
                if (obs.hp <= 0) {
                    // Si es un sol que puede dividirse, crear dos soles más pequeños
                    if (obs.type === 'sun' && obs.canSplit) {
                        createSplitSuns(obs);
                    }
                    
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
                    let aliveAllyShips = allyShips.filter(ship => ship && ship.alive);
                    if (totalDestroyed === 10 && aliveAllyShips.length === 0) {
                        createAllyShip();
                    }
                    if (obs.isChaser) {
                        destroyedChaserRocks++;
                    }
                    createObstacleDestructionFragments(obs);
                    obstacles.splice(i, 1);
                    laserSpeed += 1; // Aumentar velocidad del láser
                }
                specialLasers.splice(j, 1);
                break;
            }
        }
    }
    // Daño al boss
    if (boss && boss.alive) {
        for (let j = specialLasers.length - 1; j >= 0; j--) {
            const laser = specialLasers[j];
            if (
                laser.x < boss.x + boss.width &&
                laser.x + laser.width > boss.x &&
                laser.y < boss.y + boss.height &&
                laser.y + laser.height > boss.y
            ) {
                boss.hp -= laser.damage;
                if (boss.hp <= 0) {
                    boss.destroyed = true;
                    boss.alive = false;
                    bossActive = false;
                    createBossExplosion();
                    victory = true;
                    gameOver = true;
                }
                specialLasers.splice(j, 1);
                laserSpeed += 1; // Aumentar velocidad del láser
            }
        }
    }
}

requestAnimationFrame(gameLoop); 