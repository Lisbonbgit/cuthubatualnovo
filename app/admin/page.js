'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LogOut, Plus, Trash2, Users, Scissors, Package, Calendar, Clock, Settings, UserCheck, Phone, Mail, Euro, Edit, CreditCard } from 'lucide-react';
import { MarcacaoDetailModal } from '@/components/ui/modals';

export default function AdminPanel() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [barbeiros, setBarbeiros] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [marcacoes, setMarcacoes] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [planosCliente, setPlanosCliente] = useState([]);
  const [barbeariaSettings, setBarbeariaSettings] = useState(null);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    fetchUserData(token);
  }, []);

  const fetchUserData = async (token) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.user.tipo !== 'admin') {
          router.push('/');
          return;
        }
        setUser(data.user);
        await Promise.all([
          fetchBarbeiros(token),
          fetchServicos(token),
          fetchProdutos(token),
          fetchMarcacoes(token),
          fetchHorarios(token),
          fetchBarbeariaSettings(token),
          fetchClientes(token),
          fetchPlanosCliente(token)
        ]);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchBarbeiros = async (token) => {
    const response = await fetch('/api/barbeiros', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setBarbeiros(data.barbeiros || []);
  };

  const fetchServicos = async (token) => {
    const response = await fetch('/api/servicos', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setServicos(data.servicos || []);
  };

  const fetchProdutos = async (token) => {
    const response = await fetch('/api/produtos', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setProdutos(data.produtos || []);
  };

  const fetchMarcacoes = async (token) => {
    const response = await fetch('/api/marcacoes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setMarcacoes(data.marcacoes || []);
  };

  const fetchHorarios = async (token) => {
    const response = await fetch('/api/horarios', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setHorarios(data.horarios || []);
  };

  const fetchBarbeariaSettings = async (token) => {
    const response = await fetch('/api/barbearia/settings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setBarbeariaSettings(data.barbearia || null);
    setSubscription(data.subscription || null);
  };

  const fetchClientes = async (token) => {
    const response = await fetch('/api/clientes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setClientes(data.clientes || []);
  };

  const fetchPlanosCliente = async (token) => {
    const response = await fetch('/api/planos-cliente', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setPlanosCliente(data.planos || []);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-amber-500 text-xl">A carregar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Painel Admin</h1>
            <p className="text-zinc-400 text-sm">{user?.nome}</p>
          </div>
          <Button
            variant="outline"
            className="border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="marcacoes" className="space-y-6">
          <TabsList className="bg-zinc-800 grid grid-cols-8 w-full">
            <TabsTrigger value="marcacoes" className="data-[state=active]:bg-amber-600">
              <Calendar className="mr-2 h-4 w-4" />
              Marcações
            </TabsTrigger>
            <TabsTrigger value="clientes" className="data-[state=active]:bg-amber-600">
              <UserCheck className="mr-2 h-4 w-4" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="barbeiros" className="data-[state=active]:bg-amber-600">
              <Users className="mr-2 h-4 w-4" />
              Barbeiros
            </TabsTrigger>
            <TabsTrigger value="servicos" className="data-[state=active]:bg-amber-600">
              <Scissors className="mr-2 h-4 w-4" />
              Serviços
            </TabsTrigger>
            <TabsTrigger value="produtos" className="data-[state=active]:bg-amber-600">
              <Package className="mr-2 h-4 w-4" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="planos" className="data-[state=active]:bg-amber-600">
              <CreditCard className="mr-2 h-4 w-4" />
              Planos
            </TabsTrigger>
            <TabsTrigger value="horarios" className="data-[state=active]:bg-amber-600">
              <Clock className="mr-2 h-4 w-4" />
              Horários
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="data-[state=active]:bg-amber-600">
              <Settings className="mr-2 h-4 w-4" />
              Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="marcacoes">
            <MarcacoesTab marcacoes={marcacoes} fetchMarcacoes={() => fetchMarcacoes(localStorage.getItem('token'))} />
          </TabsContent>

          <TabsContent value="clientes">
            <ClientesTab clientes={clientes} fetchClientes={() => fetchClientes(localStorage.getItem('token'))} />
          </TabsContent>

          <TabsContent value="barbeiros">
            <BarbeirosTab barbeiros={barbeiros} fetchBarbeiros={() => fetchBarbeiros(localStorage.getItem('token'))} />
          </TabsContent>

          <TabsContent value="servicos">
            <ServicosTab servicos={servicos} fetchServicos={() => fetchServicos(localStorage.getItem('token'))} />
          </TabsContent>

          <TabsContent value="produtos">
            <ProdutosTab produtos={produtos} fetchProdutos={() => fetchProdutos(localStorage.getItem('token'))} />
          </TabsContent>

          <TabsContent value="planos">
            <PlanosClienteTab 
              planos={planosCliente} 
              fetchPlanos={() => fetchPlanosCliente(localStorage.getItem('token'))}
              stripeConfigured={barbeariaSettings?.stripe_configured}
            />
          </TabsContent>

          <TabsContent value="horarios">
            <HorariosTab horarios={horarios} fetchHorarios={() => fetchHorarios(localStorage.getItem('token'))} />
          </TabsContent>

          <TabsContent value="configuracoes">
            <ConfiguracoesTab 
              barbearia={barbeariaSettings} 
              subscription={subscription}
              fetchSettings={() => fetchBarbeariaSettings(localStorage.getItem('token'))}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function MarcacoesTab({ marcacoes, fetchMarcacoes }) {
  const [filtroStatus, setFiltroStatus] = useState('todas');
  const [filtroBarbeiro, setFiltroBarbeiro] = useState('todos');
  const [barbeiros, setBarbeiros] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [viewMode, setViewMode] = useState('calendario');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedMarcacao, setSelectedMarcacao] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  
  // Nova Marcação Manual
  const [showNovaModal, setShowNovaModal] = useState(false);
  const [novoClienteMode, setNovoClienteMode] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedBarbeiroId, setSelectedBarbeiroId] = useState('');
  const [selectedServicoId, setSelectedServicoId] = useState('');
  const [selectedData, setSelectedData] = useState('');
  const [selectedHora, setSelectedHora] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [novoCliente, setNovoCliente] = useState({ nome: '', email: '', telemovel: '' });
  const [marcacaoLoading, setMarcacaoLoading] = useState(false);
  const [marcacaoError, setMarcacaoError] = useState('');

  useEffect(() => {
    fetchBarbeiros();
    fetchServicos();
    fetchClientes();
  }, []);

  const fetchBarbeiros = async () => {
    const response = await fetch('/api/barbeiros', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    setBarbeiros(data.barbeiros || []);
  };

  const fetchServicos = async () => {
    const response = await fetch('/api/servicos', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    setServicos(data.servicos || []);
  };

  const fetchClientes = async () => {
    const response = await fetch('/api/clientes', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    setClientes(data.clientes || []);
  };

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedBarbeiroId || !selectedData || !selectedServicoId) {
        setAvailableSlots([]);
        return;
      }
      
      try {
        const response = await fetch(
          `/api/marcacoes/slots?barbeiro_id=${selectedBarbeiroId}&data=${selectedData}&servico_id=${selectedServicoId}`,
          { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
        );
        const data = await response.json();
        setAvailableSlots(data.slots || []);
      } catch (error) {
        console.error('Erro ao carregar horários:', error);
        setAvailableSlots([]);
      }
    };
    
    fetchSlots();
  }, [selectedBarbeiroId, selectedData, selectedServicoId]);

  const handleNovaMarcacao = async (e) => {
    e.preventDefault();
    setMarcacaoError('');
    setMarcacaoLoading(true);

    try {
      let clienteId = selectedClienteId;

      // Se é novo cliente, criar primeiro
      if (novoClienteMode) {
        const clienteResponse = await fetch('/api/clientes/manual', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(novoCliente)
        });

        if (!clienteResponse.ok) {
          const data = await clienteResponse.json();
          throw new Error(data.error || 'Erro ao criar cliente');
        }

        const clienteData = await clienteResponse.json();
        clienteId = clienteData.cliente._id;
      }

      // Criar marcação
      const response = await fetch('/api/marcacoes/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          cliente_id: clienteId,
          barbeiro_id: selectedBarbeiroId,
          servico_id: selectedServicoId,
          data: selectedData,
          hora: selectedHora
        })
      });

      if (response.ok) {
        setShowNovaModal(false);
        resetNovaForm();
        fetchMarcacoes();
        fetchClientes();
      } else {
        const data = await response.json();
        setMarcacaoError(data.error || 'Erro ao criar marcação');
      }
    } catch (error) {
      setMarcacaoError(error.message);
    } finally {
      setMarcacaoLoading(false);
    }
  };

  const resetNovaForm = () => {
    setSelectedClienteId('');
    setSelectedBarbeiroId('');
    setSelectedServicoId('');
    setSelectedData('');
    setSelectedHora('');
    setNovoClienteMode(false);
    setNovoCliente({ nome: '', email: '', telemovel: '' });
    setAvailableSlots([]);
    setMarcacaoError('');
  };

  const handleUpdateStatus = async (marcacaoId, newStatus) => {
    setUpdateLoading(true);
    try {
      await fetch(`/api/marcacoes/${marcacaoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      setShowDetailModal(false);
      setSelectedMarcacao(null);
      fetchMarcacoes();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setUpdateLoading(false);
    }
  };

  const openMarcacaoDetail = (marcacao) => {
    setSelectedMarcacao(marcacao);
    setShowDetailModal(true);
  };

  const getWeekDays = (offset = 0) => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1) + (offset * 7));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays(weekOffset);
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const marcacoesFiltradas = marcacoes.filter(m => {
    const matchStatus = filtroStatus === 'todas' || m.status === filtroStatus;
    const matchBarbeiro = filtroBarbeiro === 'todos' || m.barbeiro_id === filtroBarbeiro;
    return matchStatus && matchBarbeiro;
  });

  const getMarcacoesPorDia = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return marcacoesFiltradas.filter(m => m.data === dateStr);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pendente': return 'bg-yellow-900/50 border-yellow-600 text-yellow-400';
      case 'aceita': return 'bg-green-900/50 border-green-600 text-green-400';
      case 'concluida': return 'bg-blue-900/50 border-blue-600 text-blue-400';
      case 'rejeitada': return 'bg-red-900/50 border-red-600 text-red-400';
      case 'cancelada': return 'bg-gray-900/50 border-gray-600 text-gray-400';
      default: return 'bg-zinc-900/50 border-zinc-600 text-zinc-400';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pendente': return '⏳';
      case 'aceita': return '✓';
      case 'concluida': return '✓✓';
      case 'rejeitada': return '✗';
      case 'cancelada': return '⊘';
      default: return '•';
    }
  };

  // Contar marcações por status
  const contagem = {
    todas: marcacoes.length,
    pendente: marcacoes.filter(m => m.status === 'pendente').length,
    aceita: marcacoes.filter(m => m.status === 'aceita').length,
    concluida: marcacoes.filter(m => m.status === 'concluida').length
  };

  return (
    <div className="space-y-4">
      {/* Filtros e Toggle View */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-3 flex-wrap">
              {/* Filtro Status */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={filtroStatus === 'todas' ? 'default' : 'outline'}
                  onClick={() => setFiltroStatus('todas')}
                  className={filtroStatus === 'todas' ? 'bg-amber-600' : 'border-zinc-700'}
                >
                  Todas ({contagem.todas})
                </Button>
                <Button
                  size="sm"
                  variant={filtroStatus === 'pendente' ? 'default' : 'outline'}
                  onClick={() => setFiltroStatus('pendente')}
                  className={filtroStatus === 'pendente' ? 'bg-yellow-600' : 'border-zinc-700'}
                >
                  ⏳ Pendentes ({contagem.pendente})
                </Button>
                <Button
                  size="sm"
                  variant={filtroStatus === 'aceita' ? 'default' : 'outline'}
                  onClick={() => setFiltroStatus('aceita')}
                  className={filtroStatus === 'aceita' ? 'bg-green-600' : 'border-zinc-700'}
                >
                  ✓ Aceitas ({contagem.aceita})
                </Button>
                <Button
                  size="sm"
                  variant={filtroStatus === 'concluida' ? 'default' : 'outline'}
                  onClick={() => setFiltroStatus('concluida')}
                  className={filtroStatus === 'concluida' ? 'bg-blue-600' : 'border-zinc-700'}
                >
                  ✓✓ Concluídas ({contagem.concluida})
                </Button>
              </div>

              {/* Filtro Barbeiro */}
              <select
                value={filtroBarbeiro}
                onChange={(e) => setFiltroBarbeiro(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-white rounded px-3 py-1.5 text-sm"
              >
                <option value="todos">Todos Barbeiros</option>
                {barbeiros.map(b => (
                  <option key={b._id} value={b._id}>{b.nome}</option>
                ))}
              </select>
            </div>

            {/* Toggle View + Nova Marcação */}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setShowNovaModal(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nova Marcação
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'calendario' ? 'default' : 'outline'}
                onClick={() => setViewMode('calendario')}
                className={viewMode === 'calendario' ? 'bg-amber-600' : 'border-zinc-700'}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Calendário
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'tabela' ? 'default' : 'outline'}
                onClick={() => setViewMode('tabela')}
                className={viewMode === 'tabela' ? 'bg-amber-600' : 'border-zinc-700'}
              >
                Tabela
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Nova Marcação Manual */}
      {showNovaModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-zinc-800 border-zinc-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-white">Nova Marcação Manual</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Criar marcação para cliente existente ou novo
                  </CardDescription>
                </div>
                <button 
                  onClick={() => { setShowNovaModal(false); resetNovaForm(); }}
                  className="text-zinc-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {marcacaoError && (
                <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-2 rounded mb-4">
                  {marcacaoError}
                </div>
              )}

              <form onSubmit={handleNovaMarcacao} className="space-y-4">
                {/* Selecção Cliente */}
                <div className="space-y-3">
                  <Label className="text-zinc-300">Cliente</Label>
                  <div className="flex gap-2 mb-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={!novoClienteMode ? 'default' : 'outline'}
                      onClick={() => setNovoClienteMode(false)}
                      className={!novoClienteMode ? 'bg-amber-600' : 'border-zinc-700'}
                    >
                      Cliente Existente
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={novoClienteMode ? 'default' : 'outline'}
                      onClick={() => setNovoClienteMode(true)}
                      className={novoClienteMode ? 'bg-amber-600' : 'border-zinc-700'}
                    >
                      Novo Cliente
                    </Button>
                  </div>

                  {!novoClienteMode ? (
                    <select
                      value={selectedClienteId}
                      onChange={(e) => setSelectedClienteId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded px-3 py-2"
                      required
                    >
                      <option value="">Selecione um cliente</option>
                      {clientes.map(c => (
                        <option key={c._id} value={c._id}>
                          {c.nome} - {c.email} {c.telemovel ? `(${c.telemovel})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-zinc-900 rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-zinc-400 text-sm">Nome *</Label>
                        <Input
                          value={novoCliente.nome}
                          onChange={(e) => setNovoCliente({...novoCliente, nome: e.target.value})}
                          className="bg-zinc-800 border-zinc-700 text-white"
                          placeholder="Nome do cliente"
                          required={novoClienteMode}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-zinc-400 text-sm">Email</Label>
                        <Input
                          type="email"
                          value={novoCliente.email}
                          onChange={(e) => setNovoCliente({...novoCliente, email: e.target.value})}
                          className="bg-zinc-800 border-zinc-700 text-white"
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-zinc-400 text-sm">Telemóvel</Label>
                        <Input
                          type="tel"
                          value={novoCliente.telemovel}
                          onChange={(e) => setNovoCliente({...novoCliente, telemovel: e.target.value})}
                          className="bg-zinc-800 border-zinc-700 text-white"
                          placeholder="+351 912 345 678"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Selecção Barbeiro e Serviço */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Barbeiro *</Label>
                    <select
                      value={selectedBarbeiroId}
                      onChange={(e) => setSelectedBarbeiroId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded px-3 py-2"
                      required
                    >
                      <option value="">Selecione</option>
                      {barbeiros.map(b => (
                        <option key={b._id} value={b._id}>{b.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Serviço *</Label>
                    <select
                      value={selectedServicoId}
                      onChange={(e) => setSelectedServicoId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded px-3 py-2"
                      required
                    >
                      <option value="">Selecione</option>
                      {servicos.map(s => (
                        <option key={s._id} value={s._id}>
                          {s.nome} - {s.preco?.toFixed(2)}€ ({s.duracao}min)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Data e Hora */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Data *</Label>
                    <Input
                      type="date"
                      value={selectedData}
                      onChange={(e) => setSelectedData(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="bg-zinc-900 border-zinc-700 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Hora *</Label>
                    <select
                      value={selectedHora}
                      onChange={(e) => setSelectedHora(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded px-3 py-2"
                      required
                    >
                      <option value="">Selecione</option>
                      {availableSlots.length === 0 && selectedBarbeiroId && selectedData && selectedServicoId ? (
                        <option value="" disabled>Nenhum horário disponível</option>
                      ) : (
                        availableSlots.map(slot => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-zinc-700"
                    onClick={() => { setShowNovaModal(false); resetNovaForm(); }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                    disabled={marcacaoLoading || !selectedHora}
                  >
                    {marcacaoLoading ? 'A criar...' : 'Criar Marcação'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vista Calendário */}
      {viewMode === 'calendario' && (
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-white">
                Semana: {weekDays[0].toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })} - {weekDays[6].toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-zinc-700"
                  onClick={() => setWeekOffset(weekOffset - 1)}
                >
                  ← Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-zinc-700"
                  onClick={() => setWeekOffset(0)}
                  disabled={weekOffset === 0}
                >
                  Hoje
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-zinc-700"
                  onClick={() => setWeekOffset(weekOffset + 1)}
                >
                  Próxima →
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {/* Headers dos dias */}
              {weekDays.map((day, index) => {
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                  <div key={index} className={`text-center p-2 rounded-t ${isToday ? 'bg-amber-600' : 'bg-zinc-700'}`}>
                    <div className="text-white font-semibold">{diasSemana[day.getDay()]}</div>
                    <div className={`text-sm ${isToday ? 'text-white' : 'text-zinc-400'}`}>
                      {day.getDate()}
                    </div>
                  </div>
                );
              })}

              {/* Marcações por dia */}
              {weekDays.map((day, index) => {
                const marcacoesDia = getMarcacoesPorDia(day);
                const isToday = day.toDateString() === new Date().toDateString();

                return (
                  <div 
                    key={index} 
                    className={`min-h-[300px] border rounded-b p-2 space-y-2 ${
                      isToday ? 'border-amber-600 bg-amber-900/10' : 'border-zinc-700 bg-zinc-900/50'
                    }`}
                  >
                    {marcacoesDia.length === 0 ? (
                      <div className="text-zinc-600 text-xs text-center mt-4">Sem marcações</div>
                    ) : (
                      marcacoesDia
                        .sort((a, b) => a.hora.localeCompare(b.hora))
                        .map(marcacao => (
                          <div
                            key={marcacao._id}
                            className={`border-l-4 p-2 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(marcacao.status)}`}
                            onClick={() => openMarcacaoDetail(marcacao)}
                          >
                            <div className="font-semibold">{marcacao.hora}</div>
                            <div className="text-white">{marcacao.cliente?.nome}</div>
                            <div className="text-xs opacity-80">{marcacao.servico?.nome}</div>
                            <div className="text-xs opacity-80">{marcacao.barbeiro?.nome}</div>
                            <div className="text-xs text-zinc-400 mt-1">Clique para detalhes</div>
                          </div>
                        ))
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Detalhes da Marcação */}
      <MarcacaoDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedMarcacao(null);
        }}
        marcacao={selectedMarcacao}
        onUpdateStatus={handleUpdateStatus}
        loading={updateLoading}
      />

      {/* Vista Tabela (original) */}
      {viewMode === 'tabela' && (
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Todas as Marcações</CardTitle>
            <CardDescription className="text-zinc-400">
              Gestão de marcações da barbearia
            </CardDescription>
          </CardHeader>
          <CardContent>
            {marcacoesFiltradas.length === 0 ? (
              <p className="text-zinc-400 text-center py-8">Nenhuma marcação com os filtros selecionados</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-700">
                      <TableHead className="text-zinc-300">Data</TableHead>
                      <TableHead className="text-zinc-300">Hora</TableHead>
                      <TableHead className="text-zinc-300">Cliente</TableHead>
                      <TableHead className="text-zinc-300">Barbeiro</TableHead>
                      <TableHead className="text-zinc-300">Serviço</TableHead>
                      <TableHead className="text-zinc-300">Status</TableHead>
                      <TableHead className="text-zinc-300">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marcacoesFiltradas.map((marcacao) => (
                      <TableRow key={marcacao._id} className="border-zinc-700">
                        <TableCell className="text-white">{new Date(marcacao.data).toLocaleDateString('pt-PT')}</TableCell>
                        <TableCell className="text-white font-semibold">{marcacao.hora}</TableCell>
                        <TableCell className="text-white">{marcacao.cliente?.nome}</TableCell>
                        <TableCell className="text-white">{marcacao.barbeiro?.nome}</TableCell>
                        <TableCell className="text-white">{marcacao.servico?.nome}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(marcacao.status)}`}>
                            {getStatusIcon(marcacao.status)} {marcacao.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {marcacao.status === 'pendente' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleUpdateStatus(marcacao._id, 'aceita')}
                              >
                                Aceitar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleUpdateStatus(marcacao._id, 'rejeitada')}
                              >
                                Rejeitar
                              </Button>
                            </div>
                          )}
                          {marcacao.status === 'aceita' && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleUpdateStatus(marcacao._id, 'concluida')}
                            >
                              Concluir
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ClientesTab({ clientes, fetchClientes }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('ultima_visita'); // 'nome', 'total_gasto', 'total_marcacoes', 'ultima_visita'
  const [sortOrder, setSortOrder] = useState('desc');

  const clientesFiltrados = clientes
    .filter(c => 
      c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let valueA, valueB;
      
      switch(sortBy) {
        case 'nome':
          valueA = a.nome || '';
          valueB = b.nome || '';
          return sortOrder === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        case 'total_gasto':
          valueA = a.total_gasto || 0;
          valueB = b.total_gasto || 0;
          break;
        case 'total_marcacoes':
          valueA = a.total_marcacoes || 0;
          valueB = b.total_marcacoes || 0;
          break;
        case 'ultima_visita':
          valueA = a.ultima_visita ? new Date(a.ultima_visita).getTime() : 0;
          valueB = b.ultima_visita ? new Date(b.ultima_visita).getTime() : 0;
          break;
        default:
          return 0;
      }
      
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    });

  const totalGastoGeral = clientes.reduce((sum, c) => sum + (c.total_gasto || 0), 0);
  const totalMarcacoes = clientes.reduce((sum, c) => sum + (c.total_marcacoes || 0), 0);

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-900/30 rounded-lg">
                <Users className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-zinc-400 text-sm">Total Clientes</p>
                <p className="text-white text-2xl font-bold">{clientes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-900/30 rounded-lg">
                <Euro className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-zinc-400 text-sm">Receita Total</p>
                <p className="text-white text-2xl font-bold">{totalGastoGeral.toFixed(2)}€</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-900/30 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-zinc-400 text-sm">Total Marcações</p>
                <p className="text-white text-2xl font-bold">{totalMarcacoes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Pesquisar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white"
              />
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-zinc-400 text-sm">Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-white rounded px-3 py-2 text-sm"
              >
                <option value="ultima_visita">Última Visita</option>
                <option value="nome">Nome</option>
                <option value="total_gasto">Total Gasto</option>
                <option value="total_marcacoes">Nº Marcações</option>
              </select>
              <Button
                size="sm"
                variant="outline"
                className="border-zinc-700"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Clientes ({clientesFiltrados.length})</CardTitle>
          <CardDescription className="text-zinc-400">
            Gestão de clientes que já fizeram marcações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientesFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">
                {searchTerm ? 'Nenhum cliente encontrado' : 'Ainda não tem clientes'}
              </p>
              <p className="text-zinc-500 text-sm mt-2">
                Os clientes aparecerão aqui após fazerem marcações
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-700">
                    <TableHead className="text-zinc-300">Cliente</TableHead>
                    <TableHead className="text-zinc-300">Contacto</TableHead>
                    <TableHead className="text-zinc-300 text-center">Marcações</TableHead>
                    <TableHead className="text-zinc-300 text-center">Concluídas</TableHead>
                    <TableHead className="text-zinc-300 text-right">Total Gasto</TableHead>
                    <TableHead className="text-zinc-300">Última Visita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientesFiltrados.map((cliente) => (
                    <TableRow key={cliente._id} className="border-zinc-700">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold">
                            {cliente.nome?.charAt(0).toUpperCase() || 'C'}
                          </div>
                          <div>
                            <div className="text-white font-medium">{cliente.nome}</div>
                            <div className="text-zinc-500 text-xs">ID: {cliente._id?.slice(-6)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-zinc-300 text-sm">
                            <Mail className="h-3 w-3 text-zinc-500" />
                            {cliente.email}
                          </div>
                          {cliente.telemovel && (
                            <div className="flex items-center gap-2 text-zinc-400 text-sm">
                              <Phone className="h-3 w-3 text-zinc-500" />
                              {cliente.telemovel}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-white font-semibold">{cliente.total_marcacoes || 0}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-green-400 font-semibold">{cliente.marcacoes_concluidas || 0}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-amber-500 font-bold">{(cliente.total_gasto || 0).toFixed(2)}€</span>
                      </TableCell>
                      <TableCell>
                        {cliente.ultima_visita ? (
                          <span className="text-zinc-300">
                            {new Date(cliente.ultima_visita).toLocaleDateString('pt-PT')}
                          </span>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BarbeirosTab({ barbeiros, fetchBarbeiros }) {
  const [showForm, setShowForm] = useState(false);
  const [editingBarbeiro, setEditingBarbeiro] = useState(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telemovel, setTelemovel] = useState('');
  const [biografia, setBiografia] = useState('');
  const [especialidades, setEspecialidades] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setNome('');
    setEmail('');
    setPassword('');
    setTelemovel('');
    setBiografia('');
    setEspecialidades('');
    setEditingBarbeiro(null);
    setError('');
  };

  const handleEdit = (barbeiro) => {
    setEditingBarbeiro(barbeiro);
    setNome(barbeiro.nome || '');
    setEmail(barbeiro.email || '');
    setPassword('');
    setTelemovel(barbeiro.telemovel || '');
    setBiografia(barbeiro.biografia || '');
    setEspecialidades(Array.isArray(barbeiro.especialidades) ? barbeiro.especialidades.join(', ') : '');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const especialidadesArray = especialidades
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    try {
      const url = editingBarbeiro 
        ? `/api/barbeiros/${editingBarbeiro._id}`
        : '/api/barbeiros';
      
      const method = editingBarbeiro ? 'PUT' : 'POST';
      
      const bodyData = {
        nome,
        email,
        telemovel,
        biografia,
        especialidades: especialidadesArray
      };

      // Só incluir password se for novo barbeiro ou se foi preenchida na edição
      if (!editingBarbeiro || password.length > 0) {
        bodyData.password = password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(bodyData)
      });

      if (response.ok) {
        resetForm();
        setShowForm(false);
        fetchBarbeiros();
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (error) {
      setError('Erro ao guardar barbeiro');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja remover este barbeiro?')) return;

    try {
      await fetch(`/api/barbeiros/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchBarbeiros();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleToggleAtivo = async (barbeiro) => {
    try {
      await fetch(`/api/barbeiros/${barbeiro._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...barbeiro,
          ativo: !barbeiro.ativo
        })
      });
      fetchBarbeiros();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white">Barbeiros</CardTitle>
              <CardDescription className="text-zinc-400">Gerir equipa de barbeiros - criar contas de acesso</CardDescription>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Barbeiro
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 space-y-4 p-4 bg-zinc-900 rounded-lg">
              <h3 className="text-white font-semibold text-lg mb-4">
                {editingBarbeiro ? 'Editar Barbeiro' : 'Novo Barbeiro'}
              </h3>
              {error && (
                <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-2 rounded">
                  {error}
                </div>
              )}
              
              {/* Linha 1: Nome, Email */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Nome *</Label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="Ex: João Silva"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Email *</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="joao@barbearia.pt"
                    required
                  />
                </div>
              </div>

              {/* Linha 2: Password, Telemóvel */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">
                    {editingBarbeiro ? 'Nova Palavra-passe (deixe vazio para manter)' : 'Palavra-passe *'}
                  </Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="Mínimo 6 caracteres"
                    minLength={editingBarbeiro ? 0 : 6}
                    required={!editingBarbeiro}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Telemóvel</Label>
                  <Input
                    type="tel"
                    value={telemovel}
                    onChange={(e) => setTelemovel(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="+351 912 345 678"
                  />
                </div>
              </div>

              {/* Linha 3: Especialidades */}
              <div className="space-y-2">
                <Label className="text-zinc-300">Especialidades</Label>
                <Input
                  value={especialidades}
                  onChange={(e) => setEspecialidades(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Ex: Corte clássico, Barba, Degradê (separados por vírgula)"
                />
                <p className="text-zinc-500 text-xs">Separe as especialidades por vírgulas</p>
              </div>

              {/* Linha 4: Biografia */}
              <div className="space-y-2">
                <Label className="text-zinc-300">Biografia</Label>
                <textarea
                  value={biografia}
                  onChange={(e) => setBiografia(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-md px-3 py-2 min-h-[80px]"
                  placeholder="Breve descrição sobre o barbeiro..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={loading}>
                  {loading ? 'A guardar...' : (editingBarbeiro ? 'Guardar Alterações' : 'Adicionar')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="border-zinc-700"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          {barbeiros.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">Nenhum barbeiro registado</p>
              <p className="text-zinc-500 text-sm mt-2">Adicione barbeiros para que possam aceder ao sistema e gerir as suas marcações</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {barbeiros.map((barbeiro) => (
                <Card key={barbeiro._id} className={`bg-zinc-900 border-zinc-700 ${barbeiro.ativo === false ? 'opacity-60' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                          {barbeiro.nome?.charAt(0).toUpperCase() || 'B'}
                        </div>
                        <div>
                          <CardTitle className="text-white text-lg">{barbeiro.nome}</CardTitle>
                          <p className="text-zinc-400 text-sm">{barbeiro.email}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${barbeiro.ativo !== false ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                        {barbeiro.ativo !== false ? 'Ativo' : 'Inativo'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {barbeiro.telemovel && (
                      <div className="flex items-center gap-2 text-zinc-300 text-sm">
                        <span className="text-zinc-500">📞</span>
                        {barbeiro.telemovel}
                      </div>
                    )}
                    
                    {barbeiro.especialidades && barbeiro.especialidades.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {barbeiro.especialidades.map((esp, idx) => (
                          <span key={idx} className="bg-amber-900/30 text-amber-400 px-2 py-0.5 rounded text-xs">
                            {esp}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {barbeiro.biografia && (
                      <p className="text-zinc-400 text-sm line-clamp-2">{barbeiro.biografia}</p>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-zinc-800">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-zinc-700 hover:bg-zinc-800"
                        onClick={() => handleEdit(barbeiro)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={`border-zinc-700 ${barbeiro.ativo !== false ? 'hover:bg-yellow-900/30' : 'hover:bg-green-900/30'}`}
                        onClick={() => handleToggleAtivo(barbeiro)}
                      >
                        {barbeiro.ativo !== false ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(barbeiro._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ServicosTab({ servicos, fetchServicos }) {
  const [showForm, setShowForm] = useState(false);
  const [editingServico, setEditingServico] = useState(null);
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [duracao, setDuracao] = useState('30');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setNome('');
    setPreco('');
    setDuracao('30');
    setEditingServico(null);
  };

  const handleEdit = (servico) => {
    setEditingServico(servico);
    setNome(servico.nome || '');
    setPreco(servico.preco?.toString() || '');
    setDuracao(servico.duracao?.toString() || '30');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingServico ? `/api/servicos/${editingServico._id}` : '/api/servicos';
      const method = editingServico ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ nome, preco, duracao })
      });

      resetForm();
      setShowForm(false);
      fetchServicos();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja remover este serviço?')) return;

    try {
      await fetch(`/api/servicos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchServicos();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Card className="bg-zinc-800 border-zinc-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-white">Serviços</CardTitle>
            <CardDescription className="text-zinc-400">Gerir serviços da barbearia</CardDescription>
          </div>
          <Button 
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }} 
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Serviço
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 space-y-4 p-4 bg-zinc-900 rounded-lg">
            <h3 className="text-white font-semibold text-lg mb-4">
              {editingServico ? 'Editar Serviço' : 'Novo Serviço'}
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Nome do Serviço</Label>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Ex: Corte de Cabelo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Preço (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="15.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Duração (minutos)</Label>
                <Input
                  type="number"
                  value={duracao}
                  onChange={(e) => setDuracao(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={loading}>
                {loading ? 'A guardar...' : (editingServico ? 'Guardar Alterações' : 'Adicionar')}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="border-zinc-700"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {servicos.length === 0 ? (
          <div className="text-center py-12">
            <Scissors className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">Nenhum serviço registado</p>
            <p className="text-zinc-500 text-sm mt-2">Adicione serviços que oferece na sua barbearia</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-700">
                <TableHead className="text-zinc-300">Nome</TableHead>
                <TableHead className="text-zinc-300">Preço</TableHead>
                <TableHead className="text-zinc-300">Duração</TableHead>
                <TableHead className="text-zinc-300">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicos.map((servico) => (
                <TableRow key={servico._id} className="border-zinc-700">
                  <TableCell className="text-white font-medium">{servico.nome}</TableCell>
                  <TableCell className="text-amber-500 font-semibold">{servico.preco?.toFixed(2)}€</TableCell>
                  <TableCell className="text-zinc-300">{servico.duracao} min</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-zinc-700"
                        onClick={() => handleEdit(servico)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(servico._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ProdutosTab({ produtos, fetchProdutos }) {
  const [showForm, setShowForm] = useState(false);
  const [editingProduto, setEditingProduto] = useState(null);
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [descricao, setDescricao] = useState('');
  const [imagem, setImagem] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setNome('');
    setPreco('');
    setDescricao('');
    setImagem('');
    setEditingProduto(null);
  };

  const handleEdit = (produto) => {
    setEditingProduto(produto);
    setNome(produto.nome || '');
    setPreco(produto.preco?.toString() || '');
    setDescricao(produto.descricao || '');
    setImagem(produto.imagem || '');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingProduto ? `/api/produtos/${editingProduto._id}` : '/api/produtos';
      const method = editingProduto ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ nome, preco, descricao, imagem: imagem || null })
      });

      resetForm();
      setShowForm(false);
      fetchProdutos();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja remover este produto?')) return;

    try {
      await fetch(`/api/produtos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchProdutos();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Card className="bg-zinc-800 border-zinc-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-white">Produtos</CardTitle>
            <CardDescription className="text-zinc-400">Gerir produtos para venda</CardDescription>
          </div>
          <Button 
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }} 
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Produto
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 space-y-4 p-4 bg-zinc-900 rounded-lg">
            <h3 className="text-white font-semibold text-lg mb-4">
              {editingProduto ? 'Editar Produto' : 'Novo Produto'}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Nome do Produto *</Label>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Ex: Pomada para Cabelo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Preço (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="25.00"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-zinc-300">Descrição</Label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-md px-3 py-2 min-h-[60px]"
                placeholder="Descrição do produto..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">URL da Imagem</Label>
              <Input
                value={imagem}
                onChange={(e) => setImagem(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
                placeholder="https://exemplo.com/imagem.jpg"
              />
              <p className="text-zinc-500 text-xs">Cole o URL de uma imagem do produto (Unsplash, Imgur, etc.)</p>
              {imagem && (
                <div className="mt-2">
                  <p className="text-zinc-400 text-xs mb-1">Pré-visualização:</p>
                  <img 
                    src={imagem} 
                    alt="Preview" 
                    className="h-20 w-20 object-cover rounded border border-zinc-700"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={loading}>
                {loading ? 'A guardar...' : (editingProduto ? 'Guardar Alterações' : 'Adicionar')}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="border-zinc-700"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {produtos.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">Nenhum produto registado</p>
            <p className="text-zinc-500 text-sm mt-2">Adicione produtos para vender na sua barbearia</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {produtos.map((produto) => (
              <Card key={produto._id} className="bg-zinc-900 border-zinc-700 overflow-hidden">
                {produto.imagem && (
                  <div className="h-40 overflow-hidden">
                    <img 
                      src={produto.imagem} 
                      alt={produto.nome}
                      className="w-full h-full object-cover"
                      onError={(e) => e.target.parentElement.style.display = 'none'}
                    />
                  </div>
                )}
                <CardHeader className={produto.imagem ? 'pt-3' : ''}>
                  <CardTitle className="text-white text-lg">{produto.nome}</CardTitle>
                  {produto.descricao && (
                    <CardDescription className="text-zinc-400 line-clamp-2">{produto.descricao}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-amber-500 text-xl font-bold">{produto.preco?.toFixed(2)}€</span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-zinc-700"
                        onClick={() => handleEdit(produto)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(produto._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HorariosTab({ horarios, fetchHorarios }) {
  const [editedHorarios, setEditedHorarios] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEditedHorarios(horarios);
  }, [horarios]);

  const diasSemana = [
    { key: 'segunda', label: 'Segunda-feira' },
    { key: 'terca', label: 'Terça-feira' },
    { key: 'quarta', label: 'Quarta-feira' },
    { key: 'quinta', label: 'Quinta-feira' },
    { key: 'sexta', label: 'Sexta-feira' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' }
  ];

  const handleChange = (dia, field, value) => {
    setEditedHorarios(prev => {
      const horarioIndex = prev.findIndex(h => h.dia_semana === dia);
      if (horarioIndex >= 0) {
        const updated = [...prev];
        updated[horarioIndex] = { ...updated[horarioIndex], [field]: value };
        return updated;
      }
      return prev;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch('/api/horarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ horarios: editedHorarios })
      });
      alert('Horários atualizados com sucesso!');
      fetchHorarios();
    } catch (error) {
      console.error('Error:', error);
      alert('Erro ao atualizar horários');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-zinc-800 border-zinc-700">
      <CardHeader>
        <CardTitle className="text-white">Horários de Funcionamento</CardTitle>
        <CardDescription className="text-zinc-400">Definir horários por dia da semana</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {diasSemana.map(({ key, label }) => {
            const horario = editedHorarios.find(h => h.dia_semana === key) || {};
            return (
              <div key={key} className="flex items-center gap-4 p-4 bg-zinc-900 rounded-lg">
                <div className="w-40">
                  <label className="text-white font-medium">{label}</label>
                </div>
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={horario.ativo || false}
                      onChange={(e) => handleChange(key, 'ativo', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-zinc-400 text-sm">Aberto</span>
                  </div>
                  {horario.ativo && (
                    <>
                      <Input
                        type="time"
                        value={horario.hora_inicio || '09:00'}
                        onChange={(e) => handleChange(key, 'hora_inicio', e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white w-32"
                      />
                      <span className="text-zinc-400">às</span>
                      <Input
                        type="time"
                        value={horario.hora_fim || '19:00'}
                        onChange={(e) => handleChange(key, 'hora_fim', e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white w-32"
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
          <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={loading}>
            {loading ? 'A guardar...' : 'Guardar Horários'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ConfiguracoesTab({ barbearia, subscription, fetchSettings }) {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [telefone, setTelefone] = useState('');
  const [emailContacto, setEmailContacto] = useState('');
  const [imagemHero, setImagemHero] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Stripe config
  const [stripePublicKey, setStripePublicKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeSuccess, setStripeSuccess] = useState('');
  const [stripeError, setStripeError] = useState('');

  // WhatsApp/Twilio config
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [twilioAccountSid, setTwilioAccountSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');
  const [twilioWhatsappNumber, setTwilioWhatsappNumber] = useState('');
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappSuccess, setWhatsappSuccess] = useState('');
  const [whatsappError, setWhatsappError] = useState('');

  useEffect(() => {
    if (barbearia) {
      setNome(barbearia.nome || '');
      setDescricao(barbearia.descricao || '');
      setTelefone(barbearia.telefone || '');
      setEmailContacto(barbearia.email_contacto || '');
      setImagemHero(barbearia.imagem_hero || '');
      setStripePublicKey(barbearia.stripe_public_key || '');
      // WhatsApp
      setWhatsappEnabled(barbearia.whatsapp_enabled || false);
      setTwilioAccountSid(barbearia.twilio_account_sid || '');
      setTwilioWhatsappNumber(barbearia.twilio_whatsapp_number || '');
      // Secret key não é retornada por segurança - só mostramos se está configurada
    }
  }, [barbearia]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch('/api/barbearia/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ nome, descricao, telefone, email_contacto: emailContacto, imagem_hero: imagemHero })
      });
      alert('Configurações atualizadas com sucesso!');
      fetchSettings();
    } catch (error) {
      console.error('Error:', error);
      alert('Erro ao atualizar configurações');
    } finally {
      setLoading(false);
    }
  };
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ nome, descricao, telefone, email_contacto: emailContacto })
      });
      alert('Configurações atualizadas com sucesso!');
      fetchSettings();
    } catch (error) {
      console.error('Error:', error);
      alert('Erro ao atualizar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleStripeSubmit = async (e) => {
    e.preventDefault();
    setStripeLoading(true);
    setStripeSuccess('');
    setStripeError('');

    try {
      const response = await fetch('/api/barbearia/stripe-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          stripe_public_key: stripePublicKey, 
          stripe_secret_key: stripeSecretKey 
        })
      });

      if (response.ok) {
        setStripeSuccess('Configuração do Stripe guardada com sucesso!');
        setStripeSecretKey(''); // Limpar por segurança
        fetchSettings();
      } else {
        const data = await response.json();
        setStripeError(data.error || 'Erro ao guardar configuração');
      }
    } catch (error) {
      setStripeError('Erro ao guardar configuração');
    } finally {
      setStripeLoading(false);
    }
  };

  if (!barbearia) {
    return <div className="text-white">A carregar...</div>;
  }

  const trialDaysLeft = subscription && subscription.trial_end 
    ? Math.ceil((new Date(subscription.trial_end) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6">
      {/* Subscription Info */}
      {subscription && (
        <Card className="bg-gradient-to-r from-amber-900/20 to-zinc-800 border-amber-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span>Plano Ativo: {subscription.plan_name}</span>
              {subscription.status === 'active' && trialDaysLeft > 0 && (
                <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                  Trial - {trialDaysLeft} dias restantes
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-zinc-300">
              {subscription.price}€/mês • Próxima cobrança: {new Date(subscription.next_billing_date).toLocaleDateString('pt-PT')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white"
                onClick={() => router.push('/planos')}
              >
                Gerir Plano
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Barbearia Info */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Informações da Barbearia</CardTitle>
          <CardDescription className="text-zinc-400">
            Edita as informações públicas da tua barbearia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">URL Pública</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/barbearia/${barbearia.slug}`}
                  className="bg-zinc-900 border-zinc-700 text-zinc-400"
                  readOnly
                />
                <Button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/barbearia/${barbearia.slug}`);
                    alert('URL copiada!');
                  }}
                  variant="outline"
                  className="border-zinc-700"
                >
                  Copiar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Nome da Barbearia *</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Descrição / Slogan</Label>
              <Input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white"
                placeholder="Ex: A melhor barbearia de Lisboa"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Telemóvel</Label>
              <Input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white"
                placeholder="+351 912 345 678"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Email de Contacto</Label>
              <Input
                value={emailContacto}
                onChange={(e) => setEmailContacto(e.target.value)}
                type="email"
                className="bg-zinc-900 border-zinc-700 text-white"
                placeholder="contacto@barbearia.pt"
              />
            </div>

            <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={loading}>
              {loading ? 'A guardar...' : 'Guardar Alterações'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Stripe Configuration */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-500" />
                Configuração do Stripe
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Configure o Stripe para aceitar pagamentos de planos de assinatura dos seus clientes
              </CardDescription>
            </div>
            {barbearia.stripe_configured && (
              <span className="bg-green-900/50 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                ✓ Configurado
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {stripeSuccess && (
            <div className="bg-green-900/20 border border-green-900 text-green-400 px-4 py-2 rounded mb-4">
              {stripeSuccess}
            </div>
          )}
          {stripeError && (
            <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-2 rounded mb-4">
              {stripeError}
            </div>
          )}

          <form onSubmit={handleStripeSubmit} className="space-y-4">
            <div className="bg-zinc-900 p-4 rounded-lg mb-4">
              <p className="text-zinc-300 text-sm mb-2">
                Para configurar o Stripe, precisa de criar uma conta em{' '}
                <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:underline">
                  stripe.com
                </a>
                {' '}e obter as suas chaves de API.
              </p>
              <p className="text-zinc-500 text-xs">
                As chaves podem ser encontradas em Dashboard → Developers → API keys
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Publishable Key (pk_live_... ou pk_test_...)</Label>
              <Input
                value={stripePublicKey}
                onChange={(e) => setStripePublicKey(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white font-mono text-sm"
                placeholder="pk_live_xxxxxxxxxxxxxxxx"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Secret Key (sk_live_... ou sk_test_...)</Label>
              <Input
                type="password"
                value={stripeSecretKey}
                onChange={(e) => setStripeSecretKey(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white font-mono text-sm"
                placeholder={barbearia.stripe_configured ? '••••••••••••••••' : 'sk_live_xxxxxxxxxxxxxxxx'}
              />
              <p className="text-zinc-500 text-xs">
                {barbearia.stripe_configured 
                  ? 'Deixe vazio para manter a chave atual. Preencha apenas se quiser alterar.'
                  : 'A Secret Key é armazenada de forma segura e nunca é exposta.'}
              </p>
            </div>

            <Button 
              type="submit" 
              className="bg-amber-600 hover:bg-amber-700" 
              disabled={stripeLoading || (!stripePublicKey && !stripeSecretKey)}
            >
              {stripeLoading ? 'A guardar...' : (barbearia.stripe_configured ? 'Atualizar Configuração' : 'Configurar Stripe')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
function PlanosClienteTab({ planos, fetchPlanos, stripeConfigured }) {
  const [showForm, setShowForm] = useState(false);
  const [editingPlano, setEditingPlano] = useState(null);
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [duracao, setDuracao] = useState('30');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setNome('');
    setPreco('');
    setDuracao('30');
    setDescricao('');
    setEditingPlano(null);
    setError('');
  };

  const handleEdit = (plano) => {
    setEditingPlano(plano);
    setNome(plano.nome || '');
    setPreco(plano.preco?.toString() || '');
    setDuracao(plano.duracao?.toString() || '30');
    setDescricao(plano.descricao || '');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = editingPlano ? `/api/planos-cliente/${editingPlano._id}` : '/api/planos-cliente';
      const method = editingPlano ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ nome, preco: parseFloat(preco), duracao: parseInt(duracao), descricao })
      });

      if (response.ok) {
        resetForm();
        setShowForm(false);
        fetchPlanos();
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao guardar plano');
      }
    } catch (error) {
      setError('Erro ao guardar plano');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja remover este plano?')) return;

    try {
      await fetch(`/api/planos-cliente/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchPlanos();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (!stripeConfigured) {
    return (
      <Card className="bg-zinc-800 border-zinc-700">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 mb-2">Stripe não configurado</p>
            <p className="text-zinc-500 text-sm mb-4">
              Para criar planos de assinatura, precisa primeiro configurar o Stripe na aba Configurações.
            </p>
            <Button
              onClick={() => {
                // Switch to configuracoes tab - this would need to be implemented
                // For now, just show an alert
                alert('Vá para a aba Configurações para configurar o Stripe');
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Configurar Stripe
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-800 border-zinc-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-white">Planos de Assinatura</CardTitle>
            <CardDescription className="text-zinc-400">
              Gerir planos de assinatura para clientes (requer Stripe configurado)
            </CardDescription>
          </div>
          <Button 
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }} 
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Plano
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 space-y-4 p-4 bg-zinc-900 rounded-lg">
            <h3 className="text-white font-semibold text-lg mb-4">
              {editingPlano ? 'Editar Plano' : 'Novo Plano'}
            </h3>
            {error && (
              <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-2 rounded">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Nome do Plano *</Label>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Ex: Plano Mensal"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Preço (€/mês) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="29.99"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Duração (dias) *</Label>
                <Input
                  type="number"
                  value={duracao}
                  onChange={(e) => setDuracao(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="30"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-zinc-300">Descrição</Label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-md px-3 py-2 min-h-[60px]"
                placeholder="Descrição do plano..."
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={loading}>
                {loading ? 'A guardar...' : (editingPlano ? 'Guardar Alterações' : 'Adicionar')}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="border-zinc-700"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {planos.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">Nenhum plano registado</p>
            <p className="text-zinc-500 text-sm mt-2">Adicione planos de assinatura para os seus clientes</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {planos.map((plano) => (
              <Card key={plano._id} className="bg-zinc-900 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">{plano.nome}</CardTitle>
                  {plano.descricao && (
                    <CardDescription className="text-zinc-400">{plano.descricao}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Preço:</span>
                      <span className="text-amber-500 text-xl font-bold">{plano.preco?.toFixed(2)}€/mês</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Duração:</span>
                      <span className="text-white">{plano.duracao} dias</span>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-zinc-800">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-zinc-700"
                        onClick={() => handleEdit(plano)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(plano._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}