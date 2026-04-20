

## Plan : Refonte du formulaire de demande

### Step 1 — Recherche en langage naturel (nouveau)

Le Step 1 ne contient plus tout le profil. Il devient une page très simple :

- Un grand `Textarea` avec le placeholder demandé : *"Décrivez le talent que vous recherchez... (ex: développeur JavaScript junior 3 jours par semaine)"*
- Un bouton **"Générer le profil"** à droite/dessous
- Au clic : appel d'une edge function backend qui interroge l'IA et renvoie un JSON structuré
- Les champs reconnus (`domain`, `hardSkills`, `softSkills`, `talentType`, `diplome`) sont **pré-remplis** dans le state du formulaire
- Une fois la génération terminée → on passe automatiquement au Step 2 (déjà pré-rempli, l'utilisateur peut affiner)
- L'utilisateur peut aussi sauter cette étape et aller direct au Step 2 manuellement

**Note technique IA** : la consigne mentionne Anthropic Claude. Lovable utilise par défaut **Lovable AI** (gateway intégré, sans clé API à fournir, gratuit pendant la période d'inclusion). J'utiliserai `google/gemini-3-flash-preview` qui est rapide, gratuit et parfaitement adapté à de l'extraction structurée. Le system prompt fourni sera utilisé tel quel, et l'extraction se fera via tool calling pour garantir un JSON propre.

### Step 2 — Tous les autres champs (Profil + Détails fusionnés)

Le Step 2 regroupe maintenant ce qui était avant éclaté entre Step Talent et Step Détails :

**Bloc "Profil recherché"** (vient du Step Talent actuel)
- Type de talent (Étudiant / Jeune diplômé)
- Domaine, Hard skills, Soft skills, Langues, Diplôme

**Bloc "Détails du poste"** (vient du Step Détails actuel)
- Titre, description, nombre de talents, mode de travail
- **Planning conditionnel selon le type de talent :**

#### Si "Étudiant" :
- Comportement actuel conservé : sélecteur "jours par semaine" + horaires flexibles ou fixes (matin/après-midi par jour)

#### Si "Jeune diplômé" :
- Nouveau choix : **"Temps plein"** ou **"Temps partiel"**
- Si **Temps plein** → 5 jours/sem automatiquement, pas de sélecteur d'horaires
- Si **Temps partiel** → sélecteur de nombre de jours, **minimum 3 jours**, maximum 4

### Conséquences sur les autres steps

- Les anciens steps deviennent : **1. IA · 2. Formulaire · 3. Tarif · 4. Récap** (toujours 4 cartes dans le stepper)
- `StepPricing` et `StepRecap` continuent de fonctionner — la logique pricing tient compte du temps plein (40h × nb talents) pour les jeunes diplômés
- Le récap affiche "Temps plein" / "Temps partiel (X jours)" pour les jeunes diplômés au lieu de "Flexibles / Fixes"

### Modifications de données

Ajout dans `RequestFormData` (et persistance Supabase) :
- `naturalLanguageQuery: string` — la phrase saisie au Step 1 (pour traçabilité)
- `employmentType: "full_time" | "part_time" | null` — utilisé uniquement pour les jeunes diplômés

Ces deux champs vont dans la table `requests` via une migration (colonnes `natural_language_query text`, `employment_type text`).

### Code supprimé / nettoyé

- Suppression du composant `StepJobDetails.tsx` (fusionné dans Step 2)
- Suppression dans `StepTalentInfo` du bouton "Suivant" autonome → remplacé par le nouveau Step 2 unifié `StepProfileAndJob.tsx`
- Suppression des imports / props devenus inutiles
- Mise à jour de `NewRequest.tsx` : nouveau tableau `steps = ["Recherche IA", "Formulaire", "Tarif", "Récap"]` et nouveau routage des composants

### Edge function `generate-talent-profile`

Nouveau fichier `supabase/functions/generate-talent-profile/index.ts` :
- Reçoit `{ description: string }` du frontend
- Appelle Lovable AI Gateway avec le system prompt **exact** demandé par l'utilisateur
- Utilise tool calling (`extract_profile`) pour forcer un JSON propre
- Mappe le résultat vers les valeurs internes : `Étudiant` → `student`, `Jeune diplômé` → `graduate`, et matche le `domain` retourné contre la liste `DOMAINS` (fallback sur match approximatif insensible à la casse)
- Gère les erreurs 429 (rate limit) et 402 (crédits) avec un toast côté frontend
- `verify_jwt = false` n'est pas nécessaire (utilisateur déjà connecté)

### Fichiers concernés

- **Créés** : `src/components/request/StepNaturalLanguage.tsx`, `src/components/request/StepProfileAndJob.tsx`, `supabase/functions/generate-talent-profile/index.ts`, migration SQL
- **Modifiés** : `src/pages/NewRequest.tsx`, `src/lib/request-types.ts`, `src/components/request/StepRecap.tsx`, `src/components/request/StepPricing.tsx` (logique heures pour temps plein)
- **Supprimés** : `src/components/request/StepJobDetails.tsx`, `src/components/request/StepTalentInfo.tsx` (remplacé par StepProfileAndJob)

### Vérification de bout en bout

1. Aller sur "Nouvelle demande"
2. Taper *"développeur React junior 3 jours par semaine"* → cliquer Générer le profil
3. Vérifier que le Step 2 est pré-rempli (domaine IT & Software, React, talent type Étudiant)
4. Affiner si besoin, passer au tarif puis au récap, envoyer
5. Recommencer en sélectionnant "Jeune diplômé" → vérifier que le Step 2 propose Temps plein / Temps partiel (min 3 jours)
6. Vérifier le rendu sur mobile

