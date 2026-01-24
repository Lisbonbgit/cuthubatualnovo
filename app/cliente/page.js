'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LogOut, Calendar, Plus } from 'lucide-react';

export default function ClientePanel() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marcacoes, setMarcacoes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  // Form data
  const [barbeiros, setBarbeiros] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [selectedBarbeiro, setSelectedBarbeiro] = useState('');
  const [selectedServico, setSelectedServico] = useState('');
  const [selectedData, setSelectedData] = useState('');
  const [selectedHora, setSelectedHora] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);

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
        if (data.user.tipo !== 'cliente') {
          router.push('/');
          return;
        }
        setUser(data.user);
        await fetchMarcacoes(token);
        await fetchBarbeirosEServicos(token);
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

  const fetchBarbeirosEServicos = async (token) => {
    // Fetch first barbearia's data (for demo purposes)
    // In production, client should select the barbearia first
    const barbeirosRes = await fetch('/api/barbeiros', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const barbeirosData = await barbeirosRes.json();
    setBarbeiros(barbeirosData.barbeiros || []);

    const servicosRes = await fetch('/api/servicos', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const servicosData = await servicosRes.json();
    setServicos(servicosData.servicos || []);
  };

  const fetchAvailableSlots = async () => {
    if (!selectedBarbeiro || !selectedData || !selectedServico) return;

    const response = await fetch(
      `/api/marcacoes/slots?barbeiro_id=${selectedBarbeiro}&data=${selectedData}&servico_id=${selectedServico}`,
      { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
    );
    const data = await response.json();
    setAvailableSlots(data.slots || []);
  };

  useEffect(() => {
    if (selectedBarbeiro && selectedData && selectedServico) {
      fetchAvailableSlots();
    }
  }, [selectedBarbeiro, selectedData, selectedServico]);

  const handleSubmitMarcacao = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/marcacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          barbeiro_id: selectedBarbeiro,
          servico_id: selectedServico,
          data: selectedData,
          hora: selectedHora
        })
      });

      if (response.ok) {
        alert('Marcação criada com sucesso!');
        setShowForm(false);
        setSelectedBarbeiro('');
        setSelectedServico('');
        setSelectedData('');
        setSelectedHora('');
        setAvailableSlots([]);
        fetchMarcacoes(localStorage.getItem('token'));
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao criar marcação');
      }
    } catch (error) {
      alert('Erro ao criar marcação');
    }
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
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Painel Cliente</h1>
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

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="h-6 w-6" />
                    Minhas Marcações
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Gestão das tuas marcações
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Marcação
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showForm && (
                <form onSubmit={handleSubmitMarcacao} className="mb-6 space-y-4 p-4 bg-zinc-900 rounded-lg">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Barbeiro</Label>
                      <Select value={selectedBarbeiro} onValueChange={setSelectedBarbeiro}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue placeholder="Selecione um barbeiro" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          {barbeiros.map((b) => (
                            <SelectItem key={b._id} value={b._id} className="text-white">
                              {b.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-zinc-300">Serviço</Label>
                      <Select value={selectedServico} onValueChange={setSelectedServico}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue placeholder="Selecione um serviço" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          {servicos.map((s) => (
                            <SelectItem key={s._id} value={s._id} className="text-white">
                              {s.nome} - {s.preco.toFixed(2)}€ ({s.duracao}min)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-zinc-300">Data</Label>
                      <Input
                        type="date"
                        value={selectedData}
                        onChange={(e) => setSelectedData(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="bg-zinc-800 border-zinc-700 text-white"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-zinc-300">Hora</Label>
                      <Select value={selectedHora} onValueChange={setSelectedHora}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue placeholder="Selecione uma hora" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          {availableSlots.length === 0 ? (
                            <div className="px-2 py-1 text-zinc-400 text-sm">Nenhum horário disponível</div>
                          ) : (
                            availableSlots.map((slot) => (
                              <SelectItem key={slot} value={slot} className="text-white">
                                {slot}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      className="bg-amber-600 hover:bg-amber-700"
                      disabled={!selectedHora}
                    >
                      Confirmar Marcação
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowForm(false)}
                      className="border-zinc-700"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}

              {marcacoes.length === 0 ? (
                <p className="text-zinc-400 text-center py-8">Nenhuma marcação agendada</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-700">
                        <TableHead className="text-zinc-300">Data</TableHead>
                        <TableHead className="text-zinc-300">Hora</TableHead>
                        <TableHead className="text-zinc-300">Barbeiro</TableHead>
                        <TableHead className="text-zinc-300">Serviço</TableHead>
                        <TableHead className="text-zinc-300">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marcacoes.map((marcacao) => (
                        <TableRow key={marcacao._id} className="border-zinc-700">
                          <TableCell className="text-white">
                            {new Date(marcacao.data).toLocaleDateString('pt-PT')}
                          </TableCell>
                          <TableCell className="text-white font-semibold">{marcacao.hora}</TableCell>
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
        </div>
      </div>
    </div>
  );
}