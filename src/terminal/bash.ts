import FileSystemBash from "./fileSystemBash";
import Applications from "./applications";
import { ASCII_ART, SPECIAL_COMMANDS } from './easter-eggs';

type Cmd = {
  docs: {
    name: string;
    short: string;
    long: string;
  };
  cmd: (self: Cmd, args: string[], options: string[]) => void;
};

// Definindo o tipo para os comandos
type CommandFunction = () => void;
type Commands = {
  [key: string]: CommandFunction;
};

type SnakePosition = {
  x: number;
  y: number;
};

type SnakeGameState = {
  snake: SnakePosition[];
  food: SnakePosition;
  direction: string;
  score: number;
  drawGame: () => void;
};

export default function Bash(print: (s: string, md?: boolean) => void) {
  const fileSystem = FileSystemBash();
  let path = { p: fileSystem.goHome() };
  let currentGame: string | null = null;

  const getApp = Applications(print, path);

  const commands: Commands = {
    help: () => {
      print(`
Available commands:
  help
  clear
  ls
  cat
  cd
  pwd
  secret
  home
`);
    },
    secret: () => {
      print(`
Try these:
  matrix
  hack
  snake
`);
    },
    // Easter Egg Commands
    matrix: () => {
      print(SPECIAL_COMMANDS.matrix());
      
      // Create canvas for Matrix effect
      const canvas = document.createElement('canvas');
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.zIndex = '999';
      canvas.style.opacity = '0.8';
      canvas.style.background = 'rgba(0, 0, 0, 0.9)';
      document.body.appendChild(canvas);

      // Set canvas size
      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Matrix characters
      const chars = 'ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ0123456789'.split('');
      
      const fontSize = 16;
      const columns = canvas.width / fontSize;
      
      // Array to store drops
      const drops: number[] = [];
      
      // Initialize drops
      for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -100;
      }

      // Drawing animation
      const draw = () => {
        if (!ctx) return;
        
        // Black BG for the canvas, translucent to show trail
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#0F0';
        ctx.font = fontSize + 'px monospace';
        
        // Render drops
        for (let i = 0; i < drops.length; i++) {
          // Random character
          const char = chars[Math.floor(Math.random() * chars.length)];
          
          // Draw character
          const x = i * fontSize;
          const y = drops[i] * fontSize;
          
          // Add glow effect
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#0F0';
          
          // Randomly make some characters brighter for effect
          if (Math.random() > 0.975) {
            ctx.fillStyle = '#FFF';
          } else {
            ctx.fillStyle = '#0F0';
          }
          
          ctx.fillText(char, x, y);
          
          // Reset glow
          ctx.shadowBlur = 0;
          
          // Move drop
          drops[i]++;
          
          // Reset drop if it goes off screen
          if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }
        }
      };

      // Animation loop
      let animationId: number;
      const animate = () => {
        draw();
        animationId = requestAnimationFrame(animate);
      };
      animate();

      // Remove effect after 10 seconds
      setTimeout(() => {
        cancelAnimationFrame(animationId);
        document.body.removeChild(canvas);
        window.removeEventListener('resize', resizeCanvas);
      }, 10000);
    },
    hack: () => print(SPECIAL_COMMANDS.hack()),
    home: () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      print('Returning to computer screen...');
    },
    snake: () => {
      currentGame = 'snake';
      
      // Create initial game state
      const gameState: SnakeGameState = {
        snake: [{x: 5, y: 2}],
        food: {x: 10, y: 4},
        direction: 'd', // Start moving right
        score: 0,
        drawGame: function() {
          const board = Array(8).fill(0).map(() => Array(16).fill(' '));
          
          // Draw snake
          this.snake.forEach((part: SnakePosition, i: number) => {
            board[part.y][part.x] = i === 0 ? 'O' : 'o';
          });
          
          // Draw food
          board[this.food.y][this.food.x] = '*';
          
          // Draw board
          let output = '╔════════════════╗\n';
          board.forEach(row => {
            output += '║' + row.join('') + '║\n';
          });
          output += '╚════════════════╝\n';
          output += `Score: ${this.score}`;
          
          print(output);
        }
      };

      // Save game state globally
      (window as any).snakeGameState = gameState;

      // Add keyboard event listener
      const handleKeyPress = (event: KeyboardEvent) => {
        if (!currentGame) {
          document.removeEventListener('keydown', handleKeyPress);
          return;
        }
        
        const key = event.key.toLowerCase();
        if (['w', 'a', 's', 'd'].includes(key)) {
          event.preventDefault();
          const game = (window as any).snakeGameState as SnakeGameState;
          if (game) {
            // Prevent 180-degree turns
            const opposites = { w: 's', s: 'w', a: 'd', d: 'a' };
            if (game.snake.length === 1 || key !== opposites[game.direction as keyof typeof opposites]) {
              game.direction = key;
            }
          }
        }
      };
      
      document.addEventListener('keydown', handleKeyPress);

      // Start automatic movement
      const gameLoop = setInterval(() => {
        const game = (window as any).snakeGameState as SnakeGameState;
        if (!currentGame || !game) {
          clearInterval(gameLoop);
          return;
        }
        moveSnake(game.direction);
      }, 200); // Move every 200ms

      // Show initial game state
      print('\nSnake Game Started!\nUse W/A/S/D keys to control direction\nType "exit" to quit\n');
      gameState.drawGame();
    }
  };

  function moveSnake(direction: string) {
    const game = (window as any).snakeGameState as SnakeGameState;
    if (!game) return;
    
    const newHead = {...game.snake[0]};
    
    // Update position based on direction
    switch(direction) {
      case 'w': newHead.y = Math.max(0, newHead.y - 1); break;
      case 's': newHead.y = Math.min(7, newHead.y + 1); break;
      case 'a': newHead.x = Math.max(0, newHead.x - 1); break;
      case 'd': newHead.x = Math.min(15, newHead.x + 1); break;
    }
    
    // Check collision with walls
    if (newHead.x < 0 || newHead.x >= 16 || newHead.y < 0 || newHead.y >= 8) {
      print('\nGame Over! You hit the wall!');
      print(ASCII_ART.skull);
      print(`Final Score: ${game.score}\n`);
      currentGame = null;
      delete (window as any).snakeGameState;
      return;
    }
    
    // Check collision with self (only if snake length > 1)
    if (game.snake.length > 1) {
      const bodyParts = game.snake.slice(0, -1);
      if (bodyParts.some((part: SnakePosition) => part.x === newHead.x && part.y === newHead.y)) {
        print('\nGame Over! You hit yourself!');
        print(ASCII_ART.skull);
        print(`Final Score: ${game.score}\n`);
        currentGame = null;
        delete (window as any).snakeGameState;
        return;
      }
    }
    
    // Check if food is eaten
    if (newHead.x === game.food.x && newHead.y === game.food.y) {
      game.score += 10;
      // Generate new food position
      do {
        game.food = {
          x: Math.floor(Math.random() * 16),
          y: Math.floor(Math.random() * 8)
        };
      } while (game.snake.some((part: SnakePosition) => part.x === game.food.x && part.y === game.food.y));
      
      // Add new head without removing tail
      game.snake.unshift(newHead);
    } else {
      // Move snake by adding new head and removing tail
      game.snake.unshift(newHead);
      game.snake.pop();
    }
    
    game.drawGame();
  }

  function splitArgs(a: string[]) {
    const args: string[] = [];
    const options: string[] = [];

    a.forEach((v) => {
      if (v === "") return;

      if (v.charAt(0) === "-") {
        options.push(v);
        return;
      }

      args.push(v);
    });

    return [args, options];
  }

  function cmdNotFound(cmdName: string) {
    print(`\n${cmdName}:command not found`);
  }

  function prompt() {
    let out = "";
    for (let i = 0; i < path.p.length; i++) {
      out += path.p[i].name;
      if (i !== 0 && i < path.p.length - 1) out += "/";
    }
    out = out.replace(/^\/home\/user/, "~");
    if (out !== "~") out += " ";
    print(`\nuser:${out}$`);
  }

  function input(cmd: string) {
    if (currentGame === 'snake') {
      const command = cmd.toLowerCase().trim();
      
      if (command === 'exit') {
        currentGame = null;
        delete (window as any).snakeGameState;
        print('Game ended.');
        prompt();
        return;
      }
      return;
    }

    cmd = cmd.replaceAll(/\s+/g, " ");
    const cmdSplit = cmd.split(" ");
    const cmdName = cmdSplit[0];
    const cmdArgs: string[] = cmdSplit.slice(1);
    console.log("cmd", cmdName, cmdArgs);

    if (cmd) {
      const app = getApp(cmdName);
      if (app) {
        const [args, options] = splitArgs(cmdArgs);
        app(args, options);
      } else if (cmdName in commands) {
        commands[cmdName]();
      } else {
        cmdNotFound(cmdName);
      }
    }

    prompt();
  }

  return { input };
}
