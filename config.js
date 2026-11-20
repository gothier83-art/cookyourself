/* Réglages du serveur CookYourself.
   Vide = l'appli marche sans compte, tout reste sur le téléphone (comme avant).
   Pour activer les comptes : coller ici l'URL du projet Supabase et la clé « anon public »
   (Supabase > Project Settings > API). Cette clé est faite pour être publique :
   la sécurité vient des règles RLS de la base (supabase/schema.sql). */
window.CY_CONFIG = {
  supabaseUrl: 'https://pudtnebtevzkrwnjgosb.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZHRuZWJ0ZXZ6a3J3bmpnb3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxNjA2MDgsImV4cCI6MjExMDczNjYwOH0.7ljD1XSc8LgpNsb0OpOy4ECrJpLaBchJMoi-ipWJZn4',
  /* Phase en cours : 'design_partners' = tout est gratuit pour tout le monde.
     Plus tard : 'payant' = les droits viennent de la table abonnements. */
  /* Empreinte de supabase-js@2.45.4 (jsdelivr) : le navigateur refuse le fichier s'il a été modifié. */
  supabaseSri: 'sha384-0w2KAL2YHP6wKOkUDzkCDGgVvfmHnj02DHeQ6XcHOgTfFsGyonKOpShMH1x6nk9o',
  phase: 'design_partners',
  version: 'v43'
};
