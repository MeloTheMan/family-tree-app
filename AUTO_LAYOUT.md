# Alignement Automatique des Nœuds

## Vue d'ensemble

Le système d'alignement automatique organise intelligemment les membres de l'arbre généalogique en fonction de leurs relations, créant une disposition visuellement cohérente et aérée.

## Fonctionnalités

### 1. Alignement Automatique lors de l'Ajout de Relations

Lorsqu'une nouvelle relation est créée (parent, enfant, conjoint), le système :
- Détecte automatiquement la nouvelle relation
- Réorganise les nœuds concernés
- Applique un espacement optimal
- Sauvegarde les nouvelles positions

### 2. Positionnement Intelligent

#### Conjoints
- Placés côte à côte sur la même ligne
- Espacement réduit entre eux (1/3 de l'espacement normal)
- Groupés visuellement comme une unité familiale

#### Enfants
- Positionnés directement sous leurs parents
- Centrés par rapport à la position moyenne des parents
- Espacés horizontalement s'il y a plusieurs enfants
- Ordre d'ajout : gauche à droite

#### Générations
- Chaque génération occupe un niveau vertical distinct
- Espacement vertical constant de 180px entre générations
- Les membres sans parents sont considérés comme la génération racine

### 3. Détection et Résolution de Collisions

Le système évite automatiquement les chevauchements :
- Détecte les collisions potentielles entre nœuds
- Déplace les nœuds pour maintenir un espacement minimum de 80px
- Réorganise plusieurs nœuds si nécessaire pour créer de l'espace
- Optimise l'utilisation de l'espace horizontal

### 4. Centrage Automatique

L'arbre entier est automatiquement centré autour de l'origine (x=0) pour :
- Une meilleure utilisation de l'espace
- Une navigation plus intuitive
- Un affichage équilibré

## Utilisation

### Réorganisation Manuelle

Un bouton "Réorganiser automatiquement" est disponible dans les contrôles de l'arbre :
- Icône : trois lignes horizontales
- Position : en haut des contrôles (coin inférieur droit)
- Couleur de survol : vert
- Fonction : réapplique le layout automatique à tous les nœuds

### Réorganisation Automatique

Le système se déclenche automatiquement :
- Lors de l'ajout d'une nouvelle relation
- Après la création d'un nouveau membre avec relations
- Quand des relations sont modifiées

## Configuration

Les paramètres de layout sont définis dans `lib/utils/tree-layout.ts` :

```typescript
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  nodeWidth: 200,        // Largeur d'un nœud
  nodeHeight: 120,       // Hauteur d'un nœud
  horizontalGap: 100,    // Espacement horizontal entre nœuds dans un groupe
  verticalGap: 180,      // Espacement vertical entre générations
  groupGap: 250,         // Espacement horizontal entre groupes familiaux
};

const MIN_NODE_SPACING = 80; // Espacement minimum pour éviter les collisions
```

### Paramètres d'espacement

- **horizontalGap (100px)** : Espacement entre les nœuds au sein d'un même groupe (par exemple, entre frères et sœurs)
- **verticalGap (180px)** : Espacement vertical entre les générations (parents → enfants)
- **groupGap (250px)** : Espacement entre les différentes familles nucléaires/sous-familles
  - Appliqué entre le dernier enfant d'un groupe et le premier enfant du groupe suivant
  - Permet de distinguer clairement les différentes branches familiales
  - Valable pour toutes les générations

Le **groupGap** est particulièrement important car il crée une séparation visuelle claire entre les différentes familles nucléaires, facilitant l'identification des relations parent-enfant.

## Algorithme

### Étapes du Calcul de Layout

1. **Construction de la carte des relations**
   - Indexation rapide des parents, enfants et conjoints

2. **Attribution des niveaux (générations)**
   - Parcours en largeur depuis les membres racines
   - Les conjoints partagent le même niveau
   - Les enfants sont au niveau parent + 1

3. **Positionnement horizontal**
   - Groupement des conjoints
   - Positionnement sous les parents quand possible
   - Application de l'espacement entre groupes (groupGap)
   - Détection et résolution des collisions
   - Optimisation de l'espacement

4. **Centrage de l'arbre**
   - Calcul du centre de masse
   - Translation pour centrer sur x=0

5. **Création des nœuds et arêtes**
   - Conversion en format ReactFlow
   - Application des positions calculées

## Avantages

- **Automatique** : Pas besoin de positionner manuellement les nœuds
- **Intelligent** : Respecte la structure familiale naturelle
- **Adaptatif** : S'ajuste automatiquement aux nouvelles relations
- **Optimisé** : Utilise l'espace de manière efficace
- **Flexible** : Permet toujours le déplacement manuel des nœuds
- **Clair** : Séparation visuelle distincte entre les groupes familiaux grâce au groupGap

## Limitations

- Les positions manuelles sont écrasées lors d'une réorganisation automatique
- Les arbres très larges peuvent nécessiter un zoom arrière
- Les relations complexes (divorces, remariages multiples) peuvent créer des layouts denses

## Améliorations Futures Possibles

- Option pour préserver certaines positions manuelles
- Algorithmes de layout alternatifs (circulaire, radial)
- Optimisation pour les très grands arbres (>100 membres)
- Animation fluide lors des réorganisations
- Détection des sous-arbres isolés
