import { isAbsolute, resolve, join } from 'node:path';
import fs from 'node:fs';
import { Assemblage, Use } from 'assemblerjs';
import { PositionalArgConfig } from '@/services/command.abstract';
import { AbstractPathPositionalArg } from './path.abstract';

@Assemblage()
export class PathPositionalArg implements AbstractPathPositionalArg {
  constructor(
    @Use('env') private env: MainEnv,
    @Use('inquirer') private inquirer: Inquirer,
    @Use('bootstrapValues') private bootstrapValues: Record<string, any>
  ) {}

  public get value(): PositionalArgConfig {
    return {
      name: 'path',
      description: 'Path of the project',
      type: 'string',
      coerce: async (input) => {
        const path =
          input && input.trim().length > 0 && input.trim() !== '.'
            ? isAbsolute(input)
              ? input
              : resolve(this.env.runningPath, input)
            : undefined;

        console.log('Coerce path:', path);

        // Si un chemin est fourni, on le stocke pour traitement ultérieur
        if (path) {
          this.bootstrapValues['path'] = path;
          // On marque qu'on doit vérifier les conflits plus tard quand name sera disponible
          this.bootstrapValues['_pathToCheck'] = path;
          return path;
        }

        // Si aucun chemin n'est fourni, retourner undefined pour déclencher le prompt
        return undefined;
      },
      /*
      coerce: async (input) => {
        const path =
          input && input.trim().length > 0 && input.trim() !== '.'
            ? isAbsolute(input)
              ? input
              : resolve(this.env.runningPath, input)
            : undefined;

        const resolvedPath = path
          ? join(path, this.bootstrapValues['name'])
          : join(this.env.runningPath, this.bootstrapValues['name']);

        if (path && this.pathExists(resolvedPath)) {
          const overwrite = await this.promptOverwrite(resolvedPath);
          if (overwrite) {
            this.bootstrapValues['path'] = path;
            return path;
          } else {
            const newPath = await this.promptPath();
            this.bootstrapValues['path'] = newPath;
            return newPath;
          }
        }

        this.bootstrapValues['path'] = path;
        return path;
      },
      */
      prompt: {
        message: () => `Path where to create the project:`,
        type: 'input',
        filter: (input) => {
          return isAbsolute(input)
            ? input
            : resolve(this.env.runningPath, input);
        },
        question: async (answers: Record<string, any>) => {
          // Cette fonction se déclenche seulement si coerce retourne undefined
          while (true) {
            const answer = await this.promptPath();
            const resolvedPath = join(answer, answers['name']);

            if (this.pathExists(resolvedPath)) {
              const overwrite = await this.promptOverwrite(resolvedPath);
              if (overwrite) {
                this.bootstrapValues['path'] = answer;
                return answer;
              }
            } else {
              this.bootstrapValues['path'] = answer;
              return answer;
            }
          }
        },
      },
    };
  }

  private pathExists(path: string): boolean {
    return fs.existsSync(path);
  }

  private async promptPath(): Promise<string> {
    const { path } = await this.inquirer.prompt([
      {
        type: 'input',
        name: 'path',
        message: 'Path where the package will be created:',
        default: this.env.runningPath,
        validate: (input: string) => {
          if (!input || input.length === 0) {
            return 'Path cannot be empty.';
          }
          return true;
        },
        filter: (input: string) =>
          isAbsolute(input) ? input : resolve(this.env.runningPath, input),
      },
    ]);
    return path;
  }

  private async promptOverwrite(path: string): Promise<boolean> {
    const { overwrite } = await this.inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Path "${path}" already exists. Overwrite?`,
        default: false,
      },
    ]);
    return overwrite;
  }
}
