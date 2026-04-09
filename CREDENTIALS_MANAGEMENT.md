# Gestion des Identifiants

## Vue d'ensemble

Cette fonctionnalité permet aux utilisateurs de visualiser et modifier leurs identifiants de connexion (nom d'utilisateur et mot de passe).

## Fonctionnalités

### 1. Message d'aide sur le formulaire de connexion

Le formulaire de connexion affiche maintenant un message d'aide expliquant comment les identifiants sont générés par défaut:

**Format des identifiants par défaut:**
- Nom d'utilisateur: `[premier_nom][premier_prénom]` en minuscules
- Mot de passe: `[premier_nom][premier_prénom]` en minuscules

**Exemple:**
Pour un membre nommé "KENME MOMO Jean Paul":
- Nom d'utilisateur: `kenmejean`
- Mot de passe: `kenmejean`

### 2. Visualisation du mot de passe

Un bouton avec icône d'œil permet de basculer entre l'affichage masqué et visible du mot de passe:
- Fonctionne sur PC et mobile
- Icône d'œil ouvert: mot de passe visible
- Icône d'œil barré: mot de passe masqué
- Accessible via le bouton à droite du champ de mot de passe

### 3. Modification des identifiants

Les utilisateurs connectés (admin et users) peuvent modifier leurs identifiants via un bouton dédié dans l'en-tête de l'application.

#### Accès à la fonctionnalité

**Pour les administrateurs:**
- Bouton "Identifiants" dans l'en-tête (avec icône de clé)
- Visible à côté du bouton "Déconnexion"

**Pour les utilisateurs:**
- Bouton "Mes identifiants" dans l'en-tête (avec icône de clé)
- Visible à côté du bouton "Se déconnecter"

#### Processus de modification

1. Cliquer sur le bouton "Identifiants" / "Mes identifiants"
2. Une modal s'ouvre avec un formulaire contenant:
   - Mot de passe actuel (requis)
   - Nouveau nom d'utilisateur (minimum 3 caractères)
   - Nouveau mot de passe (minimum 6 caractères)
   - Confirmation du nouveau mot de passe
3. Tous les champs de mot de passe ont un bouton pour afficher/masquer
4. Validation en temps réel des champs
5. Après validation, l'utilisateur est automatiquement déconnecté
6. Il doit se reconnecter avec ses nouveaux identifiants

#### Règles de validation

**Nom d'utilisateur:**
- Minimum 3 caractères
- Doit être unique (non utilisé par un autre utilisateur)

**Mot de passe:**
- Minimum 6 caractères
- Doit correspondre à la confirmation

**Mot de passe actuel:**
- Doit correspondre au mot de passe actuel de l'utilisateur

## Architecture technique

### Composants

#### LoginForm
- Affiche le message d'aide avec les instructions de connexion
- Bouton de visualisation du mot de passe
- Responsive (PC et mobile)

#### ChangeCredentialsForm
- Modal pour modifier les identifiants
- Validation côté client
- Boutons de visualisation pour tous les champs de mot de passe
- Gestion des erreurs en temps réel

### API Endpoint

#### PUT /api/auth/change-credentials
Modifie les identifiants d'un utilisateur

**Authentification:** Requise (via cookie de session)

**Body:**
```json
{
  "currentPassword": "string",
  "newUsername": "string",
  "newPassword": "string"
}
```

**Validations:**
- Vérification de l'authentification
- Validation du mot de passe actuel
- Vérification de l'unicité du nouveau nom d'utilisateur
- Validation des longueurs minimales

**Réponse en cas de succès:**
```json
{
  "success": true,
  "data": {
    "message": "Identifiants modifiés avec succès"
  }
}
```

**Comportement:**
- Met à jour le nom d'utilisateur et le mot de passe dans la base de données
- Supprime le cookie de session (déconnexion automatique)
- L'utilisateur doit se reconnecter avec ses nouveaux identifiants

## Sécurité

### Stockage des mots de passe
- Les mots de passe sont stockés en clair dans la base de données
- Pour une application de production, il est recommandé d'utiliser bcrypt ou argon2 pour hasher les mots de passe

### Session
- Après modification des identifiants, la session est invalidée
- L'utilisateur doit se reconnecter pour obtenir une nouvelle session

### Validation
- Validation côté client pour une meilleure UX
- Validation côté serveur pour la sécurité
- Vérification de l'unicité du nom d'utilisateur

## Interface utilisateur

### Formulaire de connexion

```
┌─────────────────────────────────────┐
│   Arbre Généalogique                │
│   Connectez-vous pour accéder       │
│                                     │
│   Nom d'utilisateur                 │
│   [________________]                │
│                                     │
│   Mot de passe                      │
│   [________________] 👁              │
│                                     │
│   [Se connecter]                    │
│                                     │
│   ℹ️ Comment se connecter ?          │
│   Vos identifiants sont composés... │
│   Exemple: kenmejean                │
│                                     │
│   Vous pourrez modifier vos         │
│   identifiants après connexion      │
└─────────────────────────────────────┘
```

### Modal de modification

```
┌─────────────────────────────────────┐
│   Modifier mes identifiants      ✕  │
│                                     │
│   Mot de passe actuel *             │
│   [________________] 👁              │
│                                     │
│   Nouveau nom d'utilisateur *       │
│   [________________]                │
│                                     │
│   Nouveau mot de passe *            │
│   [________________] 👁              │
│                                     │
│   Confirmer le mot de passe *       │
│   [________________] 👁              │
│                                     │
│   ⚠️ Vous serez déconnecté après     │
│   la modification                   │
│                                     │
│   [Annuler]  [Modifier]             │
└─────────────────────────────────────┘
```

## Tests recommandés

### Test 1: Visualisation du mot de passe
1. Aller sur la page de connexion
2. Saisir un mot de passe
3. Cliquer sur l'icône d'œil
4. Le mot de passe doit s'afficher en clair
5. Cliquer à nouveau sur l'icône
6. Le mot de passe doit être masqué

### Test 2: Message d'aide
1. Aller sur la page de connexion
2. Vérifier que le message d'aide est visible
3. Vérifier que l'exemple est correct

### Test 3: Modification des identifiants (succès)
1. Se connecter avec des identifiants valides
2. Cliquer sur le bouton "Identifiants"
3. Remplir le formulaire avec:
   - Mot de passe actuel correct
   - Nouveau nom d'utilisateur valide
   - Nouveau mot de passe valide
   - Confirmation identique
4. Cliquer sur "Modifier"
5. Vérifier la déconnexion automatique
6. Se reconnecter avec les nouveaux identifiants
7. La connexion doit réussir

### Test 4: Validation des erreurs
1. Essayer de modifier avec un mot de passe actuel incorrect → Erreur
2. Essayer avec un nom d'utilisateur trop court (< 3 caractères) → Erreur
3. Essayer avec un mot de passe trop court (< 6 caractères) → Erreur
4. Essayer avec une confirmation qui ne correspond pas → Erreur
5. Essayer avec un nom d'utilisateur déjà pris → Erreur

### Test 5: Responsive
1. Tester sur mobile
2. Vérifier que les boutons d'œil sont accessibles
3. Vérifier que la modal s'affiche correctement
4. Vérifier que le message d'aide est lisible

## Améliorations futures

### Sécurité
- Implémenter le hashing des mots de passe (bcrypt/argon2)
- Ajouter une politique de mots de passe forts
- Implémenter une limitation des tentatives de connexion
- Ajouter une authentification à deux facteurs (2FA)

### Fonctionnalités
- Réinitialisation de mot de passe par email
- Historique des modifications de mot de passe
- Notification par email lors du changement d'identifiants
- Exigence de re-saisie du mot de passe pour les actions sensibles

### UX
- Indicateur de force du mot de passe
- Suggestions de noms d'utilisateur disponibles
- Génération automatique de mots de passe sécurisés
- Copier le mot de passe dans le presse-papiers

## Dépannage

### Le bouton "Identifiants" n'apparaît pas
- Vérifier que vous êtes connecté
- Vérifier que la session est valide
- Rafraîchir la page

### Erreur "Mot de passe actuel incorrect"
- Vérifier que vous avez saisi le bon mot de passe
- Vérifier qu'il n'y a pas d'espaces avant/après
- Essayer de vous déconnecter et reconnecter

### Erreur "Ce nom d'utilisateur est déjà utilisé"
- Choisir un autre nom d'utilisateur
- Vérifier qu'il n'y a pas de faute de frappe

### Impossible de se reconnecter après modification
- Vérifier que vous utilisez les nouveaux identifiants
- Vérifier qu'il n'y a pas d'espaces
- Vérifier la casse (minuscules/majuscules)
- Contacter l'administrateur si le problème persiste

## Fichiers créés/modifiés

### Nouveaux fichiers
- `app/components/auth/ChangeCredentialsForm.tsx` - Composant de modification des identifiants
- `app/api/auth/change-credentials/route.ts` - API de modification des identifiants
- `CREDENTIALS_MANAGEMENT.md` - Cette documentation

### Fichiers modifiés
- `app/components/auth/LoginForm.tsx` - Ajout du message d'aide et du bouton d'œil
- `app/components/UserTreeView.tsx` - Ajout du bouton "Mes identifiants"
- `app/components/FamilyTreeApp.tsx` - Ajout du bouton "Identifiants"
