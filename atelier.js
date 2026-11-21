/* CookYourself · Atelier : pastille de série, eau en un geste, score de forme, records, bilan du dimanche,
   rappels d'eau intelligents, liste de courses. Tout reste calculé sur le téléphone. */
(function(){
  var U=window.UnGeste,S=window.CYsport,B=window.CYbilan,O=window.CYobj;if(!U||!B)return;
  function $(i){return document.getElementById(i)}
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function toast(t,ms){var e=$('toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(function(){e.classList.remove('on')},ms||2500)}
  function D(){return U.db()}
  function v(n,d){return B.v(n,d)}
  function cle(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
  function objMl(){var r=D().reglages;return r.eauMl||(r.eau||8)*250}
  function ml(j){return j?(j.ml!=null?j.ml:(j.eau||0)*250):0}

  /* ===== Accueil : eau en un geste, + poids, protéines, série ===== */
  var eb=$('aEauBtn');if(eb)eb.onclick=function(){var b=document.querySelector('.rapides [data-ml="250"]');if(b)b.click()};
  var pg=$('jPoidsGo');if(pg)pg.onclick=function(){var n=document.querySelector('nav [data-v="histo"]');if(n)n.click();setTimeout(function(){var i=$('pSaisie');if(i){i.scrollIntoView({block:'center'});i.focus()}},80)};
  function accueil(){var j=U.jour(),pr=0,n=0;(j.repas||[]).forEach(function(x){if(x.p!=null){pr+=+x.p||0;n++}});
    var jp=$('jProt');if(jp){jp.textContent=(j.repas||[]).length?'Manger':'Manger · note ton 1er repas'}
    macros(j)
    var hs=$('hSerie'),gi=window.CYgamInfo&&window.CYgamInfo();var hd=$('hDate');if(hd){var nd=new Date();hd.textContent=nd.toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'}).replace(/^./,function(c){return c.toUpperCase()})}
    if(hs&&gi){var s=gi.serie.n;hs.classList.remove('hide');hs.hidden=!s;hs.textContent='🔥 '+s;hs.setAttribute('aria-label',s+' jour'+(s>1?'s':'')+' de suite')}
    forme()}

  /* ===== Macros du jour : protéines, glucides, lipides, fibres (objectifs d'après l'objectif et le profil) ===== */
  function macros(j){var z=$('jMacros2');if(!z){var c=document.querySelector('.jour-anneaux');if(!c)return;z=document.createElement('div');z.id='jMacros2';z.className='macros2';c.parentNode.insertBefore(z,c.nextSibling)}
    var kc=(window.CYkcal&&window.CYkcal())||2200,pc=B.protJour(),lc=Math.round(kc*0.30/9),gc=Math.max(0,Math.round((kc-pc*4-lc*9)/4)),fc=30,t={p:0,g:0,l:0,f:0},vu={p:0,g:0,l:0,f:0};
    (j.repas||[]).forEach(function(x){['p','g','l','f'].forEach(function(k){if(x[k]!=null&&isFinite(x[k])){t[k]+=+x[k];vu[k]++}})});
    var L=[['p','Protéines',pc,'var(--fresh)'],['g','Glucides',gc,'var(--water)'],['l','Lipides',lc,'#E0A100'],['f','Fibres',fc,'var(--sleep)']];
    z.innerHTML=L.map(function(m){var v=Math.round(t[m[0]]),pct=Math.min(100,v/m[2]*100);return '<div class="mc" aria-label="'+m[1]+' : '+v+' grammes sur '+m[2]+'"><div class="mcT">'+m[1]+'</div><div class="mcV"><b>'+v+'</b><small>/'+m[2]+' g</small></div><span class="bar"><i style="width:'+pct+'%;background:'+m[3]+'"></i></span></div>'}).join('')+
      ((j.repas||[]).length&&!vu.f?'<div class="est mcN">Fibres comptées pour les aliments de la base et les recettes.</div>':'')}

  /* ===== Score de forme du matin (repère simple, pas un diagnostic) ===== */
  function score(){var j=U.jour(),s=j.sommeil;if(!s||!s.h)return null;var x=50,raisons=[];
    var dh=Math.max(-2.5,Math.min(1.5,s.h-7));x+=dh*10;raisons.push(B.hm(s.h)+' de sommeil');
    if(s.q===1){x-=10;raisons.push('mal dormi')}else if(s.q===3)x+=5;
    var h=new Date();h.setDate(h.getDate()-1);var jh=D().jours[cle(h)],e=ml(jh);if(jh){if(e>=objMl()*0.9){x+=10;raisons.push('bien hydraté hier')}else if(e<objMl()*0.6){x-=10;raisons.push('peu bu hier')}}
    var seances=0;for(var i=1;i<=2;i++){var d=new Date();d.setDate(d.getDate()-i);var jj=D().jours[cle(d)];if(jj&&((jj.series||[]).length||(jj.seances||[]).length))seances++}
    if(seances===2){x-=12;raisons.push('2 séances en 48 h')}else if(seances===0){x+=8;raisons.push('reposé')}
    x=Math.round(Math.max(0,Math.min(100,x)));return{x:x,niv:x>=70?'pousse':x>=45?'normal':'allege',raisons:raisons}}
  function forme(){var b=$('jForme');if(!b)return;var sc=score();if(!sc){b.classList.add('hide');return}
    var T={pousse:'Pousse aujourd\'hui',normal:'Séance normale',allege:'Allège de 20 %'};b.classList.remove('hide');b.className='puce forme-'+sc.niv;b.innerHTML='Forme <b>'+sc.x+'</b> · '+T[sc.niv];
    b.setAttribute('aria-label','Forme '+sc.x+' sur 100 : '+T[sc.niv]+'. Toucher pour le détail.');
    b.onclick=function(){toast('Forme '+sc.x+'/100 : '+sc.raisons.join(', ')+'. '+(sc.niv==='allege'?'Fais une série de moins ou baisse la charge de 20 %.':sc.niv==='pousse'?'Bon jour pour tenter un record.':'Garde ton programme.')+' C\'est un repère, pas un diagnostic.',6000)}}

  /* ===== Records ===== */
  function e1(x){return x.kg?x.kg*(1+Math.min(x.rep,12)/30):x.rep}
  function records(){var J=D().jours,R={};Object.keys(J).sort().forEach(function(k){(J[k].series||[]).forEach(function(x){if(!x.rep)return;var sc=e1(x);if(!R[x.exo]||sc>R[x.exo].sc)R[x.exo]={sc:sc,kg:x.kg||0,rep:x.rep,d:k}})});return R}
  if(S&&S.surSerie)S.surSerie(function(k){var J=D().jours,auj=U.cle(),avant=0,ok=false;Object.keys(J).forEach(function(d){if(d===auj)return;(J[d].series||[]).forEach(function(x){if(x.exo===k&&x.rep){ok=true;avant=Math.max(avant,e1(x))}})});
    var L=(U.jour().series||[]).filter(function(x){return x.exo===k}),der=L[L.length-1];if(!ok||!der)return;
    var autresAuj=L.slice(0,-1).reduce(function(m,x){return Math.max(m,e1(x))},0);if(e1(der)>avant&&e1(der)>autresAuj){var f=document.createElement('div');f.className='record';f.setAttribute('role','status');
      f.innerHTML='Record personnel !<b>'+(der.kg?v(der.kg,1)+' kg × '+der.rep:der.rep+(S.exo(k)&&S.exo(k).unite?' s':' rép.'))+'</b><span style="font-size:13px;color:#C9BFB3">'+esc(B.nomExo(k))+'</span>';document.body.appendChild(f);if(navigator.vibrate)navigator.vibrate([40,60,40,60,120]);setTimeout(function(){f.remove()},3200)}});
  function carteRecords(){var c=$('pRecords');if(!c){var ev=$('exoEvol');if(!ev)return;c=document.createElement('div');c.className='card';c.id='pRecords';ev.parentNode.insertBefore(c,ev.nextSibling)}
    var R=records(),ks=Object.keys(R).filter(function(k){return S&&S.exo(k)}).sort(function(a,b){return R[a].d<R[b].d?1:-1});
    c.innerHTML='<div class="lbl" style="font-weight:600;color:var(--ink)">🏆 Mes records</div>'+(ks.length?'<ul>'+ks.slice(0,12).map(function(k){var r=R[k];return '<li><span>'+esc(B.nomExo(k))+'</span><span class="est"><b style="color:var(--ink);font-family:var(--chiffres)">'+(r.kg?v(r.kg,1)+' kg × '+r.rep:r.rep+(S.exo(k).unite?' s':' rép.'))+'</b> · '+r.d.slice(8)+'/'+r.d.slice(5,7)+'</span></li>'}).join('')+'</ul>':'<div class="est">Note tes séries : ton meilleur résultat sur chaque exercice apparaîtra ici.</div>')}

  /* ===== Bilan du dimanche (semaine du lundi à aujourd'hui) ===== */
  /* le lundi, on regarde la semaine qui vient de finir */
  function passee(){return new Date().getDay()===1}
  function semaine(){var t=new Date(),l=new Date(t.getFullYear(),t.getMonth(),t.getDate());l.setDate(l.getDate()-((l.getDay()+6)%7));if(passee()){l.setDate(l.getDate()-7);t=new Date(l);t.setDate(l.getDate()+6)}var ks=[];for(var d=new Date(l);d<=t;d.setDate(d.getDate()+1))ks.push(cle(d));
    var parG={},nuits=[],protOk=0,protJours=0,seances=0,cible=B.protJour();ks.forEach(function(k){var j=D().jours[k];if(!j)return;
      (j.series||[]).forEach(function(x){var g=O&&O.groupe(x.exo);if(g)parG[g]=(parG[g]||0)+1});if((j.seances||[]).length)seances++;if(j.sommeil&&j.sommeil.h)nuits.push(j.sommeil.h);
      var rp=(j.repas||[]).filter(function(x){return x.p!=null});if(rp.length){protJours++;if(rp.reduce(function(s,x){return s+(+x.p||0)},0)>=cible*0.9)protOk++}});
    return{parG:parG,nuits:nuits,protOk:protOk,protJours:protJours,seances:seances,jours:ks.length}}
  var NOMG={jambes:'Jambes',pecs:'Pecs',dos:'Dos',epaules:'Épaules',bras:'Bras',abdos:'Abdos'};
  function carteSemaine(cible,court){var w=semaine(),c1=(B.conseils()||[])[0],gs=Object.keys(NOMG);
    var h='<div class="cap">Ta semaine</div><div class="titre" style="font-size:20px;margin:2px 0 10px">'+(new Date().getDay()===0?'Le bilan du dimanche':passee()?'Ta semaine passée':'Depuis lundi')+'</div>'+
      '<div class="chiffres" style="margin-top:0"><span><b>'+w.seances+'</b> séance'+(w.seances>1?'s':'')+'</span><span><b>'+(w.nuits.length?B.hm(w.nuits.reduce(function(a,b){return a+b},0)/w.nuits.length):'—')+'</b> de sommeil en moyenne</span><span><b>'+w.protOk+'/'+(w.protJours||w.jours)+'</b> jours protéines tenues</span></div>';
    if(!court){h+='<div class="lbl" style="margin-top:14px">Séries par muscle <span class="est">(repère : 10 à 20 par semaine)</span></div>'+gs.map(function(g){var n=w.parG[g]||0,p=Math.min(100,n/20*100);return '<div style="display:flex;align-items:center;gap:10px;margin-top:6px;font-size:14px"><span style="width:64px">'+NOMG[g]+'</span><div class="bar" style="flex:1"><i style="width:'+p+'%;background:'+(n>=10?'var(--fresh)':'var(--acc)')+'"></i></div><b style="width:28px;text-align:right;font-family:var(--chiffres)">'+n+'</b></div>'}).join('')}
    if(c1)h+='<div style="margin-top:14px;padding:12px 14px;border-radius:14px;background:var(--soft)"><div class="cap" style="font-size:11px">Ta priorité pour la semaine prochaine</div><b style="display:block;margin-top:4px">'+esc(c1.t)+'</b></div>';
    cible.innerHTML=h}
  function dimanche(){var p=$('pHebdo');if(!p){var cc=$('coachCard');if(cc){p=document.createElement('div');p.className='card';p.id='pHebdo';cc.parentNode.insertBefore(p,cc.nextSibling)}}if(p)carteSemaine(p,false);
    var j=$('jDimanche'),jour=new Date().getDay();if(!j){var jc=$('jCoach');if(jc){j=document.createElement('div');j.className='card hide';j.id='jDimanche';jc.parentNode.insertBefore(j,jc)}}
    if(j){var aff=jour===0||(jour===1&&new Date().getHours()<12);j.classList.toggle('hide',!aff);if(aff){carteSemaine(j,true);j.insertAdjacentHTML('beforeend','<button class="lien" data-v="histo" style="margin-top:8px">Voir le détail</button>')}}}

  /* ===== Rappels d'eau intelligents : seulement si tu es en retard sur ton rythme ===== */
  window.CYenRetard=function(){var n=new Date(),h=n.getHours()+n.getMinutes()/60,part=Math.max(0,Math.min(1,(h-8)/13));return ml(U.jour())<objMl()*part*0.85};
  (function(){var r=$('eRappel');if(!r||$('eMalin'))return;var lab=document.createElement('label');lab.style.cssText='display:flex;gap:10px;align-items:center;margin-top:4px;color:var(--ink);font-size:15px;min-height:44px';
    lab.innerHTML='<input id="eMalin" type="checkbox" style="width:auto"> Seulement si je suis en retard sur mon eau';var L=r.closest('label');L.parentNode.insertBefore(lab,L.nextSibling);
    var m=$('eMalin');function maj(){var d=D();m.checked=!!(d.rappels&&d.rappels.malin)}m.onchange=function(){var d=D();if(!d.rappels)d.rappels={on:false,heures:['10:00','14:00','17:00']};d.rappels.malin=m.checked;U.save();toast(m.checked?'Rappel seulement si tu bois moins que prévu à cette heure':'Rappel à chaque heure choisie')};maj()})();

  /* ===== Liste de courses (à partir des recettes) ===== */
  var RAYONS=[['Fruits et légumes',/tomate|oignon|ail|carotte|courgette|poivron|salade|épinard|epinard|brocoli|chou|champignon|pomme|banane|citron|fruit|légume|legume|avocat|haricot vert|concombre|patate douce|pomme de terre|échalote|persil|coriandre|basilic|menthe|gingembre/i],
    ['Viandes et poissons',/poulet|dinde|boeuf|bœuf|porc|jambon|veau|agneau|thon|saumon|poisson|cabillaud|crevette|sardine|steak|viande|lardon/i],
    ['Crèmerie',/lait|fromage|emmental|yaourt|beurre|crème|creme|mozzarella|parmesan|feta|skyr|oeuf|œuf|ricotta|comté/i],
    ['Épicerie',/./]];
  function rayon(n){for(var i=0;i<RAYONS.length;i++)if(RAYONS[i][1].test(n))return RAYONS[i][0];return 'Épicerie'}
  function courses(){var d=D();if(!d.courses||typeof d.courses!=='object')d.courses={recettes:[],cochés:{}};if(!Array.isArray(d.courses.recettes))d.courses.recettes=[];if(!d.courses.cochés)d.courses.cochés={};return d.courses}
  function liste(){var C=courses(),R=window.RECETTES||[],tot={};C.recettes.forEach(function(x){var r=R.filter(function(y){return y.id===x.id})[0];if(!r)return;var f=x.p/r.portions;r.ing.forEach(function(i){var k=i[0];if(!tot[k])tot[k]={g:0,r:rayon(i[0]+' '+i[1])};tot[k].g+=i[2]*f})});return tot}
  function fg(g){return g>=1000?v(g/1000,1)+' kg':Math.round(g)+' g'}
  function carteCourses(){var z=$('rCourses');if(!z){var o=$('rObjectif');if(!o)return;z=document.createElement('div');z.className='card hide courses';z.id='rCourses';o.parentNode.insertBefore(z,o.nextSibling)}
    var C=courses(),R0=window.RECETTES||[];C.recettes=C.recettes.filter(function(x){return R0.some(function(y){return y.id===x.id})});var tot=liste(),ks=Object.keys(tot);z.classList.toggle('hide',!C.recettes.length);if(!C.recettes.length){z.innerHTML='';return}
    var par={};ks.forEach(function(k){(par[tot[k].r]=par[tot[k].r]||[]).push(k)});
    z.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><div class="lbl" style="font-weight:600;color:var(--ink)">🛒 Ma liste de courses</div><button class="lien" id="csVider">Vider</button></div><div class="est">'+C.recettes.map(function(x){var r=(window.RECETTES||[]).filter(function(y){return y.id===x.id})[0];return r?esc(r.nom)+' ('+x.p+' p.)':''}).filter(Boolean).join(' · ')+'</div>'+
      RAYONS.map(function(r){var L=par[r[0]];if(!L)return '';return '<div class="cap" style="margin-top:12px;font-size:11px">'+r[0]+'</div><ul>'+L.sort().map(function(k){var f=!!C.cochés[k];return '<li class="'+(f?'fait':'')+'"><label><input type="checkbox" data-cs="'+esc(k)+'"'+(f?' checked':'')+'> '+esc(k)+'</label><span class="est">'+fg(tot[k].g)+'</span></li>'}).join('')+'</ul>'}).join('')+
      '<button class="main" id="csPartager" style="margin-top:12px">Partager la liste</button>';
    z.querySelectorAll('[data-cs]').forEach(function(i){i.onchange=function(){var C2=courses();if(i.checked)C2.cochés[i.dataset.cs]=1;else delete C2.cochés[i.dataset.cs];i.closest('li').classList.toggle('fait',i.checked);U.save()}});
    $('csVider').onclick=function(){if(this.dataset.ok){var d=D();d.courses={recettes:[],cochés:{}};U.save();carteCourses();toast('Liste vidée')}else{this.dataset.ok=1;this.textContent='Confirmer ?'}};
    $('csPartager').onclick=function(){var t='Courses CookYourself\n'+RAYONS.map(function(r){var L=par[r[0]];var L2=L&&L.filter(function(k){return !courses().cochés[k]});return L2&&L2.length?'\n'+r[0]+'\n'+L2.map(function(k){return '- '+k+' : '+fg(tot[k].g)}).join('\n'):''}).join('\n');
      if(navigator.share)navigator.share({title:'Ma liste de courses',text:t}).catch(function(){});else{try{navigator.clipboard.writeText(t).then(function(){toast('Liste copiée')})}catch(e){toast('Copie impossible')}}}}
  (function(){var m=$('rManger');if(!m||$('rCourseAj'))return;var b=document.createElement('button');b.id='rCourseAj';b.style.cssText='width:100%;margin-top:8px';b.textContent='🛒 Ajouter à ma liste de courses';m.parentNode.insertBefore(b,m.nextSibling);
    b.onclick=function(){var nom=($('rNom').textContent||'').trim(),r=(window.RECETTES||[]).filter(function(x){return x.nom===nom})[0];if(!r)return;var pb=document.querySelector('[data-rp][aria-pressed="true"]'),p=pb?+pb.dataset.rp:r.portions,C=courses();
      var ex=C.recettes.filter(function(x){return x.id===r.id})[0];if(ex)ex.p=p;else C.recettes.push({id:r.id,p:p});U.save();toast('Ajouté à ta liste : '+r.nom+' ('+p+' portion'+(p>1?'s':'')+')')}})();

  /* ===== Profil rempli à X % (à partir de la 2e ouverture de l'appli) ===== */
  (function(){try{var t=Date.now(),der=+localStorage.getItem('cy.derniereOuverture')||0,n=+localStorage.getItem('cy.ouvertures')||0;if(t-der>30*60000){n++;localStorage.setItem('cy.ouvertures',n)}localStorage.setItem('cy.derniereOuverture',t)}catch(e){}})();
  function profilPct(){var d=D(),p=d.profil||{},r=d.reglages||{},L=[
      ['prénom',!!p.prenom],['sexe',!!p.sexe],['âge',+p.age>0],['taille',+p.taille>0],['poids',(d.poidsLog||[]).length>0],['travail',!!p.metier&&p.metier!=='1.4'||!!p.metierChoisi],['objectif',!!(O&&O.choisi())],['eau par jour',!!r.eauMl]];
    var ok=L.filter(function(x){return x[1]}).length;return{pct:Math.round(ok/L.length*100),manque:L.filter(function(x){return !x[1]}).map(function(x){return x[0]})}}
  function barreProfil(){var z=$('jProfilPct');if(!z){var v=$('v-jour');if(!v)return;z=document.createElement('div');z.id='jProfilPct';v.insertBefore(z,v.firstChild)}
    var n=0;try{n=+localStorage.getItem('cy.ouvertures')||0}catch(e){}var pp=profilPct();if(n<2||pp.pct>=100||document.querySelector('.onb')){z.innerHTML='';return}
    z.innerHTML='<button id="jProfilGo2" style="display:block;width:100%;text-align:left;background:var(--card);box-shadow:var(--ombre);border-radius:16px;padding:12px 14px;margin:0 0 12px;font-weight:500" aria-label="Profil rempli à '+pp.pct+' %. Compléter mon profil">'+
      '<span style="display:flex;justify-content:space-between;font-size:14px"><span>Profil rempli à <b style="font-family:var(--chiffres)">'+pp.pct+' %</b></span><span style="color:var(--acc-ink);font-weight:600">Compléter ›</span></span>'+
      '<span class="bar" style="display:block;margin-top:8px;height:6px"><i style="width:'+pp.pct+'%"></i></span><span class="est" style="display:block;margin-top:6px;font-size:12.5px">Il manque : '+esc(pp.manque.join(', '))+'</span></button>';
    $('jProfilGo2').onclick=function(){var r=document.querySelector('.iconbtn[data-v="regl"]');if(r)r.click();setTimeout(function(){var c=$('pSexe');if(c){var k=c.closest('.card');if(k)k.scrollIntoView({block:'start',behavior:'smooth'})}},60)}}
  window.CYprofilPct=profilPct;
  /* Mon profil : prénom, et le travail marqué comme choisi quand on le change */
  (function(){var pn=$('pPrenom'),pm=$('pMetier');if(pn){pn.value=(D().profil||{}).prenom||'';pn.onchange=function(){var d=D();d.profil=d.profil||{sexe:'',age:'',taille:'',metier:'1.4',but:'0'};d.profil.prenom=pn.value.trim().slice(0,40);U.save()}}
    if(pm)pm.addEventListener('change',function(){var d=D();if(d.profil){d.profil.metierChoisi=true;U.save()}})})();
  function rendre(){try{accueil();barreProfil();carteRecords();dimanche();carteCourses()}catch(e){if(window.console)console.error(e)}}
  var av=window.CYvivant;window.CYvivant=function(){if(av)av();rendre()};
  rendre();
})();
