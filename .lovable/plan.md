## Deux corrections sur le détail de demande

### 1. Admin peut modifier la progression directement
Sur `/request/:id`, la timeline « Progression » est aujourd'hui en lecture seule. On ajoute, **uniquement pour les admins**, un sélecteur de statut (les mêmes valeurs que dans la liste admin) au-dessus ou à côté de la timeline. Le changement met à jour la base et la timeline en temps réel (la coche verte avance).

Fichier : `src/pages/RequestDetail.tsx` — ajout d'un `Select` (visible si `isAdmin`) qui appelle `supabase.from("requests").update({ status }).eq("id", id)` puis `setRequest(...)`.

### 2. Bug de focus dans la création/édition de profil étudiant (admin)
Dans `AdminProfilesManager.tsx`, les sous-éditeurs (`HardSkillsEditor`, `SoftSkillsEditor`, `LanguagesEditor`, `ExperiencesEditor`) sont **déclarés à l'intérieur du composant parent**. À chaque frappe, l'état `editing` change, le composant parent re-rend, et chacun de ces sous-composants est recréé comme un nouveau type de composant → React démonte/remonte les `<Input>`, ce qui fait perdre le focus à chaque lettre. C'est exactement le symptôme décrit.

Correction : transformer ces éditeurs en composants déclarés **en dehors** du composant `AdminProfilesManager`, en leur passant `items` + `onChange` via props. Les inputs garderont alors leur focus pendant la saisie.

Le même pattern doit être vérifié pour le `LookingForEditor` / autres sections inline éventuelles dans la suite du fichier.

### Fichiers modifiés
- `src/pages/RequestDetail.tsx` — sélecteur de statut admin au-dessus de la timeline.
- `src/components/admin/AdminProfilesManager.tsx` — extraction des sous-éditeurs hors du composant parent.

Aucun changement de base de données n'est nécessaire.