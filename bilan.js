/* CookYourself · Bilan : sommeil, objectif, graphiques jour par jour (sommeil, eau, calories, poids, charges),
   évolution par exercice, conseils du coach (règles simples sur tes propres données) et repas adaptés à l'objectif.
   Tout est calculé sur le téléphone. Ce ne sont pas des avis médicaux. */
(function(){
  var U=window.UnGeste,O=window.CYobj;if(!U||!O)return;
  function $(i){return document.getElementById(i)}
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function toast(t){var e=$('toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(function(){e.classList.remove('on')},1800)}
  function v(n,d){return (Math.round(n*Math.pow(10,d||0))/Math.pow(10,d||0)).toString().replace('.',',')}
  function cle(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
  function jours(n,dec){var r=[],t=new Date();for(var i=n-1+(dec||0);i>=(dec||0);i--){var d=new Date(t.getFullYear(),t.getMonth(),t.getDate()-i);r.push(cle(d))}return r}
  function dm(k){return k.slice(8)+'/'+k.slice(5,7)}
  function dk(k){return new Date(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8))}
  function hm(h){var m=Math.round(h*60);return Math.floor(m/60)+' h'+(m%60?' '+String(m%60).padStart(2,'0'):'')}
  function moy(a){a=a.filter(function(x){return x!=null&&!isNaN(x)});return a.length?a.reduce(function(s,x){return s+x},0)/a.length:null}
  function nb(a){return a.filter(function(x){return x!=null}).length}
  function D(){return U.db()}
  function cache(){return !!D().reglages.cache}
  function objMl(){var r=D().reglages;return r.eauMl||(r.eau||8)*250}

  /* ===== Mesures par jour ===== */
  function J(k){return D().jours[k]}
  function eau(k){var j=J(k);if(!j)return null;var m=j.ml!=null?j.ml:(j.eau||0)*250;return m>0?m:null}
  function dodo(k){var j=J(k);return j&&j.sommeil&&j.sommeil.h>0?j.sommeil.h:null}
  function kcal(k){var j=J(k);if(!j)return null;var t=0;(j.repas||[]).forEach(function(x){if(x.kcal)t+=x.kcal});return t>0?t:null}
  function poids(k){var L=D().poidsLog||[];for(var i=0;i<L.length;i++)if(L[i].d===k)return L[i].kg;return null}
  var PDC={pompes:.65,x_pompdecl:.7,x_pompdiam:.65,x_pike:.7,tractions:1,x_chin:1,x_austr:.5,x_dipsb:1,x_dipsm:1,dips:.7,squatpdc:.7,x_pistol:.9,fentes:.7,x_fentesbulg:.8,pont:.5,x_mollets_pdc:1,x_crunch:.3,x_releve:.35};
  function volume(k){var j=J(k);if(!j||!(j.series||[]).length)return null;var t=0,bw=D().reglages.poids||75,S=window.CYsport;j.series.forEach(function(s){var e=S&&S.exo(s.exo);if(e&&e.unite==='s')return;t+=(s.kg?s.kg:bw*(PDC[s.exo]||0))*(s.rep||0)});return Math.round(t)}
  function nomExo(k){var S=window.CYsport,e=S&&S.exo(k);return e?e.nom.split(' (')[0]:'Exercice'}
  /* indice de force du jour : meilleure série (1RM estimée, ou répétitions sans charge) divisée par la médiane de l'exercice */
  var PERF=null;
  function perf(){if(PERF)return PERF;var par={},Js=D().jours;Object.keys(Js).forEach(function(k){(Js[k].series||[]).forEach(function(s){if(!s.rep)return;var sc=s.kg?s.kg*(1+Math.min(s.rep,12)/30):s.rep;var p=par[s.exo]||(par[s.exo]={});
      if(!p[k]||sc>p[k].sc)p[k]={sc:sc,kg:s.kg||0,rep:s.rep}})});
    var idx={};Object.keys(par).forEach(function(e){var ks=Object.keys(par[e]);if(ks.length<2)return;var t=ks.map(function(k){return par[e][k].sc}).sort(function(a,b){return a-b}),med=t[Math.floor(t.length/2)];
      ks.forEach(function(k){(idx[k]=idx[k]||[]).push(par[e][k].sc/med)})});
    var I={};Object.keys(idx).forEach(function(k){I[k]=moy(idx[k])});PERF={par:par,idx:I};return PERF}

  /* ===== Objectif et besoins ===== */
  function cibleKcal(){try{return window.CYkcal?window.CYkcal():null}catch(e){return null}}
  function protJour(){var kg=D().reglages.poids||75,t=+(D().profil||{}).taille;if(t>100&&kg/Math.pow(t/100,2)>30)kg=25*Math.pow(t/100,2);return Math.round(O.GOAL[O.but()].prot*kg)}
  function carteObjectif(){var b=O.but(),g=O.GOAL[b],k=cibleKcal();
    if(!O.choisi()||enChoix)return choixObjectif()+(enChoix&&O.choisi()?'<button class="lien" id="goalNon" style="margin-top:6px">Annuler : garder « '+esc(g.nom)+' »</button>':'');
    return '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><div class="lbl">Ton objectif</div><div class="titre" style="font-size:20px">'+g.ic+' '+g.nom+'</div></div><button class="lien" id="goalMod">Changer</button></div>'+
      '<div class="est" style="margin-top:4px">'+g.plan+'</div><div class="chiffres">'+
      (cache()?'':'<span><b>'+(k?v(k):'—')+'</b> kcal / jour'+(k?'':' <button class="lien" data-v="regl">profil</button>')+'</span><span><b>'+protJour()+' g</b> protéines</span>')+'<span><b>'+g.series+' × '+g.reps+'</b> repos '+(g.repos<60?g.repos+' s':v(g.repos/60,1)+' min')+'</span></div><div class="est" style="margin-top:8px;font-size:13px">Enceinte, malade, mineur ou relation difficile avec la nourriture : demande d\'abord conseil à un médecin.</div>'}
  var enChoix=false;
  function fragile(){var p=D().profil||{},a=+p.age,t=+p.taille,kg=D().reglages.poids;return (a&&a<18)||(t>100&&kg/Math.pow(t/100,2)<18.5)}
  function choixObjectif(){var f=fragile();return '<div class="lbl" style="font-weight:600;color:var(--ink)">Quel est ton objectif ?</div><div class="est" style="margin:2px 0 8px">Ton coach adapte tes repas, tes séries et tes temps de repos.</div><div class="objg">'+['perf','masse','poids','graisse'].map(function(x){var off=f&&(x==='poids'||x==='graisse');return '<button data-goal="'+x+'"'+(off?' disabled aria-disabled="true" style="opacity:.45"':'')+'><span aria-hidden="true">'+O.GOAL[x].ic+'</span> '+O.GOAL[x].nom+'</button>'}).join('')+'</div>'+(f?'<div class="est" style="margin-top:8px">Perdre du poids n\'est pas proposé : ton profil indique un âge de moins de 18 ans ou un poids déjà bas. Parles-en à un médecin.</div>':'')}

  /* ===== Conseils du coach ===== */
  function conseils(){var L=[],b=O.but(),g=O.GOAL[b],P=perf(),w7=jours(7),w14=jours(7,7),w28=jours(21,7);
    var s7=w7.map(dodo),s14=w14.map(dodo),e7=w7.map(eau),e14=w14.map(eau),i7=w7.map(function(k){return P.idx[k]==null?null:P.idx[k]}),iP=w28.map(function(k){return P.idx[k]==null?null:P.idx[k]});
    var ms7=moy(s7),ms14=moy(s14),me7=moy(e7),me14=moy(e14),mi7=moy(i7),miP=moy(iP),obj=objMl();
    var dSom=(nb(s7)>=3&&nb(s14)>=3)?ms7-ms14:null,dEau=(nb(e7)>=3&&nb(e14)>=3)?(me7-me14)/me14:null;
    /* 1. performances et leurs causes */
    if(nb(i7)>=3&&nb(iP)>=3){var dp=(mi7-miP)/miP;
      if(dp<=-0.05){var c=[];if(dSom!=null&&dSom<=-0.4)c.push('tu dors '+hm(-dSom)+' de moins');if(dEau!=null&&dEau<=-0.12)c.push('tu bois '+Math.round(-dEau*100)+' % d\'eau en moins');if(ms7!=null&&ms7<6.5&&!c.length)c.push('tes nuits sont courtes ('+hm(ms7)+' en moyenne)');
        L.push({p:100,ic:'📉',t:'Tes performances baissent : −'+Math.round(-dp*100)+'\u00a0%',d:c.length?'Cette semaine, '+c.join(' et ')+' par rapport à la semaine d\'avant. Ça suffit souvent à faire baisser la force et les répétitions. Priorité : '+(c[0].indexOf('dors')>=0||c[0].indexOf('nuits')>=0?'te coucher 30 min plus tôt':'boire un grand verre à chaque repas')+'.':((b==='poids'||b==='graisse')?'Tu manges moins pour ton objectif : une légère baisse est normale. Garde les charges, quitte à faire une répétition de moins. ':'')+'Rien d\'anormal dans ton sommeil ni ton eau. Si ça dure, fais une semaine plus légère (environ 20 % de charge en moins) pour récupérer, puis reprends.',a:c.length?['Noter mon sommeil','jour']:null})}
      else if(dp>=0.05)L.push({p:60,ic:'📈',t:'Tes performances montent : +'+Math.round(dp*100)+'\u00a0%',d:'Par rapport à tes 3 semaines précédentes. '+(ms7&&ms7>=7?'Ton sommeil ('+hm(ms7)+' en moyenne) y est pour quelque chose. ':'')+'Continue comme ça.'})}
    /* 2. lien sommeil → performance, sur tout l'historique */
    var court=[],bon=[];Object.keys(P.idx).forEach(function(k){var s=dodo(k);if(s==null)return;if(s<6.5)court.push(P.idx[k]);else if(s>=7)bon.push(P.idx[k])});
    if(court.length>=2&&bon.length>=2){var r=(moy(court)-moy(bon))/moy(bon);if(r<=-0.04)L.push({p:85,ic:'😴',t:'Après une nuit courte, tu es moins fort',d:'Après moins de 6 h 30 de sommeil, tes séries sont '+Math.round(-r*100)+' % moins bonnes qu\'après 7 h ou plus (sur '+(court.length+bon.length)+' séances). Les jours de grosse séance, protège ta nuit.'})}
    /* 3. eau */
    if(dEau!=null&&dEau<=-0.15)L.push({p:80,ic:'💧',t:'Tu bois moins d\'eau depuis une semaine',d:'En moyenne '+v(me7/1000,1)+' L par jour, contre '+v(me14/1000,1)+' L la semaine d\'avant ('+Math.round(dEau*100)+' %). Même un peu de déshydratation réduit la force et l\'endurance.',a:['Activer des rappels','regl']});
    else if(nb(e7)>=3&&me7<obj*0.75)L.push({p:65,ic:'💧',t:'Ton eau est sous ton objectif',d:'En moyenne '+v(me7/1000,1)+' L par jour pour un objectif de '+v(obj/1000,1)+' L. Astuce : un verre au réveil, un à chaque repas, une gourde pendant la séance.',a:['Activer des rappels','regl']});
    /* 4. sommeil */
    if(nb(s7)>=3){if(ms7<7)L.push({p:dSom!=null&&dSom<=-0.5?82:70,ic:'🌙',t:'Tu dors '+hm(ms7)+' en moyenne',d:(dSom!=null&&dSom<=-0.4?'C\'est '+hm(-dSom)+' de moins que la semaine d\'avant. ':'')+'Vise 7 à 9 h : c\'est pendant le sommeil que le muscle se répare'+(b==='graisse'||b==='poids'?', et un manque de sommeil augmente la faim.':'.')})}
    else L.push({p:30,ic:'🌙',t:'Note ton sommeil chaque matin',d:'En 5 secondes sur l\'accueil. Après quelques jours, je pourrai te montrer comment il joue sur tes séances.',a:['Noter mon sommeil','jour']});
    /* 5. stagnation et records, par exercice avec charge */
    Object.keys(P.par).forEach(function(e){var p=P.par[e],ks=Object.keys(p).sort();if(ks.length<3)return;var l3=ks.slice(-3).map(function(k){return p[k]});
      if(l3[0].kg>0&&l3.every(function(x){return x.kg===l3[0].kg&&x.rep<=l3[0].rep}))L.push({p:55,ic:'🧱',t:nomExo(e)+' : même charge depuis 3 séances',d:'Tu bloques à '+v(l3[0].kg,1)+' kg. Essaie d\'ajouter 1 répétition à chaque série, puis +2,5 kg quand tu fais toutes tes séries en haut de la fourchette ('+g.reps+'). Si ça bloque encore, regarde ton sommeil et tes calories.'});
      var last=ks[ks.length-1];if(w7.indexOf(last)>=0){var avant=ks.slice(0,-1).map(function(k){return p[k].sc});if(p[last].sc>Math.max.apply(0,avant))L.push({p:58,ic:'🏆',t:'Record sur '+nomExo(e),d:(p[last].kg?v(p[last].kg,1)+' kg × '+p[last].rep:p[last].rep+' répétitions')+' le '+dm(last)+'. Bravo !'})}});
    /* 6. calories et objectif */
    var k7=w7.map(function(k){var j=J(k);return j&&(j.repas||[]).filter(function(x){return x.kcal}).length>=3?kcal(k):null}),mk=moy(k7),ck=cibleKcal();
    if(ck&&nb(k7)>=3&&!cache()){if(b==='masse'&&mk<ck-250)L.push({p:75,ic:'🍽️',t:'Tu manges trop peu pour prendre de la masse',d:'En moyenne '+v(mk)+' kcal par jour noté, pour un objectif de '+v(ck)+'. Ajoute une collation de 300 à 400 kcal (fromage blanc, flocons d\'avoine, banane, poignée de noix).',a:['Voir des recettes','recettes']});
      else if((b==='poids'||b==='graisse')&&mk>ck+200)L.push({p:70,ic:'🍽️',t:'Tu es au-dessus de ton objectif de calories',d:'En moyenne '+v(mk)+' kcal par jour noté, pour '+v(ck)+'. Choisis des plats « protéiné et léger » : ils calent sans trop de calories.',a:['Voir des recettes','recettes']});
      else if((b==='poids'||b==='graisse')&&mk<ck-600)L.push({p:72,ic:'⚠️',t:'Ton déficit est trop fort',d:'En moyenne '+v(mk)+' kcal par jour noté, pour '+v(ck)+'. Trop peu manger fait perdre du muscle et baisser tes séances. Remonte doucement.'});
      else if(b==='perf'&&mk<ck-300)L.push({p:68,ic:'🍝',t:'Mange un peu plus les jours de séance',d:'En moyenne '+v(mk)+' kcal pour '+v(ck)+'. Un repas avec féculents 2 à 3 h avant la séance aide à pousser plus lourd.',a:['Voir des recettes','recettes']})}
    /* 7. tendance du poids */
    var PL=(D().poidsLog||[]).filter(function(x){return x.d>=jours(28)[0]});if(PL.length>=3&&!cache()){var t0=dk(PL[0].d),pts=PL.map(function(x){return[Math.round((dk(x.d)-t0)/864e5),x.kg]}),n=pts.length,sx=0,sy=0,sxy=0,sxx=0;pts.forEach(function(q){sx+=q[0];sy+=q[1];sxy+=q[0]*q[1];sxx+=q[0]*q[0]});
      var den=n*sxx-sx*sx,pente=den?(n*sxy-sx*sy)/den*7:0,span=pts[n-1][0],kg=PL[n-1].kg;
      if(span>=10){if(b==='masse'&&pente<0.1)L.push({p:66,ic:'⚖️',t:'Ton poids ne monte pas',d:'Environ '+(pente>=0?'+':'')+v(pente,2)+' kg par semaine. Pour prendre de la masse, vise +0,2 à +0,4 kg par semaine : ajoute environ 150 kcal par jour.'});
        else if(b==='masse'&&pente>0.5)L.push({p:64,ic:'⚖️',t:'Tu prends du poids un peu vite',d:'Environ +'+v(pente,2)+' kg par semaine : au-delà de 0,5 kg, c\'est surtout du gras. Retire 150 kcal par jour.'});
        else if((b==='poids'||b==='graisse')&&pente>0.05)L.push({p:66,ic:'⚖️',t:'Ton poids remonte',d:'Environ +'+v(pente,2)+' kg par semaine. Vérifie les boissons sucrées et les grignotages, et note tous tes repas pendant 3 jours.'});
        else if((b==='poids'||b==='graisse')&&pente<-kg*0.01)L.push({p:64,ic:'⚖️',t:'Tu perds du poids très vite',d:'Environ '+v(pente,2)+' kg par semaine (plus de 1 % de ton poids). Garde un rythme de 0,5 % pour ne pas perdre de muscle.'});
        else if((b==='poids'||b==='graisse')&&pente<0)L.push({p:50,ic:'✅',t:'Tu perds du poids au bon rythme',d:'Environ '+v(pente,2)+' kg par semaine. C\'est durable : continue.'})}}
    else if(PL.length<3&&!cache()&&(b==='poids'||b==='graisse'||b==='masse'))L.push({p:35,ic:'⚖️',t:'Pèse-toi 2 à 3 fois par semaine',d:'Le matin, à jeun. Je pourrai suivre ta tendance et ajuster tes calories.'});
    /* 8. rythme des séances */
    var actifs=w7.filter(function(k){var j=J(k);return j&&((j.seances||[]).length||(j.series||[]).length)}).length,fait28=jours(28).some(function(k){var j=J(k);return j&&(j.series||[]).length});
    if(actifs>=6)L.push({p:62,ic:'🌿',t:'Pense au repos',d:actifs+' jours d\'entraînement sur les 7 derniers. Le muscle progresse pendant le repos : garde au moins 1 à 2 jours plus calmes, ou alterne les muscles (jambes, puis haut du corps).'});
    else if(!actifs&&fait28)L.push({p:60,ic:'🔁',t:'Pas de séance cette semaine',d:'Reprends en douceur avec une routine « Corps entier » de 30 minutes.',a:['Choisir une séance','seance']});
    /* 9. rappel de base selon l'objectif */
    var BASE={poids:'Garde '+protJour()+' g de protéines par jour (environ '+Math.round(protJour()/3)+' g par repas) : ça cale et ça protège ton muscle pendant la perte de poids.',graisse:'Garde '+protJour()+' g de protéines par jour et continue la musculation lourde : c\'est ce qui fait partir le gras plutôt que le muscle.',masse:'Vise '+protJour()+' g de protéines par jour, en 3 à 4 prises de 30 à 40 g, et ajoute du poids ou des répétitions chaque semaine.',perf:'Soigne l\'échauffement (2 séries légères avant les lourdes) et garde 2 à 3 min de repos entre les séries lourdes.',garder:'Bouge un peu chaque jour et garde 2 séances de renforcement par semaine.'};
    L.push({p:20,ic:g.ic,t:'Le conseil du jour pour ton objectif',d:BASE[b]});
    return L.sort(function(a,b){return b.p-a.p})}
  function carteConseil(c){return '<div class="ins"><div class="insIc" aria-hidden="true">'+c.ic+'</div><div style="flex:1;min-width:0"><b>'+esc(c.t)+'</b><div class="est">'+esc(c.d)+'</div>'+(c.a?'<button class="lien" data-v="'+c.a[1]+'">'+esc(c.a[0])+'</button>':'')+'</div></div>'}

  /* ===== Graphique jour par jour ===== */
  var per=7;try{per=+localStorage.getItem('cy.per')||7}catch(e){}if([7,14,30].indexOf(per)<0)per=7;var choisi=-1;
  function bilan(){var ks=jours(per),n=ks.length,W=320,cw=W/n,ck=cibleKcal(),obj=objMl();if(choisi<0||choisi>=n)choisi=n-1;
    var R=[{k:'sommeil',nom:'Sommeil',c:'var(--sleep)',f:dodo,u:function(x){return hm(x)},ref:8,refT:'8 h'},
      {k:'eau',nom:'Eau',c:'var(--water)',f:function(k){var x=eau(k);return x?x/1000:null},u:function(x){return v(x,1)+' L'},ref:obj/1000,refT:v(obj/1000,1)+' L'},
      {k:'kcal',nom:'Calories',c:'var(--acc)',f:kcal,u:function(x){return v(x)+' kcal'},ref:ck,refT:ck?v(ck)+' kcal':'',cache:true},
      {k:'poids',nom:'Poids (orange : moyenne 7 j)',c:'var(--mute)',f:poids,u:function(x){return v(x,1)+' kg'},ligne:true,cache:true},
      {k:'vol',nom:'Charges soulevées',c:'var(--fresh)',f:volume,u:function(x){return x>=1000?v(x/1000,1)+' t':v(x)+' kg'},parS:true}];
    var tout=0,h='<div class="row" style="justify-content:space-between"><div class="lbl" style="font-weight:600;color:var(--ink);flex:1">Ton bilan jour par jour</div></div><div class="chips" role="group" aria-label="Période">'+[7,14,30].map(function(p){return '<button data-per="'+p+'" aria-pressed="'+(per===p)+'">'+p+' jours</button>'}).join('')+'</div>';
    R.forEach(function(r){if(r.cache&&cache())return;var val=ks.map(r.f),ok=val.filter(function(x){return x!=null}),max=Math.max.apply(0,ok.concat((r.ref||0)*1.2,0.0001)),min=r.ligne&&ok.length?Math.min.apply(0,ok):0;tout+=ok.length;
      var H=64,sv='<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="'+r.nom+' sur '+per+' jours'+(ok.length?', moyenne '+r.u(moy(ok)):', aucune donnée')+'">';
      sv+='<rect x="'+(choisi*cw)+'" y="0" width="'+cw+'" height="'+H+'" fill="var(--soft)" rx="4"/>';
      if(r.ref&&!r.ligne){var y=H-2-(r.ref/max)*(H-6);sv+='<line x1="0" x2="'+W+'" y1="'+y.toFixed(1)+'" y2="'+y.toFixed(1)+'" stroke="var(--mute)" stroke-dasharray="3 3" stroke-width="1"/>'}
      if(r.ligne&&ok.length){var mid=(max+min)/2;if(max-min<2){max=mid+1;min=mid-1}}
      if(r.ligne){var rg=(max-min)||1,pts=[];val.forEach(function(x,i){if(x!=null)pts.push([(i+.5)*cw,H-8-(x-min)/rg*(H-20)])});
        if(pts.length>2){var tous=(D().poidsLog||[]),mm=[];ks.forEach(function(k,i){var d0=dk(k),fen=tous.filter(function(x){var d=dk(x.d);return d<=d0&&d>d0-7*864e5});if(fen.length>=2){var m=moy(fen.map(function(x){return x.kg}));mm.push([(i+.5)*cw,H-8-(m-min)/rg*(H-20)])}});
          if(mm.length>1)sv+='<polyline points="'+mm.map(function(p){return p[0].toFixed(1)+','+p[1].toFixed(1)}).join(' ')+'" fill="none" stroke="var(--acc)" stroke-width="2.5" stroke-linejoin="round" opacity=".9"/>'}
        if(pts.length>1){sv+='<text x="2" y="10" font-size="10" fill="var(--mute)">'+v(max,1)+'</text><text x="2" y="'+(H-1)+'" font-size="10" fill="var(--mute)">'+v(min,1)+'</text>'}
        if(pts.length>1)sv+='<polyline points="'+pts.map(function(p){return p[0].toFixed(1)+','+p[1].toFixed(1)}).join(' ')+'" fill="none" stroke="'+r.c+'" stroke-width="2" stroke-linejoin="round"/>';pts.forEach(function(p){sv+='<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="3" fill="'+r.c+'"/>'})}
      else val.forEach(function(x,i){if(x==null)return;var bh=Math.max(2,(x/max)*(H-6));sv+='<rect x="'+(i*cw+cw*.18).toFixed(1)+'" y="'+(H-bh).toFixed(1)+'" width="'+(cw*.64).toFixed(1)+'" height="'+bh.toFixed(1)+'" rx="'+Math.min(3,cw*.2).toFixed(1)+'" fill="'+r.c+'" opacity="'+(i===choisi?1:.35)+'"/>'});
      if(!r.ligne&&val[choisi]!=null){var yy=Math.max(10,H-Math.max(2,(val[choisi]/max)*(H-6))-3),xx=Math.min(W-2,Math.max(2,(choisi+.5)*cw));sv+='<text x="'+xx.toFixed(1)+'" y="'+yy.toFixed(1)+'" font-size="10" font-weight="700" text-anchor="'+(choisi>n*0.8?'end':choisi<n*0.2?'start':'middle')+'" fill="var(--ink)">'+esc(r.u(val[choisi]))+'</text>'}
      ks.forEach(function(k,i){sv+='<rect data-bj="'+i+'" x="'+(i*cw)+'" y="0" width="'+cw+'" height="'+H+'" fill="transparent" style="cursor:pointer"/>'});
      h+='<div class="brow"><div class="blbl"><span><i style="background:'+r.c+'"></i>'+r.nom+'</span><span class="est">'+(ok.length?(r.parS?'moy. par séance ':r.ligne?(ok.length>1?v(ok[0],1)+' → ':''):'moy. ')+r.u(r.ligne?ok[ok.length-1]:moy(ok)):'—')+(r.refT&&!r.ligne?' · objectif '+r.refT:'')+'</span></div>'+sv+'</svg></div>'});
    var step=per===7?1:per===14?2:5;h+='<div class="bx">'+ks.map(function(k,i){var d=dk(k);return '<span style="width:'+(100/n)+'%">'+((n-1-i)%step===0?(per===7?['Di','Lu','Ma','Me','Je','Ve','Sa'][d.getDay()]:dm(k)):'')+'</span>'}).join('')+'</div>';
    var k=ks[choisi],det=[],x;if((x=dodo(k))!=null)det.push(hm(x)+' de sommeil');if((x=eau(k))!=null)det.push(v(x/1000,1)+' L d\'eau');if(!cache()&&(x=kcal(k))!=null)det.push(v(x)+' kcal');if(!cache()&&(x=poids(k))!=null)det.push(v(x,1)+' kg');
    var j=J(k);if(j&&(j.series||[]).length){var vo=volume(k);det.push(j.series.length+' série'+(j.series.length>1?'s':'')+(vo?' · '+(vo>=1000?v(vo/1000,1)+' t':v(vo)+' kg')+' soulevés':''))}
    var dd=dk(k);h+='<div class="bdet bnav"><button data-bj="'+Math.max(0,choisi-1)+'" aria-label="Jour précédent"'+(choisi?'':' disabled')+'>‹</button><div aria-live="polite"><b>'+dd.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})+'</b> · '+(det.length?det.join(' · '):'rien de noté')+'</div><button data-bj="'+Math.min(n-1,choisi+1)+'" aria-label="Jour suivant"'+(choisi<n-1?'':' disabled')+'>›</button></div>';
    if(!tout)h+='<div class="est" style="margin-top:6px">Note ton sommeil, ton eau, tes repas et tes séries : tes courbes apparaîtront ici, alignées jour par jour.</div>';
    else h+='<div class="est" style="margin-top:6px">Touche un jour (ou les flèches) pour voir le détail. Charges soulevées = charge × répétitions de toutes tes séries ; sans charge, on compte une part de ton poids (environ 65 % aux pompes, 100 % aux tractions).</div>';
    return h}

  /* ===== Évolution par exercice ===== */
  var exoSel=null;try{exoSel=localStorage.getItem('cy.exoSel')}catch(e){}
  function evolution(){var P=perf().par,es=Object.keys(P).filter(function(e){return window.CYsport&&window.CYsport.exo(e)});if(!es.length)return '<div class="lbl" style="font-weight:600;color:var(--ink)">Évolution par exercice</div><div class="est">Note tes séries (charge et répétitions) : tu verras ici chaque exercice progresser jour après jour.</div>';
    es.sort(function(a,b){var la=Object.keys(P[a]).sort().pop(),lb=Object.keys(P[b]).sort().pop();return la<lb?1:-1});if(es.indexOf(exoSel)<0)exoSel=es[0];
    var p=P[exoSel],ks=Object.keys(p).sort().slice(-12),avecKg=ks.some(function(k){return p[k].kg>0}),val=ks.map(function(k){return avecKg?p[k].kg:p[k].rep}),u=avecKg?' kg':' rép.';
    var h='<div class="lbl" style="font-weight:600;color:var(--ink)">Évolution par exercice</div><select id="evoSel" aria-label="Choisir un exercice" style="margin:8px 0">'+es.map(function(e){return '<option value="'+esc(e)+'"'+(e===exoSel?' selected':'')+'>'+esc(nomExo(e))+'</option>'}).join('')+'</select>';
    if(ks.length>1){var mi=Math.min.apply(0,val),ma=Math.max.apply(0,val),rg=(ma-mi)||1,W=320,H=90;var pts=val.map(function(x,i){return[(i*(W-20)/(ks.length-1)+10),H-10-(x-mi)/rg*(H-24)]});
      h+='<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="'+esc(nomExo(exoSel))+' : de '+v(val[0],1)+' à '+v(val[val.length-1],1)+u+'"><polyline points="'+pts.map(function(q){return q[0].toFixed(1)+','+q[1].toFixed(1)}).join(' ')+'" fill="none" stroke="var(--acc)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>'+pts.map(function(q){return '<circle cx="'+q[0].toFixed(1)+'" cy="'+q[1].toFixed(1)+'" r="3.5" fill="var(--acc)"/>'}).join('')+'</svg>';
      var g=val[val.length-1]-val[0];h+='<div class="est">'+(g>0?'<b style="color:var(--fresh)">+'+v(g,1)+u+'</b> depuis le '+dm(ks[0]):g<0?v(g,1)+u+' depuis le '+dm(ks[0]):'Stable depuis le '+dm(ks[0]))+'</div>'}
    h+='<ul>'+ks.slice(-5).reverse().map(function(k){var x=p[k];return '<li><span>'+dm(k)+'</span><span class="est">'+(x.kg?v(x.kg,1)+' kg × '+x.rep+' · max estimé ≈ '+v(x.kg*(1+Math.min(x.rep,12)/30),0)+' kg':x.rep+' répétitions')+'</span></li>'}).join('')+'</ul>';
    return h}

  /* ===== Repas adaptés à l'objectif ===== */
  function repas(){var z=$('rObjectif');if(!z)return;var R=window.RECETTES||[],V=window.CYrecettes;if(!V||!R.length){z.classList.add('hide');return}
    var b=O.but(),g=O.GOAL[b],ck=cibleKcal(),pm=Math.round((ck||{poids:1800,graisse:1950,masse:2700,perf:2500,garder:2200}[b])/3/10)*10,pp=Math.round(protJour()/3);
    var L=R.map(function(r){var x=V.valeurs(r);return{r:r,k:x.k,p:x.p,ok:x.ok}}).filter(function(x){return x.ok&&x.r.tags.indexOf('matin')<0});
    if(b==='poids'||b==='graisse')L=L.filter(function(x){return x.k<=pm+80&&x.p>=20}).sort(function(a,c){return c.p/c.k-a.p/a.k});
    else if(b==='masse')L=L.filter(function(x){return x.p>=25}).sort(function(a,c){return Math.abs(a.k-pm)-Math.abs(c.k-pm)});
    else L=L.sort(function(a,c){return Math.abs(a.k-pm)-Math.abs(c.k-pm)});
    L=L.slice(0,9);var o=Math.floor(Date.now()/864e5)%Math.max(1,L.length),choix=[];for(var i=0;i<Math.min(3,L.length);i++)choix.push(L[(o+i)%L.length]);
    z.classList.remove('hide');z.innerHTML='<div class="lbl" style="font-weight:600;color:var(--ink)">'+g.ic+' Pour ton objectif : '+esc(g.nom)+'</div><div class="est" style="margin:2px 0 8px">'+(cache()?'Des plats riches en protéines, adaptés à ton objectif.':'Vise environ <b>'+pm+' kcal</b> et <b>'+pp+' g de protéines</b> par repas.')+(O.choisi()?'':' <button class="lien" data-v="histo">Choisir mon objectif</button>')+'</div>'+
      choix.map(function(x){return '<button class="rc" data-rid="'+esc(x.r.id)+'" style="box-shadow:none;background:var(--soft)"><span><b>'+esc(x.r.nom)+'</b><span class="est">'+x.r.min+' min</span></span>'+(cache()?'':'<span class="est" style="text-align:right;white-space:nowrap">≈ '+x.k+' kcal · '+x.p+' g prot.<br><b style="color:var(--ink)">'+Math.round(x.k/pm*100)+' % de ton repas</b>'+(x.k<pm*0.7?'<br>+1 portion ou un laitage':'')+'</span>')+'</button>'}).join('')}
  window.CYbilan={protJour:protJour,perf:function(){PERF=null;return perf()},conseils:function(){return conseils()},volume:volume,eau:eau,dodo:dodo,hm:hm,jours:jours,dk:dk,v:v,nomExo:nomExo};

  /* ===== Sommeil (accueil) ===== */
  function lireH(t){t=String(t).trim().toLowerCase().replace(',','.');var m=t.match(/^(\d{1,2})\s*(?:h|:)\s*(\d{1,2})?$/);if(m)return +m[1]+(+(m[2]||0))/60;var f=parseFloat(t);return isNaN(f)?null:f}
  var editSom=false;
  function sommeil(){var z=$('sommeilCard');if(!z)return;var j=U.jour(),s=j.sommeil;
    z.classList.toggle('hide',!!(s&&s.h&&s.q&&!editSom));
    if(s&&s.h&&!editSom){z.innerHTML='<div style="display:flex;align-items:center;gap:12px"><span style="font-size:26px" aria-hidden="true">😴</span><div style="flex:1"><div class="lbl">Cette nuit</div><b style="font-size:18px">'+hm(s.h)+'</b>'+(s.q?' <span class="est">· '+{1:'mal dormi',2:'moyen',3:'bien dormi'}[s.q]+'</span>':'')+'</div><button class="lien" id="somMod">Modifier</button></div>'+(s.q?'':'<div class="chips" role="group" aria-label="Qualité du sommeil">'+[[1,'😫 Mal'],[2,'😐 Moyen'],[3,'😴 Bien']].map(function(q){return '<button data-somq="'+q[0]+'">'+q[1]+'</button>'}).join('')+'</div>');
      $('somMod').onclick=function(){editSom=true;sommeil()}}
    else{z.innerHTML='<div class="lbl" style="font-weight:600;color:var(--ink)">😴 Combien as-tu dormi cette nuit ?</div><div class="chips" role="group" aria-label="Heures de sommeil">'+[5,6,7,8,9].map(function(h){return '<button data-somh="'+h+'" aria-pressed="'+!!(s&&s.h===h)+'">'+h+' h</button>'}).join('')+'</div><form id="somForm" class="row" style="margin-top:8px"><input id="somLibre" inputmode="decimal" placeholder="Autre (ex. 7h30)" aria-label="Heures de sommeil, par exemple 7h30" autocomplete="off"><button type="submit" style="flex:0 0 auto">Noter</button></form>';
      $('somForm').onsubmit=function(e){e.preventDefault();var h=lireH($('somLibre').value);if(h>0&&h<=16)noterSom(h);else toast('Ex. : 7, 7,5 ou 7h30')}}}
  function ouvrirSom(){var js=$('jSommeil');if(!$('sommeilCard')&&js){js.dataset.edit='1';js.classList.remove('hide');var m=$('jSomMod');if(m)m.click();js.scrollIntoView({behavior:'smooth',block:'center'});return}editSom=true;sommeil();var z=$('sommeilCard');z.scrollIntoView({behavior:'smooth',block:'center'});var b=z.querySelector('button');if(b)b.focus({preventScroll:true})}
  document.addEventListener('keydown',function(e){if(e.target.id==='aSommeilBtn'&&(e.key==='Enter'||e.key===' ')){e.preventDefault();ouvrirSom()}});
  function noterSom(h){var j=U.jour(),q=j.sommeil&&j.sommeil.q;j.sommeil={h:Math.round(h*4)/4,q:q||0};editSom=false;U.save();toast('Sommeil noté : '+hm(j.sommeil.h))}
  document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#aSommeilBtn')){ouvrirSom();return}var t=e.target.closest&&e.target.closest('[data-somh],[data-somq],[data-goal],[data-per],[data-bj],#goalMod,#goalNon');if(!t)return;var d=t.dataset;
    if(d.somh)noterSom(+d.somh);
    if(d.somq){var j=U.jour();if(j.sommeil){j.sommeil.q=+d.somq;U.save()}}
    if(d.goal){if(t.disabled)return;enChoix=false;O.choisir(d.goal);var g=O.GOAL[d.goal];toast(g.ic+' Objectif : '+g.nom)}
    if(t.id==='goalMod'){enChoix=true;rendre()}
    if(t.id==='goalNon'){enChoix=false;rendre()}
    if(d.per){per=+d.per;choisi=-1;try{localStorage.setItem('cy.per',per)}catch(x){}rendre()}
    if(d.bj!==undefined){choisi=+d.bj;rendre()}});
  document.addEventListener('change',function(e){if(e.target.id==='evoSel'){exoSel=e.target.value;try{localStorage.setItem('cy.exoSel',exoSel)}catch(x){}rendre()}});

  /* ===== Rendu ===== */
  function rendre(){PERF=null;var j=U.jour(),s=j.sommeil&&j.sommeil.h;
    var q=j.sommeil&&j.sommeil.q,sb=$('aSommeilBtn');if(sb){$('aSommeilTxt').innerHTML=s?'<b>'+hm(s)+'</b>'+(q?' · '+{1:'mal dormi',2:'moyen',3:'bien dormi'}[q]:''):'Noter ma nuit';sb.setAttribute('aria-label','Sommeil : '+(s?hm(s)+', modifier':'noter ma nuit'))}
    var jsm=$('jSommeil');if(jsm&&$('aSommeilBtn'))jsm.classList.toggle('hide',!!s&&!jsm.dataset.edit);
    sommeil();var L=null;
    var cc=$('coachCard');if(cc){L=conseils();cc.innerHTML=carteObjectif()+(O.choisi()?'<div class="lbl" style="font-weight:600;color:var(--ink);margin-top:16px">Les conseils de ton coach</div>'+L.slice(0,4).map(carteConseil).join('')+'<div class="est" style="margin-top:8px">Calculés à partir de ce que tu notes. Ce n\'est pas un avis médical.</div>':'')}
    var jc=$('jCoach');if(jc){L=L||conseils();var top=L[0];var top3=L.filter(function(c){return c.p>=30}).slice(0,3);if(top3.length&&O.choisi()){jc.classList.remove('hide');jc.innerHTML='<div class="cap" style="margin:4px 0 8px">Ton coach</div><div class="carrousel" id="jCar">'+top3.map(function(c,i){var col={'😴':'var(--sleep2)','🌙':'var(--sleep2)','💧':'var(--water2)','🍽️':'var(--fresh2)','🍝':'var(--fresh2)'}[c.ic]||'var(--acc2)';return '<div class="cc" aria-label="Conseil '+(i+1)+' sur '+top3.length+'"><div class="ccIc" style="background:'+col+'" aria-hidden="true">'+c.ic+'</div><div style="min-width:0"><b>'+esc(c.t)+'</b><div class="est">'+esc(c.d)+'</div>'+(c.a?'<button data-v="'+c.a[1]+'">'+esc(c.a[0])+'</button>':'<button data-v="histo">Voir mes progrès</button>')+'</div></div>'}).join('')+'</div>'+(top3.length>1?'<div class="points-c" aria-hidden="true">'+top3.map(function(_,i){return '<i class="'+(i?'':'on')+'"></i>'}).join('')+'</div>':'');
        var car=$('jCar');if(car)car.onscroll=function(){var i=Math.round(car.scrollLeft/Math.max(1,car.firstChild.offsetWidth+10));jc.querySelectorAll('.points-c i').forEach(function(x,k){x.classList.toggle('on',k===i)})}}else if(!O.choisi()){jc.classList.remove('hide');jc.innerHTML=choixObjectif()}else jc.classList.add('hide')}
    var bc=$('bilanCard');if(bc)bc.innerHTML=bilan();var ev=$('exoEvol');if(ev)ev.innerHTML=evolution();repas()}
  var avant=window.CYvivant;window.CYvivant=function(){if(avant)avant();rendre()};
  rendre();
})();
