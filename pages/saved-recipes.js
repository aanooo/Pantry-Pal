import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import Navbar from '../components/Navbar';
import { ChefHat, Clock, BookOpen } from 'lucide-react';

export default function SavedRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const q = query(
          collection(db, 'savedRecipes'),
          orderBy('savedAt', 'desc')
        );
        const snap = await getDocs(q);
        setRecipes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="text-blue-600" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Saved recipes</h1>
            <p className="text-gray-600 text-sm">Recipes you’ve saved from the generator</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recipes.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
            <ChefHat className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-600 mb-4">No saved recipes yet.</p>
            <Link
              href="/generate-recipes"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ChefHat size={18} />
              Generate & save a recipe
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recipes.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-3 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h2 className="font-semibold text-lg text-gray-900">{r.name}</h2>
                    {r.description && (
                      <p className="text-sm text-gray-600 mt-0.5 line-clamp-1">{r.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                      {r.cookTime && <span className="flex items-center gap-1"><Clock size={12} />{r.cookTime}</span>}
                      {r.servings && <span>{r.servings} servings</span>}
                      {r.calories != null && <span>~{r.calories} cal/serving</span>}
                    </div>
                    {Array.isArray(r.userTags) && r.userTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {r.userTags.includes('best-worked') && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-medium">Best worked</span>
                        )}
                        {r.userTags.includes('great-taste') && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-medium">Great taste</span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-blue-600 text-sm font-medium shrink-0">
                    {expandedId === r.id ? 'Hide' : 'Show'}
                  </span>
                </button>
                {expandedId === r.id && (
                  <div className="px-4 sm:px-5 pb-5 pt-0 border-t border-gray-100">
                    {Array.isArray(r.ingredients) && r.ingredients.length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-medium text-gray-800 mb-2">Ingredients</h3>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                          {r.ingredients.map((ing, i) => (
                            <li key={i}>
                              {typeof ing === 'string' ? ing : `${ing.amount || ''} ${ing.name || ing}`.trim()}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(r.instructions) && r.instructions.length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-medium text-gray-800 mb-2">Instructions</h3>
                        <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                          {r.instructions.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
