import { useState, useCallback, useRef, useEffect } from 'react';
import * as api from '../services/api';
import type { Project, DocumentationJob, GeneratedDocument } from '../types';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchProjects();
      setProjects(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (projectId: string) => {
    await api.deleteProject(projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  }, []);

  return { projects, loading, error, load, remove };
}

export function useDocuments(projectId: string | null) {
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchDocuments(projectId);
      setDocuments(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const remove = useCallback(async (docId: string) => {
    await api.deleteDocument(docId);
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  }, []);

  return { documents, loading, error, load, remove };
}

export function useJobPoller() {
  const [job, setJob] = useState<DocumentationJob | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const poll = useCallback(
    (jobId: string, onComplete: (j: DocumentationJob) => void, onError: (msg: string) => void) => {
      stop();
      intervalRef.current = setInterval(async () => {
        try {
          const j = await api.fetchJob(jobId);
          setJob(j);
          if (j.status === 'completed') {
            stop();
            onComplete(j);
          } else if (j.status === 'failed') {
            stop();
            onError(j.error_message ?? 'Documentation generation failed');
          }
        } catch (err) {
          stop();
          onError((err as Error).message);
        }
      }, 2000);
    },
    [stop]
  );

  useEffect(() => stop, [stop]);

  return { job, poll, stop };
}
