'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, Users, Calendar, TrendingUp, Activity, Settings,
  ChevronRight, Search, MoreVertical, Power, Eye, RefreshCw,
  BarChart3, Shield, Clock, CheckCircle, XCircle, AlertCircle,
  UserPlus, Store, CreditCard, ArrowUpRight, ArrowDownRight,
  HelpCircle, MessageSquare, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { FooterSimple } from '@/components/ui/footer';

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
  const [suporteTickets, setSuporteTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [respostaTexto, setRespostaTexto] = useState('');
  const [filtroStatusSuporte, setFiltroStatusSuporte] = useState('todos');
  
  // Hero image states
  const [heroImage, setHeroImage] = useState(null);
  const [heroImageFile, setHeroImageFile] = useState(null);
  const [heroImagePreview, setHeroImagePreview] = useState('');
  const [uploadingHero, setUploadingHero] = useState(false);
  
  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, barbearia: null });
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, []);

  // Atualizar tickets quando o filtro de status mudar
  useEffect(() => {
    if (user && activeTab === 'suporte') {
      const token = localStorage.getItem('token');
      fetchSuporteTickets(token);
    }
  }, [filtroStatusSuporte, activeTab]);

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
      fetchSuporteTickets(token);
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

  const fetchSuporteTickets = async (token) => {
    try {
      const url = filtroStatusSuporte === 'todos' 
        ? '/api/suporte'
        : `/api/suporte?status=${filtroStatusSuporte}`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSuporteTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Suporte tickets error:', error);
    }
  };

  const handleResponderTicket = async (ticketId, resposta, novoStatus) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/suporte/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          resposta, 
          status: novoStatus 
        })
      });

      if (res.ok) {
        setAlertModal({
          isOpen: true,
          title: 'Sucesso',
          message: 'Resposta enviada com sucesso!',
          type: 'success'
        });
        setSelectedTicket(null);
        setRespostaTexto('');
        fetchSuporteTickets(token);
      } else {
        const data = await res.json();
        setAlertModal({
          isOpen: true,
          title: 'Erro',
          message: data.error || 'Erro ao enviar resposta',
          type: 'error'
        });
      }
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: 'Erro',
        message: 'Erro de conexão',
        type: 'error'
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const token = localStorage.getItem('token');
    await Promise.all([
      fetchDashboard(token),
      fetchBarbearias(token),
      fetchAtividade(token),
      fetchSuporteTickets(token)
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-violet-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (!user || user.tipo !== 'super_admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-violet-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CutHub</h1>
                <p className="text-xs text-violet-600 font-medium">Master Backoffice</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-gray-500 hover:text-violet-600 hover:bg-violet-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.nome}</p>
                  <p className="text-xs text-violet-600">Super Admin</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-violet-200">
                  {user.nome?.charAt(0).toUpperCase()}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600 hover:bg-red-50"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto py-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'barbearias', label: 'Barbearias', icon: Store },
              { id: 'atividade', label: 'Atividade', icon: Activity },
              { id: 'suporte', label: 'Suporte', icon: HelpCircle },
              { id: 'configuracoes', label: 'Configurações', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-200'
                    : 'text-gray-600 hover:text-violet-600 hover:bg-violet-50'
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
              <Card className="bg-white border-gray-200 shadow-lg shadow-violet-100/50 hover:shadow-xl hover:shadow-violet-100 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-violet-600 text-sm font-medium">Total Barbearias</p>
                      <p className="text-4xl font-bold text-gray-900 mt-2">{dashboardData.barbearias.total}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-emerald-600 text-sm flex items-center gap-1 font-medium">
                          <ArrowUpRight className="h-3 w-3" />
                          {dashboardData.barbearias.novas30Dias}
                        </span>
                        <span className="text-gray-400 text-xs">últimos 30 dias</span>
                      </div>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center">
                      <Building2 className="h-7 w-7 text-violet-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Utilizadores */}
              <Card className="bg-white border-gray-200 shadow-lg shadow-blue-100/50 hover:shadow-xl hover:shadow-blue-100 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Total Utilizadores</p>
                      <p className="text-4xl font-bold text-gray-900 mt-2">{dashboardData.utilizadores.total}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="text-gray-500">{dashboardData.utilizadores.clientes} clientes</span>
                        <span className="text-gray-500">{dashboardData.utilizadores.barbeiros} barbeiros</span>
                      </div>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center">
                      <Users className="h-7 w-7 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Marcações */}
              <Card className="bg-white border-gray-200 shadow-lg shadow-emerald-100/50 hover:shadow-xl hover:shadow-emerald-100 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-600 text-sm font-medium">Total Marcações</p>
                      <p className="text-4xl font-bold text-gray-900 mt-2">{dashboardData.marcacoes.total}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-emerald-600 text-sm flex items-center gap-1 font-medium">
                          <ArrowUpRight className="h-3 w-3" />
                          {dashboardData.marcacoes.ultimos7Dias}
                        </span>
                        <span className="text-gray-400 text-xs">últimos 7 dias</span>
                      </div>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl flex items-center justify-center">
                      <Calendar className="h-7 w-7 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subscriptions */}
              <Card className="bg-white border-gray-200 shadow-lg shadow-amber-100/50 hover:shadow-xl hover:shadow-amber-100 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-600 text-sm font-medium">Subscriptions Ativas</p>
                      <p className="text-4xl font-bold text-gray-900 mt-2">{dashboardData.subscriptions.ativas}</p>
                      <p className="text-gray-400 text-xs mt-2">Faturamento em breve</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center">
                      <CreditCard className="h-7 w-7 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Second Row Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Status Barbearias */}
              <Card className="bg-white border-gray-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <Store className="h-5 w-5 text-violet-600" />
                    Status Barbearias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                        <span className="text-gray-700 font-medium">Ativas</span>
                      </div>
                      <span className="text-2xl font-bold text-emerald-600">{dashboardData.barbearias.ativas}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-3">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="text-gray-700 font-medium">Inativas</span>
                      </div>
                      <span className="text-2xl font-bold text-red-600">{dashboardData.barbearias.inativas}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Marcações */}
              <Card className="bg-white border-gray-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                    Status Marcações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-center">
                      <p className="text-2xl font-bold text-amber-600">{dashboardData.marcacoes.pendentes}</p>
                      <p className="text-xs text-gray-600">Pendentes</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
                      <p className="text-2xl font-bold text-emerald-600">{dashboardData.marcacoes.aceitas}</p>
                      <p className="text-xs text-gray-600">Aceitas</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                      <p className="text-2xl font-bold text-blue-600">{dashboardData.marcacoes.concluidas}</p>
                      <p className="text-xs text-gray-600">Concluídas</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-center">
                      <p className="text-2xl font-bold text-red-600">{dashboardData.marcacoes.canceladas}</p>
                      <p className="text-xs text-gray-600">Canceladas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tipos de Utilizadores */}
              <Card className="bg-white border-gray-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
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
                        <span className="text-gray-600 text-sm">{item.label}</span>
                        <div className="flex items-center gap-3">
                          <div className={`h-2 rounded-full bg-${item.color}-500`} style={{ width: `${Math.max((item.value / dashboardData.utilizadores.total) * 100, 10)}px` }}></div>
                          <span className="text-gray-900 font-semibold w-8 text-right">{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Barbearias */}
            <Card className="bg-white border-gray-200 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-violet-600" />
                    Últimas Barbearias Registadas
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('barbearias')}
                    className="text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                  >
                    Ver todas
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {barbearias.slice(0, 5).map((b) => (
                    <div key={b._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-violet-50 transition-colors border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                          {b.nome?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">{b.nome}</p>
                          <p className="text-gray-500 text-xs">{b.owner?.email || 'Sem owner'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={b.ativa !== false ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-red-100 text-red-700 border-red-300'}>
                          {b.ativa !== false ? 'Ativa' : 'Inativa'}
                        </Badge>
                        <span className="text-gray-400 text-xs">
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar barbearias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-gray-300 text-gray-900 focus:border-violet-500 focus:ring-violet-500"
                />
              </div>
              <div className="flex gap-2">
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 px-3 py-1">
                  {barbearias.filter(b => b.ativa !== false).length} Ativas
                </Badge>
                <Badge className="bg-red-100 text-red-700 border-red-300 px-3 py-1">
                  {barbearias.filter(b => b.ativa === false).length} Inativas
                </Badge>
              </div>
            </div>

            {/* Barbearias Table */}
            <Card className="bg-white border-gray-200 shadow-lg">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200 bg-gray-50">
                        <TableHead className="text-gray-600 font-semibold">Barbearia</TableHead>
                        <TableHead className="text-gray-600 font-semibold">Owner/Admin</TableHead>
                        <TableHead className="text-gray-600 font-semibold text-center">Utilizadores</TableHead>
                        <TableHead className="text-gray-600 font-semibold text-center">Marcações</TableHead>
                        <TableHead className="text-gray-600 font-semibold">Plano</TableHead>
                        <TableHead className="text-gray-600 font-semibold">Registo</TableHead>
                        <TableHead className="text-gray-600 font-semibold text-center">Estado</TableHead>
                        <TableHead className="text-gray-600 font-semibold text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBarbearias.map((b) => (
                        <TableRow key={b._id} className="border-gray-200 hover:bg-violet-50/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                                {b.nome?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-gray-900 font-medium">{b.nome}</p>
                                <p className="text-gray-500 text-xs">/{b.slug}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-gray-900 text-sm">{b.owner?.nome || 'N/A'}</p>
                              <p className="text-gray-500 text-xs">{b.owner?.email || 'Sem email'}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-gray-900 font-semibold">{b.totalUtilizadores || 0}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-gray-900 font-semibold">{b.totalMarcacoes || 0}</span>
                          </TableCell>
                          <TableCell>
                            {b.subscription ? (
                              <Badge className={
                                b.subscription.plano === 'enterprise' ? 'bg-violet-100 text-violet-700 border-violet-300' :
                                b.subscription.plano === 'pro' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                'bg-gray-100 text-gray-600 border-gray-300'
                              }>
                                {b.subscription.plano?.toUpperCase() || 'BÁSICO'}
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-500 border-gray-300">SEM PLANO</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-600 text-sm">
                            {b.criado_em ? new Date(b.criado_em).toLocaleDateString('pt-PT') : 'N/A'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={b.ativa !== false ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-red-100 text-red-700 border-red-300'}>
                              {b.ativa !== false ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-violet-600 hover:bg-violet-50">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white border-gray-200 shadow-lg">
                                <DropdownMenuItem 
                                  className="text-gray-700 hover:text-violet-600 focus:text-violet-600 focus:bg-violet-50"
                                  onClick={() => window.open(`/barbearia/${b.slug}`, '_blank')}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Página
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className={`focus:bg-gray-50 ${b.ativa !== false ? 'text-red-600 hover:text-red-700 focus:text-red-700' : 'text-emerald-600 hover:text-emerald-700 focus:text-emerald-700'}`}
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
                    <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma barbearia encontrada</p>
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
            <Card className="bg-white border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  Últimas Marcações
                </CardTitle>
                <CardDescription className="text-gray-500">
                  Marcações recentes em todas as barbearias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {atividade.ultimasMarcacoes?.map((m) => (
                    <div key={m._id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-violet-300 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-900 font-medium">{m.cliente_nome || 'Cliente'}</span>
                        <Badge className={
                          m.status === 'pendente' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                          m.status === 'aceita' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                          m.status === 'concluida' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                          'bg-red-100 text-red-700 border-red-300'
                        }>
                          {m.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-violet-600 font-medium">{m.barbearia_nome}</span>
                        <span className="text-gray-500">
                          {m.data} às {m.hora}
                        </span>
                      </div>
                    </div>
                  ))}

                  {(!atividade.ultimasMarcacoes || atividade.ultimasMarcacoes.length === 0) && (
                    <div className="text-center py-8">
                      <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Sem marcações recentes</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Últimos Registos */}
            <Card className="bg-white border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                  Últimos Registos
                </CardTitle>
                <CardDescription className="text-gray-500">
                  Novos utilizadores na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {atividade.ultimosRegistos?.map((u) => (
                    <div key={u._id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {u.nome?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">{u.nome}</p>
                          <p className="text-gray-500 text-xs">{u.email}</p>
                        </div>
                        <Badge className={
                          u.tipo === 'owner' ? 'bg-violet-100 text-violet-700 border-violet-300' :
                          u.tipo === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-300' :
                          u.tipo === 'barbeiro' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                          'bg-emerald-100 text-emerald-700 border-emerald-300'
                        }>
                          {u.tipo}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-xs mt-2">
                        {u.criado_em ? new Date(u.criado_em).toLocaleString('pt-PT') : 'Data não disponível'}
                      </p>
                    </div>
                  ))}

                  {(!atividade.ultimosRegistos || atividade.ultimosRegistos.length === 0) && (
                    <div className="text-center py-8">
                      <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Sem registos recentes</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Suporte Tab */}
        {activeTab === 'suporte' && (
          <div className="space-y-6">
            {/* Filtros */}
            <div className="flex gap-2">
              {[
                { id: 'todos', label: 'Todos', count: suporteTickets.length },
                { id: 'aberto', label: 'Abertos', count: suporteTickets.filter(t => t.status === 'aberto').length },
                { id: 'em_andamento', label: 'Em Andamento', count: suporteTickets.filter(t => t.status === 'em_andamento').length },
                { id: 'resolvido', label: 'Resolvidos', count: suporteTickets.filter(t => t.status === 'resolvido').length },
                { id: 'fechado', label: 'Fechados', count: suporteTickets.filter(t => t.status === 'fechado').length },
              ].map((filtro) => (
                <Button
                  key={filtro.id}
                  size="sm"
                  onClick={() => setFiltroStatusSuporte(filtro.id)}
                  className={filtroStatusSuporte === filtro.id 
                    ? 'bg-violet-600 text-white' 
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-violet-50'
                  }
                >
                  {filtro.label} ({filtro.count})
                </Button>
              ))}
            </div>

            {/* Lista de Tickets */}
            <Card className="bg-white border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-violet-600" />
                  Tickets de Suporte
                </CardTitle>
                <CardDescription className="text-gray-500">
                  Gerir pedidos de suporte de todas as barbearias
                </CardDescription>
              </CardHeader>
              <CardContent>
                {suporteTickets.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum ticket de suporte</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {suporteTickets
                      .filter(ticket => filtroStatusSuporte === 'todos' || ticket.status === filtroStatusSuporte)
                      .map((ticket) => (
                        <Card 
                          key={ticket._id} 
                          className="bg-gray-50 border-gray-200 hover:border-violet-300 transition-all cursor-pointer"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="text-gray-900 font-semibold">{ticket.assunto}</h4>
                                  <Badge className={
                                    ticket.status === 'aberto' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                                    ticket.status === 'em_andamento' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                    ticket.status === 'resolvido' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                                    'bg-gray-100 text-gray-600 border-gray-300'
                                  }>
                                    {ticket.status === 'em_andamento' ? 'Em Andamento' : 
                                     ticket.status === 'aberto' ? 'Aberto' :
                                     ticket.status === 'resolvido' ? 'Resolvido' : 'Fechado'}
                                  </Badge>
                                  <Badge className={
                                    ticket.prioridade === 'urgente' ? 'bg-red-100 text-red-700 border-red-300' :
                                    ticket.prioridade === 'alta' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                                    ticket.prioridade === 'normal' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                    'bg-gray-100 text-gray-600 border-gray-300'
                                  }>
                                    {ticket.prioridade.charAt(0).toUpperCase() + ticket.prioridade.slice(1)}
                                  </Badge>
                                </div>
                                <p className="text-gray-600 text-sm line-clamp-2 mb-2">{ticket.mensagem}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Store className="h-3 w-3" />
                                    {ticket.barbearia_nome || 'Sem barbearia'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {ticket.user_nome} ({ticket.user_email})
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(ticket.criado_em).toLocaleDateString('pt-PT')} às{' '}
                                    {new Date(ticket.criado_em).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                              {ticket.respostas?.length > 0 && (
                                <Badge className="bg-violet-100 text-violet-700 border-violet-300">
                                  {ticket.respostas.length} resposta(s)
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Configurações Tab */}
        {activeTab === 'configuracoes' && (
          <div className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  Configurações do Sistema
                </CardTitle>
                <CardDescription className="text-gray-500">
                  Configurações gerais do SaaS CutHub
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg border border-violet-200">
                    <h3 className="text-gray-900 font-semibold mb-2 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-violet-600" />
                      Informações do Super Admin
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-gray-500 text-xs uppercase font-medium">Nome</p>
                        <p className="text-gray-900 font-medium">{user.nome}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase font-medium">Email</p>
                        <p className="text-gray-900 font-medium">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                    <h3 className="text-gray-900 font-semibold mb-2 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-amber-600" />
                      Faturamento (Futuro)
                    </h3>
                    <p className="text-gray-600 text-sm">
                      A integração de faturamento será implementada numa versão futura. 
                      Esta área permitirá visualizar receitas, faturas e gerir pagamentos das subscriptions.
                    </p>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <h3 className="text-blue-700 font-semibold mb-2 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      MVP - Versão Inicial
                    </h3>
                    <p className="text-gray-600 text-sm">
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

      {/* Modal de Detalhes do Ticket */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="bg-white border-gray-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-gray-900 text-xl mb-2">{selectedTicket.assunto}</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={
                      selectedTicket.status === 'aberto' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                      selectedTicket.status === 'em_andamento' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                      selectedTicket.status === 'resolvido' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                      'bg-gray-100 text-gray-600 border-gray-300'
                    }>
                      {selectedTicket.status === 'em_andamento' ? 'Em Andamento' : 
                       selectedTicket.status === 'aberto' ? 'Aberto' :
                       selectedTicket.status === 'resolvido' ? 'Resolvido' : 'Fechado'}
                    </Badge>
                    <Badge className={
                      selectedTicket.prioridade === 'urgente' ? 'bg-red-100 text-red-700 border-red-300' :
                      selectedTicket.prioridade === 'alta' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                      selectedTicket.prioridade === 'normal' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                      'bg-gray-100 text-gray-600 border-gray-300'
                    }>
                      {selectedTicket.prioridade.charAt(0).toUpperCase() + selectedTicket.prioridade.slice(1)}
                    </Badge>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedTicket(null);
                    setRespostaTexto('');
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Info do Ticket */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="text-gray-500 text-xs uppercase font-medium mb-1">Barbearia</p>
                  <p className="text-gray-900 font-medium">{selectedTicket.barbearia_nome || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase font-medium mb-1">Utilizador</p>
                  <p className="text-gray-900 font-medium">{selectedTicket.user_nome}</p>
                  <p className="text-gray-600 text-xs">{selectedTicket.user_email}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase font-medium mb-1">Data de Criação</p>
                  <p className="text-gray-900 text-sm">
                    {new Date(selectedTicket.criado_em).toLocaleDateString('pt-PT')} às{' '}
                    {new Date(selectedTicket.criado_em).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase font-medium mb-1">Tipo de Utilizador</p>
                  <Badge className="bg-violet-100 text-violet-700 border-violet-300">
                    {selectedTicket.user_tipo}
                  </Badge>
                </div>
              </div>

              {/* Mensagem Original */}
              <div>
                <h4 className="text-gray-900 font-semibold mb-2">Mensagem:</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.mensagem}</p>
                </div>
              </div>

              {/* Respostas Anteriores */}
              {selectedTicket.respostas && selectedTicket.respostas.length > 0 && (
                <div>
                  <h4 className="text-gray-900 font-semibold mb-3">Histórico de Respostas:</h4>
                  <div className="space-y-3">
                    {selectedTicket.respostas.map((resposta, idx) => (
                      <div key={idx} className="bg-violet-50 border border-violet-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-violet-700 font-semibold text-sm">{resposta.autor}</span>
                          <span className="text-gray-500 text-xs">
                            {new Date(resposta.data).toLocaleDateString('pt-PT')} às{' '}
                            {new Date(resposta.data).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-gray-700">{resposta.texto}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulário de Resposta */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-gray-900 font-semibold mb-3">Adicionar Resposta:</h4>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-700 mb-2">Mensagem de Resposta</Label>
                    <textarea
                      value={respostaTexto}
                      onChange={(e) => setRespostaTexto(e.target.value)}
                      className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 min-h-[120px] focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                      placeholder="Escreva a sua resposta aqui..."
                    />
                  </div>

                  <div>
                    <Label className="text-gray-700 mb-2">Alterar Status</Label>
                    <div className="grid grid-cols-4 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-300 text-amber-700 hover:bg-amber-50"
                        onClick={() => handleResponderTicket(selectedTicket._id, respostaTexto, 'aberto')}
                        disabled={!respostaTexto.trim()}
                      >
                        Aberto
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        onClick={() => handleResponderTicket(selectedTicket._id, respostaTexto, 'em_andamento')}
                        disabled={!respostaTexto.trim()}
                      >
                        Em Andamento
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => handleResponderTicket(selectedTicket._id, respostaTexto, 'resolvido')}
                        disabled={!respostaTexto.trim()}
                      >
                        Resolvido
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        onClick={() => handleResponderTicket(selectedTicket._id, respostaTexto, 'fechado')}
                        disabled={!respostaTexto.trim()}
                      >
                        Fechar
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                      onClick={() => handleResponderTicket(selectedTicket._id, respostaTexto, selectedTicket.status)}
                      disabled={!respostaTexto.trim()}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Resposta
                    </Button>
                    <Button
                      variant="outline"
                      className="border-gray-300"
                      onClick={() => {
                        setSelectedTicket(null);
                        setRespostaTexto('');
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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

      {/* Footer */}
      <FooterSimple variant="light" />
    </div>
  );
}
