const core = document.getElementById('core');
const coreContainer = document.getElementById('core-container');
const healthBar = document.getElementById('health-bar');
const shaker = document.getElementById('shaker');
const hudText = document.querySelector('.hud-text');
const revealOverlay = document.getElementById('reveal-overlay');
const replayBtn = document.getElementById('replay-btn');

// Config
const MAX_HEALTH = 100;
let currentHealth = MAX_HEALTH;
const DAMAGE_PER_TAP = 5;

// Canvas Setup
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();


// Haptic Engine
const Haptics = {
    light: () => { if (navigator.vibrate) navigator.vibrate(20); }, // Increased
    medium: () => { if (navigator.vibrate) navigator.vibrate(60); }, // Increased
    heavy: () => { if (navigator.vibrate) navigator.vibrate([80, 20, 80]); }, // Thump-Thump
    // Hand-Shaker: Rapid, long pulses to saturate motor
    explosion: () => {
        if (navigator.vibrate) navigator.vibrate([200, 30, 200, 30, 200, 30, 500]);
    },
    // Heartbeat Rhythm (Stronger)
    heartbeat: () => {
        if (navigator.vibrate) navigator.vibrate([150, 50, 150, 400, 150, 50, 150, 400]);
    },
    // Victory Rhythm (MAX POWER)
    victory: () => {
        if (navigator.vibrate) navigator.vibrate([150, 50, 150, 50, 150, 50, 150, 50, 800]);
    }
};


// Input Handler
function handleInteraction(e) {
    if (currentHealth <= 0) return;

    // Prevent default touch behavior (zooming etc)
    // e.preventDefault(); 

    // Get click coords for particles
    let x, y;
    if (e.type === 'touchstart') {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
        Haptics.medium(); // Better haptic for touch
    } else {
        x = e.clientX;
        y = e.clientY;
        Haptics.light();
    }

    damageCore(x, y);
}

core.addEventListener('mousedown', handleInteraction);
core.addEventListener('touchstart', handleInteraction);


// Core Logic
function damageCore(x, y) {
    currentHealth -= DAMAGE_PER_TAP;
    updateHealthUI();

    // Screen Shake
    shakeScreen();

    // Visual Pulse on Core
    core.style.transform = 'scale(0.9)';
    setTimeout(() => core.style.transform = 'scale(1)', 50);

    // Particles
    createParticles(x, y, 10);

    // Damage Stages
    if (currentHealth < 60) {
        core.classList.add('damaged-1');
        hudText.innerText = "CRITICAL INSTABILITY";
        hudText.style.color = "var(--neon-purple)";
    }
    if (currentHealth < 30) {
        core.classList.add('damaged-2');
        hudText.innerText = "BREACH IMMINENT";
        hudText.style.color = "var(--neon-red)";

        // Intensity rampling up
        if (Math.random() > 0.5) Haptics.heavy();
    }

    // Win Condition
    if (currentHealth <= 0) {
        triggerExplosion();
    }
}

function updateHealthUI() {
    const percent = Math.max(0, (currentHealth / MAX_HEALTH) * 100);
    healthBar.style.width = percent + '%';
}

function shakeScreen() {
    shaker.classList.remove('shake-screen');
    void shaker.offsetWidth; // Force reflow
    shaker.classList.add('shake-screen');
}

function triggerExplosion() {
    currentHealth = 0;
    updateHealthUI();

    // RHYTHMIC FINALE
    // Play the victory pattern
    Haptics.victory();

    // Sync Visuals to the specific rhythm [100, 50, 100, 50, 100, 50, 100, 50, 500]
    // We can manually trigger pulses to match the 'ON' times of the vibration

    const rhythmDelays = [0, 150, 300, 450, 600]; // Approximate start times of the pulses

    rhythmDelays.forEach((delay, index) => {
        setTimeout(() => {
            createParticles(window.innerWidth / 2, window.innerHeight / 2, 20, true);
            shakeScreen();
        }, delay);
    });

    // The final big bang at the end of the rhythm
    setTimeout(() => {
        // Massive particle explosion from center
        createParticles(window.innerWidth / 2, window.innerHeight / 2, 100, true);

        // Hide core
        core.style.opacity = '0';
        core.style.pointerEvents = 'none';

        // Show Overlay
        revealOverlay.classList.add('active');

    }, 800); // Matches end of rhythm
}


// Particle System
class Particle {
    constructor(x, y, isExplosion) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = isExplosion ? Math.random() * 15 + 5 : Math.random() * 5 + 2;

        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.01;

        this.color = `hsl(${Math.random() * 60 + 180}, 100%, 50%)`; // Cyans/Blues
        if (isExplosion) this.color = `hsl(${Math.random() * 60 + 320}, 100%, 60%)`; // Pinks/Reds
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.vx *= 0.95; // Drag
        this.vy *= 0.95;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;

        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1.0;
    }
}

function createParticles(x, y, count, isExplosion = false) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, isExplosion));
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(ctx);

        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }

    requestAnimationFrame(animateParticles);
}
animateParticles();

// Replay
replayBtn.addEventListener('click', () => {
    // Reset Game
    currentHealth = MAX_HEALTH;
    updateHealthUI();

    core.classList.remove('damaged-1', 'damaged-2');
    core.style.opacity = '1';
    core.style.pointerEvents = 'all';

    hudText.innerText = "ENERGY CORE DETECTED";
    hudText.style.color = "var(--neon-blue)";

    revealOverlay.classList.remove('active');
});
