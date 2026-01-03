import { PositionalArgConfig } from '@/services/command.abstract';
import { AbstractAssemblage } from 'assemblerjs';

export abstract class AbstractPathPositionalArg implements AbstractAssemblage {
  public abstract get value(): PositionalArgConfig;
}
