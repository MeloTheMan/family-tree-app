# Améliorations de l'interface Owner

## Vue d'ensemble

Ce document décrit les améliorations apportées à l'interface utilisateur pour le rôle Owner, alignant son comportement avec celui du rôle User tout en conservant les permissions de modification limitées à la famille nucléaire.

## Changements implémentés

### 1. Affichage des modales d'information

**Avant** : Les boutons de modification et suppression apparaissaient directement dans l'arbre via le composant `FamilyTree`.

**Après** : 
- Clic sur un membre → Ouverture d'une modale `MemberDetail` avec toutes les informations
- Les boutons de modification/suppression n'apparaissent que si le membre fait partie de la famille nucléaire
- Affichage en lecture seule pour les membres hors famille nucléaire

### 2. Calcul et affichage de la relation avec l'Owner

Chaque modale affiche maintenant le lien de parenté entre le membre sélectionné et l'Owner connecté :

```typescript
// Exemple d'affichage
"Lien de parenté: Frère/Sœur"
"Lien de parenté: Grand-parent"
"Lien de parenté: Cousin(e)"
```

Cette fonctionnalité utilise la fonction `calculateRelationship` du fichier `lib/utils/relationship-calculator.ts`.

### 3. Coloration différenciée de la famille nucléaire

Dans les modales, les membres de la famille nucléaire sont affichés avec des couleurs distinctives :

- **Parents** : Fond violet (`bg-purple-50`, hover `bg-purple-100`)
- **Frères et sœurs** : Fond vert (`bg-green-50`, hover `bg-green-100`)
- **Autres relations** : Fond gris standard (`bg-gray-50`)

Cette coloration aide l'Owner à identifier visuellement sa famille nucléaire.

## Architecture technique

### Composants modifiés

#### `app/components/OwnerTreeView.tsx`

**Ajouts** :
```typescript
// État pour la modale de détail
const [selectedMember, setSelectedMember] = useState<MemberWithRelationships | null>(null);

// Fonction pour construire un membre avec ses relations
const getMemberWithRelationships = (member: Member): MemberWithRelationships => {
  // Récupère parents, enfants, conjoints
  return { ...member, parents, children, spouses };
};

// Gestionnaire de clic sur un membre
const handleMemberClick = (memberId: string) => {
  const member = members.find(m => m.id === memberId);
  if (member) {
    setSelectedMember(getMemberWithRelationships(member));
  }
};
```

**Modifications** :
- `handleEditMember` : Ne prend plus de paramètre, utilise `selectedMember`
- `handleDeleteMember` : Ne prend plus de paramètre, utilise `selectedMember`
- `FamilyTree` : Passe en mode lecture seule avec `onMemberClick` au lieu de `onEditMember`/`onDeleteMember`

**Nouvelle modale** :
```tsx
{selectedMember && !modalType && (
  <MemberDetail
    member={selectedMember}
    onEdit={handleEditMember}
    onDelete={handleDeleteMember}
    onClose={() => setSelectedMember(null)}
    readOnly={!nuclearFamilyMembers.find(m => m.id === selectedMember.id)}
    currentUserMemberId={ownerId}
    allMembers={members}
    allRelationships={relationships}
  />
)}
```

#### `app/components/members/MemberDetail.tsx`

Ce composant était déjà implémenté pour le rôle User. Il gère :

1. **Affichage du lien de parenté** :
```typescript
const relationshipLabel = currentUserMemberId && allMembers.length > 0
  ? calculateRelationship(currentUserMemberId, member.id, allMembers, allRelationships)
  : null;
```

2. **Calcul de la famille nucléaire** :
```typescript
const nuclearFamily = allMembers.length > 0 && allRelationships.length > 0
  ? calculateNuclearFamily(member.id, allMembers, allRelationships)
  : null;
```

3. **Affichage conditionnel des boutons** :
```typescript
{!readOnly && (
  <div className="flex gap-2 mt-6">
    <button onClick={onEdit}>Modifier</button>
    {onDelete && <button onClick={onDelete}>Supprimer</button>}
  </div>
)}
```

4. **Coloration de la famille nucléaire** :
- Parents : `bg-purple-50` avec icône violette
- Frères/sœurs : `bg-green-50` avec icône verte

## Flux utilisateur

### Scénario 1 : Consultation d'un membre de la famille nucléaire

1. Owner clique sur son père dans l'arbre
2. Modale s'ouvre avec :
   - Photo et informations du père
   - Badge "Lien de parenté: Parent"
   - Liste des relations (enfants, conjoint)
   - Section famille nucléaire avec coloration
   - Boutons "Modifier" et "Supprimer" visibles
3. Owner peut modifier ou supprimer

### Scénario 2 : Consultation d'un membre hors famille nucléaire

1. Owner clique sur son cousin dans l'arbre
2. Modale s'ouvre avec :
   - Photo et informations du cousin
   - Badge "Lien de parenté: Cousin(e)"
   - Liste des relations
   - Section famille nucléaire du cousin (ses parents/frères)
   - **Aucun bouton de modification/suppression**
3. Owner peut seulement consulter

### Scénario 3 : Tentative de modification hors périmètre

1. Owner essaie de modifier un membre hors famille nucléaire
2. Message d'erreur : "Vous ne pouvez modifier que les membres de votre famille nucléaire"
3. Action bloquée

## Permissions détaillées

### Membres modifiables (famille nucléaire)

Pour un Owner donné, peuvent être modifiés/supprimés :
- ✅ Ses parents
- ✅ Ses frères et sœurs
- ✅ Son/ses conjoint(s)
- ✅ Ses enfants
- ✅ **Les membres orphelins** (sans aucune relation) - permet de créer la première relation

**Note** : Un membre orphelin est un membre qui n'a aucune relation avec personne. Cela permet à l'Owner de créer un membre, puis de le relier. Dès qu'une relation est créée, le membre n'est plus orphelin et les permissions normales s'appliquent.

### Membres en lecture seule

Tous les autres membres de l'arbre :
- ❌ Grands-parents
- ❌ Oncles/tantes
- ❌ Cousins
- ❌ Neveux/nièces
- ❌ Petits-enfants (si l'Owner a des petits-enfants)

### Exception

- ❌ L'Owner ne peut pas se supprimer lui-même (même s'il fait partie de sa famille nucléaire)

## Cohérence avec le rôle User

L'interface Owner reprend maintenant les mêmes patterns que le rôle User :

| Fonctionnalité | User | Owner |
|----------------|------|-------|
| Clic sur membre → Modale | ✅ | ✅ |
| Affichage lien de parenté | ✅ | ✅ |
| Coloration famille nucléaire | ✅ | ✅ |
| Section famille nucléaire | ✅ | ✅ |
| Boutons modification | ❌ (sauf son profil) | ✅ (famille nucléaire) |
| Galerie photos | ✅ | ✅ |

## Avantages de cette approche

1. **Cohérence UX** : Même expérience entre User et Owner
2. **Clarté visuelle** : Les couleurs indiquent clairement la famille nucléaire
3. **Feedback immédiat** : Le lien de parenté est affiché instantanément
4. **Sécurité** : Les boutons n'apparaissent que si l'action est autorisée
5. **Découvrabilité** : L'Owner peut explorer tout l'arbre avant de décider qui modifier

## Tests recommandés

### Test 1 : Affichage des boutons
- Se connecter en tant qu'Owner
- Cliquer sur un parent → Boutons visibles
- Cliquer sur un cousin → Pas de boutons

### Test 2 : Calcul des relations
- Vérifier que "Parent" s'affiche pour les parents
- Vérifier que "Frère/Sœur" s'affiche pour les frères/sœurs
- Vérifier que "Enfant" s'affiche pour les enfants
- Vérifier que "Cousin(e)" s'affiche pour les cousins

### Test 3 : Coloration
- Ouvrir la modale d'un membre
- Vérifier que ses parents sont en violet
- Vérifier que ses frères/sœurs sont en vert

### Test 4 : Permissions
- Essayer de modifier un membre de la famille nucléaire → Succès
- Essayer de modifier un membre hors famille nucléaire → Erreur
- Essayer de se supprimer soi-même → Erreur
- Ajouter un nouveau membre (orphelin) → Modifiable
- Créer une relation avec le membre → Reste modifiable si dans la famille nucléaire

### Test 5 : Membres orphelins
- Ajouter un nouveau membre sans relation
- Vérifier qu'il est modifiable (boutons visibles)
- Créer une relation avec ce membre
- Vérifier qu'il reste modifiable si dans la famille nucléaire
- Se connecter avec un autre Owner
- Vérifier que le membre n'est plus modifiable (sauf s'il fait partie de sa famille nucléaire)

## Fichiers concernés

- ✅ `app/components/OwnerTreeView.tsx` : Logique principale + gestion des orphelins
- ✅ `app/components/members/MemberDetail.tsx` : Modale de détail (réutilisée)
- ✅ `lib/utils/relationship-calculator.ts` : Calcul des relations (réutilisé)
- ✅ `lib/utils/nuclear-family.ts` : Calcul famille nucléaire (réutilisé)
- ✅ `lib/types.ts` : Types TypeScript (MemberWithRelationships)
- 📄 `OWNER_ORPHAN_MEMBERS.md` : Documentation de la gestion des orphelins

## Gestion des membres orphelins

Un problème important a été résolu : lorsqu'un Owner ajoute un nouveau membre, celui-ci n'a initialement aucune relation. Sans solution, l'Owner ne pourrait pas créer de relation avec ce membre (problème de "chicken and egg").

**Solution implémentée** : Les membres sans aucune relation (orphelins) sont automatiquement inclus dans la famille nucléaire de tous les Owners, permettant :
- De modifier leurs informations
- De créer la première relation avec eux
- De les supprimer s'ils ont été créés par erreur

Dès qu'une relation est créée, le membre n'est plus orphelin et les permissions normales s'appliquent.

Voir `OWNER_ORPHAN_MEMBERS.md` pour plus de détails sur cette fonctionnalité.

## Prochaines étapes possibles

1. **Indicateurs visuels dans l'arbre** : Colorer différemment les nœuds de la famille nucléaire
2. **Filtrage** : Ajouter un bouton "Afficher uniquement ma famille nucléaire"
3. **Notifications** : Alerter l'Owner quand un membre de sa famille nucléaire est modifié par un Admin
4. **Historique** : Logger les modifications faites par l'Owner
5. **Validation côté serveur** : Ajouter des checks dans les API routes
