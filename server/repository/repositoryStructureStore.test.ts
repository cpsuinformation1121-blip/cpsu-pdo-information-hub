import { describe, expect, it } from 'vitest'
import type { ManagedSection } from '../../src/contracts/repositoryStructure.ts'
import {
  applyRequiredStructureMigrations,
  assertRepositorySectionCanBeDeleted,
  createRepositoryStructureWriteCommand,
  RepositoryStructureNotEmptyError,
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

  it('preserves administrator-managed categories in an existing Forms section', () => {
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
        ],
      },
    ])
  })

  it('does not recreate Excel after deleting it from Forms and reloading', () => {
    const stored: ManagedSection[] = [{ id: 'forms', title: 'Forms', categories: [] }]
    const firstRead = applyRequiredStructureMigrations(stored)
    expect(firstRead).toEqual(stored)
    expect(applyRequiredStructureMigrations(firstRead)).toEqual(stored)
    expect(stored[0].categories).toEqual([])
  })

  it('keeps an existing renamed Excel category unchanged', () => {
    const stored: ManagedSection[] = [{ id: 'forms', title: 'Forms', categories: [{ id: 'excel', title: 'Office Templates' }] }]
    expect(applyRequiredStructureMigrations(stored)).toEqual(stored)
  })
})


describe('nonempty structure deletion feedback', () => {
  it('directs administrators to move or delete resources before removing a category', () => {
    expect(new RepositoryStructureNotEmptyError('category').message).toBe(
      'This category contains resources. Move or delete them in Resources before deleting the category.',
    )
  })

  it('explains that sections must be cleared before deletion', () => {
    expect(new RepositoryStructureNotEmptyError('section').message).toBe(
      'This section contains categories or resources. Remove them before deleting the section.',
    )
  })
})
