export type SourceType = 'file' | 'zip' | 'github';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type DocType = 'readme' | 'api' | 'functions' | 'classes' | 'inline' | 'uml' | 'full';

export interface Project {
  id: string;
  name: string;
  source_type: SourceType;
  github_url?: string;
  language_stats?: Record<string, number>;
  file_count?: number;
  created_at?: string;
}

export interface DocumentationJob {
  job_id: string;
  project_id: string;
  status: JobStatus;
  doc_types: string[];
  created_at?: string;
  completed_at?: string;
  error_message?: string;
  document_count: number;
}

export interface GeneratedDocument {
  id: string;
  project_id: string;
  job_id: string;
  doc_type: string;
  title: string;
  content: string;
  mermaid_diagram?: string;
  created_at?: string;
}

export interface OllamaHealth {
  connected: boolean;
  models: string[];
}

export interface HealthResponse {
  status: string;
  app: string;
  ollama: OllamaHealth;
}

export interface UploadFileResponse {
  project_id: string;
  name: string;
  file_count: number;
}

export interface UploadZipResponse {
  project_id: string;
  name: string;
}

export interface GitHubImportResponse {
  project_id: string;
  name: string;
  github_metadata: {
    name: string;
    full_name: string;
    description: string;
    language: string;
    stars: number;
    default_branch: string;
  };
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}
