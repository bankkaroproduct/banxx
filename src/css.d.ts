// Allows TypeScript to recognise CSS files imported for their side-effects
// (e.g. `import './globals.css'` in layout.tsx).
// Without this, TS 5.x emits error 2882 for such imports.
declare module '*.css';
