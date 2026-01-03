import { PositionalArgConfig } from '@/services/command.abstract';
import { Assemblage, Use } from 'assemblerjs';
import { AbstractNamePositionalArg } from './name.abstract';
import { toValidNpmPackageName } from '../core/utils';

@Assemblage()
export class NamePositionalArg implements AbstractNamePositionalArg {
  constructor(
    @Use('env') private env: MainEnv,
    @Use('bootstrapValues') private bootstrapValues: Record<string, any>
  ) {}

  public get value(): PositionalArgConfig {
    return {
      name: 'name',
      description: 'Name of the project',
      type: 'string',
      coerce: (input) => {
        const validName = toValidNpmPackageName(input);
        this.bootstrapValues['name'] = validName;
        return validName;
      },
      prompt: {
        message: () => `Name of the project:`,
        type: 'input',
        validate: (input) => {
          const validInput = toValidNpmPackageName(input);
          return validInput && validInput.length > 0
            ? true
            : 'Project name must be a valid NPM package name.';
        },
      },
    };
  }
}
