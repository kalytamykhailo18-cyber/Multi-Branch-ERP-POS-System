import React from 'react';
import { Card, Input, Button } from '../../components/ui';
import type { LoyaltyConfig } from '../../services/api/loyalty.service';

interface SettingsFormProps {
  config: LoyaltyConfig;
  onConfigChange: (config: Partial<LoyaltyConfig>) => void;
  onSave: () => void;
  loading: boolean;
}

const SettingsForm: React.FC<SettingsFormProps> = ({
  config,
  onConfigChange,
  onSave,
  loading,
}) => {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Configuración del Programa
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Puntos por cada $1 de compra
          </label>
          <Input
            type="number"
            value={config.points_per_peso}
            onChange={(e) => onConfigChange({ ...config, points_per_peso: parseInt(e.target.value) || 0 })}
            min="0"
          />
          <p className="text-xs text-gray-500 mt-1">
            Ej: 1 significa que gana 1 punto por cada peso
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Valor de cada punto en pesos (redención)
          </label>
          <Input
            type="number"
            value={config.peso_per_point_redemption}
            onChange={(e) => onConfigChange({ ...config, peso_per_point_redemption: parseFloat(e.target.value) || 0 })}
            min="0"
            step="0.01"
          />
          <p className="text-xs text-gray-500 mt-1">
            Ej: 0.1 significa que cada punto vale $0.10
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mínimo de puntos para canjear
          </label>
          <Input
            type="number"
            value={config.minimum_points_to_redeem}
            onChange={(e) => onConfigChange({ ...config, minimum_points_to_redeem: parseInt(e.target.value) || 0 })}
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Días hasta expiración de puntos
          </label>
          <Input
            type="number"
            value={config.points_expiry_days}
            onChange={(e) => onConfigChange({ ...config, points_expiry_days: parseInt(e.target.value) || 0 })}
            min="0"
          />
          <p className="text-xs text-gray-500 mt-1">
            0 = sin expiración
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Días hasta expiración de crédito
          </label>
          <Input
            type="number"
            value={config.credit_expiry_days}
            onChange={(e) => onConfigChange({ ...config, credit_expiry_days: parseInt(e.target.value) || 0 })}
            min="0"
          />
          <p className="text-xs text-gray-500 mt-1">
            0 = sin expiración
          </p>
        </div>

        <div className="md:col-span-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">
            Sistema de Crédito (Vuelto como Crédito)
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mínimo de vuelto para dar como crédito
            </label>
            <Input
              type="number"
              value={config.min_change_for_credit}
              onChange={(e) => onConfigChange({ ...config, min_change_for_credit: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ej: 10 significa que solo vueltos de $10 o más se pueden dar como crédito
            </p>
          </div>
        </div>

        <div className="md:col-span-2">
          <Button variant="primary" onClick={onSave} loading={loading}>
            Guardar Configuración
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SettingsForm;
