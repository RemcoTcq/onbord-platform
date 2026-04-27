# Workflow recrutement avancé — Profils, entretiens, notifications

Ajout du cycle de vie complet post-validation : l'admin propose des profils anonymisés, l'entreprise valide ou rejette, organise un entretien, et l'admin reçoit des notifications en temps réel. La confidentialité des talents est garantie jusqu'au recrutement finalisé.

## 1. Modèle de données (nouvelles tables)

### `proposed_profiles` — profils proposés par l'admin

**Aucune donnée de contact visible côté entreprise** avant `Recrutement finalisé`.

Colonnes :

- `id`, `request_id`, `created_at`, `updated_at`
- **Publiques** : `alias` ("Talent #1"), `headline`, `summary` (présentation anonyme), `experience_years`, `skills` text[], `languages` jsonb, `availability`, `location_area` (zone large, ex "Bruxelles")
- **Privées (admin only)** : `full_name`, `email`, `phone`, `linkedin_url`
- `status` : `pending` | `accepted` | `rejected`
- `rejection_reasons` text[], `rejection_other` text

**Sécurité** : vue SQL `proposed_profiles_public` qui n'expose JAMAIS les colonnes privées tant que `request.status != 'Recrutement finalisé'`. Le front interroge la vue, pas la table directement. RLS sur la table : admin full access, entreprise SELECT via la vue uniquement, UPDATE limité au `status` sur ses propres profils.

### `interview_requests` — créneaux proposés

- `id`, `proposed_profile_id`, `request_id`
- `mode` : `video` | `onsite`
- `proposed_slots` jsonb (array `{ date, period: 'morning'|'afternoon' }`, 2-3 max)
- `confirmed_slot` jsonb (rempli par admin)
- `status` : `pending_admin` | `confirmed` | `cancelled`

### `admin_notifications` — fil d'événements admin

- `type` : `profiles_rejected` | `profile_accepted` | `interview_slots_proposed`
- `request_id`, `payload` jsonb, `read` bool, `created_at`
- RLS : admin uniquement
- Realtime activé pour notifications instantanées

### Statuts de demande étendus

Mise à jour de `STATUSES` et de `validate_request_status()` :

- `Demande validée`
- `Profils en cours de sélection` (après rejet total)
- `Profils envoyés` (admin a poussé des profils)
- `Profils validés`
- `Entretien en cours d'organisation`
- `Recrutement finalisé`

## 2. Côté entreprise — `RequestDetail.tsx`

Nouvelle section **"Profils proposés"** (visible si la demande a des profils) :

- Cards anonymes avec alias, headline, summary, skills, langues, dispo, zone
- Boutons ✅ Intéressé / ❌ Pas intéressé par profil

### Rejet total (tous les profils ❌)

Dialog obligatoire avec checkboxes :

- Niveau de diplôme trop faible
- Hard skills insuffisants
- Soft skills ne correspondent pas
- Localisation ou disponibilité inadaptée
- Autre (textarea obligatoire)

Au submit : statut → `Profils en cours de sélection`, notification admin créée, message affiché *"Pas de problème ! Nous analysons votre retour et revenons vers vous avec de nouveaux profils sous 48h."*

### Acceptation (au moins un profil ✅)

1. Statut → `Profils validés`
2. Notification admin
3. Modal **"Organisation entretien"** s'ouvre automatiquement :
  - Choix : 📹 Appel vidéo / 🏢 Sur place
  - DatePicker Shadcn pour 2-3 créneaux (date + matin/après-midi)
4. Au submit : `interview_requests` créé, statut → `Entretien en cours d'organisation`, notification admin
5. Affichage : *"Entretien en cours d'organisation — Onbord revient vers vous sous 24h avec un créneau confirmé."*

### Confidentialité

- Front : ne JAMAIS afficher nom/email/tel/LinkedIn tant que `status != 'Recrutement finalisé'`
- DB : la vue publique ne retourne pas ces champs
- Une fois finalisé : section "Coordonnées du talent" révélée sur le profil accepté

## 3. Côté admin

### Sur `RequestDetail` en mode admin

**Bloc "Gestion profils"** :

- Liste des profils avec données complètes
- Bouton "+ Ajouter un profil" → formulaire complet
- Edit / Delete par profil
- Affichage des feedbacks de rejet

**Bloc "Entretiens"** :

- Liste des `interview_requests` avec créneaux proposés
- Bouton "Confirmer ce créneau" → met à jour le statut
- Bouton "Envoyer les invitations" (placeholder — pas d'email pour l'instant)

### Page Admin (`/admin`)

- Cloche de notifications dans le header avec badge (count des non-lues)
- Dropdown listant les notifications récentes → lien vers la demande
- Realtime via Supabase channel sur `admin_notifications`

## 4. Fichiers impactés

**Nouveaux** :

- Migration SQL : tables + vue + RLS + realtime
- `src/components/request/ProposedProfilesSection.tsx`
- `src/components/request/RejectAllProfilesDialog.tsx`
- `src/components/request/OrganizeInterviewDialog.tsx`
- `src/components/admin/AdminProfilesManager.tsx`
- `src/components/admin/AdminInterviewsPanel.tsx`
- `src/components/admin/AdminNotificationsBell.tsx`
- `src/hooks/useAdminNotifications.ts`

**Modifiés** :

- `src/lib/constants.ts` (nouveaux statuts)
- `src/pages/RequestDetail.tsx` (intégration sections + reveal contact)
- `src/pages/Admin.tsx` / `src/components/AppLayout.tsx` (cloche notifications)

## 5. Hors-scope (à confirmer plus tard)

- **Envoi d'emails réels** aux talents/entreprises pour les invitations : non couvert ici (nécessite setup email infra). Pour l'instant : notifications in-app + bouton placeholder côté admin.
  &nbsp;