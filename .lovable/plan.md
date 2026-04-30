## Objectif

À la fin de l'entretien IA (8 questions atteintes ou message [FIN_ENTRETIEN]) :
- Côté **candidat** : message de remerciement, puis fermeture/redirection automatique après quelques secondes.
- Côté **client** : le score d'entretien et l'analyse "pourquoi ce score" apparaissent immédiatement dans la dialog Détails du candidat, sans rien à faire de plus.

## Changements

### 1. Page candidat `/interview/:token` — `src/pages/Interview.tsx`
- Quand `finished === true`, démarrer un timer de 5 secondes.
- Pendant le compte à rebours, afficher : "Merci ! Cette page va se fermer dans X secondes…"
- À la fin du timer : tenter `window.close()` (utile si ouvert dans un nouvel onglet) puis fallback redirect vers une page neutre `/interview-done` (ou simple écran statique de remerciement).
- Désactiver l'input dès `finished` (déjà le cas).

### 2. Création d'une mini page `/interview-done`
- Page publique très simple ("Merci, tu peux fermer cet onglet.") pour la redirection finale.
- Ajout de la route dans `src/App.tsx`.

### 3. Côté client — rafraîchissement temps réel
Dans `src/components/request/CandidatesSection.tsx` :
- Ajouter un abonnement Supabase Realtime sur la table `candidate_scores` filtré par les candidats de la requête en cours.
- À chaque update (notamment quand `score-interview` finit et écrit `interview_score`), rafraîchir la liste des candidats + scores.
- Effet visible : dès que l'IA scoring termine, le score d'entretien apparaît dans la ligne candidat ET dans la dialog Détails si elle est ouverte.

### 4. Dialog Détails — bloc dédié entretien
Toujours dans `CandidatesSection.tsx` (composant `CandidateDetailsDialog`) :
- Ajouter une section "Pourquoi ce score d'entretien" affichée dès que `interview_score` existe.
- Contenu : extraire de `ai_summary` la partie "Entretien:" (déjà concaténée par `score-interview`) et l'afficher en premier dans cette section, suivie du breakdown existant.
- Si pas encore d'entretien : afficher un état vide clair ("Entretien pas encore réalisé").
- Si entretien démarré mais pas terminé : afficher "Entretien en cours…" (statut session = `in_progress`).

### 5. Activer Realtime sur `candidate_scores`
Migration SQL : `ALTER PUBLICATION supabase_realtime ADD TABLE public.candidate_scores;` + `ALTER TABLE public.candidate_scores REPLICA IDENTITY FULL;`

## Hors scope (déjà clarifié)
- Pas d'enrichissement du breakdown entretien avec citations (le résumé global suffit).
- Pas de nouveau bouton "Analyser l'entretien" séparé : tout reste dans la dialog Détails existante.
- Le candidat ne voit pas son score (juste le merci + redirection).

## Détails techniques

**Realtime channel** :
```ts
supabase
  .channel(`scores-${requestId}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'candidate_scores' }, () => loadCandidates())
  .subscribe();
```

**Timer fin candidat** :
```ts
useEffect(() => {
  if (!finished) return;
  let s = 5;
  const id = setInterval(() => {
    s -= 1;
    setCountdown(s);
    if (s <= 0) {
      clearInterval(id);
      window.close();
      window.location.replace('/interview-done');
    }
  }, 1000);
  return () => clearInterval(id);
}, [finished]);
```
