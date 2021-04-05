This contains github actions code to be used in github actions as well as notes on github actions.
The actions have their own repositories solely due to the requirement for one action per repository for the
marketplace.
For typescript actions there is a [repo template](https://github.com/actions/typescript-action), note that this
is for single action repositories.
This template can be amended if you want a multi action repository.
A multi action repository has a folder for each action containing a single action.yaml file with runs: main: the built script file.

Below is a script file that facilitates building with ncc in a repository with a naming convention.
Every action folder should have a corresponding typescript file in src.

```
/* eslint-disable no-console */
import * as path from 'path'
import * as fs from 'fs'
import {exec} from 'child_process'

function getRootDirectory(): string {
  const scriptsDirectory = __dirname
  return getParentDirectory(scriptsDirectory)
}

function getSourceDirectory(): string {
  return path.join(getRootDirectory(), 'src')
}

function getSourceFiles(): string[] {
  const sourceDirectory = getSourceDirectory()
  return readDirSyncOfType(sourceDirectory, true)
}

function readDirSyncFullPath(directory: string): string[] {
  return fs.readdirSync(directory).map(fe => path.join(directory, fe))
}

function readDirSyncOfType(directory: string, files: boolean): string[] {
  const fileEntries = readDirSyncFullPath(directory)
  return fileEntries.filter(fe => {
    const isDirectory = fs.statSync(fe).isDirectory()
    return files ? !isDirectory : isDirectory
  })
}

function dirName(dir: string): string {
  return dir.split(path.sep).pop() as string
}

function getParentDirectory(dir: string): string {
  const parts = dir.split(path.sep)
  parts.pop()
  return parts.join(path.sep)
}

function nccBuildMultipleActionsByNamingConvention(): void {
  const sourceFiles = getSourceFiles()
  const possibleActionDirectories = readDirSyncOfType(
    getRootDirectory(),
    false
  ).map(d => dirName(d))
  for (const sourceFile of sourceFiles) {
    const matchingActionDirectoryName = path.basename(sourceFile, '.ts')
    if (
      possibleActionDirectories.some(d => d === matchingActionDirectoryName)
    ) {
      nccBuild(sourceFile)
    }
  }
}

function nccBuild(tsFile: string): void {
  console.log(`ncc building ${tsFile}`)
  const distFolder = path.basename(tsFile, '.ts')
  exec(
    `npm run nccSingle -- build ${tsFile} --source-map --license licenses.txt --out dist/${distFolder}`,
    {cwd: getSourceDirectory()},
    (err, stdout, stderr) => {
      if (err) {
        console.log(stderr)
      } else {
        console.log(stdout)
      }
    }
  )
}

nccBuildMultipleActionsByNamingConvention()

```
Amend the scripts key in package.json
```
"scripts": {
    "build": "tsc",
    "format": "prettier --write **/*.ts",
    "format-check": "prettier --check **/*.ts",
    "lint": "eslint src/**/*.ts",
    "test": "jest",
    "all": "npm run format && npm run lint && npm run package && npm test && npm run nccBuild",
    "nccBuild": "ts-node scripts/nccBuild.ts",
    "nccSingle": "ncc"
  },
```

