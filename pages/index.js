import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import AddItemModal from '../components/AddItemModal';
import InventoryList from '../components/InventoryList';
import Pantry from '../components/Pantry';
import { useInventory, useInventoryStats } from '../context/InventoryContext';
import { Plus, AlertCircle, Package, TrendingUp, ChefHat, AlertTriangle, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { items, loading, addItem, replaceTempId, deleteItem, refresh } = useInventory();
  const { expiringSoon, needsAttention, categoryCount } = useInventoryStats(items);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddItem = (newItem) => addItem(newItem);
  const handleSaved = (tempId, realId) => replaceTempId(tempId, realId);
  const handleDeleteItem = (id) => deleteItem(id);
  const handleEditItem = () => {}; // TODO: edit modal

  const recipeReadyCount = useMemo(() => {
    return items.length >= 2 ? Math.min(12, Math.floor(items.length / 2) + 3) : 0;
  }, [items.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading your pantry...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={20} />
              Add Item
            </button>
          </div>

          {/* Alerts: Needs attention first, then expiring soon */}
          {needsAttention.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={22} />
                <div className="min-w-0">
                  <h3 className="font-semibold text-red-800">Needs attention</h3>
                  <p className="text-sm text-red-700 mt-1">
                    {needsAttention.length} item{needsAttention.length !== 1 ? 's' : ''} expired or expiring in 3 days — use or replace soon.
                  </p>
                  <Link
                    href="/inventory?filter=attention"
                    className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-red-700 hover:text-red-800"
                  >
                    View in Inventory <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {expiringSoon.length > 0 && needsAttention.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={22} />
                <div>
                  <h3 className="font-semibold text-amber-800">Expiring soon</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    {expiringSoon.length} item{expiringSoon.length !== 1 ? 's' : ''} in the next 3 days.
                  </p>
                  <Link
                    href="/inventory?filter=expiring"
                    className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-amber-700 hover:text-amber-800"
                  >
                    View in Inventory <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <Package className="text-blue-600 mb-3" size={28} />
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total items</h3>
              <p className="text-3xl font-bold text-gray-900 mt-1">{items.length}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <TrendingUp className="text-emerald-600 mb-3" size={28} />
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Categories</h3>
              <p className="text-3xl font-bold text-gray-900 mt-1">{categoryCount}</p>
            </div>
            <Link href="/generate-recipes" className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all block">
              <ChefHat className="text-violet-600 mb-3" size={28} />
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Recipes</h3>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {recipeReadyCount > 0 ? `${recipeReadyCount}+` : '—'}
              </p>
              <span className="text-sm text-blue-600 mt-2 inline-block">Find recipes →</span>
            </Link>
          </div>

          <Pantry items={items} />

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Recent items</h2>
              <Link href="/inventory" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </Link>
            </div>
            <div className="p-6">
              <InventoryList
                items={items.slice(0, 5)}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                searchTerm=""
              />
            </div>
          </div>
        </div>
      </main>

      <AddItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddItem}
        onSaved={handleSaved}
      />
    </div>
  );
}
