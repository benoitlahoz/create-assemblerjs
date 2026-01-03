import { AbstractAssemblage } from 'assemblerjs';

export interface CommandServiceConfig {
  name: string;
  description: string;
  usage: string;
  help: false;
  strict: false;
}

export interface PositionalArgConfig {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean';
  choices?: string[];
  default?: any;
  coerce?: (input: string) => any | Promise<any>;
  prompt: {
    message: string | ((name: string, type: string) => string);
    type: 'input' | 'list' | 'checkbox' | 'confirm';
    validate?: (input: string) => boolean | string | Promise<boolean | string>;
    filter?: (input: string) => any | Promise<any>;
    question?: (parsed: any) => any | Promise<any>;
  };
}

export abstract class AbstractCommandService implements AbstractAssemblage {
  public abstract positional(config: PositionalArgConfig): this;
  public abstract execute(
    action: (args: Record<string, any>) => void | Promise<void>
  ): Promise<void>;
}
