'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, Users, Calendar, TrendingUp, Activity, Settings,
  ChevronRight, Search, MoreVertical, Power, Eye, RefreshCw,
  BarChart3, Shield, Clock, CheckCircle, XCircle, AlertCircle,
  UserPlus, Store, CreditCard, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmModal, AlertModal } from '@/components/ui/modals';

export default function MasterBackoffice() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState(null);
  const [barbearias, setBarbearias] = useState([]);
  const [atividade, setAtividade] = useState(null);
  
  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, barbearia: null });
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        localStorage.removeItem('token');
        router.push('/');
        return;
      }

      const data = await res.json();
      
      if (data.user.tipo !== 'super_admin') {
        router.push('/');
        return;
      }

      setUser(data.user);
      fetchDashboard(token);
      fetchBarbearias(token);
      fetchAtividade(token);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async (token) => {
    try {
      const res = await fetch('/api/master/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Dashboard error:', error);
    }
  };

  const fetchBarbearias = async (token) => {
    try {
      const res = await fetch('/api/master/barbearias', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBarbearias(data.barbearias);
      }
    } catch (error) {
      console.error('Barbearias error:', error);
    }
  };

  const fetchAtividade = async (token) => {
    try {
      const res = await fetch('/api/master/atividade', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAtividade(data);
      }
    } catch (error) {
      console.error('Atividade error:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const token = localStorage.getItem('token');
    await Promise.all([
      fetchDashboard(token),
      fetchBarbearias(token),
      fetchAtividade(token)
    ]);
    setRefreshing(false);
  };

  const handleToggleBarbearia = async () => {
    const { barbearia } = confirmModal;
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`/api/master/barbearias/${barbearia._id}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setAlertModal({
          isOpen: true,
          title: 'Sucesso',
          message: data.message,
          type: 'success'
        });
        fetchBarbearias(token);
        fetchDashboard(token);
      }
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: 'Erro',
        message: 'Erro ao atualizar barbearia',
        type: 'error'
      });
    }

    setConfirmModal({ isOpen: false, barbearia: null });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const filteredBarbearias = barbearias.filter(b => 
    b.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.owner?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (!user || user.tipo !== 'super_admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">BarbePRO</h1>
                <p className="text-xs text-violet-400">Master Backoffice</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-slate-400 hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">{user.nome}</p>
                  <p className="text-xs text-violet-400">Super Admin</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-full flex items-center justify-center text-white font-bold">
                  {user.nome?.charAt(0).toUpperCase()}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-400"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto py-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'barbearias', label: 'Barbearias', icon: Store },
              { id: 'atividade', label: 'Atividade', icon: Activity },
              { id: 'configuracoes', label: 'Configurações', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && dashboardData && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Barbearias */}
              <Card className="bg-gradient-to-br from-violet-900/40 to-purple-900/40 border-violet-800/50 hover:border-violet-600/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-violet-300 text-sm font-medium">Total Barbearias</p>
                      <p className="text-4xl font-bold text-white mt-2">{dashboardData.barbearias.total}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-green-400 text-sm flex items-center gap-1">
                          <ArrowUpRight className="h-3 w-3" />
                          {dashboardData.barbearias.novas30Dias}
                        </span>
                        <span className="text-slate-500 text-xs">últimos 30 dias</span>
                      </div>
                    </div>
                    <div className="w-14 h-14 bg-violet-600/30 rounded-2xl flex items-center justify-center">
                      <Building2 className="h-7 w-7 text-violet-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Utilizadores */}
              <Card className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border-blue-800/50 hover:border-blue-600/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-300 text-sm font-medium">Total Utilizadores</p>
                      <p className="text-4xl font-bold text-white mt-2">{dashboardData.utilizadores.total}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="text-slate-400">{dashboardData.utilizadores.clientes} clientes</span>
                        <span className="text-slate-400">{dashboardData.utilizadores.barbeiros} barbeiros</span>
                      </div>
                    </div>
                    <div className="w-14 h-14 bg-blue-600/30 rounded-2xl flex items-center justify-center">
                      <Users className="h-7 w-7 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Marcações */}
              <Card className="bg-gradient-to-br from-emerald-900/40 to-green-900/40 border-emerald-800/50 hover:border-emerald-600/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-300 text-sm font-medium">Total Marcações</p>
                      <p className="text-4xl font-bold text-white mt-2">{dashboardData.marcacoes.total}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-emerald-400 text-sm flex items-center gap-1">
                          <ArrowUpRight className="h-3 w-3" />
                          {dashboardData.marcacoes.ultimos7Dias}
                        </span>
                        <span className="text-slate-500 text-xs">últimos 7 dias</span>
                      </div>
                    </div>
                    <div className="w-14 h-14 bg-emerald-600/30 rounded-2xl flex items-center justify-center">
                      <Calendar className="h-7 w-7 text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subscriptions */}
              <Card className="bg-gradient-to-br from-amber-900/40 to-orange-900/40 border-amber-800/50 hover:border-amber-600/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-300 text-sm font-medium">Subscriptions Ativas</p>
                      <p className="text-4xl font-bold text-white mt-2">{dashboardData.subscriptions.ativas}</p>
                      <p className="text-slate-500 text-xs mt-2">Receita preparada para futura integração</p>
                    </div>
                    <div className="w-14 h-14 bg-amber-600/30 rounded-2xl flex items-center justify-center">
                      <CreditCard className="h-7 w-7 text-amber-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Second Row Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Status Barbearias */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Store className="h-5 w-5 text-violet-400" />
                    Status Barbearias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-900/20 rounded-lg border border-green-800/30">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        <span className="text-slate-300">Ativas</span>
                      </div>
                      <span className="text-2xl font-bold text-green-400">{dashboardData.barbearias.ativas}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-900/20 rounded-lg border border-red-800/30">
                      <div className="flex items-center gap-3">
                        <XCircle className="h-5 w-5 text-red-400" />
                        <span className="text-slate-300">Inativas</span>
                      </div>
                      <span className="text-2xl font-bold text-red-400">{dashboardData.barbearias.inativas}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Marcações */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-emerald-400" />
                    Status Marcações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-yellow-900/20 rounded-lg border border-yellow-800/30 text-center">
                      <p className="text-2xl font-bold text-yellow-400">{dashboardData.marcacoes.pendentes}</p>
                      <p className="text-xs text-slate-400">Pendentes</p>
                    </div>
                    <div className="p-3 bg-green-900/20 rounded-lg border border-green-800/30 text-center">
                      <p className="text-2xl font-bold text-green-400">{dashboardData.marcacoes.aceitas}</p>
                      <p className="text-xs text-slate-400">Aceitas</p>
                    </div>
                    <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-800/30 text-center">
                      <p className="text-2xl font-bold text-blue-400">{dashboardData.marcacoes.concluidas}</p>
                      <p className="text-xs text-slate-400">Concluídas</p>
                    </div>
                    <div className="p-3 bg-red-900/20 rounded-lg border border-red-800/30 text-center">
                      <p className="text-2xl font-bold text-red-400">{dashboardData.marcacoes.canceladas}</p>
                      <p className="text-xs text-slate-400">Canceladas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tipos de Utilizadores */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-400" />
                    Tipos de Utilizadores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: 'Owners', value: dashboardData.utilizadores.owners, color: 'violet' },
                      { label: 'Admins', value: dashboardData.utilizadores.admins, color: 'purple' },
                      { label: 'Barbeiros', value: dashboardData.utilizadores.barbeiros, color: 'blue' },
                      { label: 'Clientes', value: dashboardData.utilizadores.clientes, color: 'emerald' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">{item.label}</span>
                        <div className="flex items-center gap-3">
                          <div className={`h-2 bg-${item.color}-500 rounded-full`} style={{ width: `${Math.max((item.value / dashboardData.utilizadores.total) * 100, 5)}px` }}></div>
                          <span className="text-white font-semibold w-8 text-right">{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Barbearias */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-violet-400" />
                    Últimas Barbearias Registadas
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('barbearias')}
                    className="text-violet-400 hover:text-violet-300"
                  >
                    Ver todas
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {barbearias.slice(0, 5).map((b) => (
                    <div key={b._id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg flex items-center justify-center text-white font-bold">
                          {b.nome?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium">{b.nome}</p>
                          <p className="text-slate-500 text-xs">{b.owner?.email || 'Sem owner'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={b.ativa !== false ? 'bg-green-900/50 text-green-400 border-green-700' : 'bg-red-900/50 text-red-400 border-red-700'}>
                          {b.ativa !== false ? 'Ativa' : 'Inativa'}
                        </Badge>
                        <span className="text-slate-500 text-xs">
                          {b.criado_em ? new Date(b.criado_em).toLocaleDateString('pt-PT') : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Barbearias Tab */}
        {activeTab === 'barbearias' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Pesquisar barbearias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div className="flex gap-2">
                <Badge className="bg-green-900/50 text-green-400 border-green-700 px-3 py-1">
                  {barbearias.filter(b => b.ativa !== false).length} Ativas
                </Badge>
                <Badge className="bg-red-900/50 text-red-400 border-red-700 px-3 py-1">
                  {barbearias.filter(b => b.ativa === false).length} Inativas
                </Badge>
              </div>
            </div>

            {/* Barbearias Table */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800 hover:bg-slate-800/50">
                        <TableHead className="text-slate-400">Barbearia</TableHead>
                        <TableHead className="text-slate-400">Owner/Admin</TableHead>
                        <TableHead className="text-slate-400 text-center">Utilizadores</TableHead>
                        <TableHead className="text-slate-400 text-center">Marcações</TableHead>
                        <TableHead className="text-slate-400">Plano</TableHead>
                        <TableHead className="text-slate-400">Registo</TableHead>
                        <TableHead className="text-slate-400 text-center">Estado</TableHead>
                        <TableHead className="text-slate-400 text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBarbearias.map((b) => (
                        <TableRow key={b._id} className="border-slate-800 hover:bg-slate-800/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg flex items-center justify-center text-white font-bold">
                                {b.nome?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-white font-medium">{b.nome}</p>
                                <p className="text-slate-500 text-xs">/{b.slug}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-white text-sm">{b.owner?.nome || 'N/A'}</p>
                              <p className="text-slate-500 text-xs">{b.owner?.email || 'Sem email'}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-white font-semibold">{b.totalUtilizadores || 0}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-white font-semibold">{b.totalMarcacoes || 0}</span>
                          </TableCell>
                          <TableCell>
                            {b.subscription ? (
                              <Badge className={
                                b.subscription.plano === 'enterprise' ? 'bg-violet-900/50 text-violet-400 border-violet-700' :
                                b.subscription.plano === 'pro' ? 'bg-blue-900/50 text-blue-400 border-blue-700' :
                                'bg-slate-800 text-slate-400 border-slate-600'
                              }>
                                {b.subscription.plano?.toUpperCase() || 'BÁSICO'}
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-800 text-slate-500 border-slate-600">SEM PLANO</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm">
                            {b.criado_em ? new Date(b.criado_em).toLocaleDateString('pt-PT') : 'N/A'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={b.ativa !== false ? 'bg-green-900/50 text-green-400 border-green-700' : 'bg-red-900/50 text-red-400 border-red-700'}>
                              {b.ativa !== false ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                                <DropdownMenuItem 
                                  className="text-slate-300 hover:text-white focus:text-white focus:bg-slate-700"
                                  onClick={() => window.open(`/barbearia/${b.slug}`, '_blank')}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Página
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className={`focus:bg-slate-700 ${b.ativa !== false ? 'text-red-400 hover:text-red-300 focus:text-red-300' : 'text-green-400 hover:text-green-300 focus:text-green-300'}`}
                                  onClick={() => setConfirmModal({ isOpen: true, barbearia: b })}
                                >
                                  <Power className="h-4 w-4 mr-2" />
                                  {b.ativa !== false ? 'Desativar' : 'Ativar'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredBarbearias.length === 0 && (
                  <div className="text-center py-12">
                    <Store className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Nenhuma barbearia encontrada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Atividade Tab */}
        {activeTab === 'atividade' && atividade && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Últimas Marcações */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-400" />
                  Últimas Marcações
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Marcações recentes em todas as barbearias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {atividade.ultimasMarcacoes?.map((m) => (
                    <div key={m._id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{m.cliente_nome || 'Cliente'}</span>
                        <Badge className={
                          m.status === 'pendente' ? 'bg-yellow-900/50 text-yellow-400 border-yellow-700' :
                          m.status === 'aceita' ? 'bg-green-900/50 text-green-400 border-green-700' :
                          m.status === 'concluida' ? 'bg-blue-900/50 text-blue-400 border-blue-700' :
                          'bg-red-900/50 text-red-400 border-red-700'
                        }>
                          {m.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-violet-400">{m.barbearia_nome}</span>
                        <span className="text-slate-500">
                          {m.data} às {m.hora}
                        </span>
                      </div>
                    </div>
                  ))}

                  {(!atividade.ultimasMarcacoes || atividade.ultimasMarcacoes.length === 0) && (
                    <div className="text-center py-8">
                      <Calendar className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">Sem marcações recentes</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Últimos Registos */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-blue-400" />
                  Últimos Registos
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Novos utilizadores na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {atividade.ultimosRegistos?.map((u) => (
                    <div key={u._id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {u.nome?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{u.nome}</p>
                          <p className="text-slate-500 text-xs">{u.email}</p>
                        </div>
                        <Badge className={
                          u.tipo === 'owner' ? 'bg-violet-900/50 text-violet-400 border-violet-700' :
                          u.tipo === 'admin' ? 'bg-purple-900/50 text-purple-400 border-purple-700' :
                          u.tipo === 'barbeiro' ? 'bg-blue-900/50 text-blue-400 border-blue-700' :
                          'bg-emerald-900/50 text-emerald-400 border-emerald-700'
                        }>
                          {u.tipo}
                        </Badge>
                      </div>
                      <p className="text-slate-600 text-xs mt-2">
                        {u.criado_em ? new Date(u.criado_em).toLocaleString('pt-PT') : 'Data não disponível'}
                      </p>
                    </div>
                  ))}

                  {(!atividade.ultimosRegistos || atividade.ultimosRegistos.length === 0) && (
                    <div className="text-center py-8">
                      <Users className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">Sem registos recentes</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Configurações Tab */}
        {activeTab === 'configuracoes' && (
          <div className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5 text-slate-400" />
                  Configurações do Sistema
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configurações gerais do SaaS BarbePRO
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-6 bg-slate-800/50 rounded-lg border border-slate-700">
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-violet-400" />
                      Informações do Super Admin
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-slate-500 text-xs uppercase">Nome</p>
                        <p className="text-white">{user.nome}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase">Email</p>
                        <p className="text-white">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-800/50 rounded-lg border border-slate-700">
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-amber-400" />
                      Faturamento (Futuro)
                    </h3>
                    <p className="text-slate-400 text-sm">
                      A integração de faturamento será implementada numa versão futura. 
                      Esta área permitirá visualizar receitas, faturas e gerir pagamentos das subscriptions.
                    </p>
                  </div>

                  <div className="p-6 bg-amber-900/20 rounded-lg border border-amber-800/30">
                    <h3 className="text-amber-400 font-semibold mb-2 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      MVP - Versão Inicial
                    </h3>
                    <p className="text-slate-400 text-sm">
                      Este é o Backoffice Master em versão MVP. Funcionalidades avançadas como relatórios 
                      detalhados, gestão de planos e faturamento serão adicionadas em versões futuras.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, barbearia: null })}
        onConfirm={handleToggleBarbearia}
        title={confirmModal.barbearia?.ativa !== false ? 'Desativar Barbearia' : 'Ativar Barbearia'}
        message={`Tem a certeza que deseja ${confirmModal.barbearia?.ativa !== false ? 'desativar' : 'ativar'} a barbearia "${confirmModal.barbearia?.nome}"?`}
        confirmText={confirmModal.barbearia?.ativa !== false ? 'Desativar' : 'Ativar'}
        cancelText="Cancelar"
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
}
