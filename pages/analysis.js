
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import Navbar from '../components/Navbar';
import InventoryAnalysis from '../components/InventoryAnalysis';
import { Download } from 'lucide-react';
import { generateInventoryReport } from '../utils/exportPdf';
import { toast } from 'react-toastify';

export default function Analysis() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'pantryItems'));
      const itemsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(itemsList);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-3xl font-bold text-gray-800">Inventory Analysis</h1>
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={20} />
              Export PDF
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-12">Loading analysis...</div>
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
