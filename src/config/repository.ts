import type { RepositorySectionId } from "../contracts/resource.ts";

export type RepositoryCategory = {
  id: string;
  title: string;
};

export type RepositorySection = {
  id: RepositorySectionId;
  code: string;
  title: string;
  description: string;
  path: string;
  categories: readonly RepositoryCategory[];
};

export const repositorySections: readonly RepositorySection[] = [
  {
    id: "statistical-profile",
    code: "A",
    title: "Statistical Profile",
    description:
      "Institutional population, student profile, and human resource records.",
    path: "/repository?section=statistical-profile",
    categories: [
      { id: "student-population", title: "Student Population" },
      { id: "student-profile", title: "Student Profile" },
      { id: "human-resources", title: "Human Resources" },
      { id: "faculty-to-student-ratio", title: "Faculty-to-Student Ratio" },
    ],
  },
  {
    id: "higher-education-performance",
    code: "B",
    title: "Higher Education Performance",
    description:
      "Program compliance, accreditation, licensure, and employability records.",
    path: "/repository?section=higher-education-performance",
    categories: [
      {
        id: "certificate-of-program-compliance",
        title: "Certificate of Program Compliance",
      },
      { id: "accreditation", title: "Accreditation" },
      {
        id: "licensure-examination-performance",
        title: "Licensure Examination Performance",
      },
      { id: "graduate-employability", title: "Graduate Employability" },
    ],
  },
  {
    id: "research-extension",
    code: "C",
    title: "Research & Extension",
    description: "Research and extension resources maintained by the office.",
    path: "/repository?section=research-extension",
    categories: [
      { id: "research", title: "Research" },
      { id: "extension", title: "Extension" },
    ],
  },
  {
    id: "financial-performance",
    code: "D",
    title: "Financial Performance",
    description:
      "Budget, annual financial, and supporting performance records.",
    path: "/repository?section=financial-performance",
    categories: [
      { id: "financial-performance", title: "Financial Performance" },
    ],
  },
  {
    id: "planning-documents",
    code: "E",
    title: "Planning Documents",
    description: "Institutional plans and related planning records.",
    path: "/repository?section=planning-documents",
    categories: [{ id: "planning-documents", title: "Planning Documents" }],
  },
  {
    id: "other-resources",
    code: "F",
    title: "Other Resources",
    description: "Other published resources maintained by the office.",
    path: "/repository?section=other-resources",
    categories: [{ id: "other-resources", title: "Other Resources" }],
  },
  {
    id: "forms",
    code: "G",
    title: "Forms",
    description: "Official downloadable forms maintained by the office.",
    path: "/repository?section=forms",
    categories: [{ id: "excel", title: "Excel" }],
  },
];

export const protectedRepositorySectionIds = new Set<RepositorySectionId>([
  "forms",
]);

export const repositorySectionById = new Map(
  repositorySections.map((section) => [section.id, section]),
);

export const repositoryCategoryIds = new Set(
  repositorySections.flatMap((section) =>
    section.categories.map((category) => category.id),
  ),
);

export const repositoryCategoryById = new Map(
  repositorySections.flatMap((section) =>
    section.categories.map(
      (category) =>
        [category.id, { ...category, sectionId: section.id }] as const,
    ),
  ),
);
