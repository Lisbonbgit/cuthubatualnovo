'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LogOut, Plus, Trash2, Users, Scissors, Package, Calendar, Clock, Settings, UserCheck } from 'lucide-react';

export default function AdminPanel() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [barbeiros, setBarbeiros] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [marcacoes, setMarcacoes] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [barbeariaSettings, setBarbeariaSettings] = useState(null);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
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
          fetchBarbeariaSettings(token)
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  if (loading) {
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
          <TabsList className="bg-zinc-800 grid grid-cols-6 w-full">
            <TabsTrigger value="marcacoes" className="data-[state=active]:bg-amber-600">
              <Calendar className="mr-2 h-4 w-4" />
              Marcações
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
            <TabsTrigger value="horarios" className="data-[state=active]:bg-amber-600">
              <Clock className="mr-2 h-4 w-4" />
              Horários
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="data-[state=active]:bg-amber-600">
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="marcacoes">
            <MarcacoesTab marcacoes={marcacoes} fetchMarcacoes={() => fetchMarcacoes(localStorage.getItem('token'))} />
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
  const [viewMode, setViewMode] = useState('calendario'); // 'calendario' ou 'tabela'

  useEffect(() => {
    fetchBarbeiros();
  }, []);

  const fetchBarbeiros = async () => {
    const response = await fetch('/api/barbeiros', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    setBarbeiros(data.barbeiros || []);
  };

  const handleUpdateStatus = async (marcacaoId, newStatus) => {
    try {
      await fetch(`/api/marcacoes/${marcacaoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchMarcacoes();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getWeekDays = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();
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

            {/* Toggle View */}
            <div className="flex gap-2">
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

      {/* Vista Calendário */}
      {viewMode === 'calendario' && (
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">
              Semana: {weekDays[0].toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })} - {weekDays[6].toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
            </CardTitle>
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
                            className={`border-l-4 p-2 rounded text-xs ${getStatusColor(marcacao.status)}`}
                          >
                            <div className="font-semibold">{marcacao.hora}</div>
                            <div className="text-white">{marcacao.cliente?.nome}</div>
                            <div className="text-xs opacity-80">{marcacao.servico?.nome}</div>
                            <div className="text-xs opacity-80">{marcacao.barbeiro?.nome}</div>
                            
                            {/* Botões de Ação */}
                            {marcacao.status === 'pendente' && (
                              <div className="flex gap-1 mt-2">
                                <Button
                                  size="sm"
                                  className="h-6 text-xs bg-green-600 hover:bg-green-700"
                                  onClick={() => handleUpdateStatus(marcacao._id, 'aceita')}
                                >
                                  ✓
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-6 text-xs bg-red-600 hover:bg-red-700"
                                  onClick={() => handleUpdateStatus(marcacao._id, 'rejeitada')}
                                >
                                  ✗
                                </Button>
                              </div>
                            )}
                            {marcacao.status === 'aceita' && (
                              <Button
                                size="sm"
                                className="h-6 text-xs w-full mt-2 bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleUpdateStatus(marcacao._id, 'concluida')}
                              >
                                Concluir
                              </Button>
                            )}
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
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [duracao, setDuracao] = useState('30');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch('/api/servicos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ nome, preco, duracao })
      });

      setNome('');
      setPreco('');
      setDuracao('30');
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
          <Button onClick={() => setShowForm(!showForm)} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Serviço
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 space-y-4 p-4 bg-zinc-900 rounded-lg">
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
                {loading ? 'A adicionar...' : 'Adicionar'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {servicos.length === 0 ? (
          <p className="text-zinc-400 text-center py-8">Nenhum serviço registado</p>
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
                  <TableCell className="text-white">{servico.nome}</TableCell>
                  <TableCell className="text-white">{servico.preco.toFixed(2)}€</TableCell>
                  <TableCell className="text-white">{servico.duracao} min</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(servico._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch('/api/produtos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ nome, preco, descricao })
      });

      setNome('');
      setPreco('');
      setDescricao('');
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
          <Button onClick={() => setShowForm(!showForm)} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Produto
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 space-y-4 p-4 bg-zinc-900 rounded-lg">
            <div className="space-y-2">
              <Label className="text-zinc-300">Nome do Produto</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
                placeholder="Ex: Pomada para Cabelo"
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
                placeholder="25.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Descrição</Label>
              <Input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
                placeholder="Descrição do produto"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={loading}>
                {loading ? 'A adicionar...' : 'Adicionar'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {produtos.length === 0 ? (
          <p className="text-zinc-400 text-center py-8">Nenhum produto registado</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {produtos.map((produto) => (
              <Card key={produto._id} className="bg-zinc-900 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">{produto.nome}</CardTitle>
                  <CardDescription className="text-zinc-400">{produto.descricao}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-amber-500 text-xl font-bold">{produto.preco.toFixed(2)}€</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(produto._id)}
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (barbearia) {
      setNome(barbearia.nome || '');
      setDescricao(barbearia.descricao || '');
      setTelefone(barbearia.telefone || '');
      setEmailContacto(barbearia.email_contacto || '');
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
                  value={`${window.location.origin}/barbearia/${barbearia.slug}`}
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
    </div>
  );
}