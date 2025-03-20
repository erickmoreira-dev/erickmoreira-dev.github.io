// Script para o modelo 14bis com versão simplificada do Three.js
document.addEventListener('DOMContentLoaded', function() {
  console.log('Iniciando carregamento simplificado do modelo 14bis');
  
  // Usar uma única versão estável do Three.js com suporte a GLTFLoader e OrbitControls
  const threeBundle = document.createElement('script');
  threeBundle.src = 'https://cdn.jsdelivr.net/npm/three@0.137.5/build/three.min.js';
  threeBundle.onload = function() {
    console.log('Three.js carregado. Carregando extensões...');
    
    // Carregar extensões na versão correta
    loadExtension('https://cdn.jsdelivr.net/npm/three@0.137.5/examples/js/loaders/GLTFLoader.js', function() {
      loadExtension('https://cdn.jsdelivr.net/npm/three@0.137.5/examples/js/controls/OrbitControls.js', function() {
        console.log('Todos os scripts carregados. Iniciando setup...');
        setTimeout(setupModel, 100);
      });
    });
  };
  
  threeBundle.onerror = function() {
    console.error('Erro ao carregar Three.js. Abortando.');
  };
  
  document.head.appendChild(threeBundle);
  
  // Função auxiliar para carregar extensões
  function loadExtension(src, callback) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = callback;
    script.onerror = function() {
      console.error(`Erro ao carregar extensão: ${src}`);
      // Continuar mesmo com erro
      callback();
    };
    document.head.appendChild(script);
  }
  
  function setupModel() {
    try {
      // Verificar acesso ao Three.js
      if (typeof THREE === 'undefined') {
        console.error('Three.js não disponível. Abortando.');
        return;
      }
      
      // Verificar container
      const container = document.getElementById('model-14bis-container');
      if (!container) {
        console.error('Container do modelo 14bis não encontrado');
        return;
      }
      
      console.log('Verificando disponibilidade das extensões:');
      console.log('- GLTFLoader:', typeof THREE.GLTFLoader !== 'undefined' ? 'Disponível ✓' : 'Indisponível ✗');
      console.log('- OrbitControls:', typeof THREE.OrbitControls !== 'undefined' ? 'Disponível ✓' : 'Indisponível ✗');
      
      // Criar canvas
      const canvas = document.createElement('canvas');
      canvas.className = 'webgl-14bis';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      
      // Limpar e adicionar ao container
      container.innerHTML = '';
      container.appendChild(canvas);
      
      // Dimensões
      const width = container.clientWidth;
      const height = container.clientHeight;
      console.log(`Dimensões do container: ${width}x${height}`);
      
      // Cena
      const scene = new THREE.Scene();
      
      // Fundo transparente - sem definir cor de fundo para a cena
      scene.background = null;
      
      // Sistema de iluminação melhorado
      // Luz ambiente mais forte com tom ligeiramente quente para dar sensação de brancura
      const ambientLight = new THREE.AmbientLight(0xfffaf0, 1.2);
      scene.add(ambientLight);
      
      // Luz direcional principal mais brilhante
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);
      
      // Luz de preenchimento para equilibrar as sombras
      const fillLight = new THREE.DirectionalLight(0xf8f8ff, 0.8);
      fillLight.position.set(-5, 2, -5);
      scene.add(fillLight);
      
      // Luz superior para dar mais destaque
      const topLight = new THREE.DirectionalLight(0xffffff, 0.7);
      topLight.position.set(0, 10, 0);
      scene.add(topLight);
      
      // Câmera
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(1.5, 0.5, 1.5);
      
      // Renderer com melhor qualidade
      const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0); // Transparente
      renderer.physicallyCorrectLights = true; // Para iluminação mais realista
      renderer.outputEncoding = THREE.sRGBEncoding; // Melhor reprodução de cores
      
      // Array para armazenar nuvens
      const clouds = [];
      
      // Configurações do sistema de nuvens
      const cloudSystem = {
        maxClouds: 40,                // Número máximo de nuvens na cena
        initialCount: 20,             // Número inicial de nuvens
        spawnFrequency: 0.05,         // Frequência de criação de novas nuvens (aumentada de 0.02 para 0.05)
        containerWidth: 30,           // Largura virtual do container para nuvens (aumentada de 25 para 30)
        containerHeight: 25,          // Altura virtual do container para nuvens
        widthRange: [-15, 15],        // Faixa horizontal para posicionamento das nuvens (ampliada de [-12, 12] para [-15, 15])
        depthRange: [-12, 12],        // Faixa de profundidade para nuvens (ampliada de [-10, 10] para [-12, 12])
        speedRange: [0.03, 0.08],     // Velocidade das nuvens (aumentada para mais movimento)
        diagonalFactor: 0.3,          // Fator diagonal reduzido (mais horizontal, menos inclinado)
        directionVariation: 0.15      // Variação aleatória na direção de cada nuvem
      };
      
      // Função para criar nuvens
      function createCloud(position = null) {
        // Criar um grupo para a nuvem (várias esferas agrupadas)
        const cloudGroup = new THREE.Group();
        
        // Material para as nuvens - mais suave e difuso
        const cloudMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.85,
          roughness: 0.9,
          metalness: 0.1
        });
        
        // Número de "bolinhas" para formar a nuvem - mais esferas para formato mais realista
        const sphereCount = 10 + Math.floor(Math.random() * 8);
        
        // Definir os tamanhos para diferentes partes da nuvem
        const baseSize = 0.2 + Math.random() * 0.3;
        
        // Criar a base da nuvem - parte inferior mais plana
        for (let i = 0; i < 4; i++) {
          const radius = baseSize * (0.8 + Math.random() * 0.4);
          const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 8, 8),
            cloudMaterial
          );
          
          // Posicionar esferas lado a lado para criar a base plana
          const posX = (i - 1.5) * baseSize * 0.8 + (Math.random() - 0.5) * 0.3;
          const posY = (Math.random() - 0.5) * 0.2;
          const posZ = (Math.random() - 0.5) * 0.4;
          sphere.position.set(posX, posY, posZ);
          
          cloudGroup.add(sphere);
        }
        
        // Adicionar esferas na parte superior (formato cumulonimbus)
        for (let i = 0; i < sphereCount - 4; i++) {
          const verticalPosition = i / (sphereCount - 4); // 0 na base, 1 no topo
          const radius = baseSize * (1.0 - verticalPosition * 0.6); // Menor no topo
          
          const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 7, 7),
            cloudMaterial
          );
          
          // Criar formato mais característico de nuvem:
          // - Base larga
          // - Topo mais estreito e alto
          const posX = (Math.random() - 0.5) * baseSize * (3.0 - verticalPosition * 1.5);
          const posY = baseSize * verticalPosition * 1.5; // Subir linearmente
          const posZ = (Math.random() - 0.5) * baseSize * (3.0 - verticalPosition * 1.5);
          
          sphere.position.set(posX, posY, posZ);
          cloudGroup.add(sphere);
        }
        
        // Adicionar alguns detalhes no topo (pequenas protuberâncias)
        for (let i = 0; i < 3; i++) {
          const radius = baseSize * 0.3;
          const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 6, 6),
            cloudMaterial
          );
          
          const angleOffset = i * (Math.PI * 2) / 3;
          const distance = baseSize * 0.7;
          const posX = Math.cos(angleOffset) * distance;
          const posY = baseSize * 1.8; // Bem no topo
          const posZ = Math.sin(angleOffset) * distance;
          
          sphere.position.set(posX, posY, posZ);
          cloudGroup.add(sphere);
        }
        
        // Posicionar a nuvem no espaço 3D
        let posX, posY;
        
        // Se position for fornecido, usamos ele, senão geramos uma posição inicial
        if (position === null) {
          // Para nuvens iniciais, distribuir aleatoriamente
          // Algumas no lado direito, outras já no caminho diagonal
          if (Math.random() < 0.8) {  // Aumentado de 0.7 para 0.8 para mais nuvens na direita
            // Posicionar principalmente no lado direito para entrarem na tela
            posX = cloudSystem.widthRange[1] - Math.random() * 5; // Lado direito
            posY = Math.random() * cloudSystem.containerHeight - cloudSystem.containerHeight/2; // Distribuir verticalmente
          } else {
            // Distribuir algumas ao longo do caminho diagonal
            posX = Math.random() * cloudSystem.containerWidth - cloudSystem.containerWidth * 0.3;
            posY = Math.random() * cloudSystem.containerHeight - cloudSystem.containerHeight * 0.3;
          }
        } else {
          // Posição fornecida para novas nuvens durante a simulação
          posX = position.x;
          posY = position.y;
        }
        
        // Posição em profundidade (Z)
        const posZ = cloudSystem.depthRange[0] + Math.random() * 
                    (cloudSystem.depthRange[1] - cloudSystem.depthRange[0]);
        
        cloudGroup.position.set(posX, posY, posZ);
        
        // Adicionar alguma rotação para variar a aparência
        cloudGroup.rotation.x = Math.random() * Math.PI * 0.1;
        cloudGroup.rotation.y = Math.random() * Math.PI * 2;
        cloudGroup.rotation.z = Math.random() * Math.PI * 0.1;
        
        // Escalar a nuvem - mais variação de tamanho
        const scale = 0.8 + Math.random() * 1.8;
        cloudGroup.scale.set(scale, scale * 0.6, scale); // Achatamento vertical típico de nuvens
        
        // Definir propriedades de movimento
        const speed = cloudSystem.speedRange[0] + Math.random() * 
                     (cloudSystem.speedRange[1] - cloudSystem.speedRange[0]);
                     
        // Adicionar variação individual na direção de cada nuvem
        const directionVariation = (Math.random() * 2 - 1) * cloudSystem.directionVariation;
        const diagonalFactor = cloudSystem.diagonalFactor * (1 + directionVariation);
        
        cloudGroup.userData = {
          speed: speed,
          // Vetor de direção diagonal: principalmente horizontal com leve subida/descida
          direction: new THREE.Vector3(-1, diagonalFactor, 0)
        };
        
        // Adicionar à cena e ao array de nuvens
        scene.add(cloudGroup);
        clouds.push(cloudGroup);
        
        return cloudGroup;
      }
      
      // Criar várias nuvens iniciais distribuídas pelo espaço
      for (let i = 0; i < cloudSystem.initialCount; i++) {
        createCloud();
      }
      
      // Cubo fallback
      const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0xff3300, 
        metalness: 0.3,
        roughness: 0.4
      });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
      
      // Controles - com verificação de disponibilidade
      let controls;
      if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = true;
        controls.autoRotate = false; // Desativar rotação automática para melhor efeito de voo
        controls.autoRotateSpeed = 1.5;
        
        // Limitar a rotação para manter a visão "de cima"
        controls.minPolarAngle = Math.PI / 6; // Limite inferior (não muito de cima)
        controls.maxPolarAngle = Math.PI / 2.5; // Limite superior (não muito de baixo)
      } else {
        console.warn('OrbitControls indisponível. Usando controles alternativos.');
        controls = {
          update: function() {
            // Rotação simples para o cubo
            cube.rotation.y += 0.01;
          }
        };
      }
      
      // Luz pontual para o modelo (será adicionada depois que o modelo for carregado)
      let spotlightModel;
      
      // Detectar ambiente
      const isGitHubPages = window.location.hostname.includes('github.io');
      const basePath = isGitHubPages ? '/erickmoreira-dev.github.io' : '';
      console.log(`Ambiente: ${isGitHubPages ? 'GitHub Pages' : 'Local'}, Base Path: "${basePath}"`);
      
      // Caminhos possíveis para o modelo
      const modelPaths = [
        `${basePath}/models/14bis.glb`,
        'models/14bis.glb',
        './models/14bis.glb',
        '/models/14bis.glb',
        '../models/14bis.glb',
        'public/models/14bis.glb'
      ];
      
      // Variável para o modelo
      let model14bis;
      
      // Verificar e usar GLTFLoader se disponível
      if (typeof THREE.GLTFLoader !== 'undefined') {
        const loader = new THREE.GLTFLoader();
        
        function tryNextPath(index = 0) {
          if (index >= modelPaths.length) {
            console.warn('Não foi possível carregar o modelo 14bis. Usando cubo como fallback.');
            return;
          }
          
          const path = modelPaths[index];
          console.log(`Tentando carregar o modelo de: ${path}`);
          
          loader.load(
            path,
            function(gltf) {
              console.log(`Modelo carregado com sucesso de: ${path}`);
              scene.remove(cube); // Remover cubo fallback
              
              model14bis = gltf.scene;
              model14bis.scale.set(1.4, 1.4, 1.4); // Reduzido para aparecer completamente no container
              
              // Centralizar o modelo
              const box = new THREE.Box3().setFromObject(model14bis);
              const center = box.getCenter(new THREE.Vector3());
              model14bis.position.x = -center.x;
              model14bis.position.y = -center.y;
              model14bis.position.z = -center.z;
              model14bis.rotation.y = Math.PI / 2; // Ajustado para melhor visibilidade frontal
              
              // Adicionar uma luz pontual diretamente acima do modelo para destacá-lo
              spotlightModel = new THREE.PointLight(0xffffee, 1.5, 10);
              spotlightModel.position.set(0, 2, 0);
              model14bis.add(spotlightModel);
              
              // Criar um objeto auxiliar para o rastro de luz (efeito de propulsão)
              const trailGeometry = new THREE.ConeGeometry(0.1, 0.5, 8);
              const trailMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffcc, 
                transparent: true, 
                opacity: 0.6
              });
              const trail = new THREE.Mesh(trailGeometry, trailMaterial);
              
              // Posicionar o rastro na parte traseira do avião
              trail.position.set(-0.5, 0, 0); // Ajuste conforme necessário
              trail.rotation.z = Math.PI / 2; // Apontar para trás
              model14bis.add(trail);
              
              // Ajustar propriedades dos materiais para melhorar a iluminação
              // mas preservar as cores originais do modelo
              model14bis.traverse(child => {
                if (child.isMesh && child.material) {
                  // Melhorar a resposta à iluminação sem alterar as cores
                  if (child.material.metalness !== undefined) {
                    child.material.metalness = 0.3; // Valor equilibrado
                  }
                  
                  if (child.material.roughness !== undefined) {
                    child.material.roughness = 0.5; // Valor médio mais natural
                  }
                  
                  // Pequena emissão para destacar o modelo
                  if (!child.material.emissive) {
                    child.material.emissive = new THREE.Color(0x111111);
                  }
                  
                  // Garantir que receba sombras
                  child.castShadow = true;
                  child.receiveShadow = true;
                }
              });
              
              // Adicionar pequeno movimento ao modelo (balanço de voo)
              model14bis.userData = {
                initialY: model14bis.position.y,
                initialX: model14bis.position.x,
                initialRotX: model14bis.rotation.x,
                initialRotY: model14bis.rotation.y,
                initialRotZ: model14bis.rotation.z,
                time: 0,
                trail: trail,
                windEffect: 0,
                wobbleIntensity: 0.05,  // Intensidade de oscilação
                airCurrents: {          // Simulação de correntes de ar
                  frequency: 0.5,       // Frequência das correntes
                  intensity: 0.08,      // Intensidade das correntes
                  phase: Math.random() * Math.PI * 2  // Fase aleatória
                }
              };
              
              scene.add(model14bis);
              
              // Ajustar câmera com base no tamanho do modelo
              const size = box.getSize(new THREE.Vector3());
              const maxDim = Math.max(size.x, size.y, size.z);
              const fov = camera.fov * (Math.PI / 180);
              let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.0; // Ajustado para mostrar todo o modelo
              
              // Posicionar a câmera mais afastada para mostrar todo o modelo
              camera.position.set(cameraZ * 0.9, cameraZ * 0.4, cameraZ * 0.9);
              camera.lookAt(new THREE.Vector3(0, 0, 0)); // Garantir que a câmera olhe para o centro exato
              
              // Atualizar controles para o novo centro após configurar a câmera
              if (controls && typeof controls.update === 'function') {
                controls.target.set(0, 0, 0);
                controls.update();
              }
            },
            function(xhr) {
              const percent = (xhr.loaded / xhr.total * 100).toFixed(1);
              console.log(`Carregamento: ${percent}%`);
            },
            function(error) {
              console.error(`Erro ao carregar ${path}:`, error);
              tryNextPath(index + 1);
            }
          );
        }
        
        tryNextPath(0);
      } else {
        console.error('GLTFLoader não disponível. Usando apenas o cubo fallback.');
      }
      
      // Eventos de redimensionamento
      window.addEventListener('resize', function() {
        if (!container) return;
        
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        
        renderer.setSize(newWidth, newHeight);
      });
      
      // Função para mover nuvens e reposicioná-las
      function updateClouds() {
        // Adicionar novas nuvens com frequência regular, principalmente do lado direito
        if (Math.random() < cloudSystem.spawnFrequency && clouds.length < cloudSystem.maxClouds) {
          // Criar nova nuvem no lado direito, com altura variável
          const startPosition = {
            x: cloudSystem.widthRange[1] + 2, // Bem na direita, fora da tela mas próximo da borda
            y: -cloudSystem.containerHeight/2 + Math.random() * cloudSystem.containerHeight // Altura variável
          };
          const newCloud = createCloud(startPosition);
        }
        
        // Atualizar posição das nuvens
        for (let i = 0; i < clouds.length; i++) {
          const cloud = clouds[i];
          
          // Mover a nuvem seguindo sua direção individual
          const direction = cloud.userData.direction.clone().normalize();
          cloud.position.x += direction.x * cloud.userData.speed;
          cloud.position.y += direction.y * cloud.userData.speed;
          
          // Adicionar muito sutil movimento de flutuação vertical (como nuvens reais)
          cloud.position.y += Math.sin(Date.now() * 0.0002 + i * 3.14) * 0.001;
          
          // Adicionar leve movimento ondulante perpendicular à direção principal
          cloud.position.z += Math.sin(Date.now() * 0.0003 + i) * 0.002;
          
          // Se a nuvem saiu da tela pela esquerda, removê-la
          if (cloud.position.x < -cloudSystem.containerWidth - 5) {
            // Remover da cena e do array
            scene.remove(cloud);
            clouds.splice(i, 1);
            i--; // Ajustar índice após remoção
          }
        }
      }
      
      // Função para animar o modelo do 14bis
      function updateModel() {
        if (model14bis) {
          const userData = model14bis.userData;
          userData.time += 0.01;
          
          // Calcular efeitos de correntes de ar
          const airCurrentX = Math.cos(userData.time * userData.airCurrents.frequency + userData.airCurrents.phase) * userData.airCurrents.intensity;
          const airCurrentY = Math.sin(userData.time * userData.airCurrents.frequency * 1.3) * userData.airCurrents.intensity * 0.7;
          const airCurrentZ = Math.cos(userData.time * userData.airCurrents.frequency * 0.8) * userData.airCurrents.intensity * 0.5;
          
          // Sistema de oscilação natural (wobble)
          const wobbleX = Math.sin(userData.time * 1.1) * userData.wobbleIntensity * 0.3;
          const wobbleY = Math.sin(userData.time * 1.0) * userData.wobbleIntensity;
          const wobbleZ = Math.sin(userData.time * 1.2) * userData.wobbleIntensity * 0.5;
          
          // Movimento suave com vários componentes combinados
          model14bis.position.y = userData.initialY + Math.sin(userData.time) * 0.05 + airCurrentY + wobbleY;
          model14bis.position.x = userData.initialX + Math.sin(userData.time * 0.7) * 0.03 + airCurrentX;
          model14bis.position.z = Math.sin(userData.time * 0.8) * 0.08 + airCurrentZ;
          
          // Rotações mais dinâmicas em vários eixos
          model14bis.rotation.z = userData.initialRotZ + Math.sin(userData.time * 1.2) * 0.04 + wobbleZ;
          model14bis.rotation.x = userData.initialRotX + Math.sin(userData.time * 0.9) * 0.02 + wobbleX;
          model14bis.rotation.y = userData.initialRotY + Math.sin(userData.time * 0.5) * 0.01;
          
          // Adicionar simulação de motor (pulso no efeito de propulsão)
          if (userData.trail) {
            // Pulsar o tamanho do rastro com o tempo
            const pulseScale = 1.0 + Math.sin(userData.time * 5) * 0.2;
            userData.trail.scale.set(pulseScale, pulseScale * (1.0 + Math.sin(userData.time * 8) * 0.1), pulseScale);
            
            // Ajustar a opacidade do rastro com base na "aceleração"
            userData.trail.material.opacity = 0.6 + Math.sin(userData.time * 3) * 0.2;
          }
          
          // Animar a intensidade da luz pontual se existir
          if (spotlightModel) {
            spotlightModel.intensity = 1.5 + Math.sin(userData.time * 2) * 0.3;
            
            // Mudar ligeiramente a cor da luz para simular variação do motor
            const engineHue = 0.12 + Math.sin(userData.time * 4) * 0.02; // Variação amarelo/laranja
            spotlightModel.color.setHSL(engineHue, 0.5, 0.7);
          }
        }
      }
      
      // Loop de animação
      function animate() {
        requestAnimationFrame(animate);
        
        // Animar cubo se estiver visível (fallback)
        if (cube.parent) {
          cube.rotation.x += 0.01;
          cube.rotation.y += 0.005;
        }
        
        // Atualizar nuvens
        updateClouds();
        
        // Atualizar modelo
        updateModel();
        
        // Atualizar controles
        if (controls && typeof controls.update === 'function') {
          controls.update();
        }
        
        // Renderizar
        renderer.render(scene, camera);
      }
      
      // Iniciar animação
      animate();
      console.log('Animação iniciada.');
      
    } catch (error) {
      console.error('Erro na inicialização do modelo 14bis:', error);
    }
  }
});