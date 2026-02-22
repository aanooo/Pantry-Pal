import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { collection, getDocs, getDocsFromCache, getDocsFromServer, query, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';

const defaultContextValue = {
  items: [],
  loading: true,
  error: null,
  refresh: () => {},
  addItem: () => {},
  replaceTempId: () => {},
  deleteItem: () => {},
  updateItem: () => {},
  updateItemInFirestore: async () => {},
};

const InventoryContext = createContext(defaultContextValue);

const ITEMS_LIMIT = 200;

export function InventoryProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    if (!db) return;
    setError(null);
    const q = query(
      collection(db, 'pantryItems'),
      orderBy('addedDate', 'desc'),
      limit(ITEMS_LIMIT)
    );

    const applySnapshot = (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(list);
    };

    try {
      try {
        const cached = await getDocsFromCache(q);
        if (cached.docs.length > 0) {
          applySnapshot(cached);
          setLoading(false);
          getDocsFromServer(q).then(applySnapshot).catch(() => {}).finally(() => setLoading(false));
          return;
        }
      } catch (_) {
        /* no cache */
      }

      setLoading(true);
      const snapshot = await getDocs(q);
      applySnapshot(snapshot);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError(err);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback((newItem) => {
    setItems((prev) => [newItem, ...prev]);
  }, []);

  const replaceTempId = useCallback((tempId, realId) => {
    setItems((prev) =>
      prev.map((i) => (i.id === tempId ? { ...i, id: realId } : i))
    );
  }, []);

  const deleteItem = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateItem = useCallback((id, updates) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
  }, []);

  const updateItemInFirestore = useCallback(async (id, updates) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'pantryItems', id), updates);
      updateItem(id, updates);
    } catch (err) {
      console.error('Error updating item:', err);
      toast.error('Failed to update item');
    }
  }, [updateItem]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const value = {
    items,
    loading,
    error,
    refresh: fetchItems,
    addItem,
    replaceTempId,
    deleteItem,
    updateItem,
    updateItemInFirestore,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  // Always return a valid value so pages never throw (e.g. stale cache or SSR edge cases)
  if (!ctx || typeof ctx.refresh !== 'function') return defaultContextValue;
  return ctx;
}

// Helpers for expiry/attention (shared logic)
export function getDaysUntilExpiration(expirationDate) {
  if (!expirationDate) return null;
  const today = new Date();
  const expDate = new Date(expirationDate);
  return Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
}

export function getExpirationStatus(days) {
  if (days === null) return 'none';
  if (days < 0) return 'expired';
  if (days <= 3) return 'critical';
  if (days <= 7) return 'warning';
  return 'good';
}

export function useInventoryStats(items) {
  const getDays = getDaysUntilExpiration;
  const getStatus = getExpirationStatus;
  const expiringSoon = items.filter((item) => {
    const d = getDays(item.expirationDate);
    return d !== null && d >= 0 && d <= 3;
  });
  const needsAttention = items.filter((item) => {
    const d = getDays(item.expirationDate);
    return d !== null && (d < 0 || d <= 3);
  });
  const expired = items.filter((item) => {
    const d = getDays(item.expirationDate);
    return d !== null && d < 0;
  });
  const categoryCount = new Set(items.map((i) => i.category)).size;
  return { expiringSoon, needsAttention, expired, categoryCount };
}
