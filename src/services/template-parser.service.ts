import { promises as fs } from 'node:fs';
import { join, extname, basename, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import * as ejs from 'ejs';
import { Assemblage, Use } from 'assemblerjs';
import {
  AbstractTemplateParserService,
  TemplateContext,
} from './template-parser.abstract';

@Assemblage()
export class TemplateParserService implements AbstractTemplateParserService {
  constructor(
    @Use('bootstrapValues') private bootstrapValues: Record<string, any>
  ) {}

  public async parseTemplate(
    templatePath: string,
    context: TemplateContext
  ): Promise<string> {
    const templateContent = await fs.readFile(templatePath, 'utf-8');

    // Merge bootstrap values with context
    const fullContext = {
      ...this.bootstrapValues,
      ...context,
      // Helper functions for conditional logic
      hasOption: (option: string) => context.options?.includes(option) ?? false,
      hasAnyOption: (...options: string[]) =>
        options.some((opt) => context.options?.includes(opt) ?? false),
      hasAllOptions: (...options: string[]) =>
        options.every((opt) => context.options?.includes(opt) ?? false),
      // Helper functions for framework conditional logic
      isFramework: (framework: string) => context.framework === framework,
      isVanilla: () => context.framework === 'vanilla',
      isVue: () => context.framework === 'vue',
      isReact: () => context.framework === 'react',
      isSvelte: () => context.framework === 'svelte',
      isSolid: () => context.framework === 'solid',
    };

    return ejs.render(templateContent, fullContext);
  }

  public async copyTemplateFile(
    templatePath: string,
    destPath: string,
    context: TemplateContext
  ): Promise<void> {
    const ext = extname(templatePath);
    const fileName = basename(templatePath);

    // Clean the destination path by removing conditional parts
    let cleanDestPath = this.getCleanDestinationPath(destPath);

    // Special handling for React: change .ts to .tsx for main files
    if (context.framework === 'react' && cleanDestPath.includes('main.ts')) {
      cleanDestPath = cleanDestPath.replace('main.ts', 'main.tsx');
    }

    if (ext === '.ejs') {
      // Parse EJS template
      const parsedContent = await this.parseTemplate(templatePath, context);
      const outputPath = cleanDestPath.replace(/\.ejs$/, '');
      await fs.writeFile(outputPath, parsedContent, 'utf-8');
    } else {
      // Copy file as-is
      await fs.copyFile(templatePath, cleanDestPath);
    }
  }

  private getCleanDestinationPath(destPath: string): string {
    const dir = dirname(destPath);
    const fileName = basename(destPath);
    const ext = extname(fileName);
    const baseName = basename(fileName, ext);

    // Split by dots and filter out conditional parts
    const parts = baseName.split('.');

    // Detect if this is a real Vue component file (ends with .vue extension)
    const isVueComponent =
      ext === '.vue' || (ext === '.ejs' && fileName.endsWith('.vue.ejs'));

    const cleanParts = parts.filter((part, index) => {
      // Always keep the first part (base filename)
      if (index === 0) return true;

      // Remove negation conditions like '!pug', '!vue'
      if (part.startsWith('!')) return false;

      // Remove multi-option conditions like 'vue+tailwind'
      if (part.includes('+')) return false;

      // Special handling for 'vue'
      if (part === 'vue') {
        // Keep 'vue' if it's the last part before extension and this is a Vue component
        if (isVueComponent && index === parts.length - 1) return true;
        // Otherwise, it's a condition, remove it
        return false;
      }

      // Remove framework names that are conditions (but not file type indicators)
      if (['vanilla', 'react', 'svelte', 'solid'].includes(part)) return false;

      // Remove framework-option combinations (e.g., react-pug, vue-tailwind)
      if (part.includes('-')) {
        const [frameworkPart, optionPart] = part.split('-');
        const frameworks = ['vanilla', 'vue', 'react', 'svelte', 'solid'];
        const options = ['pug', 'tailwindcss', 'scss', 'sass'];

        if (
          frameworks.includes(frameworkPart) &&
          options.includes(optionPart)
        ) {
          return false;
        }
      }

      // Remove other known option names that are conditions
      if (['pug', 'tailwindcss'].includes(part)) return false;

      // Keep actual file type indicators that are not options
      if (
        ['js', 'ts', 'css', 'html', 'config', 'spec', 'test', 'min'].includes(
          part
        )
      )
        return true;

      // For any other part, keep it (could be custom naming)
      return true;
    });

    const cleanFileName = cleanParts.join('.') + ext;
    return join(dir, cleanFileName);
  }

  public async processTemplateDirectory(
    templateDir: string,
    destDir: string,
    context: TemplateContext
  ): Promise<void> {
    if (!existsSync(templateDir)) {
      console.warn(`Template directory does not exist: ${templateDir}`);
      return;
    }

    const entries = await fs.readdir(templateDir, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = join(templateDir, entry.name);
      const destPath = join(destDir, entry.name);

      if (entry.isDirectory()) {
        // Handle conditional directories
        if (this.shouldIncludeDirectory(entry.name, context)) {
          await fs.mkdir(destPath, { recursive: true });
          await this.processTemplateDirectory(sourcePath, destPath, context);
        }
      } else {
        // Handle conditional files
        if (this.shouldIncludeFile(entry.name, context)) {
          await this.copyTemplateFile(sourcePath, destPath, context);
        }
      }
    }
  }

  private shouldIncludeDirectory(
    dirName: string,
    context: TemplateContext
  ): boolean {
    // Directory naming convention: dirname.option.ext or dirname.!option.ext or dirname.framework.ext
    const parts = dirName.split('.');

    if (parts.length < 2) return true; // No condition, always include

    const condition = parts[parts.length - 1];

    if (condition.startsWith('!')) {
      // Exclude if option/framework is present
      const optionOrFramework = condition.slice(1);
      return (
        !context.options?.includes(optionOrFramework) &&
        context.framework !== optionOrFramework
      );
    } else {
      // Check if it's a framework condition
      if (['vanilla', 'vue', 'react', 'svelte', 'solid'].includes(condition)) {
        return context.framework === condition;
      }
      // Otherwise, include only if option is present
      return context.options?.includes(condition) ?? false;
    }
  }

  private shouldIncludeFile(
    fileName: string,
    context: TemplateContext
  ): boolean {
    // File naming convention: filename.option.ext or filename.!option.ext or filename.framework.ext
    const baseName = basename(fileName, extname(fileName));
    const parts = baseName.split('.');

    // Look for conditions in all parts except the first (base name)
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];

      // Skip common file extensions/types (but NOT vue, which can be both an option and framework indicator)
      if (['js', 'ts', 'css', 'html', 'ejs'].includes(part)) continue;

      // Handle negation conditions (e.g., !pug, !vue)
      if (part.startsWith('!')) {
        const optionOrFramework = part.slice(1);
        // Exclude if option is present or if it's the current framework
        if (
          context.options?.includes(optionOrFramework) ||
          context.framework === optionOrFramework
        ) {
          return false;
        }
        continue;
      }

      // Handle multi-option conditions (e.g., vue+tailwind)
      if (part.includes('+')) {
        const requiredItems = part.split('+');
        const hasAllRequired = requiredItems.every((item) => {
          // Check if it's a framework
          if (['vanilla', 'vue', 'react', 'svelte', 'solid'].includes(item)) {
            return context.framework === item;
          }
          // Otherwise, it's an option
          return context.options?.includes(item);
        });
        if (!hasAllRequired) {
          return false;
        }
        continue;
      }

      // Handle framework-option combinations (e.g., react-pug, vue-tailwind)
      if (part.includes('-')) {
        const [frameworkPart, optionPart] = part.split('-');
        const frameworks = ['vanilla', 'vue', 'react', 'svelte', 'solid'];
        const options = ['pug', 'tailwindcss', 'scss', 'sass'];

        if (
          frameworks.includes(frameworkPart) &&
          options.includes(optionPart)
        ) {
          // Must match framework AND have the option
          if (
            context.framework !== frameworkPart ||
            !context.options?.includes(optionPart)
          ) {
            return false;
          }
          continue;
        }
      }

      // Handle framework conditions
      if (['vanilla', 'vue', 'react', 'svelte', 'solid'].includes(part)) {
        if (context.framework !== part) {
          return false;
        }
        continue;
      }

      // Handle option conditions (e.g., pug, tailwindcss)
      if (['pug', 'tailwindcss', 'scss', 'sass'].includes(part)) {
        if (!context.options?.includes(part)) {
          return false;
        }
        continue;
      }
    }

    return true; // Include by default if no exclusion conditions are met
  }
}
