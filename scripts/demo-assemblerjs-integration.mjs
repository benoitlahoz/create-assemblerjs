#!/usr/bin/env node

/**
 * AssemblerJS integration demonstration script with different frameworks
 */

console.log('🚀 AssemblerJS Integration Demonstration\n');

const frameworks = {
  vue: {
    name: 'Vue.js',
    imports: ['createApp', 'vue'],
    mountPoint: '#app',
    initMethod: 'createApp(App).mount()',
  },
  react: {
    name: 'React',
    imports: ['React', 'createRoot', 'react-dom/client'],
    mountPoint: '#root',
    initMethod: 'createRoot(container).render()',
  },
  vanilla: {
    name: 'Vanilla JavaScript',
    imports: ['App'],
    mountPoint: '#app',
    initMethod: 'new App().render()',
  },
  solid: {
    name: 'Solid.js',
    imports: ['render', 'solid-js/web'],
    mountPoint: '#app',
    initMethod: 'render(() => App(), root)',
  },
  svelte: {
    name: 'Svelte',
    imports: ['App.svelte'],
    mountPoint: '#app',
    initMethod: 'new App({ target })',
  },
};

console.log('📋 Supported frameworks with AssemblerJS:\n');

Object.entries(frameworks).forEach(([key, config]) => {
  console.log(`🎯 ${config.name} (${key})`);
  console.log(`   📦 Imports: ${config.imports.join(', ')}`);
  console.log(`   🎯 Mount: ${config.mountPoint}`);
  console.log(`   ⚡ Init: ${config.initMethod}`);
  console.log('');
});

console.log('🏗️  Common AssemblerJS structure:');
console.log(`
@Assemblage()
class MainApp implements AbstractAssemblage {
  constructor() {}

  public async onInit(): Promise<void> {
    // Framework-specific initialization
  }
}

const task = Task.of(() => Assembler.build(MainApp));
task.fork()
  .then(() => console.log('App mounted'))
  .catch(error => console.error('Error:', error));
`);

console.log('✨ Benefits of this approach:');
console.log('  • Uniform architecture');
console.log('  • Centralized error handling');
console.log('  • Dependency injection');
console.log('  • Controlled lifecycle');
console.log('  • Future extensibility');

console.log('\n🎉 AssemblerJS integration completed successfully!');
