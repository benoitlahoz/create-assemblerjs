# Application State Broker

A framework-agnostic state management system that provides a unified API for managing application state across Vue, React, Solid, Svelte, and Vanilla JS.

## Features

- ✅ **Framework-agnostic**: Works seamlessly with Vue, React, Solid, Svelte, and Vanilla JS
- ✅ **Reactive**: Full reactivity support with subscription capabilities
- ✅ **Type-safe**: Written in TypeScript with complete type inference
- ✅ **Dynamic methods**: Automatically generates `start*` and `stop*` methods for each state
- ✅ **Exclusive states**: Support for mutually exclusive states
- ✅ **Callbacks**: Optional activate/deactivate lifecycle hooks
- ✅ **Unified API**: Same interface regardless of the framework

## Architecture

The system consists of three main components:

1. **`reactive-adapter.ts`**: Framework-specific adapters that provide a unified `ReactiveRef<T>` interface
2. **`reactive-helpers.ts`**: Helper functions to create reactive references for each framework
3. **`application-state.broker.ts`**: The core state broker that manages all application states

## Installation & Usage

The broker is automatically available through AssemblerJS dependency injection. Simply inject it into your components or services.

---

## Vue Example

**In main.vue.ts.ejs:**
```typescript
import { AbstractAssemblage, Assemblage, Assembler, Context, AssemblerContext } from 'assemblerjs';
import { Task } from '@assemblerjs/core';
import { createApp } from 'vue';
import { router } from '@/windows/router';
import App from './App.vue';
import { ContextInjectionKey } from '@/renderer/constants/injection.keys';

@Assemblage()
class MainApp implements AbstractAssemblage {
  constructor(@Context() private context: AssemblerContext) {}

  public async onInit(): Promise<void> {
    const app = createApp(App);
    app.use(router);
    // Inject the context into Vue's provide/inject system
    app.provide(ContextInjectionKey, this.context);
    app.mount('#app');
    
    await router.isReady();
    console.log('Vue Router initialized');
  }
}

const task = Task.of(() => Assembler.build(MainApp));
task.fork()
  .then(() => console.log('Vue app was successfully built and mounted.'))
  .catch((error) => console.error('There was an error during Vue app build:', error));
```

**In Vue Components:**
```vue
<script setup lang="ts">
import { useContext } from '@/composables';
import { ApplicationStateBroker } from '@/features/state/renderer/brokers';

// Access the AssemblerJS context
const context = useContext();
const stateBroker = context.require(ApplicationStateBroker);

// Get state reference
const isLoading = stateBroker.getState<boolean>('isLoading');
const currentView = stateBroker.getState<string | null>('currentView');
</script>

<template>
  <div>
    <div v-if="isLoading?.value">Loading...</div>
    <div v-if="currentView?.value === 'dashboard'">Dashboard View</div>
    
    <button @click="stateBroker.startCurrentView('dashboard')">
      Show Dashboard
    </button>
  </div>
</template>
```

---

## React Example

**In main.react.tsx.ejs:**
```typescript
import { AbstractAssemblage, Assemblage, Assembler, Context, AssemblerContext } from 'assemblerjs';
import { Task } from '@assemblerjs/core';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/windows/router';
import { AssemblerProvider } from '@/renderer/providers/AssemblerProvider';

@Assemblage()
class MainApp implements AbstractAssemblage {
  constructor(@Context() private context: AssemblerContext) {}

  public async onInit(): Promise<void> {
    const container = document.getElementById('root');
    if (!container) throw new Error('Root element not found');

    const root = createRoot(container);
    root.render(
      <AssemblerProvider context={this.context}>
        <RouterProvider router={router} />
      </AssemblerProvider>
    );
    console.log('React Router initialized');
  }
}

const task = Task.of(() => Assembler.build(MainApp));
task.fork()
  .then(() => console.log('React app was successfully built and mounted.'))
  .catch((error) => console.error('There was an error during React app build:', error));
```

**React Component:**
function MyComponent() {
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState<string | null>(null);
  
  // Access the AssemblerJS context
  const context = useContext();
  const stateBroker = context.require(ApplicationStateBroker);

  useEffect(() => {
    // Create reactive references
    const loadingRef = createRef(() => loading, setLoading);
    const viewRef = createRef(() => currentView, setCurrentView);
    
    // Register in broker
    stateBroker.register('isLoading', loadingRef);
    stateBroker.register('currentView', viewRef, {
      exclusive: true,
      activate: (view) => console.log('View activated:', view),
      deactivate: () => console.log('View deactivated')
    });

    // Subscribe to changes (optional)
    const unsubscribe = loadingRef.subscribe?.((value) => {
      console.log('Loading state changed:', value);
    });

    return () => {
      unsubscribe?.();
      stateBroker.unregister('isLoading');
      stateBroker.unregister('currentView');
    };
  }, []);

  return (
    <div>
      {loading && <div>Loading...</div>}
      {currentView === 'dashboard' && <div>Dashboard View</div>}
      
      <button onClick={() => stateBroker.startCurrentView('dashboard')}>
        Show Dashboard
      </button>
      <button onClick={() => stateBroker.stopCurrentView()}>
        Hide Dashboard
      </button>
    </div>
  );
}
```

---

## Solid Example

**In main.solid.tsx.ejs:**
```typescript
import { AbstractAssemblage, Assemblage, Assembler, Context, AssemblerContext } from 'assemblerjs';
import { Task } from '@assemblerjs/core';
import { render } from 'solid-js/web';
import { AppRouter } from '@/windows/router';
import { AssemblerProvider } from '@/renderer/providers/AssemblerProvider';

@Assemblage()
class MainApp implements AbstractAssemblage {
  constructor(@Context() private context: AssemblerContext) {}

  public async onInit(): Promise<void> {
    const root = document.getElementById('app');
    if (!root) throw new Error('Root element not found');

    render(() => (
      <AssemblerProvider context={this.context}>
        <AppRouter />
      </AssemblerProvider>
    ), root);
    console.log('Solid Router initialized');
  }
}

const task = Task.of(() => Assembler.build(MainApp));
task.fork()
  .then(() => console.log('Solid app was successfully built and mounted.'))
  .catch((error) => console.error('There was an error during Solid app build:', error));
```

**Solid Component:**
function MyComponent() {
  const [loading, setLoading] = createSignal(false);
  const [currentView, setCurrentView] = createSignal<string | null>(null);
  
  // Access the AssemblerJS context
  const context = useContext();
  const stateBroker = context.require(ApplicationStateBroker);

  // Register on mount
  onMount(() => {
    const loadingRef = createRef(loading, setLoading);
    const viewRef = createRef(currentView, setCurrentView);
    
    stateBroker.register('isLoading', loadingRef);
    stateBroker.register('currentView', viewRef, { exclusive: true });
  });

  return (
    <div>
      <Show when={loading()}>
        <div>Loading...</div>
      </Show>
      <Show when={currentView() === 'dashboard'}>
        <div>Dashboard View</div>
      </Show>
      
      <button onClick={() => stateBroker.startCurrentView('dashboard')}>
        Show Dashboard
      </button>
    </div>
  );
}
```

---

## Svelte Example

**In main.svelte.ts.ejs:**
```typescript
import { AbstractAssemblage, Assemblage, Assembler, Context, AssemblerContext } from 'assemblerjs';
import { Task } from '@assemblerjs/core';
import { router } from '@/windows/router';
import App from './App.svelte';

@Assemblage()
class MainApp implements AbstractAssemblage {
  private app: App | null = null;

  constructor(@Context() private context: AssemblerContext) {}

  public async onInit(): Promise<void> {
    const target = document.getElementById('app');
    if (!target) throw new Error('Root element not found');

    // The context will be passed through the App component props
    this.app = new App({
      target,
      props: {
        router: router,
        assemblerContext: this.context
      }
    });
    console.log('Svelte Router initialized');
  }
}

const task = Task.of(() => Assembler.build(MainApp));
task.fork()
  .then(() => console.log('Svelte app was successfully built and mounted.'))
  .catch((error) => console.error('There was an error during Svelte app build:', error));
```

**Svelte Component:**
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { useContext } from '@/composables';
  import { ApplicationStateBroker, createRef } from '@/features/state/renderer/brokers';

  // Access the AssemblerJS context
  const context = useContext();
  const stateBroker = context.require(ApplicationStateBroker);
  
  const isLoading = writable(false);
  const currentView = writable<string | null>(null);

  onMount(() => {
    stateBroker.register('isLoading', createRef(isLoading));
    stateBroker.register('currentView', createRef(currentView), {
      exclusive: true
    });
  });

  function showDashboard() {
    stateBroker.startCurrentView('dashboard');
  }
</script>

{#if $isLoading}
  <div>Loading...</div>
{/if}

{#if $currentView === 'dashboard'}
  <div>Dashboard View</div>
{/if}

<button on:click={showDashboard}>Show Dashboard</button>
```

---

## Vanilla JS Example

**In main.vanilla.ts.ejs:**
```typescript
import { AbstractAssemblage, Assemblage, Assembler, Context, AssemblerContext } from 'assemblerjs';
import { Task } from '@assemblerjs/core';
import { router } from '@/windows/router';
import App from './App';
import { initializeContext } from '@/renderer/providers/AssemblerProvider';

@Assemblage()
class MainApp implements AbstractAssemblage {
  constructor(@Context() private context: AssemblerContext) {}

  public async onInit(): Promise<void> {
    // Initialize global context for vanilla JS
    initializeContext(this.context);

    // Initialize vanilla JavaScript app with router
    const appElement = document.getElementById('app');
    if (!appElement) throw new Error('Root element not found');

    const app = new App();
    app.init(router);
    appElement.appendChild(app.render());
    console.log('Vanilla Router initialized');
  }
}

const task = Task.of(() => Assembler.build(MainApp));
task.fork()
  .then(() => console.log('Vanilla app was successfully built and mounted.'))
  .catch((error) => console.error('There was an error during Vanilla app build:', error));
```

**Using the broker in Vanilla JS:**
import { useContext } from '@/composables';
import { ApplicationStateBroker, createRef } from '@/features/state/renderer/brokers';

// Access the context and get the broker
const context = useContext();
const stateBroker = context.require(ApplicationStateBroker);

const counter = createRef(0);
stateBroker.register('counter', counter);

// Subscribe to updates
const unsubscribe = counter.subscribe?.((value) => {
  document.getElementById('count')!.textContent = `Count: ${value}`;
});

// Update value (automatically triggers subscribers)
document.getElementById('increment')?.addEventListener('click', () => {
  counter.value++;
});

// Cleanup
document.addEventListener('beforeunload', () => {
  unsubscribe?.();
});
```

---

## API Reference

### `ApplicationStateBroker`

#### `register<T>(name: string, refValue: ReactiveRef<T>, options?: RegisterOptions): void`

Registers a new state in the broker.

**Parameters:**
- `name`: Unique identifier for the state
- `refValue`: Reactive reference created with framework-specific helper
- `options`: Optional configuration
  - `activate?: (value?: T) => void`: Callback when state is activated
  - `deactivate?: () => void`: Callback when state is deactivated
  - `exclusive?: boolean`: If true, deactivates other exclusive states when activated

**Auto-generated methods:**
- `start{Name}(value?: T)`: Activates the state
- `stop{Name}()`: Deactivates the state

#### `getState<T>(name: string): ReactiveRef<T> | undefined`

Retrieves a registered state reference.

#### `activateState(name: string, value?: any): void`

Manually activates a state.

#### `deactivateState(name: string): void`

Manually deactivates a state.

#### `resetExclusiveStates(exceptName?: string): void`

Deactivates all exclusive states except the specified one.

#### `resetAllStates(): void`

Resets all registered states to their default values.

#### `unregister(name: string): void`

Removes a state from the broker and cleans up its methods.

---

## Best Practices

1. **Register states early**: Register states during component/service initialization
2. **Use exclusive states**: For mutually exclusive views or modes
3. **Subscribe for side effects**: Use `subscribe` for DOM updates, logging, or analytics
4. **Clean up**: Always unsubscribe and unregister when components are destroyed
5. **Type your states**: Use TypeScript generics for type safety
6. **Use callbacks**: Leverage `activate` and `deactivate` for lifecycle management

---

## Advanced Example: Multi-View Application

```typescript
// In a Vue component using composition API:
import { ref } from 'vue';
import { useContext } from '@/composables';
import { ApplicationStateBroker } from '@/features/state/renderer/brokers';

export function useViewManager() {
  const context = useContext();
  const stateBroker = context.require(ApplicationStateBroker);

  // Register mutually exclusive views
  stateBroker.register('currentView', ref<string | null>(null), {
    exclusive: true,
    activate: (view) => onViewChange(view),
    deactivate: () => onViewExit()
  });

  // Register modal states
  stateBroker.register('isModalOpen', ref(false));
  stateBroker.register('modalContent', ref<string | null>(null));
  
  // Register loading states for different operations
  stateBroker.register('isLoadingData', ref(false));
  stateBroker.register('isSubmitting', ref(false));

  const onViewChange = (view: string | null) => {
    console.log(`Navigating to: ${view}`);
    // Analytics, cleanup, etc.
  };

  const onViewExit = () => {
    console.log('Exiting view');
    // Save state, cleanup subscriptions, etc.
  };

  const showModal = (content: string) => {
    stateBroker.activateState('modalContent', content);
    stateBroker.activateState('isModalOpen', true);
  };

  const hideModal = () => {
    stateBroker.deactivateState('isModalOpen');
    stateBroker.deactivateState('modalContent');
  };

  return {
    showModal,
    hideModal
  };
}
```

---

## License

This state management system is part of the AssemblerJS Electron template.
