/* ═══════════════════════════════════════════════════════
   WasteParrot — Main Application JS
   Features: Three.js 3D Drones · Moving Map Fleet · Activity Feed · Counters
   ═══════════════════════════════════════════════════════ */

/* ─── NAVBAR SCROLL ─────────────────────────────────────── */
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
}

/* ─── HAMBURGER ─────────────────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
}

/* ─── ANIMATED COUNTERS ─────────────────────────────────── */
function animateCount(el) {
  const target   = parseFloat(el.dataset.target);
  const suffix   = el.dataset.suffix || '';
  const isFloat  = !Number.isInteger(target);
  const steps    = 60;
  const inc      = target / steps;
  let current    = 0, frame = 0;
  const run = () => {
    current += inc; frame++;
    if (frame >= steps) { current = target; }
    el.textContent = isFloat ? current.toFixed(1) + suffix : Math.floor(current) + suffix;
    if (frame < steps) requestAnimationFrame(run);
  };
  requestAnimationFrame(run);
}

const allCounters = document.querySelectorAll('.stat-num, .impact-num');
const counterObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { animateCount(e.target); counterObs.unobserve(e.target); } });
}, { threshold: 0.5 });
allCounters.forEach(c => counterObs.observe(c));

/* ─── AI BAR LIVE ANIMATION ─────────────────────────────── */
function animateBars() {
  const bars = {
    'vision-bar': [75, 98],
    'sorter-bar': [60, 92],
    'route-bar':  [82, 96],
  };
  Object.entries(bars).forEach(([id, [min, max]]) => {
    const bar = document.getElementById(id);
    if (!bar) return;
    setInterval(() => {
      const v = min + Math.random() * (max - min);
      bar.style.width = v.toFixed(1) + '%';
    }, 1800 + Math.random() * 800);
  });
}
animateBars();

/* ─── HUD LIVE UPDATES ──────────────────────────────────── */
function animateHUD() {
  const bat = document.getElementById('hud-bat');
  const conf = document.getElementById('hud-conf');
  if (!bat && !conf) return;
  setInterval(() => {
    const b = 84 + Math.floor(Math.random() * 8);
    const c = 96 + Math.floor(Math.random() * 3);
    if (bat)  bat.textContent  = b + '%';
    if (conf) { conf.style.width = c + '%'; conf.closest('.hud-bar-wrap')?.querySelector('.hud-bar-pct')?.textContent === undefined || (conf.closest('.hud-bar-wrap').querySelector('.hud-bar-pct').textContent = c + '%'); }
  }, 2500);
}
animateHUD();

/* ─── THREE.JS DRONE SCENE ──────────────────────────────── */
function initDroneScene() {
  if (typeof THREE === 'undefined') return;
  const canvas = document.getElementById('drone-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();

  function getSize() {
    const rect = canvas.getBoundingClientRect();
    return { w: Math.max(rect.width, 1), h: Math.max(rect.height, 1) };
  }
  const { w, h } = getSize();
  renderer.setSize(w, h);

  const camera = new THREE.PerspectiveCamera(48, w / h, 0.1, 100);
  camera.position.set(4, 5, 9);
  camera.lookAt(0, 0.5, 0);

  /* ── Lights ── */
  scene.add(new THREE.AmbientLight(0x1a2a40, 1.2));

  const sun = new THREE.DirectionalLight(0xffffff, 1.8);
  sun.position.set(8, 12, 8);
  sun.castShadow = true;
  sun.shadow.camera.near  = 0.1;
  sun.shadow.camera.far   = 50;
  sun.shadow.camera.left  = -12;
  sun.shadow.camera.right = 12;
  sun.shadow.camera.top   = 12;
  sun.shadow.camera.bottom = -12;
  scene.add(sun);

  const greenGlow = new THREE.PointLight(0x22c55e, 4, 18);
  greenGlow.position.set(0, 4, 3);
  scene.add(greenGlow);

  const blueGlow = new THREE.PointLight(0x6366f1, 2.5, 12);
  blueGlow.position.set(-5, 3, -3);
  scene.add(blueGlow);

  /* ── Materials ── */
  const M = {
    body:   new THREE.MeshPhongMaterial({ color: 0x1e3a5f, shininess: 140, specular: 0x4488cc }),
    arm:    new THREE.MeshPhongMaterial({ color: 0x2d3f55, shininess: 80 }),
    prop:   new THREE.MeshPhongMaterial({ color: 0x22c55e, transparent: true, opacity: 0.55, shininess: 200 }),
    motor:  new THREE.MeshPhongMaterial({ color: 0x0f172a, shininess: 200 }),
    ledG:   new THREE.MeshBasicMaterial({ color: 0x22c55e }),
    ledR:   new THREE.MeshBasicMaterial({ color: 0xef4444 }),
    ledB:   new THREE.MeshBasicMaterial({ color: 0x60a5fa }),
    cam:    new THREE.MeshPhongMaterial({ color: 0x050a10, shininess: 300 }),
    dome:   new THREE.MeshPhongMaterial({ color: 0x2563eb, transparent: true, opacity: 0.55, shininess: 300 }),
    blade:  new THREE.MeshPhongMaterial({ color: 0x34d399, transparent: true, opacity: 0.65 }),
  };

  /* ── Drone Factory ── */
  function buildDrone(scale) {
    const root = new THREE.Group();
    const propGroups = [];
    const s = scale;

    // Central body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5 * s, 0.3 * s, 0.85 * s), M.body);
    body.castShadow = true;
    root.add(body);

    // Top dome
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.25 * s, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
      M.dome
    );
    dome.position.y = 0.15 * s;
    root.add(dome);

    // Camera gimbal
    const camGimbal = new THREE.Mesh(new THREE.SphereGeometry(0.13 * s, 12, 12), M.cam);
    camGimbal.position.y = -0.22 * s;
    root.add(camGimbal);

    // Lens ring
    const lensRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.08 * s, 0.025 * s, 8, 12),
      new THREE.MeshPhongMaterial({ color: 0x334155 })
    );
    lensRing.position.y = -0.22 * s;
    lensRing.rotation.x = Math.PI / 2;
    root.add(lensRing);

    // 4 Arms
    const corners = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    corners.forEach(([dx, dz], idx) => {
      const ex = dx * 0.98 * s;
      const ez = dz * 0.72 * s;

      // Arm tube
      const curve = new THREE.LineCurve3(
        new THREE.Vector3(dx * 0.1 * s, 0, dz * 0.08 * s),
        new THREE.Vector3(ex, 0, ez)
      );
      const arm = new THREE.Mesh(new THREE.TubeGeometry(curve, 1, 0.045 * s, 6, false), M.arm);
      root.add(arm);

      // Motor housing
      const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.12 * s, 0.16 * s, 12), M.motor);
      motor.position.set(ex, 0, ez);
      root.add(motor);

      // Propeller group
      const propGrp = new THREE.Group();
      propGrp.position.set(ex, 0.11 * s, ez);

      // Propeller disc
      const propDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.44 * s, 0.44 * s, 0.018 * s, 18),
        M.prop
      );
      propGrp.add(propDisc);

      // Blades (cross)
      [0, 90].forEach(deg => {
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.8 * s, 0.018 * s, 0.1 * s),
          M.blade
        );
        blade.rotation.y = THREE.MathUtils.degToRad(deg);
        propGrp.add(blade);
      });

      // LED
      const ledMat = idx < 2 ? M.ledG : M.ledR;
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.055 * s, 8, 8), ledMat);
      led.position.set(ex, 0.13 * s, ez);
      root.add(led);

      root.add(propGrp);
      propGroups.push({ grp: propGrp, dir: idx % 2 === 0 ? 1 : -1 });
    });

    // Drone LED light
    const droneLed = new THREE.PointLight(0x22c55e, 1.5, 4 * s);
    root.add(droneLed);

    // Landing gear
    [[-0.5 * s, -0.5 * s], [0.5 * s, -0.5 * s], [-0.5 * s, 0.5 * s], [0.5 * s, 0.5 * s]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025 * s, 0.025 * s, 0.3 * s, 6),
        M.arm
      );
      leg.position.set(lx, -0.25 * s, lz);
      root.add(leg);
    });

    return { root, propGroups, led: droneLed };
  }

  /* ── Create Fleet ── */
  const droneData = [
    { scale: 1.05, pos: [0,    0,    0],   phase: 0,   speed: 1.2 },
    { scale: 0.72, pos: [-3.4, 1.2, -2],   phase: 1.8, speed: 1.4 },
    { scale: 0.65, pos: [3.2,  0.5, -2.8], phase: 3.2, speed: 1.0 },
  ];

  const drones = droneData.map(d => {
    const drone = buildDrone(d.scale);
    drone.root.position.set(...d.pos);
    scene.add(drone.root);
    return { ...drone, ...d };
  });

  /* ── Particles ── */
  const PCNT = 250;
  const pPos = new Float32Array(PCNT * 3);
  const pVel = [];
  for (let i = 0; i < PCNT; i++) {
    pPos[i*3]   = (Math.random() - 0.5) * 12;
    pPos[i*3+1] = Math.random() * 5;
    pPos[i*3+2] = (Math.random() - 0.5) * 12;
    pVel.push({ x: (Math.random()-0.5)*0.015, y: -Math.random()*0.012, z: (Math.random()-0.5)*0.015 });
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const particles = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({ color: 0x22c55e, size: 0.04, transparent: true, opacity: 0.35 })
  );
  scene.add(particles);

  /* ── Animation ── */
  const clock = new THREE.Clock();
  let frameId;

  function animate() {
    frameId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Animate drones
    drones.forEach(d => {
      d.root.position.y = d.pos[1] + Math.sin(t * d.speed + d.phase) * 0.28;
      d.root.rotation.x = Math.sin(t * 0.9 + d.phase) * 0.065;
      d.root.rotation.z = Math.cos(t * 0.7 + d.phase) * 0.065;
      d.propGroups.forEach(p => { p.grp.rotation.y += p.dir * 0.32; });
      d.led.intensity = 1.5 + Math.sin(t * 5 + d.phase) * 0.6;
    });

    // Particles
    const posAttr = pGeo.attributes.position;
    for (let i = 0; i < PCNT; i++) {
      posAttr.array[i*3]   += pVel[i].x;
      posAttr.array[i*3+1] += pVel[i].y;
      posAttr.array[i*3+2] += pVel[i].z;
      if (posAttr.array[i*3+1] < -2) {
        posAttr.array[i*3]   = (Math.random()-0.5)*12;
        posAttr.array[i*3+1] = 5;
        posAttr.array[i*3+2] = (Math.random()-0.5)*12;
      }
    }
    posAttr.needsUpdate = true;

    // Camera slow orbit
    camera.position.x = Math.sin(t * 0.13) * 9 + 1.5;
    camera.position.z = Math.cos(t * 0.13) * 9;
    camera.position.y = 5 + Math.sin(t * 0.07) * 1.2;
    camera.lookAt(0, 0.5, 0);

    // Pulse green glow
    greenGlow.intensity = 4 + Math.sin(t * 2.5) * 1.2;

    renderer.render(scene, camera);
  }
  animate();

  // Resize
  window.addEventListener('resize', () => {
    const { w, h } = getSize();
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });

  // Pause when hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(frameId);
    else animate();
  });
}

/* ─── LEAFLET MAP WITH MOVING DRONES ───────────────────── */
function initMap() {
  if (typeof L === 'undefined') return;
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  const map = L.map('map', {
    center: [51.505, -0.09],
    zoom: 13,
    scrollWheelZoom: false,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  /* ── Drone SVG icon factory ── */
  function droneIcon(color, label) {
    const id = label.replace(/[^a-z0-9]/gi, '');
    return L.divIcon({
      html: `
        <div style="position:relative;width:68px;height:76px;filter:drop-shadow(0 0 6px ${color}60)">
          <svg width="60" height="60" viewBox="0 0 60 60" style="position:absolute;top:0;left:4px;overflow:visible">
            <defs>
              <filter id="g${id}"><feGaussianBlur stdDeviation="2" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <!-- Arms -->
            <line x1="30" y1="30" x2="7"  y2="7"  stroke="#4a5568" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="30" y1="30" x2="53" y2="7"  stroke="#4a5568" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="30" y1="30" x2="7"  y2="53" stroke="#4a5568" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="30" y1="30" x2="53" y2="53" stroke="#4a5568" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Spinning propellers (SMIL) -->
            <ellipse cx="7" cy="7" rx="9" ry="2.5" fill="${color}" opacity="0.7">
              <animateTransform attributeName="transform" type="rotate" from="0 7 7" to="360 7 7" dur="0.11s" repeatCount="indefinite"/>
            </ellipse>
            <ellipse cx="53" cy="7" rx="9" ry="2.5" fill="${color}" opacity="0.7">
              <animateTransform attributeName="transform" type="rotate" from="360 53 7" to="0 53 7" dur="0.11s" repeatCount="indefinite"/>
            </ellipse>
            <ellipse cx="7" cy="53" rx="9" ry="2.5" fill="${color}" opacity="0.7">
              <animateTransform attributeName="transform" type="rotate" from="360 7 53" to="0 7 53" dur="0.11s" repeatCount="indefinite"/>
            </ellipse>
            <ellipse cx="53" cy="53" rx="9" ry="2.5" fill="${color}" opacity="0.7">
              <animateTransform attributeName="transform" type="rotate" from="0 53 53" to="360 53 53" dur="0.11s" repeatCount="indefinite"/>
            </ellipse>
            <!-- Motor hubs -->
            <circle cx="7"  cy="7"  r="4" fill="#1e293b" stroke="${color}" stroke-width="1.5"/>
            <circle cx="53" cy="7"  r="4" fill="#1e293b" stroke="${color}" stroke-width="1.5"/>
            <circle cx="7"  cy="53" r="4" fill="#1e293b" stroke="${color}" stroke-width="1.5"/>
            <circle cx="53" cy="53" r="4" fill="#1e293b" stroke="${color}" stroke-width="1.5"/>
            <!-- Body -->
            <rect x="20" y="23" width="20" height="14" rx="5" fill="#1e3a5f" stroke="${color}" stroke-width="1" filter="url(#g${id})"/>
            <rect x="24" y="27" width="12" height="6"  rx="3" fill="#0f172a"/>
            <!-- Center LED (blink) -->
            <circle cx="30" cy="30" r="3" fill="${color}">
              <animate attributeName="opacity" values="1;0.35;1" dur="1.8s" repeatCount="indefinite"/>
            </circle>
            <circle cx="30" cy="30" r="6" fill="${color}" opacity="0.15">
              <animate attributeName="r" values="5;8;5" dur="1.8s" repeatCount="indefinite"/>
            </circle>
          </svg>
          <div style="position:absolute;bottom:0;left:0;right:0;text-align:center;font-family:'Inter',sans-serif;font-size:10px;font-weight:700;color:${color};text-shadow:0 0 8px ${color}90;letter-spacing:.5px">${label}</div>
        </div>`,
      className: '',
      iconSize: [68, 76],
      iconAnchor: [34, 38],
      popupAnchor: [0, -44],
    });
  }

  function hotspotIcon(size = 'md') {
    const dim = size === 'lg' ? 44 : 36;
    return L.divIcon({
      html: `<div style="background:rgba(239,68,68,.18);border:2px solid #ef4444;border-radius:50%;width:${dim}px;height:${dim}px;display:flex;align-items:center;justify-content:center;font-size:${size==='lg'?20:16}px;box-shadow:0 0 16px rgba(239,68,68,.5);animation:pulse-red 2s ease-in-out infinite">🗑️</div>`,
      className: '',
      iconSize: [dim, dim],
      iconAnchor: [dim/2, dim/2],
    });
  }

  function stationIcon() {
    return L.divIcon({
      html: `<div style="background:rgba(59,130,246,.18);border:2px solid #3b82f6;border-radius:10px;width:38px;height:38px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 0 14px rgba(59,130,246,.5)">⚡</div>`,
      className: '',
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });
  }

  /* ── Drone fleet ── */
  const fleet = [
    {
      name: 'α-1', color: '#22c55e', status: 'Active',
      waypoints: [[51.510,-0.120],[51.515,-0.108],[51.512,-0.095],[51.505,-0.100],[51.500,-0.112]],
      kg: 0,
    },
    {
      name: 'α-2', color: '#22c55e', status: 'Active',
      waypoints: [[51.498,-0.075],[51.504,-0.068],[51.510,-0.072],[51.508,-0.082],[51.502,-0.078]],
      kg: 0,
    },
    {
      name: 'β-1', color: '#eab308', status: 'Collecting',
      waypoints: [[51.520,-0.105],[51.516,-0.092],[51.522,-0.083],[51.518,-0.075],[51.525,-0.088]],
      kg: 0,
    },
    {
      name: 'β-2', color: '#eab308', status: 'Collecting',
      waypoints: [[51.490,-0.095],[51.494,-0.110],[51.488,-0.118],[51.485,-0.105],[51.492,-0.098]],
      kg: 0,
    },
    {
      name: 'γ-1', color: '#a855f7', status: 'Scanning',
      waypoints: [[51.507,-0.060],[51.513,-0.055],[51.518,-0.065],[51.512,-0.072],[51.506,-0.067]],
      kg: 0,
    },
  ];

  // Route polylines
  fleet.forEach(d => {
    L.polyline(d.waypoints, { color: d.color, weight: 1.5, opacity: 0.2, dashArray: '5,9' }).addTo(map);
  });

  // Hotspots
  [
    { lat: 51.500, lng: -0.130, label: 'High Density Zone A', kg: 42, size: 'lg' },
    { lat: 51.515, lng: -0.080, label: 'Medium Density Zone B', kg: 18, size: 'md' },
    { lat: 51.490, lng: -0.075, label: 'Low Density Zone C', kg: 9, size: 'md' },
    { lat: 51.525, lng: -0.095, label: 'High Density Zone D', kg: 35, size: 'lg' },
  ].forEach(h => {
    L.marker([h.lat, h.lng], { icon: hotspotIcon(h.size) })
      .bindPopup(`<strong>${h.label}</strong><br/><span style="color:#ef4444">~${h.kg} kg waste</span>`)
      .addTo(map);
  });

  // Charging stations
  [
    { lat: 51.525, lng: -0.115, name: 'Station Alpha' },
    { lat: 51.484, lng: -0.115, name: 'Station Beta' },
  ].forEach(s => {
    L.marker([s.lat, s.lng], { icon: stationIcon() })
      .bindPopup(`<strong>${s.name}</strong><br/><span style="color:#3b82f6">Solar Charging Hub</span>`)
      .addTo(map);
  });

  // Create moving markers
  const markers = fleet.map(d => {
    const m = L.marker(d.waypoints[0], { icon: droneIcon(d.color, d.name) }).addTo(map);
    m.bindPopup('');
    return { m, wpIdx: 0, d };
  });

  function updatePopup(entry) {
    entry.m.setPopupContent(`
      <div style="font-family:'Inter',sans-serif;min-width:190px">
        <strong style="font-size:.95rem">Drone ${entry.d.name}</strong><br/>
        <span style="color:${entry.d.color};font-size:.8rem">● ${entry.d.status}</span>
        <hr style="border:none;border-top:1px solid rgba(255,255,255,.1);margin:8px 0"/>
        <div style="font-size:.8rem;color:#94a3b8">Collected: <strong style="color:#fff">${entry.d.kg.toFixed(1)} kg</strong></div>
        <div style="font-size:.8rem;color:#94a3b8;margin-top:4px">Battery: <strong style="color:#fff">${Math.floor(60+Math.random()*35)}%</strong></div>
      </div>`);
  }
  markers.forEach(updatePopup);

  // Fly drones
  function flyDrones() {
    let totalKg = 1247;
    markers.forEach(entry => {
      entry.wpIdx = (entry.wpIdx + 1) % entry.d.waypoints.length;
      entry.m.setLatLng(entry.d.waypoints[entry.wpIdx]);
      entry.d.kg += parseFloat((Math.random() * 0.6).toFixed(1));
      totalKg += entry.d.kg;
      updatePopup(entry);
    });
    const el = document.getElementById('collected-count');
    if (el) el.textContent = Math.floor(totalKg).toLocaleString();
  }
  setInterval(flyDrones, 1900);

  /* ── Activity Feed ── */
  const feedEl = document.getElementById('activity-feed');
  const feedMessages = [
    (n, kg) => `Drone ${n} collected ${kg/10} kg plastic at Oxford St`,
    (n, kg) => `Drone ${n} sorted ${kg/10} kg e-waste — 88.1% accuracy`,
    (n)     => `Drone ${n} hotspot flagged — dispatching backup`,
    (n, kg) => `Drone ${n} deposited ${kg/10} kg at Station Alpha`,
    (n)     => `AI route optimizer re-routed ${n} — 12% efficiency gain`,
    (n, kg) => `Drone ${n} detected ${kg/10} kg organic waste near Waterloo`,
    (n)     => `Drone ${n} battery low — auto-returning to charge`,
    (_n, kg) => `Neural Sorter: ${kg/10} kg classified in 0.3s`,
  ];

  let feedMsgIdx = 0;
  function pushFeedItem() {
    if (!feedEl) return;
    const drone = fleet[Math.floor(Math.random() * fleet.length)];
    const kg    = (Math.random() * 3 + 0.5).toFixed(1);
    const fn    = feedMessages[feedMsgIdx % feedMessages.length];
    const text  = fn(drone.name, kg);
    feedMsgIdx++;

    const item = document.createElement('div');
    item.className = 'feed-item';
    const now = new Date();
    const time = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0') + ':' + now.getSeconds().toString().padStart(2,'0');
    item.innerHTML = `<span class="feed-dot"></span><span>${text}</span><span class="feed-time">${time}</span>`;
    feedEl.prepend(item);
    while (feedEl.children.length > 8) feedEl.removeChild(feedEl.lastChild);
  }

  // Initial messages
  feedMessages.slice(0, 5).forEach((_, i) => setTimeout(pushFeedItem, i * 700));
  setInterval(pushFeedItem, 3500 + Math.random() * 1500);
}

/* ─── SCROLL REVEAL ─────────────────────────────────────── */
const revealEls = document.querySelectorAll('.step-card,.ai-card,.feature-card,.impact-card,.team-card,.value-card');
const revealObs = new IntersectionObserver(entries => {
  entries.forEach((e, idx) => {
    if (e.isIntersecting) {
      setTimeout(() => {
        e.target.style.opacity  = '1';
        e.target.style.transform = 'translateY(0)';
      }, (idx % 4) * 80);
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });
revealEls.forEach((el, i) => {
  el.style.opacity   = '0';
  el.style.transform = 'translateY(28px)';
  el.style.transition= `opacity .55s ease ${(i%4)*.08}s, transform .55s ease ${(i%4)*.08}s`;
  revealObs.observe(el);
});

/* ─── CONTACT FORM ──────────────────────────────────────── */
const form    = document.getElementById('contact-form');
const formMsg = document.getElementById('form-msg');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Sending…';
    btn.disabled = true;
    setTimeout(() => {
      if (formMsg) formMsg.textContent = '✅ Message sent! Our team will be in touch within 24 hours.';
      btn.textContent = 'Send Message 🦜';
      btn.disabled = false;
      form.reset();
      setTimeout(() => { if (formMsg) formMsg.textContent = ''; }, 6000);
    }, 1500);
  });
}

/* ─── INIT ON LOAD ──────────────────────────────────────── */
window.addEventListener('load', () => {
  initDroneScene();
  initMap();
});
