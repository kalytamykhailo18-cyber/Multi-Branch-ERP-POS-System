import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  uploadPriceFile,
  loadBatchItems,
  applyPrices,
  
  setCurrentBatch,
} from '../../store/slices/priceSlice';
import { Card } from '../../components/ui';
import { FileUploadSection } from './FileUploadSection';
import { PricePreviewTable } from './PricePreviewTable';
import { ConfirmModal } from './ConfirmModal';

const PriceImportPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentBatch, batchItems, loading } = useAppSelector((state) => state.price);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [marginPercent, setMarginPercent] = useState('30');
  const [roundingRule, setRoundingRule] = useState('NEAREST');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Load batch items when currentBatch changes
  useEffect(() => {
    if (currentBatch?.id) {
      dispatch(loadBatchItems({ batchId: currentBatch.id }));
    }
  }, [currentBatch?.id, dispatch]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Process file with OCR/extraction
  const handleProcessFile = async () => {
    if (!selectedFile) return;

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (selectedSupplier) {
        formData.append('supplier_id', selectedSupplier);
      }
      formData.append('margin_percentage', marginPercent);
      formData.append('rounding_rule', roundingRule);

      await dispatch(uploadPriceFile(formData)).unwrap();
    } catch (error) {
      // Error handled in slice
    }
  };

  // Apply price changes
  const handleApplyPrices = async () => {
    if (!currentBatch?.id) return;

    try {
      await dispatch(applyPrices(currentBatch.id)).unwrap();

      // Reset
      setShowConfirmModal(false);
      setSelectedFile(null);
      dispatch(setCurrentBatch(null));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      // Error handled in slice
    }
  };

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="animate-fade-down duration-fast">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Importar Precios (OCR)
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 animate-fade-up duration-normal">
            Extrae precios de listas de proveedores (PDF/Excel) y actualiza productos
          </p>
        </div>

        {/* Upload Section */}
        <Card className="p-6 animate-fade-up duration-normal">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 animate-fade-right duration-fast">
            1. Subir Lista de Precios
          </h2>

          <FileUploadSection
            selectedFile={selectedFile}
            selectedSupplier={selectedSupplier}
            marginPercent={marginPercent}
            roundingRule={roundingRule}
            loading={loading}
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
            onSupplierChange={setSelectedSupplier}
            onMarginChange={setMarginPercent}
            onRoundingChange={setRoundingRule}
            onProcessFile={handleProcessFile}
          />
        </Card>

        {/* Preview Section */}
        {currentBatch && batchItems.length > 0 && (
          <Card className="overflow-hidden animate-zoom-in duration-normal">
            <PricePreviewTable
              preview={{
                items: batchItems.map(item => ({
                  status: item.match_status === 'MATCHED' ? 'matched' :
                         item.match_status === 'SUGGESTED' ? 'suggested' : 'unmatched',
                  matched_product_id: item.matched_product_id,
                  supplier_code: item.supplier_code,
                  description: item.description,
                  unit_price: item.cost_price,
                  product_name: item.matched_product_name || '',
                  current_price: item.current_cost_price || 0,
                  suggested_price: item.suggested_sell_price,
                })),
                total_items: batchItems.length,
                matched_count: batchItems.filter(i => i.match_status === 'MATCHED').length,
                unmatched_count: batchItems.filter(i => i.match_status === 'NOT_FOUND').length,
              }}
              selectedItems={new Set(
                batchItems
                  .map((item, index) => item.is_selected ? index : -1)
                  .filter(i => i >= 0)
              )}
              marginPercent={marginPercent}
              roundingRule={roundingRule}
              onToggleItem={() => {}}
              onToggleAllMatched={() => {}}
              onApply={() => setShowConfirmModal(true)}
            />
          </Card>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleApplyPrices}
        selectedCount={batchItems.filter(i => i.is_selected).length}
        marginPercent={marginPercent}
        roundingRule={roundingRule}
        loading={loading}
      />
    </>
  );
};

export default PriceImportPage;
