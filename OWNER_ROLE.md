# Rôle Owner - Gestion de la Famille Nucléaire

## Vue d'ensemble

Le rôle **Owner** est un type d'utilisateur intermédiaire entre Admin et User, permettant à un membre de la famille de gérer uniquement sa famille nucléaire (parents, frères/sœurs, conjoint(s) et enfants).

## Hiérarchie des rôles

1. **Admin** : Accès complet à tous les membres et relations
2. **Owner** : Gestion limitée à sa famille nucléaire
3. **User** : Lecture seule de l'arbre généalogique

## Définition de la famille nucléaire

Pour un Owner donné, la famille nucléaire comprend :

- **Le Owner lui-même**
- **Ses parents** (père et mère)
- **Ses frères et sœurs** (partageant au moins un parent)
- **Son/ses conjoint(s)** (relations de type spouse)
- **Ses enfants** (relations parent-enfant où le Owner est parent)
- **Les membres orphelins** (membres sans aucune relation) - Cela permet à l'Owner de créer la première relation pour un membre nouvellement ajouté

### Gestion des membres orphelins

Un membre est considéré comme "orphelin" s'il n'a aucune relation (ni parent, ni enfant, ni conjoint) avec aucun autre membre de l'arbre. Ces membres orphelins sont automatiquement inclus dans la famille nucléaire de l'Owner pour permettre :

1. **Création de la première relation** : L'Owner peut ajouter un nouveau membre et immédiatement créer une relation avec lui
2. **Édition avant relation** : L'Owner peut corriger les informations d'un membre nouvellement créé avant de le relier
3. **Suppression si erreur** : L'Owner peut supprimer un membre créé par erreur avant qu'il ne soit relié

**Note importante** : Dès qu'un membre orphelin est relié à quelqu'un, il ne sera plus automatiquement dans la famille nucléaire de tous les Owners. Il ne restera modifiable que par les Owners dont il fait réellement partie de la famille nucléaire.

## Permissions du Owner

### ✅ Actions autorisées

- **Ajouter** de nouveaux membres dans sa famille nucléaire
- **Modifier** les informations des membres de sa famille nucléaire
- **Supprimer** les membres de sa famille nucléaire (sauf lui-même)
- **Créer** des relations entre les membres de sa famille nucléaire
- **Consulter** l'arbre généalogique complet (lecture seule hors famille nucléaire)
- **Gérer** les photos et galeries des membres de sa famille nucléaire
- **Modifier** ses propres identifiants de connexion

### ❌ Actions interdites

- Modifier des membres hors de sa famille nucléaire
- Supprimer des membres hors de sa famille nucléaire
- Se supprimer lui-même
- Créer des relations impliquant des membres hors de sa famille nucléaire
- Supprimer tous les membres (fonction réservée à l'admin)

## Architecture technique

### Migration de base de données

```sql
-- Fichier: supabase/migrations/009_add_owner_user_type.sql
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'owner';
```

Le type `user_type` accepte maintenant trois valeurs :
- `'admin'` : Administrateur
- `'owner'` : Propriétaire de famille nucléaire
- `'user'` : Utilisateur en lecture seule

### Composant principal

**Fichier** : `app/components/OwnerTreeView.tsx`

Ce composant gère l'interface pour les utilisateurs de type Owner :

```typescript
interface OwnerTreeViewProps {
  onLogout: () => void;
  ownerId: string; // ID du membre associé au Owner
}
```

### Calcul de la famille nucléaire

**Fichier** : `lib/utils/nuclear-family.ts`

La fonction `calculateNuclearFamily` détermine les membres de la famille nucléaire :

```typescript
export function calculateNuclearFamily(
  memberId: string,
  allMembers: Member[],
  allRelationships: Relationship[]
): NuclearFamily
```

### Algorithme** :
1. Trouve les parents du Owner
2. Trouve les frères/sœurs (enfants des mêmes parents)
3. Trouve les conjoints (relations de type spouse)
4. Trouve les enfants (relations parent-enfant)
5. Ajoute les membres orphelins (sans aucune relation) pour permettre la création de la première relation

### Validation des permissions

Avant chaque action de modification, le système vérifie :

```typescript
// Vérification si le membre appartient à la famille nucléaire
if (!nuclearFamilyMembers.find(m => m.id === member.id)) {
  toast.error('Vous ne pouvez modifier que les membres de votre famille nucléaire');
  return;
}
```

## Interface utilisateur

### En-tête
- Bouton "Ajouter un membre"
- Bouton "Ajouter une relation" (désactivé si moins de 2 membres dans la famille nucléaire)
- Bouton "Identifiants" (modifier ses credentials)
- Bouton "Déconnexion"

### Arbre généalogique
- Affichage de tous les membres (lecture seule hors famille nucléaire)
- Interactions limitées aux membres de la famille nucléaire
- Indicateurs visuels pour distinguer les membres modifiables

### Modales
- Formulaire d'ajout/modification de membre
- Formulaire de création de relation
- Formulaire de changement d'identifiants
- Dialogue de confirmation pour les suppressions

## Flux d'utilisation typique

1. **Connexion** : Le Owner se connecte avec ses identifiants
2. **Visualisation** : Il voit l'arbre généalogique complet
3. **Identification** : Le système calcule sa famille nucléaire
4. **Gestion** : Il peut ajouter/modifier/supprimer uniquement dans sa famille nucléaire
5. **Restrictions** : Les tentatives de modification hors périmètre sont bloquées avec un message d'erreur

## Cas d'usage

### Exemple 1 : Ajout d'un enfant
Un Owner peut ajouter un nouveau membre et créer une relation parent-enfant avec lui-même.

**Flux** :
1. Owner clique sur "Ajouter un membre"
2. Remplit le formulaire (nom, prénom, date de naissance, etc.)
3. Le membre est créé sans relation (orphelin)
4. Le membre apparaît dans la famille nucléaire (car orphelin)
5. Owner clique sur "Ajouter une relation"
6. Sélectionne lui-même comme parent et le nouveau membre comme enfant
7. La relation est créée, le membre reste dans la famille nucléaire

### Exemple 2 : Modification d'un parent
Un Owner peut corriger les informations de son père ou de sa mère.

### Exemple 3 : Ajout d'un conjoint
Un Owner peut ajouter son conjoint et créer la relation spouse.

### Exemple 4 : Tentative de modification d'un cousin
Le système bloque l'action car le cousin n'est pas dans la famille nucléaire.

### Exemple 5 : Membre créé par erreur
1. Owner ajoute un membre par erreur
2. Le membre est orphelin, donc modifiable
3. Owner peut le supprimer immédiatement
4. Aucune relation n'a été créée, pas d'impact sur l'arbre

## Sécurité

### Validation côté client
- Vérification de l'appartenance à la famille nucléaire avant affichage des boutons d'action
- Messages d'erreur explicites pour les actions non autorisées

### Validation côté serveur
Les API routes doivent également vérifier les permissions :
- Vérifier le type d'utilisateur (owner)
- Calculer la famille nucléaire
- Valider que l'action concerne uniquement la famille nucléaire

## Identifiants par défaut

Les Owners sont créés manuellement par l'Admin. Leurs identifiants suivent le même format que les Users :
- **Username** : premier nom + premier prénom en minuscules
- **Password** : identique au username (à changer lors de la première connexion)

## Améliorations futures recommandées

1. **Validation API** : Ajouter des middlewares pour vérifier les permissions côté serveur
2. **Audit trail** : Logger toutes les actions des Owners
3. **Notifications** : Alerter l'Admin des modifications importantes
4. **Limites** : Définir des quotas (nombre max de membres ajoutés par jour)
5. **Délégation** : Permettre à un Owner de déléguer temporairement ses droits
6. **Multi-Owner** : Gérer plusieurs Owners pour la même famille nucléaire (ex: couple)
7. **Approbation** : Soumettre certaines modifications à validation Admin

## Migration depuis User vers Owner

Pour promouvoir un User existant en Owner :

```sql
UPDATE users 
SET user_type = 'owner' 
WHERE username = 'nom_utilisateur';
```

## Dépannage

### Problème : Un Owner ne voit pas tous les membres de sa famille nucléaire
- Vérifier que les relations parent-enfant et spouse sont correctement définies
- Vérifier le calcul dans `calculateNuclearFamily`

### Problème : Un Owner peut modifier des membres hors périmètre
- Vérifier la validation dans `OwnerTreeView.tsx`
- Ajouter des validations côté serveur dans les API routes

### Problème : Le bouton "Ajouter une relation" est désactivé
- Il faut au moins 2 membres dans la famille nucléaire pour créer une relation
- Ajouter d'abord un membre (parent, enfant ou conjoint)

## Fichiers concernés

- `supabase/migrations/009_add_owner_user_type.sql` : Migration de la base de données
- `app/components/OwnerTreeView.tsx` : Interface Owner
- `lib/utils/nuclear-family.ts` : Calcul de la famille nucléaire
- `lib/types.ts` : Types TypeScript (user_type)
- `AUTHENTICATION.md` : Documentation du système d'authentification
