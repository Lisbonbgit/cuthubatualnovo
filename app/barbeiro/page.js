'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Calendar, User, Save } from 'lucide-react';

export default function BarbeiroPanel() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marcacoes, setMarcacoes] = useState([]);
  const [viewMode, setViewMode] = useState('calendario');
  const [filtroStatus, setFiltroStatus] = useState('todas');
  const [weekOffset, setWeekOffset] = useState(0); // Para navegação entre semanas

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
        if (data.user.tipo !== 'barbeiro') {
          router.push('/');
          return;
        }
        setUser(data.user);
        await fetchMarcacoes(token);
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
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
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
      fetchMarcacoes(localStorage.getItem('token'));
    } catch (error) {
      console.error('Error:', error);
    }
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

  if (loading) {
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
                                  className={`border-l-4 p-2 rounded text-xs ${getStatusColor(marcacao.status)}`}
                                >
                                  <div className="font-semibold text-base">{marcacao.hora}</div>
                                  <div className="text-white font-medium">{marcacao.cliente?.nome}</div>
                                  <div className="text-xs opacity-80 mb-1">{marcacao.servico?.nome}</div>
                                  {marcacao.cliente?.email && (
                                    <div className="text-xs opacity-70">{marcacao.cliente.email}</div>
                                  )}
                                  <div className="text-xs opacity-80 mt-1">
                                    {marcacao.servico?.duracao} min • {marcacao.servico?.preco}€
                                  </div>
                                  
                                  {/* Botões de Ação */}
                                  {marcacao.status === 'pendente' && (
                                    <div className="flex gap-1 mt-2">
                                      <Button
                                        size="sm"
                                        className="h-6 text-xs flex-1 bg-green-600 hover:bg-green-700"
                                        onClick={() => handleUpdateStatus(marcacao._id, 'aceita')}
                                      >
                                        ✓ Aceitar
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="h-6 text-xs flex-1 bg-red-600 hover:bg-red-700"
                                        onClick={() => handleUpdateStatus(marcacao._id, 'rejeitada')}
                                      >
                                        ✗ Rejeitar
                                      </Button>
                                    </div>
                                  )}
                                  {marcacao.status === 'aceita' && (
                                    <Button
                                      size="sm"
                                      className="h-6 text-xs w-full mt-2 bg-blue-600 hover:bg-blue-700"
                                      onClick={() => handleUpdateStatus(marcacao._id, 'concluida')}
                                    >
                                      ✓✓ Concluir
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