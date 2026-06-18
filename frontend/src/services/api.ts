import axios from 'axios';
import type {
  Project, DocumentationJob, GeneratedDocument,
  HealthResponse, UploadFileResponse, UploadZipResponse,
  GitHubImportResponse,
} from '../types';

const BASE = '/api/v1';

const client = axios.create({ baseURL: BASE });

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.detail ?? err.message ?? 'Unknown error';
    return Promise.reject(new Error(message));
  }
);

// Health
export const fetchHealth = (): Promise<HealthResponse> =>
  client.get('/health').then((r) => r.data);

// Upload
export const uploadFile = (file: File): Promise<UploadFileResponse> => {
  const form = new FormData();
  form.append('file', file);
  return client.post('/upload/file', form).then((r) => r.data);
};

export const uploadZip = (file: File): Promise<UploadZipResponse> => {
  const form = new FormData();
  form.append('file', file);
  return client.post('/upload/zip', form).then((r) => r.data);
};

export const importGitHub = (url: string): Promise<GitHubImportResponse> =>
  client.post('/upload/github', { url }).then((r) => r.data);

// Projects
export const fetchProjects = (): Promise<Project[]> =>
  client.get('/documentation/projects').then((r) => r.data);

export const deleteProject = (projectId: string): Promise<void> =>
  client.delete(`/documentation/projects/${projectId}`).then(() => undefined);

// Documentation generation
export const generateDocumentation = (
  projectId: string,
  docTypes: string[]
): Promise<DocumentationJob> =>
  client.post('/documentation/generate', { project_id: projectId, doc_types: docTypes }).then((r) => r.data);

export const fetchJob = (jobId: string): Promise<DocumentationJob> =>
  client.get(`/documentation/jobs/${jobId}`).then((r) => r.data);

// Documents
export const fetchDocuments = (projectId: string): Promise<GeneratedDocument[]> =>
  client.get(`/documentation/projects/${projectId}/documents`).then((r) => r.data);

export const fetchDocument = (docId: string): Promise<GeneratedDocument> =>
  client.get(`/documentation/documents/${docId}`).then((r) => r.data);

export const deleteDocument = (docId: string): Promise<void> =>
  client.delete(`/documentation/documents/${docId}`).then(() => undefined);

// Exports — these return download URLs
export const getProjectPdfUrl = (projectId: string) => `${BASE}/export/project/${projectId}/pdf`;
export const getProjectDocxUrl = (projectId: string) => `${BASE}/export/project/${projectId}/docx`;
export const getDocPdfUrl = (docId: string) => `${BASE}/export/document/${docId}/pdf`;
export const getDocDocxUrl = (docId: string) => `${BASE}/export/document/${docId}/docx`;
