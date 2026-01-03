import { AbstractAssemblage } from 'assemblerjs';

export interface TemplateContext {
  [key: string]: any;
  framework?: string;
  options?: string[];
  packageName?: string;
  name?: string;
  path?: string;
}

export abstract class AbstractTemplateParserService
  implements AbstractAssemblage
{
  abstract parseTemplate(
    templatePath: string,
    context: TemplateContext
  ): Promise<string>;
  abstract copyTemplateFile(
    templatePath: string,
    destPath: string,
    context: TemplateContext
  ): Promise<void>;
  abstract processTemplateDirectory(
    templateDir: string,
    destDir: string,
    context: TemplateContext
  ): Promise<void>;
}
