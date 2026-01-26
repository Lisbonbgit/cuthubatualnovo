'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Calendar, Users, Scissors, Package, Clock, Settings, 
  CreditCard, User, LogOut, ChevronLeft, ChevronRight,
  LayoutDashboard, History, UserCircle, MapPin
} from 'lucide-react';

// Configurações de menu por tipo de utilizador
const menuConfigs = {
  admin: [
    { id: 'marcacoes', label: 'Marcações', icon: Calendar },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'barbeiros', label: 'Barbeiros', icon: User },
    { id: 'servicos', label: 'Serviços', icon: Scissors },
    { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'planos', label: 'Planos', icon: CreditCard },
    { id: 'horarios', label: 'Horários', icon: Clock },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ],
  barbeiro: [
    { id: 'marcacoes', label: 'Marcações', icon: Calendar },
    { id: 'horarios', label: 'Meus Horários', icon: Clock },
    { id: 'perfil', label: 'Meu Perfil', icon: UserCircle },
  ],
  cliente: [
    { id: 'marcacoes', label: 'Minhas Marcações', icon: Calendar },
    { id: 'historico', label: 'Histórico', icon: History },
    { id: 'perfil', label: 'Meu Perfil', icon: UserCircle },
  ],
};

export function Sidebar({ 
  userType = 'admin', 
  activeTab, 
  onTabChange, 
  userName = '', 
  userEmail = '',
  barbeariaName = '',
  onLogout 
}) {
  const [collapsed, setCollapsed] = useState(false);
  const menuItems = menuConfigs[userType] || menuConfigs.admin;

  return (
    <aside 
      className={`fixed left-0 top-0 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col transition-all duration-300 z-40 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-800 rounded-lg flex items-center justify-center">
                <Scissors className="h-5 w-5 text-white" />
              </div>
              <div className="overflow-hidden">
                <h1 className="text-white font-bold text-sm truncate">
                  {barbeariaName || 'Barbearia'}
                </h1>
                <span className="text-zinc-500 text-xs capitalize">{userType}</span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-800 rounded-lg flex items-center justify-center mx-auto">
              <Scissors className="h-5 w-5 text-white" />
            </div>
          )}
        </div>
        
        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 w-6 h-6 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive 
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' 
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
              title={collapsed ? item.label : ''}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
              {!collapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-3 border-t border-zinc-800">
        {!collapsed && (
          <div className="mb-3 px-2">
            <p className="text-white text-sm font-medium truncate">{userName}</p>
            <p className="text-zinc-500 text-xs truncate">{userEmail}</p>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={onLogout}
          className={`w-full text-red-400 hover:text-red-300 hover:bg-red-900/20 ${
            collapsed ? 'px-0 justify-center' : 'justify-start'
          }`}
          title={collapsed ? 'Terminar Sessão' : ''}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-2">Terminar Sessão</span>}
        </Button>
      </div>
    </aside>
  );
}

// Layout wrapper com Sidebar
export function SidebarLayout({ children, ...sidebarProps }) {
  const [collapsed, setCollapsed] = useState(false);
  
  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar {...sidebarProps} />
      <main 
        className={`transition-all duration-300 ${
          collapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
