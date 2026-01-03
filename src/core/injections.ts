import { resolve } from 'node:path';
import fs from 'node:fs';

export const injectedProjects = async (
  projectsFolder: string
): Promise<any[]> => {
  const result = await Promise.all(
    fs
      .readdirSync(projectsFolder)
      .filter((dir) => fs.statSync(resolve(projectsFolder, dir)).isDirectory())
      .map(async (dir) => {
        const indexPath = resolve(
          projectsFolder,
          dir,
          process.env.NODE_ENV === 'development' ? 'index.ts' : 'index.js'
        );

        if (fs.existsSync(indexPath)) {
          const moduleImport = await import(indexPath);
          return Object.values(moduleImport)
            .filter(
              (exp: any) => exp && typeof exp === 'function' && exp.prototype
            )
            .map((exp: any) => [exp]);
        }
        return [];
      })
  );

  return result.flat() as any[];
};
