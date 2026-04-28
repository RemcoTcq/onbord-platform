## Objectif

Permettre à une entreprise d'importer une offre d'emploi (fichier PDF/DOCX/TXT ou texte collé) pour pré-remplir automatiquement le formulaire de demande, **sans afficher le texte brut dans le champ de recherche IA**.

## Expérience utilisateur

Sur l'étape 1 « Recherche IA » (`StepNaturalLanguage`), ajouter un bloc discret au-dessus du textarea :

> **Vous avez déjà une offre d'emploi ?**
>
> [📎 Importer un fichier]   [📋 Coller le texte]

Deux modes :
1. **Fichier** : upload PDF / DOCX / TXT (max 5 Mo)
2. **Texte** : ouvre une petite modale avec un grand textarea pour coller l'offre, puis bouton « Analyser »

### Flux après import (le point clé)

Dès que le texte de l'offre est récupéré (qu'il vienne d'un fichier ou de la modale) :

1. Le texte n'est **PAS** mis dans le champ « Décrivez votre besoin » visible.
2. L'**overlay d'analyse plein écran** existant (celui déjà utilisé lors du clic sur « Analyser ») s'affiche immédiatement, sans checkmarks d'étapes (cf. règle déjà en place), avec un message du type « Analyse de votre offre en cours… ».
3. En arrière-plan, le pipeline IA actuel (`generate-talent-profile`) est appelé directement avec le texte de l'offre comme entrée.
4. Une fois la réponse reçue, on remplit `data` (titre, skills, soft skills, langues, localisation, diplôme, etc.) **et** on passe automatiquement à l'étape 2 (formulaire) déjà pré-rempli.
5. L'overlay se ferme à ce moment-là.

Le champ « Décrivez votre besoin » de l'étape 1 reste vide / inchangé pour l'utilisateur — l'offre importée n'y apparaît jamais.

En cas d'erreur (PDF scanné illisible, format non supporté, IA en échec) : overlay fermé, toast d'erreur clair, l'utilisateur reste sur l'étape 1.

## Périmètre

- Étape 1 uniquement (`StepNaturalLanguage`).
- Réutilisation totale du pipeline d'analyse IA (`generate-talent-profile`) et de l'overlay d'analyse existant.
- Pas de stockage du fichier source : extraction → injection mémoire → oubli.
- Pas de modification du schéma DB.

## Détails techniques

### Nouvelle edge function `import-job-offer`
Reçoit `{ fileName, fileType, fileBase64 }` et renvoie `{ text: string }`.

- `text/plain` → décodage base64 direct
- `application/pdf` → extraction texte via `unpdf` (compatible Deno)
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX) → unzip via `jszip` + extraction des `<w:t>` de `word/document.xml`

Limites :
- 5 Mo max (vérifié client + serveur)
- 50 000 caractères max en sortie (tronqué)
- Auth JWT requis (même pattern que `generate-talent-profile`)
- Validation Zod, messages clairs si format non supporté ou PDF scanné (texte vide)

Le mode « coller le texte » ne passe **pas** par cette fonction : le texte saisi part directement vers `generate-talent-profile`.

### Composant frontend `JobOfferImporter.tsx`
Nouveau sous-composant à côté de `StepNaturalLanguage.tsx` :
- 2 boutons : « Importer un fichier » (déclenche `<input type="file" hidden>`) et « Coller le texte » (ouvre un `Dialog` avec textarea + bouton « Analyser »).
- Validation client : `.pdf,.docx,.txt`, taille ≤ 5 Mo.
- Expose `onAnalyzed(extractedText: string)` au parent.

### Intégration dans `StepNaturalLanguage`
- Ajouter le bloc `<JobOfferImporter />` au-dessus du textarea, visuellement séparé (petit fond / bordure).
- Nouvelle fonction interne `runImportFlow(text: string)` :
  1. Active l'overlay d'analyse existant (le state qui pilote déjà l'overlay sans checkmarks).
  2. Appelle `generate-talent-profile` avec `text` comme requête.
  3. Mappe la réponse dans `onChange({...})` exactement comme le fait déjà l'analyse manuelle (titre, skills, soft skills, langues, localisation, diplôme, talentType, etc.). **Important : `naturalLanguageQuery` n'est PAS mis à jour** — le champ visible reste vide.
  4. Sur succès : `onNext()` (passage à l'étape 2 pré-remplie).
  5. Sur erreur : ferme l'overlay, toast d'erreur.

### Limites à communiquer à l'utilisateur
- PDF scannés non lisibles → message dédié invitant à coller le texte.
- Ancien `.doc` (Word 97-2003) non supporté → demander PDF ou DOCX.

## Fichiers impactés

- `supabase/functions/import-job-offer/index.ts` (nouveau)
- `src/components/request/JobOfferImporter.tsx` (nouveau)
- `src/components/request/StepNaturalLanguage.tsx` (intégration + flux d'import silencieux)

Aucune migration DB, aucun secret supplémentaire (Lovable AI est déjà configuré pour `generate-talent-profile`).
