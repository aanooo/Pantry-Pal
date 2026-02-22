import React from 'react';
import Navbar from '../components/Navbar';
import InventoryAnalysis from '../components/InventoryAnalysis';
import { useInventory } from '../context/InventoryContext';
import { Download } from 'lucide-react';
import { generateInventoryReport } from '../utils/exportPdf';
import { toast } from 'react-toastify';

export default function Analysis() {
  const { items, loading } = useInventory();

  const handleExportPDF = () => {
    if (items.length === 0) {
      toast.warning('No items to export');
      return;
    }
    generateInventoryReport(items);
    toast.success('PDF exported successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">Inventory analysis</h1>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-sm"
            >
              <Download size={20} />
              Export PDF
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div id="analysis-content">
              <InventoryAnalysis items={items} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
