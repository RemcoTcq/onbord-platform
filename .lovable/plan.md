
Objectif

Faire en sorte que le type de talent soit réellement fiable et visible partout dans le parcours:
- pendant le brouillon
- dans le récapitulatif avant envoi
- dans “Mes demandes”
- dans le détail d’une demande
- côté admin

Constat à corriger

Le schéma backend est déjà prêt:
- la colonne `requests.talent_type` existe
- la page détail sait déjà l’afficher quand la donnée est présente

Le vrai problème est un alignement incomplet entre écriture et lecture:
- certaines requêtes actives de sauvegarde/envoi n’embarquent pas `talent_type`
- la page Brouillons ne sélectionne pas `talent_type` du tout
- le runtime actif semble encore utiliser des sélections/payloads incomplets, donc il faut réappliquer et vérifier le bon chemin de code

Ce que je vais corriger

1. Fiabiliser la persistance du type de talent
- Revoir `src/pages/NewRequest.tsx` pour garantir que l’auto-save de brouillon envoie toujours `talent_type`
- Revoir `src/components/request/StepRecap.tsx` pour garantir que l’envoi final met aussi `talent_type`
- Vérifier le rechargement d’un brouillon: si la demande a `talent_type`, le formulaire doit réinjecter correctement `student` ou `graduate`

2. Rendre le type visible dans les brouillons
- Mettre à jour `src/pages/Drafts.tsx`
- Ajouter `talent_type` dans le `select(...)`
- Afficher un badge “Étudiant” / “Jeune diplômé” sur chaque carte brouillon, au même niveau visuel que le domaine et la date

3. Rendre le type visible dans Mes demandes
- Confirmer et, si nécessaire, corriger `src/pages/Requests.tsx`
- S’assurer que la requête récupère bien `talent_type`
- Garder un badge visible sur chaque demande envoyée

4. Rendre le type visible dans le détail de la demande
- Vérifier `src/pages/RequestDetail.tsx`
- Garder le badge en haut de page
- Garder la ligne “Type de talent” dans le bloc de détails
- Ajouter un fallback sûr si une ancienne ligne n’a pas encore la donnée attendue

5. Aligner aussi la vue admin
- Vérifier `src/pages/Admin.tsx` pour que la liste admin charge et affiche systématiquement `talent_type`
- Vérifier que le détail admin profite bien du même affichage que la page détail

6. Sécuriser les cas existants
- Prévoir un affichage robuste pour les anciennes demandes:
  - si `talent_type === "graduate"` → “Jeune diplômé”
  - sinon → “Étudiant”
- Ne pas toucher à la logique métier du formulaire ni au Step 2

Fichiers concernés

- `src/pages/NewRequest.tsx`
- `src/components/request/StepRecap.tsx`
- `src/pages/Drafts.tsx`
- `src/pages/Requests.tsx`
- `src/pages/RequestDetail.tsx`
- `src/pages/Admin.tsx`

Vérification prévue

Je vérifierai de bout en bout le scénario exact demandé:
1. créer une demande en choisissant “Jeune diplômé”
2. vérifier que le récapitulatif affiche bien “Jeune diplômé”
3. vérifier que le brouillon affiche bien le badge
4. envoyer la demande
5. vérifier “Mes demandes”
6. ouvrir le détail de la demande
7. vérifier l’affichage côté admin
8. contrôler que les requêtes réseau POST/PATCH/GET contiennent bien `talent_type`

Détails techniques

- Aucun changement de structure de base n’est nécessaire
- Le correctif porte surtout sur:
  - les payloads envoyés au backend
  - les champs sélectionnés dans les requêtes
  - le rendu UI des badges/labels
- Si le souci venait d’un chemin de code actif différent ou d’un rendu stale dans la preview, je réappliquerai les changements sur le code réellement exécuté et je validerai ensuite avec les requêtes réseau
