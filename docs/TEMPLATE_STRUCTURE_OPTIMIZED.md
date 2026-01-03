# Structure des Templates Optimisée

## Fichiers supprimés (doublons)

- `main.vue.ts.ejs` ❌
- `main.react.tsx.ejs` ❌
- `main.vanilla.ts.ejs` ❌
- `main.solid.ts.ejs` ❌
- `main.svelte.ts.ejs` ❌

## Structure finale optimisée

### Fichiers génériques (avec conditions EJS)

- `main.ts.ejs` ✅ - Point d'entrée adaptatif selon le framework
- `index.html.ejs` ✅ - HTML adaptatif (div id + script src)

### Fichiers spécifiques par framework

- `App.vue.vue.ejs` ✅ - Composant Vue
- `App.react.tsx.ejs` ✅ - Composant React
- `App.vanilla.ts.ejs` ✅ - Classe Vanilla JS
- `App.solid.tsx.ejs` ✅ - Composant Solid
- `App.svelte.svelte.ejs` ✅ - Composant Svelte

### Configurations spécifiques

- `tsconfig.web.vue.json.ejs` ✅
- `tsconfig.web.react.json.ejs` ✅
- `env.react.d.ts.ejs` ✅
- `shims-vue.vue.d.ts.ejs` ✅

## Avantages de cette approche

1. **Pas de duplication** - Un seul main.ts avec conditions
2. **Maintenance facile** - Modifications centralisées
3. **Cohérence** - Logique unifiée dans un fichier
4. **Flexibilité** - Facile d'ajouter de nouveaux frameworks

## Logique du main.ts.ejs

```typescript
// Imports conditionnels selon le framework
<% if (isVue()) { %>import { createApp } from 'vue';<% } %>
<% if (isReact()) { %>import React from 'react';<% } %>

// Initialisation conditionnelle dans onInit()
<% if (isVue()) { %>createApp(App).mount('#app');<% } %>
<% if (isReact()) { %>root.render(<App />);<% } %>
```

Cette structure élimine les doublons tout en gardant la flexibilité du système de framework.
