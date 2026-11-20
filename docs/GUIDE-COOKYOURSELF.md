# CookYourself : guide complet du projet

> Ce document s'adresse à l'assistant IA (Claude) qui travaille sur CookYourself, et aux deux développeurs.
> Il décrit l'état du projet au 21 novembre 2026 (version en ligne **v45**) : ce qui existait, ce qui a été ajouté, comment le code est organisé, et la méthode de travail à suivre.
> À lire en entier avant toute modification.

---

## 1. Le produit en bref

**CookYourself** est une appli mobile (PWA, installable sur iPhone, Android et PC) qui réunit nutrition, sport, hydratation et sommeil.

Elle sert à deux moments :

- **Dehors, au quotidien** : noter l'eau bue, le sommeil, les repas et le poids, en un geste.
- **À la salle, à la maison ou en callisthénie** : suivre ses exercices (séries, répétitions, charge), avec un chrono de repos automatique entre les séries.

Elle donne ensuite :

- des **graphiques jour par jour** qui croisent le sommeil, l'eau, les calories, le poids et les charges soulevées ;
- des **conseils de coach** calculés sur les données de l'utilisateur. Exemple : « tes perfs baissent de 13 % ; cette semaine tu dors 1 h de moins et tu bois 36 % d'eau en moins » ;
- des **repas** et des **séances** adaptés à l'**objectif** choisi : perf, muscle, perdre du poids ou sécher.

**Adresses**

- Site et page de présentation : https://cookyourself.fitness
- Appli : https://cookyourself.fitness/app/
- Dépôt : https://github.com/gothier83-art/cookyourself (branche `main` = production)
- Copie GitHub Pages (secondaire) : https://gothier83-art.github.io/cookyourself/

**Phase actuelle :** gratuite pour tout le monde (`phase: 'design_partners'` dans `config.js`). Il n'y a pas de parrainage (retiré), pas de pub, et un **compte est obligatoire**.

---

## 2. Historique : qui a fait quoi

### 2.1 Ce qui existait déjà (travail de gothier83-art)

**Version v18, sur GitHub, du 19 au 20 novembre :**

- PWA en HTML et JS sans outil de build, en orange et crème, avec 4 onglets : Aujourd'hui, Manger, Bouger, Progrès.
- Eau en litres (verre, bouteille, quantité libre) et rappels d'eau à heure fixe.
- Repas, avec la base **Ciqual 2025** (ANSES) intégrée (`ciqual.js`), le scan de code-barres via **Open Food Facts** et des repères avec la main.
- **58 recettes** (`recettes.js`, `recettes-proteines.js`) : étapes détaillées, filtres (protéiné, rapide, végé, batch, sans porc, sans lactose, sans gluten), calories et protéines calculées avec Ciqual.
- Objectif calories selon Mifflin-St Jeor × activité du travail, courbe de poids.
- Sport : programmes débutants A et B (maison avec haltères, callisthénie, salle), fiches d'exercices, séries, tempo 3-1-1 avec bips, estimation du 1RM.
- Gamification : série de jours avec joker, défi du jour, niveaux, badges, objectif de séances par semaine.
- Premier lancement, export et import des données, page « Sources et méthode ».

**Version v41, en ligne sur cookyourself.fitness mais absente de GitHub :**

- **Comptes Supabase** (serveur en Europe) dans `compte.js` :
  - inscription par e-mail et mot de passe, avec confirmation par e-mail ;
  - mot de passe oublié, suppression du compte (RPC `supprimer_mon_compte`) ;
  - synchronisation automatique (table `etat_appli`), retours des utilisateurs (table `retours`), plans (table `abonnements`) ;
  - fusion des données élément par élément, avec des « pierres tombales » (`db.supp`) pour que les éléments supprimés ne reviennent pas.
- `droits.js` : droits d'accès par phase, prêt pour une future offre payante, CookYourself+.
- `config.js` : URL Supabase, clé anon (publique, la sécurité vient des règles RLS) et empreinte SRI de supabase-js 2.45.4.
- Polices hébergées sur le site (Fredoka, Inter), page de confidentialité, page de présentation.
- Exercices personnels (`db.exosPerso`), bouton « ↻ Comme la dernière fois », annulation d'une série, pas de ±2,5 kg et ±1.
- Carte sommeil sur l'accueil (curseur et qualité), protéines par repas (`repas[].p`), coach hebdomadaire simple (`pCoach`).
- Nettoyage des données au chargement : `nettoie()` dans `index.html`. **Voir la section 6, c'est critique.**

### 2.2 Ce qui a été ajouté par Claude (session de Raphaël, du 20 au 21 novembre)

| PR | Contenu |
|---|---|
| #1 | Coach : objectifs, sommeil, routines par muscle, machines, chrono de repos, bilan jour par jour, conseils, repas selon l'objectif (sur la base v18). |
| #2 | **Fusion** : la v41 est récupérée depuis le site en ligne (le code n'était pas sur GitHub), le coach est fusionné dedans, et `construire.sh` est créé pour Cloudflare Pages. |
| #3 | Correctif : « Créer un compte » est rendu visible (on ne le trouvait pas sur PC). |
| #4 | Design **Atelier**, **connexion obligatoire**, **premier lancement express**, fonctionnalités en plus et corrections QA (dont la perte de données au rechargement). |

**En détail :**

1. **Objectifs.** Un même objectif règle les calories, les protéines, les séries, les répétitions et les temps de repos (voir la section 7).
2. **Bouger.**
   - Trois modes : programme débutant, **routine par muscle** (jambes, pecs, dos, épaules, bras, abdos, corps entier), et **« Mes machines »** pour la salle (nom, muscle, avec ou sans charge).
   - Une bibliothèque d'environ 30 exercices de plus, avec leurs fiches.
   - Les objectifs de répétitions s'adaptent au but. En « perf », les charges lourdes ne s'appliquent qu'aux gros mouvements.
3. **Réglage de séance.** Au début (une fois par jour), l'appli demande le nombre de séries et le repos, **identique ou différent après chaque série**.
4. **Chrono de repos.**
   - Il part automatiquement après chaque série : feuille sombre, anneau qui se vide, boutons −15 s, +15 s et Passer.
   - Il affiche « Prochaine : 60 kg × 10 » et enchaîne vers l'exercice suivant.
   - Il bipe, vibre et envoie une notification si l'appli est en arrière-plan.
   - L'écran reste allumé (Wake Lock) pendant la séance, et se relâche à la fin ou après 30 min sans série.
5. **Ressenti par série** (facile, dur, à fond) et **charge conseillée**, calculée d'après la dernière séance et ce ressenti.
6. **Records personnels** en direct (bandeau et vibration) et carte « Mes records ».
7. **Progrès.**
   - Graphique **jour par jour aligné** sur 7, 14 ou 30 jours : sommeil, eau, calories, poids avec sa moyenne sur 7 jours, et charges soulevées (le poids du corps est compté en callisthénie).
   - Évolution par exercice.
   - **Conseils du coach**, reliant les perfs au sommeil, à l'eau, aux calories et à la tendance du poids.
   - **Bilan du dimanche** : séries par muscle, sommeil moyen, jours où les protéines ont été tenues, une priorité. Le lundi, il montre la semaine passée.
8. **Accueil.**
   - Anneaux concentriques : eau, nutrition, effort. Toucher l'anneau ajoute 25 cl.
   - Puces sommeil et **score de forme du matin** (0 à 100 : pousse, normal ou allège).
   - Carte « À faire » noire, raccourcis (+25 cl, +50 cl, + Repas, + Poids), coach en carrousel.
   - Barre « **Profil rempli à X %** » à partir de la 2e ouverture de l'appli.
9. **Manger.** Trois recettes adaptées à l'objectif, avec « % de ton repas », et une **liste de courses** (ingrédients regroupés par rayon, cases à cocher, partage).
10. **Rappels d'eau intelligents** (option) : ils ne sonnent que si on est en retard sur son rythme.
11. **Connexion obligatoire.** Un écran plein écran est affiché tant qu'on n'est pas connecté. Une session déjà ouverte suffit, même hors ligne.
12. **Premier lancement express**, après la connexion, une question par écran :
    1. prénom ;
    2. objectif (avec confirmation pour « Sécher ») ;
    3. lieu ;
    4. sexe ;
    5. âge, taille et poids (règles graduées à glisser) ;
    6. travail ;
    7. eau par jour ;
    8. **« Ton plan »**.
13. **Retirés :** le parrainage, la tranche d'âge (l'âge s'écrit désormais), et la demande d'avis à la connexion. L'avis est replié et n'apparaît qu'après 3 jours d'utilisation.
14. **Design « Atelier »** (voir la section 8).

---

## 3. Fichiers

```
index.html              L'appli : HTML, CSS de base et l'essentiel du JS (modules dans des IIFE successives)
atelier.css             Design Atelier (chargé APRÈS le style intégré : couleurs, polices, composants, premier lancement)
entrainement.js         Objectifs (CYobj), bibliothèque d'exercices, routines, machines, réglage de séance, chrono, ressenti, charge conseillée
bilan.js                Puce sommeil, carte objectif, conseils du coach, graphique jour par jour, évolution, repas selon l'objectif
atelier.js              Accueil (série, eau, protéines), score de forme, records, bilan du dimanche, rappels intelligents, courses, profil %
compte.js               Comptes Supabase, synchronisation, écran de connexion obligatoire (CYporte)
droits.js               Droits par phase / offre
config.js               Supabase (URL, clé anon, SRI), phase, version
ciqual.js               Base Ciqual 2025 (~260 Ko)
recettes.js, recettes-proteines.js   58 recettes
sw.js                   Service worker (cache hors ligne : liste FICHIERS + nom CACHE)
manifest.webmanifest, icon*, apple-touch-icon.png, fonts/   Icônes et polices (Inter, Inter Tight, Space Grotesk, Fredoka)
confidentialite.html    Politique de confidentialité (contient un champ éditeur à compléter : voir la section 11)
site/accueil.html       Page de présentation (servie à la racine du site)
construire.sh           Construit dist/ pour Cloudflare Pages (accueil à /, appli à /app/)
docs/                   Ce guide
```

Ordre de chargement des scripts en bas d'`index.html` :

1. `ciqual.js` et les recettes ;
2. les modules intégrés : base `UnGeste`, Manger, Sport, Recettes, Suivi, Gamification, accueil vivant et premier lancement ;
3. `compte.js` ;
4. le script du bouton Compte de l'en-tête ;
5. `entrainement.js`, `bilan.js`, `atelier.js` ;
6. l'enregistrement du service worker.

---

## 4. Données (localStorage `ungeste.v1`)

Tout est dans **un seul objet JSON**, accessible par `window.UnGeste.db()`. On le sauvegarde avec `UnGeste.save()`, ce qui déclenche aussi le rendu et la synchronisation.

```js
{
  jours: { "AAAA-MM-JJ": {
      ml, eau, prises:[ml...],            // eau (ml ; « eau » = ancien compte en verres)
      repas:[{nom,kcal,p,g,l,src,t}],      // p/g/l = protéines/glucides/lipides (g)
      seances:[{exo,min,met,kcal,t}],      // séances terminées
      series:[{exo,kg,rep,t,rpe?,fin?}],   // exo = clé d'exercice ; rpe 1-3 ; fin = déjà comptée dans une séance
      sommeil:{h,q},                       // heures (par 0,25) ; q 1 agitée / 2 correct / 3 bien
      debut, maj } },
  reglages: { poids, base(3.5 ou 2.7 si 60 ans et +), eau, eauMl, cache(cacher les kcal) },
  profil: { prenom, sexe:'h'|'f', age, taille, metier:'1.4'…'2.1', metierChoisi, but:'0'|'300'|'-400'|'-300' },
  onb: 'perf'|'muscle'|'perdre'|'secher'|'passe',   // premier lancement fait + objectif
  poidsLog:[{d,kg}], favoris:[…], exosPerso:[…], machines:[{id,nom,groupe,charge,archive}],
  seanceCfg:{series,repos,meme,liste:[s…],jour}, courses:{recettes:[{id,p}], 'cochés':{ingrédient:1}},
  rappels:{on,malin,heures:['HH:MM']}, gam:{defis,vus,objSemaine}, supp:{…}, compteId, maj
}
```

Autres clés de localStorage :

- `cy.lieu`, `cy.mode`, `cy.groupe` et `ungeste.prog` : préférences de l'écran Bouger ;
- `cy.per` et `cy.exoSel` : préférences de Progrès ;
- `cy.ouvertures` : nombre d'ouvertures de l'appli ;
- `sb-…-auth-token` : la session Supabase.

**Clés d'exercice :**

- programme de base : `squat`, `pompes`… ;
- bibliothèque du coach : `x_…` ;
- machines : `m_<id>` ;
- exercices personnels : `perso<chiffres>`.

---

## 5. Modules et points d'entrée globaux (`window.*`)

| Global | Rôle |
|---|---|
| `UnGeste` | `db()`, `save()`, `jour()`, `cle()`, `ajouterRepas`, `ajouterSeance`, `remplacer` (utilisé par la synchro) |
| `CYvivant()` | Rendu de l'accueil et des cartes. **C'est une chaîne** : `entrainement.js`, `bilan.js` et `atelier.js` l'enveloppent chacun (`var av=window.CYvivant; window.CYvivant=function(){av(); …}`). Elle est rappelée après chaque `save()`. |
| `CYsport` | Exercices : `exo(k)`, `ajouter`, `liste`, `custom({court,titre,k})`, `lieu`, `courant`, `cles`, `surOuvrir(f)`, `surSerie(f)`, `rendre` |
| `CYobj` | Objectifs : `GOAL`, `but()` (renvoie `perf`, `masse`, `poids` ou `graisse`), `choisi()`, `choisir(k)`, `groupe(exo)` |
| `CYchrono` | `series()`, `arreter()` (fin de séance) |
| `CYbilan` | `protJour`, `perf`, `conseils`, `volume`, `hm`, `jours`, `dk`, `v`, `nomExo` |
| `CYkcal()` | Objectif calories du jour (avec les garde-fous) |
| `CYrecettes.valeurs(r)` | kcal et protéines d'une portion |
| `CYcompte` | `actif`, `connecte`, `inscrire`, `connecter`, `oubli`, `fusion` |
| `CYporte.ouverte()` | L'écran de connexion obligatoire est-il affiché ? |
| `CYgamInfo()` | Série de jours ; `CYgam()` fait le rendu de la gamification |
| `CYenRetard()` | Rappels intelligents : en retard sur l'eau à cette heure-ci ? |
| `CYprofilPct()` | `{pct, manque[]}` |
| `CY_CONFIG`, `CYdroits` | Configuration et droits |

---

## 6. ⚠️ Règles critiques (lire avant de coder)

1. **`nettoie()` dans `index.html`** recopie les données **champ par champ** au chargement. **Tout nouveau champ doit y être ajouté, sinon il disparaît au rechargement.** Ce bug a déjà fait perdre les machines, le réglage de séance, le ressenti, la liste de courses et le prénom. La même fonction supprimait le `_` dans les clés d'exercice. Pour toute nouvelle donnée :
   1. l'ajouter dans `nettoie()` ;
   2. vérifier la fusion dans `compte.js` (`fusion()`) si elle doit se synchroniser entre appareils ;
   3. tester un rechargement.
2. **Un identifiant (`id`) = un seul élément.** Un doublon (`#jSommeil` l'a été) donne des cartes vides.
3. **`.hide`** vaut `display:none !important` dans `atelier.css`. Préférer `hidden` ou `.hide` à des styles en ligne `display:flex`, qui l'écrasent.
4. **Anneaux SVG** : les cercles utilisent `pathLength="194.8"`. Le code fixe `stroke-dashoffset` sur cette base, quel que soit le rayon.
5. **Cache hors ligne** : à chaque mise en ligne, incrémenter `CACHE` dans `sw.js` et `version` dans `config.js` (actuellement **v45**). Tout nouveau fichier va dans `FICHIERS` (`sw.js`) **et** dans `construire.sh`.
6. **La chaîne `CYvivant`** peut être appelée souvent. Pas de travail lourd dedans. Ne jamais déclencher `CYvivant` dans une fonction elle-même appelée par `CYvivant` : risque de boucle (voir le garde `sigM` dans `entrainement.js`).
7. **Objectifs** : `profil.but` garde les valeurs de la v41 (`'0'` perf, `'300'` muscle, `'-400'` perdre, `'-300'` sécher) et `onb` la clé courte. Ne pas inventer d'autres valeurs : les liens `?but=` de la page de présentation en dépendent.
8. **Connexion** : on ne bloque **jamais** quelqu'un qui a une session locale (`sb-…-auth-token`) quand il est hors ligne. Ne pas passer Supabase en `flowType:'pkce'` (voir le commentaire dans `compte.js`).
9. **Santé** : l'appli est une appli de bien-être, pas un avis médical. Le coach reste prudent :
   - déficit plafonné à 20 % de la dépense ;
   - plancher de 1 200 kcal (femme) et 1 500 kcal (homme) ;
   - « perdre » et « sécher » désactivés si l'âge est sous 18 ans ou l'IMC sous 18,5 ;
   - protéines calculées sur le poids visé si l'IMC dépasse 30 ;
   - mention « demande conseil à un médecin ».

---

## 7. Objectifs (`CYobj.GOAL` dans `entrainement.js`)

| Objectif | profil.but | kcal | Protéines g/kg | Séries × reps | Repos |
|---|---|---|---|---|---|
| Augmenter mes performances (`perf`) | `0` | maintien | 1,6 | 5 × 4-6 (gros mouvements) ; 3 × 8-12 en appoint | 150 s |
| Prendre du muscle (`masse`) | `300` | +300 | 1,8 | 4 × 8-12 | 90 s |
| Perdre du poids (`poids`) | `-400` | −400 (max −20 %) | 1,6 | 3 × 12-15 | 60 s |
| Sécher (`graisse`) | `-300` | −300 (max −20 %) | 2,0 | 4 × 6-10 | 120 s |

Calories : Mifflin-St Jeor × activité du travail (`profil.metier`, de 1,4 à 2,1), plus l'écart de l'objectif. Les séances s'ajoutent en plus, selon le Compendium des MET 2024.

---

## 8. Design « Atelier »

**Parti pris :** une crème chaude, **un seul accent orange**, des chiffres qui dominent l'écran.

**Couleurs** (variables CSS dans `atelier.css`) :

| Rôle | Clair | Sombre |
|---|---|---|
| Fond | `#F7F3EC` | `#0F0D0B` |
| Surface | `#FFFFFF` | `#1A1714` |
| Surface 2 | `#F0EAE0` | `#24201C` |
| Texte | `#1C1712` | `#F5EFE6` |
| Texte secondaire | `#7A6E62` | `#9C9084` |
| Accent | `#E4572E` | `#FF6B3D` |
| Eau | `#2F80ED` | `#5AA2FF` |
| Sommeil | `#7B61FF` | `#9D8BFF` |
| Nutrition | `#2BB673` | `#3DD68C` |

**Polices** (hébergées sur le site, pas de Google Fonts pour la vie privée) :

- **Inter Tight** pour l'interface ;
- **Space Grotesk** pour les chiffres (`var(--chiffres)`, `tabular-nums`) ;
- Fredoka uniquement pour l'ancien logo.

**Composants :**

- cartes : rayon de 20 px, ombre douce en clair, bordure de 1 px en sombre ;
- boutons : rayon de 14 px ;
- puces : rayon de 999 px ;
- **zones à toucher de 44 px minimum** ;
- carte « À faire » noire ;
- chrono en feuille sombre ;
- barre d'onglets floutée, avec un point orange sur l'onglet actif ;
- messages (toasts) en haut de l'écran.

**À respecter :** le mode sombre automatique, `prefers-reduced-motion`, les libellés pour lecteur d'écran, et aucun défilement horizontal à 320 px.

---

## 9. Mise en ligne

- `main` = **production**. **Cloudflare Pages** est relié au dépôt GitHub. Commande de build : `sh construire.sh`, dossier de sortie : `dist`. Chaque fusion dans `main` met cookyourself.fitness à jour en 1 à 2 minutes.
- GitHub Pages sert aussi la racine du dépôt sur github.io. C'est secondaire : pas de page de présentation.
- **Ne jamais mettre en ligne à la main** (wrangler ou dépôt direct) : ça désynchronise le site de GitHub. La v41 avait été perdue de cette façon.
- Vérifier après chaque mise en ligne :

```bash
curl -s https://cookyourself.fitness/app/sw.js | grep -o "cookyourself-v[0-9]*"
```

---

## 10. Méthode de travail (comment Claude a travaillé, à reproduire)

1. **Toujours une branche et une PR**, jamais de commit direct sur `main`. On fusionne seulement **après l'accord de l'humain**, puisque la fusion met en ligne.
2. **Avant de coder** : lire le code concerné (`index.html` est gros, environ 160 Ko : lire par morceaux et chercher avec grep), repérer `nettoie()`, la chaîne `CYvivant` et les identifiants existants.
3. **Coder dans des fichiers séparés** quand c'est possible (`entrainement.js`, `bilan.js`, `atelier.js`, `atelier.css`) et se brancher sur les points d'entrée (`CYsport.surSerie`, `CYvivant`…) plutôt que réécrire le code de l'autre développeur.
4. **Revue par des agents spécialisés** après chaque gros chantier :
   - **product manager** et **expert sport et nutrition**, qui discutent ensemble ;
   - **product designer**, avec des captures à 390 px en clair et en sombre, et à 320 px ;
   - **QA**, qui cherche les cas limites : anciennes données, rechargement, hors ligne, 320 px, 1280 px, option « cacher les calories ».
   Puis on applique les corrections et on revérifie, jusqu'à zéro bug bloquant.
5. **Tests de bout en bout** avec Playwright et Chrome sans fenêtre, en taille iPhone 390×844 (`isMobile`). Le script sert lui-même les fichiers du dépôt. Les tests utilisés vérifiaient :
   - le premier lancement, l'objectif et les calories ;
   - le sommeil ;
   - la routine pecs, le réglage 4 séries avec repos 60/90/120, le chrono et l'enchaînement ;
   - les machines ;
   - l'historique simulé de 27 jours (le coach détecte la baisse de perfs liée au sommeil et à l'eau) ;
   - le graphique sur 30 jours, les repas, le changement d'objectif ;
   - le mode sombre à 320 px, l'absence d'erreur JS ;
   - **l'écran de connexion**, avec Supabase **simulé** (`page.route` sur `/auth/v1/signup`, `/token`, `/rest`) pour ne jamais créer de vrai compte.
   Résultat sur la v45 : 55 + 42 vérifications OK. Pour des tests sans connexion, injecter une fausse session (`localStorage['sb-pudtnebtevzkrwnjgosb-auth-token']`) et bloquer jsdelivr.
6. **Vérifier sur le site en ligne** après la mise en ligne : la version du cache, l'absence d'erreur JS, l'écran attendu.
7. **Langue** : tout en français. L'interface tutoie, avec des phrases courtes, sans jargon. Les nombres s'écrivent à la française (virgule, espace avant %).

---

## 11. Points ouverts et idées

**À faire ou à surveiller :**

- `confidentialite.html` : le champ « **[NOM DE L'ÉDITEUR / MICRO-ENTREPRISE, ADRESSE, E-MAIL DE CONTACT]** » est à remplir (obligatoire, RGPD et données de santé).
- `supabase/schema.sql` (règles RLS, tables `etat_appli`, `retours`, `abonnements`, RPC `supprimer_mon_compte`) est mentionné dans `config.js` mais **absent du dépôt**. Il faut le pousser depuis l'ordinateur de gothier83-art.
- Synchronisation : `fusion()` (`compte.js`) prend la base la plus récente pour les champs hors jours (`machines`, `seanceCfg`, `courses`…). Un éventuel conflit entre deux appareils n'est pas fusionné élément par élément.
- Protéines : l'ancien repère `jMacros` (masqué) compte 1,4 g/kg en « perf », le coach 1,6. À unifier.
- Sur 320 px, les écrans « objectif » et « travail » du premier lancement défilent un peu.
- iPhone : le chrono ne sonne pas quand l'écran est verrouillé (limite des PWA). L'écran est donc gardé allumé pendant la séance.

**Idées proposées par l'atelier PM, designer et expert, pas encore faites :**

- saisie des pas ;
- échelles de progression en callisthénie (pompes genoux, puis pompes, puis diamant, puis archer) ;
- raccourcis d'icône pour la PWA ;
- notification « Bilan du dimanche » ;
- séries d'échauffement guidées.
