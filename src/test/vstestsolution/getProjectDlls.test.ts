import * as fse from 'fs-extra'
import * as os from 'os'
import * as path from 'path'
import {setInput} from '../../helpers'
import {getProjectDlls} from './getProjectDlls'

describe('getProjectDlls', () => {
  let solnFolder: string

  function createDll(
    configuration: 'Debug' | 'Release',
    projectFolderName: string
  ): {projectFolderPath: string; dllPath: string} {
    const projectFolderPath = path.join(solnFolder, projectFolderName)
    const dllPath = path.join(
      projectFolderPath,
      'bin',
      configuration,
      `${projectFolderName}.dll`
    )
    fse.ensureFileSync(dllPath)
    return {projectFolderPath, dllPath}
  }

  function createMultiTargetDll(
    configuration: 'Debug' | 'Release',
    projectFolderName: string,
    target: string
  ): {projectFolderPath: string; dllPath: string} {
    const projectFolderPath = path.join(solnFolder, projectFolderName)
    const dllPath = path.join(
      projectFolderPath,
      'bin',
      configuration,
      target,
      `${projectFolderName}.dll`
    )
    fse.ensureFileSync(dllPath)
    return {projectFolderPath, dllPath}
  }

  beforeEach(() => {
    solnFolder = fse.mkdtempSync(path.join(os.tmpdir(), 'solnfolder-'))
  })

  it('should throw for unsupported configuration', () => {
    setInput('configuration', 'unsupported')
    expect(() => getProjectDlls([{name: 'Test1', path: solnFolder}])).toThrow(
      'unsupported configuration input'
    )
  })

  describe('should find the projectname.dll in bin by default', () => {
    beforeEach(() => {
      setInput('configuration', '')
    })

    it('should find in Release first', () => {
      const details = createDll('Release', 'Test1')
      createDll('Debug', 'Test1')
      const projectDlls = getProjectDlls([
        {name: 'Test1', path: details.projectFolderPath}
      ])
      expect(projectDlls[0]).toBe(details.dllPath)
    })

    it('should find in Debug if not in Release', () => {
      const details = createDll('Debug', 'Test1')
      const projectDlls = getProjectDlls([
        {name: 'Test1', path: details.projectFolderPath}
      ])
      expect(projectDlls[0]).toBe(details.dllPath)
    })

    it('should throw if in neither', () => {
      expect(() =>
        getProjectDlls([{name: 'Test1', path: solnFolder}])
      ).toThrow()
    })

    it('should find multiple when multi-targeted', () => {
      const net6Details = createMultiTargetDll(
        'Release',
        'Test1',
        'net6.0-windows'
      )
      const netFwDetails = createMultiTargetDll('Release', 'Test1', 'net472')

      const projectDlls = getProjectDlls([
        {name: 'Test1', path: net6Details.projectFolderPath}
      ])

      expect(projectDlls).toHaveLength(2)
      expect(projectDlls).toContain(net6Details.dllPath)
      expect(projectDlls).toContain(netFwDetails.dllPath)
    })
  })

  describe('Release configuration', () => {
    beforeEach(() => {
      setInput('configuration', 'Release')
    })

    it('should find in Release', () => {
      const details = createDll('Release', 'Test1')
      createDll('Debug', 'Test1')
      const projectDlls = getProjectDlls([
        {name: 'Test1', path: details.projectFolderPath}
      ])
      expect(projectDlls[0]).toBe(details.dllPath)
    })

    it('should throw if not in Release (and is in Debug)', () => {
      const details = createDll('Debug', 'Test1')
      expect(() =>
        getProjectDlls([{name: 'Test1', path: details.projectFolderPath}])
      ).toThrow()
    })
  })

  describe('Debug configuration', () => {
    beforeEach(() => {
      setInput('configuration', 'Debug')
    })

    it('should find in Debug', () => {
      createDll('Release', 'Test1')
      const details = createDll('Debug', 'Test1')
      const projectDlls = getProjectDlls([
        {name: 'Test1', path: details.projectFolderPath}
      ])
      expect(projectDlls[0]).toBe(details.dllPath)
    })

    it('should throw if not in Debug (and is in Release)', () => {
      const details = createDll('Release', 'Test1')
      expect(() =>
        getProjectDlls([{name: 'Test1', path: details.projectFolderPath}])
      ).toThrow()
    })
  })

  afterEach(() => {
    fse.remove(solnFolder)
  })
})
