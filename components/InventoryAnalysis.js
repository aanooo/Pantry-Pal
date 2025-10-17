import React from 'react';
import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Package, TrendingUp, AlertCircle, Clock } from 'lucide-react';

export default function InventoryAnalysis({ items }) {
  const categoryData = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value
  }));

  const expirationData = items.reduce((acc, item) => {
    if (item.expirationDate) {
      const days = Math.ceil((new Date(item.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (days < 0) acc.expired++;
      else if (days <= 3) acc.critical++;
      else if (days <= 7) acc.warning++;
      else acc.good++;
    }
    return acc;
  }, { expired: 0, critical: 0, warning: 0, good: 0 });

  const expirationChartData = [
    { name: 'Expired', value: expirationData.expired, color: '#ef4444' },
    { name: '0-3 days', value: expirationData.critical, color: '#f97316' },
    { name: '4-7 days', value: expirationData.warning, color: '#eab308' },
    { name: '7+ days', value: expirationData.good, color: '#22c55e' }
  ];

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <Package className="mb-2" size={32} />
          <p className="text-sm opacity-90">Total Items</p>
          <p className="text-4xl font-bold">{items.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <TrendingUp className="mb-2" size={32} />
          <p className="text-sm opacity-90">Categories</p>
          <p className="text-4xl font-bold">{Object.keys(categoryData).length}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <AlertCircle className="mb-2" size={32} />
          <p className="text-sm opacity-90">Expiring Soon</p>
          <p className="text-4xl font-bold">{expirationData.critical + expirationData.warning}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white">
          <Clock className="mb-2" size={32} />
          <p className="text-sm opacity-90">Expired</p>
          <p className="text-4xl font-bold">{expirationData.expired}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Category Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Expiration Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expirationChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8">
                {expirationChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}