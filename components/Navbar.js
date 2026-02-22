import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Package, Home, ChefHat, BookOpen, BarChart3, LogIn, LogOut } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { toast } from 'react-toastify';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const isActive = (path) => router.pathname === path;

  const handleGoogleLogin = async () => {
    if (!auth) {
      toast.error('Firebase is not configured. Copy .env.example to .env.local and add your Firebase project credentials.');
      return;
    }
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      toast.success(`Welcome ${result.user.displayName}!`);
    } catch (error) {
      console.error('Login error:', error);
      
      // Better error messages
      if (error.code === 'auth/popup-closed-by-user') {
        toast.info('Login cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Please allow popups for this site');
      } else if (error.code === 'auth/unauthorized-domain') {
        toast.error('Domain not authorized. Add localhost to Firebase authorized domains.');
      } else if (error.code === 'auth/invalid-api-key' || error.message?.includes('api-key-not-valid')) {
        toast.error('Invalid Firebase API key. Check .env.local — use values from Firebase Console → Project settings.');
      } else if (error.code === 'auth/configuration-not-found' || error.message?.includes('CONFIGURATION_NOT_FOUND')) {
        toast.error('Enable Authentication in Firebase Console: Authentication → Sign-in method → enable Google.');
      } else {
        toast.error(`Login failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <Package className="text-blue-600" size={32} />
            <span className="text-xl font-bold text-gray-800">Pantry Tracker</span>
          </Link>
          
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive('/') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Home size={20} />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link
              href="/inventory"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive('/inventory') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Package size={20} />
              <span className="hidden sm:inline">Inventory</span>
            </Link>
            <Link
              href="/generate-recipes"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive('/generate-recipes') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ChefHat size={20} />
              <span className="hidden sm:inline">Recipes</span>
            </Link>
            <Link
              href="/saved-recipes"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive('/saved-recipes') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BookOpen size={20} />
              <span className="hidden sm:inline">Saved</span>
            </Link>
            <Link
              href="/analysis"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive('/analysis') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 size={20} />
              <span className="hidden sm:inline">Analysis</span>
            </Link>

            {/* Login/Logout Button */}
            <div className="ml-4 border-l pl-4">
              {user ? (
                <div className="flex items-center gap-2">
                  {user.photoURL && (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'}
                      className="w-8 h-8 rounded-full border-2 border-blue-500"
                    />
                  )}
                  <span className="hidden md:inline text-sm text-gray-700">
                    {user.displayName?.split(' ')[0]}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut size={18} />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="hidden sm:inline">Loading...</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={20} />
                      <span className="hidden sm:inline">Login with Google</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}