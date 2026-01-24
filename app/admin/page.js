'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LogOut, Plus, Trash2, Users, Scissors, Package, Calendar, Clock, Settings } from 'lucide-react';

export default function AdminPanel() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [barbeiros, setBarbeiros] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [marcacoes, setMarcacoes] = useState([]);
  const [horarios, setHorarios] = useState([]);

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
          fetchHorarios(token)
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
          <TabsList className="bg-zinc-800 grid grid-cols-5 w-full">
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
        </Tabs>
      </div>
    </div>
  );
}

function MarcacoesTab({ marcacoes, fetchMarcacoes }) {
  return (
    <Card className="bg-zinc-800 border-zinc-700">
      <CardHeader>
        <CardTitle className="text-white">Todas as Marcações</CardTitle>
        <CardDescription className="text-zinc-400">
          Gestão de marcações da barbearia
        </CardDescription>
      </CardHeader>
      <CardContent>
        {marcacoes.length === 0 ? (
          <p className="text-zinc-400 text-center py-8">Nenhuma marcação registada</p>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {marcacoes.map((marcacao) => (
                  <TableRow key={marcacao._id} className="border-zinc-700">
                    <TableCell className="text-white">{new Date(marcacao.data).toLocaleDateString('pt-PT')}</TableCell>
                    <TableCell className="text-white">{marcacao.hora}</TableCell>
                    <TableCell className="text-white">{marcacao.cliente?.nome}</TableCell>
                    <TableCell className="text-white">{marcacao.barbeiro?.nome}</TableCell>
                    <TableCell className="text-white">{marcacao.servico?.nome}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        marcacao.status === 'confirmada' ? 'bg-green-900/50 text-green-400' :
                        marcacao.status === 'cancelada' ? 'bg-red-900/50 text-red-400' :
                        'bg-yellow-900/50 text-yellow-400'
                      }`}>
                        {marcacao.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BarbeirosTab({ barbeiros, fetchBarbeiros }) {
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/barbeiros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ nome, email, password })
      });

      if (response.ok) {
        setNome('');
        setEmail('');
        setPassword('');
        setShowForm(false);
        fetchBarbeiros();
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (error) {
      setError('Erro ao adicionar barbeiro');
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

  return (
    <div className="space-y-4">
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white">Barbeiros</CardTitle>
              <CardDescription className="text-zinc-400">Gerir equipa de barbeiros</CardDescription>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
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
              {error && (
                <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-2 rounded">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Nome</Label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Palavra-passe</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    minLength="6"
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

          {barbeiros.length === 0 ? (
            <p className="text-zinc-400 text-center py-8">Nenhum barbeiro registado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-700">
                  <TableHead className="text-zinc-300">Nome</TableHead>
                  <TableHead className="text-zinc-300">Email</TableHead>
                  <TableHead className="text-zinc-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {barbeiros.map((barbeiro) => (
                  <TableRow key={barbeiro._id} className="border-zinc-700">
                    <TableCell className="text-white">{barbeiro.nome}</TableCell>
                    <TableCell className="text-white">{barbeiro.email}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(barbeiro._id)}
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