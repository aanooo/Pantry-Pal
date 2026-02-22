import React from 'react';
import Navbar from '../components/Navbar';
import RecipeSuggestions from '../components/RecipeSuggestions';
import { useInventory } from '../context/InventoryContext';
import { ChefHat } from 'lucide-react';

export default function GenerateRecipes() {
  const { items, loading } = useInventory();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recipe suggestions</h1>
            <p className="text-gray-600 mt-2">Based on your current pantry ({items.length} items)</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <RecipeSuggestions items={items} />
          )}
        </div>
      </main>
    </div>
  );
}
