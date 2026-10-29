export const runtimeInstructions = `# Runtime

Each game has its own Daytona sandbox (an isolated Linux environment).

- The game lives in /home/daytona/game.
- index.html is the entry point. It starts as a 3D welcome page (a rotating cube) and must be replaced by the game. Its \`<script type="importmap">\` maps "three" and "three/addons/" to a pinned three.js on a CDN; keep it, since every module depends on it.
- The directory is served as static files over HTTP on port 3000, and the user sees it in a preview iframe that reloads after each of your turns.
- There is no build step and no server-side code: plain HTML, CSS and ES modules. Reference files with relative paths and "./" (e.g. \`import { x } from "./game/player.js"\`).
- Games are 3D and use three.js. Only fall back to plain 2D canvas/DOM if the user explicitly asks for a 2D game.
- Other libraries must be loaded from a CDN with a pinned version (add them to the import map), since nothing is installed in the sandbox.
- Do not use Date.now or the wall clock for game logic; use the dt and time the engine passes to update callbacks.`
