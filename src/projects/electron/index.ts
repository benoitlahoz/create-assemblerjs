import { dirname, join } from 'node:path';
import { Assemblage, Use } from 'assemblerjs';
import { AbstractProject } from '../project.abstract';
import { AbstractTemplateParserService } from '../../services/template-parser.abstract';

const ProjectName = 'electron';
const Frameworks = ['vanilla', 'vue', 'react', 'svelte', 'solid'];
const Options = ['pug', 'tailwindcss', 'shadcn'];

@Assemblage({
  tags: [ProjectName],
})
export default class ElectronProject extends AbstractProject {
  public constructor(
    @Use('env') public env: MainEnv,
    @Use('inquirer') public inquirer: Inquirer,
    @Use('bootstrapValues') public bootstrapValues: Record<string, any>,
    public templateParser: AbstractTemplateParserService
  ) {
    super(inquirer, bootstrapValues, env.runningPath);
  }

  protected get templatePath(): string {
    return join(dirname(new URL(import.meta.url).pathname), 'templates');
  }

  public async build(): Promise<void> {
    await this.checkPathConflicts();

    const framework = await this.promptFramework();
    this.bootstrapValues['framework'] = framework;

    const options = await this.promptOptions();
    this.bootstrapValues['options'] = options;

    const fullpath = join(this.bootstrapValues.path, this.bootstrapValues.name);
    await this.createDirectory(fullpath);

    const templates = this.templatePath;

    const context = {
      ...this.bootstrapValues,
      framework,
      options,
      packageName: this.bootstrapValues.name,
    };

    await this.templateParser.processTemplateDirectory(
      templates,
      fullpath,
      context
    );
  }

  public async promptFramework(): Promise<string> {
    const answer = await this.inquirer.prompt([
      {
        type: 'list',
        name: 'framework',
        message: 'Select the framework for the project:',
        choices: Frameworks,
        default: 'vanilla',
      },
    ]);
    return answer.framework;
  }

  public async promptOptions(): Promise<string[]> {
    const answer = await this.inquirer.prompt([
      {
        type: 'checkbox',
        name: 'options',
        message: 'Select the options for the package:',
        choices: Options,
      },
    ]);
    return answer.options;
  }
}
