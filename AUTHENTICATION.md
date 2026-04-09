# Système d'authentification

## Vue d'ensemble

L'application dispose d'un système d'authentification avec deux types d'utilisateurs :
- **Admin** : Accès complet avec possibilité d'ajouter/modifier des membres et des relations
- **User** : Accès en lecture seule pour consulter l'arbre et les informations des membres

## Identifiants par défaut

### Administrateur
- **Username** : `admin`
- **Password** : `Test123*`

### Utilisateurs (membres de la famille)
Les identifiants sont générés automatiquement lors de la création d'un membre :
- **Username** : premier nom + premier prénom en minuscules
- **Password** : identique au username

**Exemple** : Pour un membre nommé "KENME MOMO" avec le prénom "Jean Paul"
- Username : `kenmoejean`
- Password : `kenmoejean`

## Fonctionnalités par type d'utilisateur

### Admin
- Ajouter de nouveaux membres
- Modifier les informations des membres existants
- Créer des relations familiales
- Modifier manuellement le layout de l'arbre
- Déplacer les nœuds de l'arbre

### User
- Consulter l'arbre généalogique
- Cliquer sur un membre pour voir ses informations détaillées
- Voir les relations familiales (parents, enfants, conjoints)
- Navigation et zoom dans l'arbre
- Aucune modification possible

## Architecture technique

### API Routes
- `POST /api/auth/login` : Authentification
- `POST /api/auth/logout` : Déconnexion
- `GET /api/auth/session` : Vérification de session

### Composants
- `LoginForm` : Formulaire de connexion
- `FamilyTreeApp` : Interface admin avec toutes les fonctionnalités
- `UserTreeView` : Interface utilisateur en lecture seule

### Hooks
- `useAuth` : Gestion de l'authentification et de la session

### Sécurité
- Les mots de passe sont stockés en clair dans la base de données (à améliorer en production)
- Les sessions sont gérées via des cookies HTTP-only
- Durée de session : 7 jours

## Flux d'authentification

1. L'utilisateur arrive sur la page de login
2. Il entre ses identifiants
3. L'API vérifie les credentials dans la table `users`
4. Si valide, une session est créée et stockée dans un cookie
5. L'utilisateur est redirigé vers :
   - Interface admin si `user_type = 'admin'`
   - Interface user si `user_type = 'user'`
6. À chaque chargement, la session est vérifiée
7. L'utilisateur peut se déconnecter à tout moment

## Améliorations futures recommandées

- Hachage des mots de passe (bcrypt)
- Tokens JWT pour les sessions
- Réinitialisation de mot de passe
- Authentification à deux facteurs
- Gestion des rôles plus granulaire
- Logs d'authentification
