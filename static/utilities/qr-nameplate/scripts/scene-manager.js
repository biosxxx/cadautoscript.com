import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, this.getAspectRatio(), 0.1, 1000);
    this.camera.position.set(25, 25, 25);

    this.renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true});
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 100;

    this.plaqueMesh = null;
    this.currentMaterial = null;
    this.engravingTexture = null;

    this.addLights();
    this.createPlaqueMesh();
    this.animate = this.animate.bind(this);
    this.animate();
  }

  getAspectRatio() {
    const {clientWidth, clientHeight} = this.canvas;
    return clientWidth > 0 && clientHeight > 0 ? clientWidth / clientHeight : 1;
  }

  addLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(1, 1, 1).normalize();
    this.scene.add(directional);
  }

  createPlaqueMesh() {
    const geometry = new RoundedBoxGeometry(15, 15, 0.5, 8, 0.5);
    const material = new THREE.MeshStandardMaterial({color: 0xcccccc});
    this.plaqueMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.plaqueMesh);
  }

  loadEnvironment() {
    return new Promise((resolve) => {
      new RGBELoader()
        .setPath('https://threejs.org/examples/textures/equirectangular/')
        .load('venice_sunset_1k.hdr', (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          this.scene.environment = texture;
          resolve();
        });
    });
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  updateGeometry(size) {
    if (!this.plaqueMesh) return;
    this.plaqueMesh.geometry.dispose();
    this.plaqueMesh.geometry = new RoundedBoxGeometry(size.w, size.h, size.d, 8, size.radius);
    this.plaqueMesh.position.set(0, 0, 0);

    const cameraDistance = Math.max(size.w, size.h) * 1.5;
    this.camera.position.set(cameraDistance, cameraDistance, cameraDistance);
    this.camera.lookAt(0, 0, 0);
    this.controls.target.set(0, 0, 0);
  }

  disposeMaterial(material) {
    if (!material) return;
    if (Array.isArray(material)) {
      material.forEach((m) => this.disposeMaterial(m));
      return;
    }
    if (material.map) material.map.dispose();
    if (material.bumpMap) material.bumpMap.dispose();
    if (material.roughnessMap) material.roughnessMap.dispose();
    if (material.metalnessMap) material.metalnessMap.dispose();
    material.dispose();
  }

  createGraniteTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#303030';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 2000; i += 1) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 3 + 0.5;
      const opacity = Math.random() * 0.3 + 0.05;
      ctx.fillStyle = `rgba(180, 180, 180, ${opacity})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  combineTextures(baseTexture, engravingCanvas) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (baseTexture.image) {
      ctx.drawImage(baseTexture.image, 0, 0, canvas.width, canvas.height);
    }
    if (engravingCanvas) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      const engravingData = engravingCanvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 0; i < pixels.length; i += 4) {
        if (engravingData[i] > 128) {
          pixels[i] = Math.min(255, pixels[i] + 50);
          pixels[i + 1] = Math.min(255, pixels[i + 1] + 50);
          pixels[i + 2] = Math.min(255, pixels[i + 2] + 50);
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }
    return new THREE.CanvasTexture(canvas);
  }

  async applyMaterial({materialType, engravingCanvas}) {
    if (!this.plaqueMesh || !engravingCanvas) return;
    if (this.engravingTexture) {
      this.engravingTexture.dispose();
      this.engravingTexture = null;
    }

    this.engravingTexture = new THREE.CanvasTexture(engravingCanvas);
    this.engravingTexture.magFilter = THREE.NearestFilter;
    this.engravingTexture.minFilter = THREE.NearestFilter;

    const bumpScale = 0.05;
    let material;

    if (materialType === 'copper' || materialType === 'steel') {
      const baseConfig =
        materialType === 'copper'
          ? {color: 0xb87333, metalness: 0.9, roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.2}
          : {color: 0xc0c0c0, metalness: 1, roughness: 0.2, clearcoat: 0.3, clearcoatRoughness: 0.1};

      material = new THREE.MeshPhysicalMaterial({
        ...baseConfig,
        roughnessMap: this.engravingTexture,
        metalnessMap: this.engravingTexture,
        bumpMap: this.engravingTexture,
        bumpScale,
        envMapIntensity: 1,
      });
      material.roughnessMap.magFilter = THREE.NearestFilter;
      material.roughnessMap.minFilter = THREE.NearestFilter;
      material.metalnessMap.magFilter = THREE.NearestFilter;
      material.metalnessMap.minFilter = THREE.NearestFilter;
    } else {
      const graniteTexture = this.createGraniteTexture();
      const composite = this.combineTextures(graniteTexture, engravingCanvas);
      graniteTexture.dispose();
      material = new THREE.MeshPhysicalMaterial({
        color: 0x303030,
        metalness: 0.05,
        roughness: 0.8,
        map: composite,
        bumpMap: this.engravingTexture,
        bumpScale: -bumpScale,
        clearcoat: 0.1,
        clearcoatRoughness: 0.5,
        envMapIntensity: 0.5,
      });
    }

    this.disposeMaterial(Array.isArray(this.plaqueMesh.material) ? this.plaqueMesh.material : this.plaqueMesh.material);

    if (materialType === 'copper' || materialType === 'steel') {
      const baseMaterial = material.clone();
      baseMaterial.roughnessMap = null;
      baseMaterial.metalnessMap = null;
      baseMaterial.bumpMap = null;
      this.plaqueMesh.material = [
        baseMaterial.clone(),
        baseMaterial.clone(),
        baseMaterial.clone(),
        baseMaterial.clone(),
        material,
        baseMaterial.clone(),
      ];
    } else {
      this.plaqueMesh.material = material;
    }
  }

  resize() {
    if (!this.canvas) return;
    this.camera.aspect = this.getAspectRatio();
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
  }
}
