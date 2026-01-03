import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import path, { join } from 'node:path';
import swc from '@rollup/plugin-swc';
import { externalizeDeps } from 'vite-plugin-externalize-deps';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const getEntries = () => {
  const srcDir = path.resolve(__dirname, 'src');
  const entries: Record<string, string> = {
    'create-assemblerjs': 'src/index.ts',
  };

  try {
    const projectsDir = join(srcDir, 'projects');
    const folders = readdirSync(projectsDir);

    folders.forEach((folder) => {
      const folderPath = path.join(projectsDir, folder);
      const stat = statSync(folderPath);

      if (stat.isDirectory()) {
        const indexPath = path.join(folderPath, 'index.ts');
        try {
          statSync(indexPath); // Check if index.ts exists
          entries[
            `projects/${folder}/index`
          ] = `src/projects/${folder}/index.ts`;
        } catch {
          // index.ts doesn't exist in this folder, skip
        }
      }
    });
  } catch (error) {
    throw new Error(`Could not read projects directory: ${error}`);
  }

  return entries;
};

// Function to generate template copy targets
const getTemplateCopyTargets = () => {
  const targets: Array<{ src: string; dest: string }> = [];
  const srcDir = path.resolve(__dirname, 'src');

  try {
    const projectsDir = join(srcDir, 'projects');
    const folders = readdirSync(projectsDir);

    folders.forEach((folder) => {
      const folderPath = path.join(projectsDir, folder);
      const templatesPath = path.join(folderPath, 'templates');

      try {
        const stat = statSync(templatesPath);
        if (stat.isDirectory()) {
          targets.push({
            src: `src/projects/${folder}/templates`,
            dest: `./projects/${folder}`,
          });
        }
      } catch {
        // Templates folder doesn't exist for this project, skip it
      }
    });
  } catch (error) {
    console.warn(`Could not read projects directory for templates: ${error}`);
  }

  return targets;
};

// Plugin to post-process and minify to a single line
const oneLineMinify = () => ({
  name: 'one-line-minify',
  writeBundle() {
    const outputDir = path.resolve(__dirname, 'bin');

    // Recursive function to process all files
    const processDirectory = (dirPath: string) => {
      const items = readdirSync(dirPath);

      items.forEach((item) => {
        const fullPath = path.join(dirPath, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          // Recursive processing of subdirectories
          processDirectory(fullPath);
        } else if (item.endsWith('.js')) {
          // Processing .js files
          let content = readFileSync(fullPath, 'utf-8');

          // Keep shebang on its own line (if it exists)
          const shebangMatch = content.match(/^#!.*$/m);
          const shebang = shebangMatch ? shebangMatch[0] + '\n' : '';

          if (shebang) {
            content = content.replace(/^#!.*$/m, '');
          }

          // Minify the rest to a single line
          content = content
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .join('');

          writeFileSync(fullPath, shebang + content);
        }
      });
    };

    processDirectory(outputDir);
  },
});

export default defineConfig(() => ({
  build: {
    outDir: './bin',
    emptyOutDir: true,
    reportCompressedSize: true,
    minify: 'terser' as const, // Use Terser for minification (compatible with esbuild: false)
    terserOptions: {
      format: {
        beautify: false,
        comments: false,
        max_line_len: false as const, // No line length limit
        semicolons: true,
        braces: false, // Remove unnecessary braces
        wrap_iife: false,
        ascii_only: false,
        quote_style: 3, // Use shortest quotes
      },
      compress: {
        drop_console: false,
        drop_debugger: true,
        sequences: true,
        conditionals: true,
        comparisons: true,
        evaluate: true,
        booleans: true,
        loops: true,
        unused: true,
        hoist_funs: true,
        keep_fargs: false,
        hoist_vars: false,
        if_return: true,
        join_vars: true,
        side_effects: false,
        collapse_vars: true,
        reduce_vars: true,
        pure_getters: true,
        unsafe: false,
        unsafe_comps: false,
        unsafe_math: false,
        unsafe_proto: false,
        unsafe_regexp: false,
        passes: 3, // Multiple passes for better compression
      },
      mangle: {
        toplevel: false,
        keep_classnames: true,
        keep_fnames: false,
        reserved: ['require', 'exports', 'module'],
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      entry: getEntries(),
      formats: ['es' as const],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    externalizeDeps(),
    swc({
      swc: {
        jsc: {
          parser: {
            syntax: 'typescript',
            dynamicImport: true,
            decorators: true,
          },
          target: 'es2021',
          transform: {
            decoratorMetadata: true,
          },
          minify: {
            mangle: true,
            compress: true,
            keep_classnames: true,
            sourceMap: false, // Disabled for single-line minification
          },
        },
      },
    }),
    oneLineMinify(), // Custom plugin to minify to a single line
    viteStaticCopy({
      targets: getTemplateCopyTargets(),
    }),
  ],
  esbuild: false as const,
  test: {
    watch: false,
    globals: true,
    environment: 'node',
    include: [
      '{src,tests,e2e}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './coverage',
      provider: 'istanbul' as const,
    },
  },
}));
