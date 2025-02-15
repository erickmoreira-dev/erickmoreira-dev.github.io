import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

type Assists = {
  screenMesh: THREE.Mesh;
  computerMesh: THREE.Mesh;
  crtMesh: THREE.Mesh;
  keyboardMesh: THREE.Mesh;
  shadowPlaneMesh: THREE.Mesh;
  bakeTexture: THREE.Texture;
  bakeFloorTexture: THREE.Texture;
  publicPixelFont: Font;
  chillFont: Font;
  environmentMapTexture: THREE.CubeTexture;
};

function loadAssists(callback: (assists: Assists) => any) {
  const assists: any = {};
  const minLoadTime = 3000; // 3 segundos
  const startTime = Date.now();

  const loadingDOM = document.querySelector("#loading");
  const loadingItemsDOM = document.querySelector("#loading-items");
  const loadingBarDOM = document.querySelector("#loading-bar-progress");

  const messages = [
    "Booting system...",
    "Loading assets...",
    "Preparing graphics...",
    "Loading shaders...",
    "Nearly There..."
  ];

  let isLoading = true; // Flag para controlar o loop

  // Função para mostrar mensagens sequencialmente
  const showMessages = async () => {
    while (isLoading) {
      for (const message of messages) {
        if (!isLoading) break;
        if (loadingItemsDOM) {
          loadingItemsDOM.textContent = message;
          console.log("Showing message:", message);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
  };

  // Iniciar sequência de mensagens
  showMessages();

  const manager = new THREE.LoadingManager();

  // Adicionar animação de loading no início
  if (loadingBarDOM) {
    loadingBarDOM.classList.add('loading-animation');
  }

  manager.onProgress = function (url, itemsLoaded, itemsTotal) {
    if (!loadingItemsDOM || !loadingBarDOM) return;
    
    const elapsed = Date.now() - startTime;
    const loadProgress = itemsLoaded / itemsTotal;
    const timeProgress = Math.min(elapsed / minLoadTime, 1);
    const totalProgress = Math.min(loadProgress, timeProgress);
    
    console.log("Loading progress:", totalProgress);
    
    (loadingBarDOM as HTMLElement).style.transform = `scaleX(${totalProgress})`;
  };

  manager.onLoad = function () {
    console.log("Loading complete");
    if (!loadingItemsDOM || !loadingBarDOM) return;
    
    const elapsed = Date.now() - startTime;
    const remainingTime = Math.max(0, minLoadTime - elapsed);

    setTimeout(() => {
      isLoading = false;
      if (loadingItemsDOM) {
        loadingItemsDOM.textContent = "Ready!";
      }
      
      // Garantir que a barra esteja completa antes de piscar
      if (loadingBarDOM) {
        loadingBarDOM.classList.remove('loading-animation');
        (loadingBarDOM as HTMLElement).style.transform = 'scaleX(1)';
        
        // Pequeno delay antes de começar a piscar
        setTimeout(() => {
          loadingBarDOM.classList.add('blink-animation');
        }, 100);
      }
      
      setTimeout(() => {
        if (loadingDOM) {
          loadingDOM.classList.add('done');
          callback(assists as Assists);
        }
      }, 500);
      
    }, remainingTime);
  };

  // Fonts
  const fontLoader = new FontLoader(manager);
  fontLoader.load("/fonts/public-pixel.json", (font) => {
    assists.publicPixelFont = font;
  });
  fontLoader.load("/fonts/chill.json", (font) => {
    assists.chillFont = font;
  });

  // Texture
  const textureLoader = new THREE.TextureLoader(manager);
  
  // Bake texture
  textureLoader.load("/textures/bake-quality-5.jpg", (tex) => {
    tex.flipY = false;
    tex.encoding = THREE.sRGBEncoding;
    tex.generateMipmaps = true;
    assists.bakeTexture = tex;
  });

  // Floor texture
  textureLoader.load("/textures/bake_floor-quality-3.jpg", (tex) => {
    tex.flipY = false;
    tex.encoding = THREE.sRGBEncoding;
    tex.generateMipmaps = true;
    assists.bakeFloorTexture = tex;
  });

  // Environment map
  const cubeTextureLoader = new THREE.CubeTextureLoader(manager);
  cubeTextureLoader.load(
    [
      "/textures/environmentMap/px.jpg",
      "/textures/environmentMap/nx.jpg",
      "/textures/environmentMap/py.jpg",
      "/textures/environmentMap/ny.jpg",
      "/textures/environmentMap/pz.jpg",
      "/textures/environmentMap/nz.jpg",
    ],
    (environmentMap) => {
      environmentMap.encoding = THREE.sRGBEncoding;
      assists.environmentMapTexture = environmentMap;
    }
  );

  // Mesh
  const gltfLoader = new GLTFLoader(manager);
  gltfLoader.load("/models/Commodore710_33.5.glb", (gltf) => {
    assists.screenMesh = gltf.scene.children.find((m) => m.name === "Screen");
    assists.computerMesh = gltf.scene.children.find(
      (m) => m.name === "Computer"
    );
    assists.crtMesh = gltf.scene.children.find((m) => m.name === "CRT");
    assists.keyboardMesh = gltf.scene.children.find(
      (m) => m.name === "Keyboard"
    );
    assists.shadowPlaneMesh = gltf.scene.children.find(
      (m) => m.name === "ShadowPlane"
    );
 
  });
}

export { loadAssists };
export type { Assists };
