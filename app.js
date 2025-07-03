// 1. Main Three.js variables
let scene, camera, renderer;
let planets = [];
let sun;
let clock = new THREE.Clock();
let isPaused = false;
let orbitLines = [];
let stars;

// 2. Planet data (name, color, size, orbit radius, speed)
const planetData = [
    { name: "Mercury", color: 0x8B8B8B, size: 0.4, orbitRadius: 5, speed: 0.04 },
    { name: "Venus", color: 0xE6C229, size: 0.6, orbitRadius: 7, speed: 0.015 },
    { name: "Earth", color: 0x6B93D6, size: 0.6, orbitRadius: 10, speed: 0.01 },
    { name: "Mars", color: 0x993D00, size: 0.5, orbitRadius: 15, speed: 0.008 },
    { name: "Jupiter", color: 0xB07F35, size: 1.0, orbitRadius: 20, speed: 0.002 },
    { name: "Saturn", color: 0xDCD0A1, size: 0.9, orbitRadius: 25, speed: 0.0009 },
    { name: "Uranus", color: 0xC1E3E3, size: 0.7, orbitRadius: 30, speed: 0.0004 },
    { name: "Neptune", color: 0x5B5DDF, size: 0.7, orbitRadius: 35, speed: 0.0001 }
];

// 3. Initialization
function init() {
    // 3.1 Create scene
    scene = new THREE.Scene();

    // 3.2 Add stars background
    addStars();

    // 3.3 Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 20, 50);

    // 3.4 Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // 3.5 Add lights
    addLights();

    // 3.6 Create sun and planets
    createSun();
    createPlanets();

    // 3.7 Create orbit lines
    createOrbitLines();

    // 3.8 Add controls
    createControls();

    // 3.9 Add event listeners
    window.addEventListener('resize', onWindowResize);

    // 3.10 Start animation loop
    animate();
}

// 4. Add stars to the background
function addStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.1, transparent: true });
    const starsVertices = [];
    for (let i = 0; i < 1000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starsVertices.push(x, y, z);
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

// 5. Add lights to the scene
function addLights() {
    // 5.1 Ambient light for soft shadows
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
}

// 6. Create the sun
function createSun() {
    // 6.1 Sun geometry and material
    const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFF00,
        emissive: 0xFFFF00,
        emissiveIntensity: 1
    });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.castShadow = true;

    // 6.2 Add sun light
    const sunLight = new THREE.PointLight(0xFFFFFF, 1, 100);
    sun.add(sunLight);

    scene.add(sun);
}

// 7. Create all planets
function createPlanets() {
    planetData.forEach((data, index) => {
        // 7.1 Planet geometry and material
        const planetGeometry = new THREE.SphereGeometry(data.size, 32, 32);
        const planetMaterial = new THREE.MeshPhongMaterial({
            color: data.color,
            shininess: 5
        });
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);

        // 7.2 Initial position
        planet.position.x = data.orbitRadius;
        planet.castShadow = true;
        planet.receiveShadow = true;

        // 7.3 Store original speed for reset functionality
        planet.userData = {
            name: data.name,
            originalSpeed: data.speed,
            currentSpeed: data.speed,
            orbitRadius: data.orbitRadius,
            angle: Math.random() * Math.PI * 2 // Random starting position
        };

        // 7.4 Add planet to scene and array
        scene.add(planet);
        planets.push(planet);

        // 7.5 Add glow effect
        const glow = createGlowMesh(data.size, data.color);
        planet.add(glow);

        // 7.6 Add Saturn's ring
        if (data.name === "Saturn") {
            const ringGeometry = new THREE.RingGeometry(data.size * 1.2, data.size * 1.7, 64);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0xcccc99,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.5
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            ring.userData = { animate: true };
            planet.add(ring);
            planet.userData.ring = ring;
        }
    });
}

// 7.5 Helper: Create planet glow mesh
function createGlowMesh(radius, color) {
    const glowGeometry = new THREE.SphereGeometry(radius * 1.18, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    });
    return new THREE.Mesh(glowGeometry, glowMaterial);
}

// 8. Create orbit lines
function createOrbitLines() {
    planetData.forEach(data => {
        const orbitGeometry = new THREE.BufferGeometry();
        const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x555555 });
        const points = [];
        const segments = 64;
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(
                Math.cos(angle) * data.orbitRadius,
                0,
                Math.sin(angle) * data.orbitRadius
            ));
        }
        orbitGeometry.setFromPoints(points);
        const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
        scene.add(orbitLine);
        orbitLines.push(orbitLine);
    });
}

// 9. Create control panel
function createControls() {
    const controlsContainer = document.getElementById('planet-controls');
    planets.forEach((planet, index) => {
        const controlGroup = document.createElement('div');
        controlGroup.className = 'control-group';

        const label = document.createElement('label');
        label.textContent = planet.userData.name;

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '200';
        slider.value = (planet.userData.currentSpeed / planet.userData.originalSpeed * 100).toFixed(0);
        slider.id = `speed-${index}`;

        const speedValue = document.createElement('span');
        speedValue.id = `speed-value-${index}`;
        speedValue.textContent = slider.value + '%';

        slider.addEventListener('input', () => {
            const speedPercent = parseInt(slider.value);
            planet.userData.currentSpeed = planet.userData.originalSpeed * (speedPercent / 100);
            speedValue.textContent = speedPercent + '%';
        });

        controlGroup.appendChild(label);
        controlGroup.appendChild(slider);
        controlGroup.appendChild(speedValue);
        controlsContainer.appendChild(controlGroup);
    });

    // Pause/resume button
    const pauseBtn = document.getElementById('pause-btn');
    pauseBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
    });

    // Reset button
    const resetBtn = document.getElementById('reset-btn');
    resetBtn.addEventListener('click', () => {
        planets.forEach((planet, index) => {
            planet.userData.currentSpeed = planet.userData.originalSpeed;
            const slider = document.getElementById(`speed-${index}`);
            slider.value = '100';
            document.getElementById(`speed-value-${index}`).textContent = '100%';
        });
    });
}

// 10. Animation loop
function animate() {
    requestAnimationFrame(animate);

    const delta = isPaused ? 0 : clock.getDelta();

    // 10.1 Animate stars (twinkle and rotate)
    if (stars) {
        stars.material.opacity = 0.7 + Math.sin(Date.now() * 0.001) * 0.2;
        stars.rotation.y += 0.00005;
    }

    // 10.2 Rotate planets around the sun
    planets.forEach(planet => {
        planet.userData.angle += planet.userData.currentSpeed * delta;
        planet.position.x = Math.cos(planet.userData.angle) * planet.userData.orbitRadius;
        planet.position.z = Math.sin(planet.userData.angle) * planet.userData.orbitRadius;
        // 10.3 Rotate planet on its own axis
        planet.rotation.y += 0.01 * delta;
        // 10.4 Animate Saturn's ring
        if (planet.userData.ring) {
            planet.userData.ring.rotation.z += 0.003;
        }
    });

    renderer.render(scene, camera);
}

// 11. Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 12. Start the application
init();