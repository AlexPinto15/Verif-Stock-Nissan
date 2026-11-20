# Verif-Stock-Nissan

## Recherche manuelle d'une désignation

Pour une référence sans désignation, les boutons Google et Bing ouvrent une recherche contenant la référence et le modèle du véhicule. Choisir le résultat pertinent, copier sa désignation dans le champ de la référence, puis cliquer sur « Enregistrer ». Cette recherche manuelle n’utilise ni API, ni clé, ni service payant.

Le catalogue DCSnet peut aussi être partagé de façon privée avec les utilisateurs connectés. Avant le premier import, exécuter `supabase/atelier-part-catalog.sql` dans le SQL Editor du projet Supabase. Dans le bloc-notes, utiliser « Importer catalogue DCSnet » et sélectionner le fichier Excel/CSV. Seules les références et désignations sont envoyées à Supabase ; prix et casiers sont ignorés. Les références sans désignation peuvent ensuite être recherchées dans le catalogue partagé, puis choisies ou saisies manuellement.