import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, Users, Flame } from 'lucide-react';
import axios from 'axios';

export default function RecipeSuggestions({ items }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateRecipes();
  }, [items]);

  const generateRecipes = async () => {
    setLoading(true);
    try {
      const ingredients = items.map(item => item.name).join(', ');
      
      // Mock recipe generation (replace with actual OpenRouter API call)
      const mockRecipes = [
        {
          id: 1,
          name: 'Quick Stir Fry',
          matchingIngredients: items.slice(0, 3).map(i => i.name),
          cookTime: '15 min',
          servings: 4,
          difficulty: 'Easy',
          calories: 320,
          description: 'A quick and healthy stir fry using your pantry items.',
          instructions: [
            'Heat oil in a large pan',
            'Add vegetables and stir fry for 5-7 minutes',
            'Season with salt and pepper',
            'Serve hot with rice'
          ]
        },
        {
          id: 2,
          name: 'Pantry Soup',
          matchingIngredients: items.slice(0, 4).map(i => i.name),
          cookTime: '30 min',
          servings: 6,
          difficulty: 'Medium',
          calories: 180,
          description: 'Hearty soup made with available ingredients.',
          instructions: [
            'Bring water to boil',
            'Add all vegetables',
            'Simmer for 25 minutes',
            'Season and serve'
          ]
        },
        {
          id: 3,
          name: 'Simple Salad',
          matchingIngredients: items.slice(0, 2).map(i => i.name),
          cookTime: '10 min',
          servings: 2,
          difficulty: 'Easy',
          calories: 150,
          description: 'Fresh and quick salad from your pantry.',
          instructions: [
            'Wash and chop vegetables',
            'Mix in a bowl',
            'Add dressing',
            'Serve immediately'
          ]
        }
      ];
      
      setRecipes(mockRecipes);
    } catch (error) {
      console.error('Error generating recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading recipes...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map(recipe => (
        <div key={recipe.id} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-xl text-gray-800">{recipe.name}</h3>
              <ChefHat className="text-blue-600" size={28} />
            </div>
            <p className="text-gray-600 text-sm mb-4">{recipe.description}</p>
            
            <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
              <div className="flex items-center gap-1 text-gray-600">
                <Clock size={16} />
                <span>{recipe.cookTime}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <Users size={16} />
                <span>{recipe.servings}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <Flame size={16} />
                <span>{recipe.calories}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Ingredients you have:</p>
              <div className="flex flex-wrap gap-1">
                {recipe.matchingIngredients.map((ing, idx) => (
                  <span key={idx} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    {ing}
                  </span>
                ))}
              </div>
            </div>

            <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              View Recipe
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
