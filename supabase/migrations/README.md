# Migrations de la base de données

## Ordre d'exécution des migrations

Les migrations doivent être exécutées dans l'ordre suivant :

1. **001_create_members_table.sql** - Création de la table members
2. **002_create_relationships_table.sql** - Création de la table relationships
3. **003_create_member_positions_table.sql** - Création de la table member_positions
4. **004_alter_members_add_fields.sql** - Ajout des champs last_name, work et age
5. **005_create_users_table.sql** - Création de la table users avec l'admin
6. **006_create_user_on_member_insert.sql** - Triggers pour création automatique d'utilisateurs

## Description des migrations

### Migration 004 - Nouveaux champs membres
Ajoute les champs suivants à la table members :
- `last_name` : Prénom(s) du membre
- `work` : Profession du membre
- `age` : Âge calculé automatiquement à partir de la date de naissance

### Migration 005 - Table users
Crée la table users pour l'authentification avec :
- `username` : Nom d'utilisateur unique
- `password` : Mot de passe
- `user_type` : Type d'utilisateur (admin ou user)
- `member_id` : Référence au membre (nullable pour admin)

Insère automatiquement l'utilisateur admin :
- Username : `admin`
- Password : `Test123*`

### Migration 006 - Création automatique d'utilisateurs
Implémente la logique de création automatique d'utilisateurs :
- Fonction `generate_member_credentials()` : Génère username/password à partir du premier nom + premier prénom en minuscules
- Trigger `create_user_on_member_insert` : Crée automatiquement un utilisateur lors de l'ajout d'un membre
- Trigger `update_user_on_member_update` : Met à jour les credentials si le nom/prénom change

## Exemple de génération de credentials

Pour un membre nommé "KENME MOMO" avec le prénom "Jean Paul" :
- Username : `kenmoejean`
- Password : `kenmoejean`

## Application des migrations

Pour appliquer toutes les migrations :

```bash
supabase db reset
```

Ou pour appliquer une migration spécifique :

```bash
supabase migration up
```
