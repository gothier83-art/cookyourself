/* Droits d'accès aux fonctions : un seul endroit à changer le jour où l'abonnement arrive.
   Aujourd'hui (phase design partners) : tout est ouvert, pour tout le monde, avec ou sans compte.
   Plus tard (phase 'payant') : payer = avoir un compte ; les droits viennent de la table abonnements.
   Usage dans l'appli : if (CYdroits.peut('menus')) { ... } */
(function(){
  /* Fonctions qui deviendront CookYourself+. La sauvegarde en ligne reste gratuite pour toujours. */
  var PAYANT = { menus:1, courses_prix:1, programmes_complets:1, stats_longues:1, recettes_toutes:1, coach_ia:1 };
  var plan = 'gratuit', fin = null;
  window.CYdroits = {
    phase: function(){ return (window.CY_CONFIG && window.CY_CONFIG.phase) || 'design_partners'; },
    plan: function(){ return plan; },
    definirPlan: function(p, finLe){ plan = p || 'gratuit'; fin = finLe ? new Date(finLe) : null; },
    peut: function(f){
      if (this.phase() === 'design_partners') return true;          /* tout gratuit pour l'instant */
      if (!PAYANT[f]) return true;                                    /* fonction gratuite pour toujours */
      if (fin && fin < new Date()) return false;                      /* offre terminée */
      return plan === 'plus' || plan === 'essai' || plan === 'design_partner';
    }
  };
})();
