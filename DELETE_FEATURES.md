# Fonctionnalités de Suppression

## Vue d'ensemble

Deux fonctionnalités de suppression ont été ajoutées pour les administrateurs :
1. Suppression d'un membre individuel
2. Suppression complète de l'arbre généalogique

## 1. Suppression d'un membre individuel

### Accès
- Disponible uniquement pour les administrateurs
- Accessible via le bouton de suppression dans le panneau de détails du membre

### Fonctionnement

Lorsqu'un membre est supprimé, les éléments suivants sont automatiquement supprimés :

1. **Photo de profil** : Supprimée du stockage Supabase
2. **Photos de galerie** : Toutes les photos de la galerie du membre sont supprimées
3. **Relations familiales** : Toutes les relations où le membre apparaît (parent, enfant, conjoint)
4. **Données de position** : Position du nœud dans l'arbre
5. **Compte utilisateur** : Si le membre avait un compte utilisateur associé
6. **Enregistrement du membre** : L'enregistrement principal dans la base de données

### Interface utilisateur

- Bouton rouge avec icône de corbeille dans le panneau de détails
- Dialogue de confirmation avec avertissement clair
- Message indiquant que l'action est irréversible
- Toast de notification après la suppression

### Sécurité

- Vérification de l'ID du membre (format UUID)
- Vérification de l'existence du membre avant suppression
- Gestion des erreurs à chaque étape
- Les erreurs de suppression de fichiers ne bloquent pas la suppression du membre

## 2. Suppression complète de l'arbre

### Accès
- Disponible uniquement pour les administrateurs
- Bouton "Tout supprimer" dans l'en-tête de l'application
- Visible uniquement quand il y a au moins un membre dans l'arbre

### Fonctionnement

Cette action supprime TOUTES les données de l'arbre généalogique :

1. **Toutes les photos de profil** : Supprimées du stockage
2. **Toutes les photos de galerie** : Supprimées du stockage
3. **Tous les enregistrements de galerie** : Supprimés de la base de données
4. **Toutes les relations** : Supprimées de la base de données
5. **Toutes les positions** : Supprimées de la base de données
6. **Tous les comptes utilisateurs** : Supprimés (sauf le compte admin)
7. **Tous les membres** : Supprimés de la base de données

### Interface utilisateur

- Bouton rouge "Tout supprimer" dans l'en-tête
- Dialogue de confirmation avec double avertissement
- Message en majuscules indiquant que l'action est IRRÉVERSIBLE
- Toast de notification après la suppression
- L'interface revient à l'état vide après suppression

### Sécurité

- Vérification que l'utilisateur est authentifié
- Vérification que l'utilisateur est administrateur
- Le compte administrateur n'est jamais supprimé
- Gestion des erreurs pour chaque type de données

## Implémentation technique

### API Routes

#### DELETE /api/members/[id]
```typescript
// Supprime un membre spécifique et toutes ses données associées
DELETE /api/members/[id]
```

**Réponse succès :**
```json
{
  "success": true,
  "message": "Membre supprimé avec succès"
}
```

**Réponse erreur :**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Membre non trouvé"
  }
}
```

#### DELETE /api/members/delete-all
```typescript
// Supprime tous les membres et toutes les données (admin uniquement)
DELETE /api/members/delete-all
```

**Réponse succès :**
```json
{
  "success": true,
  "message": "Arbre généalogique supprimé avec succès"
}
```

**Réponse erreur :**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Accès refusé. Seuls les administrateurs peuvent supprimer tout l'arbre."
  }
}
```

### Hook useMembers

Deux nouvelles fonctions ajoutées :

```typescript
deleteMember(id: string): Promise<boolean>
deleteAllMembers(): Promise<boolean>
```

### Composants

#### ConfirmDialog
Composant réutilisable pour les dialogues de confirmation :
- Support du mode "danger" (rouge) pour les actions destructives
- Fermeture avec la touche Échap
- Animations fluides
- Personnalisation du titre, message et textes des boutons

#### MemberDetail
- Nouvelle prop `onDelete` optionnelle
- Bouton de suppression rouge à côté du bouton de modification
- Visible uniquement en mode admin (readOnly = false)

#### FamilyTreeApp
- Gestion des dialogues de confirmation
- Intégration avec le hook useMembers
- Notifications toast pour les succès et erreurs
- Bouton "Tout supprimer" dans l'en-tête

## Ordre de suppression

Pour éviter les erreurs de contraintes de clés étrangères, l'ordre de suppression est important :

### Suppression d'un membre
1. Photos (stockage)
2. Relations (base de données)
3. Positions (base de données)
4. Photos de galerie (base de données)
5. Compte utilisateur (base de données)
6. Membre (base de données)

### Suppression complète
1. Photos de profil (stockage)
2. Photos de galerie (stockage)
3. Enregistrements de galerie (base de données)
4. Relations (base de données)
5. Positions (base de données)
6. Comptes utilisateurs non-admin (base de données)
7. Membres (base de données)

## Gestion des erreurs

- Les erreurs de suppression de fichiers sont loguées mais ne bloquent pas la suppression
- Les erreurs de base de données sont retournées à l'utilisateur
- Chaque étape est protégée par un try-catch
- Les transactions ne sont pas utilisées car Supabase ne les supporte pas facilement côté client

## Améliorations futures possibles

1. **Suppression douce** : Marquer les membres comme supprimés au lieu de les supprimer définitivement
2. **Corbeille** : Permettre de restaurer les membres supprimés pendant 30 jours
3. **Export avant suppression** : Proposer d'exporter les données avant suppression complète
4. **Logs d'audit** : Enregistrer qui a supprimé quoi et quand
5. **Confirmation par mot de passe** : Demander le mot de passe admin pour la suppression complète
6. **Suppression en arrière-plan** : Pour les gros arbres, utiliser une file d'attente
