import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import AddItemModal from '../components/AddItemModal';
import ImportExcelModal from '../components/ImportExcelModal';
import InventoryList from '../components/InventoryList';
import { useInventory, useInventoryStats } from '../context/InventoryContext';
import { Plus, Search, Package, AlertTriangle, Clock, ArrowRight, FileSpreadsheet } from 'lucide-react';

const FILTERS = { all: 'All', attention: 'Needs attention', expiring: 'Expiring soon' };

export default function Inventory() {
  const router = useRouter();
  const { filter: queryFilter } = router.query;
  const { items, loading, addItem, replaceTempId, deleteItem, refresh } = useInventory();
  const { needsAttention, expiringSoon } = useInventoryStats(items);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  React.useEffect(() => {
    if (queryFilter === 'attention' || queryFilter === 'expiring') setActiveFilter(queryFilter);
  }, [queryFilter]);

  const filteredItems = useMemo(() => {
    let list = items;
    if (activeFilter === 'attention') list = needsAttention;
    else if (activeFilter === 'expiring') list = expiringSoon;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(term) || (i.category && i.category.toLowerCase().includes(term)));
    }
    return list;
  }, [items, activeFilter, needsAttention, expiringSoon, searchTerm]);

  const handleAddItem = (newItem) => addItem(newItem);
  const handleSaved = (tempId, realId) => replaceTempId(tempId, realId);
  const handleDeleteItem = (id) => deleteItem(id);
  const handleEditItem = () => {};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setIsImportOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                <FileSpreadsheet size={20} />
                Import Excel
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus size={20} />
                Add Item
              </button>
            </div>
          </div>

          {/* Summary bar */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-medium text-gray-700">
              <Package className="inline mr-1.5" size={18} />
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
            {needsAttention.length > 0 && (
              <span className="text-amber-700">
                <AlertTriangle className="inline mr-1.5" size={18} />
                {needsAttention.length} need attention
              </span>
            )}
            {expiringSoon.length > 0 && (
              <span className="text-blue-600">
                <Clock className="inline mr-1.5" size={18} />
                {expiringSoon.length} expiring soon
              </span>
            )}
          </div>

          {/* Search + filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(FILTERS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeFilter === key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {activeFilter === 'attention' && 'Needs attention'}
                {activeFilter === 'expiring' && 'Expiring soon'}
                {activeFilter === 'all' && 'All items'}
              </h2>
              {activeFilter !== 'all' && (
                <button
                  onClick={() => setActiveFilter('all')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  Show all <ArrowRight size={14} />
                </button>
              )}
            </div>
            <div className="p-6">
              <InventoryList
                items={filteredItems}
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
      <ImportExcelModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onAdd={handleAddItem}
        onSaved={handleSaved}
      />
    </div>
  );
}
