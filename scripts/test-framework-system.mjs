#!/usr/bin/env node

import { TemplateParserService } from '../src/services/template-parser.service.js';

// Test manuel du système de framework
console.log('🧪 Test du système de framework\n');

const service = new TemplateParserService({});

// Test 1: Filtrage des fichiers par framework
console.log('Test 1: Filtrage des fichiers par framework');
const testFiles = [
  'App.vue.vue.ejs',
  'App.react.tsx.ejs',
  'App.vanilla.ts.ejs',
  'App.solid.tsx.ejs',
  'App.svelte.svelte.ejs',
  'App.!vue.tsx.ejs',
  'Component.vue+tailwindcss.vue.ejs',
];

const frameworks = ['vue', 'react', 'vanilla', 'solid', 'svelte'];

frameworks.forEach((framework) => {
  console.log(`\n📁 Framework: ${framework}`);
  const context = { framework, options: ['tailwindcss'] };

  testFiles.forEach((file) => {
    // @ts-ignore - accessing private method for testing
    const shouldInclude = service.shouldIncludeFile(file, context);
    const status = shouldInclude ? '✅' : '❌';
    console.log(`  ${status} ${file}`);
  });
});

// Test 2: Nettoyage des noms de fichiers
console.log('\n\nTest 2: Nettoyage des noms de fichiers');
const testPaths = [
  '/path/App.react.tsx.ejs',
  '/path/App.vue.vue.ejs',
  '/path/App.vanilla.ts.ejs',
  '/path/App.!pug.vue.ejs',
  '/path/Component.vue+tailwindcss.vue.ejs',
];

testPaths.forEach((path) => {
  // @ts-ignore - accessing private method for testing
  const cleaned = service.getCleanDestinationPath(path);
  console.log(`📄 ${path} → ${cleaned}`);
});

// Test 3: Templates EJS
console.log('\n\nTest 3: Templates EJS avec helpers de framework');
const testTemplate = `
<% if (isVue()) { %>// Vue.js framework detected
import { createApp } from 'vue'<% } %>
<% if (isReact()) { %>// React framework detected
import React from 'react'<% } %>
<% if (isVanilla()) { %>// Vanilla JS framework detected
console.log('Vanilla JavaScript')<% } %>
<% if (isFramework('solid')) { %>// Solid.js framework detected
import { createSignal } from 'solid-js'<% } %>
`;

const testContexts = [
  { framework: 'vue', options: [] },
  { framework: 'react', options: [] },
  { framework: 'vanilla', options: [] },
  { framework: 'solid', options: [] },
];

for (const context of testContexts) {
  console.log(`\n🎨 Template pour framework: ${context.framework}`);
  try {
    const result = await service.parseTemplate('test.ejs', context);
    console.log(result.trim());
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
  }
}

console.log('\n✨ Tests terminés !');
