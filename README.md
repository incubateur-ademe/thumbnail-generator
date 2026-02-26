# Générateur SVG Thumbnail ADEME

Outil interne de génération de thumbnails SVG/PNG (1280×720 px) pour les événements et contenus ADEME : Demo Day, Incubateur, Impact CO2, etc.

## Fonctionnalités

- Titre, sous-titre et date positionnables librement (x%, y%)
- Import de logos SVG partenaires, en rangée centrée ou en position absolue
- Presets préconfigurés applicables en un clic
- Génération et copie d'un preset JSON depuis l'état courant
- Export PNG via canvas (nom de fichier dynamique)
- Affichage du code SVG généré
- Mode sombre / clair avec persistance (`localStorage`)

## Stack

| Outil | Version |
|---|---|
| React | 19 |
| TypeScript | 5 |
| Vite | 6 |
| Tailwind CSS | v4 (CSS-first, `@tailwindcss/vite`) |
| shadcn/ui | style new-york (oklch) |
| Radix UI | `radix-ui` monorepo |
| pnpm | 10 |
| Node | ≥ 24 |

## Démarrage

```bash
pnpm install
pnpm dev        # → http://localhost:5173/thumbnail-generator/
```

```bash
pnpm build      # tsc --noEmit + vite build → dist/
pnpm preview    # prévisualisation du build produit
pnpm lint       # ESLint
pnpm typecheck  # tsc --noEmit seul
```

## Déploiement

Déployé automatiquement sur **GitHub Pages** à chaque push sur `main` via `.github/workflows/deploy.yml`.

La `base` Vite est `/thumbnail-generator/`.

## Structure du projet

```
src/
  App.tsx                     # Layout principal, dark mode, export PNG
  components/
    SvgCanvas.tsx             # Canvas SVG 1280×720 (rendu du thumbnail)
    TextElementSection.tsx    # Contrôles titre / sous-titre / date
    LogoSection.tsx           # Contrôles logos (main + extras)
    PresetSection.tsx         # Sélection, application et génération de presets
    ui/                       # Composants shadcn/ui (new-york style)
  hooks/
    useThumbnailState.ts      # Hook d'état global du thumbnail
  data/
    presets.ts                # Presets préconfigurés (Demo Day, Incubateur, Impact CO2)
  lib/
    utils.ts                  # cn() — clsx + tailwind-merge
    dateUtils.ts              # formatDateFR(), todayISO()
    svgUtils.ts               # extractSvgInner(), uid()
  styles/
    globals.css               # @import tailwindcss + CSS vars shadcn (oklch)
public/
  fond_thumbnail.png          # Fond décoratif du thumbnail
  fonts/                      # Polices Marianne + Spectral (woff / woff2)
  presets/img/                # SVG des logos presets
```

## Ajouter un preset

1. Déposer les éventuels SVG de logos dans `public/presets/img/`
2. Dans [src/data/presets.ts](src/data/presets.ts), ajouter un objet `Preset` au tableau `presets` en suivant la structure existante
3. Astuce : utiliser le bouton **Générer preset** dans l'interface pour obtenir le JSON depuis l'état courant, puis le coller dans `presets.ts`

## Notes techniques

### Polices dans le SVG

Les polices Marianne et Spectral sont embarquées en `@font-face` inline dans le `<defs>` du SVG (`SvgCanvas.tsx`). Les fichiers `.woff`/`.woff2` sont servis depuis `public/fonts/` via des URLs absolues incluant la base Vite (`/thumbnail-generator/fonts/...`).

### Export PNG

Le téléchargement PNG passe par un `<canvas>` (1280×720) qui dessine le SVG sérialisé via un `<img>` à partir d'un Blob URL. Le nom de fichier est construit dynamiquement depuis le titre, le sous-titre et la date.

### Presets — format sérialisé

Le format de sérialisation (`PresetValues` dans `presets.ts`) utilise des `string` pour les valeurs numériques afin de conserver la compatibilité JSON. La conversion vers/depuis l'état React (`ThumbnailState`) est gérée dans `useThumbnailState.ts`.
