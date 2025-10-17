import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import Navbar from '../components/Navbar';
import RecipeSuggestions from '../components/RecipeSuggestions';
import { toast } from 'react-toastify';

export default function GenerateRecipes() {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Recipe Suggestions</h1>
            <p className="text-gray-600 mt-2">Based on your current pantry items</p>
          </div>
          
          {loading ? (
            <div className="text-center py-12">Loading recipes...</div>
          ) : (
            <RecipeSuggestions items={items} />
          )}
        </div>
      </main>
    </div>
  );
}
