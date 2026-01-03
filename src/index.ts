#!/usr/bin/env node

import 'reflect-metadata';
import { resolve, dirname } from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import {
  AbstractAssemblage,
  Assemblage,
  Assembler,
  Context,
  Definition,
  Use,
  type AssemblageDefinition,
  type AssemblerContext,
} from 'assemblerjs';
import { type Result, Task } from '@assemblerjs/core';
import Inquirer from 'inquirer';
import consola from 'consola';
import {
  AbstractCommandService,
  CommandServiceConfig,
} from './services/command.abstract';
import { CommandService } from './services/command.service';
import { AbstractTemplateParserService } from './services/template-parser.abstract';
import { TemplateParserService } from './services/template-parser.service';

import { AbstractTypePositionalArg } from './positionals/type.abstract';
import { TypePositionalArg } from './positionals/type.positional-arg';
import { AbstractNamePositionalArg } from './positionals/name.abstract';
import { NamePositionalArg } from './positionals/name.positional-arg';
import { AbstractPathPositionalArg } from './positionals/path.abstract';
import { PathPositionalArg } from './positionals/path.positional-arg';

import { AbstractProject } from './projects/project.abstract';
import { injectedProjects } from './core/injections';

consola.wrapConsole();

const __dirname = dirname(new URL(import.meta.url).pathname);
const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const ProjectsFolderName = 'projects';

@Assemblage({
  inject: [
    [
      AbstractCommandService,
      CommandService,
      <CommandServiceConfig>{
        name: pkg.name,
        description: 'Create a new assemblerjs project from a template.',
        usage: `$0 <type> <name> <path>`,
      },
    ],
    [AbstractTemplateParserService, TemplateParserService],
    [AbstractTypePositionalArg, TypePositionalArg],
    [AbstractNamePositionalArg, NamePositionalArg],
    [AbstractPathPositionalArg, PathPositionalArg],

    // Dynamically import and inject all project assemblages
    ...(await injectedProjects(resolve(__dirname, ProjectsFolderName))),
  ],
  use: [
    [
      'env',
      <MainEnv>{
        name: pkg.name,
        version: pkg.version,
        runningPath: process.env.INIT_CWD || process.cwd(),
        projectTypes: fs
          .readdirSync(resolve(__dirname, ProjectsFolderName))
          .filter((dir) =>
            fs
              .statSync(resolve(__dirname, ProjectsFolderName, dir))
              .isDirectory()
          ),
      },
    ],
    ['inquirer', Inquirer],
    ['bootstrapValues', {}],
  ],
})
class App implements AbstractAssemblage {
  constructor(
    @Use('env') public env: MainEnv,
    @Use('inquirer') public inquirer: Inquirer,
    @Use('bootstrapValues') public bootstrapValues: Record<string, any>,
    @Context() public context: AssemblerContext,
    @Definition() public definition: AssemblageDefinition,
    public commandService: AbstractCommandService,
    public templateParserService: AbstractTemplateParserService,
    public typePositionalArg: AbstractTypePositionalArg,
    public namePositionalArg: AbstractNamePositionalArg,
    public pathPositionalArg: AbstractPathPositionalArg
  ) {
    for (const [abstractClass] of this.definition.inject) {
      this.context.require(abstractClass);
    }
  }

  public async create(): Promise<void> {
    await this.commandService
      .positional(this.typePositionalArg.value)
      .positional(this.namePositionalArg.value)
      .positional(this.pathPositionalArg.value)
      .execute(async (args: Record<string, any>) => {
        const { type, name, path } = this.bootstrapValues;

        // Get handler for project's type by its tag
        const projects: AbstractProject[] = this.context.tagged(type);
        if (projects.length === 0) {
          console.error(`No project found for type "${type}".`);
          process.exit(1);
        } else if (projects.length > 1) {
          console.error(
            `Multiple projects found for type "${type}". Please ensure unique tags.`
          );
          process.exit(1);
        }

        const project = projects[0];
        await project.build();
      });
  }
}

const task = Task.of(() => Assembler.build(App));
task
  .fork()
  .then((result: Result<App, Error>) => {
    result.fold(
      (err) => {
        console.error('Failed to create app:', err);
        process.exit(1);
      },
      async (app) => {
        await app.create();
      }
    );
  })
  .catch((err) => {
    console.error('Error during app assemblage:', err);
    process.exit(1);
  });
