import * as Inquirer from 'inquirer';

declare global {
  interface MainEnv {
    name: string;
    version: string;
    runningPath: string;
    projectTypes: string[];
  }

  type Inquirer = typeof Inquirer.default;
}

export {};
