import { PositionalArgConfig } from '@/services/command.abstract';
import { AbstractAssemblage } from 'assemblerjs';

export abstract class AbstractTypePositionalArg implements AbstractAssemblage {
  public abstract get value(): PositionalArgConfig;
}
