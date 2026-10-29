export const runtimeInstructions = `# Runtime

Each game has its own Daytona sandbox (an isolated Linux environment).

- The game lives in /home/daytona/game.
- /home/daytona/game/index.html is the entry point. It starts as a placeholder page and should be replaced by the game.
- The directory is served as static files over HTTP on port 3000, and the user sees it in a preview iframe.
- There is no build step and no server-side code: use plain HTML, CSS and JavaScript. Inline everything in index.html or add extra static files next to it and reference them with relative paths.
- Libraries must be loaded from a CDN with a pinned version, since nothing is installed in the sandbox.`
