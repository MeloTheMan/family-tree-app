# Fonctionnalité de Recherche de Membres

## Vue d'ensemble

La fonctionnalité de recherche permet aux utilisateurs de trouver rapidement des membres de la famille dans l'arbre généalogique en saisissant leur nom complet ou une partie de celui-ci.

## Caractéristiques

### 1. Barre de recherche
- Positionnée en haut au centre de l'arbre généalogique
- Design moderne avec bordure et ombre
- Icône de recherche pour une meilleure UX

### 2. Recherche intelligente
- Recherche par prénom, nom de famille ou nom complet
- Recherche insensible à la casse
- Recherche partielle (trouve "Jean" dans "Jean-Pierre")
- Déclenchement de la recherche en appuyant sur la touche **Entrée**
- Possibilité de modifier la requête avant de lancer la recherche

### 3. Navigation entre les résultats
- Compteur de résultats : "1 / 5" affiche le résultat actuel et le total
- Boutons fléchés pour naviguer entre les résultats :
  - Flèche gauche : résultat précédent
  - Flèche droite : résultat suivant
- Les boutons sont grisés quand il y a 0 ou 1 résultat
- Navigation circulaire (du dernier au premier et vice-versa)

### 4. Mise en évidence visuelle
- Animation de clignotement bleu sur le nœud trouvé
- Durée de l'animation : 2 secondes
- Effet de halo lumineux qui pulse

### 5. Centrage automatique
- L'arbre se déplace automatiquement pour centrer le nœud trouvé
- Animation fluide de 800ms
- Zoom optimal pour voir le nœud clairement

### 6. Raccourcis clavier
- `Ctrl+F` (ou `Cmd+F` sur Mac) : Focus sur la barre de recherche
- `Entrée` : Lancer la recherche
- `Échap` : Effacer la recherche
- `↑` ou `←` : Résultat précédent (après avoir lancé une recherche)
- `↓` ou `→` : Résultat suivant (après avoir lancé une recherche)

### 7. Bouton d'effacement
- Icône "X" pour effacer rapidement la recherche
- Apparaît uniquement quand il y a du texte
- Remet le focus sur le champ de recherche après effacement

## Utilisation

### Recherche simple
1. Cliquez sur la barre de recherche ou appuyez sur `Ctrl+F`
2. Tapez le nom ou prénom du membre recherché
3. Appuyez sur **Entrée** pour lancer la recherche
4. Les résultats s'affichent et le premier résultat est mis en évidence et centré

### Navigation entre plusieurs résultats
1. Si plusieurs membres correspondent à votre recherche
2. Utilisez les flèches ou les touches du clavier pour naviguer
3. Chaque résultat est mis en évidence et centré à son tour

### Effacement de la recherche
1. Cliquez sur le bouton "X" dans la barre de recherche
2. Ou appuyez sur `Échap`
3. La mise en évidence disparaît et l'arbre reste à sa position actuelle

## Implémentation technique

### Composants créés

#### `SearchBar.tsx`
- Gère l'interface de recherche
- Filtre les membres selon la requête
- Gère la navigation entre les résultats
- Émet des événements pour la sélection et l'effacement

#### Modifications dans `FamilyTree.tsx`
- Intégration du composant SearchBar
- Gestion de l'état `highlightedMemberId`
- Fonction `handleSearchResultSelect` pour centrer et mettre en évidence
- Fonction `handleClearHighlight` pour effacer la mise en évidence

#### Modifications dans `MemberNode.tsx`
- Ajout de la prop `isHighlighted`
- Application de la classe CSS `animate-highlight-blink`

#### Modifications dans `globals.css`
- Animation `highlightBlink` avec effet de halo pulsant
- Durée de 2 secondes avec 4 pulsations

### Algorithme de recherche

```typescript
const normalizedQuery = query.toLowerCase().trim();
const results = members.filter(member => {
  const fullName = `${member.name} ${member.last_name || ''}`.toLowerCase();
  const firstName = member.name.toLowerCase();
  const lastName = (member.last_name || '').toLowerCase();
  
  return fullName.includes(normalizedQuery) || 
         firstName.includes(normalizedQuery) || 
         lastName.includes(normalizedQuery);
});
```

### Centrage du nœud

```typescript
const node = getNode(memberId);
if (node) {
  const x = node.position.x + (node.width || 192) / 2;
  const y = node.position.y + (node.height || 128) / 2;
  setCenter(x, y, { zoom: 1, duration: 800 });
}
```

## Améliorations futures possibles

1. **Recherche avancée** : Filtrer par date de naissance, profession, lieu
2. **Historique de recherche** : Mémoriser les recherches récentes
3. **Suggestions automatiques** : Autocomplétion pendant la saisie
4. **Recherche floue** : Tolérance aux fautes de frappe
5. **Export des résultats** : Exporter la liste des membres trouvés
6. **Filtres combinés** : Recherche avec plusieurs critères simultanés

## Notes de performance

- La recherche est effectuée côté client pour une réactivité maximale
- La recherche se déclenche uniquement sur appui de la touche Entrée pour éviter les recherches inutiles
- L'animation de highlight se termine automatiquement après 2 secondes
- Le centrage utilise les animations natives de ReactFlow pour des performances optimales
