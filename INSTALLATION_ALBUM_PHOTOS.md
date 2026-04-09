# Installation de l'Album Photos Collaboratif

## Étapes d'installation

### 1. Migration de la base de données

Exécutez la migration SQL dans votre dashboard Supabase:

1. Allez dans **SQL Editor** dans votre dashboard Supabase
2. Créez une nouvelle requête
3. Copiez et collez le contenu de `supabase/migrations/008_create_member_gallery_photos_table.sql`
4. Cliquez sur **Run** pour exécuter la migration
5. Vérifiez que la table `member_gallery_photos` a été créée dans **Table Editor**

### 2. Vérification du bucket de stockage

Assurez-vous que le bucket `member-photos` existe et est correctement configuré:

1. Allez dans **Storage** dans votre dashboard Supabase
2. Vérifiez que le bucket `member-photos` existe
3. Si ce n'est pas le cas, créez-le:
   - Cliquez sur **Create a new bucket**
   - Nom: `member-photos`
   - **Public bucket**: Activé (ON)
   - Cliquez sur **Create bucket**

### 3. Configuration des politiques de stockage

Le bucket doit avoir les politiques suivantes (normalement déjà configurées):

```sql
-- Lecture publique
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'member-photos');

-- Insertion publique
CREATE POLICY "Public insert access"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'member-photos');

-- Mise à jour publique
CREATE POLICY "Public update access"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'member-photos');

-- Suppression publique
CREATE POLICY "Public delete access"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'member-photos');
```

### 4. Redémarrage de l'application

Après avoir effectué les migrations, redémarrez votre application Next.js:

```bash
npm run dev
```

## Vérification de l'installation

### Test 1: Visualisation de la galerie
1. Connectez-vous en tant qu'admin ou user
2. Cliquez sur un membre dans l'arbre généalogique
3. Dans la modal de détails, scrollez jusqu'à la section "Album Photos"
4. La section doit s'afficher avec le message "Aucune photo dans l'album"

### Test 2: Ajout d'une photo
1. Cliquez sur le bouton "+ Ajouter une photo"
2. Sélectionnez une image (JPEG, PNG ou WEBP, max 5MB)
3. La photo doit s'uploader et apparaître dans la galerie
4. Un message de succès doit s'afficher

### Test 3: Suppression d'une photo (Admin)
1. Connectez-vous en tant qu'admin
2. Survolez une photo dans n'importe quelle galerie
3. Un bouton de suppression (X) doit apparaître
4. Cliquez dessus et confirmez
5. La photo doit être supprimée

### Test 4: Suppression d'une photo (User)
1. Connectez-vous en tant qu'user
2. Ouvrez votre propre galerie
3. Survolez n'importe quelle photo dans votre galerie
4. Le bouton de suppression doit apparaître pour TOUTES les photos
5. Cliquez dessus et confirmez → La photo doit être supprimée
6. Ouvrez la galerie d'un autre membre
7. Le bouton de suppression ne doit PAS apparaître

### Test 5: Édition du profil (User)
1. Connectez-vous en tant qu'user
2. Cliquez sur votre propre membre dans l'arbre
3. Le bouton "Modifier" doit être visible
4. Cliquez dessus et modifiez vos informations
5. Sauvegardez → Les modifications doivent être appliquées
6. Ouvrez la modal d'un autre membre
7. Le bouton "Modifier" ne doit PAS être visible

## Dépannage

### Erreur "Erreur lors de l'upload de la photo"
- Vérifiez que le bucket `member-photos` existe
- Vérifiez que le bucket est configuré comme public
- Vérifiez que les politiques de stockage sont correctement configurées
- Vérifiez vos variables d'environnement Supabase

### Les photos ne s'affichent pas
- Vérifiez que la table `member_gallery_photos` existe
- Vérifiez que les URLs des photos sont accessibles publiquement
- Ouvrez la console du navigateur pour voir les erreurs

### Impossible de supprimer une photo
- Vérifiez que vous êtes connecté
- Si vous êtes un user, vérifiez que:
  - C'est votre propre galerie (member_id === votre member_id)
  - Vous pouvez supprimer n'importe quelle photo dans votre galerie, peu importe qui l'a ajoutée
- Si vous êtes admin, vérifiez votre session

### Le bouton "Modifier" n'apparaît pas
- Pour les users: Vérifiez que vous consultez votre propre profil
- Vérifiez que votre session est valide
- Vérifiez que `session.memberId` correspond bien à l'ID du membre

## Structure des fichiers créés/modifiés

### Nouveaux fichiers
- `supabase/migrations/008_create_member_gallery_photos_table.sql` - Migration de la table
- `app/api/members/[id]/gallery/route.ts` - API pour lister et ajouter des photos
- `app/api/members/[id]/gallery/[photoId]/route.ts` - API pour supprimer une photo
- `app/components/members/PhotoGallery.tsx` - Composant de galerie photos
- `hooks/useGallery.ts` - Hook pour gérer les photos de galerie
- `PHOTO_GALLERY.md` - Documentation de la fonctionnalité
- `INSTALLATION_ALBUM_PHOTOS.md` - Ce fichier

### Fichiers modifiés
- `lib/types.ts` - Ajout des types GalleryPhoto et GalleryPhotoFormData
- `app/components/members/MemberDetail.tsx` - Intégration du composant PhotoGallery
- `app/components/UserTreeView.tsx` - Ajout de l'édition du profil pour les users
- `app/api/members/[id]/route.ts` - Ajout des permissions d'édition pour les users
- `supabase/SETUP.md` - Documentation de la nouvelle table

## Support

Pour toute question ou problème, consultez:
- `PHOTO_GALLERY.md` pour la documentation complète
- `supabase/SETUP.md` pour la configuration Supabase
- Les logs de la console du navigateur pour les erreurs côté client
- Les logs du serveur Next.js pour les erreurs côté serveur
