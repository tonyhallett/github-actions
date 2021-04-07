declare module 'vs-parse' {
  export interface ParsedSolution {
    projects: {
      name: string
      relativePath: string
    }[]
  }
  export function parseSolution(solutionFile: string): Promise<ParsedSolution>
}
