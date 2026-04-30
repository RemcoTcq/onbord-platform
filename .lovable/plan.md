## 4 corrections ciblées

### 1. Recherche IA vide → on peut quand même générer

Fichier : `src/components/request/StepNaturalLanguage.tsx`

- Si le textarea est vide ou < 15 caractères : `Continuer` passe directement à l'étape suivante (`onNext()`) sans afficher l'overlay "L'IA remplit votre formulaire".
- Si du texte est présent mais que l'analyse IA n'a rien trouvé / a échoué : on n'empêche pas l'avancement, on log et on passe.
- Le bouton n'est plus jamais bloqué à cause de l'absence de détection.

### 2. Bug import CSV — parser robuste

Fichier : `src/components/request/CandidatesSection.tsx` (fonctions `parseCsv` et `matchField`)

Problèmes actuels :
- Split naïf sur `[,;]` → casse si une valeur contient une virgule entre guillemets.
- Pas de gestion du BOM UTF-8 (`\uFEFF` en tête → première colonne illisible).
- `matchField` compare en ASCII brut → une colonne `prénom` ou `Prénom` ne matche pas `prenom`.
- Pas de détection automatique du séparateur (tab, point-virgule).

Corrections :
- Détecter le séparateur automatiquement (`,`, `;`, `\t`) sur la ligne d'en-tête.
- Strip BOM en début de fichier.
- Parser ligne par ligne en respectant les guillemets `"..."` (gestion des virgules échappées et `""` doublé).
- Normaliser les en-têtes : lowercase + strip accents (`prénom` → `prenom`) avant matching.
- Ignorer les lignes complètement vides.
- Toast plus explicite : "X candidats importés sur Y lignes" + warning si beaucoup de lignes ignorées.

### 3. Détails scoring — citer le CV et la demande

Fichier edge function : `supabase/functions/score-cv/index.ts`
Fichier UI : `src/components/request/CandidatesSection.tsx` (`CandidateDetailsDialog` + `BreakdownRow`)

Edge function — enrichir le tool schema `submit_cv_score` :
- `breakdown` devient `{ [criterion]: { score: int, max: int, comment: string, evidence_cv: string, requirement: string } }`.
  - `comment` : analyse en 1 phrase.
  - `evidence_cv` : citation/référence concrète du CV (ou "Non mentionné dans le CV").
  - `requirement` : ce que demande l'offre pour ce critère.
- `concerns` enrichis : chaque préoccupation cite explicitement ce qui manque vs ce qui est demandé.
- `summary` doit faire le lien explicite entre poste / talent / CV en 3-4 phrases.
- Système prompt : insister sur "Pour chaque critère faible, indique précisément ce que demande l'offre et ce que le CV contient ou non. Ne reste jamais vague."

UI — `BreakdownRow` :
- Affiche en plus `requirement` (ce qui est demandé) et `evidence_cv` (ce qui est trouvé), en deux mini-lignes labellisées.
- Compatible rétro avec l'ancien format (juste un nombre).

### 4. Invitation entretien → lien copiable, pas d'email

Fichier : `src/components/request/CandidatesSection.tsx`

- Renommer le bouton "Inviter" → "Lien d'entretien" (icône `Link`).
- Au clic : crée/réutilise la session (logique existante OK) puis ouvre une dialog "Lien d'entretien IA" avec :
  - Le lien complet (`/interview/<token>`) dans un input readonly.
  - Bouton **Copier** (toast "Lien copié").
  - Petit texte : "Partagez ce lien à {prénom} {nom} par le canal de votre choix. Valide 14 jours."
  - Bouton secondaire **Ouvrir** (nouvel onglet) pour vérifier.
- **Plus aucun appel à `send-transactional-email`** ici.
- Le statut du candidat passe à `interview_invited` dès que le lien est généré (ou rester sur `cv_scored` jusqu'à ce que le candidat ouvre le lien — à confirmer, je propose : passe en `interview_invited` à la génération, c'est cohérent avec l'état "lien partagé").

## Hors scope (pour cette itération)

- Pas de modification de la logique de scoring elle-même (poids, seuils, modèle).
- Pas de changement du flux d'entretien IA (`/interview/:token` reste tel quel).
- Pas de touch-up visuel ailleurs dans l'app.
