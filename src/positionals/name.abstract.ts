import { PositionalArgConfig } from '@/services/command.abstract';
import { AbstractAssemblage } from 'assemblerjs';

export abstract class AbstractNamePositionalArg implements AbstractAssemblage {
  public abstract get value(): PositionalArgConfig;
}
