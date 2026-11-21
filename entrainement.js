/* CookYourself · Entraînement : objectifs, bibliothèque d'exercices par muscle, routines, machines de la salle,
   réglage de la séance (séries + repos) et chrono de repos entre les séries.
   Dépend de window.UnGeste et window.CYsport (index.html). Données dans la même base locale (ungeste.v1). */
(function(){
  var U=window.UnGeste,S=window.CYsport;if(!U||!S)return;
  function $(i){return document.getElementById(i)}
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function toast(t,ms){var e=$('toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(function(){e.classList.remove('on')},ms||1800)}
  function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}

  /* ===== Objectifs ===== */
  var GOAL={
    poids:{nom:'Perdre du poids',ic:'⚖️',series:3,repos:60,reps:'12 à 15',rN:15,kcal:-400,prot:1.6,plan:'Léger déficit de calories, 3 à 4 séances par semaine et 8 000 pas par jour.'},
    graisse:{nom:'Sécher',ic:'🔥',series:4,repos:120,reps:'6 à 10',rN:10,kcal:-300,prot:2.0,plan:'Petit déficit, beaucoup de protéines et de la musculation pour garder ton muscle.'},
    masse:{nom:'Prendre du muscle',ic:'💪',series:4,repos:90,reps:'8 à 12',rN:12,kcal:300,prot:1.8,plan:'Léger surplus de calories, 3 à 5 séances, 10 à 20 séries par muscle et par semaine.'},
    perf:{nom:'Augmenter mes performances',ic:'🚀',series:5,repos:150,reps:'4 à 6',rN:6,kcal:0,prot:1.6,plan:'Charges lourdes, peu de répétitions, longs repos et un sommeil soigné.'},
    garder:{nom:'Garder la forme',ic:'🙂',series:3,repos:75,reps:'10 à 12',rN:12,kcal:0,prot:1.2,plan:'Calories équilibrées, 2 à 3 séances par semaine.'}};
  /* Objectif stocké comme dans le reste de l'appli : profil.but = écart de calories ('0' perf, '300' muscle, '-400' perdre, '-300' sécher), onb = clé courte. */
  var VERS={'0':'perf','300':'masse','-400':'poids','-300':'graisse'},DE={perf:'0',masse:'300',poids:'-400',graisse:'-300'},ONB={perf:'perf',masse:'muscle',poids:'perdre',graisse:'secher'};
  function but(){var d=U.db(),o={perf:'perf',muscle:'masse',perdre:'poids',secher:'graisse'}[d.onb];return o||VERS[String((d.profil||{}).but)]||'perf'}
  function butChoisi(){var d=U.db();return ['perf','muscle','perdre','secher'].indexOf(d.onb)>=0||['300','-400','-300'].indexOf(String((d.profil||{}).but))>=0}
  window.CYobj={GOAL:GOAL,but:but,choisi:butChoisi,choisir:function(k){var d=U.db();if(!d.profil)d.profil={sexe:'',age:'',taille:'',metier:'1.4',but:'0'};d.profil.but=DE[k]||'0';d.onb=ONB[k]||d.onb;var c=d.seanceCfg;if(c){delete c.jour}U.save();appliquer()}};

  /* ===== Bibliothèque d'exercices (ajoutés à ceux du programme débutant) ===== */
  function X(k,nom,muscles,poids,fiche,unite){S.ajouter(k,{nom:nom,muscles:muscles,obj:'',reps:10,series:3,poids:poids,fiche:fiche,unite:unite})}
  X('x_presse','Presse à cuisses','Cuisses · fessiers',true,['<b>Départ</b> : dos et bassin bien collés au dossier, pieds largeur de hanches au milieu du plateau.','<b>Mouvement</b> : descends jusqu\'à ce que les genoux fassent environ 90°, puis pousse sans verrouiller les genoux.','<b>Erreurs</b> : bassin qui décolle en bas, genoux qui rentrent.']);
  X('x_legext','Leg extension (machine)','Avant des cuisses',true,['<b>Réglage</b> : l\'axe de la machine en face de tes genoux, le boudin au-dessus des chevilles.','<b>Mouvement</b> : tends les jambes, tiens 1 s, redescends lentement.','<b>Erreurs</b> : donner de l\'élan, charge trop lourde.']);
  X('x_legcurl','Leg curl (machine)','Arrière des cuisses',true,['<b>Réglage</b> : genoux dans l\'axe de la machine, boudin juste au-dessus des talons.','<b>Mouvement</b> : ramène les talons vers les fesses, redescends en contrôlant.','<b>Erreurs</b> : bassin qui se soulève.']);
  X('x_mollets','Mollets debout (machine)','Mollets',true,['<b>Départ</b> : avant du pied sur la marche, talons dans le vide.','<b>Mouvement</b> : monte le plus haut possible, tiens 1 s, descends talons bas.','<b>Erreurs</b> : rebondir en bas.']);
  X('x_mollets_pdc','Mollets sur une marche','Mollets',false,['<b>Départ</b> : avant du pied sur une marche, une main au mur.','<b>Mouvement</b> : monte sur la pointe, tiens 1 s, redescends lentement sous la marche.','<b>Plus dur</b> : sur une seule jambe.']);
  X('x_fentesbulg','Fentes bulgares','Cuisses · fessiers',true,['<b>Départ</b> : pied arrière posé sur un banc ou une chaise, pied avant un grand pas devant.','<b>Mouvement</b> : descends droit jusqu\'à ce que la cuisse avant soit parallèle au sol, remonte.','<b>Erreurs</b> : genou avant qui rentre. Charge facultative (0 kg = poids du corps).']);
  X('x_pistol','Squat sur une jambe (assisté)','Cuisses · fessiers · équilibre',false,['<b>Départ</b> : sur une jambe, l\'autre tendue devant, une main sur un poteau ou une porte.','<b>Mouvement</b> : descends lentement le plus bas possible en gardant le talon au sol, remonte en t\'aidant un peu du bras.','<b>Plus facile</b> : descends sur un banc et relève-toi.']);
  X('x_dc','Développé couché (barre)','Pectoraux · triceps · épaules',true,['<b>Départ</b> : allongé, yeux sous la barre, omoplates serrées, pieds au sol.','<b>Mouvement</b> : descends la barre au bas des pectoraux, coudes à environ 45°, pousse.','<b>Sécurité</b> : demande à quelqu\'un de te surveiller dès que c\'est lourd.']);
  X('x_dih','Développé incliné (haltères)','Haut des pectoraux · épaules',true,['<b>Départ</b> : banc incliné à 30°, haltères au-dessus de la poitrine.','<b>Mouvement</b> : descends les haltères au niveau du haut de la poitrine, pousse en les rapprochant.','<b>Erreurs</b> : banc trop incliné (ça devient les épaules).']);
  X('x_pecdeck','Pec deck (butterfly)','Pectoraux',true,['<b>Réglage</b> : poignées à hauteur de poitrine, dos collé.','<b>Mouvement</b> : ramène les bras devant toi en serrant les pectoraux, reviens lentement.','<b>Erreurs</b> : épaules qui avancent.']);
  X('x_dipsm','Dips (barres ou machine)','Pectoraux · triceps',false,['<b>Départ</b> : bras tendus sur les barres, buste légèrement penché.','<b>Mouvement</b> : descends jusqu\'à ce que les coudes fassent 90°, pousse.','<b>Plus facile</b> : machine à dips assistée ou pieds sur un élastique.']);
  X('x_dipsb','Dips aux barres parallèles','Pectoraux · triceps',false,['<b>Départ</b> : bras tendus sur les barres, épaules basses.','<b>Mouvement</b> : descends jusqu\'à 90° aux coudes, pousse jusqu\'en haut.','<b>Plus facile</b> : dips sur un banc, ou descentes lentes seulement.']);
  X('x_tirvert','Tirage vertical (poulie haute)','Dos · biceps',true,['<b>Départ</b> : assis, cuisses calées, mains un peu plus larges que les épaules.','<b>Mouvement</b> : tire la barre vers le haut de la poitrine en serrant les omoplates, remonte lentement.','<b>Erreurs</b> : se pencher très en arrière, tirer derrière la nuque.']);
  X('x_tirhor','Tirage horizontal (poulie basse)','Milieu du dos · biceps',true,['<b>Départ</b> : assis, pieds calés, dos droit, bras tendus.','<b>Mouvement</b> : tire la poignée vers le nombril, serre les omoplates, reviens en contrôlant.','<b>Erreurs</b> : balancer le buste.']);
  X('x_austr','Rowing australien','Dos · biceps',false,['<b>Départ</b> : sous une barre basse ou une table solide, corps droit, talons au sol.','<b>Mouvement</b> : tire la poitrine vers la barre, redescends bras tendus.','<b>Plus dur</b> : pieds surélevés.']);
  X('x_chin','Tractions supination (paumes vers toi)','Biceps · dos',false,['<b>Départ</b> : suspendu, mains largeur d\'épaules, paumes vers toi.','<b>Mouvement</b> : monte le menton au-dessus de la barre, redescends bras tendus.','<b>Plus facile</b> : saute en haut et descends en 5 secondes.']);
  X('x_epm','Développé épaules (machine)','Épaules · triceps',true,['<b>Réglage</b> : poignées à hauteur d\'épaules, dos collé.','<b>Mouvement</b> : pousse vers le haut sans verrouiller, redescends lentement.','<b>Erreurs</b> : cambrer le bas du dos.']);
  X('x_elevlat','Élévations latérales (haltères)','Épaules (côté)',true,['<b>Départ</b> : debout, haltères le long du corps, coudes un peu fléchis.','<b>Mouvement</b> : monte les bras sur les côtés jusqu\'à hauteur d\'épaules, redescends en 2 secondes.','<b>Erreurs</b> : charge trop lourde, hausser les épaules.']);
  X('x_facepull','Face pull (poulie)','Arrière des épaules · haut du dos',true,['<b>Départ</b> : corde à hauteur du visage, bras tendus.','<b>Mouvement</b> : tire la corde vers le front en écartant les mains, coudes hauts.','<b>Bon pour</b> : la posture et des épaules solides.']);
  X('x_pike','Pompes piquées (pike)','Épaules · triceps',false,['<b>Départ</b> : en V inversé, fesses hautes, mains au sol largeur d\'épaules.','<b>Mouvement</b> : descends le sommet de la tête vers le sol entre les mains, pousse.','<b>Plus dur</b> : pieds sur un banc.']);
  X('x_poirier','Maintien en poirier contre un mur','Épaules · gainage',false,['<b>Départ</b> : mains au sol à 20 cm du mur, monte les pieds contre le mur.','<b>Position</b> : bras tendus, ventre serré, tiens le temps indiqué.','<b>Plus facile</b> : pieds sur une chaise, fesses en l\'air.'],'s');
  X('x_curl','Curl biceps (haltères ou barre)','Biceps',true,['<b>Départ</b> : debout, coudes collés au corps.','<b>Mouvement</b> : monte la charge vers les épaules, redescends en 2 secondes.','<b>Erreurs</b> : balancer le buste.']);
  X('x_marteau','Curl marteau (haltères)','Biceps · avant-bras',true,['<b>Départ</b> : haltères le long du corps, paumes face à face.','<b>Mouvement</b> : monte sans tourner les poignets, redescends lentement.','<b>Erreurs</b> : coudes qui avancent.']);
  X('x_triceps','Extension triceps (poulie)','Triceps',true,['<b>Départ</b> : face à la poulie haute, coudes collés au corps.','<b>Mouvement</b> : tends les bras vers le bas, reviens jusqu\'à 90°.','<b>Erreurs</b> : coudes qui bougent.']);
  X('x_tricepsh','Extension triceps au-dessus de la tête (haltère)','Triceps',true,['<b>Départ</b> : assis ou debout, un haltère tenu à deux mains au-dessus de la tête.','<b>Mouvement</b> : descends l\'haltère derrière la nuque en pliant les coudes, remonte.','<b>Erreurs</b> : coudes qui s\'écartent.']);
  X('x_pompdiam','Pompes serrées (diamant)','Triceps · pectoraux',false,['<b>Départ</b> : mains rapprochées sous la poitrine, pouces et index qui se touchent.','<b>Mouvement</b> : descends coudes le long du corps, pousse.','<b>Plus facile</b> : genoux au sol.']);
  X('x_pompdecl','Pompes pieds surélevés','Haut des pectoraux · épaules',false,['<b>Départ</b> : pieds sur un banc, mains au sol, corps droit.','<b>Mouvement</b> : descends la poitrine vers le sol, pousse.','<b>Erreurs</b> : bassin qui tombe.']);
  X('x_crunchp','Crunch à la poulie','Abdominaux',true,['<b>Départ</b> : à genoux face à la poulie haute, corde tenue près de la tête.','<b>Mouvement</b> : enroule le buste vers le sol en contractant les abdos, reviens lentement.','<b>Erreurs</b> : tirer avec les bras.']);
  X('x_crunch','Crunch','Abdominaux',false,['<b>Départ</b> : sur le dos, genoux pliés, mains aux tempes.','<b>Mouvement</b> : décolle les épaules en enroulant le buste, souffle en montant.','<b>Erreurs</b> : tirer sur la nuque.']);
  X('x_releve','Relevé de jambes (suspendu ou chaise romaine)','Bas des abdominaux',false,['<b>Départ</b> : suspendu à une barre ou en appui sur la chaise romaine.','<b>Mouvement</b> : monte les genoux vers la poitrine sans balancer, redescends lentement.','<b>Plus dur</b> : jambes tendues.']);
  X('x_russian','Rotations russes','Abdominaux (côtés)',false,['<b>Départ</b> : assis, buste penché en arrière, pieds au sol.','<b>Mouvement</b> : tourne le buste d\'un côté puis de l\'autre, lentement, sans poids au début.','<b>Erreurs</b> : dos rond. Arrête si le bas du dos tire.']);
  X('x_hollow','Hollow body (coque)','Abdominaux',false,['<b>Position</b> : sur le dos, bas du dos collé au sol, bras et jambes tendus décollés.','<b>Tiens</b> le temps indiqué en respirant.','<b>Plus facile</b> : genoux pliés.'],'s');

  var GROUPES=[['jambes','🦵 Jambes'],['pecs','🫁 Pecs'],['dos','🔙 Dos'],['epaules','🤷 Épaules'],['bras','💪 Bras'],['abdos','🎯 Abdos'],['full','⚡ Corps entier']];
  var LIB={
    salle:{jambes:['squat','x_presse','x_legcurl','x_legext','x_mollets'],pecs:['x_dc','x_dih','x_pecdeck','x_dipsm'],dos:['x_tirvert','rowing','x_tirhor','souleve'],epaules:['militaire','x_elevlat','x_facepull','x_epm'],bras:['x_curl','x_triceps','x_marteau','x_dipsm'],abdos:['x_crunchp','x_releve','gainage']},
    maison:{jambes:['goblet','fentes','souleveh','x_fentesbulg','pont'],pecs:['devsol','pompes','x_pompdecl'],dos:['rowh','souleveh','x_austr'],epaules:['epaulesh','x_elevlat','x_pike'],bras:['x_curl','x_tricepsh','x_marteau','x_pompdiam'],abdos:['gainage','x_crunch','x_russian','grimpeur']},
    calis:{jambes:['squatpdc','x_fentesbulg','x_pistol','pont','x_mollets_pdc'],pecs:['pompes','x_pompdecl','x_dipsb'],dos:['tractions','x_austr','x_chin'],epaules:['x_pike','x_poirier','pompes'],bras:['x_chin','x_pompdiam','x_dipsb'],abdos:['gainage','x_hollow','x_releve','grimpeur']}};
  var NOMG={jambes:'Jambes',pecs:'Pecs',dos:'Dos',epaules:'Épaules',bras:'Bras',abdos:'Abdos',full:'Corps entier'};

  /* objectif de répétitions affiché selon le but */
  /* gros mouvements : là où l'objectif « performances » s'applique (charges lourdes, longs repos) */
  var BASE={squat:1,x_dc:1,souleve:1,militaire:1,rowing:1,tractions:1,x_presse:1,x_tirvert:1,x_dih:1,x_dipsb:1,x_dipsm:1,x_chin:1,goblet:1,souleveh:1,devsol:1,epaulesh:1,rowh:1,x_tirhor:1,x_epm:1,pompes:1};
  window.CYobj.groupe=function(k){if(/^perso/.test(k)){var xp=(U.db().exosPerso||[]).filter(function(x){return x.id===k})[0];return xp&&xp.groupe||null}if(/^m_/.test(k)){var m=machines().filter(function(x){return 'm_'+x.id===k})[0];return m?m.groupe:null}var L=LIB.salle,r=null;['salle','maison','calis'].forEach(function(l){Object.keys(LIB[l]).forEach(function(g){if(!r&&LIB[l][g].indexOf(k)>=0)r=g})});return r};
  function cible(k){var e=S.exo(k),b=but(),g=GOAL[b];if(!e||e.objPerso)return;e.base=!!BASE[k]||(/^m_/.test(k)&&!!e.poids);
    if(e.unite==='s'){e.obj=g.series+' fois '+(b==='perf'?'30 à 60':'20 à 45')+' secondes';e.reps=b==='perf'?60:45;return}
    if(b==='perf'&&!e.base){e.obj='3 séries de 8 à 12 (exercice d\'appoint)';e.reps=12;return}
    if(!e.poids&&b==='perf'){e.obj=g.series+' séries, au maximum propre (garde 1 à 2 répétitions en réserve)';e.reps=8;return}
    e.obj=g.series+' séries de '+g.reps;e.reps=g.rN}

  /* ===== Machines de la salle ===== */
  function machines(){var d=U.db();if(!Array.isArray(d.machines))d.machines=[];return d.machines}
  function enregistrerMachines(){machines().forEach(function(m){S.ajouter('m_'+m.id,{nom:m.nom,muscles:NOMG[m.groupe]||'Machine',obj:'',reps:10,series:3,poids:m.charge!==false,fiche:['Machine ajoutée par toi. Règle le siège pour que l\'axe de la machine soit aligné avec ton articulation, et garde un mouvement lent et contrôlé.']});cible('m_'+m.id)})}

  /* ===== Modes : programme débutant / routine par muscle / mes machines ===== */
  var mode=store('cy.mode')||'comp',groupe=store('cy.groupe')||'jambes';if(mode==='prog')mode='comp';
  function routine(lieu,g){var L=LIB[lieu]||LIB.maison,ks;
    if(g==='full')ks=[L.jambes[0],L.pecs[0],L.dos[0],L.epaules[0],L.abdos[0]];
    else{ks=(L[g]||[]).slice(0,4);if(lieu==='salle'){var mine=machines().filter(function(m){return !m.archive&&m.groupe===g}).map(function(m){return 'm_'+m.id});ks=mine.concat(ks.filter(function(k){return mine.indexOf(k)<0})).slice(0,5)}}
    var vu={};return ks.filter(function(k){if(vu[k]||!S.exo(k))return false;vu[k]=1;return true})}
  function appliquer(){enregistrerMachines();var lieu=S.lieu(),g=GOAL[but()];S.cles().forEach(cible);if(mode==='mach'&&lieu!=='salle')mode='comp';
    if(mode==='comp'){var R=routineDb();if(R&&R.jours.length&&!assist){var i=R.idx%R.jours.length,J=R.jours[i],kj=J.k.filter(function(k){return S.exo(k)});kj.forEach(cible);
        S.custom({court:'Jour '+(i+1)+' · '+J.nom.split(' (')[0],titre:'Jour '+(i+1)+'/'+R.jours.length+' · '+J.nom+' · '+g.series+' séries de '+g.reps+' · repos '+fmtS(g.repos),k:kj})}
      else S.custom({court:'à créer ci-dessous',titre:'',k:[]})}
    else if(mode==='rout'){var ks=routine(lieu,groupe);ks.forEach(cible);S.custom({court:NOMG[groupe],titre:'Routine '+NOMG[groupe]+' · '+S.nomLieu()+' · '+g.series+' séries de '+g.reps+' · repos '+fmtS(g.repos),k:ks})}
    else if(mode==='mach'){var km=machines().filter(function(m){return !m.archive}).map(function(m){return 'm_'+m.id});km.forEach(cible);S.custom({court:'machines',titre:km.length?'Mes machines · '+km.length+' machine'+(km.length>1?'s':''):'Mes machines : ajoute ta première machine ci-dessous',k:km})}
    else S.custom(null);
    dessinerMode()}
  /* ===== Routine complète : séances par semaine → proposition qui couvre tous les muscles → réajuster (plusieurs choix) ===== */
  var MODELES={fullA:[['jambes',1],['pecs',1],['dos',1],['epaules',1],['abdos',1]],fullB:[['jambes',1],['pecs',1],['dos',1],['bras',1],['abdos',1]],fullC:[['jambes',1],['dos',1],['pecs',1],['epaules',1],['bras',1]],
    haut:[['pecs',2],['dos',2],['epaules',1],['bras',1]],bas:[['jambes',3],['abdos',2]],push:[['pecs',2],['epaules',2],['bras',1,'Triceps']],pull:[['dos',3],['bras',1,'Biceps'],['abdos',1]],jambes:[['jambes',4],['abdos',1]]};
  var DECOUPES={2:[['Corps entier A','fullA'],['Corps entier B','fullB']],3:[['Corps entier A','fullA'],['Corps entier B','fullB'],['Corps entier C','fullC']],
    4:[['Haut du corps','haut'],['Bas du corps','bas'],['Haut du corps 2','haut'],['Bas du corps 2','bas']],
    5:[['Poussée (pecs, épaules, triceps)','push'],['Tirage (dos, biceps)','pull'],['Jambes','jambes'],['Haut du corps','haut'],['Bas du corps','bas']],
    6:[['Poussée (pecs, épaules, triceps)','push'],['Tirage (dos, biceps)','pull'],['Jambes','jambes'],['Poussée 2','push'],['Tirage 2','pull'],['Jambes 2','jambes']]};
  var FOCUS=[['jambes','Plus de jambes'],['dos','Plus de dos'],['pecs','Plus de pecs'],['epaules','Plus d\'épaules'],['bras','Plus de bras'],['abdos','Plus d\'abdos']];
  function reserve(lieu,g){var L=LIB[lieu]||LIB.maison,mine=lieu==='salle'?machines().filter(function(m){return !m.archive&&m.groupe===g}).map(function(m){return 'm_'+m.id}):[];var vu={};return mine.concat(L[g]||[]).filter(function(k){if(vu[k]||!S.exo(k))return false;vu[k]=1;return true})}
  function generer(nb,focus,lieu){var ptr={},jours=(DECOUPES[nb]||DECOUPES[3]).map(function(d){var mod=MODELES[d[1]].map(function(x){return x.slice()}),ks=[];
      (focus||[]).forEach(function(f){var l=mod.filter(function(x){return x[0]===f})[0];if(l)l[1]++});
      mod.forEach(function(x){var g=x[0],n=x[1],filtre=x[2],pool=reserve(lieu,g).filter(function(k){return !filtre||(S.exo(k).muscles||'').indexOf(filtre)>=0});if(!pool.length)pool=reserve(lieu,g);
        for(var i=0;i<n&&ks.length<8;i++){var t=0;while(t<pool.length){var k=pool[(ptr[g+filtre]=(ptr[g+filtre]||0)+1)%pool.length];t++;if(ks.indexOf(k)<0){ks.push(k);break}}}});
      return{nom:d[0],k:ks}});return{nb:nb,focus:focus||[],jours:jours,idx:0,lieu:lieu}}
  function routineDb(){var r=U.db().routine;return r&&Array.isArray(r.jours)&&r.jours.length?r:null}
  var assist=null;   /* assistant en cours : {etape:'nb'|'prop'|'ajust', nb, focus, prop} */
  function vueRoutine(){var R=routineDb(),lieu=S.lieu(),g=GOAL[but()],h='';
    if(!assist&&!R)assist={etape:'nb',focus:[]};
    if(assist&&assist.etape==='nb'){var conseil={poids:3,graisse:4,masse:4,perf:4,garder:3}[but()]||3;
      h+='<div class="lbl" style="margin-top:12px;font-weight:600;color:var(--ink)">Combien de séances par semaine ?</div><div class="chips" role="group" aria-label="Séances par semaine">'+[2,3,4,5,6].map(function(n){return '<button data-rnb="'+n+'">'+n+(n===conseil?' · conseillé':'')+'</button>'}).join('')+'</div><div class="est" style="margin-top:6px">Ta routine couvrira tous tes muscles, réglée pour ton objectif : '+esc(g.nom)+'.</div>'}
    else if(assist&&assist.etape==='prop'){var P=assist.prop;
      h+='<div class="card" style="background:var(--soft);box-shadow:none;margin-top:12px"><div class="cap">Ta routine proposée</div><div class="titre" style="font-size:19px;margin:2px 0 4px">'+P.nb+' séances par semaine · '+esc(S.nomLieu())+'</div>'+(P.focus.length?'<div class="est">Avec plus de : '+P.focus.map(function(f){return NOMG[f].toLowerCase()}).join(', ')+'</div>':'')+
        P.jours.map(function(J,i){return '<div style="margin-top:12px"><b>Jour '+(i+1)+' · '+esc(J.nom)+'</b><div class="est">'+J.k.map(function(k){return esc(S.exo(k).nom.split(' (')[0])}).join(' · ')+'</div></div>'}).join('')+
        '<div class="est" style="margin-top:10px">'+g.series+' séries de '+g.reps+' par exercice, '+fmtS(g.repos)+' de repos. <button class="lien" data-catalogue="1">Voir les exercices</button></div>'+
        '<div class="lbl" style="margin-top:14px;font-weight:600;color:var(--ink)">Ça te convient ?</div><button class="main" id="rOk" style="margin-top:8px">Oui, c\'est parfait</button><button id="rAjust" style="width:100%;margin-top:8px">Réajuster</button><button class="lien" id="rNb" style="display:block;margin:8px auto 0">Changer le nombre de séances</button></div>'}
    else if(assist&&assist.etape==='ajust'){
      h+='<div class="card" style="background:var(--soft);box-shadow:none;margin-top:12px"><div class="lbl" style="font-weight:600;color:var(--ink)">Sur quoi veux-tu insister ?</div><div class="est">Tu peux en choisir plusieurs.</div><div class="chips" role="group" aria-label="Muscles à travailler davantage">'+FOCUS.map(function(f){return '<button data-rfoc="'+f[0]+'" aria-pressed="'+(assist.focus.indexOf(f[0])>=0)+'">'+f[1]+'</button>'}).join('')+'</div>'+
        '<button class="main" id="rRegen" style="margin-top:12px">Voir la nouvelle proposition</button><button class="lien" id="rRetour" style="display:block;margin:8px auto 0">Retour à la proposition</button></div>'}
    else if(R){var i=R.idx%R.jours.length;
      h+='<div class="lbl" style="margin-top:12px">Ta routine · '+R.jours.length+' séances par semaine'+(R.focus&&R.focus.length?' · plus de '+R.focus.map(function(f){return NOMG[f].toLowerCase()}).join(', '):'')+'</div><div class="chips" role="group" aria-label="Jour de la routine">'+R.jours.map(function(J,k){return '<button data-rjour="'+k+'" aria-pressed="'+(k===i)+'">Jour '+(k+1)+'</button>'}).join('')+'</div><button class="lien" id="rModif" style="margin-top:6px">Modifier ma routine</button>'}
    return h}
  function majRoutine(){appliquer();var z=$('entrMode');if(z){var b=z.querySelector('#rOk,.chips button');if(b&&assist)b.focus({preventScroll:true})}}
  document.addEventListener('click',function(ev){var t=ev.target.closest&&ev.target.closest('[data-rnb],[data-rfoc],[data-rjour],#rOk,#rAjust,#rNb,#rRegen,#rRetour,#rModif');if(!t)return;var d=t.dataset,lieu=S.lieu();
    if(d.rnb){assist={etape:'prop',nb:+d.rnb,focus:assist?assist.focus:[]};assist.prop=generer(assist.nb,assist.focus,lieu)}
    else if(d.rfoc){var f=assist.focus,i=f.indexOf(d.rfoc);if(i>=0)f.splice(i,1);else f.push(d.rfoc);t.setAttribute('aria-pressed',i<0);return}
    else if(d.rjour){var R=routineDb();R.idx=+d.rjour;U.save();$('exoCard').classList.add('hide')}
    else if(t.id==='rOk'){var D0=U.db();D0.routine=assist.prop;D0.routine.idx=0;if(D0.gam)D0.gam.objSemaine=assist.prop.nb;assist=null;U.save();toast('Routine enregistrée : '+D0.routine.nb+' séances par semaine')}
    else if(t.id==='rAjust'){assist.etape='ajust'}
    else if(t.id==='rNb'){assist={etape:'nb',focus:assist.focus}}
    else if(t.id==='rRegen'){assist.prop=generer(assist.nb,assist.focus,lieu);assist.etape='prop'}
    else if(t.id==='rRetour'){assist.etape='prop'}
    else if(t.id==='rModif'){var R2=routineDb();assist={etape:'nb',focus:R2&&R2.focus?R2.focus.slice():[]};$('exoCard').classList.add('hide')}
    majRoutine()});
  /* séance terminée avec la routine : on passe au jour suivant */
  var avantFin=0;document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#finSeance'))avantFin=(U.jour().seances||[]).length},true);
  document.addEventListener('click',function(e){if(!(e.target.closest&&e.target.closest('#finSeance')))return;var R=routineDb();if(mode!=='comp'||!R)return;if((U.jour().seances||[]).length>avantFin){R.idx=(R.idx+1)%R.jours.length;U.save();setTimeout(function(){appliquer();var f=$('finInfo');if(f)f.textContent+=' Prochaine séance : jour '+(R.idx+1)+' · '+R.jours[R.idx].nom+'.'},0)}});
  /* ===== Catalogue : tous les exercices, le groupe et les muscles travaillés, l'explication et l'animation ===== */
  var NOMLIEU={salle:'🏋️ Salle',maison:'🏠 Maison',calis:'🌳 Sans matériel'};
  function catalogue(){var lieuC=S.lieu(),grC='tous',av=document.activeElement,o=document.createElement('div');o.className='voile';o.innerHTML='<div class="sheet catal" role="dialog" aria-modal="true" aria-labelledby="catT"></div>';document.body.appendChild(o);var sh=o.firstChild;
    document.querySelector('main').inert=true;document.querySelector('nav').inert=true;
    function fermer(){o.remove();document.querySelector('main').inert=false;document.querySelector('nav').inert=false;try{if(av)av.focus({preventScroll:true})}catch(e){}}
    function cles(){var vu={},L=[];(lieuC==='tous'?['salle','maison','calis']:[lieuC]).forEach(function(l){Object.keys(LIB[l]).forEach(function(g){reserve(l,g).forEach(function(k){if(!vu[k]){vu[k]=1;L.push([k,g])}})})});return L}
    function dessin(){var L=cles().filter(function(x){return grC==='tous'||x[1]===grC}),parG={};L.forEach(function(x){(parG[x[1]]=parG[x[1]]||[]).push(x[0])});
      sh.innerHTML='<div class="poignee" aria-hidden="true"></div><div style="display:flex;justify-content:space-between;align-items:center"><h2 class="rt" id="catT" style="margin:0">Les exercices</h2><button class="lien" id="catF" aria-label="Fermer">Fermer</button></div>'+
        '<div class="chips" role="group" aria-label="Lieu">'+[['tous','Tous les lieux']].concat(Object.keys(NOMLIEU).map(function(l){return [l,NOMLIEU[l]]})).map(function(x){return '<button data-catl="'+x[0]+'" aria-pressed="'+(lieuC===x[0])+'">'+x[1]+'</button>'}).join('')+'</div>'+
        '<div class="chips" role="group" aria-label="Muscle">'+[['tous','Tous les muscles']].concat(GROUPES.filter(function(g){return g[0]!=='full'})).map(function(x){return '<button data-catg="'+x[0]+'" aria-pressed="'+(grC===x[0])+'">'+x[1]+'</button>'}).join('')+'</div>'+
        Object.keys(NOMG).filter(function(g){return parG[g]}).map(function(g){return '<div class="cap" style="margin:16px 0 6px">'+NOMG[g]+' · '+parG[g].length+'</div>'+parG[g].map(function(k){var e=S.exo(k);return '<details class="catE" data-k="'+esc(k)+'"><summary><span class="catN"><b>'+esc(e.nom)+'</b><span class="catM">'+esc(e.muscles||NOMG[g])+'</span></span><span class="catTag">'+(e.unite==='s'?'Gainage':e.poids?'Avec charge':'Poids du corps')+'</span></summary><div class="catB"></div></details>'}).join('')}).join('')+
        '<div class="est" style="margin-top:14px">Échauffe-toi 5 à 10 minutes. Arrête en cas de douleur.</div>';
      $('catF').onclick=fermer;
      sh.querySelectorAll('[data-catl]').forEach(function(b){b.onclick=function(){lieuC=b.dataset.catl;dessin()}});
      sh.querySelectorAll('[data-catg]').forEach(function(b){b.onclick=function(){grC=b.dataset.catg;dessin()}});
      sh.querySelectorAll('details.catE').forEach(function(d){d.addEventListener('toggle',function(){if(!d.open)return;var b=d.querySelector('.catB');if(b.dataset.ok)return;b.dataset.ok=1;var k=d.dataset.k,e=S.exo(k);
        b.innerHTML=(window.CYanim&&CYanim.a(k)?'<div class="anim">'+CYanim.svg(k,200)+'</div>':'')+'<div class="est" style="margin:4px 0 6px"><b style="color:var(--ink)">Muscles :</b> '+esc(e.muscles||'')+'</div>'+(e.fiche||[]).map(function(p){return '<p style="margin:4px 0;font-size:14.5px">'+p+'</p>'}).join('')})})}
    o.addEventListener('click',function(e){if(e.target===o)fermer()});o.addEventListener('keydown',function(e){if(e.key==='Escape')fermer()});dessin();var h=$('catT');h.setAttribute('tabindex','-1');h.focus()}
  document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('[data-catalogue]'))catalogue()});
  function dessinerMode(){var z=$('entrMode');if(!z)return;var lieu=S.lieu();
    var M=[['comp','Routine complète'],['rout','Exercice spécifique']];if(lieu==='salle')M.push(['mach','Mes machines']);
    var h='<div class="lbl" style="margin-top:12px">Que veux-tu faire ?</div><div class="chips" role="group" aria-label="Type de séance">'+M.map(function(m){return '<button data-emode="'+m[0]+'" aria-pressed="'+(mode===m[0])+'">'+m[1]+'</button>'}).join('')+'</div>';
    h+='<button class="lien" data-catalogue="1" style="margin-top:8px">📖 Voir tous les exercices et les muscles travaillés</button>';
    if(mode==='comp')h+=vueRoutine();
    if(mode==='rout')h+='<div class="lbl" style="margin-top:10px">Quel muscle ?</div><div class="chips" role="group" aria-label="Muscle à travailler">'+GROUPES.map(function(g){return '<button data-egr="'+g[0]+'" aria-pressed="'+(groupe===g[0])+'">'+g[1]+'</button>'}).join('')+'</div><div class="est" style="margin-top:6px">Routine réglée pour ton objectif : <b>'+esc(GOAL[but()].nom)+'</b>.'+(butChoisi()?'':' <button class="lien" data-v="histo">Choisir mon objectif</button>')+'</div>';
    if(mode==='mach'){var ms=machines().filter(function(m){return !m.archive});
      h+='<ul style="margin-top:8px">'+ms.map(function(m){return '<li><span>'+esc(m.nom)+' <span class="est">· '+esc(NOMG[m.groupe]||'')+(m.charge===false?' · sans charge':'')+'</span></span><button data-emdel="'+m.id+'" aria-label="Retirer la machine '+esc(m.nom)+'">✕</button></li>'}).join('')+'</ul>'+
        '<form id="emForm" style="margin-top:8px"><label for="emNom">Nom de la machine</label><input id="emNom" placeholder="Ex. : presse à cuisses, poulie haute…" autocomplete="off" maxlength="40">'+
        '<div class="row" style="margin-top:8px"><select id="emGr" aria-label="Muscle travaillé">'+GROUPES.filter(function(g){return g[0]!=='full'}).map(function(g){return '<option value="'+g[0]+'">'+g[1].replace(/^\S+ /,'')+'</option>'}).join('')+'</select>'+
        '<label style="display:flex;gap:8px;align-items:center;margin:0;color:var(--ink);font-size:15px;min-height:44px;flex:0 0 auto"><input type="checkbox" id="emCh" checked> avec charge</label></div>'+
        '<button class="main" type="submit" style="margin-top:8px">Ajouter la machine</button></form><div class="est" style="margin-top:6px">Pour chaque machine, tu notes la charge et les répétitions de chaque série. Elles servent aussi dans « Routine par muscle ».</div>'}
    z.innerHTML=h;var pc=$('progChoix');if(pc)pc.classList.toggle('hide',mode!=='prog');
    var f=$('emForm');if(f)f.onsubmit=function(e){e.preventDefault();var n=$('emNom').value.trim();if(!n){toast('Donne un nom à la machine');return}
      machines().push({id:Date.now().toString(36),nom:n.slice(0,40),groupe:$('emGr').value,charge:$('emCh').checked});U.save();enregistrerMachines();appliquer();toast('Machine ajoutée')}}
  document.addEventListener('click',function(ev){var b=ev.target.closest&&ev.target.closest('[data-emode],[data-egr],[data-emdel],[data-lieu]');if(!b)return;var d=b.dataset;
    if(d.emode){mode=d.emode;store('cy.mode',mode);$('exoCard').classList.add('hide')}
    if(d.egr){groupe=d.egr;store('cy.groupe',groupe);$('exoCard').classList.add('hide')}
    if(d.emdel){machines().forEach(function(m){if(m.id===d.emdel)m.archive=true});U.save()}
    appliquer()});

  /* ===== Réglage de la séance : séries + repos ===== */
  function fmtS(s){s=Math.round(s);return s<60?s+' s':Math.floor(s/60)+' min'+(s%60?' '+String(s%60).padStart(2,'0'):'')}
  function cfg(){var d=U.db(),g=GOAL[but()];if(!d.seanceCfg||typeof d.seanceCfg!=='object')d.seanceCfg={};var c=d.seanceCfg;
    c.series=Math.round(+c.series);c.repos=Math.round(+c.repos);c.meme=c.meme!==false;if(!(c.series>=1&&c.series<=12))c.series=g.series;if(!(c.repos>=10&&c.repos<=600))c.repos=g.repos;if(!Array.isArray(c.liste))c.liste=[];c.liste=c.liste.map(function(x){x=Math.round(+x);return x>=10&&x<=600?x:0});return c}
  function reposApres(n){var c=cfg();return c.meme?c.repos:(+c.liste[n-1]||c.repos)}
  window.CYchrono={series:function(){return cfg().series},arreter:function(){seance=false;arreter()}};
  var seance=false;
  var sheetOuvert=false,apresSheet=null;
  function sheet(){var c=cfg(),g=GOAL[but()],tmp={series:c.series,meme:c.meme,repos:c.repos,liste:c.liste.slice()},avant=document.activeElement;sheetOuvert=true;
    var o=document.createElement('div');o.className='voile';o.innerHTML='<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="shT"></div>';document.body.appendChild(o);var s=o.firstChild;
    document.querySelector('main').inert=true;document.querySelector('nav').inert=true;
    function fermer(ok){if(ok){c.series=tmp.series;c.meme=tmp.meme;c.repos=tmp.repos;c.liste=tmp.liste.slice(0,tmp.series-1);c.jour=U.cle();U.save();toast(c.series+' séries · repos '+(c.meme?fmtS(c.repos):'personnalisé'))}
      document.querySelector('main').inert=false;document.querySelector('nav').inert=false;o.remove();sheetOuvert=false;try{if(avant&&document.contains(avant)&&avant.focus)avant.focus({preventScroll:true})}catch(e){}majLigne();S.rendre();var f=apresSheet;apresSheet=null;if(ok&&f)f()}
    function dessin(){var R=[30,45,60,90,120,180];
      s.innerHTML='<div class="poignee" aria-hidden="true"></div><h2 class="rt" id="shT" style="margin:0">Avant de commencer</h2><div class="est">Conseillé pour <b>'+esc(g.nom)+'</b> : '+g.series+' séries de '+g.reps+', '+fmtS(g.repos)+' de repos. <button class="lien" id="shCons">Prendre ce réglage</button></div>'+
        '<div class="lbl" style="margin-top:14px">Combien de séries par exercice ?</div><div class="chips" role="group" aria-label="Nombre de séries">'+[2,3,4,5,6].map(function(n){return '<button data-shs="'+n+'" aria-pressed="'+(tmp.series===n)+'">'+n+'</button>'}).join('')+'<input id="shSAutre" type="number" inputmode="numeric" min="1" max="12" placeholder="Autre" aria-label="Autre nombre de séries (1 à 12)" style="width:96px;flex:0 0 auto;min-height:44px" value="'+([2,3,4,5,6].indexOf(tmp.series)<0?tmp.series:'')+'"></div>'+
        '<div class="lbl" style="margin-top:14px">Chrono de repos entre les séries</div><div class="seg" role="group" aria-label="Type de repos" style="margin:6px 0 8px"><button data-shm="1" aria-pressed="'+tmp.meme+'">Le même à chaque fois</button><button data-shm="0" aria-pressed="'+(!tmp.meme)+'">Différent à chaque série</button></div>'+
        (tmp.meme?'<div class="chips" role="group" aria-label="Durée du repos">'+R.map(function(r){return '<button data-shr="'+r+'" aria-pressed="'+(tmp.repos===r)+'">'+fmtS(r)+'</button>'}).join('')+'<input id="shRAutre" type="number" inputmode="numeric" min="10" max="600" placeholder="Autre (s)" aria-label="Autre durée de repos en secondes" style="width:110px;flex:0 0 auto;min-height:44px" value="'+(R.indexOf(tmp.repos)<0?tmp.repos:'')+'"></div>'
          :(tmp.series<2?'<div class="est">Une seule série : pas de repos à régler.</div>':'<ul>'+Array.from({length:tmp.series-1},function(_,i){return '<li style="align-items:center"><label for="shL'+i+'" style="margin:0;color:var(--ink);font-size:15px">Après la série '+(i+1)+'</label><span style="display:flex;align-items:center;gap:6px;flex:0 0 auto"><input id="shL'+i+'" data-shl="'+i+'" type="number" inputmode="numeric" min="10" max="600" value="'+(+tmp.liste[i]||tmp.repos)+'" style="width:90px;min-height:44px"> s</span></li>'}).join('')+'</ul>'))+
        (but()==='perf'?'<div class="est" style="margin-top:10px">Avant les séries lourdes, fais 2 séries d\'échauffement légères (non comptées).</div>':'')+'<div class="est" style="margin-top:10px">Sur iPhone, le chrono ne sonne pas écran verrouillé : garde l\'écran allumé pendant le repos.</div><button class="main" id="shOk" style="margin-top:16px">C\'est parti</button><button class="lien" id="shNon" style="display:block;margin:6px auto 0">Annuler</button>';
      s.querySelectorAll('[data-shs]').forEach(function(b){b.onclick=function(){tmp.series=+b.dataset.shs;dessin()}});
      s.querySelectorAll('[data-shr]').forEach(function(b){b.onclick=function(){tmp.repos=+b.dataset.shr;dessin()}});
      s.querySelectorAll('[data-shm]').forEach(function(b){b.onclick=function(){tmp.meme=b.dataset.shm==='1';dessin()}});
      s.querySelectorAll('[data-shl]').forEach(function(i){i.onchange=function(){var v=Math.round(+i.value);if(v>=10&&v<=600)tmp.liste[+i.dataset.shl]=v;else{i.value=+tmp.liste[+i.dataset.shl]||tmp.repos;toast('Entre 10 et 600 secondes')}}});
      /* champs « Autre » : on garde la valeur sans redessiner (sinon le premier appui sur « C'est parti » est perdu) */
      var sa=$('shSAutre');if(sa){sa.oninput=function(){var v=Math.round(+sa.value);if(v>=1&&v<=12)tmp.series=v};sa.onchange=function(){var v=Math.round(+sa.value);if(!(v>=1&&v<=12)){sa.value='';toast('Entre 1 et 12 séries')}};sa.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();sa.onchange();dessin()}}}
      var ra=$('shRAutre');if(ra){ra.oninput=function(){var v=Math.round(+ra.value);if(v>=10&&v<=600)tmp.repos=v};ra.onchange=function(){var v=Math.round(+ra.value);if(!(v>=10&&v<=600)){ra.value='';toast('Entre 10 et 600 secondes')}}}
      $('shCons').onclick=function(){tmp.series=g.series;tmp.repos=g.repos;tmp.meme=true;dessin()};
      $('shOk').onclick=function(){s.querySelectorAll('[data-shl]').forEach(function(i){var v=Math.round(+i.value);if(v>=10&&v<=600)tmp.liste[+i.dataset.shl]=v});fermer(true)};$('shNon').onclick=function(){fermer(false)}}
    o.addEventListener('click',function(e){if(e.target===o)fermer(false)});o.addEventListener('keydown',function(e){if(e.key==='Escape')fermer(false)});
    dessin();var h=$('shT');h.setAttribute('tabindex','-1');h.focus()}
  function majLigne(){var l=$('cfgLigne');if(!l)return;var c=cfg();l.innerHTML='⏱ '+c.series+' séries · repos '+(c.meme?fmtS(c.repos):Array.from({length:Math.max(0,c.series-1)},function(_,i){return fmtS(reposApres(i+1))}).join(' / ')||'—')+' <button class="lien" id="cfgMod">Modifier</button>';$('cfgMod').onclick=function(){sheet()}}
  /* à l'ouverture d'un exercice : réglage demandé une fois par jour */
  S.surOuvrir(function(){majLigne();suite();if(cfg().jour!==U.cle()&&!sheetOuvert)sheet()});

  /* ===== Chrono de repos ===== */
  var ac=null,fin=0,total=0,lbl='',iv=null,dernierBip=-1,wl=null;
  function audio(){try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume()}catch(e){}}
  function bip(f,ms){try{audio();var o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f;g.gain.value=0.2;o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+ms/1000)}catch(e){}}
  /* un seul verrou d'écran à la fois (la demande est asynchrone) ; relâché à la fin de la séance */
  var wlDemande=false,finSeanceAuto=null;
  function eveil(on){try{if(on&&navigator.wakeLock&&!wl&&!wlDemande){wlDemande=true;navigator.wakeLock.request('screen').then(function(x){wlDemande=false;if(!seance&&!iv){x.release();return}wl=x;x.addEventListener('release',function(){wl=null})}).catch(function(){wlDemande=false})}if(!on&&wl){wl.release();wl=null}}catch(e){}}
  function lancer(sec,texte){audio();try{if('Notification' in window&&Notification.permission==='default'&&!store('cy.notifDemande')){store('cy.notifDemande','1');Notification.requestPermission()}}catch(e){}fin=Date.now()+sec*1000;total=sec;lbl=texte;dernierBip=-1;$('chrono').classList.remove('hide');document.body.classList.add('avecChrono');$('chLbl').textContent=texte;eveil(true);clearInterval(iv);iv=setInterval(tick,250);tick()}
  function arreter(){clearInterval(iv);iv=null;fin=0;$('chrono').classList.add('hide');$('chrono').classList.remove('fin10');document.body.classList.remove('avecChrono');if(!seance)eveil(false)}
  function tick(){var r=Math.max(0,Math.ceil((fin-Date.now())/1000));$('chT').textContent=Math.floor(r/60)+':'+String(r%60).padStart(2,'0');$('chBar').style.width=(total?(1-r/total)*100:0)+'%';var rg=$('chRing');if(rg)rg.setAttribute('stroke-dashoffset',String(total?Math.min(100,(1-r/total)*100):0));$('chrono').classList.toggle('fin10',r<=10&&r>0);
    if(r<=3&&r>0&&r!==dernierBip){dernierBip=r;bip(660,120)}
    if(r<=0){clearInterval(iv);iv=null;bip(990,500);if(navigator.vibrate)navigator.vibrate([200,100,200]);$('chT').textContent='C\'est parti !';$('chBar').style.width='100%';
      if(document.hidden){try{if('Notification' in window&&Notification.permission==='granted'&&navigator.serviceWorker)navigator.serviceWorker.ready.then(function(s){s.showNotification('CookYourself',{body:'Repos terminé : '+lbl.replace(/^Repos · /,''),icon:'icon-192.png',tag:'repos'})})}catch(e){}}
      toast('Repos terminé : c\'est parti !',2500);setTimeout(function(){if(!iv)arreter()},4000)}}
  document.addEventListener('visibilitychange',function(){if(!document.hidden&&(iv||seance)){eveil(true);if(iv)tick()}});
  /* série supprimée pendant le repos : on arrête le chrono (le libellé ne serait plus juste) */
  document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('[data-dels2]')){if(iv)arreter();suite()}});
  $('chMoins').onclick=function(){if(iv){fin-=15000;tick()}};$('chPlus').onclick=function(){if(iv){fin+=15000;total+=15;tick()}};$('chPasser').onclick=arreter;
  $('reposBtn').onclick=function(){var n=nbFaites(S.courant());lancer(reposApres(Math.max(1,n)),'Repos')};
  function nbX(k){var e=S.exo(k);return e&&e.objPerso&&e.series?e.series:cfg().series}
  function nbFaites(k){return (U.jour().series||[]).filter(function(x){return x.exo===k}).length}
  function prochain(){var L=S.liste(),c=cfg(),cur=S.courant(),i=L.indexOf(cur);for(var j=1;j<=L.length;j++){var k=L[(i+j)%L.length];if(k!==cur&&nbFaites(k)<nbX(k))return k}return null}
  function suite(){var z=$('exoSuite');if(!z)return;var k=S.courant(),c=cfg(),n=nbFaites(k),ns=nbX(k);
    if(k&&n>=ns){var p=prochain();z.innerHTML='<div style="margin-top:10px;padding:12px;border-radius:14px;background:var(--fresh2);color:var(--fresh);font-weight:600">Exercice terminé ✓ '+n+' séries</div>'+(p?'<button class="main" data-exo="'+p+'" style="margin-top:8px">Exercice suivant : '+esc(S.exo(p).nom.split(' (')[0])+'</button>':'<div class="est" style="margin-top:8px">Tous les exercices sont faits. Appuie sur « Terminer la séance » plus bas.</div>')}
    else z.innerHTML=k?'<div class="est" style="margin-top:6px">Série '+Math.min(n+1,ns)+' sur '+ns+'</div>':''}
  /* ressenti de la série (facultatif) : facile, dur, à fond. Sert à la charge conseillée. */
  function rpe(k){var z=$('chRpe');if(!z)return;var L=(U.jour().series||[]).filter(function(x){return x.exo===k}),der=L[L.length-1];if(!der){z.innerHTML='';return}
    z.innerHTML=[[1,'Facile'],[2,'Dur'],[3,'À fond']].map(function(r){return '<button data-rpe="'+r[0]+'" aria-pressed="'+(der.rpe===r[0])+'">'+r[1]+'</button>'}).join('');
    z.querySelectorAll('[data-rpe]').forEach(function(b){b.onclick=function(){der.rpe=+b.dataset.rpe;U.save();rpe(k)}})}
  function fmtSerie(x){return x?(x.kg?String(x.kg).replace('.',',')+' kg × ':'')+x.rep+(S.exo(x.exo)&&S.exo(x.exo).unite?' s':''):''}
  S.surSerie(function(k){var c=cfg(),n=nbFaites(k),ns=nbX(k),L=(U.jour().series||[]).filter(function(x){return x.exo===k});suite();seance=true;eveil(true);
    /* sans nouvelle série pendant 30 min, la séance est considérée finie : l'écran peut s'éteindre */
    clearTimeout(finSeanceAuto);finSeanceAuto=setTimeout(function(){seance=false;if(!iv)eveil(false)},30*60000);
    if(n<ns){lancer(reposApres(n),'Repos · série '+(n+1)+'/'+ns);$('chNext').innerHTML='Prochaine : <b>'+fmtSerie(L[L.length-1])+'</b>'}
    else{var p=prochain();if(p){lancer(reposApres(Math.max(1,ns-1)),'Repos · exercice suivant');$('chNext').innerHTML='Ensuite : <b>'+esc(S.exo(p).nom.split(' (')[0])+'</b>'}toast('Exercice terminé ✓',2400)}
    rpe(k)});
  /* charge conseillée : d'après la dernière séance de l'exercice et le ressenti */
  function conseillee(k){var e=S.exo(k);if(!e||!e.poids)return null;var J=U.db().jours,ks=Object.keys(J).sort().reverse(),auj=U.cle();
    for(var i=0;i<ks.length;i++){if(ks[i]===auj)continue;var L=(J[ks[i]].series||[]).filter(function(x){return x.exo===k&&x.kg>0});if(!L.length)continue;
      var best=Math.max.apply(0,L.map(function(x){return x.kg})),top=L.filter(function(x){return x.kg===best}),tout=top.length>=Math.min(cfg().series,3)&&top.every(function(x){return x.rep>=e.reps}),fond=top.filter(function(x){return x.rpe===3}).length>top.length/2;
      if(tout&&!fond)return{kg:best+(e.base?2.5:1),pq:'toutes tes séries réussies la dernière fois'};if(fond)return{kg:best,pq:'dernière séance à fond : on consolide'};return{kg:best,pq:'même charge, vise une répétition de plus'}}return null}
  S.surOuvrir(function(k){var l=$('cfgLigne'),c=conseillee(k),z=$('cfgConseil');if(!l)return;if(!z){z=document.createElement('div');z.id='cfgConseil';l.parentNode.insertBefore(z,l.nextSibling)}z.innerHTML='';if(!c)return;l=z;var b=document.createElement('button');b.className='conseille';b.type='button';b.innerHTML='Conseillé : '+String(c.kg).replace('.',',')+' kg';b.title=c.pq;b.setAttribute('aria-label','Charge conseillée : '+String(c.kg).replace('.',',')+' kilos, '+c.pq+'. Toucher pour la mettre.');b.onclick=function(){$('seKg').value=c.kg;toast(c.pq)};l.appendChild(b)});
  /* débloque le son sur iPhone au premier appui */
  document.addEventListener('touchend',function u(){audio();document.removeEventListener('touchend',u)},{once:true});

  /* données importées : on reprend les machines si elles ont changé */
  var sigM='';var av=window.CYvivant;window.CYvivant=function(){if(av)av();var s=JSON.stringify(machines());if(s!==sigM){sigM=s;appliquer()}};
  var pb=$('pBut');if(pb)pb.addEventListener('change',function(){setTimeout(appliquer,0)});
  /* animation du mouvement en tête de la fiche ; la fiche s'ouvre d'elle-même la toute première fois */
  S.surOuvrir(function(k){var f=$('exoFiche');if(!f||!window.CYanim||!CYanim.a(k)||f.querySelector('.anim'))return;f.insertAdjacentHTML('afterbegin','<div class="anim">'+CYanim.svg(k,220)+'</div>');var d=f.closest('details');if(d&&!store('cy.animVue')){d.open=true;store('cy.animVue','1')}});
  enregistrerMachines();appliquer();sigM=JSON.stringify(machines());
})();
