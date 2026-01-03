#!/usr/bin/env node

// Test script for new naming convention
const {
  TemplateParserService,
} = require('./bin/template-parser.abstract-CfoyWFZu.js');

const parser = new TemplateParserService();

// Test context with React + Pug
const context = {
  framework: 'react',
  options: ['pug'],
};

// Test files
const testFiles = [
  'Home.react-pug.tsx.ejs',
  'Home.vue-pug.vue.ejs',
  'Home.solid-pug.tsx.ejs',
  'Home.react.tsx.ejs',
  'Home.pug.vue.ejs',
];

console.log('Testing new naming convention with React + Pug context:');
console.log('Context:', context);
console.log('');

testFiles.forEach((file) => {
  const shouldInclude = parser.shouldIncludeFile(file, context);
  console.log(`${file}: ${shouldInclude ? '✅ INCLUDED' : '❌ EXCLUDED'}`);
});
