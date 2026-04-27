# Barre de recherche IA "JuiceBox", adresse de travail & lock demi-journées

## 1. Barre de recherche intelligente (Step 0)

Refonte de `StepNaturalLanguage` en une **vraie search bar unique** :

- Un seul champ texte large, style command palette.
- **Debounce 700 ms** : dès que l'utilisateur arrête de taper (et que le texte fait > 15 caractères), on appelle automatiquement `generate-talent-profile` en arrière-plan (sans bloquer la frappe).
- Affichage discret : spinner "Analyse…" pendant l'appel, sans toast.
- Le résultat **n'écrit pas dans le formulaire** tant que l'utilisateur ne valide pas — il alimente uniquement les checkmarks (preview) et un état `lastDetection`.

### Tags de validation (checkmarks)

Sous la barre, 4 tags affichés en ligne :

```text
[✓ Titre]   [✓ Skills]   [○ Localisation]   [✓ Langues]
```

- Vert + Check si détecté, gris + cercle vide sinon.
- Tooltip au survol = valeur détectée (ex. "Développeur React").
- Bouton **"Continuer"** toujours actif (même si tout n'est pas vert) → applique `lastDetection` au form et passe à l'étape Formulaire.
- Bouton **"Passer"** inchangé.

## 2. Extraction IA enrichie

Mise à jour de `supabase/functions/generate-talent-profile/index.ts` :

Ajouter au schéma `extract_profile` :

- `location` (string|null) — adresse / ville / pays détectée librement.
- `jobDescription` (string) — description courte du poste (2-3 phrases, ton recruteur).
- `customHardSkills` (string[]) — hard skills détectés mais **absents** du catalogue (ex. "TypeScript", "Figma").
- `customSoftSkills` (string[]) — idem pour soft skills hors liste fermée.

Comportement côté edge function :

- Hard/soft skills du catalogue → toujours filtrés strictement (comme aujourd'hui).
- Les skills hors-catalogue détectés sont retournés dans `customHardSkills` / `customSoftSkills` au lieu d'être jetés.
- `location` est renvoyée brute (texte libre) — la classification "soft vs hard" reste guidée par le system prompt enrichi.

Côté front (`StepNaturalLanguage`) :

- `customHardSkills` → ajoutés à `mustHaveSkills` ET poussés dans `customSkills` (déjà persistés en BD).
- `customSoftSkills` → ajoutés à `mustHaveSoftSkills`.
- `jobDescription` → pré-remplit `data.description`.
- `location` → pré-remplit le nouveau champ `data.workLocation`.

Les checkmarks se basent sur :

- Titre = `jobTitle` non vide
- Skills = au moins 1 hard skill (catalogue OU custom)
- Localisation = `location` non vide
- Langues = au moins 1 langue détectée

## 3. Champ "Adresse du lieu de travail" (obligatoire)

### Base de données

Migration : ajouter à `requests`

```sql
ALTER TABLE public.requests
  ADD COLUMN work_location text NOT NULL DEFAULT '';
```

### Code

- `RequestFormData` : ajout `workLocation: string`.
- `StepProfileAndJob` : nouveau champ Input "Adresse du lieu de travail *" dans la section "Détails du poste", placé juste après "Mode de travail".
- `canProceed` : ajouter `data.workLocation.trim().length > 0`.
- `StepRecap` : afficher l'adresse + inclure `work_location` dans le payload `insert/update`.
- `NewRequest` (load draft + saveDraft) : lire/écrire `work_location`.
- `AdminRequestEditForm` : ajouter le champ pour les admins.

## 4. Lock intelligent des demi-journées (étudiants)

Règle : `maxSlots = daysPerWeek × 2`.

Dans `StepProfileAndJob` (mode étudiant + horaires fixes) :

- Calcul du compteur : `usedSlots = sum(scheduleDetails[day].length)`.
- Affichage au-dessus de la grille : `Demi-journées sélectionnées : usedSlots / maxSlots`.
- Pour chaque badge "Matin" / "Après-midi" non sélectionné :
  - Si `usedSlots >= maxSlots` → badge grisé, `cursor-not-allowed`, clic ignoré.
- Les badges déjà sélectionnés restent toujours cliquables (pour décocher).
- Si l'utilisateur baisse `daysPerWeek` et que `usedSlots > newMax` → `useEffect` qui tronque automatiquement les sélections excédentaires (en gardant l'ordre d'insertion, on coupe les derniers).
- Petit message d'aide : `"1 jour = 2 demi-journées (matin + après-midi). Limite atteinte."` quand bloqué.

Même logique reportée dans `AdminRequestEditForm`.

## 5. Détails techniques

**Fichiers modifiés**

- `src/components/request/StepNaturalLanguage.tsx` — refonte complète (search bar, debounce, tags checkmarks).
- `src/lib/request-types.ts` — ajout `workLocation`.
- `src/components/request/StepProfileAndJob.tsx` — champ adresse, lock demi-journées, troncature auto.
- `src/components/request/StepRecap.tsx` — adresse dans le payload + récap.
- `src/pages/NewRequest.tsx` — load/save `work_location`.
- `src/components/admin/AdminRequestEditForm.tsx` — adresse + lock demi-journées.
- `supabase/functions/generate-talent-profile/index.ts` — `location`, `jobDescription`, `customHardSkills`, `customSoftSkills` dans le schéma + system prompt.

**Migration SQL**

- `requests.work_location text NOT NULL DEFAULT ''`.

**Pas de nouveau composant UI lourd** : on réutilise `Input`, `Badge`, `Check` (lucide), `Loader2`.

## Critères d'acceptation

1. Sur l'étape 1 (search bar), taper `"Développeur Python à Bruxelles 2 jours FR/EN"` →  dès qu'un élément est détecté, les checkmarks deviennent vert ! 
2. Cliquer "Continuer" → form pré-rempli avec : titre = Développeur Python, hard skill Python (catalogue), langues FR + EN, adresse = Bruxelles, description courte générée.
3. Taper `"Besoin d'un dev TypeScript / Figma"` → TypeScript et Figma apparaissent comme custom skills dans Must have après application.
4. Sans adresse, le bouton "Suivant" du formulaire est désactivé.
5. Étudiant + 2 jours + horaires fixes → on peut cocher au max 4 demi-journées ; au-delà, les autres badges sont grisés et non cliquables.
6. Passer de 2 jours à 1 jour avec 4 demi-journées cochées → tronqué automatiquement à 2.
7. L'adresse est persistée en brouillon, en demande envoyée, et éditable par l'admin.