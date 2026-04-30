
# Onbord V1 — Pipeline candidats automatisé

## Objectif

Ajouter un pipeline complet "candidats → scoring CV → entretien IA → shortlist" sur chaque demande, sans toucher au flow existant (`proposed_profiles` / Onbord source). Tout est configurable par le recruteur.

## Principes directeurs

1. **Zéro régression** : on AJOUTE des tables et des sections UI. On ne modifie pas `requests`, `proposed_profiles`, `interview_requests`.
2. **Deux flows en parallèle sur chaque demande** : "Onbord source" (existant, intact) + "Mes candidats" (nouveau). Le recruteur choisit l'un, l'autre, ou les deux.
3. **Tout configurable côté recruteur** : pondération scoring, questions d'entretien, seuils de flag, critères CV.
4. **Sécurité par défaut** : RLS sur toutes les nouvelles tables, signed URLs pour les CV, tokens uniques pour l'entretien public.

---

## Architecture des données (4 nouvelles tables + 1 bucket)

### `candidates`
Un candidat importé sur une demande.
- `request_id`, `first_name`, `last_name`, `email`, `phone`, `linkedin_url`
- `cv_storage_path` (chemin dans le bucket)
- `cv_text` (texte extrait, brut)
- `source` : `csv_import` | `manual` | `interview_link`
- `status` : `imported` | `cv_parsed` | `cv_scored` | `interview_invited` | `interview_in_progress` | `interview_done` | `shortlisted` | `rejected`

### `request_scoring_config`
Config de scoring **par demande** (créée auto avec valeurs par défaut héritées du compte).
- `cv_weight` (0.6) / `interview_weight` (0.4)
- `green_threshold` (80) / `yellow_threshold` (60)
- `cv_criteria` (jsonb : poids hard skills, soft skills, expérience, diplôme, langues)
- `interview_questions` (jsonb : liste ordonnée, ou null = IA génère)
- `interview_max_turns` (8 par défaut)

### `candidate_scores`
- `candidate_id`
- `cv_score` (0-100), `cv_breakdown` (jsonb détaillé par critère)
- `interview_score` (0-100), `interview_breakdown` (jsonb : motivation, fit, communication, soft skills)
- `global_score` (calculé)
- `flag` : `green` | `yellow` | `red`
- `ai_summary` (texte court pour la liste)
- `ai_strengths` (array), `ai_concerns` (array)

### `interview_sessions` + `interview_messages`
- `interview_sessions` : `candidate_id`, `token` (unique), `status`, `started_at`, `completed_at`, `expires_at`
- `interview_messages` : `session_id`, `role` (`assistant`|`candidate`), `content`, `created_at`

### Bucket Storage `cvs`
- Privé, accessible uniquement via signed URL.
- Path : `{request_id}/{candidate_id}/{filename}`.

---

## Flow utilisateur (recruteur)

```text
Demande validée
   │
   ├──► [Existant] Onbord source ──► proposed_profiles ──► interview_requests
   │
   └──► [NOUVEAU] Onglet "Mes candidats"
            │
            ├─► Bouton "Configurer le scoring" (modal : pondération, seuils, critères, questions)
            ├─► Bouton "Importer CV" (CSV + upload PDFs en batch)
            │       │
            │       └─► Edge function: parse-cv (texte + OCR si scanné)
            │               │
            │               └─► Edge function: score-cv (Claude/Gemini)
            │
            ├─► Liste triée par global_score, filtres par flag
            │       │
            │       ├─► Détail candidat : CV, scores détaillés, transcript entretien
            │       └─► Bouton "Inviter à l'entretien IA" (génère token + envoie email Resend)
            │
            └─► Page publique /interview/{token} (chat, 5-10 tours)
                    │
                    └─► Edge function: score-interview (à la fin) + recalcul global_score
```

## OCR pour CV scannés (réponse à ta Q3)

Trois cas à gérer dans `parse-cv` :

1. **PDF texte natif** (le plus courant) : `unpdf` extrait le texte directement. Gratuit, instantané.
2. **PDF scanné / image** (CV photographiés, vieux scans) : on détecte l'absence de texte exploitable (< 50 caractères extraits) → on bascule sur OCR.
3. **DOCX** : `mammoth` ou `jszip` (déjà dans le projet pour l'import d'offre).

**Pour l'OCR**, deux options selon coût/qualité :

| Option | Coût | Qualité | Implémentation |
|---|---|---|---|
| **Gemini 2.5 Flash (vision)** via Lovable AI | ~gratuit (inclus) | Excellente | On envoie chaque page du PDF en image au modèle, prompt "extrais tout le texte de ce CV" |
| **Tesseract.js** | Gratuit | Moyenne (mauvais sur manuscrit/qualité basse) | Tourne dans l'edge function, plus lent |

**Recommandation V1** : **Gemini 2.5 Flash via Lovable AI**. Pas de clé externe, qualité top, gère même les CV en photo. On convertit le PDF en images (1 par page) avec `pdf-lib` + canvas, on envoie au modèle, on récupère le texte.

## Choix du modèle IA (réponse à ta Q2)

**Recommandation : on garde Lovable AI Gateway (Gemini + GPT-5)**, PAS Claude direct, pour ces raisons :

- ✅ **Pas de clé Anthropic à gérer** : Lovable AI est déjà branché, zéro config, zéro facturation séparée.
- ✅ **Couvre 100% des besoins** : Gemini 2.5 Pro est au niveau de Claude Sonnet 4 sur scoring/résumé/entretien structuré.
- ✅ **Vision native** (Gemini Flash) → indispensable pour l'OCR des CV scannés. Claude le fait aussi mais via API séparée.
- ✅ **Quota offert** chaque mois, puis pay-as-you-go.

**Si tu veux quand même Claude plus tard** : on ajoute juste un secret `ANTHROPIC_API_KEY` et un switch dans `request_scoring_config.ai_provider`. Architecture déjà prévue pour. Mais pour la V1 : Lovable AI suffit.

**Répartition par tâche :**
- `parse-cv` (OCR) → `google/gemini-2.5-flash` (rapide + vision)
- `score-cv` (analyse structurée) → `google/gemini-2.5-pro` (raisonnement)
- `interview-chat` (conversation temps réel) → `google/gemini-2.5-flash` (latence faible)
- `score-interview` (synthèse finale) → `google/gemini-2.5-pro`

## Configurabilité recruteur (réponse à ta Q4 + tes choix)

Page **"Paramètres de scoring"** accessible depuis chaque demande, persiste dans `request_scoring_config` :

1. **Pondération CV / Entretien** : 2 sliders liés (somme = 100%). Défaut 60/40.
2. **Seuils de flag** : 2 inputs (vert ≥ X, orange ≥ Y, rouge < Y). Défaut 80 / 60.
3. **Critères CV** : pour chaque critère (hard skills must, hard skills nice, soft skills, expérience années, diplôme, langues) → un poids 0-100. Le recruteur peut mettre 0 pour ignorer.
4. **Questions d'entretien** : mode "IA génère automatiquement" (défaut, basé sur le poste) **OU** mode "questions personnalisées" (le recruteur saisit 3-10 questions ouvertes que l'IA pose dans l'ordre + relances).

Tout est éditable à tout moment. Modifier la config relance le scoring sur les candidats existants (bouton "Recalculer").

## Entretien IA (chat texte uniquement)

- Page publique `/interview/:token` (route hors auth).
- Composant chat React (déjà la base avec Sonner/shadcn).
- Edge function `interview-chat` :
  - Charge la demande, le CV du candidat, la config (questions du recruteur OU prompt système qui les fait générer).
  - Streaming SSE Gemini Flash.
  - Sauvegarde chaque message dans `interview_messages`.
  - Détecte la fin (max_turns atteint OU IA juge avoir tout couvert) → marque `completed_at`, déclenche `score-interview`.
- Pas de cheat possible : questions ouvertes orientées découverte (motivation, fit culturel, soft skills, exemples concrets), notées sur la cohérence + la profondeur, pas sur des réponses "correctes".

## Emails (Resend, choix confirmé)

- Connecteur Resend via `standard_connectors--connect`.
- 2 templates transactionnels :
  - `interview-invitation` (lien magique vers `/interview/:token`)
  - `interview-completed` (notif au recruteur)
- Edge function `send-candidate-email` qui wrappe Resend.

---

## Plan de build étape par étape

| # | Étape | Livrable | Risque |
|---|---|---|---|
| 1 | **Migration BDD** : 4 tables + bucket `cvs` + RLS + trigger défaut config | Schéma prêt | Faible |
| 2 | **Page config scoring** (`/request/:id/scoring-settings`) | Recruteur peut tout régler | Faible |
| 3 | **Onglet "Mes candidats"** sur `RequestDetail` (vide pour l'instant) + tabs pour cohabiter avec section Onbord existante | UI en place, rien ne casse | Faible |
| 4 | **Import CSV + upload CV en batch** (mapper colonnes → champs `candidates`) | Données brutes en BDD + fichiers dans bucket | Moyen (UX du mapper) |
| 5 | **Edge function `parse-cv`** (texte + OCR Gemini Vision pour scannés) | `cv_text` rempli pour chaque candidat | Moyen (OCR) |
| 6 | **Edge function `score-cv`** (Gemini 2.5 Pro, applique les poids de la config) | `candidate_scores` avec cv_score + flag | Moyen (qualité prompt) |
| 7 | **Liste candidats** : tri par score, filtres par flag, détail candidat avec CV viewer + breakdown | Recruteur exploite déjà la donnée | Faible |
| 8 | **Connecteur Resend** + edge function `send-candidate-email` + template invitation | Email envoyé avec lien token | Faible |
| 9 | **Page publique `/interview/:token`** + edge function `interview-chat` (streaming) | Candidat fait l'entretien | Moyen (UX chat + détection fin) |
| 10 | **Edge function `score-interview`** + recalcul global_score | Pipeline complet bout en bout | Moyen |
| 11 | **Bouton "Recalculer"** quand la config change | Itération recruteur fluide | Faible |
| 12 | **Polish** : notifications admin sur events clés, loading states, empty states, gestion erreurs OCR | V1 propre | Faible |

Chaque étape est testable indépendamment. On peut s'arrêter après l'étape 7 et avoir déjà une grosse valeur (import + scoring CV) si tu veux livrer plus vite.

---

## Risques techniques honnêtes

1. **OCR sur CV très dégradés** (photo floue, manuscrit) → Gemini Vision est bon mais pas magique. On ajoutera un fallback "extraction manuelle" si confiance < 50%.
2. **Coût IA à l'échelle** : si un recruteur importe 500 CV d'un coup, ça consomme. Il faut prévoir une file d'attente (Supabase pgmq ou simple `processing_status` + cron) plutôt que tout traiter d'un coup. **Inclus dans étape 5**.
3. **Hallucinations sur scoring** : Gemini peut inventer une compétence qu'il n'a pas vue. **Mitigation** : on lui demande de citer le passage du CV qui justifie chaque score (chain of thought + références). C'est traçable dans `cv_breakdown`.
4. **Entretien IA qui dérape** : un candidat peut essayer de jailbreak l'IA. **Mitigation** : prompt système strict + détection de hors-sujet + limite de tours dure.
5. **PDF complexes** (multi-colonnes, tableaux) → `unpdf` peut mélanger l'ordre du texte. Pour la V1 c'est acceptable, le scoring s'en sort. V2 : passage systématique en vision si layout détecté complexe.
6. **Ce que je ne peux pas faire pour toi** : créer le compte Resend (tu le fais en 2 min), valider un domaine d'envoi (DNS chez ton registrar), et signer juridiquement le RGPD pour les CV stockés (à toi de mettre le mention sur ton site).

---

## Pourquoi Supabase (= Lovable Cloud) reste le bon choix

- Tu l'as déjà, tout ton schéma existant tourne dessus.
- Storage privé + signed URLs natifs → parfait pour les CV.
- Edge functions Deno → idéal pour les jobs IA + parsing.
- Realtime → on pourra streamer le scoring en temps réel dans la liste.
- RLS robuste → les recruteurs ne voient JAMAIS les candidats des autres.
- Tu accèdes à la BDD en temps réel via le bouton "View Backend" (déjà répondu plus haut).

Pas besoin d'aller voir ailleurs. Si un jour tu veux migrer vers un Postgres dédié, le code edge functions est portable.

---

## Ce qui sera livré à la fin de la V1

- 1 onglet "Mes candidats" sur chaque demande, à côté de l'onglet "Onbord source" (les deux cohabitent).
- 1 page de config scoring entièrement éditable.
- Import CSV + CV (PDF/DOCX, scannés inclus via OCR).
- Scoring CV automatique avec breakdown justifié.
- Invitation entretien par email (Resend) avec lien magique.
- Entretien IA chat (5-10 tours, questions custom ou auto).
- Scoring entretien + score global + flag couleur.
- Liste triée, filtrable, détail candidat complet.
- Recalcul à la demande quand la config change.
- 0 régression sur le flow Onbord existant.

Quand tu valides ce plan, je commence par l'étape 1 (migration BDD) et on avance pas à pas.
