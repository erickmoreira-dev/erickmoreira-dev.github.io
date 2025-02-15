// Easter Eggs e Jogos Retro
const ASCII_ART = {
  coffee: `
    ( (
     ) )
  .........
  |       |]
  \\       /
   \`---'
  COFFEE TIME!
  `,
  cat: `
   /\\___/\\
  (  o o  )
  (  =^=  ) 
   (______)
  MEOW!
  `,
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
    return "ACCESS GRANTED... Just kidding! 😉";
  },
  help_easter: () => {
    return `
=== Secret Commands ===
coffee  - Need a break?
cat    - Meow!
snake  - Classic snake game
matrix - Enter the matrix
hack   - Try to hack the system
`;
  }
};

export { ASCII_ART, SPECIAL_COMMANDS }; 