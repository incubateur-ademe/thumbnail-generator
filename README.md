# Générateur SVG Thumbnail & Media Preview ADEME

Outil interne de génération de thumbnails SVG/PNG (1280×720 px) et de media previews Notion (512×269 px) pour les événements et contenus ADEME : Demo Day, Incubateur, Impact CO2, etc.

## Fonctionnalités

### Thumbnail (1280×720)

- Titre, sous-titre et date positionnables librement (x%, y%)
- Import de logos SVG/PNG partenaires, en rangée centrée ou en position absolue
- Presets préconfigurés applicables en un clic
- Génération et copie d'un preset JSON depuis l'état courant
- Export PNG via canvas (nom de fichier dynamique)

### Media Preview (512×269)

- Titre et sous-titre éditables avec alignement gauche / centre / droite (marge 64px)
- Icône configurable : emoji (sélecteur frimousse) ou image uploadée
- Logo ADEME avec sous-parties toggleables (RF/ADEME, Play, Texte incubateur)
- Fonds primaire/secondaire avec couleurs éditables et bouton d'inversion
- Texture décorative et motifs (fond_thumbnail.png + arabesques)
- Logos supplémentaires (SVG/PNG) en rangée ou position absolue
- Bouton "Aligner à droite du logo" en mode absolu

### Commun

- Toggle Thumbnail / Media Preview dans le header
- Export PNG adaptatif (1280×720 ou 512×269)
- Mode sombre / clair avec persistance (`localStorage`)
- URL partageable : le hash reflète le mode et l'état courant en temps réel (`#media-preview&p=...`)
- Affichage du code SVG généré (data URLs masquées)

## Stack

| Outil | Version |
|---|---|
| React | 19 |
| TypeScript | 5 |
| Vite | 6 |
| Tailwind CSS | v4 (CSS-first, `@tailwindcss/vite`) |
| shadcn/ui | style new-york (oklch) |
| Radix UI | `radix-ui` monorepo |
| frimousse | 0.3 (emoji picker) |
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
  App.tsx                        # Layout principal, mode toggle, dark mode, export PNG, URL sync
  components/
    ThumbnailCanvas.tsx          # Canvas SVG 1280×720 (rendu du thumbnail)
    MediaPreviewCanvas.tsx       # Canvas SVG 512×269 (rendu du media preview)
    TextElementSection.tsx       # Contrôles titre / sous-titre / date (thumbnail)
    LogoSection.tsx              # Contrôles logos thumbnail (main + extras)
    MediaPreviewSidebar.tsx      # Contrôles media preview (fond, logo, icône, textes, extras)
    ExtraLogoCard.tsx            # Carte d'un logo extra (partagée entre les deux modes)
    PresetSection.tsx            # Sélection, application et génération de presets
    ui/                          # Composants shadcn/ui (button, input, popover, etc.)
  hooks/
    useThumbnailState.ts         # Hook d'état global du thumbnail
    useMediaPreviewState.ts      # Hook d'état global du media preview
    useSvgCache.ts               # Cache partagé pour les SVG chargés depuis des URLs
  data/
    presets.ts                   # Presets préconfigurés (Demo Day, Incubateur, Impact CO2)
  lib/
    utils.ts                     # cn() — clsx + tailwind-merge
    dateUtils.ts                 # formatDateFR(), todayISO()
    svgUtils.ts                  # buildScaledGroup(), MARIANNE_FONT_FACE_CSS, extractSvgInner(), uid()
    urlPreset.ts                 # Encode/decode de presets pour URL partageable
  styles/
    globals.css                  # @import tailwindcss + CSS vars shadcn (oklch)
public/
  fond_thumbnail.png             # Fond décoratif (texture)
  media-cover-notion.svg         # Template SVG du media preview (logo RF/ADEME extrait au runtime)
  fonts/                         # Polices Marianne + Spectral (woff / woff2)
  presets/img/                   # SVG des logos presets
```

## Ajouter un preset

1. Déposer les éventuels SVG de logos dans `public/presets/img/`
2. Dans [src/data/presets.ts](src/data/presets.ts), ajouter un objet `Preset` au tableau `presets` en suivant la structure existante
3. Astuce : utiliser le bouton **Générer preset** dans l'interface pour obtenir le JSON depuis l'état courant, puis le coller dans `presets.ts`

## Notes techniques

### Polices dans le SVG

Les polices Marianne sont embarquées en `@font-face` inline dans le `<defs>` du SVG (constante `MARIANNE_FONT_FACE_CSS` dans `svgUtils.ts`). Les fichiers `.woff`/`.woff2` sont servis depuis `public/fonts/` via des URLs absolues incluant la base Vite (`/thumbnail-generator/fonts/...`).

### Export PNG

Le téléchargement PNG passe par un `<canvas>` qui dessine le SVG sérialisé via un `<img>` à partir d'un Blob URL. Les dimensions s'adaptent au mode : 1280×720 (thumbnail) ou 512×269 (media preview).

### Media Preview — template SVG

Le template SVG (`public/media-cover-notion.svg`) contient le logo RF/ADEME complet (~240 paths). `MediaPreviewCanvas` le charge une fois au mount via `fetch`, extrait le `innerHTML` du `<g id="logo">`, et l'injecte via ref. Le reste du canvas est rendu en JSX inline. Le template contient trois sous-groupes toggleables : `<g id="logo-tagline">`, `<g id="logo-play">`, et le bloc RF (indissociable).

### URL partageable

L'état courant est encodé en JSON → base64 URL-safe dans le hash : `#media-preview&p=eyJ...`. Le hash se met à jour en temps réel (debounce 300ms). Sans images uploadées, le hash fait ~800 chars. Avec des images raster (data URLs), il peut dépasser la limite de certains outils de partage (~2000-8000 chars).

### Presets — format sérialisé

Le format de sérialisation (`PresetValues` dans `presets.ts`) utilise des `string` pour les valeurs numériques afin de conserver la compatibilité JSON. La conversion vers/depuis l'état React (`ThumbnailState`) est gérée dans `useThumbnailState.ts`.
