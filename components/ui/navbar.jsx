'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Scissors, LogOut, User, ChevronDown } from 'lucide-react';

export function Navbar() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  if (!mounted) return null;

  return (
    <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Scissors className="h-6 w-6 text-amber-500" />
          <span className="text-white font-bold text-lg">BarberShop SaaS</span>
        </button>

        {/* User Section */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {user.nome?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-white text-sm font-medium truncate max-w-[150px]">
                    {user.nome || user.email}
                  </p>
                  <p className="text-zinc-400 text-xs capitalize">{user.tipo}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-zinc-400" />
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg py-1">
                  <div className="px-4 py-2 border-b border-zinc-700">
                    <p className="text-white text-sm font-medium truncate">{user.nome}</p>
                    <p className="text-zinc-400 text-xs truncate">{user.email}</p>
                  </div>
                  
                  {user.tipo === 'admin' && (
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        router.push('/admin');
                      }}
                      className="w-full px-4 py-2 text-left text-zinc-300 hover:bg-zinc-700 text-sm"
                    >
                      Painel Admin
                    </button>
                  )}
                  
                  {user.tipo === 'owner' && (
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        router.push('/gerir-plano');
                      }}
                      className="w-full px-4 py-2 text-left text-zinc-300 hover:bg-zinc-700 text-sm"
                    >
                      Gerir Plano
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-red-400 hover:bg-zinc-700 text-sm flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="text-zinc-300 hover:text-white"
                onClick={() => router.push('/')}
              >
                Entrar
              </Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700"
                onClick={() => router.push('/planos')}
              >
                Criar Barbearia
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
