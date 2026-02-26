# CLAUDE.md — Générateur SVG Thumbnail ADEME

## First things first
- Read this entire document before starting to code
- Read CLAUDE.local.md for local development setup instructions (if you find it)

## Tooling & environment
- `pnpm` is the package manager; lock file is `pnpm-lock.yaml`
- Node 24 required (`engines` in package.json)
- Vite base path: `/thumbail-generator/` — toutes les URLs publiques doivent en tenir compte

## Stack UI
- **Tailwind CSS v4** (CSS-first) via plugin `@tailwindcss/vite` — pas de `tailwind.config.js`
- **shadcn/ui style new-york** : composants dans `src/components/ui/`, CSS vars oklch dans `src/styles/globals.css`
- **Radix UI** : le package `radix-ui` (monorepo) est utilisé — **ne pas ajouter** les packages `@radix-ui/react-*` individuels, ils sont déjà transitifs
- Icônes : `lucide-react`

## Architecture clé
- `src/hooks/useThumbnailState.ts` — source de vérité unique pour l'état du thumbnail (titre, sous-titre, date, logos)
- `src/data/presets.ts` — presets statiques ; `PresetValues` utilise des `string` pour les numériques (format de sérialisation JSON)
- `src/components/SvgCanvas.tsx` — rendu SVG 1280×720 avec polices Marianne/Spectral embarquées en `@font-face` inline. Les URLs de polices sont absolues : `/thumbail-generator/fonts/...`
- `src/lib/{dateUtils,svgUtils,utils}.ts` — utilitaires partagés, tous utilisés

## Commandes utiles
```bash
pnpm dev          # serveur de développement
pnpm build        # tsc --noEmit + vite build
pnpm typecheck    # vérification TypeScript seule
pnpm lint         # ESLint
```

## Ajouter un preset
1. SVG logo éventuel → `public/presets/img/`
2. Entrée dans `src/data/presets.ts` (suivre la structure `Preset`)
3. Utiliser "Générer preset" dans l'UI pour obtenir le JSON depuis l'état courant

## Points d'attention
- Le dark mode utilise la classe `.dark` sur `<html>` — Tailwind v4 avec `@custom-variant dark (&:is(.dark *))`
- L'export PNG passe par un `<canvas>` (pas de lib externe) ; le SVG est sérialisé via `XMLSerializer`
- `PresetValues` a des champs numériques en `string` — utiliser `Number()` à la conversion
- Ne pas référencer `public/fonts/index.css` dans l'app React (ce fichier est présent pour d'éventuels usages externes uniquement)
