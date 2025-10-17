import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import Navbar from '../components/Navbar';
import AddItemModal from '../components/AddItemModal';
import InventoryList from '../components/InventoryList';
import Pantry from '../components/Pantry';
import { Plus, AlertCircle, Package, TrendingUp, ChefHat } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    checkExpiringItems();
  }, [items]);

  const fetchItems = async () => {
    try {
      const q = query(collection(db, 'pantryItems'), orderBy('addedDate', 'desc'));
      const querySnapshot = await getDocs(q);
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

  const checkExpiringItems = () => {
    const expiring = items.filter(item => {
      if (!item.expirationDate) return false;
      const days = Math.ceil((new Date(item.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 3;
    });
    
    if (expiring.length > 0) {
      setNotifications(expiring.map(item => 
        `${item.name} expires in ${Math.ceil((new Date(item.expirationDate) - new Date()) / (1000 * 60 * 60 * 24))} days!`
      ));
    }
  };

  const handleAddItem = (newItem) => {
    setItems([newItem, ...items]);
  };

  const handleDeleteItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleEditItem = (item) => {
    console.log('Edit item:', item);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Package className="mx-auto mb-4 animate-pulse" size={48} />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Add Item
            </button>
          </div>
          
          {notifications.length > 0 && (
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
              <div className="flex items-start">
                <AlertCircle className="text-orange-500 mt-0.5" size={20} />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-800">Items Expiring Soon</h3>
                  <div className="mt-2 text-sm text-orange-700">
                    {notifications.map((notif, idx) => (
                      <p key={idx}>{notif}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <Package className="text-blue-600 mb-3" size={32} />
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Total Items</h3>
              <p className="text-3xl font-bold text-gray-900">{items.length}</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <TrendingUp className="text-green-600 mb-3" size={32} />
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Categories</h3>
              <p className="text-3xl font-bold text-gray-900">
                {new Set(items.map(i => i.category)).size}
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <ChefHat className="text-purple-600 mb-3" size={32} />
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Recipes Available</h3>
              <p className="text-3xl font-bold text-gray-900">12</p>
            </div>
          </div>

          <Pantry items={items} />

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Items</h2>
            <InventoryList 
              items={items.slice(0, 5)} 
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
              searchTerm=""
            />
          </div>
        </div>
      </main>

      <AddItemModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddItem}
      />
    </div>
  );
}