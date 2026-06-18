import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Button from '../Common/Button';
import { uploadZip } from '../../services/api';
import type { UploadZipResponse } from '../../types';

interface ZipUploaderProps {
  onSuccess: (result: UploadZipResponse) => void;
  onError: (msg: string) => void;
}

export default function ZipUploader({ onSuccess, onError }: ZipUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'application/zip': ['.zip'] },
    maxSize: 50 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const result = await uploadZip(file);
      onSuccess(result);
      setFile(null);
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-caramel-500 bg-caramel-50 dark:bg-caramel-950/20 scale-[1.02]'
            : 'border-cream-400 dark:border-chocolate-600 hover:border-caramel-400 dark:hover:border-caramel-600 hover:bg-cream-200/50 dark:hover:bg-chocolate-800/30'
        }`}
      >
        <input {...getInputProps()} />
        <div className={`text-5xl mb-3 transition-transform duration-200 ${isDragActive ? 'animate-float' : ''}`}>
          🗜️
        </div>
        <p className="text-sm font-medium text-chocolate-600 dark:text-cream-300">
          {isDragActive ? 'Drop the ZIP here!' : 'Drag a ZIP archive here, or click to browse'}
        </p>
        <p className="text-xs text-chocolate-400 dark:text-cream-500 mt-2">
          Max 50 MB — all source files inside will be analyzed
        </p>
      </div>

      {file && (
        <div className="flex items-center gap-3 p-3 bg-caramel-50 dark:bg-caramel-950/20 border border-caramel-200 dark:border-caramel-800 rounded-xl animate-scale-in">
          <span className="text-2xl">🗜️</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-chocolate-700 dark:text-cream-200 truncate">{file.name}</p>
            <p className="text-xs text-chocolate-400 dark:text-cream-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
          <button onClick={() => setFile(null)} className="text-chocolate-400 hover:text-strawberry-600 transition-colors">✕</button>
        </div>
      )}

      <Button onClick={handleUpload} disabled={!file} loading={loading} className="w-full justify-center">
        Extract and Upload
      </Button>
    </div>
  );
}
