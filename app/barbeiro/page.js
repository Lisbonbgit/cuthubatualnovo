'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Calendar, User, Save, Plus, RefreshCw } from 'lucide-react';
import { MarcacaoDetailModal } from '@/components/ui/modals';

export default function BarbeiroPanel() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [marcacoes, setMarcacoes] = useState([]);
  const [viewMode, setViewMode] = useState('calendario');
  const [filtroStatus, setFiltroStatus] = useState('todas');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedMarcacao, setSelectedMarcacao] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  
  // Nova Marcação Manual
  const [showNovaModal, setShowNovaModal] = useState(false);
  const [novoClienteMode, setNovoClienteMode] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedServicoId, setSelectedServicoId] = useState('');
  const [selectedData, setSelectedData] = useState('');
  const [selectedHora, setSelectedHora] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [novoCliente, setNovoCliente] = useState({ nome: '', email: '', telemovel: '' });
  const [marcacaoLoading, setMarcacaoLoading] = useState(false);
  const [marcacaoError, setMarcacaoError] = useState('');

  // Polling state
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        if (data.user.tipo !== 'barbeiro') {
          router.push('/');
          return;
        }
        setUser(data.user);
        await Promise.all([
          fetchMarcacoes(token),
          fetchClientes(token),
          fetchServicos(token)
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

  const fetchMarcacoes = async (token) => {
    const response = await fetch('/api/marcacoes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setMarcacoes(data.marcacoes || []);
    setLastUpdate(new Date());
  };

  // Polling automático a cada 20 segundos
  useEffect(() => {
    if (!user) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    const interval = setInterval(async () => {
      setIsRefreshing(true);
      try {
        await fetchMarcacoes(token);
      } catch (error) {
        console.error('Erro no polling:', error);
      } finally {
        setIsRefreshing(false);
      }
    }, 20000); // 20 segundos

    return () => clearInterval(interval);
  }, [user]);

  // Função para refresh manual
  const handleManualRefresh = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    setIsRefreshing(true);
    try {
      await fetchMarcacoes(token);
    } catch (error) {
      console.error('Erro no refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Formatador de tempo relativo
  const getTimeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `há ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `há ${minutes}m`;
    return `há ${Math.floor(minutes / 60)}h`;
  };

  const [timeAgo, setTimeAgo] = useState('');
  
  useEffect(() => {
    const updateTimeAgo = () => setTimeAgo(getTimeAgo(lastUpdate));
    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 5000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  const fetchClientes = async (token) => {
    const response = await fetch('/api/clientes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setClientes(data.clientes || []);
  };

  const fetchServicos = async (token) => {
    const response = await fetch('/api/servicos', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setServicos(data.servicos || []);
  };

  useEffect(() => {
    const fetchSlots = async () => {
      if (!user || !selectedData || !selectedServicoId) {
        setAvailableSlots([]);
        return;
      }
      
      try {
        const response = await fetch(
          `/api/marcacoes/slots?barbeiro_id=${user._id}&data=${selectedData}&servico_id=${selectedServicoId}`,
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
  }, [user, selectedData, selectedServicoId]);

  const resetNovaForm = () => {
    setSelectedClienteId('');
    setSelectedServicoId('');
    setSelectedData('');
    setSelectedHora('');
    setNovoClienteMode(false);
    setNovoCliente({ nome: '', email: '', telemovel: '' });
    setAvailableSlots([]);
    setMarcacaoError('');
  };

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

      // Criar marcação (barbeiro só pode criar para si próprio)
      const response = await fetch('/api/marcacoes/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          cliente_id: clienteId,
          barbeiro_id: user._id, // Sempre o próprio barbeiro
          servico_id: selectedServicoId,
          data: selectedData,
          hora: selectedHora
        })
      });

      if (response.ok) {
        setShowNovaModal(false);
        resetNovaForm();
        fetchMarcacoes(localStorage.getItem('token'));
        fetchClientes(localStorage.getItem('token'));
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
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
      fetchMarcacoes(localStorage.getItem('token'));
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

  const groupMarcacoesByWeek = () => {
    const grouped = {};
    marcacoes.forEach(m => {
      const date = new Date(m.data);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1);
      const key = weekStart.toISOString().split('T')[0];
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(m);
    });
    return grouped;
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-amber-500 text-xl">A carregar...</div>
      </div>
    );
  }

  const weekDays = getWeekDays(weekOffset);
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const marcacoesFiltradas = filtroStatus === 'todas' 
    ? marcacoes 
    : marcacoes.filter(m => m.status === filtroStatus);

  const getMarcacoesPorDia = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return marcacoesFiltradas.filter(m => m.data === dateStr);
  };

  const marcacoesPorSemana = groupMarcacoesByWeek();

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {user?.foto ? (
              <img src={user.foto} alt={user.nome} className="w-12 h-12 rounded-full object-cover border-2 border-amber-600" />
            ) : (
              <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {user?.nome?.charAt(0).toUpperCase() || 'B'}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">Painel Barbeiro</h1>
              <p className="text-zinc-400 text-sm">{user?.nome}</p>
            </div>
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
          <TabsList className="bg-zinc-800 grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="marcacoes" className="data-[state=active]:bg-amber-600">
              <Calendar className="mr-2 h-4 w-4" />
              Marcações
            </TabsTrigger>
            <TabsTrigger value="perfil" className="data-[state=active]:bg-amber-600">
              <User className="mr-2 h-4 w-4" />
              Meu Perfil
            </TabsTrigger>
          </TabsList>

          <TabsContent value="marcacoes" className="space-y-6">
            {/* Filtros */}
            <Card className="bg-zinc-800 border-zinc-700">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant={filtroStatus === 'todas' ? 'default' : 'outline'}
                      onClick={() => setFiltroStatus('todas')}
                      className={filtroStatus === 'todas' ? 'bg-amber-600' : 'border-zinc-700'}
                    >
                      Todas ({marcacoes.length})
                    </Button>
                    <Button
                      size="sm"
                      variant={filtroStatus === 'pendente' ? 'default' : 'outline'}
                      onClick={() => setFiltroStatus('pendente')}
                      className={filtroStatus === 'pendente' ? 'bg-yellow-600' : 'border-zinc-700'}
                    >
                      ⏳ Pendentes
                    </Button>
                    <Button
                      size="sm"
                      variant={filtroStatus === 'aceita' ? 'default' : 'outline'}
                      onClick={() => setFiltroStatus('aceita')}
                      className={filtroStatus === 'aceita' ? 'bg-green-600' : 'border-zinc-700'}
                    >
                      ✓ Aceitas
                    </Button>
                    <Button
                      size="sm"
                      variant={filtroStatus === 'concluida' ? 'default' : 'outline'}
                      onClick={() => setFiltroStatus('concluida')}
                      className={filtroStatus === 'concluida' ? 'bg-blue-600' : 'border-zinc-700'}
                    >
                      ✓✓ Concluídas
                    </Button>
                  </div>

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

                      {/* Serviço */}
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
                            {availableSlots.length === 0 && selectedData && selectedServicoId ? (
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
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Calendar className="h-6 w-6" />
                        Semana: {weekDays[0].toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })} - {weekDays[6].toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </CardTitle>
                      <CardDescription className="text-zinc-400">
                        Gestão semanal das tuas marcações
                      </CardDescription>
                    </div>
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
                                  <div className="font-semibold text-base">{marcacao.hora}</div>
                                  <div className="text-white font-medium">{marcacao.cliente?.nome}</div>
                                  <div className="text-xs opacity-80 mb-1">{marcacao.servico?.nome}</div>
                                  <div className="text-xs opacity-80 mt-1">
                                    {marcacao.servico?.duracao} min • {marcacao.servico?.preco}€
                                  </div>
                                  <div className="text-xs text-zinc-400 mt-1">📞 Clique para ver contacto</div>
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

            {/* Vista Tabela */}
            {viewMode === 'tabela' && (
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="h-6 w-6" />
                    Minhas Marcações
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Gestão das tuas marcações
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {marcacoesFiltradas.length === 0 ? (
                    <p className="text-zinc-400 text-center py-8">Nenhuma marcação agendada</p>
                  ) : (
                    <div className="space-y-8">{Object.entries(marcacoesPorSemana).map(([weekStart, weekMarcacoes]) => {
                      const startDate = new Date(weekStart);
                      const endDate = new Date(startDate);
                      endDate.setDate(startDate.getDate() + 6);
                      
                      return (
                        <div key={weekStart} className="space-y-4">
                          <h3 className="text-lg font-semibold text-white">
                            Semana: {startDate.toLocaleDateString('pt-PT')} - {endDate.toLocaleDateString('pt-PT')}
                          </h3>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="border-zinc-700">
                                  <TableHead className="text-zinc-300">Data</TableHead>
                                  <TableHead className="text-zinc-300">Hora</TableHead>
                                  <TableHead className="text-zinc-300">Cliente</TableHead>
                                  <TableHead className="text-zinc-300">Serviço</TableHead>
                                  <TableHead className="text-zinc-300">Duração</TableHead>
                                  <TableHead className="text-zinc-300">Preço</TableHead>
                                  <TableHead className="text-zinc-300">Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {weekMarcacoes.sort((a, b) => {
                                  const dateCompare = new Date(a.data) - new Date(b.data);
                                  if (dateCompare !== 0) return dateCompare;
                                  return a.hora.localeCompare(b.hora);
                                }).map((marcacao) => (
                                  <TableRow key={marcacao._id} className="border-zinc-700">
                                    <TableCell className="text-white">
                                      {new Date(marcacao.data).toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short' })}
                                    </TableCell>
                                    <TableCell className="text-white font-semibold">{marcacao.hora}</TableCell>
                                    <TableCell className="text-white">{marcacao.cliente?.nome}</TableCell>
                                    <TableCell className="text-white">{marcacao.servico?.nome}</TableCell>
                                    <TableCell className="text-zinc-400">{marcacao.servico?.duracao} min</TableCell>
                                    <TableCell className="text-amber-500">{marcacao.servico?.preco?.toFixed(2)}€</TableCell>
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
                        </div>
                      );
                    })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="perfil">
            <PerfilTab user={user} fetchUserData={() => fetchUserData(localStorage.getItem('token'))} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function PerfilTab({ user, fetchUserData }) {
  const [nome, setNome] = useState('');
  const [telemovel, setTelemovel] = useState('');
  const [biografia, setBiografia] = useState('');
  const [especialidades, setEspecialidades] = useState('');
  const [foto, setFoto] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setNome(user.nome || '');
      setTelemovel(user.telemovel || '');
      setBiografia(user.biografia || '');
      setEspecialidades(Array.isArray(user.especialidades) ? user.especialidades.join(', ') : '');
      setFoto(user.foto || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    const especialidadesArray = especialidades
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    try {
      const response = await fetch('/api/barbeiro/perfil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          nome,
          telemovel,
          biografia,
          especialidades: especialidadesArray,
          foto: foto || null,
          password: password || undefined
        })
      });

      if (response.ok) {
        setSuccess('Perfil atualizado com sucesso!');
        setPassword('');
        fetchUserData();
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao atualizar perfil');
      }
    } catch (err) {
      setError('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="h-6 w-6" />
            O Meu Perfil
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Atualiza as tuas informações pessoais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {success && (
              <div className="bg-green-900/20 border border-green-900 text-green-400 px-4 py-2 rounded">
                {success}
              </div>
            )}
            {error && (
              <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-2 rounded">
                {error}
              </div>
            )}

            {/* Foto de Perfil */}
            <div className="flex items-center gap-6">
              <div className="shrink-0">
                {foto ? (
                  <img src={foto} alt="Foto de perfil" className="w-24 h-24 rounded-full object-cover border-2 border-amber-600" />
                ) : (
                  <div className="w-24 h-24 bg-amber-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {nome?.charAt(0).toUpperCase() || 'B'}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Label className="text-zinc-300">URL da Foto de Perfil</Label>
                <Input
                  value={foto}
                  onChange={(e) => setFoto(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-white"
                  placeholder="https://exemplo.com/minha-foto.jpg"
                />
                <p className="text-zinc-500 text-xs">Cole o URL de uma foto (Unsplash, Imgur, etc.)</p>
              </div>
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Nome *</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white"
                required
              />
            </div>

            {/* Email (readonly) */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Email</Label>
              <Input
                value={user?.email || ''}
                className="bg-zinc-900 border-zinc-700 text-zinc-500"
                disabled
              />
              <p className="text-zinc-500 text-xs">O email não pode ser alterado</p>
            </div>

            {/* Telemóvel */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Telemóvel</Label>
              <Input
                type="tel"
                value={telemovel}
                onChange={(e) => setTelemovel(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white"
                placeholder="+351 912 345 678"
              />
            </div>

            {/* Especialidades */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Especialidades</Label>
              <Input
                value={especialidades}
                onChange={(e) => setEspecialidades(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white"
                placeholder="Ex: Corte clássico, Barba, Degradê"
              />
              <p className="text-zinc-500 text-xs">Separe as especialidades por vírgulas</p>
            </div>

            {/* Biografia */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Biografia</Label>
              <textarea
                value={biografia}
                onChange={(e) => setBiografia(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-md px-3 py-2 min-h-[100px]"
                placeholder="Conta um pouco sobre ti e a tua experiência..."
              />
            </div>

            {/* Nova Password */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Nova Palavra-passe</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white"
                placeholder="Deixe vazio para manter a atual"
                minLength={6}
              />
              <p className="text-zinc-500 text-xs">Mínimo 6 caracteres. Deixe vazio para não alterar.</p>
            </div>

            <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'A guardar...' : 'Guardar Alterações'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}