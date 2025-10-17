import React from 'react';
import { Package, Clock, Edit, Trash2 } from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';

export default function InventoryList({ items, onEdit, onDelete, searchTerm }) {
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDaysUntilExpiration = (expirationDate) => {
    if (!expirationDate) return null;
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpirationStatus = (days) => {
    if (days === null) return 'none';
    if (days < 0) return 'expired';
    if (days <= 3) return 'critical';
    if (days <= 7) return 'warning';
    return 'good';
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteDoc(doc(db, 'pantryItems', id));
        toast.success('Item deleted successfully!');
        onDelete(id);
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error('Failed to delete item');
      }
    }
  };

  return (
    <div className="space-y-3">
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Package size={48} className="mx-auto mb-3 opacity-50" />
          <p>No items found</p>
        </div>
      ) : (
        filteredItems.map(item => {
          const daysUntilExp = getDaysUntilExpiration(item.expirationDate);
          const status = getExpirationStatus(daysUntilExp);
          
          return (
            <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg text-gray-800">{item.name}</h3>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">
                    {item.quantity} {item.unit}
                  </p>
                  {item.expirationDate && (
                    <div className={`flex items-center gap-1 text-sm ${
                      status === 'expired' ? 'text-red-600' :
                      status === 'critical' ? 'text-orange-600' :
                      status === 'warning' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      <Clock size={14} />
                      <span>
                        {status === 'expired' ? 'Expired' :
                         daysUntilExp === 0 ? 'Expires today' :
                         `Expires in ${daysUntilExp} day${daysUntilExp !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                  )}
                  {item.notes && (
                    <p className="text-sm text-gray-500 mt-2">{item.notes}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(item)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}