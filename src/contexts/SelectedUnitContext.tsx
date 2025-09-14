import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UnitData } from '../lib/unitDataService';

interface SelectedUnitContextType {
  selectedUnit: UnitData | null;
  setSelectedUnit: (unit: UnitData | null) => void;
}

const SelectedUnitContext = createContext<SelectedUnitContextType | undefined>(undefined);

export function SelectedUnitProvider({ children }: { children: ReactNode }) {
  const [selectedUnit, setSelectedUnit] = useState<UnitData | null>(null);

  return (
    <SelectedUnitContext.Provider value={{ selectedUnit, setSelectedUnit }}>
      {children}
    </SelectedUnitContext.Provider>
  );
}

export function useSelectedUnit() {
  const context = useContext(SelectedUnitContext);
  if (context === undefined) {
    throw new Error('useSelectedUnit must be used within a SelectedUnitProvider');
  }
  return context;
}
