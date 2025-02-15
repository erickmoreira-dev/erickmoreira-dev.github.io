import * as THREE from 'three';
import { loadAssists } from './loader';
import type { Assists } from './loader';

export default class Experience {
  private scene: THREE.Scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;
  private loading: boolean = true;
  private loadingProgress: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    console.log('Experience: Initializing');
    
    this.canvas = canvas;
    
    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 5);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    
    // Configurações do renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Carregar assets
    loadAssists((assists: Assists) => {
      this.setupScene(assists);
      this.loading = false;
    });

    window.addEventListener('resize', () => this.onResize());
  }

  private setupScene(assists: Assists): void {
    // Setup básico da cena
    if (assists.computerMesh) {
      this.scene.add(assists.computerMesh);
    }
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public update(): void {
    if (!this.loading) {
      this.renderer.render(this.scene, this.camera);
    }
  }
} 