/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import type {TestContext} from '@jest/test-result';
import type {DependencyResolver} from 'jest-resolve-dependencies';

interface WorkspaceProject {
  name: string | null;
  rootDir: string;
  context: TestContext;
  dependencyResolver: DependencyResolver;
}

function normalizePosix(filePath: string) {
  return filePath.replace(/\\/g, '/');
}

export class WorkspaceDependencyResolver {
  private projects: Array<WorkspaceProject> = [];

  addProject(
    context: TestContext,
    dependencyResolver: DependencyResolver,
  ): void {
    let packageName: string | null = null;
    const pkgJsonPath = path.join(context.config.rootDir, 'package.json');

    try {
      const pkgJson = require(pkgJsonPath);
      packageName = pkgJson.name || null;
    } catch {
      // No package.json or error reading it
    }

    this.projects.push({
      context,
      dependencyResolver,
      name: packageName,
      rootDir: path.resolve(context.config.rootDir),
    });
  }

  findFilesInProjectDependingOnChangedPaths(
    targetContext: TestContext,
    changedPaths: Set<string>,
  ): Set<string> {
    const changedPathsArray = [...changedPaths].map(p => path.resolve(p));
    const filesInProject = new Set<string>();

    const targetProject = this.projects.find(p => p.context === targetContext);

    if (!targetProject) {
      return filesInProject;
    }

    const otherProjects = this.projects.filter(p => p !== targetProject);
    const otherProjectsByRoot = new Map<string, WorkspaceProject>();

    for (const project of otherProjects) {
      if (project.name) {
        otherProjectsByRoot.set(project.rootDir, project);
      }
    }

    for (const file of targetContext.hasteFS.getAbsoluteFileIterator()) {
      const rawDependencies = targetContext.hasteFS.getDependencies(file);
      if (!rawDependencies) {
        continue;
      }

      const resolvedDependencies = targetProject.dependencyResolver.resolve(
        file,
        {skipNodeResolution: targetContext.config.skipNodeResolution},
      );

      // Check if this file depends on any changed file directly
      for (const changedPath of changedPathsArray) {
        if (resolvedDependencies.includes(changedPath)) {
          filesInProject.add(file);
          break;
        }
      }

      // Check if this file imports from packages in other projects that have changes
      if (!filesInProject.has(file)) {
        for (const rawDep of rawDependencies) {
          for (const [projectRoot, project] of otherProjectsByRoot) {
            if (
              project.name &&
              (rawDep === project.name || rawDep.startsWith(`${project.name}/`))
            ) {
              // Check if any changed path is in this project
              for (const changedPath of changedPathsArray) {
                const normalizedChangedPath = normalizePosix(changedPath);
                const normalizedProjectRoot = normalizePosix(projectRoot);
                if (
                  normalizedChangedPath.startsWith(
                    `${normalizedProjectRoot}/`,
                  ) ||
                  normalizedChangedPath === normalizedProjectRoot
                ) {
                  filesInProject.add(file);
                  break;
                }
              }
            }
          }
        }
      }
    }

    return filesInProject;
  }
}
