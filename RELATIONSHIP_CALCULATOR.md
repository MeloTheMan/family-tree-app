# Calculateur de relations familiales

## Vue d'ensemble

Le système calcule automatiquement le lien de parenté entre l'utilisateur connecté et n'importe quel membre de la famille sur lequel il clique. Cette fonctionnalité est disponible UNIQUEMENT pour les comptes utilisateurs (pas pour l'admin).

## Relations supportées

Le système supporte jusqu'à 10 générations et peut identifier les relations suivantes :

### Relations directes (1 génération)
- **Parent** : Père ou mère
- **Enfant** : Fils ou fille
- **Conjoint(e)** : Époux ou épouse

### Relations de 2ème génération
- **Grand-parent** : Grand-père ou grand-mère
- **Petit-enfant** : Petit-fils ou petite-fille
- **Frère/Sœur** : Frère ou sœur
- **Oncle/Tante** : Frère ou sœur d'un parent
- **Neveu/Nièce** : Enfant d'un frère ou d'une sœur

### Relations de 3ème génération
- **Arrière-grand-parent** : Parent d'un grand-parent
- **Arrière-petit-enfant** : Enfant d'un petit-enfant
- **Grand-oncle/Grand-tante** : Frère ou sœur d'un grand-parent
- **Petit-neveu/Petite-nièce** : Enfant d'un neveu ou d'une nièce
- **Cousin(e)** : Enfant d'un oncle ou d'une tante

### Relations de 4ème génération et plus
- **Arrière-arrière-grand-parent** : 4ème génération ascendante
- **Arrière-arrière-petit-enfant** : 4ème génération descendante
- **Cousin(e) au 2ème degré** : Petit-enfant d'un grand-oncle/tante
- **Ancêtre (Nème génération)** : Pour les générations au-delà de 4
- **Descendant (Nème génération)** : Pour les générations au-delà de 4

### Relations par alliance (mariage)
- **Beau-parent** : Parent du conjoint
- **Gendre/Belle-fille** : Conjoint d'un enfant
- **Beau-frère/Belle-sœur** : Frère ou sœur du conjoint
- **Grand-parent par alliance** : Grand-parent du conjoint
- **Petit-enfant par alliance** : Petit-enfant du conjoint
- **Oncle/Tante par alliance** : Oncle ou tante du conjoint
- **Neveu/Nièce par alliance** : Neveu ou nièce du conjoint

### Relations complexes
- **Cousin(e) éloigné(e)** : Relations collatérales au-delà du 2ème degré
- **Membre de la famille étendue** : Relations complexes difficiles à catégoriser
- **Aucun lien de parenté direct** : Aucun chemin trouvé dans l'arbre

## Algorithme

Le système utilise un algorithme de parcours en largeur (BFS) pour :

1. **Construire un graphe** : Représentation de toutes les relations familiales
2. **Trouver le chemin le plus court** : Entre l'utilisateur et le membre cible
3. **Analyser le chemin** : Déterminer le type de relation basé sur :
   - Le nombre de générations montantes (vers les ancêtres)
   - Le nombre de générations descendantes (vers les descendants)
   - La présence de relations par alliance (mariage)
   - Les relations collatérales (frères/sœurs, cousins)

## Affichage

### Pour les utilisateurs (users)
Lorsqu'un utilisateur clique sur un membre, la modal affiche :
- Une carte bleue avec une icône
- Le texte "Lien de parenté"
- La relation calculée en gros caractères (ex: "Grand-parent", "Cousin(e)", etc.)

### Pour l'administrateur (admin)
L'admin voit la liste détaillée traditionnelle :
- Parents avec photos
- Enfants avec photos
- Conjoints avec photos

## Exemples de calcul

### Exemple 1 : Grand-parent
```
Utilisateur → Parent (child) → Grand-parent (child)
Résultat : "Grand-parent"
```

### Exemple 2 : Oncle/Tante
```
Utilisateur → Parent (child) → Frère du parent (sibling) → Oncle
Résultat : "Oncle/Tante"
```

### Exemple 3 : Cousin
```
Utilisateur → Parent (child) → Grand-parent (child) → Oncle (parent) → Cousin (parent)
Résultat : "Cousin(e)"
```

### Exemple 4 : Beau-frère
```
Utilisateur → Conjoint (spouse) → Frère du conjoint (sibling)
Résultat : "Beau-frère/Belle-sœur"
```

## Limitations

- Le système ne distingue pas le genre (utilise des formulations neutres ou doubles)
- Les relations très complexes peuvent être simplifiées en "Membre de la famille étendue"
- Les relations non-sanguines (adoption, etc.) sont traitées comme des relations normales
- Le calcul se base uniquement sur les relations enregistrées dans la base de données

## Fichiers concernés

- `lib/utils/relationship-calculator.ts` : Logique de calcul
- `app/components/members/MemberDetail.tsx` : Affichage de la relation
- `app/components/UserTreeView.tsx` : Passage des données nécessaires
- `app/page.tsx` : Gestion de l'authentification et du memberId
