// Cinematic Realistic Battle Engine - Clean Scroll Version
const canvas = document.getElementById('battleCanvas');
const ctx = canvas.getContext('2d');
const battleBg = document.getElementById('battleBg');
const scrollContainer = document.getElementById('scrollContainer');

// State Variables
let width = (canvas.width = window.innerWidth);
let height = (canvas.height = window.innerHeight);

let state = 'intro'; // 'intro', 'normal', 'nomads-hover', 'legion-hover'
let hoverFaction = null;
let introTimer = 0;
const INTRO_DURATION = 120; // ~2s at 60fps

// Interactive Camera Panning & Scaling
let scale = 1.15;
let cameraX = 0;
let cameraY = -30; // Start high for top-down feel
let targetScale = 1.05;
let targetCameraX = 0;
let targetCameraY = 0;

// Mouse coordinates for interactive parallax
let mouseX = width / 2;
let mouseY = height / 2;

// Screen Shake
let shakeX = 0;
let shakeY = 0;
let screenShake = 0;

// Sandstorm and Dust Particles
const particles = [];
const maxParticles = 100;

// DOM Elements
const zoneLeft = document.getElementById('zoneLeft');
const zoneRight = document.getElementById('zoneRight');
const colorFilter = document.getElementById('colorFilter');

// Resize Handler
window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});

// Capture Mouse Movement for Parallax
window.addEventListener('mousemove', (e) => {
  if (state === 'intro') return;
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// Scroll-Driven Camera Zoom/Pan Transition
scrollContainer.addEventListener('scroll', () => {
  if (state === 'intro') return;
  
  const scrollTop = scrollContainer.scrollTop;
  const sectionHeight = window.innerHeight;
  const progress = Math.min(1, scrollTop / sectionHeight);
  
  // Interpolate camera scale and Y pan based on scroll progress
  targetScale = 1.05 + progress * 0.22;
  targetCameraY = -progress * 60;
  
  // Apply a subtle color filter opacity shift during scroll
  colorFilter.style.backgroundColor = 'rgba(9, 9, 11, 0.4)';
  colorFilter.style.opacity = (progress * 0.8).toString();
});

// Sand Dust & Volumetric Dust Particle Class
class SandParticle {
  constructor(isForeground = false) {
    this.reset(true);
    this.isForeground = isForeground;
  }

  reset(randomStart = false) {
    this.x = randomStart ? Math.random() * width : width + 50;
    this.y = Math.random() * height;
    
    // Wind blowing right to left
    this.vx = -1.5 - Math.random() * 4;
    this.vy = 0.2 + Math.random() * 0.6;
    
    this.size = 1 + Math.random() * 3;
    this.isCloud = Math.random() < 0.25;
    if (this.isCloud) {
      this.size = 40 + Math.random() * 80;
      this.vx = -0.5 - Math.random() * 1.5;
    }
    
    this.alpha = 0.05 + Math.random() * 0.15;
    this.maxAlpha = this.alpha;
    this.life = 0;
    this.maxLife = 200 + Math.random() * 200;
  }

  update(speedMultiplier) {
    this.x += this.vx * speedMultiplier;
    this.y += this.vy;
    this.life++;

    // Fade in/out cycle
    if (this.life < 50) {
      this.alpha = (this.life / 50) * this.maxAlpha;
    } else if (this.life > this.maxLife - 50) {
      this.alpha = ((this.maxLife - this.life) / 50) * this.maxAlpha;
    }

    if (this.x < -this.size || this.life >= this.maxLife) {
      this.reset(false);
    }
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    
    if (this.isCloud) {
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
      grad.addColorStop(0, 'rgba(215, 175, 130, 0.12)');
      grad.addColorStop(0.5, 'rgba(215, 175, 130, 0.04)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#dfba97';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// Initialize particles
for (let i = 0; i < maxParticles; i++) {
  particles.push(new SandParticle());
}

// Procedural Lens Flare Rendering (Cinema lens artifact from the sun)
function drawLensFlare() {
  const sunX = width * 0.85;
  const sunY = height * 0.3;
  
  const cx = width / 2;
  const cy = height / 2;
  
  const dx = cx - sunX;
  const dy = cy - sunY;
  
  const points = [0.3, 0.5, -0.2, -0.4, 0.8, 1.2];
  const colors = [
    'rgba(197, 155, 39, 0.06)',  // gold
    'rgba(158, 42, 43, 0.04)',   // red
    'rgba(74, 144, 226, 0.04)',  // blue anomaly
    'rgba(255, 255, 255, 0.03)', // white
    'rgba(197, 155, 39, 0.05)',
    'rgba(158, 42, 43, 0.03)'
  ];
  
  points.forEach((dist, idx) => {
    const fx = sunX + dx * dist;
    const fy = sunY + dy * dist;
    const size = Math.abs(dist) * 80 + 30;
    
    const flareGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, size);
    flareGrad.addColorStop(0, colors[idx]);
    flareGrad.addColorStop(0.8, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = flareGrad;
    ctx.beginPath();
    ctx.arc(fx, fy, size, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Draw soft sun rays
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(sunX, sunY);
    const angle = 0.5 + i * 0.1;
    ctx.lineTo(sunX - Math.cos(angle) * width, sunY + Math.sin(angle) * height);
    ctx.stroke();
  }
  ctx.restore();
}

// Main Render Loop
function render() {
  ctx.clearRect(0, 0, width, height);

  // Intro Camera Transition
  if (state === 'intro') {
    introTimer++;
    const progress = introTimer / INTRO_DURATION;
    
    scale = 1.15 - progress * 0.1; // 1.15 to 1.05
    cameraY = -30 * (1 - progress); // -30 to 0
    cameraX = 0;
    
    if (introTimer >= INTRO_DURATION) {
      state = 'normal';
    }
  } else {
    // Normal mouse parallax calculation (if not scrolling past section 1)
    const scrollTop = scrollContainer.scrollTop;
    if (scrollTop < 50) {
      const factorX = (mouseX / width - 0.5) * -40;
      const factorY = (mouseY / height - 0.5) * -20;
      
      cameraX += (targetCameraX + factorX - cameraX) * 0.08;
      cameraY += (targetCameraY + factorY - cameraY) * 0.08;
    }
    
    scale += (targetScale - scale) * 0.08;
  }

  // Update Background Image transform properties
  battleBg.style.transform = `translate(${cameraX}px, ${cameraY}px) scale(${scale})`;

  // Speed multiplier based on state hover
  let pSpeed = 1.0;
  if (state === 'nomads-hover') pSpeed = 1.4;
  else if (state === 'legion-hover') pSpeed = 1.7;

  // Draw Sandstorm Particles
  particles.forEach(p => {
    p.update(pSpeed);
    p.draw();
  });

  // Draw cinematic lens flare
  drawLensFlare();

  requestAnimationFrame(render);
}

// Hover State Event Triggers
function setHoverState(faction) {
  if (state === 'intro' || scrollContainer.scrollTop > 50) return;
  
  hoverFaction = faction;
  
  if (faction === 'nomads') {
    state = 'nomads-hover';
    targetScale = 1.1;
    targetCameraX = 30;
    targetCameraY = -5;
    
    colorFilter.style.backgroundColor = 'rgba(158, 42, 43, 0.15)';
    colorFilter.style.opacity = '0.25';
  } else if (faction === 'legion') {
    state = 'legion-hover';
    targetScale = 1.1;
    targetCameraX = -30;
    targetCameraY = -5;
    
    colorFilter.style.backgroundColor = 'rgba(197, 155, 39, 0.12)';
    colorFilter.style.opacity = '0.2';
  } else {
    state = 'normal';
    targetScale = 1.05;
    targetCameraX = 0;
    targetCameraY = 0;
    
    colorFilter.style.backgroundColor = 'transparent';
    colorFilter.style.opacity = '0';
  }
}

zoneLeft.addEventListener('mouseenter', () => setHoverState('nomads'));
zoneLeft.addEventListener('mouseleave', () => setHoverState(null));
zoneRight.addEventListener('mouseenter', () => setHoverState('legion'));
zoneRight.addEventListener('mouseleave', () => setHoverState(null));

// Waitlist Form Submission Listener
const waitlistForm = document.getElementById('waitlistForm');
const waitlistInput = document.getElementById('emailInput');
const waitlistSuccess = document.getElementById('waitlistSuccess');
const waitlistEndpoint = 'https://jmxxishcxzkxliemdlak.supabase.co/rest/v1/waitlist';
const waitlistAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhbmFzZSIsInJlZiI6ImpteHhpc2hjeHpreGxpZW1kbGFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDMxNjUsImV4cCI6MjA5Nzk3OTE2NX0.qo0KGf_PS-HDWkmj2erlbmy66I1WxbA4crapuHZ8o80';

if (waitlistForm && waitlistInput && waitlistSuccess) {
  waitlistForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = waitlistInput.value.trim();
    const submitButton = waitlistForm.querySelector('button[type="submit"]');
    if (!email || !waitlistInput.validity.valid) return;

    if (submitButton) submitButton.disabled = true;

    try {
      const response = await fetch(waitlistEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: waitlistAnonKey,
          Authorization: `Bearer ${waitlistAnonKey}`,
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({ email })
      });

      // Duplicate addresses are already on the shared waitlist.
      if (!response.ok && response.status !== 409) {
        throw new Error(`Waitlist request failed (${response.status})`);
      }

      waitlistForm.style.opacity = '0';
      setTimeout(() => {
        waitlistForm.classList.add('hidden');
        waitlistSuccess.classList.remove('hidden');
        setTimeout(() => waitlistSuccess.classList.add('show'), 50);
      }, 400);
    } catch (error) {
      console.error('Unable to subscribe to the waitlist:', error);
      waitlistInput.setCustomValidity("We couldn't add you to the waitlist. Please try again.");
      waitlistInput.reportValidity();
      if (submitButton) submitButton.disabled = false;
    }
  });

  waitlistInput.addEventListener('input', () => waitlistInput.setCustomValidity(''));
}

// Initial Exec
render();
