import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import WebGL from '/src/webgl';

class GameBoy {
  constructor() {
    this.init();
    this.wireframe = false;
  }

  async init() {
    // Setup loading screen
    this.setupLoading();

    // Initialize Three.js scene
    this.setupScene();
    
    // Setup environment maps
    await this.setupEnvironment();

    // Load assets
    await this.loadAssets();

    // Setup Cartridge components
    this.setupCartridge();

    // Setup controls and inputs
    this.setupControls();

    // Setup Audio
    this.setupAudio();

    // Start animation loop
    this.animate();

    // Hide loading screen
    setTimeout(() => {
      const loadingElement = document.getElementById('loading');
      if (loadingElement) {
        loadingElement.classList.add('done');
      }
    }, 500);
  }

  setupLoading() {
    this.loadingElement = document.getElementById('loading');
    this.loadingBarProgress = document.getElementById('loading-bar-progress');
    this.loadingItems = document.getElementById('loading-items');

    this.loadingMessages = [
      "Carregando assets...",
      "Construindo o cartucho...",
      "Preparando componentes...",
      "Quase pronto..."
    ];

    // Update loading message
    this.messageInterval = setInterval(() => {
      const randomMessage = this.loadingMessages[Math.floor(Math.random() * this.loadingMessages.length)];
      if (this.loadingItems) {
        this.loadingItems.textContent = randomMessage;
      }
    }, 1000);
  }

  setupScene() {
    // Canvas
    this.canvas = document.querySelector('.webgl');

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#f6d4b1');

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 0, 5);
    this.scene.add(this.camera);

    // Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight.position.set(1, 2, 3);
    this.scene.add(this.directionalLight);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.physicallyCorrectLights = true;
    
    // Controls
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = true;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 10;

    // Handle resize
    window.addEventListener('resize', () => {
      // Update camera
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();

      // Update renderer
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }

  async setupEnvironment() {
    return new Promise((resolve) => {
      this.loadingItems.textContent = "Carregando mapa de ambiente...";
      
      // Carregar apenas o segundo mapa de ambiente
      const rgbeLoader = new RGBELoader();
      rgbeLoader.load('/envMaps/custom-002.hdr', (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.environment = texture;
        resolve();
      });
    });
  }

  async loadAssets() {
    return new Promise((resolve) => {
      const loadingManager = new THREE.LoadingManager();
      loadingManager.onProgress = (url, loaded, total) => {
        const progress = (loaded / total) * 100;
        this.loadingBarProgress.style.transform = `scaleX(${progress / 100})`;
        
        // Mensagens aleatórias de carregamento
        const messages = [
          "Inicializando sistema...",
          "Carregando componentes...",
          "Montando circuito...",
          "Conectando chips...",
          "Configurando GameBoy...",
          "Preparando Meu GameBoy...", // Modificado para corresponder ao novo título
          "Quase pronto...",
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        this.loadingItems.textContent = randomMessage;
      };
      
      // Inicialize o loader do GLTF
      this.gltfLoader = new GLTFLoader(loadingManager);
      
      // Carregue o modelo do case
      this.gltfLoader.load('/models/case.glb', (gltf) => {
        this.caseModel = gltf.scene;
        console.log("Case model loaded:", this.caseModel);
        
        // Renomear GameBoy na parte superior
        this.updateGameboyTitle(this.caseModel);
        
        this.scene.add(this.caseModel);
      });

      this.gltfLoader.load('/models/circuit.glb', (gltf) => {
        this.circuitModel = gltf.scene;
        console.log("Circuit model loaded:", this.circuitModel);
        this.scene.add(this.circuitModel);
      });

      this.gltfLoader.load('/models/screw.glb', (gltf) => {
        this.screwModel = gltf.scene;
        console.log("Screw model loaded:", this.screwModel);
        this.scene.add(this.screwModel);
      });

      this.gltfLoader.load('/models/sticker.glb', (gltf) => {
        this.stickerModel = gltf.scene;
        console.log("Sticker model loaded:", this.stickerModel);
        
        // Também verificar o sticker para possíveis textos
        this.updateGameboyTitle(this.stickerModel);
        
        this.scene.add(this.stickerModel);
      });

      // Load audio
      this.audioLoader = new THREE.AudioLoader(loadingManager);
      this.audioLoader.load('/sounds/debrisOpening.mp3', (buffer) => {
        this.openingSound = buffer;
      });
      
      this.audioLoader.load('/sounds/debrisClosing.mp3', (buffer) => {
        this.closingSound = buffer;
      });

      resolve();
    });
  }

  // Função para atualizar o título do GameBoy no modelo 3D
  updateGameboyTitle(model) {
    if (!model) return;
    
    // Procurar por objetos que podem conter texto ou decals do título
    model.traverse(child => {
      // Verifica se o objeto tem materiais que podem conter texturas com texto
      if (child.isMesh && child.material) {
        const material = Array.isArray(child.material) ? child.material : [child.material];
        
        material.forEach(mat => {
          // Verifica se é um material relacionado a decal/sticker/etiqueta
          if (mat.name && (mat.name.toLowerCase().includes('sticker') || 
                          mat.name.toLowerCase().includes('label') ||
                          mat.name.toLowerCase().includes('text') ||
                          mat.name.toLowerCase().includes('decal'))) {
            console.log("Possível material de texto encontrado:", mat.name);
            
            // Se tiver um mapa de textura, poderia substituir - isso dependeria da estrutura do modelo
            if (mat.map) {
              console.log("Textura encontrada no material:", mat.map);
              // Aqui poderia ser implementada a substituição da textura
              // Isso exigiria criar uma nova textura com o texto atualizado
            }
          }
        });
      }
    });
    
    console.log("Tentativa de atualização do título do GameBoy aplicada");
  }

  // Método auxiliar para inspecionar a estrutura do modelo
  logModelStructure(model) {
    if (!model) return "Modelo não carregado";
    
    const structure = {
      name: model.name,
      children: []
    };
    
    model.traverse(child => {
      if (child.isMesh) {
        structure.children.push({
          name: child.name,
          type: 'Mesh',
          position: [child.position.x, child.position.y, child.position.z],
          material: child.material ? child.material.name || 'Sem nome' : 'Sem material'
        });
      } else if (child.isGroup) {
        structure.children.push({
          name: child.name,
          type: 'Group',
          position: [child.position.x, child.position.y, child.position.z],
          childCount: child.children.length
        });
      }
    });
    
    return structure;
  }

  saveComponentOriginalState(component) {
    // Salva a posição e rotação originais para restauração
    if (!component.userData.originalState) {
      component.userData.originalState = {
        position: {
          x: component.position.x,
          y: component.position.y,
          z: component.position.z
        },
        rotation: {
          x: component.rotation.x,
          y: component.rotation.y,
          z: component.rotation.z
        },
        scale: {
          x: component.scale.x,
          y: component.scale.y,
          z: component.scale.z
        }
      };
    }
    return component.userData.originalState;
  }
  
  restoreComponentToOriginalState(component) {
    // Restaura para a posição original, se armazenada
    if (component.userData.originalState) {
      const original = component.userData.originalState;
      
      gsap.to(component.position, {
        x: original.position.x,
        y: original.position.y,
        z: original.position.z,
        duration: 1.5,
        ease: "power2.inOut"
      });
      
      gsap.to(component.rotation, {
        x: original.rotation.x,
        y: original.rotation.y,
        z: original.rotation.z,
        duration: 1.5,
        ease: "power2.inOut"
      });
      
      gsap.to(component.scale, {
        x: original.scale.x,
        y: original.scale.y,
        z: original.scale.z,
        duration: 1.5,
        ease: "power2.inOut"
      });
    }
  }

  setupCartridge() {
    // Position adjustments for cartridge components
    if (this.caseModel) {
      this.caseModel.position.set(0, 0, 0);
      this.caseModel.traverse(child => {
        if (child.isMesh && child.material) {
          child.material.envMapIntensity = 1.2;
        }
      });
    }

    if (this.circuitModel) {
      this.circuitModel.position.set(0, 0, 0);
      this.circuitModel.traverse(child => {
        if (child.isMesh && child.material) {
          child.material.envMapIntensity = 1.5;
        }
      });
    }

    if (this.screwModel) {
      this.screwModel.position.set(0, 0, 0);
      this.screwModel.traverse(child => {
        if (child.isMesh && child.material) {
          child.material.envMapIntensity = 2.5;
          child.material.metalness = 1.0;
          child.material.roughness = 0.2;
        }
      });
    }

    if (this.stickerModel) {
      this.stickerModel.position.set(0, 0, 0);
      this.stickerModel.traverse(child => {
        if (child.isMesh && child.material) {
          child.material.envMapIntensity = 0.8;
        }
      });
    }
    
    // Create a group for all components
    this.cartridgeGroup = new THREE.Group();
    if (this.caseModel) this.cartridgeGroup.add(this.caseModel);
    if (this.circuitModel) this.cartridgeGroup.add(this.circuitModel);
    if (this.screwModel) this.cartridgeGroup.add(this.screwModel);
    if (this.stickerModel) this.cartridgeGroup.add(this.stickerModel);
    
    this.scene.add(this.cartridgeGroup);
  }

  setupControls() {
    // Controls for exploding/imploding the cartridge
    this.isExploded = false;
    
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        this.isExploded = !this.isExploded;
        this.toggleExplodedView();
        this.updateExplodeButtonText();
      }
    });
    
    // Add button listener for mobile devices
    this.explodeButton = document.querySelector('.explode-button');
    if (this.explodeButton) {
      this.explodeButton.addEventListener('click', () => {
        this.isExploded = !this.isExploded;
        this.toggleExplodedView();
        this.updateExplodeButtonText();
      });
    }
    
    // Auto-rotation quando não estiver interagindo
    this.autoRotate = true;
    this.controls.autoRotate = this.autoRotate;
    this.controls.autoRotateSpeed = 1.0;
    
    // Detectar quando o usuário começa a interagir com os controles
    this.controls.addEventListener('start', () => {
      this.autoRotate = false;
      this.controls.autoRotate = false;
    });
    
    // Reativar rotação automática após um período de inatividade
    this.inactivityTimer = null;
    this.controls.addEventListener('end', () => {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = setTimeout(() => {
        this.autoRotate = true;
        this.controls.autoRotate = true;
      }, 5000); // 5 segundos de inatividade
    });
  }

  updateExplodeButtonText() {
    if (this.explodeButton) {
      this.explodeButton.textContent = `SPACE para ${this.isExploded ? 'IMPLODIR' : 'EXPLODIR'}`;
    }
  }

  setupAudio() {
    // Create an audio listener and add it to the camera
    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);
    
    // Create a global audio source
    this.sound = new THREE.Audio(this.listener);
  }
  
  toggleExplodedView() {
    // Animate components to exploded or imploded positions
    const targetZ = this.isExploded ? 2 : 0;
    
    // Definir os delays base para cada etapa do processo de desmontagem
    const delayStages = {
      // Primeiro: parafusos são removidos
      screws: 0, 
      // Segundo: abertura das capas (frente/trás)
      caseOpening: 0.7,  // Reduzido de 1.2 para tornar a transição mais rápida
      // Terceiro: sticker é removido
      sticker: 0.3,  // Ligeiramente reduzido de 0.4 para uma sequência mais natural
      // Quarto: os chips começam a se soltar
      chips: {
        main: 0.7,  // Igualado ao caseOpening para movimentação simultânea com a capa
        green: 1.2,  // Reduzido de 1.7 para ficar mais próximo do main
        black: 1.3,  // Reduzido de 1.9 para minimizar tempo de espera
        silver: 1.4,  // Reduzido de 2.1 para seguir mais naturalmente
        gold: 1.5,    // Reduzido de 2.3 para um fluxo mais contínuo
        other: 1.2    // Reduzido de 2.0 para animar próximo dos chips verdes
      }
    };
    
    // Se estiver fechando (imploding), invertemos a ordem
    if (!this.isExploded) {
      delayStages.screws = 1.2;    // Aumentado de 1.0 para dar tempo da capa fechar bem
      delayStages.caseOpening = 0.2; // Reduzido de 0.3 para iniciar mais rápido
      delayStages.sticker = 1.5;   // Reduzido de 2.0 para não esperar tanto
      delayStages.chips.main = 0.2; // Igualado ao caseOpening para movimentação simultânea com a capa
      delayStages.chips.green = 0.05;  // Reduzido de 0.1 para uma transição mais suave
      delayStages.chips.black = 0.1;   // Reduzido de 0.15 para melhorar o fluxo
      delayStages.chips.silver = 0.15; // Reduzido de 0.2 para uma sequência mais contínua
      delayStages.chips.gold = 0.2;    // Reduzido de 0.25 para um ritmo mais natural
      delayStages.chips.other = 0.1;   // Reduzido de 0.15 para ficar junto com chips pretos
    }
    
    // Play sound
    if (this.isExploded && this.openingSound) {
      this.sound.setBuffer(this.openingSound);
      this.sound.setVolume(0.5);
      this.sound.play();
    } else if (!this.isExploded && this.closingSound) {
      this.sound.setBuffer(this.closingSound);
      this.sound.setVolume(0.5);
      this.sound.play();
    }
    
    // Animar parafusos - primeira parte da desmontagem
    if (this.screwModel) {
      console.log("Animando parafusos:", this.screwModel);
      
      // Log da estrutura do modelo de parafuso para debug
      this.screwModel.traverse(child => {
        if (child.isMesh) {
          console.log("Parafuso mesh encontrado:", child.name);
          this.saveComponentOriginalState(child);
          
          if (this.isExploded) {
            // Sequência de movimentos para simular o desparafusamento real
            gsap.to(child.rotation, {
              z: -Math.PI * 0.5, // Rotação negativa para parafuso saindo (sentido anti-horário)
              duration: 0.4,
              ease: "power1.out",
              delay: delayStages.screws,
              onComplete: () => {
                // Mais rotação e começa a sair
                gsap.to(child.rotation, {
                  z: -Math.PI * 1.0, // Rotação completa
                  duration: 0.3,
                  ease: "power1.inOut",
                  onComplete: () => {
                    // Movimento para FORA (NEGATIVO no eixo Z, afastando-se da placa)
                    gsap.to(child.position, {
                      z: child.position.z - 1.0, // Valor NEGATIVO para garantir movimento para FORA
                      duration: 0.2,
                      ease: "power1.out",
                      onComplete: () => {
                        // Rotação final e movimento para fora completo
                        gsap.to(child.rotation, {
                          z: -Math.PI * 1.5, // Mais rotação para visual mais convincente
                          duration: 0.3,
                          ease: "power2.inOut"
                        });
                        
                        gsap.to(child.position, {
                          z: child.position.z - 3.0, // Valor NEGATIVO MAIOR para garantir visibilidade do movimento
                          duration: 0.5,
                          ease: "power2.out"
                        });
                      }
                    });
                  }
                });
              }
            });
          } else {
            // Para a remontagem, os parafusos são os últimos
            gsap.to(child.position, {
              x: child.userData.originalState.position.x,
              y: child.userData.originalState.position.y,
              z: child.userData.originalState.position.z,
              duration: 1.0,
              ease: "power2.inOut",
              delay: delayStages.screws
            });
            
            gsap.to(child.rotation, {
              x: child.userData.originalState.rotation.x,
              y: child.userData.originalState.rotation.y,
              z: child.userData.originalState.rotation.z,
              duration: 1.2,
              ease: "power2.inOut",
              delay: delayStages.screws + 0.2
            });
          }
        }
      });
    }
    
    // Anime o case (capa) - vamos verificar a estrutura e tratar adequadamente
    // Após os parafusos começarem a ser removidos
    if (this.caseModel) {
      // Procurar por partes específicas da capa para separar
      let frontFound = false;
      let backFound = false;
      
      // Obtém todos os meshes do modelo
      const caseMeshes = [];
      this.caseModel.traverse(child => {
        if (child.isMesh) {
          caseMeshes.push(child);
          
          // Primeiro verificamos se há nomes específicos
          if (child.name.includes("Front") || child.name.includes("front") || 
              child.name.includes("capa_frente") || child.name.includes("top")) {
            frontFound = true;
            console.log("Parte frontal da capa encontrada:", child.name);
            gsap.to(child.position, {
              z: this.isExploded ? targetZ * 1.2 : 0,
              duration: 1.5,
              ease: "power2.inOut",
              delay: delayStages.caseOpening + 0.2 // A parte frontal abre após a traseira
            });
          } else if (child.name.includes("Back") || child.name.includes("back") || 
                    child.name.includes("capa_tras") || child.name.includes("bottom")) {
            backFound = true;
            console.log("Parte traseira da capa encontrada:", child.name);
            // A parte traseira se move sem delay para iniciar a sequência
            gsap.to(child.position, {
              z: this.isExploded ? -targetZ * 1.2 : 0,
              duration: 1.5,
              ease: "power2.inOut",
              delay: delayStages.caseOpening // A traseira abre primeiro
            });
          }
        }
      });
      
      // Nenhuma parte específica encontrada, vamos tentar outras abordagens
      if (!frontFound && !backFound) {
        console.log("Nenhuma parte específica encontrada na capa. Tentando abordagem alternativa.");
        console.log("Total de meshes no modelo da capa:", caseMeshes.length);
        
        // Abordagem 1: Verificar pela localização (normalmente as partes traseiras têm Z menor)
        let furthestZ = -Infinity;
        let closestZ = Infinity;
        let furthestMesh = null;
        let closestMesh = null;
        
        // Encontre os componentes com Z mais próximo e mais distante da câmera
        caseMeshes.forEach(mesh => {
          const globalPosition = new THREE.Vector3();
          mesh.getWorldPosition(globalPosition);
          
          if (globalPosition.z > furthestZ) {
            furthestZ = globalPosition.z;
            furthestMesh = mesh;
          }
          
          if (globalPosition.z < closestZ) {
            closestZ = globalPosition.z;
            closestMesh = mesh;
          }
        });
        
        // Se encontramos os dois extremos e eles são diferentes, anime-os
        if (furthestMesh && closestMesh && furthestMesh !== closestMesh) {
          console.log("Parte frontal identificada pela posição:", furthestMesh.name);
          gsap.to(furthestMesh.position, {
            z: this.isExploded ? targetZ * 1.2 : 0,
            duration: 1.5,
            ease: "power2.inOut",
            delay: delayStages.caseOpening + 0.2
          });
          
          console.log("Parte traseira identificada pela posição:", closestMesh.name);
          gsap.to(closestMesh.position, {
            z: this.isExploded ? -targetZ * 1.2 : 0,
            duration: 1.5,
            ease: "power2.inOut",
            delay: delayStages.caseOpening
          });
        }
        // Se não conseguimos identificar as partes, use uma abordagem mais simples
        else if (caseMeshes.length > 0) {
          console.log("Usando abordagem simplificada para a capa");
          gsap.to(this.caseModel.position, {
            z: this.isExploded ? targetZ * 0.5 : 0,
            duration: 1.5,
            ease: "power2.inOut",
            delay: delayStages.caseOpening
          });
        }
      }
    }
    
    // Animar o adesivo (sticker) - após os parafusos, mas antes da abertura completa
    if (this.stickerModel) {
      console.log("Animando adesivo:", this.stickerModel);
      
      this.saveComponentOriginalState(this.stickerModel);
      
      if (this.isExploded) {
        // Movimento simples para frente sem a animação de descolagem
        gsap.to(this.stickerModel.position, {
          z: this.stickerModel.position.z + 3.0, // Move diretamente para frente
          duration: 1.0,
          ease: "power2.out",
          delay: delayStages.sticker
        });
      } else {
        // Use GSAP com o delay apropriado em vez de restauração imediata
        if (this.stickerModel.userData.originalState) {
          const original = this.stickerModel.userData.originalState;
          
          // Restauração animada com delay
          gsap.to(this.stickerModel.position, {
            x: original.position.x,
            y: original.position.y,
            z: original.position.z,
            duration: 1.0,
            ease: "power2.inOut",
            delay: delayStages.sticker // Usar o delay configurado
          });
          
          gsap.to(this.stickerModel.rotation, {
            x: original.rotation.x,
            y: original.rotation.y,
            z: original.rotation.z,
            duration: 1.0,
            ease: "power2.inOut",
            delay: delayStages.sticker // Usar o delay configurado
          });
        } else {
          // Caso de fallback se não houver estado original
          // Adicionar delay diretamente aqui também
          console.log("Fallback para restauração do sticker com delay:", delayStages.sticker);
          setTimeout(() => {
            this.restoreComponentToOriginalState(this.stickerModel);
          }, delayStages.sticker * 1000); // Converter segundos para milissegundos
        }
      }
    }
    
    // Componentes do circuito - identificar e animar os 5 principais
    // Estes só começam a se mover depois que a capa está aberta
    if (this.circuitModel) {
      // Arrays para armazenar diferentes tipos de componentes
      const mainChips = []; // 5 chips principais que terão animação especial
      const chipComponents = []; // Todos os chips e componentes da placa
      
      // Categorias de chips por cor/material
      const chipsByColor = {
        green: [],
        black: [],
        silver: [],
        gold: [],
        other: []
      };
      
      // Variáveis para calcular o centro da placa
      let boardCenterX = 0;
      let boardCenterY = 0;
      let boardCenterZ = 0;
      let boardCount = 0;
      
      // Encontrar uma referência para a placa principal
      let boardComponent = null;
      let greenChip = null;
      
      // Identificar componentes por tipo
      this.circuitModel.traverse(child => {
        if (child.isMesh) {
          this.saveComponentOriginalState(child);
          
          // Verificar se é a placa principal (geralmente maior e verde)
          const box = new THREE.Box3().setFromObject(child);
          const size = box.getSize(new THREE.Vector3());
          
          // Armazenar posição para cálculo do centro
          boardCenterX += child.position.x;
          boardCenterY += child.position.y;
          boardCenterZ += child.position.z;
          boardCount++;
          
          // Se for um componente relevante (não a placa principal)
          // Ajustando para detectar melhor os componentes
          const nameLower = child.name.toLowerCase();
          const isMainBoard = size.x > 1.0 && size.y > 1.0; // A placa principal é normalmente maior
          const isComponent = !isMainBoard || 
                              nameLower.includes('chip') || 
                              nameLower.includes('circuit') || 
                              nameLower.includes('component') || 
                              nameLower.includes('processor') || 
                              nameLower.includes('transistor') || 
                              nameLower.includes('capacitor') || 
                              nameLower.includes('resistor');
          
          if (isComponent) {
            // Adicionar à lista de chips
            chipComponents.push(child);
            
            // Verificar material/cor do componente
            if (child.material) {
              // Se o componente tem nome, verificar por palavras-chave
              
              // Verificar se é um chip importante pelo nome
              if ((nameLower.includes('chip') || 
                  nameLower.includes('circuit') || 
                  nameLower.includes('processor') || 
                  nameLower.includes('ic') || 
                  nameLower.includes('cpu') || 
                  nameLower.includes('component') || 
                  nameLower.includes('main')) && 
                  mainChips.length < 5) {
                mainChips.push(child);
                console.log("Componente importante encontrado pelo nome:", child.name);
              }
              
              // Tenta determinar a cor pela cor do material
              let color = "";
              if (child.material.color) {
                color = child.material.color.getHexString();
              }
              
              // Categorizar por cor/material
              if (color.includes('0') || nameLower.includes('green') || nameLower.includes('board')) {
                chipsByColor.green.push(child);
                console.log("Chip verde encontrado:", child.name);
              } else if (nameLower.includes('black') || (color && color === '000000')) {
                chipsByColor.black.push(child);
              } else if (nameLower.includes('silver') || (color && color === 'c0c0c0')) {
                chipsByColor.silver.push(child);
              } else if (nameLower.includes('gold') || (color && color === 'ffd700')) {
                chipsByColor.gold.push(child);
              } else {
                chipsByColor.other.push(child);
              }
            }
          }
        }
      });

      // Se não encontrarmos 5 chips pelo nome, completamos com os maiores componentes
      if (mainChips.length < 5) {
        // Ordenar chips por tamanho (do maior para o menor)
        const sortedBySize = [...chipComponents].sort((a, b) => {
          const boxA = new THREE.Box3().setFromObject(a);
          const boxB = new THREE.Box3().setFromObject(b);
          const sizeA = boxA.getSize(new THREE.Vector3());
          const sizeB = boxB.getSize(new THREE.Vector3());
          
          const volumeA = sizeA.x * sizeA.y * sizeA.z;
          const volumeB = sizeB.x * sizeB.y * sizeB.z;
          
          return volumeB - volumeA; // Ordem decrescente (maior primeiro)
        });
        
        // Adicionar os maiores chips até completar 5 (excluindo a placa em si)
        for (const chip of sortedBySize) {
          const box = new THREE.Box3().setFromObject(chip);
          const size = box.getSize(new THREE.Vector3());
          
          // Se não for muito grande (excluir a placa principal) e não estiver já nos principais
          if (size.x < 0.45 && size.y < 0.45 && !mainChips.includes(chip) && mainChips.length < 5) {
            mainChips.push(chip);
          }
        }
      }
      
      console.log("5 Chips principais selecionados:", mainChips.map(chip => chip.name));
      
      // Animar chips verdes que NÃO estão nos 5 principais
      chipsByColor.green.forEach((chip, index) => {
        if (mainChips.includes(chip)) return; // Pula se for um dos 5 principais
        
        this.saveComponentOriginalState(chip);
        
        if (this.isExploded) {
          const sequenceDelay = delayStages.chips.green + (index * 0.05);
          
          // Movimento reto para frente sem rotações
          gsap.to(chip.position, {
            z: chip.position.z + 1.2, // Move para frente
            duration: 0.8,
            ease: "power2.out",
            delay: sequenceDelay
          });
        } else {
          this.restoreComponentToOriginalState(chip);
        }
      });
      
      // Animar chips pretos
      chipsByColor.black.forEach((chip, index) => {
        this.saveComponentOriginalState(chip);
        
        if (this.isExploded) {
          const sequenceDelay = delayStages.chips.black + (index * 0.04);
          
          // Movimento reto para frente sem rotações
          gsap.to(chip.position, {
            z: chip.position.z + 1.2, // Move para frente
            duration: 0.8,
            ease: "power2.out",
            delay: sequenceDelay
          });
        } else {
          this.restoreComponentToOriginalState(chip);
        }
      });
      
      // Animar chips prateados
      chipsByColor.silver.forEach((chip, index) => {
        this.saveComponentOriginalState(chip);
        
        if (this.isExploded) {
          const sequenceDelay = delayStages.chips.silver + (index * 0.04);
          
          // Movimento reto para frente sem rotações
          gsap.to(chip.position, {
            z: chip.position.z + 1.2, // Move para frente
            duration: 0.8,
            ease: "power2.out",
            delay: sequenceDelay
          });
        } else {
          this.restoreComponentToOriginalState(chip);
        }
      });
      
      // Animar chips dourados
      chipsByColor.gold.forEach((chip, index) => {
        this.saveComponentOriginalState(chip);
        
        if (this.isExploded) {
          const sequenceDelay = delayStages.chips.gold + (index * 0.03);
          
          // Movimento reto para frente sem rotações
          gsap.to(chip.position, {
            z: chip.position.z + 1.2, // Move para frente
            duration: 0.8,
            ease: "power2.out",
            delay: sequenceDelay
          });
        } else {
          this.restoreComponentToOriginalState(chip);
        }
      });
      
      // Animar outros componentes
      chipsByColor.other.forEach((chip, index) => {
        this.saveComponentOriginalState(chip);
        
        if (this.isExploded) {
          const sequenceDelay = delayStages.chips.other + (index * 0.03);
          
          // Movimento reto para frente sem rotações
          gsap.to(chip.position, {
            z: chip.position.z + 1.2, // Move para frente
            duration: 0.8,
            ease: "power2.out",
            delay: sequenceDelay
          });
        } else {
          this.restoreComponentToOriginalState(chip);
        }
      });
    }
    
    // Animação simplificada para os 5 chips principais
    mainChips.forEach((chip, index) => {
      this.saveComponentOriginalState(chip);
      
      if (this.isExploded) {
        const sequenceDelay = delayStages.chips.main + (index * 0.02);
        
        // Movimento simples para frente, todos na mesma direção
        gsap.to(chip.position, {
          z: chip.position.z + 1.5, // Move um pouco mais longe que os outros
          duration: 1.0,
          ease: "power2.out",
          delay: sequenceDelay
        });
      } else {
        // Na remontagem, movimento direto para posição original
        gsap.to(chip.position, {
          x: chip.userData.originalState.position.x,
          y: chip.userData.originalState.position.y,
          z: chip.userData.originalState.position.z,
          duration: 1.0,
          ease: "power2.out",
          delay: delayStages.chips.main + (index * 0.02)
        });
      }
    });
    
    // Calcular o centro médio da placa
    if (boardCount > 0) {
      boardCenterX /= boardCount;
      boardCenterY /= boardCount;
      boardCenterZ /= boardCount;
    }
    
    console.log("Centro aproximado da placa:", boardCenterX, boardCenterY, boardCenterZ);
    console.log("Chips por categoria:", {
      verde: chipsByColor.green.length,
      preto: chipsByColor.black.length,
      prateado: chipsByColor.silver.length,
      dourado: chipsByColor.gold.length,
      outros: chipsByColor.other.length
    });
    
    // Animar o grupo do cartridge todo (sem rotação)
    if (this.cartridgeGroup) {
      // Garantir que o grupo do cartridge não tenha rotação
      gsap.to(this.cartridgeGroup.rotation, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1.5,
        ease: "power2.inOut"
      });
      
      // Garantir que os componentes do circuito sejam animados corretamente
      if (this.circuitModel) {
        // Traverse todos os componentes do circuit novamente para garantir que sejam animados
        this.circuitModel.traverse(child => {
          if (child.isMesh) {
            this.saveComponentOriginalState(child);
            
            // Verificar se o componente já foi animado pelos loops anteriores
            const alreadyAnimated = mainChips.includes(child) || 
                                   chipsByColor.green.includes(child) || 
                                   chipsByColor.black.includes(child) || 
                                   chipsByColor.silver.includes(child) || 
                                   chipsByColor.gold.includes(child) || 
                                   chipsByColor.other.includes(child);
            
            // Se não foi animado ainda, animar agora
            if (!alreadyAnimated) {
              console.log("Animando componente não detectado anteriormente:", child.name);
              
              if (this.isExploded) {
                // Movimento direto para frente sem animações complexas
                gsap.to(child.position, {
                  z: child.position.z + 1.2,
                  duration: 0.8,
                  ease: "power2.out",
                  delay: delayStages.chips.other
                });
              } else {
                this.restoreComponentToOriginalState(child);
              }
            }
          }
        });
      }
    }
  }

  setWireframe(value) {
    this.wireframe = value;
    
    // Apply wireframe to all materials
    this.traverseComponents((child) => {
      if (child.isMesh && child.material) {
        // Se o material for um array, aplique a todos os materiais
        if (Array.isArray(child.material)) {
          child.material.forEach(material => {
            material.wireframe = value;
          });
        } else {
          child.material.wireframe = value;
          
          // Ajuste a opacidade para melhorar a aparência no modo wireframe
          if (value) {
            // Salvar valores originais
            if (!child.userData.originalOpacity) {
              child.userData.originalOpacity = child.material.opacity || 1;
              child.userData.originalTransparent = child.material.transparent || false;
            }
            
            // Ajuste para wireframe
            child.material.opacity = 0.8;
            child.material.transparent = true;
          } else if (child.userData.originalOpacity !== undefined) {
            // Restaurar valores originais
            child.material.opacity = child.userData.originalOpacity;
            child.material.transparent = child.userData.originalTransparent;
          }
        }
      }
    });
  }

  traverseComponents(callback) {
    if (this.caseModel) this.caseModel.traverse(callback);
    if (this.circuitModel) this.circuitModel.traverse(callback);
    if (this.screwModel) this.screwModel.traverse(callback);
    if (this.stickerModel) this.stickerModel.traverse(callback);
  }

  animate() {
    // Animation loop
    const tick = () => {
      // Update controls
      this.controls.update();

      // Render scene
      this.renderer.render(this.scene, this.camera);

      // Call tick again on the next frame
      window.requestAnimationFrame(tick);
    };

    tick();
  }
}

// Initialize GameBoy when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  new GameBoy();
}); 