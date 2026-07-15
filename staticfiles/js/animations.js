'use strict';

/* ============================================================
   THREE.JS DOTTED BACKGROUND
   - Lighter, more visible dots (#a89eff tones on dark bg)
   - Faster wave animation
   ============================================================ */
function initDottedBackground() {
  if (!window.THREE) return;
  const container = document.getElementById('dotted-bg');
  if (!container) return;

  const SEPARATION = 110, AMOUNTX = 50, AMOUNTY = 65;

  const scene = new THREE.Scene();
  // Fog matches light bg #f5f5f7
  scene.fog = new THREE.Fog(0xf5f5f7, 1600, 7000);

  const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.set(0, 320, 1050);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const geometry = new THREE.BufferGeometry();
  const positions = [], colors = [];

  for (let ix = 0; ix < AMOUNTX; ix++) {
    for (let iy = 0; iy < AMOUNTY; iy++) {
      positions.push(
        ix * SEPARATION - (AMOUNTX * SEPARATION) / 2,
        0,
        iy * SEPARATION - (AMOUNTY * SEPARATION) / 2
      );
      // Dark charcoal dots — clearly visible on white/light bg
      colors.push(0.12, 0.12, 0.16);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 8,
    vertexColors: true,
    transparent: true,
    opacity: 0.48,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  let count = 0;

  function animate() {
    requestAnimationFrame(animate);
    const pos = geometry.attributes.position.array;
    let i = 0;
    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        pos[i * 3 + 1] =
          Math.sin((ix + count) * 0.28) * 38 +
          Math.sin((iy + count) * 0.42) * 38;
        i++;
      }
    }
    geometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    count += 0.07; // faster
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animate();
}

/* ============================================================
   HOME — Stage card cycling
   ============================================================ */
function initHomeAnimation() {
  const cards    = document.querySelectorAll('.stage-card');
  const progress = document.getElementById('stages-progress');
  if (!cards.length) return;
  let current = 0;

  function activate(idx) {
    cards.forEach((c, i) => c.classList.toggle('stage-card--active', i === idx));
    if (progress) progress.style.width = ((idx + 1) / cards.length * 100) + '%';
    current = idx;
  }
  activate(0);
  setInterval(() => activate((current + 1) % cards.length), 3200);
}

/* ============================================================
   DOM READY
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initDottedBackground();
  const page = document.body.dataset.page;
  if (page === 'home') initHomeAnimation();
});
