import type { components } from "@medlab/api-contracts";

export type WorkspaceData = components["schemas"]["WorkspaceData"];
export type FamilyMemberData = components["schemas"]["FamilyMemberData"];
export type DocumentData = components["schemas"]["DocumentData"];
export type AISummaryData = components["schemas"]["AISummaryData"];
export type AnalyteOption = components["schemas"]["AnalyteOption"];
export type MeasurementTrendPoint = components["schemas"]["MeasurementTrendPoint"];
export type ShareLinkItem = components["schemas"]["ShareLinkItem"];

export const DEMO_WORKSPACE: WorkspaceData = {
  id: "demo-workspace-001",
  name: "Johnson Family Health Vault",
  status: "active",
  createdAt: "2024-01-15T09:00:00Z",
  updatedAt: "2024-01-15T09:00:00Z",
};

export const DEMO_MEMBERS: FamilyMemberData[] = [
  {
    id: "demo-member-alex",
    fullName: "Alex Johnson (You)",
    relationship: "Self",
    dateOfBirth: "1988-04-12",
    notes: "Blood Type: O+ • Allergies: Penicillin • Conditions: Mild Asthma",
    createdAt: "2024-01-15T09:05:00Z",
    updatedAt: "2024-01-15T09:05:00Z",
  },
  {
    id: "demo-member-sarah",
    fullName: "Sarah Johnson",
    relationship: "Spouse",
    dateOfBirth: "1990-08-23",
    notes: "Blood Type: A+ • Allergies: None • Conditions: None",
    createdAt: "2024-01-15T09:10:00Z",
    updatedAt: "2024-01-15T09:10:00Z",
  },
  {
    id: "demo-member-leo",
    fullName: "Leo Johnson",
    relationship: "Child",
    dateOfBirth: "2018-11-05",
    notes: "Blood Type: O+ • Allergies: Peanuts • Conditions: None",
    createdAt: "2024-01-15T09:15:00Z",
    updatedAt: "2024-01-15T09:15:00Z",
  },
];

export const DEMO_DOCUMENTS: DocumentData[] = [
  {
    id: "demo-doc-cmp",
    workspaceId: "demo-workspace-001",
    familyMemberId: "demo-member-alex",
    familyMemberName: "Alex Johnson (You)",
    title: "Comprehensive Metabolic Panel (CMP)",
    category: "lab_result",
    documentDate: "2025-02-20",
    notes: "Quest Diagnostics Labs • Dr. Evelyn Reed, MD. Annual executive health screening panel. Normal kidney function, elevated fasting glucose.",
    createdAt: "2025-02-21T10:30:00Z",
    updatedAt: "2025-02-21T10:30:00Z",
    currentVersion: {
      id: "demo-ver-cmp-1",
      versionNumber: 1,
      originalFilename: "cmp_report_2025.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 245000,
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      isCurrent: true,
      createdAt: "2025-02-21T10:30:00Z",
    },
  },
  {
    id: "demo-doc-lipid",
    workspaceId: "demo-workspace-001",
    familyMemberId: "demo-member-alex",
    familyMemberName: "Alex Johnson (You)",
    title: "Standard Lipid & Cholesterol Panel",
    category: "lab_result",
    documentDate: "2024-09-15",
    notes: "Labcorp Clinical Center • Dr. Evelyn Reed, MD. Fasting lipid profile check. Borderline elevated LDL cholesterol.",
    createdAt: "2024-09-16T14:15:00Z",
    updatedAt: "2024-09-16T14:15:00Z",
    currentVersion: {
      id: "demo-ver-lipid-1",
      versionNumber: 1,
      originalFilename: "lipid_profile_2024.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 182000,
      sha256: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
      isCurrent: true,
      createdAt: "2024-09-16T14:15:00Z",
    },
  },
  {
    id: "demo-doc-mri",
    workspaceId: "demo-workspace-001",
    familyMemberId: "demo-member-sarah",
    familyMemberName: "Sarah Johnson",
    title: "Brain & Cervical Spine MRI with Contrast",
    category: "imaging",
    documentDate: "2024-11-12",
    notes: "Advanced Medical Imaging Associates • Dr. Marcus Vance, Neurologist. Follow-up imaging for tension headaches. Report confirms normal ventricles.",
    createdAt: "2024-11-13T11:00:00Z",
    updatedAt: "2024-11-13T11:00:00Z",
    currentVersion: {
      id: "demo-ver-mri-1",
      versionNumber: 1,
      originalFilename: "brain_mri_scan_2024.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 840000,
      sha256: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
      isCurrent: true,
      createdAt: "2024-11-13T11:00:00Z",
    },
  },
];

export const DEMO_SUMMARY: AISummaryData = {
  id: "demo-summary-001",
  documentVersionId: "demo-ver-cmp-1",
  status: "completed",
  summaryText:
    "This Comprehensive Metabolic Panel evaluates your body's fluid balance, electrolyte levels, kidney function, and blood sugar. Overall, 12 out of 14 indicators are within standard clinical reference intervals.\n\nKey Findings:\n• Fasting Blood Glucose was reported at 108 mg/dL (standard target range: 70–99 mg/dL). This is mildly elevated and suggests borderline prediabetes, which warrants follow-up dietary review with your physician.\n• Kidney and liver markers (eGFR, Creatinine, BUN, ALT, AST) are completely healthy and unremarkable.\n• Electrolytes (Sodium, Potassium, Chloride, CO2) show normal hydration and acid-base equilibrium.",
  provider: "openrouter",
  model: "google/gemini-2.0-flash-001",
  promptVersion: "1.0",
  citations: [
    {
      sourceName: "American Diabetes Association (ADA)",
      guidelineTitle: "Standards of Medical Care in Diabetes — Diagnostic Classification",
      publicationYear: 2024,
      referenceUrl: "https://diabetes.org",
      citationSummary: "Fasting plasma glucose between 100–125 mg/dL is categorized as impaired fasting glucose (prediabetes).",
    },
    {
      sourceName: "National Kidney Foundation (NKF)",
      guidelineTitle: "Clinical Practice Guideline for the Evaluation and Management of eGFR",
      publicationYear: 2023,
      referenceUrl: "https://kidney.org",
      citationSummary: "eGFR above 90 mL/min/1.73m2 represents preserved normal kidney filtration.",
    },
  ],
  createdAt: "2025-02-21T10:35:00Z",
  updatedAt: "2025-02-21T10:35:00Z",
};

export const DEMO_ANALYTE_OPTIONS: AnalyteOption[] = [
  {
    normalizedTestKey: "fasting_glucose",
    displayName: "Fasting Blood Glucose",
    count: 3,
    latestMeasuredOn: "2025-02-20",
    latestValue: 108,
    latestUnit: "mg/dL",
    latestFlag: "high",
  },
  {
    normalizedTestKey: "total_cholesterol",
    displayName: "Total Cholesterol",
    count: 3,
    latestMeasuredOn: "2025-02-20",
    latestValue: 215,
    latestUnit: "mg/dL",
    latestFlag: "high",
  },
  {
    normalizedTestKey: "ldl_cholesterol",
    displayName: "LDL Cholesterol",
    count: 3,
    latestMeasuredOn: "2025-02-20",
    latestValue: 132,
    latestUnit: "mg/dL",
    latestFlag: "high",
  },
  {
    normalizedTestKey: "tsh",
    displayName: "TSH (Thyroid)",
    count: 2,
    latestMeasuredOn: "2025-02-20",
    latestValue: 2.1,
    latestUnit: "mIU/L",
    latestFlag: "normal",
  },
];

export const DEMO_GLUCOSE_TRENDS: MeasurementTrendPoint[] = [
  {
    date: "2024-03-10",
    value: 92,
    unit: "mg/dL",
    referenceLow: 70,
    referenceHigh: 99,
    flag: "normal",
    documentId: "demo-doc-cmp",
    documentTitle: "Annual Checkup CMP",
  },
  {
    date: "2024-09-15",
    value: 99,
    unit: "mg/dL",
    referenceLow: 70,
    referenceHigh: 99,
    flag: "normal",
    documentId: "demo-doc-cmp",
    documentTitle: "Mid-Year Lab Work",
  },
  {
    date: "2025-02-20",
    value: 108,
    unit: "mg/dL",
    referenceLow: 70,
    referenceHigh: 99,
    flag: "high",
    documentId: "demo-doc-cmp",
    documentTitle: "Comprehensive Metabolic Panel (CMP)",
  },
];

export const DEMO_SHARES: ShareLinkItem[] = [
  {
    id: "demo-share-001",
    documentId: "demo-doc-cmp",
    documentTitle: "Comprehensive Metabolic Panel (CMP)",
    versionNumber: 1,
    expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    includeOriginal: true,
    includeSummary: true,
    isExpired: false,
    isRevoked: false,
    revokedAt: null,
    createdAt: new Date().toISOString(),
  },
];
