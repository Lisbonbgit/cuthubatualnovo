'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LogOut, Calendar } from 'lucide-react';

export default function BarbeiroPanel() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marcacoes, setMarcacoes] = useState([]);
  const [viewMode, setViewMode] = useState('calendario');
  const [filtroStatus, setFiltroStatus] = useState('todas');

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

  const marcacoesPorSemana = groupMarcacoesByWeek();

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Painel Barbeiro</h1>
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
            {marcacoes.length === 0 ? (
              <p className="text-zinc-400 text-center py-8">Nenhuma marcação agendada</p>
            ) : (
              <div className="space-y-8">
                {Object.entries(marcacoesPorSemana).map(([weekStart, weekMarcacoes]) => {
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
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}