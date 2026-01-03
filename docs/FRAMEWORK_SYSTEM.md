# Framework System for AssemblerJS

## Overview

The framework system allows generating specific templates based on the framework chosen when creating an Electron project.

## Supported frameworks

- **vanilla**: Vanilla JavaScript/TypeScript
- **vue**: Vue.js 3 with Composition API
- **react**: React 18 with hooks
- **svelte**: Svelte 5
- **solid**: Solid.js

## How it works

### 1. File filtering

Files are filtered based on their name using naming conventions:

- `App.react.tsx.ejs` → Included only if framework = "react"
- `App.vue.vue.ejs` → Included only if framework = "vue"
- `App.!vue.tsx.ejs` → Included only if framework ≠ "vue"
- `Component.vue+tailwindcss.vue.ejs` → Included if framework = "vue" AND option "tailwindcss"

### 2. Available EJS helpers

In `.ejs` templates, you can use:

```ejs
<% if (isVue()) { %>
// Vue-specific code
<% } %>

<% if (isReact()) { %>
// React-specific code
<% } %>

<% if (isFramework('solid')) { %>
// Solid-specific code
<% } %>
```

### 3. Template structure

```
templates/
  src/
    renderer/
      index.vue.html.ejs          # HTML for Vue
      index.react.html.ejs         # HTML for React
      src/
        App.vue.vue.ejs           # Vue component
        App.react.tsx.ejs         # React component
        main.vue.ts.ejs           # Vue entry point
        main.react.ts.ejs         # React entry point
  package.json.ejs                # Dependencies according to framework
  tsconfig.web.vue.json.ejs       # TypeScript config for Vue
  tsconfig.web.react.json.ejs     # TypeScript config for React
```

### 4. Dynamic generation

During generation:

1. User chooses a framework
2. Only corresponding files are copied
3. Templates are processed with framework context
4. File names are cleaned (condition removal)

## Usage example

```bash
# Create an Electron React project
./bin/create-assemblerjs.js electron my-app /path/to/output
# Then select "react" in options

# The result will contain:
# - src/renderer/src/App.tsx (from App.react.tsx.ejs)
# - src/renderer/src/main.ts (from main.react.ts.ejs)
# - package.json with React dependencies
# - TypeScript configuration for React
```

## Future extensions

- Angular support
- Preact support
- Advanced conditional templates
- Specific bundler configuration
