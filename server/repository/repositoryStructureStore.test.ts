import { describe, expect, it } from 'vitest'
import type { ManagedSection } from '../../src/contracts/repositoryStructure.ts'
import {
  applyRequiredStructureMigrations,
  assertRepositorySectionCanBeDeleted,
  createRepositoryStructureWriteCommand,
} from './repositoryStructureStore.ts'

const data: ManagedSection[] = [{ id: 'reports', title: 'Reports', categories: [] }]

describe('repository structure conditional writes', () => {
  it('requires the current ETag when updating an existing structure', () => {
    const command = createRepositoryStructureWriteCommand('bucket', data, '"revision-1"')
    expect(command.input.IfMatch).toBe('"revision-1"')
    expect(command.input.IfNoneMatch).toBeUndefined()
  })

  it('creates the initial structure only when it does not already exist', () => {
    const command = createRepositoryStructureWriteCommand('bucket', data, null)
    expect(command.input.IfNoneMatch).toBe('*')
    expect(command.input.IfMatch).toBeUndefined()
  })
})

describe('protected repository sections', () => {
  it('rejects deletion of the Forms section', () => {
    expect(() => assertRepositorySectionCanBeDeleted('forms')).toThrow(
      'This required repository section cannot be deleted.',
    )
  })

  it('allows deletion checks for administrator-managed sections', () => {
    expect(() => assertRepositorySectionCanBeDeleted('temporary')).not.toThrow()
  })
})

describe('required repository structure migrations', () => {
  it('adds Forms to repository structures saved by older deployments', () => {
    const migrated = applyRequiredStructureMigrations([
      { id: 'other-resources', title: 'Other Resources', categories: [] },
    ])

    expect(migrated).toEqual([
      { id: 'other-resources', title: 'Other Resources', categories: [] },
      {
        id: 'forms',
        title: 'Forms',
        categories: [{ id: 'excel', title: 'Excel' }],
      },
    ])
  })

  it('preserves an existing Forms section and adds its required category', () => {
    const existing = [
      {
        id: 'forms',
        title: 'Office Forms',
        categories: [{ id: 'requests', title: 'Request Forms' }],
      },
    ]

    expect(applyRequiredStructureMigrations(existing)).toEqual([
      {
        id: 'forms',
        title: 'Office Forms',
        categories: [
          { id: 'requests', title: 'Request Forms' },
          { id: 'excel', title: 'Excel' },
        ],
      },
    ])
  })
})
