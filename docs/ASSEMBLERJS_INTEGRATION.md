# AssemblerJS Integration with Frameworks

## Overview

All generated `main.ts` files now use the AssemblerJS architecture for uniform and structured application initialization, regardless of the chosen framework.

## AssemblerJS Structure

### MainApp Class

```typescript
@Assemblage()
class MainApp implements AbstractAssemblage {
  constructor() {}

  public async onInit(): Promise<void> {
    // Framework-specific initialization logic
  }
}
```

### Lifecycle

```typescript
const task = Task.of(() => Assembler.build(MainApp));
task
  .fork()
  .then(() => {
    console.log('App was successfully built and mounted.');
  })
  .catch((error) => {
    console.error('There was an error during app build:', error);
  });
```

## Framework Implementations

### Vue.js

```typescript
public async onInit(): Promise<void> {
  const app = createApp(App);
  app.mount('#app');
}
```

### React

```typescript
public async onInit(): Promise<void> {
  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Root element not found');
  }

  const root = createRoot(container);
  root.render(React.createElement(App));
}
```

### Vanilla JavaScript

```typescript
public async onInit(): Promise<void> {
  const app = new App('#app');
  app.render();
  console.log('Vanilla JavaScript app initialized!');
}
```

### Solid.js

```typescript
public async onInit(): Promise<void> {
  const root = document.getElementById('app');
  if (!root) {
    throw new Error('Root element not found');
  }

  render(() => App(), root);
}
```

### Svelte

```typescript
private app: App | null = null;

public async onInit(): Promise<void> {
  const target = document.getElementById('app');
  if (!target) {
    throw new Error('Root element not found');
  }

  this.app = new App({ target });
}
```

## Benefits of this approach

1. **Uniformity**: All frameworks use the same base architecture
2. **Error handling**: Centralized initialization error management
3. **Dependency injection**: Ability to use AssemblerJS DI system
4. **Lifecycle**: Precise control over application lifecycle
5. **Extensibility**: Facilitates adding new frameworks

## Future extensions

- Adding shared services via DI
- Global state management
- Framework-specific plugins
- Initialization middleware
