Read `AGENTS.md` first: it is the shared contract with the art agent (Codex). Art requests go in `art/requests.json`;
when code needs new pictures, add `open` rows there instead of drawing them. After merging an art PR, run
`npm run build` and commit `play.html`.
