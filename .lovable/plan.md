
# Fix : checkmark "Skills" trop permissif

## Problème observé

En tapant juste "développeur", le tag **Skills** passe au vert. Deux causes :

1. **Côté edge function** : le system prompt n'interdit pas à l'IA d'inférer des skills à partir du titre du job. Quand on dit "développeur", l'IA peut deviner "JavaScript", "Python", ou pousser "développeur" lui-même dans `customHardSkills`.
2. **Côté front** : la condition `ok` du tag Skills se déclenche dès qu'il y a **au moins 1 hard skill** (catalogue OU custom), sans distinguer ce qui a été réellement écrit par l'utilisateur.

## Correctifs

### 1. Edge function `generate-talent-profile` — durcir le prompt

Ajouter aux RÈGLES STRICTES :

- `hardSkills` et `customHardSkills` doivent contenir **UNIQUEMENT** des technologies/outils/compétences techniques **explicitement écrits** dans la description de l'utilisateur. **INTERDIT** d'inférer un skill à partir du titre du poste (ex : "développeur" → JS/Python : interdit).
- Ne JAMAIS mettre un intitulé de métier ("développeur", "comptable", "marketeur", "ingénieur"...) dans `customHardSkills`.
- Si la description ne mentionne aucun outil/techno précis → renvoyer `hardSkills: []` et `customHardSkills: []`.
- Idem pour `softSkills` / `customSoftSkills` : uniquement si explicitement mentionnés.
- `langues` : uniquement si explicitement mentionnées (FR, EN, NL, "français", "anglais"...). Ne pas inférer.
- `location` : uniquement si une ville/pays/adresse est explicitement mentionnée.

### 2. Edge function — filtre serveur de sécurité

Côté serveur, après extraction, **filtrer `customHardSkills`** pour exclure tout terme qui ressemble à un intitulé de poste :

- Liste noire de mots-clés métiers à rejeter (case-insensitive, normalisé) : `développeur`, `developer`, `dev`, `comptable`, `marketeur`, `ingénieur`, `engineer`, `assistant`, `manager`, `consultant`, `analyste`, `analyst`, `commercial`, `sales`, `vendeur`, `designer`, `chef de projet`, `product owner`, `scrum master`, `data scientist`, `data analyst`...
- Si le terme custom == jobTitle (normalisé, ou contenu dans le jobTitle) → rejeté aussi.

Cela garantit que même si l'IA dérape, le mot "développeur" ne remonte jamais comme skill.

### 3. Front `StepNaturalLanguage.tsx` — confirmer le check Skills uniquement sur signal réel

Aucun changement de logique nécessaire si l'edge function renvoie correctement `[]`. Le tag passera vert seulement quand un vrai skill est présent.

## Fichiers modifiés

- `supabase/functions/generate-talent-profile/index.ts` (system prompt + filtre blacklist côté serveur)

## Critères d'acceptation

1. "développeur" → tags : tous gris (aucun skill, pas de localisation, pas de langue). Titre détecté = "Développeur" (vert).
2. "développeur Python" → Skills vert (Python), Titre vert. Localisation et Langues gris.
3. "développeur Python à Bruxelles FR/EN" → 4 tags verts.
4. "comptable junior" → Titre vert uniquement. Skills/Localisation/Langues gris.
