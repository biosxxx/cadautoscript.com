import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
// RoundedBoxGeometry removed in favor of ExtrudeGeometry

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, this.getAspectRatio(), 0.1, 1000);
    this.camera.position.set(25, 25, 25);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
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
    this.lastSize = null;

    this.addLights();
    this.createPlaqueMesh();
    this.animate = this.animate.bind(this);
    this.animate();
  }

  getAspectRatio() {
    const { clientWidth, clientHeight } = this.canvas;
    return clientWidth > 0 && clientHeight > 0 ? clientWidth / clientHeight : 1;
  }

  addLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(1, 1, 1).normalize();
    this.scene.add(directional);
  }

  createRoundedRectShape(width, height, radius) {
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -height / 2;
    // Clamp radius
    const r = Math.min(radius, Math.min(width, height) / 2);

    shape.moveTo(x + r, y);
    shape.lineTo(x + width - r, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + r);
    shape.lineTo(x + width, y + height - r);
    shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    shape.lineTo(x + r, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);

    return shape;
  }

  createPlaqueMesh() {
    // Initial dummy size: 15x15, depth 0.5
    const shape = this.createRoundedRectShape(15, 15, 0.5);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.5,
      bevelEnabled: false,
      curveSegments: 24
    });
    geometry.center();

    const material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    this.plaqueMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.plaqueMesh);
  }

  loadEnvironment() {
    return new Promise((resolve) => {
      new RGBELoader()
        .setPath('../../textures/')
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

    const shape = this.createRoundedRectShape(size.w, size.h, size.radius);
    this.plaqueMesh.geometry = new THREE.ExtrudeGeometry(shape, {
      depth: size.d,
      bevelEnabled: false,
      curveSegments: 48
    });
    this.plaqueMesh.geometry.center();

    this.lastSize = size;

    // Position centered
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

  async applyMaterial({ materialType, engravingCanvas }) {
    if (!this.plaqueMesh || !engravingCanvas) return;
    if (this.engravingTexture) {
      this.engravingTexture.dispose();
      this.engravingTexture = null;
    }

    this.engravingTexture = new THREE.CanvasTexture(engravingCanvas);
    this.engravingTexture.magFilter = THREE.NearestFilter;
    this.engravingTexture.minFilter = THREE.NearestFilter;

    // UV Calculation:
    // ExtrudeGeometry maps world X/Y directly to U/V scaling 1:1.
    // Texture is 0..1. We need to scale texture to match Object Size (world units).
    // repeat = 1 / size
    // offset = 0.5 (since geometry is centered at 0,0, range -w/2 to w/2 -> -0.5 to 0.5 -> +0.5 offset -> 0 to 1)

    const size = this.lastSize || { w: 15, h: 15 };
    this.engravingTexture.wrapS = THREE.RepeatWrapping;
    this.engravingTexture.wrapT = THREE.RepeatWrapping;
    this.engravingTexture.repeat.set(1 / size.w, 1 / size.h);
    this.engravingTexture.offset.set(0.5, 0.5);

    const bumpScale = 0.05;
    let material;

    if (materialType === 'copper' || materialType === 'steel') {
      const baseConfig =
        materialType === 'copper'
          ? { color: 0xb87333, metalness: 0.9, roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.2 }
          : { color: 0xc0c0c0, metalness: 1, roughness: 0.2, clearcoat: 0.3, clearcoatRoughness: 0.1 };

      material = new THREE.MeshPhysicalMaterial({
        ...baseConfig,
        roughnessMap: this.engravingTexture,
        metalnessMap: this.engravingTexture,
        bumpMap: this.engravingTexture,
        bumpScale,
        envMapIntensity: 1,
      });

      // Align all maps
      material.roughnessMap.repeat.copy(this.engravingTexture.repeat);
      material.roughnessMap.offset.copy(this.engravingTexture.offset);

      material.metalnessMap.repeat.copy(this.engravingTexture.repeat);
      material.metalnessMap.offset.copy(this.engravingTexture.offset);

      material.bumpMap.repeat.copy(this.engravingTexture.repeat);
      material.bumpMap.offset.copy(this.engravingTexture.offset);

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

      material.map.repeat.copy(this.engravingTexture.repeat);
      material.map.offset.copy(this.engravingTexture.offset);

      material.bumpMap.repeat.copy(this.engravingTexture.repeat);
      material.bumpMap.offset.copy(this.engravingTexture.offset);
    }

    this.disposeMaterial(Array.isArray(this.plaqueMesh.material) ? this.plaqueMesh.material : this.plaqueMesh.material);

    if (materialType === 'copper' || materialType === 'steel') {
      const baseMaterial = material.clone();
      baseMaterial.roughnessMap = null;
      baseMaterial.metalnessMap = null;
      baseMaterial.bumpMap = null;
      baseMaterial.map = null;

      // Group 0: Front/Back (Engraved)
      // Group 1: Sides (Plain)
      this.plaqueMesh.material = [material, baseMaterial];
    } else {
      const sideMaterial = material.clone();
      // For granite, keeping sides plain dark without texture or using same texture?
      // If we use same texture on sides, UVs will be messed up (streaked).
      // Better to use plain material.
      sideMaterial.map = null;
      this.plaqueMesh.material = [material, sideMaterial];
    }
  }

  resize() {
    if (!this.canvas) return;
    this.camera.aspect = this.getAspectRatio();
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
  }
}
