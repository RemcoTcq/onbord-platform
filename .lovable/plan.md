

## Suppression du Step 3 « Tarification » + enrichissement IA

### 1. Retirer le Step Pricing du formulaire

**`src/pages/NewRequest.tsx`**
- Remplacer le tableau `steps` par 3 entrées : `["Recherche IA", "Formulaire", "Récap"]`.
- Supprimer l'import `StepPricing`.
- Supprimer le rendu `{step === 2 && <StepPricing ... />}`.
- Renuméroter les transitions :
  - Step 1 (`StepProfileAndJob`) `onNext` → `setStep(2)` (au lieu de 3).
  - Step 2 devient `StepRecap` avec `onBack={() => setStep(1)}`.

**`src/components/request/StepPricing.tsx`** : supprimer le fichier (plus aucune référence).

Aucun autre changement de logique : la sauvegarde de brouillon, la soumission et `onEdit` continuent de fonctionner (`onEdit` ne pointait jamais vers l'écran tarif côté Recap).

### 2. Enrichir la réponse IA (Step 1 « Analyser avec l'IA »)

**`supabase/functions/generate-talent-profile/index.ts`**

Ajouter au tool schema `extract_profile` trois propriétés :
- `jobTitle` : `string` — titre court du poste déduit (ex. « Développeur React », « Comptable junior »).
- `langues` : `array<string>`, `enum: ["Français", "Anglais", "Néerlandais"]` — langues détectées dans la description.
- `diplome` reste, `talentType` reste.

Mettre à jour le `SYSTEM_PROMPT` :
- Lister les 3 langues autorisées et exiger un sous-ensemble strict.
- Demander un `jobTitle` concis (max ~6 mots), en français, sans punctuation finale.
- Si aucune langue n'est mentionnée explicitement ou implicitement, retourner `[]`.

Côté handler de réponse :
- Filtrer `langues` contre `["Français", "Anglais", "Néerlandais"]` (insensible à la casse / accents via la fonction `normalize` existante) et reconstruire des objets `{ name, level: 3 }` (niveau par défaut, aligné sur le pattern utilisé partout ailleurs dans le code).
- Nettoyer `jobTitle` (trim, fallback `""`).
- Retourner le JSON enrichi exactement sous cette forme :
  ```json
  {
    "domain": "...",
    "hardSkills": [...],
    "softSkills": [...],
    "talentType": "student" | "graduate",
    "diplome": "Bachelier" | "Master" | null,
    "langues": [{ "name": "Français", "level": 3 }, ...],
    "jobTitle": "Développeur React"
  }
  ```

> Note : le client utilise `talentType` interne (`"student"` / `"graduate"`) ; la conversion existante `Jeune diplômé → graduate` est conservée. Le contrat décrit dans la demande utilise `talentType` côté JSON renvoyé au front (mappage interne), ce qui correspond à ce que `StepNaturalLanguage` consomme déjà.

### 3. Mapper les nouveaux champs côté front

**`src/components/request/StepNaturalLanguage.tsx`** dans `handleGenerate`, ajouter au `update: Partial<RequestFormData>` :
- `if (result.jobTitle) update.title = result.jobTitle;`
- `if (Array.isArray(result.langues) && result.langues.length > 0) update.languages = result.langues;`

Les mappings existants pour `talentType`, `domain`, `hardSkills`, `softSkills`, `diplome` restent inchangés.

### 4. Hors scope

- Aucune modification de schéma DB, RLS, routing, autres écrans.
- Aucune modification visuelle / style.
- `StepRecap.tsx` reste inchangé (ses transitions étaient déjà autonomes).

### Vérification

1. Le formulaire affiche **3 puces** : Recherche IA → Formulaire → Récap, et la navigation Suivant/Retour passe directement de l'étape 2 à l'étape Récap.
2. Sur Step 1, « Décris un développeur React parlant anglais et français, Master, temps plein » pré-remplit : titre = « Développeur React », langues = Français + Anglais (niveau 3), diplôme = Master, talentType = Jeune diplômé, hardSkills = React.js.
3. Une description sans langues mentionnées laisse `languages` vide.
4. Édition d'un brouillon existant fonctionne toujours (chargement direct sur l'étape Formulaire).

