import { PositionalArgConfig } from '@/services/command.abstract';
import { Assemblage, Use } from 'assemblerjs';
import { AbstractTypePositionalArg } from './type.abstract';

@Assemblage()
export class TypePositionalArg implements AbstractTypePositionalArg {
  constructor(
    @Use('env') private env: MainEnv,
    @Use('bootstrapValues') private bootstrapValues: Record<string, any>
  ) {}

  public get value(): PositionalArgConfig {
    return {
      name: 'type',
      description: 'Type of project',
      type: 'string',
      choices: this.env.projectTypes,
      coerce: (input) => {
        this.bootstrapValues['type'] = input;
        return input;
      },
      prompt: {
        message: () => `Select the type of project to create:`,
        type: 'list',
      },
    };
  }
}
