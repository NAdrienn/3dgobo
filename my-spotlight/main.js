import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js';

function generateNoiseTexture(width, height, variation = 50) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const shade = Math.floor(Math.random() * variation);
    data[i] = shade;
    data[i + 1] = shade;
    data[i + 2] = shade;
    data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

function createCheckerboardTexture(size = 512, squares = 8) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const squareSize = size / squares;

  for (let y = 0; y < squares; y++) {
    for (let x = 0; x < squares; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#00ff00' : '#003300';
      ctx.fillRect(x * squareSize, y * squareSize, squareSize, squareSize);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Alap színtér
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 4, 7);
camera.lookAt(0, 3, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Szoba dimenziók
const roomWidth = 10;
const roomDepth = 10;
const roomHeight = 6;

const wallMaterial = new THREE.MeshStandardMaterial({
  color: 0x222222,
  bumpMap: generateNoiseTexture(256, 256, 50),
  bumpScale: 0.05,
  roughness: 0.8,
  metalness: 0
});
const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0x444444,
  bumpMap: generateNoiseTexture(256, 256, 30),
  bumpScale: 0.05,
  roughness: 0.8,
  metalness: 0
});
const ceilingMaterial = floorMaterial;

// Padló
const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomDepth), floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Plafon
const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomDepth), ceilingMaterial);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = roomHeight;
scene.add(ceiling);

// Falak
const createWall = (width, height, position, rotation = 0) => {
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), wallMaterial);
  wall.position.copy(position);
  wall.rotation.y = rotation;
  scene.add(wall);
};
createWall(roomWidth, roomHeight, new THREE.Vector3(0, roomHeight / 2, -roomDepth / 2));
createWall(roomDepth, roomHeight, new THREE.Vector3(-roomWidth / 2, roomHeight / 2, 0), Math.PI / 2);
createWall(roomDepth, roomHeight, new THREE.Vector3(roomWidth / 2, roomHeight / 2, 0), -Math.PI / 2);
createWall(roomWidth, roomHeight, new THREE.Vector3(0, roomHeight / 2, roomDepth / 2), Math.PI);

// Projektor (gúla)
const coneRadius = 0.3;
const coneHeight = 1;
const coneBaseY = roomHeight - 0.5;
const projectorPosition = new THREE.Vector3(0, coneBaseY, 0);

const coneGeom = new THREE.ConeGeometry(coneRadius, coneHeight, 32, 1, false);
const coneMat = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  opacity: 0.4,
  transparent: true,
  side: THREE.DoubleSide
});
const cone = new THREE.Mesh(coneGeom, coneMat);
cone.position.copy(projectorPosition);
cone.rotation.x = -Math.PI / 2;
scene.add(cone);

// Vetített kör
const diskMaterial = new THREE.MeshBasicMaterial({
  map: createCheckerboardTexture(),
  transparent: true,
  opacity: 0.7,
  side: THREE.DoubleSide
});
const disk = new THREE.Mesh(new THREE.CircleGeometry(coneRadius, 64), diskMaterial);
scene.add(disk);

// SpotLight - extra erősen!
const spotlight = new THREE.SpotLight(0x00ff00, 15, 50, Math.PI / 6, 0.2, 2);
spotlight.position.copy(projectorPosition);
scene.add(spotlight);

const lightTarget = new THREE.Object3D();
scene.add(lightTarget);
spotlight.target = lightTarget;

// Környezeti fény
scene.add(new THREE.AmbientLight(0x404040, 0.3));

// Animáció
function animate(t) {
  requestAnimationFrame(animate);

  const angle = t * 0.001;
  const rotationSpeed = 0.5;
  const distance = 5;
  const yOffset = 2 + Math.sin(t * 0.0015) * 1.5;

  // Kör mozgatása
  const x = distance * Math.cos(angle);
  const z = distance * Math.sin(angle);
  const diskPos = new THREE.Vector3(x, yOffset, z);

  // Gúla forog a kör irányába
  cone.lookAt(diskPos);

  // Kör elhelyezése és iránya
  disk.position.copy(diskPos);
  disk.lookAt(cone.position);

  // Fény iránya
  lightTarget.position.copy(diskPos);
  spotlight.position.copy(cone.position);

  renderer.render(scene, camera);
}

animate();
