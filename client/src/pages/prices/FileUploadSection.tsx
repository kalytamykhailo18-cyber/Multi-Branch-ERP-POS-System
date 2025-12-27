import React from 'react';
import { Button, Input } from '../../components/ui';

interface FileUploadSectionProps {
  selectedFile: File | null;
  selectedSupplier: string;
  marginPercent: string;
  roundingRule: string;
  loading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSupplierChange: (value: string) => void;
  onMarginChange: (value: string) => void;
  onRoundingChange: (value: string) => void;
  onProcessFile: () => void;
}

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  selectedFile,
  selectedSupplier,
  marginPercent,
  roundingRule,
  loading,
  fileInputRef,
  onFileSelect,
  onSupplierChange,
  onMarginChange,
  onRoundingChange,
  onProcessFile,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* File Upload */}
      <div className="animate-fade-left duration-normal">
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-sm p-8 text-center cursor-pointer
            transition-colors duration-200
            ${selectedFile
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.xls,.xlsx,.csv"
            onChange={onFileSelect}
            className="hidden"
          />

          {selectedFile ? (
            <>
              <svg className="w-12 h-12 mx-auto text-primary-500 mb-4 animate-zoom-in duration-fast" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="font-medium text-gray-900 dark:text-white animate-fade-up duration-fast">
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500 mt-1 animate-fade-up duration-normal">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
              <p className="text-sm text-primary-500 mt-2 animate-fade-up duration-light-slow">
                Click para cambiar archivo
              </p>
            </>
          ) : (
            <>
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4 animate-fade-down duration-fast" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="font-medium text-gray-900 dark:text-white animate-fade-up duration-normal">
                Arrastra un archivo o haz click para seleccionar
              </p>
              <p className="text-sm text-gray-500 mt-1 animate-fade-up duration-light-slow">
                PDF, Excel o CSV
              </p>
            </>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-4 animate-fade-right duration-normal">
        <div className="animate-fade-up duration-fast">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Proveedor (opcional)
          </label>
          <select
            value={selectedSupplier}
            onChange={(e) => onSupplierChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700"
          >
            <option value="">Detectar automáticamente</option>
            <option value="sup1">Proveedor 1</option>
            <option value="sup2">Proveedor 2</option>
          </select>
        </div>

        <div className="animate-fade-up duration-normal">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Margen de ganancia %
          </label>
          <Input
            type="number"
            value={marginPercent}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onMarginChange(e.target.value)}
            min="0"
            max="200"
          />
        </div>

        <div className="animate-fade-up duration-light-slow">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Regla de redondeo
          </label>
          <select
            value={roundingRule}
            onChange={(e) => onRoundingChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700"
          >
            <option value="none">Sin redondeo</option>
            <option value="nearest_10">Redondear a $10</option>
            <option value="nearest_50">Redondear a $50</option>
            <option value="nearest_100">Redondear a $100</option>
            <option value="up_10">Redondear hacia arriba a $10</option>
            <option value="down_10">Redondear hacia abajo a $10</option>
          </select>
        </div>

        <Button
          variant="primary"
          fullWidth
          onClick={onProcessFile}
          disabled={!selectedFile}
          loading={loading}
          className="animate-flip-up duration-slow"
        >
          Procesar Archivo
        </Button>
      </div>
    </div>
  );
};
