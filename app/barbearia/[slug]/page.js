'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Scissors, Clock, Euro, Calendar, MapPin, Phone, Mail, User, Lock } from 'lucide-react';

export default function BarbeariaPublicPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;

  const [barbearia, setBarbearia] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Auth state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [user, setUser] = useState(null);

  // Booking state
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedBarbeiro, setSelectedBarbeiro] = useState('');
  const [selectedServico, setSelectedServico] = useState('');
  const [selectedData, setSelectedData] = useState('');
  const [selectedHora, setSelectedHora] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    if (slug) {
      fetchBarbeariaData();
      checkAuth();
    }
  }, [slug]);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser(token);
    }
  };

  const fetchCurrentUser = async (token) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchBarbeariaData = async () => {
    try {
      const response = await fetch(`/api/barbearias/${slug}`);
      
      if (!response.ok) {
        setError('Barbearia não encontrada');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setBarbearia(data.barbearia);
      setServicos(data.servicos || []);
      setProdutos(data.produtos || []);
      setBarbeiros(data.barbeiros || []);
    } catch (error) {
      console.error('Error:', error);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e, mode) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const nome = formData.get('nome');

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login' 
        ? { email, password }
        : { nome, email, password, tipo: 'cliente', barbearia_id: barbearia._id };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        setShowAuthModal(false);
        setShowBookingForm(true);
      } else {
        alert(data.error || 'Erro na autenticação');
      }
    } catch (error) {
      alert('Erro de conexão');
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedBarbeiro || !selectedData || !selectedServico) return;

    const token = localStorage.getItem('token');
    const response = await fetch(
      `/api/marcacoes/slots?barbeiro_id=${selectedBarbeiro}&data=${selectedData}&servico_id=${selectedServico}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const data = await response.json();
    setAvailableSlots(data.slots || []);
  };

  useEffect(() => {
    if (selectedBarbeiro && selectedData && selectedServico) {
      fetchAvailableSlots();
    }
  }, [selectedBarbeiro, selectedData, selectedServico]);

  const handleBooking = async (e) => {
    e.preventDefault();

    if (!user) {
      setShowAuthModal(true);
      return;
    }

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
        setShowBookingForm(false);
        setSelectedBarbeiro('');
        setSelectedServico('');
        setSelectedData('');
        setSelectedHora('');
        setAvailableSlots([]);
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao criar marcação');
      }
    } catch (error) {
      alert('Erro ao criar marcação');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-amber-500 text-xl">A carregar...</div>
      </div>
    );
  }

  if (error || !barbearia) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Card className="bg-zinc-800 border-zinc-700 max-w-md">
          <CardHeader>
            <CardTitle className="text-white">Barbearia não encontrada</CardTitle>
            <CardDescription className="text-zinc-400">
              A barbearia que procuras não existe ou foi removida.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full bg-amber-600 hover:bg-amber-700">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1920&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/90 via-zinc-950/70 to-zinc-950"></div>
        </div>

        <div className="container relative z-10 text-center">
          <Scissors className="h-16 w-16 text-amber-600 mx-auto mb-4" />
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            {barbearia.nome}
          </h1>
          {barbearia.descricao && (
            <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">
              {barbearia.descricao}
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-amber-600 hover:bg-amber-700 text-white text-lg px-8"
              onClick={() => {
                if (user) {
                  setShowBookingForm(true);
                } else {
                  setShowAuthModal(true);
                }
              }}
            >
              <Calendar className="mr-2 h-5 w-5" />
              Marcar Agora
            </Button>
            {user && (
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white text-lg px-8"
                onClick={() => router.push('/cliente')}
              >
                Meu Painel
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-zinc-900">
        <div className="container">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Nossos Serviços
          </h2>
          
          {servicos.length === 0 ? (
            <p className="text-zinc-400 text-center">Nenhum serviço disponível no momento</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {servicos.map((servico) => (
                <Card key={servico._id} className="bg-zinc-800 border-zinc-700 hover:border-amber-600 transition-all">
                  <CardHeader>
                    <Scissors className="h-10 w-10 text-amber-600 mb-2" />
                    <CardTitle className="text-white text-xl">{servico.nome}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center text-zinc-400">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{servico.duracao} min</span>
                      </div>
                      <div className="flex items-center text-amber-500 font-bold text-xl">
                        <Euro className="h-5 w-5 mr-1" />
                        <span>{servico.preco.toFixed(2)}</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-amber-600 hover:bg-amber-700"
                      onClick={() => {
                        setSelectedServico(servico._id);
                        if (user) {
                          setShowBookingForm(true);
                        } else {
                          setShowAuthModal(true);
                        }
                      }}
                    >
                      Agendar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Barbers Section */}
      {barbeiros.length > 0 && (
        <section className="py-16 bg-zinc-950">
          <div className="container">
            <h2 className="text-4xl font-bold text-white text-center mb-12">
              Nossa Equipa
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {barbeiros.map((barbeiro) => (
                <Card key={barbeiro._id} className="bg-zinc-800 border-zinc-700 text-center">
                  <CardHeader>
                    <div className="w-20 h-20 bg-amber-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <User className="h-10 w-10 text-white" />
                    </div>
                    <CardTitle className="text-white">{barbeiro.nome}</CardTitle>
                    <CardDescription className="text-zinc-400">Barbeiro Profissional</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products Section */}
      {produtos.length > 0 && (
        <section className="py-16 bg-zinc-900">
          <div className="container">
            <h2 className="text-4xl font-bold text-white text-center mb-12">
              Produtos
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {produtos.map((produto) => (
                <Card key={produto._id} className="bg-zinc-800 border-zinc-700">
                  <div 
                    className="h-48 bg-cover bg-center"
                    style={{ backgroundImage: `url(${produto.imagem})` }}
                  />
                  <CardHeader>
                    <CardTitle className="text-white">{produto.nome}</CardTitle>
                    <CardDescription className="text-zinc-400">{produto.descricao}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-amber-500 font-bold text-2xl">
                      {produto.preco.toFixed(2)}€
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Booking Modal */}
      {showBookingForm && user && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-zinc-800 border-zinc-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-white">Nova Marcação</CardTitle>
              <CardDescription className="text-zinc-400">
                Preenche os dados para agendar o teu serviço
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBooking} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Barbeiro</Label>
                    <Select value={selectedBarbeiro} onValueChange={setSelectedBarbeiro}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
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
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
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
                      className="bg-zinc-900 border-zinc-700 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Hora</Label>
                    <Select value={selectedHora} onValueChange={setSelectedHora}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectValue placeholder="Selecione uma hora" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {availableSlots.length === 0 ? (
                          <div className="px-2 py-1 text-zinc-400 text-sm">
                            Nenhum horário disponível
                          </div>
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

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                    disabled={!selectedHora}
                  >
                    Confirmar Marcação
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    className="border-zinc-700"
                    onClick={() => setShowBookingForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && !user && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-zinc-800 border-zinc-700 max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-white">Entrar ou Registar</CardTitle>
              <CardDescription className="text-zinc-400">
                Faz login ou cria uma conta para continuar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={authMode} onValueChange={setAuthMode}>
                <TabsList className="grid w-full grid-cols-2 bg-zinc-900 mb-4">
                  <TabsTrigger value="login" className="data-[state=active]:bg-amber-600">
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger value="register" className="data-[state=active]:bg-amber-600">
                    Registar
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={(e) => handleAuth(e, 'login')} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Email</Label>
                      <Input
                        type="email"
                        name="email"
                        className="bg-zinc-900 border-zinc-700 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Palavra-passe</Label>
                      <Input
                        type="password"
                        name="password"
                        className="bg-zinc-900 border-zinc-700 text-white"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700">
                        Entrar
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setShowAuthModal(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={(e) => handleAuth(e, 'register')} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Nome</Label>
                      <Input
                        type="text"
                        name="nome"
                        className="bg-zinc-900 border-zinc-700 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Email</Label>
                      <Input
                        type="email"
                        name="email"
                        className="bg-zinc-900 border-zinc-700 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Palavra-passe</Label>
                      <Input
                        type="password"
                        name="password"
                        className="bg-zinc-900 border-zinc-700 text-white"
                        minLength="6"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700">
                        Registar
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setShowAuthModal(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-zinc-900 border-t border-zinc-800 py-8">
        <div className="container text-center text-zinc-500">
          <p>&copy; 2025 {barbearia.nome}. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
