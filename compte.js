/* Compte facultatif + sauvegarde en ligne (Supabase, Europe).
   - Sans config (config.js vide) : rien ne se charge, l'appli reste 100 % locale.
   - Connexion par e-mail + mot de passe (marche dans l'appli installée sur iPhone).
     Les e-mails (confirmation d'adresse, mot de passe oublié) partent de Supabase.
   - Fusion élément par élément : repas, séances et séries sont réunis par leur heure (t) ;
     les éléments effacés sont notés dans db.supp (pierres tombales) pour ne pas revenir.
   - Un téléphone ne mélange jamais deux comptes : db.compteId retient le propriétaire des données. */
(function(){
  var CFG = window.CY_CONFIG || {}, U = window.UnGeste, sb = null, user = null, vue = 'connexion', modeReset = false, finSafari = '', minuterie = null, enCours = false, encore = false, mailEnCours = '';
  var VERSION_ACCORD = '2026-11-20';
  var pretOk, pret = new Promise(function(r){ pretOk = r; });
  function $(i){ return document.getElementById(i); }
  function actif(){ return !!(CFG.supabaseUrl && CFG.supabaseAnonKey); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function etat(t, err){ var e = $('cEtat'); if (e){ e.textContent = t; e.style.color = err ? 'var(--danger)' : ''; } }
  function vide(d){ return !d || !Object.keys(d.jours || {}).some(function(k){ var j = d.jours[k] || {}; return (j.repas||[]).length || (j.seances||[]).length || (j.series||[]).length || j.ml || j.eau || j.sommeil; }); }

  /* ---------- Fusion ---------- */
  function liste(a, b, supp){ var m = {}; (b || []).concat(a || []).forEach(function(x){ if (!x) return; var k = x.t || JSON.stringify(x); if (!supp[k]) m[k] = x; }); return Object.keys(m).map(function(k){ return m[k]; }).sort(function(x, y){ return (x.t||0) - (y.t||0); }); }
  function fusion(loc, dist){
    loc = loc || {}; if (!dist || typeof dist !== 'object') return loc;
    var supp = Object.assign({}, dist.supp || {}, loc.supp || {});
    var base = (dist.maj || 0) > (loc.maj || 0) ? dist : loc;
    var r = JSON.parse(JSON.stringify(base)); r.supp = supp; r.jours = {};
    var cles = {}; Object.keys(loc.jours || {}).concat(Object.keys(dist.jours || {})).forEach(function(k){ cles[k] = 1; });
    Object.keys(cles).forEach(function(k){
      var a = (loc.jours || {})[k], b = (dist.jours || {})[k];
      if (!a || !b){ r.jours[k] = JSON.parse(JSON.stringify(a || b)); return; }
      var rec = (b.maj || 0) > (a.maj || 0) ? b : a, j = JSON.parse(JSON.stringify(rec));
      j.repas = liste(a.repas, b.repas, supp); j.seances = liste(a.seances, b.seances, supp); j.series = liste(a.series, b.series, supp); j.sommeil = rec.sommeil || a.sommeil || b.sommeil;
      j.maj = Math.max(a.maj || 0, b.maj || 0); r.jours[k] = j;
    });
    var ga = loc.gam || {}, gb = dist.gam || {}; r.gam = r.gam || {};
    r.gam.vus = Object.assign({}, gb.vus || {}, ga.vus || {});
    var defis = Object.assign({}, gb.defis || {}, ga.defis || {}); Object.keys(defis).forEach(function(d){ if (supp['defi:' + d]) delete defis[d]; }); r.gam.defis = defis;
    var pm = {}, prio = base === loc ? [dist.poidsLog, loc.poidsLog] : [loc.poidsLog, dist.poidsLog];
    prio.forEach(function(L){ (L || []).forEach(function(p){ if (p && p.d) pm[p.d] = p; }); });
    r.poidsLog = Object.keys(pm).sort().map(function(d){ return pm[d]; });
    var ep = {}; (dist.exosPerso || []).concat(loc.exosPerso || []).forEach(function(x){ if (x && x.id && !supp['exo:' + x.id]) ep[x.id] = x; }); r.exosPerso = Object.keys(ep).map(function(k){ return ep[k]; });
    r.maj = Math.max(loc.maj || 0, dist.maj || 0);
    return r;
  }

  /* ---------- Échanges avec le serveur ---------- */
  async function lireEnLigne(){ var res = await sb.from('etat_appli').select('donnees').eq('user_id', user.id).maybeSingle(); if (res.error) throw res.error; return res.data && res.data.donnees; }
  async function pousser(){
    if (!sb || !user) return;
    if (enCours){ encore = true; return; }
    enCours = true;
    try {
      var d = U.db(); d.compteId = user.id;
      var res = await sb.from('etat_appli').upsert({ user_id: user.id, donnees: d, maj_le: new Date().toISOString() });
      if (res.error) throw res.error;
      etat('C\'est bon ! Sauvegardé à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + '.');
    } catch (e) { etat('Pas de réseau : nouvel essai au prochain changement.', 1); }
    finally { enCours = false; if (encore){ encore = false; setTimeout(pousser, 500); } }
  }
  async function synchro(){
    if (!user) return;
    etat('Synchronisation…');
    var dist;
    try { dist = await lireEnLigne(); } catch (e) { etat('Pas de réseau : tes données restent sur ce téléphone.', 1); return; }
    var loc = U.db();
    /* Données d'un autre compte sur ce téléphone : on ne les mélange jamais. */
    if (loc.compteId && loc.compteId !== user.id){ choix(dist, 'autre'); return; }
    /* Première connexion avec des données des deux côtés : on demande. */
    if (!loc.compteId && !vide(loc) && dist && !vide(dist)){ choix(dist, 'premiere'); return; }
    try { var f = fusion(loc, dist); f.compteId = user.id; U.remplacer(f); await pousser(); }
    catch (e) { etat('Erreur pendant la synchronisation. Tes données restent sur ce téléphone.', 1); }
  }
  function choix(dist, cas){
    var z = $('cChoix'); if (!z) return;
    var reg = U.db().reglages;
    z.innerHTML = '<div class="card" role="alertdialog" aria-labelledby="cChoixT" style="background:var(--soft);margin-top:10px"><b id="cChoixT">' +
      (cas === 'autre' ? 'Ce téléphone contient les données d\'un autre compte' : 'Des données existent ici et en ligne') + '</b><p class="est">' +
      (cas === 'autre' ? 'Pour protéger sa vie privée, on ne les mélange pas avec les tiennes.' : 'Que veux-tu faire ?') + '</p><div style="display:flex;flex-direction:column;gap:8px">' +
      (cas === 'premiere' ? '<button id="cFus">Tout réunir (conseillé)</button>' : '') +
      '<button id="cDist">Garder seulement mes données en ligne</button>' + (cas === 'premiere' ? '<button id="cLoc">Garder seulement ce téléphone</button>' : '') + '</div></div>';
    function fin(d){ d.compteId = user.id; d.reglages = d.reglages || reg; U.remplacer(d); z.innerHTML = ''; pousser(); }
    if ($('cFus')) $('cFus').onclick = function(){ fin(fusion(U.db(), dist)); };
    $('cDist').onclick = function(){ fin(dist && dist.jours ? JSON.parse(JSON.stringify(dist)) : { jours:{}, reglages:reg, favoris:[], onb:U.db().onb }); };
    if ($('cLoc')) $('cLoc').onclick = function(){ fin(U.db()); };
    z.querySelector('button').focus();
  }
  async function lirePlan(){
    if (!sb || !user || !window.CYdroits) return;
    var r = await sb.from('abonnements').select('plan, fin_le').eq('user_id', user.id).maybeSingle();
    if (!r.error && r.data) window.CYdroits.definirPlan(r.data.plan, r.data.fin_le);
  }

  /* ---------- Interface ---------- */
  function dessiner(){
    var z = $('cZone'); if (!z) return;
    var conf = '<a href="confidentialite" target="_blank" rel="noopener">Politique de confidentialité</a>';
    if (!actif()) { z.innerHTML = '<div class="est">Bientôt : un compte facultatif pour retrouver tes données sur un autre téléphone. En attendant, tout reste sur celui-ci. Pense à <button class="lien" id="cExp">exporter tes données</button> de temps en temps.</div>'; $('cExp').onclick = function(){ var b = $('exp'); if (b){ b.focus(); b.click(); } }; return; }
    function occupe(btn, on, txt){ if (!btn) return; if (on){ btn.dataset.t = btn.textContent; btn.disabled = true; btn.textContent = txt || 'Patiente…'; } else { btn.disabled = false; if (btn.dataset.t) btn.textContent = btn.dataset.t; } }
    function horsLigne(){ if (sb) return false; etat('Pas de réseau : réessaie quand tu es connecté à Internet.', 1); return true; }
    if (finSafari) {
      z.innerHTML = '<div class="card hero" role="status" style="margin:0"><div class="titre" style="font-size:22px">' + finSafari + '</div><p style="margin:8px 0 0">Ferme cette page et rouvre CookYourself depuis l\'icône sur ton écran d\'accueil' + (finSafari.indexOf('Mot de passe') === 0 ? ', puis connecte-toi avec ton nouveau mot de passe.' : ', puis connecte-toi.') + '</p></div>';
      return;
    }
    if (modeReset) {
      z.innerHTML = '<p class="est" style="margin:0 0 8px">Choisis ton nouveau mot de passe (8 caractères minimum).</p><form id="cResetForm"><input type="email" autocomplete="username" value="' + esc(user ? user.email : '') + '" readonly hidden><label for="cNouveau">Nouveau mot de passe</label><div style="display:flex;gap:8px;align-items:center"><input id="cNouveau" type="password" autocomplete="new-password" minlength="8" aria-describedby="cEtat" style="flex:1"><button type="button" id="cVoir2" aria-label="Afficher le mot de passe" aria-controls="cNouveau" aria-pressed="false" style="flex:0 0 auto;min-width:44px;min-height:44px">Voir</button></div><button class="main" type="submit" style="margin-top:12px">Enregistrer</button></form><div style="margin-top:8px"><button class="lien" id="cResetAnnul">Annuler</button></div><div class="est" id="cEtat" role="status" style="margin-top:8px"></div>';
      $('cVoir2').onclick = function(){ var p = $('cNouveau'), v = p.type === 'password'; p.type = v ? 'text' : 'password'; this.textContent = v ? 'Cacher' : 'Voir'; this.setAttribute('aria-pressed', v); };
      $('cResetAnnul').onclick = async function(){ modeReset = false; await sb.auth.signOut(); user = null; dessiner(); };
      $('cResetForm').onsubmit = async function(e){
        e.preventDefault(); var p = $('cNouveau').value, btn = this.querySelector('[type=submit]');
        if (p.length < 8) { etat('8 caractères minimum.', 1); $('cNouveau').focus(); return; }
        occupe(btn, 1);
        var r = await sb.auth.updateUser({ password: p });
        occupe(btn, 0);
        if (r.error) { etat(/different/i.test(r.error.message) ? 'Choisis un mot de passe différent de l\'ancien.' : 'Impossible pour l\'instant. Réessaie, ou annule et redemande un e-mail.', 1); return; }
        modeReset = false;
        if (!navigator.standalone && !matchMedia('(display-mode: standalone)').matches) { finSafari = 'Mot de passe changé ✓'; await sb.auth.signOut(); user = null; dessiner(); return; }
        dessiner(); etat('C\'est fait ! Ton nouveau mot de passe est enregistré.'); synchro();
      };
      return;
    }
    if (!user) {
      var ins = vue === 'inscription';
      z.innerHTML = '<p class="est" style="margin:0 0 8px">Facultatif. Il sert seulement à sauvegarder tes données et à les retrouver sur un autre téléphone.</p>' +
        '<div class="seg" role="group" aria-label="Choisir"><button type="button" id="cVueCo" aria-pressed="' + !ins + '">J\'ai un compte</button><button type="button" id="cVueIns" aria-pressed="' + ins + '">Créer un compte</button></div>' +
        '<form id="cForm"><label for="cMail">Ton e-mail</label><input id="cMail" type="email" autocomplete="email" inputmode="email" placeholder="toi@exemple.fr">' +
        '<label for="cPass">Mot de passe' + (ins ? ' (8 caractères minimum)' : '') + '</label><div style="display:flex;gap:8px;align-items:center"><input id="cPass" type="password" autocomplete="' + (ins ? 'new-password' : 'current-password') + '" aria-describedby="cEtat" style="flex:1"><button type="button" id="cVoir" aria-label="Afficher le mot de passe" aria-controls="cPass" aria-pressed="false" style="flex:0 0 auto;min-width:44px;min-height:44px">Voir</button></div>' +
        (ins ? '<label style="display:flex;gap:12px;align-items:flex-start;min-height:44px;margin-top:12px;color:var(--ink);font-size:15px"><input id="cAccord" type="checkbox" style="width:24px;height:24px;flex:0 0 24px;margin-top:0;accent-color:var(--acc)"> <span>J\'accepte que mes données de santé (poids, repas, séances) soient sauvegardées sur un serveur en Europe, pour mon usage seulement. Je peux retirer cet accord à tout moment en supprimant mon compte.</span></label><div class="est" style="margin-top:6px">' + conf + '</div>' : '') +
        '<button class="main" type="submit" style="margin-top:12px">' + (ins ? 'Créer mon compte' : 'Me connecter') + '</button></form>' +
        (ins ? '' : '<div style="margin-top:8px"><button class="lien" id="cOubli">Mot de passe oublié ?</button></div>') +
        '<div class="est" id="cEtat" role="status" style="margin-top:8px"></div>';
      $('cVueCo').onclick = function(){ vue = 'connexion'; dessiner(); $('cVueCo').focus(); };
      $('cVueIns').onclick = function(){ vue = 'inscription'; dessiner(); $('cVueIns').focus(); };
      $('cVoir').onclick = function(){ var p = $('cPass'), v = p.type === 'password'; p.type = v ? 'text' : 'password'; this.textContent = v ? 'Cacher' : 'Voir'; this.setAttribute('aria-pressed', v); };
      if (mailEnCours) $('cMail').value = mailEnCours;
      if ($('cOubli')) $('cOubli').onclick = async function(){
        if (horsLigne()) return;
        var mail = $('cMail').value.trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) { etat('Tape d\'abord ton e-mail ci-dessus.', 1); $('cMail').focus(); return; }
        occupe(this, 1, 'Envoi…');
        var r = await sb.auth.resetPasswordForEmail(mail, { redirectTo: location.origin + location.pathname });
        occupe(this, 0);
        etat(r.error ? 'Envoi impossible pour l\'instant. Réessaie dans quelques minutes.' : 'E-mail envoyé. Clique sur le lien reçu pour choisir un nouveau mot de passe.', !!r.error);
      };
      $('cForm').onsubmit = async function(e){
        e.preventDefault();
        if (horsLigne()) return;
        var btn = this.querySelector('[type=submit]');
        var mail = $('cMail').value.trim(), pass = $('cPass').value;
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) { etat('Vérifie ton adresse e-mail.', 1); $('cMail').focus(); return; }
        if (ins && pass.length < 8) { etat('Le mot de passe doit faire 8 caractères minimum.', 1); return; }
        if (!pass) { etat('Tape ton mot de passe.', 1); return; }
        mailEnCours = mail;
        if (ins) {
          if (!$('cAccord').checked) { etat('Coche la case d\'accord pour continuer.', 1); return; }
          etat('Création du compte…'); occupe(btn, 1);
          var r = await sb.auth.signUp({ email: mail, password: pass, options: { emailRedirectTo: location.origin + location.pathname, data: { accord_sante: true, accord_version: VERSION_ACCORD } } });
          occupe(btn, 0);
          if (r.error) { etat(/registered|exists/i.test(r.error.message) ? 'Ce compte existe déjà : connecte-toi.' : /rate|limit/i.test(r.error.message) ? 'Trop d\'essais : réessaie dans une heure.' : 'Création impossible pour l\'instant. Réessaie dans quelques minutes.', 1); return; }
          if (r.data && r.data.user && r.data.user.identities && !r.data.user.identities.length) { vue = 'connexion'; dessiner(); etat('Ce compte existe déjà : connecte-toi avec ton mot de passe.', 1); return; }
          if (r.data && r.data.session) return;   /* confirmation désactivée : déjà connecté */
          vue = 'connexion'; dessiner(); etat('Presque fini ! Ouvre l\'e-mail envoyé à ' + mail + ' et touche le lien de confirmation. Tu seras connecté automatiquement. Pas d\'e-mail ? Regarde dans les spams.');
          var z2 = $('cZone'); if (z2) { var b2 = document.createElement('button'); b2.className = 'lien'; b2.textContent = 'Renvoyer l\'e-mail'; b2.onclick = async function(){ occupe(b2, 1, 'Envoi…'); var rr = await sb.auth.resend({ type: 'signup', email: mail }); occupe(b2, 0); etat(rr.error ? 'Renvoi impossible pour l\'instant (limite d\'envoi). Réessaie plus tard.' : 'E-mail renvoyé à ' + mail + '.', !!rr.error); }; z2.appendChild(b2); }
        } else {
          etat('Connexion…'); occupe(btn, 1);
          var c = await sb.auth.signInWithPassword({ email: mail, password: pass });
          occupe(btn, 0);
          if (c.error) { var m = c.error.message || '', st = c.error.status; etat(/confirm/i.test(m) ? 'Confirme d\'abord ton adresse avec l\'e-mail reçu, puis réessaie.' : st === 429 || /rate/i.test(m) ? 'Trop d\'essais : attends quelques minutes.' : /invalid/i.test(m) ? 'E-mail ou mot de passe incorrect.' : 'Pas de réseau ou serveur indisponible. Réessaie.', 1); return; }
          mailEnCours = '';
        }
      };
    } else {
      var partenaire = window.CYdroits && window.CYdroits.plan() === 'design_partner';
      z.innerHTML = '<div style="font-weight:600">Connecté : ' + esc(user.email) + (partenaire ? ' <span style="display:inline-block;font-size:12px;padding:2px 9px;border-radius:999px;background:var(--acc2);color:var(--acc-ink)">Design partner ✨</span>' : '') + '</div>' +
        '<div class="est" id="cEtat" role="status" style="margin:4px 0 10px">Tes données sont sauvegardées automatiquement.</div><div id="cChoix"></div>' +
        '<div class="row"><button id="cSync">Sauvegarder maintenant</button><button id="cDeco">Se déconnecter</button></div>' +
        '<p class="est">Te déconnecter n\'efface rien sur ce téléphone.</p>' +
        '<div class="card" style="background:var(--soft);margin:12px 0 0"><b>Ton avis nous aide</b><p class="est" style="margin:4px 0 8px">Tu fais partie des premiers utilisateurs. Dis-nous ce qui marche et ce qui manque.</p>' +
        '<form id="cAvisForm"><label for="cNote">Ta note</label><select id="cNote"><option value="5">5 - J\'adore</option><option value="4">4 - Bien</option><option value="3">3 - Moyen</option><option value="2">2 - Bof</option><option value="1">1 - Pas du tout</option></select>' +
        '<label for="cAvis">Ce qui te plaît, ce qui manque, un bug…</label><textarea id="cAvis" rows="3" maxlength="2000" style="width:100%;font:inherit;padding:11px;border:2px solid var(--line);border-radius:14px;background:var(--card);color:var(--ink)"></textarea>' +
        '<label style="display:flex;gap:12px;align-items:center;min-height:44px;color:var(--ink);font-size:15px"><input id="cRecontact" type="checkbox" style="width:24px;height:24px;flex:0 0 24px;accent-color:var(--acc)"> On peut me recontacter par e-mail</label>' +
        '<button type="submit" style="width:100%">Envoyer mon avis</button></form></div>' +
        '<div style="margin-top:14px"><button class="lien" id="cSuppr" style="color:var(--danger)">Supprimer mon compte et mes données en ligne</button></div><div id="cSupprZone"></div>' +
        '<div class="est" style="margin-top:6px">' + conf + '</div>';
      $('cSync').onclick = synchro;
      $('cDeco').onclick = async function(){ await sb.auth.signOut(); user = null; dessiner(); };
      $('cAvisForm').onsubmit = async function(e){
        e.preventDefault(); var t = $('cAvis').value.trim(); if (!t) { etat('Écris quelques mots avant d\'envoyer.', 1); return; }
        var r = await sb.from('retours').insert({ user_id: user.id, note: +$('cNote').value, texte: t, recontact: $('cRecontact').checked, ecran: 'reglages', version_appli: (window.CY_CONFIG && window.CY_CONFIG.version) || 'inconnue' });
        if (r.error) { etat('Envoi impossible pour l\'instant. Réessaie avec du réseau.', 1); return; }
        $('cAvis').value = ''; etat('Merci ! Ton avis est bien reçu.');
      };
      $('cSuppr').onclick = function(){
        $('cSupprZone').innerHTML = '<div class="card" role="alertdialog" aria-labelledby="cSupprT" style="background:var(--soft);margin-top:8px"><b id="cSupprT">Supprimer ton compte ?</b><p class="est">Ton compte et la copie en ligne seront effacés pour toujours. Les données restent sur ce téléphone.</p><div class="row"><button id="cSupprOui" style="background:var(--danger);color:var(--on-acc)">Oui, supprimer</button><button id="cSupprNon">Annuler</button></div></div>';
        $('cSupprNon').focus();
        $('cSupprNon').onclick = function(){ $('cSupprZone').innerHTML = ''; $('cSuppr').focus(); };
        $('cSupprOui').onclick = async function(){
          this.disabled = true; this.textContent = 'Suppression…';
          var r = await sb.rpc('supprimer_mon_compte');
          if (r.error) { etat('Suppression impossible pour l\'instant. Réessaie avec du réseau.', 1); this.disabled = false; this.textContent = 'Oui, supprimer'; return; }
          var d = U.db(); delete d.compteId; U.remplacer(d);
          await sb.auth.signOut(); user = null; dessiner(); etat('Compte supprimé.');
        };
      };
    }
  }

  async function demarrer(){
    dessiner();
    if (!actif()) { pretOk(false); return; }
    if (!window.supabase) {
      await new Promise(function(ok, ko){ var s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js'; s.crossOrigin = 'anonymous'; if (CFG.supabaseSri) s.integrity = CFG.supabaseSri; s.onload = ok; s.onerror = ko; document.head.appendChild(s); })
        .catch(function(){ etat('Hors ligne : la connexion au compte reviendra avec le réseau.', 1); });
      if (!window.supabase) { pretOk(false); return; }
    }
    /* Retour depuis un lien d'e-mail (ouvert dans Safari) : on lit l'adresse AVANT de créer le client. */
    var h = new URLSearchParams((location.hash || '').replace(/^#/, '')), typeLien = h.get('type'), erreurLien = h.get('error_description') || h.get('error');
    var dansSafari = !navigator.standalone && !(window.matchMedia && matchMedia('(display-mode: standalone)').matches);
    if (typeLien === 'recovery') modeReset = true;
    /* NE PAS passer en flowType 'pkce' : le lien ouvert dans Safari n'aurait plus le bon jeton. */
    sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { persistSession: true, detectSessionInUrl: true } });
    sb.auth.onAuthStateChange(function(ev, session){ if (ev === 'SIGNED_OUT') modeReset = false; if (ev === 'PASSWORD_RECOVERY') { modeReset = true; user = session ? session.user : null; var nr = document.querySelector('[data-v="regl"]'); if (nr) nr.click(); dessiner(); return; } var avant = user; user = session ? session.user : null; if (!avant && user) { lirePlan().then(dessiner); dessiner(); synchro(); } else if (avant && !user) dessiner(); });
    var s = await sb.auth.getSession(); user = s.data.session ? s.data.session.user : null; pretOk(true);
    if (erreurLien) { history.replaceState(null, '', location.pathname); var nr2 = document.querySelector('[data-v="regl"]'); if (nr2) nr2.click(); dessiner(); etat('Ce lien a expiré ou a déjà servi. Retourne dans l\'appli et redemande un e-mail.', 1); return; }
    if (typeLien === 'signup' || typeLien === 'magiclink') {
      history.replaceState(null, '', location.pathname);
      if (user) { await sb.auth.signOut(); user = null; }
      if (document.querySelector('.onb')) return;   /* le premier lancement affiche déjà « Connecte-toi » avec le message */
      vue = 'connexion'; var nr3 = document.querySelector('[data-v="regl"]'); if (nr3) nr3.click(); dessiner(); etat('Ton compte a bien été validé ✓ Connecte-toi pour commencer.'); return;
    }
    if (modeReset) { var nr4 = document.querySelector('[data-v="regl"]'); if (nr4) nr4.click(); }
    dessiner();
    if (user && !modeReset) { lirePlan().then(dessiner).then(synchro); }
    document.addEventListener('cy:sauve', function(){ if (!user) return; clearTimeout(minuterie); minuterie = setTimeout(pousser, 3000); });
    document.addEventListener('visibilitychange', function(){ if (!document.hidden && user) synchro(); });
  }
  /* Utilisé par le premier lancement (écran « Crée ton compte »). Renvoie { ok, attente, message }. */
  async function inscrire(mail, pass){
    if (!(await pret)) return { ok:false, message:'Pas de réseau : tu pourras créer ton compte plus tard dans Réglages.' };
    var r = await sb.auth.signUp({ email: mail, password: pass, options: { emailRedirectTo: location.origin + location.pathname, data: { accord_sante: true, accord_version: VERSION_ACCORD } } });
    if (r.error) return { ok:false, message: /registered|exists/i.test(r.error.message) ? 'Ce compte existe déjà : choisis « J\'ai déjà un compte ».' : /rate|limit/i.test(r.error.message) ? 'Trop d\'essais : réessaie dans une heure.' : /password/i.test(r.error.message) ? 'Mot de passe trop faible : 8 caractères minimum.' : 'Création impossible pour l\'instant. Réessaie dans quelques minutes.' };
    if (r.data && r.data.user && r.data.user.identities && !r.data.user.identities.length) return { ok:false, message:'Ce compte existe déjà : choisis « J\'ai déjà un compte ».' };
    if (r.data && r.data.session) return { ok:true };
    return { ok:true, attente:true, message:'Presque fini ! Ouvre l\'e-mail envoyé à ' + mail + ' et touche le lien : tu seras connecté. Pas d\'e-mail ? Regarde dans les spams.' };
  }
  async function connecter(mail, pass){
    if (!(await pret)) return { ok:false, message:'Pas de réseau : réessaie plus tard dans Réglages.' };
    var c2 = await sb.auth.signInWithPassword({ email: mail, password: pass });
    if (c2.error) { var m = c2.error.message || ''; return { ok:false, message: /confirm/i.test(m) ? 'Confirme d\'abord ton adresse avec l\'e-mail reçu.' : (c2.error.status === 429 || /rate/i.test(m)) ? 'Trop d\'essais : attends quelques minutes.' : /invalid/i.test(m) ? 'E-mail ou mot de passe incorrect.' : 'Pas de réseau ou serveur indisponible. Réessaie.' }; }
    return { ok:true };
  }
  async function oubli(mail){
    if (!(await pret)) return { ok:false, message:'Pas de réseau : réessaie plus tard.' };
    var r = await sb.auth.resetPasswordForEmail(mail, { redirectTo: location.origin + location.pathname });
    return r.error ? { ok:false, message:'Envoi impossible pour l\'instant. Réessaie dans quelques minutes.' } : { ok:true, message:'E-mail envoyé. Touche le lien reçu pour choisir un nouveau mot de passe.' };
  }
  window.CYcompte = { fusion: fusion, inscrire: inscrire, connecter: connecter, oubli: oubli, actif: actif, connecte: function(){ return !!user; } };
  /* Arrivée depuis la landing page (?inscription=1) quand le premier lancement est déjà fait : ouvrir « Créer un compte ». */
  try { if (/[?&]inscription=1/.test(location.search)) { history.replaceState(null, '', location.pathname); if (!document.querySelector('.onb')) { vue = 'inscription'; var nr = document.querySelector('[data-v="regl"]'); if (nr) nr.click(); } } } catch (e) {}   /* exposé pour les tests */
  demarrer();
})();
