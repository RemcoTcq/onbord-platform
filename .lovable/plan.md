# Profils étudiants enrichis — création admin & vue détaillée entreprise

## Objectif

1. **Admin** : un formulaire de création de profil structuré, beaucoup plus complet (formation, expériences, soft skills avec exemples, langues notées, objectifs, etc.).
2. **Entreprise** : vue liste sous forme de **cartes enrichies**, avec un bouton **"Voir profil complet"** qui ouvre un modal détaillé, depuis lequel on peut cliquer **✅ Intéressé** ou **❌ Pas le bon profil**.

---

## 1. Modèle de données — colonnes ajoutées à `proposed_profiles`

Toutes nullable / défauts vides. Toutes anonymes côté entreprise (pas de nom de famille, pas de nom d'entreprise dans les expériences).

**Identité publique anonymisée**

- `first_name` (text) — prénom affiché
- `last_initial` (text) — initiale du nom (générée auto à partir de `full_name`)
- `bio` (text) — 3–4 lignes
- `validated_by_onbord` (bool, default true) — pour afficher le badge "Validé Onbord"

**Formation**

- `school` (text)
- `diploma` (text)
- `study_year` (text) — ex: "Master 1", "Bac+3"
- `study_field` (text)

**Compétences**

- `hard_skills_detail` (jsonb) — `[{ name: "Python",}, …]` 
- `soft_skills_detail` (jsonb) — `[{ name: "Autonomie", }, …]` 
- `languages` *(existe déjà)* → format renforcé `[{ name, level: 1-5 }]`

**Expériences (anonymisées — sans nom d'entreprise)**

- `experiences` (jsonb) — `[{ role, sector, duration en année, description }, …]`

**Objectifs / recherche**

- `looking_for` (jsonb) — `{ contract_type, sector, ambitions }`

**Disponibilité**

- `availability_regime` (text) — temps plein / partiel / X jours/sem

**Privé Onbord (jamais exposé à l'entreprise)**

- `full_name` (existe), `email`, `phone`, `linkedin_url` (existent déjà)

La vue `proposed_profiles_public` est recréée pour exposer les nouveaux champs publics et continuer à masquer les coordonnées tant que `requests.status != 'Recrutement finalisé'`.

---

## 2. Formulaire admin enrichi (`AdminProfilesManager.tsx`)

Le modal d'édition passe d'un seul écran à un formulaire en sections (Accordion) :

1. **Identité (privée)** — nom complet, email, téléphone, LinkedIn → l'initiale du nom est calculée automatiquement à partir du nom de famille.
2. **Présentation publique** — prénom, bio (3–4 lignes), zone géographique
3. **Formation** — école, diplôme, année, domaine
4. **Hard skills** — éditeur dynamique : ajouter une compétence
5. **Soft skills** — éditeur dynamique 3–5 entrées : nom 
6. **Langues** — éditeur : nom + niveau /5
7. **Expériences** — éditeur dynamique : rôle, secteur, durée, description (PAS de nom d'entreprise)
8. **Ce qu'il cherche** — type de contrat, secteur, ambitions
9. **Disponibilité** — date de début, régime (temps plein / partiel / X jours)

Chaque section repliable. À l'enregistrement, `last_initial` est dérivé automatiquement (1ère lettre du nom de famille).

---

## 3. Vue liste — cartes enrichies (`ProposedProfilesSection.tsx`)

Chaque carte affiche :

- **En-tête** : "Prénom L." + badge **"Validé Onbord"** (vert) + statut (Intéressé / Pas intéressé)
- **École + année** + **domaine d'études**
- **Hard skills** sous forme de badges — celles qui matchent avec les `skills` de la `request` sont **en vert** (les autres en gris)
- **Disponibilité** (date + régime)
- **Localisation**
- **Actions** (si statut `pending` et demande non finalisée) :
  - **"Voir profil complet"** → ouvre le modal détaillé
  - ✅ **Intéressé**
  - ❌ **Pas le bon profil** → ouvre une petite popup pour saisir un commentaire (stocké dans `proposed_profiles.rejection_other`)

Si TOUS les profils passent en `rejected`, on continue à déclencher le modal "Pourquoi ?" existant (`RejectAllProfilesDialog`).

---

## 4. Modal "Profil complet" (nouveau composant `ProfileDetailDialog.tsx`)

Sections affichées (toujours anonymisées) :

- **Présentation** — Prénom L., bio, badge "Validé Onbord"
- **Formation** — école, diplôme, année, domaine
- **Hard skills** — liste avec niveau (Débutant / Intermédiaire / Avancé), matches en vert
- **Soft skills** — chaque soft skill avec son exemple
- **Langues** — avec barre de niveau /5
- **Expériences** — timeline (rôle • secteur • durée • description), sans nom d'entreprise
- **Objectifs** — type de contrat, secteur recherché, ambitions
- **Disponibilité** — date + régime + localisation

Footer du modal :

- Si profil `pending` et demande non finalisée → boutons ✅ **Intéressé** / ❌ **Pas le bon profil**
- Sinon → badge de statut

Les coordonnées (nom complet, email, téléphone, LinkedIn) ne s'affichent **jamais** dans ce modal tant que `requests.status != 'Recrutement finalisé'`.

---

## 5. Correctif RLS (bug vu dans les logs réseau)

Le PATCH côté entreprise vers `requests.status = "Profils en cours de sélection"` retourne **403** : la policy `Users can update own requests` n'autorise dans son `WITH CHECK` que `draft` et `Demande validée`.

Migration : élargir le `WITH CHECK` pour autoriser le client à transiter, sur ses propres demandes, vers les statuts déclenchés par ses propres actions :

- `Profils en cours de sélection` (rejet total)
- `Profils validés` (validation d'un profil)
- `Entretien en cours d'organisation` (créneaux envoyés)

Les transitions vers `Profils envoyés` et `Recrutement finalisé` restent réservées à l'admin (déjà couvert par `has_role(..., 'admin')`).

---

## Fichiers impactés

- **Migration SQL** : ajout des colonnes sur `proposed_profiles`, recréation de la vue `proposed_profiles_public` (avec `security_invoker=on`), correction de la policy `Users can update own requests`.
- `src/components/admin/AdminProfilesManager.tsx` — formulaire admin sectionné + éditeurs dynamiques (hard skills, soft skills, langues, expériences)
- `src/components/request/ProposedProfilesSection.tsx` — cartes enrichies + bouton "Voir profil complet" + popup commentaire de rejet
- `src/components/request/ProfileDetailDialog.tsx` *(nouveau)* — modal détaillé avec actions Intéressé / Pas intéressé

## Hors périmètre

- Upload de photo / CV PDF (peut être ajouté ensuite)
- Calcul automatique d'un score de matching global (on se contente de mettre en vert les hard skills qui matchent)