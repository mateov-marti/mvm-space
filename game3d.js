// Configuración básica de Three.js
const WIDTH = 400;
const HEIGHT = 600;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(WIDTH, HEIGHT);
document.getElementById('game3d').appendChild(renderer.domElement);

// Carretera
const roadGeometry = new THREE.BoxGeometry(8, 0.1, 100);
const roadMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.position.set(0, -1, 40);
scene.add(road);

// Carro (cubo)
const carGeometry = new THREE.BoxGeometry(2, 1, 4);
const carMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
const car = new THREE.Mesh(carGeometry, carMaterial);
car.position.set(0, -0.5, 0);
scene.add(car);

// Luces
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
dirLight.position.set(5, 10, 10);
scene.add(dirLight);

// Obstáculos
let obstacles = [];
let obstacleSpeed = 0.2;
let obstacleInterval = 1200; // ms
let lastObstacleTime = 0;

// Movimiento
let moveLeft = false;
let moveRight = false;
let gameOver = false;

function createObstacle() {
    const obsGeometry = new THREE.BoxGeometry(2 + Math.random() * 1.5, 1, 2 + Math.random() * 1.5);
    const obsMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const obs = new THREE.Mesh(obsGeometry, obsMaterial);
    obs.position.set((Math.random() - 0.5) * 10, -0.5, 60);
    scene.add(obs);
    obstacles.push(obs);
}

function updateObstacles() {
    for (let obs of obstacles) {
        obs.position.z -= obstacleSpeed * 10;
    }
    // Eliminar obstáculos fuera de la vista
    obstacles = obstacles.filter(obs => {
        if (obs.position.z < -5) {
            scene.remove(obs);
            return false;
        }
        return true;
    });
}

function checkCollision() {
    for (let obs of obstacles) {
        const dx = Math.abs(car.position.x - obs.position.x);
        const dz = Math.abs(car.position.z - obs.position.z);
        if (dx < 2 && dz < 3) {
            gameOver = true;
        }
    }
}

function resetGame() {
    car.position.x = 0;
    car.position.z = 0;
    for (let obs of obstacles) scene.remove(obs);
    obstacles = [];
    lastObstacleTime = 0;
    gameOver = false;
}

function animate(timestamp) {
    if (gameOver) {
        // Mostrar texto de Game Over
        renderer.clear();
        renderer.render(scene, camera);
        const ctx = renderer.domElement.getContext('2d');
        ctx.save();
        ctx.font = '40px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText('¡Game Over!', 80, 300);
        ctx.font = '20px Arial';
        ctx.fillText('Presiona Enter para reiniciar', 50, 340);
        ctx.restore();
        return;
    }
    // Movimiento del carro
    if (moveLeft) {
        car.position.x -= 0.3;
        if (car.position.x < -4) car.position.x = -4;
    }
    if (moveRight) {
        car.position.x += 0.3;
        if (car.position.x > 4) car.position.x = 4;
    }
    // Crear obstáculos
    if (!lastObstacleTime || timestamp - lastObstacleTime > obstacleInterval) {
        createObstacle();
        lastObstacleTime = timestamp;
    }
    updateObstacles();
    checkCollision();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Cámara
camera.position.set(0, 8, 15);
camera.lookAt(0, 0, 20);

// Controles
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') moveLeft = true;
    if (e.key === 'ArrowRight') moveRight = true;
    if (gameOver && e.key === 'Enter') {
        resetGame();
        requestAnimationFrame(animate);
    }
});
window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') moveLeft = false;
    if (e.key === 'ArrowRight') moveRight = false;
});

// Iniciar animación
requestAnimationFrame(animate); 