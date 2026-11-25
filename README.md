# Verif-Stock-Nissan

## Recherche manuelle d'une désignation

Pour une référence sans désignation, les boutons Google et Bing ouvrent une recherche contenant la référence et le modèle du véhicule. Choisir le résultat pertinent, copier sa désignation dans le champ de la référence, puis cliquer sur « Enregistrer ». Cette recherche manuelle n’utilise ni API, ni clé, ni service payant.

Le catalogue DCSnet peut aussi être partagé de façon privée avec les utilisateurs connectés. Avant le premier import, exécuter `supabase/atelier-part-catalog.sql` dans le SQL Editor du projet Supabase. Dans le bloc-notes, utiliser « Importer catalogue DCSnet » et sélectionner le fichier Excel/CSV. Seules les références et désignations sont envoyées à Supabase ; prix et casiers sont ignorés. Lorsqu’une référence sans désignation est ajoutée au bloc-notes, le catalogue est consulté automatiquement et la désignation est remplie si la référence correspond exactement. En cas d’absence ou d’échec, la recherche manuelle et la saisie restent disponibles.

Le bouton « Traduire en français » apparaît pour les désignations contenant des termes anglais reconnus et est masqué pour celles contenant des termes français reconnus. Il affiche la proposition directement dans le bloc-notes. Seule la désignation est transmise au service Google Translate ; il faut vérifier la traduction avant de l’utiliser. Le service gratuit peut être limité ou indisponible.

Les notes partagées ont un statut. Exécuter `supabase/atelier-notes-status.sql` dans le SQL Editor Supabase pour ajouter la colonne. Une fenêtre demande le statut à chaque enregistrement ou mise à jour. L’onglet « Notes enregistrées » permet de filtrer par Commandé, Attente Mail, Devis ou Attente téléphone. Les fiches existantes seront classées « Devis » par défaut.

Pour les rappels de commandes, exécuter ensuite `supabase/atelier-notes-order-reminders.sql` dans le SQL Editor Supabase. Lorsqu’une note est enregistrée avec le statut « Commandé », choisir la marque et un délai de J+1 à J+30. Le délai compte les jours ouvrés (hors samedi et dimanche) et le rappel apparaît à 9 h 30 dans le portail, y compris au prochain chargement du site s’il était fermé à l’échéance. Le rappel partagé reste affiché à l’équipe jusqu’à ce qu’un utilisateur le marque comme traité ou que la note soit mise à jour.

Dans le formulaire du bloc-notes, une capture de catalogue peut être copiée avec `Windows + Maj + S`, puis collée avec `Ctrl + V`. Si l’OCR détecte la plaque, le modèle et le VIN, une fenêtre permet de vérifier et d’intégrer ces valeurs à la note en cours. L’intégration ne sauvegarde pas la note : il faut ensuite utiliser le bouton habituel « Sauvegarder ». La capture est traitée dans le navigateur.