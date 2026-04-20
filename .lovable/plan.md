

## Constat

Sur la page actuelle `/request/185de58a-...`, la donnée renvoyée par le backend contient bien `talent_type: "student"` (vu dans les requêtes réseau). Le code de `RequestDetail.tsx` affiche déjà :
- un badge "Étudiant / Jeune diplômé" à côté du domaine en haut
- une ligne "Type de talent" dans le bloc "Détails du poste"

Mais visiblement, sur ta page actuelle, ces éléments ne sont pas assez visibles ou pas assez clairs. De plus, dans les requêtes réseau récentes, les payloads d'auto-save de brouillon **n'incluent pas encore `talent_type`** (le champ est absent du body POST/PATCH), ce qui veut dire que la dernière version du code n'a pas été correctement appliquée au runtime ou que la sélection "Jeune diplômé" n'est jamais persistée.

## Ce que je vais faire

### 1. Rendre le type de talent ultra-visible sur la page détail

Dans `src/pages/RequestDetail.tsx`, retravailler la zone d'en-tête pour que le type de talent soit impossible à manquer :
- Mettre un **gros badge coloré et contrasté** juste sous le titre (pas une petite étiquette grise à côté du domaine)
- Ajouter une **carte dédiée "Type de talent"** en haut, avec une icône et le label en grand : "Étudiant" ou "Jeune diplômé"
- Garder aussi la ligne dans le bloc "Détails du poste"

### 2. Garantir que la donnée est bien envoyée au backend

Vérifier et corriger si besoin :
- `src/pages/NewRequest.tsx` : confirmer que l'auto-save de brouillon envoie bien `talent_type` dans **chaque** PATCH et POST
- `src/components/request/StepRecap.tsx` : confirmer que l'envoi final envoie bien `talent_type`
- Forcer une valeur par défaut explicite côté front pour éviter tout `undefined` qui serait filtré par Supabase

### 3. Rendre visible aussi sur les autres pages

- `src/pages/Drafts.tsx` : badge sur chaque carte brouillon
- `src/pages/Requests.tsx` : badge sur chaque carte de demande envoyée
- `src/pages/Admin.tsx` : badge dans la liste admin

### 4. Sécuriser l'affichage pour les anciennes demandes

Fallback robuste : si `talent_type` est absent ou null, on affiche "Étudiant" (valeur par défaut historique).

## Vérification de bout en bout

Après les changements, je vais :
1. recharger la page actuelle `/request/185de58a-...` et vérifier que le badge "Étudiant" est bien gros et visible en haut
2. créer une nouvelle demande en sélectionnant "Jeune diplômé"
3. inspecter la requête réseau POST/PATCH pour confirmer que `talent_type: "graduate"` est bien dans le body
4. ouvrir le brouillon dans Brouillons → vérifier le badge
5. envoyer la demande → vérifier dans Mes demandes
6. ouvrir le détail → vérifier le gros badge et la ligne "Type de talent"

## Fichiers concernés

- `src/pages/RequestDetail.tsx` (visibilité forte)
- `src/pages/NewRequest.tsx` (persistance)
- `src/components/request/StepRecap.tsx` (persistance)
- `src/pages/Drafts.tsx`, `src/pages/Requests.tsx`, `src/pages/Admin.tsx` (badges listes)

## Détails techniques

Le composant Badge `secondary` actuel sur fond clair peut être peu visible selon le thème. Je vais utiliser une variante plus marquée (couleur primaire ou accent + icône `GraduationCap`) pour le badge principal, et placer en plus une carte "Type de talent" juste après le titre afin que ce soit la première information vue par l'admin et l'utilisateur.

