# Context Injection Guide

This guide explains how to access the AssemblerJS context across different frameworks.

## Overview

The `useContext()` helper provides a unified API to access the AssemblerJS dependency injection container, allowing you to retrieve services, brokers, and other assemblages.

---

## Vue

Vue uses the native `provide`/`inject` system.

### Setup (in main.ts)

```typescript
import { createApp } from 'vue';
import { ContextInjectionKey } from '@/renderer/constants/injection.keys';

const app = createApp(App);
app.provide(ContextInjectionKey, assembler.getContext());
app.mount('#app');
```

### Usage in Components

**Composition API:**
```vue
<script setup lang="ts">
import { useContext } from '@/renderer/composables/useContext';
import { ApplicationStateBroker } from '@/features/state/renderer/brokers';

const context = useContext();
const appState = context.require(ApplicationStateBroker);

// Use the state
console.log(appState.getState('isLoading'));
</script>
```

**Options API:**
```vue
<script lang="ts">
import { defineComponent } from 'vue';
import { useContext } from '@/renderer/composables/useContext';
import { ApplicationStateBroker } from '@/features/state/renderer/brokers';

export default defineComponent({
  setup() {
    const context = useContext();
    const appState = context.require(ApplicationStateBroker);
    
    return { appState };
  }
});
</script>
```

---

## React

React uses the Context API with a provider component.

### Setup (in main.tsx or App.tsx)

```tsx
import { AssemblerProvider } from '@/renderer/providers/AssemblerProvider';
import { Assembler } from 'assemblerjs';

const assembler = new Assembler();
await assembler.bootstrap(MainApp);

root.render(
  <AssemblerProvider context={assembler.getContext()}>
    <App />
  </AssemblerProvider>
);
```

### Usage in Components

```tsx
import { useContext } from '@/renderer/composables/useContext';
import { ApplicationStateBroker } from '@/features/state/renderer/brokers';

function MyComponent() {
  const context = useContext();
  const appState = context.require(ApplicationStateBroker);
  
  // Access state
  const isLoading = appState.getState<boolean>('isLoading');
  
  return (
    <div>
      {isLoading?.value ? 'Loading...' : 'Ready'}
    </div>
  );
}
```

### With Hooks

```tsx
import { useEffect, useState } from 'react';
import { useContext } from '@/renderer/composables/useContext';
import { ApplicationStateBroker } from '@/features/state/renderer/brokers';

function MyComponent() {
  const context = useContext();
  const appState = context.require(ApplicationStateBroker);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const loadingState = appState.getState<boolean>('isLoading');
    
    // Subscribe to state changes
    const unsubscribe = loadingState?.subscribe?.((value) => {
      setLoading(value);
    });
    
    return () => unsubscribe?.();
  }, []);
  
  return <div>{loading ? 'Loading...' : 'Ready'}</div>;
}
```

---

## Solid

Solid uses its Context API similar to React.

### Setup (in main.tsx or App.tsx)

```tsx
import { AssemblerProvider } from '@/renderer/providers/AssemblerProvider';
import { Assembler } from 'assemblerjs';

const assembler = new Assembler();
await assembler.bootstrap(MainApp);

render(() => (
  <AssemblerProvider context={assembler.getContext()}>
    <App />
  </AssemblerProvider>
), document.getElementById('root')!);
```

### Usage in Components

```tsx
import { createEffect, createSignal } from 'solid-js';
import { useContext } from '@/renderer/composables/useContext';
import { ApplicationStateBroker } from '@/features/state/renderer/brokers';

function MyComponent() {
  const context = useContext();
  const appState = context.require(ApplicationStateBroker);
  
  const [loading, setLoading] = createSignal(false);
  
  createEffect(() => {
    const loadingState = appState.getState<boolean>('isLoading');
    
    // Subscribe to state changes
    loadingState?.subscribe?.((value) => {
      setLoading(value);
    });
  });
  
  return (
    <div>
      {loading() ? 'Loading...' : 'Ready'}
    </div>
  );
}
```

---

## Svelte

Svelte uses its built-in `setContext`/`getContext` system.

### Setup (in App.svelte)

```svelte
<script lang="ts">
  import { setContext } from 'svelte';
  import { ASSEMBLER_CONTEXT_KEY } from '@/renderer/composables/useContext';
  
  // Assuming assembler is available
  setContext(ASSEMBLER_CONTEXT_KEY, assembler.getContext());
</script>

<slot />
```

### Usage in Components

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { useContext } from '@/renderer/composables/useContext';
  import { ApplicationStateBroker } from '@/features/state/renderer/brokers';
  
  const context = useContext();
  const appState = context.require(ApplicationStateBroker);
  
  const loading = writable(false);
  
  onMount(() => {
    const loadingState = appState.getState<boolean>('isLoading');
    
    // Subscribe to state changes
    const unsubscribe = loadingState?.subscribe?.((value) => {
      loading.set(value);
    });
    
    return unsubscribe;
  });
</script>

{#if $loading}
  <div>Loading...</div>
{:else}
  <div>Ready</div>
{/if}
```

---

## Vanilla JavaScript

Vanilla JS uses a global context storage.

### Setup (in main.ts)

```typescript
import { initializeContext } from '@/renderer/providers/AssemblerProvider';
import { Assembler } from 'assemblerjs';

const assembler = new Assembler();
await assembler.bootstrap(MainApp);

// Initialize global context
initializeContext(assembler.getContext());
```

### Usage

```typescript
import { useContext } from '@/renderer/composables/useContext';
import { ApplicationStateBroker } from '@/features/state/renderer/brokers';

// Access context anywhere
const context = useContext();
const appState = context.require(ApplicationStateBroker);

// Subscribe to state changes
const loadingState = appState.getState<boolean>('isLoading');
const unsubscribe = loadingState?.subscribe?.((loading) => {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = loading ? 'block' : 'none';
  }
});

// Cleanup
window.addEventListener('beforeunload', () => {
  unsubscribe?.();
});
```

---

## Common Patterns

### Retrieving Multiple Services

```typescript
const context = useContext();

const appState = context.require(ApplicationStateBroker);
const preferences = context.require(PreferencesStore);
const windowManager = context.require(WindowManager);
```

### Type-Safe Service Retrieval

```typescript
// The require method is type-safe
const appState = context.require<ApplicationStateBroker>(ApplicationStateBroker);
```

### Optional Services

```typescript
// Use try/catch for optional services
let optionalService;
try {
  optionalService = context.require(OptionalService);
} catch {
  console.warn('OptionalService not available');
}
```

### Creating Custom Hooks/Composables

**Vue:**
```typescript
export const useAppState = () => {
  const context = useContext();
  return context.require(ApplicationStateBroker);
};
```

**React:**
```tsx
export const useAppState = () => {
  const context = useContext();
  return context.require(ApplicationStateBroker);
};
```

**Solid:**
```tsx
export const useAppState = () => {
  const context = useContext();
  return context.require(ApplicationStateBroker);
};
```

---

## Error Handling

All implementations throw an error if the context is not properly initialized:

```typescript
try {
  const context = useContext();
  const appState = context.require(ApplicationStateBroker);
} catch (error) {
  console.error('Context not available:', error);
  // Handle error appropriately
}
```

---

## Best Practices

1. **Initialize Early**: Set up the context as early as possible in your app lifecycle
2. **Type Safety**: Always specify types when using `context.require<T>()`
3. **Single Instance**: Only initialize the context once per application
4. **Cleanup**: Unsubscribe from state changes when components unmount
5. **Error Handling**: Always handle potential context injection failures
6. **Composition**: Create framework-specific hooks/composables for commonly used services

---

## Troubleshooting

### "AssemblerContext could not be injected"

**Cause**: Context was not properly provided/initialized

**Solutions:**
- **Vue**: Ensure `app.provide(ContextInjectionKey, context)` is called before mounting
- **React/Solid**: Verify your app is wrapped with `<AssemblerProvider>`
- **Svelte**: Check that `setContext()` is called in a parent component
- **Vanilla**: Confirm `initializeContext()` was called at startup

### Services Not Found

**Cause**: Service not registered in AssemblerJS

**Solution**: Ensure the service is decorated with `@Assemblage()` and included in the bootstrap process

### Type Errors

**Cause**: Incorrect TypeScript configuration or missing types

**Solution**: Ensure `tsconfig.json` includes proper paths and the service classes are properly exported
