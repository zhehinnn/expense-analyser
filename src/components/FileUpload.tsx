import React, { useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  onLoadDemo: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading, onLoadDemo }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type === 'application/pdf') {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300
          ${isLoading
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'
          }
        `}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            <p className="text-lg font-medium text-blue-700">Parsing your statement...</p>
            <p className="text-sm text-gray-500">Extracting transactions from PDF</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-700">
                Drop your Public Bank statement here
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or click to browse files
              </p>
            </div>
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200">
                <FileText className="w-4 h-4" />
                Select PDF File
              </span>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-400 mt-2">
              Supports Public Bank account statements in PDF format
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={onLoadDemo}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-300 rounded-lg transition-all hover:bg-blue-50"
        >
          <FileText className="w-4 h-4" />
          Load Demo Data
        </button>
        <p className="text-xs text-gray-400 mt-2">
          Try the app with sample transaction data
        </p>
      </div>
    </div>
  );
};
