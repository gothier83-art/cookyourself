/* CookYourself · animations des mouvements (fiche « Comment faire le mouvement »).
   Un personnage en traits, vu de profil (ou de face), décrit par les angles de ses segments
   à 2 ou 3 images clés ; le mouvement est interpolé en JS avec un seul requestAnimationFrame partagé.
   Angles en degrés : 0 = vers le haut, 90 = vers l'avant (droite), 180 = vers le bas, 270 = vers l'arrière.
   Chaque angle donne la direction du segment, de l'articulation proche vers la lointaine (hanche → genou, épaule → coude…).
   CYanim.svg(cle, taille) → chaîne SVG (vide si inconnue) ; CYanim.a(cle) → vrai si l'animation existe. */
(function(){
  var L={tibia:30,cuisse:31,tronc:37,bras:24,avb:22,pied:9},R=7.5,COU=3;
  var DEF={x:100,y:146,tibia:180,cuisse:180,pied:90,tronc:0,bras:180,avb:180,cou:0};
  var ACC='stroke:var(--acc,#E4572E)',MAT='stroke:var(--mute,#7A6E62)',FOND='fill:var(--card,#FFFFFF)';
  function d(a){a=a*Math.PI/180;return[Math.sin(a),-Math.cos(a)]}
  function ajoute(p,a,l){var v=d(a);return[p[0]+v[0]*l,p[1]+v[1]*l]}
  function ote(p,a,l){var v=d(a);return[p[0]-v[0]*l,p[1]-v[1]*l]}
  function ang(a,b){return Math.atan2(b[0]-a[0],-(b[1]-a[1]))*180/Math.PI}
  /* deux segments dont le bout doit atteindre une cible (k = côté de la pliure) */
  function ik(p,t,l1,l2,k){var dx=t[0]-p[0],dy=t[1]-p[1],D=Math.sqrt(dx*dx+dy*dy)||.001,ux=dx/D,uy=dy/D;
    D=Math.max(Math.abs(l1-l2)+.01,Math.min(l1+l2-.001,D));var a=(l1*l1-l2*l2+D*D)/(2*D),h=Math.sqrt(Math.max(0,l1*l1-a*a));
    var e=[p[0]+ux*a-uy*h*k,p[1]+uy*a+ux*h*k];return[e,[p[0]+ux*D,p[1]+uy*D]]}

  /* ===== Matériel fixe : petites formes dessinées une fois ===== */
  function ln(x1,y1,x2,y2,w,st){return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke-width="'+(w||4)+'" stroke-linecap="round" style="'+(st||MAT)+'"/>'}
  var FIXE={
    sol:function(){return ln(4,150.5,196,150.5,2,'stroke:var(--line,#E8E0D4)')},
    banc:function(x1,x2,y){return '<rect x="'+x1+'" y="'+y+'" width="'+(x2-x1)+'" height="6" rx="3" style="'+FOND+';'+MAT+'" stroke-width="2"/>'+ln(x1+8,y+6,x1+8,150,3)+ln(x2-8,y+6,x2-8,150,3)},
    rect:function(x,y,w,h){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="3" style="'+FOND+';'+MAT+'" stroke-width="2"/>'},
    ligne:function(x1,y1,x2,y2,w){return ln(x1,y1,x2,y2,w||5)},
    barre:function(x,y,sol){return ln(x,y,x+46,y,3)+ln(x+46,y,x+46,sol||150,3)+'<circle cx="'+x+'" cy="'+y+'" r="3.5" style="fill:var(--mute,#7A6E62)"/>'},
    barres:function(x1,x2,y){return ln(x1,y,x2,y,4)+ln(x1+6,y,x1+6,150,3)+ln(x2-6,y,x2-6,150,3)},
    mur:function(x){return ln(x,-10,x,150,3,'stroke:var(--line,#E8E0D4)')},
    marche:function(x1,x2,y){return '<rect x="'+x1+'" y="'+y+'" width="'+(x2-x1)+'" height="'+(150-y)+'" rx="2" style="'+FOND+';'+MAT+'" stroke-width="2"/>'},
    poulie:function(x,y){return ln(x,y,x+14,y,3)+ln(x+14,y,x+14,150,3)+'<circle cx="'+x+'" cy="'+y+'" r="5" fill="none" style="'+MAT+'" stroke-width="2.5"/>'},
    chaise:function(x,y){return ln(x,y,x+36,y,6)+ln(x+2,y,x+2,y-46,5)+ln(x+4,y,x+4,150,3)+ln(x+32,y,x+32,150,3)},
    rail:function(x1,y1,x2,y2){return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke-width="2" stroke-dasharray="4 4" style="'+MAT+'"/>'}
  };
  /* ===== Matériel tenu : suit une articulation ===== */
  var TENU={
    disque:function(){return '<g data-k="@"><circle r="13" style="'+FOND+';'+MAT+'" stroke-width="2.5"/><circle r="3" style="fill:var(--mute,#7A6E62)"/></g>'},
    haltere:function(){return '<g data-k="@"><line x1="-7" y1="0" x2="7" y2="0" stroke-width="3" style="'+MAT+'"/><rect x="-11" y="-6" width="5" height="12" rx="1.5" style="fill:var(--mute,#7A6E62)"/><rect x="6" y="-6" width="5" height="12" rx="1.5" style="fill:var(--mute,#7A6E62)"/></g>'},
    poignee:function(){return '<g data-k="@"><circle r="3.5" style="fill:var(--mute,#7A6E62)"/></g>'},
    pad:function(){return '<g data-k="@"><rect x="-4" y="-12" width="8" height="24" rx="3" style="'+FOND+';'+MAT+'" stroke-width="2"/></g>'},
    boudin:function(){return '<g data-k="@"><circle r="5" style="'+FOND+';'+MAT+'" stroke-width="2.5"/></g>'},
    plateau:function(){return '<g data-k="@"><line x1="0" y1="-17" x2="0" y2="17" stroke-width="5" stroke-linecap="round" style="'+MAT+'"/></g>'},
    coussin:function(){return '<g data-k="@"><rect x="-9" y="-6" width="18" height="7" rx="3" style="'+FOND+';'+MAT+'" stroke-width="2"/></g>'}
  };

  /* ===== Les exercices ===== */
  var DEB={x:95,y:146};
  function m(o,b){var r={},k;for(k in b)r[k]=b[k];for(k in o)r[k]=o[k];return r}
  var A={
    squat:{nom:'squat',r:'cheville',b:m({brasR:200,avbR:-182},DEB),p:[{},{tibia:205,cuisse:95,tronc:40}],tenu:[['disque','epaule',-4,-2]],mu:['cuisse','hanche'],mat:[['sol']]},
    goblet:{nom:'squat gobelet',r:'cheville',b:m({brasR:158,avbR:-150},DEB),p:[{},{tibia:210,cuisse:93,tronc:24}],tenu:[['haltere','main',0,0,90,'abs']],mu:['cuisse','hanche'],mat:[['sol']]},
    squatpdc:{nom:'squat au poids du corps',r:'cheville',b:m({bras:90,avb:90},DEB),p:[{bras:170,avb:170},{tibia:205,cuisse:95,tronc:40,bras:88,avb:88}],mu:['cuisse','hanche'],mat:[['sol']]},
    fentes:{nom:'fentes alternées',r:'hanche',b:{x:93,tronc:0,bras:180,avb:180},p:[{y:85,cx:94,cy:146,c2x:94,c2y:146},{y:112,cx:123,cy:146,c2x:58,c2y:140,pied2:125},{y:85,cx:94,cy:146,c2x:94,c2y:146},{y:112,cx:58,cy:140,c2x:123,c2y:146,pied:125}],t:[1.6,1,1.6,1],tenu:[['haltere','main']],mu:['cuisse','hanche'],mat:[['sol']],txt:'une jambe en avant, descente puis retour, puis l\'autre jambe'},
    fentesbulg:{nom:'fentes bulgares',r:'hanche',b:{x:88,tronc:12,bras:180,avb:180,cx:116,cy:146,c2x:48,c2y:104,pied2:235},p:[{y:88},{y:113,x:86}],tenu:[['haltere','main']],mu:['cuisse','hanche'],mat:[['sol'],['banc',14,58,110]]},
    pistol:{nom:'squat sur une jambe',r:'cheville',b:m({mx:150,my:70,km:1},{x:84,y:146}),p:[{cuisse2:160,tibia2:165,pied2:70,mx:146,my:72},{tibia:216,cuisse:70,tronc:44,cuisse2:94,tibia2:94,pied2:20,mx:146,my:98}],mu:['cuisse','hanche'],mat:[['sol'],['ligne',152,14,152,150,4]]},
    souleve:{nom:'soulevé de terre',r:'cheville',b:DEB,p:[{tibia:210,cuisse:112,tronc:62},{}],t:[1,2],tenu:[['disque','main',0,0]],mu:['cuisse','hanche','tronc'],mat:[['sol']],txt:'montée puis descente contrôlée'},
    souleveh:{nom:'soulevé de terre jambes tendues',r:'cheville',b:DEB,p:[{tibia:184,cuisse:176,bras:178},{tibia:190,cuisse:138,tronc:62}],tenu:[['haltere','main']],mu:['cuisse','hanche'],mat:[['sol']],txt:'buste penché puis remontée'},
    pont:{nom:'pont fessier',r:'epaule',b:{x:58,y:141,cx:126,cy:146,bras:90,avb:90},p:[{tronc:270},{tronc:236,cou:34}],t:[1,2],h:[.3,1],mu:['hanche','cuisse'],mat:[['sol']],txt:'bassin qui monte, maintien, puis descente'},
    x_presse:{nom:'presse à cuisses',r:'hanche',b:{x:66,y:118,tronc:-58,bras:178,avb:120,pied:-42},p:[{cx:116,cy:74},{cx:98,cy:92}],tenu:[['plateau','cheville',3,-3,-42,'abs']],mu:['cuisse','hanche'],mat:[['sol'],['rail',88,112,168,32],['ligne',63,125,23,100,6],['ligne',60,125,86,125,6],['ligne',72,125,72,150,3]]},
    x_legext:{nom:'leg extension',r:'hanche',b:{x:85,y:108,tronc:-8,cuisse:90,bras:178,avb:150},p:[{tibia:178,pied:90},{tibia:92,pied:2}],t:[1,2],h:[.2,1],tenu:[['boudin','cheville',0,0,-90,'seg','tibia',7]],mu:['cuisse'],mat:[['sol'],['ligne',66,114,116,114,7],['ligne',66,112,59,62,6],['ligne',80,118,80,150,3]],txt:'jambes tendues, maintien, puis descente lente'},
    x_legcurl:{nom:'leg curl',r:'hanche',b:{x:92,y:116,tronc:270,cou:-10,bras:215,avb:262,cuisse:92},p:[{tibia:92,pied:160},{tibia:-28,pied:62}],t:[1,2],h:[.2,.5],tenu:[['boudin','cheville',0,0,-90,'seg','tibia',7]],mu:['cuisse'],mat:[['sol'],['banc',34,128,120]],txt:'talons vers les fesses puis retour lent'},
    x_mollets:{nom:'mollets debout',r:'orteil',b:{x:106,y:128},p:[{pied:66},{pied:126}],t:[1,2],h:[.2,1],tenu:[['coussin','epaule',0,-5]],mu:['tibia'],mat:[['sol'],['marche',101,150,132],['ligne',72,-2,72,150,4],['ligne',72,-2,98,-2,4]],txt:'montée sur la pointe, maintien, puis descente'},
    x_mollets_pdc:{nom:'mollets sur une marche',r:'orteil',b:{x:106,y:128,mx:134,my:58,km:1},p:[{pied:66},{pied:126}],t:[1,2],h:[.2,1],mu:['tibia'],mat:[['sol'],['marche',101,150,132],['mur',140]],txt:'montée sur la pointe, maintien, puis descente'},
    x_pistol:null,
    pompes:{nom:'pompes',r:'cheville',b:{x:47,y:140,pied:160,mx:137,my:148,km:1},p:[{tronc:66.5,cuisse:246.5,tibia:246.5},{tronc:83,cuisse:263,tibia:263}],mu:['tronc','bras','avb'],mat:[['sol']]},
    x_pompdiam:{nom:'pompes serrées',r:'cheville',b:{x:47,y:140,pied:160,mx:132,my:148,km:1},p:[{tronc:66.5,cuisse:246.5,tibia:246.5},{tronc:83,cuisse:263,tibia:263}],mu:['bras','avb','tronc'],mat:[['sol']]},
    x_pompdecl:{nom:'pompes pieds surélevés',r:'cheville',b:{x:40,y:110,pied:150,mx:137,my:148,km:1},p:[{tronc:84.7,cuisse:264.7,tibia:264.7},{tronc:98,cuisse:278,tibia:278}],mu:['tronc','epaule','bras'],mat:[['sol'],['banc',14,62,120]]},
    x_pike:{nom:'pompes piquées',r:'cheville',b:{x:52,y:141,pied:140,mx:158,my:146,km:1},p:[{cuisse:220,tibia:220,tronc:129,cou:8},{cuisse:232,tibia:232,tronc:140,cou:12}],mu:['epaule','bras'],mat:[['sol']]},
    x_poirier:{nom:'poirier contre un mur',r:'main',b:{x:110,y:146,tronc:180,pied:-90},p:[{cuisse:-3,tibia:-3},{cuisse:-5,tibia:-5,tronc:181}],t:[1.8,1.8],h:[0,0],mu:['epaule','bras','tronc'],mat:[['sol'],['mur',92]],txt:'maintien de la position'},
    gainage:{nom:'gainage',r:'cheville',b:{x:40,y:141,pied:150,bras:180,avb:90},p:[{tronc:80,cuisse:260,tibia:260},{tronc:79,cuisse:259,tibia:259}],t:[1.8,1.8],h:[0,0],mu:['tronc'],mat:[['sol']],txt:'maintien de la position'},
    x_hollow:{nom:'hollow body',r:'hanche',b:{x:104,y:141},p:[{tronc:288,bras:282,avb:282,cuisse:76,tibia:76,pied:76},{tronc:286,bras:279,avb:279,cuisse:78,tibia:78,pied:78}],t:[1.8,1.8],h:[0,0],mu:['tronc'],mat:[['sol']],txt:'maintien de la position'},
    x_crunch:{nom:'crunch',r:'hanche',b:{x:104,y:141,cuisse:35,tibia:160,brasR:28,avbR:150},p:[{tronc:270},{tronc:302}],t:[1,2],h:[.2,.4],mu:['tronc'],mat:[['sol']],txt:'buste qui s\'enroule puis redescend'},
    x_crunchp:{nom:'crunch à la poulie',r:'genou',b:{x:110,y:146,tibia:270,pied:200,cuisse:180,brasR:-25,avbR:155},p:[{tronc:20},{tronc:106,cou:15}],t:[1,2],mu:['tronc'],mat:[['sol'],['poulie',172,-6]],cable:[172,-6],tenu:[['poignee','main']],txt:'buste qui s\'enroule puis remonte'},
    x_releve:{nom:'relevé de jambes',r:'epaule',b:{x:97,y:45,mx:100,my:-2,km:-1},p:[{tronc:2},{tronc:-14,cuisse:62,tibia:168,pied:140}],t:[1,2],mu:['tronc'],mat:[['barre',100,-2]],txt:'genoux vers la poitrine puis descente lente'},
    x_russian:{nom:'rotations russes',r:'hanche',b:{x:92,y:141,tronc:-36,cuisse:58,tibia:150,pied:110},p:[{bras:100,avb:96},{bras:150,avb:160,l_bras:.75,l_avb:.55},{bras:100,avb:96},{bras:140,avb:150,l_bras:.5,l_avb:.4}],t:[.9,.9,.9,.9],h:[.1,.2,.1,.2],mu:['tronc'],mat:[['sol']],txt:'rotation d\'un côté puis de l\'autre'},
    grimpeur:{nom:'mountain climbers',r:'epaule',b:{x:138,y:103,tronc:70,mx:138,my:146,km:1,pied:160,pied2:160},p:[{cx:52,cy:140,c2x:104,c2y:136},{cx:104,cy:136,c2x:52,c2y:140}],t:[.45,.45],h:[.05,.05],mu:['tronc','cuisse'],mat:[['sol']],txt:'un genou vers la poitrine puis l\'autre, rapidement'},
    rowing:{nom:'rowing buste penché',r:'cheville',b:m({tibia:195,cuisse:155,tronc:52},DEB),p:[{bras:180,avb:180},{bras:252,avb:172}],t:[1,2],tenu:[['disque','main']],mu:['tronc','bras'],mat:[['sol']],txt:'tirage vers le nombril puis descente'},
    rowh:{nom:'rowing un bras',r:'hanche',b:{x:86,y:98,tronc:82,cuisse2:180,tibia2:270,pied2:180,cx:100,cy:146,m2x:124,m2y:128,km2:1},p:[{bras:180,avb:180},{bras:262,avb:178}],t:[1,2],tenu:[['haltere','main']],mu:['tronc','bras'],mat:[['sol'],['banc',44,134,132]],txt:'tirage vers la hanche puis descente lente'},
    tractions:{nom:'tractions',r:'epaule',b:{mx:100,my:6,km:1},p:[{x:98,y:52,tronc:3,cuisse:172,tibia:238,pied:150},{x:89,y:15,tronc:-8,cuisse:166,tibia:236,pied:150}],t:[1,2],h:[.3,.3],mu:['tronc','bras'],mat:[['barre',100,6]],txt:'montée menton au-dessus de la barre puis descente'},
    x_chin:{nom:'tractions supination',r:'epaule',b:{mx:100,my:6,km:1},p:[{x:98,y:52,tronc:3,cuisse:172,tibia:238,pied:150},{x:89,y:15,tronc:-8,cuisse:166,tibia:236,pied:150}],t:[1,2],h:[.3,.3],mu:['bras','tronc'],mat:[['barre',100,6]],txt:'montée menton au-dessus de la barre puis descente'},
    x_austr:{nom:'rowing australien',r:'cheville',b:{x:38,y:146,pied:10,mx:118,my:80,km:-1},p:[{tronc:76.5,cuisse:256.5,tibia:256.5},{tronc:62,cuisse:242,tibia:242}],t:[1,2],mu:['tronc','bras'],mat:[['sol'],['barre',118,80]],txt:'poitrine vers la barre puis descente'},
    x_tirvert:{nom:'tirage vertical',r:'hanche',b:{x:88,y:112,tronc:-10,cuisse:90,tibia:180,km:1},p:[{mx:100,my:28},{mx:98,my:72}],t:[1,2],cable:[100,-8],tenu:[['poignee','main']],mu:['tronc','bras'],mat:[['sol'],['poulie',100,-8],['ligne',66,118,112,118,7],['ligne',72,122,72,150,3],['rect',108,97,22,7]],txt:'barre vers la poitrine puis remontée lente'},
    x_tirhor:{nom:'tirage horizontal',r:'hanche',b:{x:70,y:128,cuisse:80,tibia:98,pied:5,km:1},p:[{tronc:12,mx:122,my:96},{tronc:-4,mx:88,my:110}],t:[1,2],cable:[176,128],tenu:[['poignee','main']],mu:['tronc','bras'],mat:[['sol'],['poulie',176,128],['ligne',46,134,96,134,7],['ligne',139,106,139,142,5]],txt:'poignée vers le nombril puis retour'},
    x_dc:{nom:'développé couché',r:'hanche',b:{x:100,y:108,tronc:270,cx:132,cy:146,km:1},p:[{mx:64,my:60},{mx:72,my:97}],tenu:[['disque','main']],mu:['tronc','bras'],mat:[['sol'],['banc',36,116,112]]},
    devsol:{nom:'développé haltères au sol',r:'hanche',b:{x:102,y:141,tronc:270,cx:126,cy:146,km:1},p:[{mx:66,my:94},{mx:74,my:125}],tenu:[['haltere','main']],mu:['tronc','bras'],mat:[['sol']]},
    x_dih:{nom:'développé incliné',r:'hanche',b:{x:100,y:108,tronc:300,cx:134,cy:146,km:1},p:[{mx:73,my:42},{mx:80,my:82}],tenu:[['haltere','main']],mu:['tronc','epaule'],mat:[['sol'],['ligne',90,114,118,114,6],['ligne',98,114,42,82,6],['ligne',106,116,106,150,3],['ligne',56,92,56,150,3]]},
    x_pecdeck:{nom:'pec deck',vue:'face',r:'hanche',b:{x:100,y:110,tronc:0,cuisse:178,l_cuisse:.3,tibia:180,pied:130,l_pied:.5,bras:90,avb:0},p:[{l_bras:1},{l_bras:-.45}],t:[1,2],tenu:[['pad','main',0,6],['pad','main2',0,6]],mu:['tronc'],mat:[['sol'],['rect',86,58,28,56]],txt:'bras qui se referment devant puis s\'ouvrent'},
    x_dipsm:{nom:'dips',r:'epaule',b:{mx:100,my:74,km:1,cuisse:172,tibia:232,pied:150},p:[{x:97,y:30,tronc:12},{x:104,y:52,tronc:28}],mu:['tronc','bras'],mat:[['sol'],['barres',62,138,78]]},
    x_dipsb:{nom:'dips aux barres parallèles',r:'epaule',b:{mx:100,my:74,km:1,cuisse:172,tibia:232,pied:150},p:[{x:97,y:30,tronc:12},{x:104,y:52,tronc:28}],mu:['tronc','bras'],mat:[['sol'],['barres',62,138,78]]},
    dips:{nom:'dips sur banc',r:'epaule',b:{mx:74,my:111,km:1,cx:128,cy:146,tronc:2,pied:50},p:[{x:77,y:68},{x:79,y:91}],mu:['bras','tronc'],mat:[['sol'],['banc',24,80,116]]},
    militaire:{nom:'développé militaire',r:'cheville',b:m({km:1},DEB),p:[{mx:104,my:47},{mx:97,my:3}],t:[1,2],tenu:[['disque','main']],mu:['epaule','bras'],mat:[['sol']],txt:'poussée au-dessus de la tête puis descente'},
    epaulesh:{nom:'développé épaules assis',r:'hanche',b:{x:90,y:112,tronc:0,cuisse:90,tibia:180,km:1},p:[{mx:97,my:66},{mx:93,my:29}],t:[1,2],tenu:[['haltere','main']],mu:['epaule','bras'],mat:[['sol'],['chaise',70,117]],txt:'poussée au-dessus de la tête puis descente'},
    x_epm:{nom:'développé épaules à la machine',r:'hanche',b:{x:88,y:112,tronc:-4,cuisse:90,tibia:180,km:1},p:[{mx:99,my:66},{mx:97,my:31}],t:[1,2],tenu:[['poignee','main']],mu:['epaule','bras'],mat:[['sol'],['ligne',66,118,112,118,7],['ligne',68,116,62,56,6],['ligne',76,122,76,150,3],['rail',104,10,104,80]],txt:'poussée vers le haut puis descente lente'},
    x_elevlat:{nom:'élévations latérales',vue:'face',r:'hanche',b:{x:100,y:85,tronc:0,cuisse:177,tibia:180,pied:130,l_pied:.5},p:[{bras:172,avb:170},{bras:92,avb:88}],t:[1,2],tenu:[['haltere','main'],['haltere','main2']],mu:['epaule'],mat:[['sol']],txt:'bras qui montent sur les côtés puis redescendent'},
    x_facepull:{nom:'face pull',r:'cheville',b:m({km:-1},{x:88,y:146}),p:[{mx:132,my:44},{mx:104,my:35}],t:[1,2],cable:[166,40],tenu:[['poignee','main']],mu:['epaule','tronc'],mat:[['sol'],['poulie',166,40]],txt:'corde vers le front puis retour'},
    x_curl:{nom:'curl biceps',r:'cheville',b:m({bras:172},DEB),p:[{avb:178},{avb:14}],t:[1,2],tenu:[['haltere','main']],mu:['bras'],mat:[['sol']],txt:'montée vers les épaules puis descente lente'},
    x_marteau:{nom:'curl marteau',r:'cheville',b:m({bras:172},DEB),p:[{avb:178},{avb:14}],t:[1,2],tenu:[['haltere','main']],mu:['bras','avb'],mat:[['sol']],txt:'montée sans tourner les poignets puis descente'},
    x_triceps:{nom:'extension triceps à la poulie',r:'cheville',b:m({tronc:8,bras:172},{x:90,y:146}),p:[{avb:84},{avb:178}],t:[1,2],cable:[150,-6],tenu:[['poignee','main']],mu:['bras'],mat:[['sol'],['poulie',150,-6]],txt:'bras tendus vers le bas puis retour à 90°'},
    x_tricepsh:{nom:'extension triceps au-dessus de la tête',r:'cheville',b:m({bras:8},DEB),p:[{avb:6},{avb:198}],tenu:[['haltere','main',0,0,90,'abs']],mu:['bras'],mat:[['sol']],txt:'descente derrière la nuque puis remontée'}
  };
  A.x_pistol=A.pistol;delete A.pistol;
  A.x_fentesbulg=A.fentesbulg;delete A.fentesbulg;
  /* « tractions » du programme : même geste que la bibliothèque ; « x_dipsm » idem barres. */

  /* ===== Calcul des points d'une pose ===== */
  function lg(p,s){var f=p['l_'+s];return L[s]*(f==null?1:f)}
  function points(e,p){var P={},r=e.r||'hanche',x=[p.x,p.y];
    if(p.brasR!=null)p.bras=p.tronc+p.brasR;if(p.avbR!=null)p.avb=p.bras+p.avbR;
    if(r==='orteil'){P.orteil=x;P.cheville=ote(x,p.pied,lg(p,'pied'))}
    if(r==='orteil'||r==='cheville'){if(!P.cheville)P.cheville=x;P.genou=ote(P.cheville,p.tibia,lg(p,'tibia'));P.hanche=ote(P.genou,p.cuisse,lg(p,'cuisse'))}
    if(r==='genou'){P.genou=x;P.hanche=ote(x,p.cuisse,lg(p,'cuisse'))}
    if(r==='main'){P.main=x;P.coude=ote(x,p.avb,lg(p,'avb'));P.epaule=ote(P.coude,p.bras,lg(p,'bras'));P.hanche=ote(P.epaule,p.tronc,lg(p,'tronc'))}
    if(r==='epaule'){P.epaule=x;P.hanche=ote(x,p.tronc,lg(p,'tronc'))}
    if(r==='hanche')P.hanche=x;
    if(!P.epaule)P.epaule=ajoute(P.hanche,p.tronc,lg(p,'tronc'));
    P.tete=ajoute(P.epaule,p.tronc+p.cou,COU+R);
    var face=e.vue==='face',H=P.hanche,S=P.epaule;
    function bras(cote){var s=cote?'2':'',sg=cote&&face?-1:1,sh=face?[S[0]+(cote?-12:12),S[1]+2]:S,
        mx=p['m'+s+'x']!=null?[p['m'+s+'x'],p['m'+s+'y']]:(cote&&!face&&p.mx!=null?[p.mx,p.my]:null),c,mn;
      if(mx){var q=ik(sh,mx,lg(p,'bras'),lg(p,'avb'),(e.b['km'+s]!=null?e.b['km'+s]:e.b.km)||1);c=q[0];mn=q[1]}
      else{var b=p['bras'+s]!=null?p['bras'+s]:p.bras,a=p['avb'+s]!=null?p['avb'+s]:p.avb;c=ajoute(sh,sg*b,lg(p,'bras'));mn=ajoute(c,sg*a,lg(p,'avb'))}
      P['epaule'+(s||'1')]=sh;P['coude'+s]=c;P['main'+s]=mn}
    function jambe(cote){var s=cote?'2':'',sg=cote&&face?-1:1,hp=face?[H[0]+(cote?-7:7),H[1]]:H,k,c,
        cx=p['c'+s+'x']!=null?[p['c'+s+'x'],p['c'+s+'y']]:(cote&&!face&&p.cx!=null?[p.cx,p.cy]:null);
      if(!cote&&!face&&(r==='cheville'||r==='orteil'||r==='genou')){P.hanche1=H;if(!P.cheville)P.cheville=ajoute(P.genou,p.tibia,lg(p,'tibia'));if(!P.orteil)P.orteil=ajoute(P.cheville,p.pied,lg(p,'pied'));return}
      if(cx){var q=ik(hp,cx,lg(p,'cuisse'),lg(p,'tibia'),-1);k=q[0];c=q[1]}
      else{var cu=p['cuisse'+s]!=null?p['cuisse'+s]:p.cuisse,ti=p['tibia'+s]!=null?p['tibia'+s]:p.tibia;k=ajoute(hp,sg*cu,lg(p,'cuisse'));c=ajoute(k,sg*ti,lg(p,'tibia'))}
      var pi=p['pied'+s]!=null?p['pied'+s]:p.pied;
      P['hanche'+(s||'1')]=hp;P['genou'+s]=k;P['cheville'+s]=c;P['orteil'+s]=ajoute(c,sg*pi,lg(p,'pied'))}
    jambe(0);bras(0);jambe(1);bras(1);
    if(face){P.hanche1=[H[0]+7,H[1]]}
    return P}
  var SEG=[['cuisse2','hanche2','genou2'],['tibia2','genou2','cheville2'],['pied2','cheville2','orteil2'],['bras2','epaule2','coude2'],['avb2','coude2','main2'],
    ['tronc','hanche','epaule'],['cuisse','hanche1','genou'],['tibia','genou','cheville'],['pied','cheville','orteil'],['bras','epaule1','coude'],['avb','coude','main']];
  var EP={tronc:8.5,pied:6};

  /* ===== Temps : images clés, durées, maintiens ===== */
  function poses(e){if(e._p)return e._p;e._p=e.p.map(function(p){var q={},k;for(k in DEF)q[k]=DEF[k];for(k in e.b)q[k]=e.b[k];for(k in p)q[k]=p[k];return q});return e._p}
  function durees(e){var n=e.p.length,t=e.t||(n===2?[2,1]:[]),h=e.h||[];var o=[];for(var i=0;i<n;i++)o.push({h:h[i]!=null?h[i]:.25,t:t[i]!=null?t[i]:1.5});return o}
  function cycle(e){return durees(e).reduce(function(s,x){return s+x.h+x.t},0)}
  function doux(u){return u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2}
  function pose(e,s){var P=poses(e),D=durees(e),n=P.length;s=s%cycle(e);
    for(var i=0;i<n;i++){if(s<D[i].h)return P[i];s-=D[i].h;if(s<D[i].t){var u=doux(s/D[i].t),a=P[i],b=P[(i+1)%n],q={},k;
        for(k in a)q[k]=typeof a[k]==='number'&&typeof b[k]==='number'?a[k]+(b[k]-a[k])*u:a[k];return q}s-=D[i].t}
    return P[0]}
  function copie(o){var q={},k;for(k in o)q[k]=o[k];return q}

  /* ===== Dessin ===== */
  function f1(v){return Math.round(v*10)/10}
  function rendu(e,P,p){var o={},i;
    SEG.forEach(function(s){var a=P[s[1]],b=P[s[2]];if(a&&b)o[s[0]]=[a,b]});
    o.tete=P.tete;o.hanche=P.hanche;o.epaule=P.epaule;o.epaule1=P.epaule1;o.epaule2=P.epaule2;
    (e.tenu||[]).forEach(function(t,j){var j0=P[t[1]],x=t[2]||0,y=t[3]||0,rot=0;if(!j0)return;
      if(t[5]==='seg'){var sg=t[6],a2=p[sg]!=null?p[sg]:0,pp=ajoute(j0,a2+t[4],t[7]);o['@'+j]=[pp[0],pp[1],0];return}
      /* rot : 'abs' = angle fixe ; sinon, sur la main, perpendiculaire à l'avant-bras (+ décalage) */
      if(t[5]==='abs')rot=t[4]||0;else if(t[1]==='main'||t[1]==='main2')rot=(t[1]==='main2'?ang(P.coude2,P.main2):ang(P.coude,P.main))+(t[4]||0);
      o['@'+j]=[j0[0]+x,j0[1]+y,rot]});
    if(e.cable)o.cable=[e.cable,P.main];
    return o}
  function appliquer(el,o){var refs=el._r;for(var k in refs){var n=refs[k],v=o[k];if(!v)continue;
    if(k==='tete'||k==='hanche'||k.indexOf('epaule')===0){n.setAttribute('cx',f1(v[0]));n.setAttribute('cy',f1(v[1]))}
    else if(k.charAt(0)==='@')n.setAttribute('transform','translate('+f1(v[0])+' '+f1(v[1])+') rotate('+f1(v[2])+')');
    else{n.setAttribute('x1',f1(v[0][0]));n.setAttribute('y1',f1(v[0][1]));n.setAttribute('x2',f1(v[1][0]));n.setAttribute('y2',f1(v[1][1]))}}}
  function ligneSeg(k,v,st,w,op){return '<line data-k="'+k+'" x1="'+f1(v[0][0])+'" y1="'+f1(v[0][1])+'" x2="'+f1(v[1][0])+'" y2="'+f1(v[1][1])+'" stroke-width="'+w+'" stroke-linecap="round"'+(st?' style="'+st+'"':' stroke="currentColor"')+(op?' opacity="'+op+'"':'')+'/>'}
  function construire(e,p,cle,taille,anime){var P=points(e,p),o=rendu(e,P,p),mu={},face=e.vue==='face',h='';
    (e.mu||[]).forEach(function(x){mu[x]=1});
    function seg(k){var v=o[k];if(!v)return '';var base=k.replace('2',''),w=EP[base]||7,loin=k!==base&&!face;
      return ligneSeg(k,v,mu[base]?ACC:'',w,loin?'.35':'')}
    (e.mat||[]).forEach(function(x){h+=FIXE[x[0]].apply(null,x.slice(1))});
    if(o.cable)h+=ligneSeg('cable',o.cable,MAT,1.6,'');
    ['cuisse2','tibia2','pied2','bras2','avb2'].forEach(function(k){h+=seg(k)});
    var av='',ar='';(e.tenu||[]).forEach(function(t,j){var v=o['@'+j]||[0,0,0],s=TENU[t[0]]().replace('"@"','"@'+j+'" transform="translate('+f1(v[0])+' '+f1(v[1])+') rotate('+f1(v[2])+')"');if(t[0]==='disque'||t[0]==='coussin'||t[0]==='pad')ar+=s;else av+=s});
    h+=ar+seg('tronc');
    if(face)h+=ligneSeg('epx',[P.epaule2,P.epaule1],mu.tronc?ACC:'',7,'')+ligneSeg('hax',[P.hanche2,P.hanche1],'',7,'');
    h+='<circle data-k="tete" cx="'+f1(o.tete[0])+'" cy="'+f1(o.tete[1])+'" r="'+R+'" fill="currentColor"/>';
    if(mu.hanche)h+='<circle data-k="hanche" cx="'+f1(o.hanche[0])+'" cy="'+f1(o.hanche[1])+'" r="6" style="fill:var(--acc,#E4572E)"/>';
    (face?['epaule1','epaule2']:['epaule']).forEach(function(k){if(mu.epaule)h+='<circle data-k="'+k+'" cx="'+f1(o[k][0])+'" cy="'+f1(o[k][1])+'" r="6" style="fill:var(--acc,#E4572E)"/>'});
    ['cuisse','tibia','pied','bras','avb'].forEach(function(k){h+=seg(k)});
    h+=av;
    var w=taille||220,ht=Math.round(w*172/200),lab='Animation : '+e.nom+', '+(e.txt||'descente puis remontée');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -12 200 172" width="'+w+'" height="'+ht+'" role="img" aria-label="'+lab.replace(/"/g,'&quot;')+'"'+(anime?' data-cyanim="'+cle+'"':'')+' fill="none" style="color:var(--ink,#1C1712);max-width:100%;height:auto"><title>'+lab+'</title>'+h+'</svg>'}

  /* ===== Boucle partagée ===== */
  var VUS=[],tourne=false,io=null,mq=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):null;
  function reduit(){return !!(mq&&mq.matches)}
  function boucle(now){var actif=false;VUS=VUS.filter(function(x){return x.el.isConnected});
    if(!reduit())VUS.forEach(function(x){if(!x.vu)return;actif=true;var e=A[x.cle],p=copie(pose(e,(now-x.t0)/1000)),P=points(e,p);appliquer(x.el,rendu(e,P,p))});
    tourne=actif;if(actif)requestAnimationFrame(boucle)}
  function relancer(){if(!tourne&&!reduit()&&VUS.some(function(x){return x.vu})){tourne=true;requestAnimationFrame(boucle)}}
  function scanner(){var l=document.querySelectorAll('svg[data-cyanim]:not([data-cyon])');
    for(var i=0;i<l.length;i++){var el=l[i],r={},n=el.querySelectorAll('[data-k]');el.setAttribute('data-cyon','1');
      for(var j=0;j<n.length;j++)r[n[j].getAttribute('data-k')]=n[j];el._r=r;
      var x={el:el,cle:el.getAttribute('data-cyanim'),vu:!('IntersectionObserver' in window),t0:performance.now()};el._x=x;VUS.push(x);
      if(!x.vu){if(!io)io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.target._x)en.target._x.vu=en.isIntersecting});relancer()});io.observe(el)}}
    relancer()}
  if(mq&&mq.addEventListener)mq.addEventListener('change',function(){if(reduit())VUS.forEach(function(x){var e=A[x.cle],p=copie(poses(e)[e.fige!=null?e.fige:1]);appliquer(x.el,rendu(e,points(e,p),p))});else relancer()});

  window.CYanim={
    a:function(k){return !!A[k]},
    cles:function(){return Object.keys(A)},
    /* o.pose = numéro d'image clé pour un dessin figé (planche de vérification) */
    svg:function(k,taille,o){var e=A[k];if(!e)return '';var fixe=o&&o.pose!=null,i=fixe?o.pose:(reduit()?(e.fige!=null?e.fige:1):0);
      var p=copie(poses(e)[Math.min(i,e.p.length-1)]);if(!fixe&&typeof requestAnimationFrame==='function')requestAnimationFrame(scanner);
      return construire(e,p,k,taille,!fixe)}
  };
})();
