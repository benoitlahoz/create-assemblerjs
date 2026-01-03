import { Assemblage, Configuration, Use } from 'assemblerjs';
import yargs, { ArgumentsCamelCase, type Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';
import {
  AbstractCommandService,
  type CommandServiceConfig,
  type PositionalArgConfig,
} from './command.abstract';
import {isUndefined } from '@assemblerjs/core';

@Assemblage()
export class CommandService implements AbstractCommandService {
  private positionals: PositionalArgConfig[] = [];

  constructor(
    @Configuration() private configuration: CommandServiceConfig,
    @Use('inquirer') private inquirer: Inquirer,
    @Use('bootstrapValues') private bootstrapValues: Record<string, any>
  ) {}

  public positional(config: PositionalArgConfig): this {
    if (this.positionals.find((p) => p.name === config.name)) {
      throw new Error(
        `Positional argument with name "${config.name}" already exists.`
      );
    }

    this.positionals.push(config);
    return this;
  }

  public async execute(
    action: (args: Record<string, any>) => void | Promise<void>
  ): Promise<void> {
    yargs(hideBin(process.argv))
      .scriptName(this.configuration.name)
      .usage(this.configuration.usage)
      .command(
        '$0 ' + this.positionals.map((p) => `[${p.name}]`).join(' '),
        this.configuration.description,
        (yargs) => {
          return this.positionals.reduce((acc, positional) => {
            return acc.positional(positional.name, {
              type: positional.type,
              describe: positional.description,
              choices: positional.choices,
              default: positional.default,
              demandOption: true,
              coerce: positional.coerce,
            });
          }, yargs);
        },
        async (args) => {
          this.bootstrapValues = await this.parseArgs(args);
          await action(this.bootstrapValues);
        }
      )
      .demandCommand(0)
      .help(this.configuration.help !== false)
      .alias('help', 'h')
      .alias('version', 'v')
      .strict(this.configuration.strict !== false)
      .parseAsync();
  }

  private async parseArgs(
    args: ArgumentsCamelCase
  ): Promise<Record<string, any>> {
    const parsedArgs = { ...args };
    delete parsedArgs._;
    delete parsedArgs.$0;

    for (const positional of this.positionals) {
      if (isUndefined(parsedArgs[positional.name])) {
        if (!isUndefined(positional.prompt.question)) {
          // Override prompt with custom question function.
          const answer = await positional.prompt.question(parsedArgs);
          parsedArgs[positional.name] = answer;
          this.bootstrapValues[positional.name] = answer;
        } else {
          const message =
            typeof positional.prompt.message === 'function'
              ? positional.prompt.message(positional.name, positional.type)
              : positional.prompt.message;

          const promptConfig: any = {
            name: positional.name,
            message: message,
            type: positional.prompt.type,
            validate: positional.prompt.validate,
            filter: positional.prompt.filter,
            choices: positional.choices,
          };

          const answer = await this.inquirer.prompt(promptConfig);
          parsedArgs[positional.name] = answer[positional.name];
          this.bootstrapValues[positional.name] = answer[positional.name];
        }
      }
    }
    return parsedArgs;
  }
}
