import { promises as fs, existsSync } from 'node:fs';
import { join, resolve, isAbsolute } from 'node:path';
import { AbstractAssemblage } from 'assemblerjs';

export abstract class AbstractProject implements AbstractAssemblage {
  constructor(
    protected inquirer: Inquirer,
    protected bootstrapValues: Record<string, any>,
    protected runningPath: string
  ) {}

  public abstract build(): Promise<void>;

  protected async createDirectory(path: string): Promise<void> {
    if (existsSync(path)) {
      await fs.rm(path, { recursive: true, force: true });
    }
    await fs.mkdir(path, { recursive: true });
  }

  protected async checkPathConflicts(): Promise<void> {
    const pathToCheck = this.bootstrapValues['_pathToCheck'];
    if (!pathToCheck) return;

    const fullPath = join(pathToCheck, this.bootstrapValues.name);
    if (this.pathExists(fullPath)) {
      const overwrite = await this.promptOverwrite(fullPath);
      if (!overwrite) {
        const newPath = await this.promptNewPath();
        this.bootstrapValues['path'] = newPath;
      }
    }

    delete this.bootstrapValues['_pathToCheck'];
  }

  protected pathExists(path: string): boolean {
    return existsSync(path);
  }

  protected async promptOverwrite(path: string): Promise<boolean> {
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

  protected async promptNewPath(): Promise<string> {
    const { path } = await this.inquirer.prompt([
      {
        type: 'input',
        name: 'path',
        message: 'Enter a new path for the project:',
        validate: (input: string) => {
          if (!input || input.length === 0) {
            return 'Path cannot be empty.';
          }
          return true;
        },
        filter: (input: string) => {
          return isAbsolute(input) ? input : resolve(this.runningPath, input);
        },
      },
    ]);
    return path;
  }
}
