## Direction

Refonte visuelle inspirée **Linear / Vercel** : light, ultra-épurée, typographie dense et nette, micro-interactions discrètes, **bleu vif moderne** comme accent. Périmètre : **Shell global (sidebar + header) + Dashboard + flow Nouvelle demande complet** (NL, Profil/Job, Récap, Confirmation, CSV/Candidats). Le reste de l'app héritera automatiquement des nouveaux tokens/composants.

## 1. Système de design (fondations)

### `src/index.css` — nouveau token set
- **Background** : blanc cassé `0 0% 99%` (page) + `0 0% 100%` (cards). Bordures très fines `220 13% 91%`.
- **Foreground** : `222 20% 11%` (presque noir, pas pur).
- **Primary (accent bleu vif Linear-like)** : `221 83% 53%` (#2563EB), foreground `0 0% 100%`.
- **Muted** : `220 14% 96%` / muted-fg `220 9% 46%`.
- **Success** `158 64% 42%`, **Warning** `38 92% 50%`, **Destructive** `0 72% 51%`.
- **Sidebar** : fond légèrement teinté `220 14% 98%`, bordure `220 13% 91%`.
- Nouveaux tokens utilitaires :
  - `--shadow-sm: 0 1px 2px rgba(15,23,42,0.04)`
  - `--shadow-md: 0 4px 12px rgba(15,23,42,0.05)`
  - `--shadow-pop: 0 8px 24px -8px rgba(15,23,42,0.12)`
  - `--gradient-subtle: linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(220 14% 98%) 100%)`
- **Radius** : passer à `0.5rem` (8px) — Linear-feel, moins arrondi qu'aujourd'hui.
- **Typo** : conserver Onest (déjà premium et moderne), ajouter `font-feature-settings: "ss01","cv11","tnum"` pour chiffres tabulaires (compteurs/scores).
- Ajouter classes utilitaires dans `@layer utilities` :
  - `.surface` (bg-card + border + shadow-sm)
  - `.kbd` (badge raccourci clavier ⌘K-style)
  - `.dot-grid-bg` (fond points subtils pour hero/empty states)
  - `.animate-shine` (sweep brillant sur CTA primaire au hover)

### `tailwind.config.ts`
- Étendre `boxShadow` avec `sm/md/pop` pointant vers les CSS vars.
- Ajouter `backgroundImage.gradient-subtle`.
- Ajouter keyframes `shimmer`, `slide-up-fade`, `pulse-soft`.

### `src/components/ui/button.tsx`
- Réduire la hauteur par défaut à **h-8** (Linear-dense). `sm: h-7`, `lg: h-9`.
- Ajouter variant `gradient` (bleu primary → bleu plus clair) pour CTA hero.
- Hover : translate-y -0.5px + shadow renforcée.
- `focus-visible` avec ring 2px primary/30 + offset.

### `src/components/ui/card.tsx`
- Bordure `border-border/60`, `shadow-sm` par défaut, hover → `shadow-md` + `border-border` (utilité interactive).
- Ajouter variant `subtle` (no border, juste bg muted/30) et `interactive` (cursor + hover lift).

### `src/components/ui/input.tsx` & `textarea`
- h-9, ring focus primary/20, transition douce, placeholder un poil plus clair.

## 2. Shell de l'app

### `src/components/AppSidebar.tsx`
- Largeur réduite (220px → ~210px collapsed 56px). Items à `h-8`, icône 16px, texte `text-[13px]` medium.
- Active state : pas un bg muted plein mais une **barre verticale primary 2px à gauche** + `bg-primary/[0.06]` + `text-foreground font-semibold`. Hover plus subtil (`bg-muted/40`).
- Section label `Espace` plus discret (`text-[10px]` uppercase, tracking +).
- Footer user : avatar rond gradient (initiales), chevron à droite, hover bg muted/50.
- Ajouter en haut un bouton **« Nouvelle demande »** primaire compact (icône + label) qui remplace le menu item — pattern Linear « primary action toujours visible ».
- Logo : zone avec border-b légère.

### `src/components/AppLayout.tsx`
- Header : passer à `h-12`, fond `bg-background/80 backdrop-blur`, bordure `border-border/60`, ajouter à droite un input de recherche fictif (`⌘K Rechercher…` cliquable, ouvre rien pour l'instant — placeholder visuel) et la cloche admin si applicable.
- Main : padding réduit `p-8` desktop, container max 1200px.

## 3. Dashboard (`src/pages/Home.tsx`)

Refonte en **3 zones verticales** inspirées Linear/Vercel home :

### a) Header section
- `h1` plus grand `text-3xl font-semibold tracking-tight`, salutation + sous-titre.
- À droite : bouton primaire **« + Nouvelle demande »** (gradient).

### b) Bandeau métriques
- 4 stats en `grid-cols-4`, **sans Card classique** : juste des blocs `bg-card border rounded-lg p-5` avec :
  - petit label uppercase `text-[11px] tracking-wider muted`,
  - grand chiffre `text-3xl font-semibold tabular-nums`,
  - delta optionnel (ex: `+2 ce mois`) en vert/rouge à côté,
  - icône en filigrane top-right `opacity-10`.

### c) Latest request — passer en card hero
- Fond `gradient-subtle`, padding généreux, titre demande + statut **pill colorée** (vert si actif, gris si finalisé).
- Progress steps : remplacer les ronds par une **timeline horizontale segmentée** (segments de barre épaisse 6px arrondis, vert pour done, primary pour current avec léger pulse, gris pour pending). Labels en dessous tronqués si nécessaire.
- CTA « Voir détails » → bouton outline compact à droite.

### d) « Comment ça marche » → carrousel léger
- Garder 5 étapes mais en **grid 5 colonnes denses**, chaque étape sans card complète : juste un **gros chiffre `01`/`02` style Vercel** (font-bold, color muted), titre, desc 2 lignes max, séparées par bordures verticales fines.

### e) CTA bottom
- Card `gradient-subtle` avec dot-grid en background, titre + bouton primaire animate-shine.

## 4. Flow Nouvelle demande

### Stepper (`NewRequest.tsx`)
- Remplacer la Card stepper par une **barre top minimaliste** : 3 segments fins + label sous chaque, style Vercel checkout. Étapes cliquables seulement si déjà visitées. Ajouter une fine progress bar globale au-dessus (color primary, animée).
- Indicateur sauvegarde : petit dot vert pulsant + texte `text-[11px]` à droite, plus discret.

### Step 1 — `StepNaturalLanguage.tsx`
- **Hero textarea** : grande zone (`min-h-[180px]`), border douce, shadow-md au focus, fond très légèrement gradient. Placeholder enrichi sur 2 lignes.
- Toolbar : icône Sparkles bleue qui pulse pendant analyse, badge `Analyse IA` discret.
- Detection chips : repenser → barres rondes pleines `bg-muted/50` qui se remplissent en `bg-success/15 text-success border-success/30` avec une **icône check qui anime** (scale-in).
- CTA « Continuer » : variant gradient avec animate-shine.
- Overlay loader : moderniser → fond blur léger, container avec gradient bleu très subtil + Sparkles tournant + steps qui s'enchaînent avec ✓ vert progressifs.

### Step 2 — `StepProfileAndJob.tsx`
- Retravailler les **cartes de sélection** (Étudiant/Diplômé) : supprimer le ring 2px lourd, utiliser **bordure primary + fond primary/[0.04] + petit check primary en haut à droite**. Hover : translate-y -1px + shadow.
- Section headers : ajouter une **petite icône dans rond muted** à gauche du titre, séparateur fin sous le titre.
- Badges skills : passer à `rounded-md` (moins pill), `h-7`, hover plus net. Must-have = bg-primary, Nice-to-have = bg-muted border. Ajouter petit indicateur (point coloré) au lieu du juste fond.
- Skill columns : moderniser les conteneurs (bg muted/30, border subtile, label uppercase).
- Sliders langues : track plus fin (h-1), thumb primary plus petit, valeur dans un kbd-style.

### Step 3 — `StepRecap.tsx`
- Hero card "Type de profil" : enlever le sticky lourd, passer à une **bannière fine en haut** avec gradient subtil + badge type + label.
- Sections : titre + bouton "Modifier" en lien text-primary discret (plus de variant ghost).
- Listes de propriétés : passer en **`<dl>` deux colonnes** (label muted gauche, valeur foreground droite, séparateurs entre lignes via `divide-y divide-border/60`). Plus aéré, plus lisible.
- CTA Submit : bouton primary lg gradient + animate-shine, full-width sur mobile.

### Step 4 — `StepConfirmation.tsx`
- Écran succès : icône check dans **cercle gradient bleu→vert**, animation scale-in.
- Cards de choix Onbord/Self : **format "feature card" Vercel** (icône + titre + desc + arrow chevron animé au hover). Bordure qui devient primary au hover, slide-up sur arrow.
- Sous-page Self : header explicatif transformé en bannière `gradient-subtle` avec icône Upload, instructions courtes en bullets.

## 5. Composant `CandidatesSection`
- Toolbar : refresh icône-only + bouton « Importer CSV » outline compact.
- Filtres flag : passer en **segmented control** (style iOS / Linear) : un seul container `bg-muted rounded-lg p-1` avec boutons `bg-card shadow-sm` quand actif. Compteur en exposant.
- Liste candidats : conserver l'amélioration table (déjà planifiée séparément) mais appliquer les nouveaux tokens — header sticky, zebra discrète, hover row, score-pill avec couleur de fond `bg-{flag}/10 text-{flag}` border même couleur.
- Dialog Détails : header avec avatar initiales gradient, scores tiles passées en design "stat block" (grand chiffre, label sous, mini barre de progression couleur flag).

## 6. Pages annexes (héritage automatique)
- Login/Signup, Requests, Drafts, Account, Admin : **aucune modification de structure**, juste l'héritage des nouveaux tokens (couleurs, ombres, radius, typo). Quick-pass de cohérence visuelle après les chantiers principaux pour ne rien laisser cassé.

## 7. Animations / micro-interactions

Ajout dans `tailwind.config.ts` :
- `shimmer` (CTA primary hover, 2s ease infinite)
- `slide-up-fade` (entrée de cards et sections, 400ms)
- `pulse-soft` (current step, dots realtime)
- Hover lift partout : `transition-all duration-150` + `hover:-translate-y-0.5`.

## 8. QA visuelle

Après implémentation : naviguer dans la preview à 3 viewports (1440, 1100, 768) sur Dashboard + 3 étapes du flow + Candidats + dialog Détails ; corriger contrastes (WCAG AA), débordements, et aligner systématiquement les espacements (rythme 4/8/12/16/24).

## Hors scope (à confirmer plus tard)
- Dark mode (light only pour l'instant).
- Refonte Login/Signup design dédiée (juste tokens).
- Refonte mobile profonde (responsive correct mais pas optimisé tactile).
- Composants admin (héritent juste).

## Détails techniques rapides

```css
/* index.css extrait */
:root {
  --primary: 221 83% 53%;
  --primary-glow: 221 90% 65%;
  --background: 0 0% 99%;
  --card: 0 0% 100%;
  --border: 220 13% 91%;
  --radius: 0.5rem;
  --shadow-sm: 0 1px 2px rgba(15,23,42,0.04);
  --shadow-md: 0 4px 12px rgba(15,23,42,0.05);
  --shadow-pop: 0 8px 24px -8px rgba(15,23,42,0.12);
  --gradient-primary: linear-gradient(135deg, hsl(221 83% 53%), hsl(221 90% 65%));
  --gradient-subtle: linear-gradient(180deg, hsl(0 0% 100%), hsl(220 14% 98%));
}
```

```tsx
// Stat block dashboard
<div className="surface group relative overflow-hidden rounded-lg p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
  <Icon className="absolute right-3 top-3 h-10 w-10 text-foreground/[0.04]" />
  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
  <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{value}</p>
</div>
```
