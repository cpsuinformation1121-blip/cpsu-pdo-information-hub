import { describe, expect, it } from 'vitest'
import { InvalidResourceObjectKeyError, parseResourceObjectKey } from './parseResourceObjectKey'

describe('parseResourceObjectKey', () => {
  it('derives repository metadata from a configured object key', () => {
    expect(
      parseResourceObjectKey(
        'statistical-profile/student-population/2026/student-population-2026.xlsx',
      ),
    ).toEqual({
      key: 'statistical-profile/student-population/2026/student-population-2026.xlsx',
      filename: 'student-population-2026.xlsx',
      displayName: 'Student population 2026',
      sectionId: 'statistical-profile',
      categoryId: 'student-population',
      categoryPath: ['student-population'],
      year: 2026,
      extension: 'xlsx',
      fileType: 'xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
  })

  it('preserves an optional nested category hierarchy', () => {
    const parsed = parseResourceObjectKey(
      'higher-education-performance/accreditation/undergraduate/2026/accreditation-report-2026.pdf',
    )

    expect(parsed.categoryId).toBe('accreditation')
    expect(parsed.categoryPath).toEqual(['accreditation', 'undergraduate'])
    expect(parsed.fileType).toBe('pdf')
    expect(parsed.mimeType).toBe('application/pdf')
  })

  it('parses a file stored directly in a section', () => {
    const parsed = parseResourceObjectKey('planning-documents/2025-2026/Annual Report.pdf')
    expect(parsed.categoryId).toBeUndefined()
    expect(parsed.categoryPath).toEqual([])
    expect(parsed.year).toBe('2025-2026')
  })

  it('treats excel as the Forms category while preserving the PDF file type', () => {
    const parsed = parseResourceObjectKey(
      'forms/excel/2027-2028/MIS DPCR Evaluation Summary.pdf',
    )

    expect(parsed.sectionId).toBe('forms')
    expect(parsed.categoryId).toBe('excel')
    expect(parsed.year).toBe('2027-2028')
    expect(parsed.fileType).toBe('pdf')
    expect(parsed.mimeType).toBe('application/pdf')
  })

  it.each([
    'statistical-profile/student-population/2026/photo.jpg',
    'statistical-profile/student-population/2026/photo.jpeg',
    'statistical-profile/student-population/2026/photo.png',
    'statistical-profile/student-population/2026/photo.webp',
  ])('recognizes supported image keys: %s', (key) => {
    const parsed = parseResourceObjectKey(key)
    expect(parsed.fileType).toBe('image')
    expect(parsed.mimeType).toMatch(/^image\//u)
  })

  it.each([
    '../statistical-profile/student-population/2026/report.pdf',
    '/statistical-profile/student-population/2026/report.pdf',
    'statistical-profile/unknown-category/2026/report.pdf',
    'statistical-profile/student-population/not-a-year/report.pdf',
    'statistical-profile/student-population/2026/report.docx',
    'statistical-profile//2026/report.pdf',
  ])('rejects malformed or unsupported keys: %s', (key) => {
    expect(() => parseResourceObjectKey(key)).toThrow(InvalidResourceObjectKeyError)
  })
})
