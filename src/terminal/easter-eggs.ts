// Easter Eggs e Jogos Retro
const ASCII_ART = {
  skull: `
   .-""""-.
  /  _  _  \\
  |  o _ o  |
  |  (_)    |
  \\ '--'  /
   \`-...-'
  GAME OVER!
  `,
  pacman: `
   ᗧ···ᗣ···
  `
};

const SPECIAL_COMMANDS = {
  matrix: () => {
    return `
Wake up, Neo...
The Matrix has you...
Follow the white rabbit.

Initializing Matrix mode...
`;
  },
  hack: () => {
    // Disparar evento customizado para iniciar o vídeo
    const event = new CustomEvent('playHackVideo');
    window.dispatchEvent(event);
    
    return "INICIANDO SEQUÊNCIA DE HACK...\nExecutando exploit...\nBypassando firewall...\nAcesso garantido! 😎";
  },
  help_easter: () => {
    return `
=== Secret Commands ===
snake  - Classic snake game
matrix - Enter the matrix
hack   - Try to hack the system
`;
  }
};

export { ASCII_ART, SPECIAL_COMMANDS }; 