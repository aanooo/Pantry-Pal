import React, { useMemo } from 'react';
import { Package } from 'lucide-react';

const CATEGORY_COLORS = {
  Vegetables: 'bg-emerald-50 text-emerald-700',
  Fruits: 'bg-orange-50 text-orange-700',
  Dairy: 'bg-violet-50 text-violet-700',
  Meat: 'bg-rose-50 text-rose-700',
  Grains: 'bg-amber-50 text-amber-700',
  Snacks: 'bg-sky-50 text-sky-700',
  Beverages: 'bg-teal-50 text-teal-700',
  Other: 'bg-gray-100 text-gray-700',
};

export default function Pantry({ items }) {
  const byCategory = useMemo(() => {
    const map = {};
    items.forEach((i) => {
      const cat = i.category || 'Other';
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [items]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <Package className="text-blue-600" size={28} />
        <h2 className="text-xl font-bold text-gray-800">Your pantry</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-1 flex flex-col justify-center p-4 bg-blue-50 rounded-xl">
          <p className="text-3xl font-bold text-blue-600">{items.length}</p>
          <p className="text-sm text-gray-600">Total items</p>
        </div>
        {byCategory.map(([category, count]) => (
          <div
            key={category}
            className={`p-4 rounded-xl ${CATEGORY_COLORS[category] || CATEGORY_COLORS.Other}`}
          >
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-sm opacity-90">{category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
