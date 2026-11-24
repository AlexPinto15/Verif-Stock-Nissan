# Verif-Stock-Nissan

## Recherche manuelle d'une désignation

Pour une référence sans désignation, les boutons Google et Bing ouvrent une recherche contenant la référence et le modèle du véhicule. Choisir le résultat pertinent, copier sa désignation dans le champ de la référence, puis cliquer sur « Enregistrer ». Cette recherche manuelle n’utilise ni API, ni clé, ni service payant.

Le catalogue DCSnet peut aussi être partagé de façon privée avec les utilisateurs connectés. Avant le premier import, exécuter `supabase/atelier-part-catalog.sql` dans le SQL Editor du projet Supabase. Dans le bloc-notes, utiliser « Importer catalogue DCSnet » et sélectionner le fichier Excel/CSV. Seules les références et désignations sont envoyées à Supabase ; prix et casiers sont ignorés. Lorsqu’une référence sans désignation est ajoutée au bloc-notes, le catalogue est consulté automatiquement et la désignation est remplie si la référence correspond exactement. En cas d’absence ou d’échec, la recherche manuelle et la saisie restent disponibles.

Le bouton « Traduire en français » apparaît pour les désignations contenant des termes anglais reconnus et est masqué pour celles contenant des termes français reconnus. Il affiche la proposition directement dans le bloc-notes. Seule la désignation est transmise au service Google Translate ; il faut vérifier la traduction avant de l’utiliser. Le service gratuit peut être limité ou indisponible.

Les notes partagées ont un statut. Exécuter `supabase/atelier-notes-status.sql` dans le SQL Editor Supabase pour ajouter la colonne, puis choisir un statut lors de chaque enregistrement. L’onglet « Notes enregistrées » permet de filtrer par Commandé, Attente Mail, Devis ou Attente téléphone. Les fiches existantes seront classées « Devis » par défaut.