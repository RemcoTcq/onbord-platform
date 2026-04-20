

## Refonte visuelle : Lemlist UI + identité Onbord

Refonte purement stylistique (CSS / tokens / classes utilitaires). Aucune modification de logique, de routing ou de structure de composants.

### 1. Identité visuelle (Onbord)

**Tokens couleur dans `src/index.css`** — palette inspirée du screenshot Onbord :

- `--background` : blanc cassé très clair (footer Onbord) → `210 20% 99%`
- `--foreground` / `--primary` : navy profond Onbord → `213 75% 17%`
- `--card` : blanc pur `0 0% 100%`
- `--border` : gris froid très subtil → `214 20% 92%`
- `--muted` : `214 25% 96%`, `--muted-foreground` : `213 15% 45%`
- `--accent` : navy clair pour highlights `213 75% 95%`
- `--ring` : navy `213 75% 17%`
- `--sidebar-background` : blanc `0 0% 100%`, `--sidebar-accent` : `214 25% 96%`
- `--radius` : `0.625rem` (rayon Lemlist, légèrement moins arrondi qu'actuellement)

Police : **Onest** déjà importée — ajouter `font-feature-settings: "ss01", "cv11"` sur `body` pour le rendu propre type Onbord, et appliquer `font-sans` (Onest) globalement (déjà fait via Tailwind config).

### 2. UI Lemlist

**`src/components/ui/card.tsx`** :
- Card : `rounded-xl border border-border/70 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)]` (ombre très douce comme Lemlist), hover : `hover:border-border` + `hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]`
- Padding par défaut conservé

**`src/components/ui/button.tsx`** :
- `default` : `bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm` avec `rounded-lg`
- `outline` : `border-border bg-card hover:bg-muted/60`
- Tailles ajustées : `default h-9 px-4`, `sm h-8 px-3`, `lg h-10 px-5` (plus compact, comme Lemlist)

**`src/components/AppSidebar.tsx`** (style uniquement) :
- Sidebar fond blanc, bordure droite très fine `border-r border-border/60`
- Items : `rounded-lg px-3 py-2 text-[13px]`, état actif `bg-muted text-primary font-semibold`, état normal `text-muted-foreground hover:bg-muted/60 hover:text-foreground`
- Ajout de **labels de groupe** style Lemlist (« Find & Manage », « Engage ») — ici on garde un seul groupe, mais on style le label en `text-[11px] uppercase tracking-wider text-muted-foreground/70 px-3 mb-1`
- Bloc utilisateur en bas : avatar rond gris clair + nom en `text-[13px] font-medium`, séparateur fin au-dessus

**`src/components/AppLayout.tsx`** :
- Header : `bg-card border-border/60`, hauteur conservée
- `main` : fond `bg-background`, padding `p-6 lg:p-8` conservé

**`src/components/ui/input.tsx`, `textarea.tsx`, `select.tsx`, `badge.tsx`, `tabs.tsx`** :
- Inputs : `rounded-lg border-border bg-card h-9 text-[13px] shadow-[0_1px_2px_rgba(15,23,42,0.03)] focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40`
- Badge : `rounded-md font-medium text-[11px] px-2 py-0.5`
- Tabs : `bg-muted/60 rounded-lg p-1`, trigger actif `bg-card shadow-sm`

**Pages (Home, Requests, Drafts, NewRequest, RequestDetail, Account, Admin)** :
- Remplacer le hero gradient bleu de `Home.tsx` par une carte Lemlist-style : `rounded-xl border border-border bg-card p-8` avec accent latéral coloré (petit carré/icône en haut à gauche comme la bannière « Book a demo » de Lemlist)
- Les cartes de stats : icône dans carré arrondi `rounded-lg bg-muted` (au lieu de `rounded-xl bg-primary/10`), nombre en `text-2xl font-bold`, label en `text-[13px] text-muted-foreground`
- Espacements verticaux entre sections : `space-y-6` (au lieu de `space-y-12`) pour densité Lemlist
- Boutons CTA des hero : reprendre `variant="default"` (navy) au lieu du bouton blanc actuel

**Utilitaires `src/index.css`** :
- `card-hover` : `transition-all duration-150 hover:border-border hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]` (sans translate, plus sobre)
- Nouvelle classe `.section-title` : `text-[13px] font-semibold uppercase tracking-wider text-muted-foreground` pour les libellés de section façon Lemlist

### 3. Fichiers modifiés

- `src/index.css` — tokens HSL revus, utilitaires
- `src/components/ui/card.tsx` — ombres / rayon
- `src/components/ui/button.tsx` — tailles, ombres
- `src/components/ui/input.tsx`, `textarea.tsx`, `badge.tsx`, `tabs.tsx` — finitions
- `src/components/AppSidebar.tsx` — style des items, label de groupe, footer user
- `src/components/AppLayout.tsx` — header
- `src/pages/Home.tsx` — hero + stats restylés
- `src/pages/Requests.tsx`, `Drafts.tsx`, `RequestDetail.tsx`, `Account.tsx`, `NewRequest.tsx`, `Admin.tsx` — ajustements de classes (titres, espacements, boutons CTA)

### 4. Hors scope

- Aucune modification de structure de composants, de routes, de logique de data ou de schéma DB
- Aucun ajout/suppression de fonctionnalité
- Pages d'auth (`Login`, `Signup`) reçoivent uniquement les nouveaux tokens (héritage automatique)

### Vérification

1. Sidebar collapsed/expanded : items lisibles, actif en gris clair + texte navy gras
2. Dashboard : hero blanc bordure fine, 3 cartes étapes denses, stats avec icônes neutres
3. Liste demandes : cartes blanches, hover ombre douce
4. Formulaire nouvelle demande : inputs `h-9` cohérents, focus ring navy translucide
5. Mobile (375px) : sidebar offcanvas, cartes pleine largeur, espacements préservés

