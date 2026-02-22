import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Clock,
  Users,
  Flame,
  ListOrdered,
  Save,
  Loader2,
  Check,
  Sparkles,
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';

const STYLES = [
  { id: 'simple', label: 'Simple' },
  { id: '10min', label: '10 min' },
  { id: 'delicacy', label: 'Delicacy' },
  { id: 'protein', label: 'Great protein' },
];

export default function RecipeSuggestions({ items }) {
  const [servings, setServings] = useState(4);
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [saving, setSaving] = useState(false);
  // Per-item: selected, useAmount, useUnit, replaceWith
  const [custom, setCustom] = useState({});
  const [selectedStyle, setSelectedStyle] = useState('');
  const [ideas, setIdeas] = useState([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [recipeFocus, setRecipeFocus] = useState('');
  const [saveCustomName, setSaveCustomName] = useState('');
  const [saveTags, setSaveTags] = useState({ bestWorked: false, greatTaste: false });
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    if (items.length === 0) return;
    setCustom((prev) => {
      const next = { ...prev };
      items.forEach((i) => {
        if (next[i.id] === undefined) {
          next[i.id] = {
            selected: true,
            useAmount: '',
            useUnit: i.unit || 'g',
            replaceWith: '',
          };
        }
      });
      return next;
    });
  }, [items]);

  const selectedItems = items.filter((i) => custom[i.id]?.selected);
  const canGenerate = selectedItems.length > 0;

  const buildPayload = () => {
    return selectedItems.map((i) => {
      const c = custom[i.id] || {};
      return {
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        useAmount: c.useAmount !== undefined && c.useAmount !== '' ? String(c.useAmount) : undefined,
        useUnit: c.useUnit || i.unit,
        replaceWith: c.replaceWith?.trim() || undefined,
      };
    });
  };

  const handleGenerate = async (focus = recipeFocus) => {
    if (!canGenerate) return;
    setLoading(true);
    setRecipe(null);
    try {
      const styleText =
        selectedStyle === '10min'
          ? 'Quick recipe, ready in about 10 minutes.'
          : selectedStyle === 'protein'
            ? 'High-protein, satisfying dish.'
            : selectedStyle === 'delicacy'
              ? 'A more refined, delicacy-style dish.'
              : selectedStyle === 'simple'
                ? 'Simple, minimal steps.'
                : '';
      const res = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: buildPayload(),
          servings,
          style: styleText,
          recipeFocus: focus || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to generate recipe');
        return;
      }
      setRecipe(data);
      setSaveCustomName(data.name || '');
      setSaveTags({ bestWorked: false, greatTaste: false });
      toast.success('Recipe generated!');
    } catch (e) {
      console.error(e);
      toast.error('Could not generate recipe');
    } finally {
      setLoading(false);
    }
  };

  const fetchIdeas = async () => {
    if (items.length === 0) return;
    setIdeasLoading(true);
    setIdeas([]);
    try {
      const res = await fetch('/api/suggest-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: items.map((i) => i.name) }),
      });
      const data = await res.json();
      setIdeas(Array.isArray(data.ideas) ? data.ideas : []);
    } catch (e) {
      setIdeas([]);
    } finally {
      setIdeasLoading(false);
    }
  };

  const handleSave = async () => {
    if (!recipe || !db) return;
    const customName = (saveCustomName || recipe.name || '').trim();
    const tags = [];
    if (saveTags.bestWorked) tags.push('best-worked');
    if (saveTags.greatTaste) tags.push('great-taste');
    setSaving(true);
    try {
      await addDoc(collection(db, 'savedRecipes'), {
        ...recipe,
        name: customName || recipe.name,
        userTags: tags,
        savedAt: new Date().toISOString(),
      });
      toast.success('Recipe saved!');
      setShowSaveModal(false);
    } catch (e) {
      console.error(e);
      toast.error('Failed to save recipe');
    } finally {
      setSaving(false);
    }
  };

  const openSaveModal = () => {
    setSaveCustomName(recipe?.name || '');
    setSaveTags({ bestWorked: false, greatTaste: false });
    setShowSaveModal(true);
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
        <ChefHat className="mx-auto text-gray-300 mb-4" size={48} />
        <p className="text-gray-600">Add items to your inventory to generate recipes.</p>
      </div>
    );
  }

  return (
    <>
      {/* Recipe ideas from pantry */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 mb-6">
        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <Sparkles size={18} />
          Recipe ideas from your pantry
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          Get ideas like tomato soup, 10 min recipes, or high-protein dishes based on what you have.
        </p>
        {ideasLoading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 size={18} className="animate-spin" />
            Loading ideas…
          </div>
        ) : ideas.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {ideas.map((idea, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setRecipeFocus(idea);
                  handleGenerate(idea);
                }}
                disabled={loading}
                className="px-3 py-1.5 rounded-full text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:opacity-50"
              >
                {idea}
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={fetchIdeas}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Suggest recipe ideas
          </button>
        )}
      </div>

      {/* Customize ingredients */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Customize ingredients</h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose which items to use (e.g. 3 of 5), set how much to use (e.g. 200g of 300g), or replace with something else.
        </p>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {items.map((item) => {
            const c = custom[item.id] || {};
            return (
              <div
                key={item.id}
                className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100"
              >
                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={!!c.selected}
                    onChange={(e) =>
                      setCustom((prev) => ({
                        ...prev,
                        [item.id]: { ...prev[item.id], selected: e.target.checked },
                      }))
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="font-medium text-gray-800">
                    {item.name} ({item.quantity} {item.unit})
                  </span>
                </label>
                <span className="text-gray-400 text-sm">Use only</span>
                <input
                  type="text"
                  placeholder="e.g. 200"
                  value={c.useAmount ?? ''}
                  onChange={(e) =>
                    setCustom((prev) => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], useAmount: e.target.value },
                    }))
                  }
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="g"
                  value={c.useUnit ?? item.unit ?? ''}
                  onChange={(e) =>
                    setCustom((prev) => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], useUnit: e.target.value },
                    }))
                  }
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <span className="text-gray-400 text-sm">Replace with</span>
                <input
                  type="text"
                  placeholder="optional"
                  value={c.replaceWith ?? ''}
                  onChange={(e) =>
                    setCustom((prev) => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], replaceWith: e.target.value },
                    }))
                  }
                  className="flex-1 min-w-[100px] px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="block text-sm font-medium text-gray-700">Servings</label>
          <input
            type="number"
            min={1}
            max={20}
            value={servings}
            onChange={(e) => setServings(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
          />
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedStyle(selectedStyle === s.id ? '' : s.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  selectedStyle === s.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => handleGenerate()}
            disabled={loading || !canGenerate}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <ChefHat size={20} />
                Generate recipe ({selectedItems.length} ingredients)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated recipe */}
      {recipe && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{recipe.name}</h2>
                <p className="text-gray-600 mt-1">{recipe.description}</p>
              </div>
              <button
                onClick={openSaveModal}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium shrink-0"
              >
                <Save size={18} />
                Save recipe
              </button>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
              {recipe.cookTime && (
                <span className="flex items-center gap-1">
                  <Clock size={16} />
                  {recipe.cookTime}
                </span>
              )}
              {recipe.servings && (
                <span className="flex items-center gap-1">
                  <Users size={16} />
                  {recipe.servings} servings
                </span>
              )}
              {recipe.calories != null && (
                <span className="flex items-center gap-1">
                  <Flame size={16} />
                  ~{recipe.calories} cal/serving
                </span>
              )}
              {recipe.difficulty && (
                <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700">{recipe.difficulty}</span>
              )}
            </div>

            {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 && (
              <div className="mb-6">
                <h3 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
                  <ListOrdered size={18} />
                  Ingredients
                </h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i}>
                      {typeof ing === 'string'
                        ? ing
                        : `${ing.amount || ''} ${ing.name || ing}`.trim()}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(recipe.instructions) && recipe.instructions.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">Instructions</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  {recipe.instructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save modal: custom name + Best worked / Great taste */}
      {showSaveModal && recipe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save recipe</h3>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipe name (optional)</label>
            <input
              type="text"
              value={saveCustomName}
              onChange={(e) => setSaveCustomName(e.target.value)}
              placeholder={recipe.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
            />
            <div className="flex flex-wrap gap-4 mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveTags.bestWorked}
                  onChange={(e) => setSaveTags((t) => ({ ...t, bestWorked: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="text-gray-800">Best worked</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveTags.greatTaste}
                  onChange={(e) => setSaveTags((t) => ({ ...t, greatTaste: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="text-gray-800">Great taste</span>
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {!recipe && !loading && canGenerate && (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-200 text-gray-500">
          <ChefHat className="mx-auto text-gray-300 mb-3" size={40} />
          <p>Customize ingredients above, pick a style, then generate — or click an idea above.</p>
        </div>
      )}
    </>
  );
}
