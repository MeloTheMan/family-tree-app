# Album Photos Collaboratif

## Vue d'ensemble

L'album photos collaboratif permet à tous les utilisateurs (admin et users) d'ajouter des photos dans la galerie de chaque membre de la famille. Cependant, les permissions de suppression sont contrôlées selon le rôle et la propriété.

## Fonctionnalités

### Ajout de photos
- **Qui peut ajouter**: Tous les utilisateurs connectés (admin et users)
- **Où**: Dans la galerie de n'importe quel membre via la modal de détails
- **Formats acceptés**: JPEG, PNG, WEBP
- **Taille maximale**: 5 MB par photo
- **Légende**: Optionnelle lors de l'ajout

### Visualisation des photos
- **Qui peut voir**: Tous les utilisateurs (admin et users)
- **Affichage**: Grille de miniatures dans la section "Album Photos" de la modal de détails
- **Lightbox**: Clic sur une photo pour l'afficher en grand format

### Suppression de photos

Les règles de suppression sont les suivantes:

#### Pour les Administrateurs
- Peuvent supprimer **n'importe quelle photo** dans **n'importe quelle galerie**
- Contrôle total sur toutes les photos de tous les membres

#### Pour les Utilisateurs (Users)
- Peuvent supprimer **n'importe quelle photo** dans **leur propre galerie**
- Peu importe qui a ajouté la photo (eux-mêmes ou un autre utilisateur)
- Ne peuvent pas supprimer de photos dans les galeries des autres membres

#### Exemples de scénarios

**Scénario 1: Galerie du père**
- Le père a ajouté 2 photos
- La mère a ajouté 1 photo
- Le fils a ajouté 1 photo
- **Admin**: Peut supprimer les 4 photos
- **Le père**: Peut supprimer les 4 photos (toutes les photos de sa galerie)
- **La mère**: Ne peut rien supprimer (ce n'est pas sa galerie)
- **Le fils**: Ne peut rien supprimer (ce n'est pas sa galerie)

**Scénario 2: Galerie de la mère**
- Le père a ajouté 1 photo
- La mère a ajouté 3 photos
- **Admin**: Peut supprimer les 4 photos
- **Le père**: Ne peut rien supprimer (ce n'est pas sa galerie)
- **La mère**: Peut supprimer les 4 photos (toutes les photos de sa galerie)
- **Le fils**: Ne peut rien supprimer (ce n'est pas sa galerie)

## Édition du profil

### Pour les Administrateurs
- Peuvent modifier **tous les membres** de la famille
- Accès via le bouton "Modifier" dans la modal de détails

### Pour les Utilisateurs (Users)
- Peuvent modifier **uniquement leur propre profil**
- Le bouton "Modifier" n'apparaît que dans leur propre modal de détails
- Peuvent modifier: nom, prénom, date de naissance, lieu de naissance, profession, photo de profil

## Architecture technique

### Base de données

Table `member_gallery_photos`:
```sql
- id: UUID (clé primaire)
- member_id: UUID (référence vers members)
- uploaded_by_user_id: UUID (référence vers users)
- photo_url: TEXT (URL publique de la photo)
- caption: TEXT (légende optionnelle)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### API Endpoints

#### GET /api/members/[id]/gallery
Récupère toutes les photos de la galerie d'un membre
- **Authentification**: Non requise
- **Permissions**: Public

#### POST /api/members/[id]/gallery
Ajoute une photo à la galerie d'un membre
- **Authentification**: Requise
- **Permissions**: Tous les utilisateurs connectés
- **Body**: FormData avec `photo` (File) et `caption` (string, optionnel)

#### DELETE /api/members/[id]/gallery/[photoId]
Supprime une photo de la galerie
- **Authentification**: Requise
- **Permissions**: 
  - Admin: Peut supprimer n'importe quelle photo dans n'importe quelle galerie
  - User: Peut supprimer n'importe quelle photo dans sa propre galerie (member_id === session.memberId)

#### PUT /api/members/[id]
Met à jour les informations d'un membre
- **Authentification**: Requise pour les users
- **Permissions**:
  - Admin: Peut modifier n'importe quel membre
  - User: Peut modifier uniquement son propre profil (member_id === session.memberId)

### Composants React

#### PhotoGallery
- Affiche la grille de photos
- Gère l'ajout de nouvelles photos
- Gère la suppression selon les permissions
- Affiche le lightbox pour visualiser les photos en grand

#### MemberDetail
- Intègre le composant PhotoGallery
- Affiche le bouton "Modifier" selon les permissions
- Gère l'affichage des relations familiales

#### UserTreeView
- Permet aux users de modifier leur propre profil
- Affiche le formulaire d'édition dans une modal

### Hooks personnalisés

#### useGallery
```typescript
{
  photos: GalleryPhoto[]
  loading: boolean
  error: string | null
  fetchPhotos: (memberId: string) => Promise<void>
  addPhoto: (memberId: string, data: GalleryPhotoFormData) => Promise<GalleryPhoto | null>
  deletePhoto: (memberId: string, photoId: string) => Promise<boolean>
}
```

## Stockage des fichiers

Les photos sont stockées dans Supabase Storage:
- **Bucket**: `member-photos`
- **Structure**: `gallery/{member_id}/{uuid}.{ext}`
- **Accès**: Public (lecture)
- **Politiques**: Contrôlées par RLS (Row Level Security)

## Sécurité

### Validation côté client
- Taille maximale: 5 MB
- Types MIME autorisés: image/jpeg, image/png, image/webp

### Validation côté serveur
- Vérification de la taille du fichier
- Vérification du type MIME
- Vérification de l'authentification
- Vérification des permissions de suppression

### Row Level Security (RLS)
- Lecture: Publique pour toutes les photos
- Insertion: Utilisateurs authentifiés uniquement
- Suppression: Contrôlée par les politiques (admin ou propriétaire dans sa galerie)

## Migration

Pour activer cette fonctionnalité sur une instance existante:

1. Exécuter la migration `008_create_member_gallery_photos_table.sql` dans Supabase
2. Vérifier que le bucket `member-photos` existe et est configuré comme public
3. Redémarrer l'application Next.js

## Tests recommandés

1. **Test d'ajout de photo**
   - Se connecter en tant qu'admin
   - Ajouter une photo dans la galerie d'un membre
   - Vérifier que la photo apparaît dans la galerie

2. **Test de suppression - Admin**
   - Se connecter en tant qu'admin
   - Supprimer une photo dans n'importe quelle galerie
   - Vérifier que la photo est supprimée

3. **Test de suppression - User**
   - Se connecter en tant qu'user
   - Ouvrir votre propre galerie
   - Ajouter une photo
   - Demander à un autre user d'ajouter également une photo dans votre galerie
   - Survolez n'importe quelle photo dans votre galerie
   - Le bouton de suppression doit apparaître pour TOUTES les photos
   - Vous pouvez supprimer n'importe quelle photo dans votre galerie → Doit réussir
   - Ouvrez la galerie d'un autre membre
   - Le bouton de suppression ne doit PAS apparaître
   - Essayer de supprimer une photo dans la galerie d'un autre membre → Doit échouer

4. **Test d'édition de profil - User**
   - Se connecter en tant qu'user
   - Ouvrir sa propre modal de détails → Le bouton "Modifier" doit être visible
   - Modifier ses informations → Doit réussir
   - Ouvrir la modal d'un autre membre → Le bouton "Modifier" ne doit pas être visible

5. **Test de validation**
   - Essayer d'uploader un fichier > 5 MB → Doit échouer
   - Essayer d'uploader un fichier non-image → Doit échouer
