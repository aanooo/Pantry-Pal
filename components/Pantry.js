import React from 'react';
import { Package } from 'lucide-react';

export default function Pantry({ items }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <Package className="text-blue-600" size={32} />
        <h2 className="text-2xl font-bold text-gray-800">Your Pantry</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-3xl font-bold text-blue-600">{items.length}</p>
          <p className="text-sm text-gray-600">Total Items</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-3xl font-bold text-green-600">
            {items.filter(i => i.category === 'Vegetables').length}
          </p>
          <p className="text-sm text-gray-600">Vegetables</p>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <p className="text-3xl font-bold text-orange-600">
            {items.filter(i => i.category === 'Fruits').length}
          </p>
          <p className="text-sm text-gray-600">Fruits</p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <p className="text-3xl font-bold text-purple-600">
            {items.filter(i => i.category === 'Dairy').length}
          </p>
          <p className="text-sm text-gray-600">Dairy</p>
        </div>
      </div>
    </div>
  );
}