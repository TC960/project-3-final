// Modified brainViewer.js with container ID fix
// This is a modified version of the original brainViewer.js to work with the new HTML structure

console.log("brainViewer.js is loading, THREE object:", THREE);

// Import necessary Three.js modules
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Initialize scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf5f7fa); // Lighter background to match new design
const axesHelper = new THREE.AxesHelper(1);
scene.add(axesHelper);

// Initialize camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2, 3); // Adjusted camera position

// Find the correct container in the new HTML structure
let container;
document.addEventListener('DOMContentLoaded', function() {
  console.log("Looking for brain container...");
  container = document.getElementById('brain-container');
  
  if (!container) {
    // Try to find it in the card content
    container = document.querySelector('.brain-card .card-content');
    if (container) {
      console.log("Found container in card content");
      container.id = 'brain-container';
    } else {
      console.error("Brain container not found, creating a fallback container");
      container = document.createElement('div');
      container.id = 'brain-container';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.position = 'relative';
      
      // Try to add it to the brain card if it exists
      const brainCard = document.querySelector('.brain-card');
      if (brainCard) {
        brainCard.appendChild(container);
      } else {
        // Last resort: add to body
        document.body.appendChild(container);
      }
    }
  }
  
  console.log("Container found or created:", container);
  
  // Initialize renderer
  initializeRenderer();
});

// Initialize renderer and start rendering
function initializeRenderer() {
  // Initialize renderer with container
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);
  console.log("Renderer initialized with size:", container.clientWidth, "x", container.clientHeight);

  // Lighting setup - improved for modern look
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(0, 3, 2);
  scene.add(dirLight);
  const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
  backLight.position.set(0, 1, -2);
  scene.add(backLight);

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.rotateSpeed = 0.7;
  controls.minDistance = 1.5;
  controls.maxDistance = 7;

  // Electrode positions (10-20 system)
  const electrodePositions = {
    TP9: [0.45, 0.8, -0.07],
    AF7: [0.45, 1.0, 0.18],
    AF8: [-0.45, 1.0, 0.18],
    TP10: [-0.45, 0.8, -0.07],
    "Right AUX": [-0.5, 0.9, 0.05]
  };

  const electrodes = {};
  const electrodeGroup = new THREE.Group();

  // Updated colors to match modern design
  const electrodeColors = {
    'TP9': 0x4F8CFF,
    'AF7': 0x4ECDC4,
    'AF8': 0xFFB865,
    'TP10': 0xFF6B6B,
    'Right AUX': 0xC788E5
  };

  // Create glow texture
  function createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    
    // Create a much more gradual gradient
    const gradient = context.createRadialGradient(
      32, 32, 0,    // Inner circle center and radius
      32, 32, 32    // Outer circle center and radius
    );
    
    // Use more transparent gradient stops
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');  // Center is only 50% opaque
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)'); // 20% opaque at 30% radius
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');    // Completely transparent at the edge
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  // Add electrodes
  Object.entries(electrodePositions).forEach(([label, pos]) => {
    const geo = new THREE.SphereGeometry(0.03, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: electrodeColors[label] || 0x00ffff,
      emissive: electrodeColors[label] || 0x00ffff,
      emissiveIntensity: 0.4,
      metalness: 0.3,
      roughness: 0.4
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    mesh.userData = {
      label: label,
      interactive: true,
      isHovered: false
    };
    electrodes[label] = mesh;
    electrodeGroup.add(mesh);

    const spriteMat = new THREE.SpriteMaterial({
      map: createGlowTexture(),
      color: electrodeColors[label] || 0x004444,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.01, 0.01, 0.01);
    mesh.add(sprite);
  });

  // EEG data state
  let eegData = [], currentIndex = 0, isDataLoaded = false;

  // Load EEG data from CSV
  async function loadEEGData() {
    try {
      console.log("Attempting to load EEG data...");
      const res = await fetch('Experiment_1/A1/EEG_recording.csv');
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const text = await res.text();
      console.log("EEG data loaded, parsing...");
      eegData = text.trim().split('\n').slice(1).map(row => {
        const [timestamp, TP9, AF7, AF8, TP10, AUX] = row.split(',').map(Number);
        return { timestamp, TP9, AF7, AF8, TP10, "Right AUX": AUX };
      });
      isDataLoaded = true;
      checkLoadingComplete();
      
      // Expose EEG data to global scope for tooltip access
      window.brainViewerEEGData = eegData;
      console.log("EEG data parsed successfully");
      
    } catch (err) {
      console.error("Error loading EEG data:", err);
      console.log("Generating sample EEG data instead");
      
      // Generate sample data if real data can't be loaded
      eegData = [];
      for (let i = 0; i < 500; i++) {
        eegData.push({
          timestamp: i,
          TP9: Math.sin(i * 0.01) * 250 + (Math.random() - 0.5) * 100,
          AF7: Math.sin(i * 0.015) * 200 + (Math.random() - 0.5) * 100,
          AF8: Math.sin(i * 0.02) * 150 + (Math.random() - 0.5) * 100,
          TP10: Math.sin(i * 0.025) * 300 + (Math.random() - 0.5) * 100,
          "Right AUX": Math.sin(i * 0.03) * 280 + (Math.random() - 0.5) * 100
        });
      }
      isDataLoaded = true;
      checkLoadingComplete();
      window.brainViewerEEGData = eegData;
    }
  }

  let isBrainLoaded = false;

  // Load brain model with better error handling
  const loader = new GLTFLoader();
  console.log("Attempting to load brain model...");
  
  // Try multiple paths if needed
  const tryLoadModel = (paths, index = 0) => {
    if (index >= paths.length) {
      console.error("Failed to load brain model after trying all paths");
      // Create a fallback brain model
      createFallbackBrain();
      return;
    }
    
    console.log(`Trying to load brain from: ${paths[index]}`);
    loader.load(
      paths[index],
      (gltf) => {
        console.log("Brain model loaded successfully!");
        const brain = gltf.scene;
        brain.scale.set(1.3, 1.3, 1.3);
        brain.position.set(0, -0.7, 0); // Adjusted position to bring model down

        brain.traverse(child => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0xf0f0f0,
              roughness: 0.5,
              metalness: 0.1,
              transparent: true,
              opacity: 0.9
            });
          }
        });

        scene.add(brain);
        brain.add(electrodeGroup);
        electrodeGroup.position.set(0, -0.4, 0);
        isBrainLoaded = true;
        checkLoadingComplete();
        
        // Make brain model visible to global scope
        window.brainModel = brain;
      },
      (progress) => {
        console.log(`Loading progress: ${Math.round(progress.loaded / progress.total * 100)}%`);
      },
      (error) => {
        console.error(`Error loading brain model from ${paths[index]}:`, error);
        // Try next path
        tryLoadModel(paths, index + 1);
      }
    );
  };

  // Try loading from multiple possible paths
  tryLoadModel([
    'brain.glb',
    './brain.glb',
    '../brain.glb',
    './assets/brain.glb',
    './models/brain.glb'
  ]);

  // Create a fallback brain if the model can't be loaded
  function createFallbackBrain() {
    console.log("Creating fallback brain model");
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      roughness: 0.7,
      metalness: 0.1,
      transparent: true,
      opacity: 0.9
    });
    const brain = new THREE.Mesh(geometry, material);
    scene.add(brain);
    brain.add(electrodeGroup);
    electrodeGroup.position.set(0, 0, 0);
    isBrainLoaded = true;
    checkLoadingComplete();
    
    // Add wrinkle-like texture to the fallback brain
    const wrinkles = new THREE.Group();
    for (let i = 0; i < 20; i++) {
      const curve = new THREE.EllipseCurve(
        0, 0,
        Math.random() * 0.7 + 0.5, Math.random() * 0.7 + 0.5,
        0, Math.PI * 2,
        false, Math.random() * Math.PI
      );
      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ 
        color: 0xdddddd,
        transparent: true,
        opacity: 0.5
      });
      const ellipse = new THREE.Line(geometry, material);
      ellipse.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      wrinkles.add(ellipse);
    }
    brain.add(wrinkles);
  }

  function checkLoadingComplete() {
    if (isBrainLoaded && isDataLoaded) {
      console.log("Loading complete, hiding loading indicator");
      document.getElementById('loading').style.display = 'none';
    }
  }

  let frameCount = 0;
  const animationSpeed = 1;

  function animate() {
    requestAnimationFrame(animate);
    controls.update();

    if (isDataLoaded && eegData.length > 0) {
      frameCount++;
      if (frameCount >= animationSpeed) {
        frameCount = 0;
        const sample = eegData[currentIndex];
        
        // Update global current index for tooltip access
        window.brainViewerCurrentIndex = currentIndex;
        
        Object.entries(sample).forEach(([label, value]) => {
          if (label !== 'timestamp' && electrodes[label]) {
            const sphere = electrodes[label];
            const normVal = Math.max(0, Math.min(1, (value + 500) / 1000));
            
            // Only update if not currently being highlighted by hover
            if (!sphere.userData.isHovered) {
              // Use electrode colors from our new palette
              const color = electrodeColors[label] || 0x00ffff;
              sphere.material.color.set(color);
              sphere.material.emissive.set(color);
              sphere.material.emissiveIntensity = 0.2 + normVal * 0.6;
            }
            
            sphere.scale.setScalar(0.9 + normVal * 1.0);
            if (sphere.children[0]) {
              sphere.children[0].material.color.set(electrodeColors[label] || 0x00ffff);
              sphere.children[0].scale.setScalar(1.2 + normVal * 1.5);
            }
          }
        });
        currentIndex = (currentIndex + 1) % eegData.length;
      }
    }

    renderer.render(scene, camera);
  }

  // Expose objects to global scope for tooltip functionality
  window.brainViewerScene = scene;
  window.brainViewerCamera = camera;
  window.brainViewerRenderer = renderer;
  window.brainViewerElectrodes = electrodes;
  window.brainViewerCurrentIndex = 0;

  // Start loading data and animation
  loadEEGData().then(() => animate());

  // Update renderer size function
  function updateRendererSize() {
    if (!container) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    console.log("Renderer size updated:", width, "x", height);
  }

  // Handle resize
  window.addEventListener('resize', updateRendererSize);

  // Call immediately to ensure correct initial sizing
  updateRendererSize();
}