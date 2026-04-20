

## Constat

L'IA invente actuellement des skills qui ne sont pas dans les catalogues, et les classe parfois mal (ex. "cold calling" mis en soft skill). Le problème : le prompt et le schéma autorisent l'IA à renvoyer du texte libre, et le serveur tombe en mode "skill custom" lorsqu'un terme n'est pas reconnu.

## Règle métier à appliquer

**L'IA ne propose QUE des items issus des catalogues fermés.** Si un besoin exprimé par l'utilisateur n'est pas dans le catalogue (ex: "cold calling"), elle ne le met nulle part. Charge à l'entreprise de l'ajouter manuellement via le champ "Ajouter un skill personnalisé" au Step 2.

## Correctifs

### 1. Edge function `generate-talent-profile/index.ts`

- **Ajouter le catalogue fermé des soft skills** (15 items) en constante.
- **System prompt durci** : indique explicitement que `hardSkills` et `softSkills` doivent être **strictement** un sous-ensemble des catalogues fournis. Interdit d'inventer un terme. Si un besoin n'a pas d'équivalent dans la liste, le laisser de côté. Ajouter une consigne anti-confusion : un savoir-faire technique/outil/méthode commerciale (ex: cold calling, prospection) n'est jamais un soft skill.
- **Schéma de tool calling renforcé** :
  - `hardSkills`: `items.enum` = liste plate de tous les hard skills connus
  - `softSkills`: `items.enum` = la liste fermée des 15 soft skills
- **Suppression du champ `customHardSkills`** dans la réponse : on ne renvoie plus de skills hors catalogue. Si l'IA renvoie quand même quelque chose qui ne matche pas après normalisation/alias, on l'ignore silencieusement côté serveur.
- **Filtrage côté serveur** : pour `softSkills`, on garde uniquement les valeurs présentes dans le catalogue (matching normalisé).

### 2. Frontend `StepNaturalLanguage.tsx`

- Suppression de la fusion avec `customHardSkills` (le champ disparaît).
- `mustHaveSkills` ← uniquement `result.hardSkills` (déjà filtrés serveur).
- `mustHaveSoftSkills` ← uniquement `result.softSkills` (déjà filtrés serveur).
- Si rien ne matche, on laisse les champs vides — l'utilisateur les complétera au Step 2.

## Fichiers modifiés

- `supabase/functions/generate-talent-profile/index.ts` — catalogue soft skills, prompt strict, enums dans le tool, filtrage serveur, suppression `customHardSkills`
- `src/components/request/StepNaturalLanguage.tsx` — ne fusionne plus de skills custom

## Vérification

1. *"Quelqu'un pour faire du cold calling"* → ni hard ni soft skill rempli (cold calling n'existe pas), domaine **Business & Sales** sélectionné. L'utilisateur ajoute "Cold calling" à la main via le champ personnalisé.
2. *"Développeur React et Node, autonome et bon communicant"* → hardSkills: React.js, Node.js ; softSkills: Autonomie, Communication.
3. *"Comptable rigoureux maîtrisant Excel"* → hardSkills: Microsoft Excel ; softSkills: Rigueur.

