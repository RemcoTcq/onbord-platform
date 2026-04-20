

## Constat

Quand l'IA renvoie le profil, deux problèmes empêchent la pré-sélection visuelle :

1. **Domaine** : si l'IA renvoie "Développement", "IT", "Tech" au lieu de "IT & Software", le matching actuel (égalité ou `includes`) échoue → `domain` reste vide → la section Hard Skills ne s'affiche même pas.
2. **Hard skills** : l'IA renvoie souvent des libellés légèrement différents de la liste catalogue (ex. "React" vs "React.js", "Node" vs "Node.js", "TypeScript" — absent du catalogue). Comme on injecte ces valeurs telles quelles dans `mustHaveSkills`, les badges du catalogue ne s'allument pas en bleu (le code compare strictement par chaîne).

## Correctifs

### 1. Edge function `generate-talent-profile` — meilleur prompt + matching robuste

- **Forcer l'IA à choisir parmi la liste fermée** : le system prompt et le schéma `extract_profile` reçoivent la liste exacte des 6 domaines et la liste complète des hard skills disponibles pour chaque domaine. Le champ `domain` devient un `enum` strict et `hardSkills` doit être un sous-ensemble du catalogue du domaine choisi.
- **Tolérance côté serveur** : après réception, on normalise (minuscules + suppression des accents) et on matche les hard skills retournés contre le catalogue du domaine via :
  - égalité normalisée
  - alias courants (`react` → `React.js`, `node` → `Node.js`, `vue` → `Vue.js`, `angular` → `Angular.js`, `js` → `JavaScript`, `ts` → `JavaScript`, `excel` → `Microsoft Excel`, etc.)
  - `includes` partiel dans les deux sens (dernier recours)
- Les skills qui ne matchent vraiment rien sont conservés tels quels dans la réponse, mais placés dans un nouveau champ `customHardSkills: string[]` séparé.
- Réponse JSON enrichie :
  ```
  { domain, hardSkills (catalogue), customHardSkills, softSkills, talentType, diplome }
  ```

### 2. Frontend `StepNaturalLanguage.tsx` — exploiter la nouvelle réponse

- Pré-remplit `mustHaveSkills` avec les `hardSkills` matchées (donc qui s'allumeront en bleu dans le catalogue du Step 2)
- Ajoute les `customHardSkills` à `mustHaveSkills` aussi (ils apparaîtront dans le bloc "Must have" mais pas en bleu dans le catalogue, ce qui est attendu)
- Idem pour `softSkills`
- Garde `naturalLanguageQuery`, `talentType`, `domain`, `diploma`

### 3. Step 2 `StepProfileAndJob.tsx` — affichage cohérent

Aucun changement de logique : grâce au matching serveur, `data.domain` correspondra toujours à un des 6 items, donc la section Hard Skills s'ouvre, et les skills sélectionnées seront reconnues dans le catalogue → badges en bleu cliquables (toggle).

## Fichiers modifiés

- `supabase/functions/generate-talent-profile/index.ts` — nouveau prompt avec listes fermées, matching côté serveur, alias, sortie enrichie
- `src/components/request/StepNaturalLanguage.tsx` — fusion `hardSkills + customHardSkills` dans `mustHaveSkills`

## Vérification

1. Taper *"Développeur React et Node 3 jours par semaine"* → Générer
2. Au Step 2, vérifier : domaine = **IT & Software**, badges **React.js** et **Node.js** allumés en bleu dans le catalogue, et présents dans la colonne "Must have"
3. Taper *"Comptable junior maîtrisant Excel et SAP"* → vérifier domaine **Finance** ou **Administration** (selon ce que choisit l'IA), avec **Microsoft Excel** ou **SAP** matchés
4. Taper une description floue ("Stagiaire marketing créatif") → vérifier que le domaine **Marketing** est sélectionné même sans skill mentionné

