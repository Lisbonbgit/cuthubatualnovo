'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Scissors, Clock, Euro, Calendar, User, X, LogOut, Settings, Phone, Mail, Save, Star, Check, CreditCard, Package, Users, MapPin } from 'lucide-react';
import { CancelConfirmModal } from '@/components/ui/modals';
import { Footer } from '@/components/ui/footer';

export default function BarbeariaPublicPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;

  const [mounted, setMounted] = useState(false);
  const [barbearia, setBarbearia] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [locais, setLocais] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Auth state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Booking state
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedLocal, setSelectedLocal] = useState('');
  const [selectedBarbeiro, setSelectedBarbeiro] = useState('');
  const [selectedServico, setSelectedServico] = useState('');
  const [selectedData, setSelectedData] = useState('');
  const [selectedHora, setSelectedHora] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Client Panel state
  const [showClientPanel, setShowClientPanel] = useState(false);
  const [clientTab, setClientTab] = useState('marcacoes');
  const [minhasMarcacoes, setMinhasMarcacoes] = useState([]);
  const [loadingMarcacoes, setLoadingMarcacoes] = useState(false);

  // Checkout state
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Cancel Modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [marcacaoToCancel, setMarcacaoToCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Profile edit state
  const [editNome, setEditNome] = useState('');
  const [editTelemovel, setEditTelemovel] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [minDate, setMinDate] = useState('');

  useEffect(() => {
    setMounted(true);
    // Definir data mínima apenas no cliente
    setMinDate(new Date().toISOString().split('T')[0]);
    if (slug) {
      fetchBarbeariaData();
      checkAuth();
    }
  }, [slug]);

  const checkAuth = () => {
    if (typeof window === 'undefined') return;
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
        setEditNome(data.user.nome || '');
        setEditTelemovel(data.user.telemovel || '');
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
      setLocais(data.locais || []);
      setPlanos(data.planos || []);
    } catch (error) {
      console.error('Error:', error);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const fetchMinhasMarcacoes = async () => {
    setLoadingMarcacoes(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/marcacoes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMinhasMarcacoes(data.marcacoes || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingMarcacoes(false);
    }
  };

  const handleAuth = async (e, mode) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const nome = formData.get('nome');
    const telemovel = formData.get('telemovel');

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login' 
        ? { email, password }
        : { nome, email, password, telemovel, tipo: 'cliente', barbearia_id: barbearia._id };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        setEditNome(data.user.nome || '');
        setEditTelemovel(data.user.telemovel || '');
        setShowAuthModal(false);
        setShowBookingForm(true);
      } else {
        setAuthError(data.error || 'Erro na autenticação');
      }
    } catch (error) {
      setAuthError('Erro de conexão');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setShowClientPanel(false);
    setMinhasMarcacoes([]);
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

  // Reset barbeiro selection when local changes
  useEffect(() => {
    setSelectedBarbeiro('');
    setSelectedHora('');
    setAvailableSlots([]);
  }, [selectedLocal]);

  // Get barbeiros filtered by selected local
  const barbeirosDisponiveis = selectedLocal 
    ? barbeiros.filter(b => 
        b.local_id === selectedLocal || !b.local_id // barbeiros específicos do local ou sem local definido
      )
    : barbeiros;

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
          hora: selectedHora,
          local_id: selectedLocal || null
        })
      });

      if (response.ok) {
        setBookingSuccess(true);
        setTimeout(() => {
          setShowBookingForm(false);
          setBookingSuccess(false);
          setSelectedLocal('');
          setSelectedBarbeiro('');
          setSelectedServico('');
          setSelectedData('');
          setSelectedHora('');
          setAvailableSlots([]);
        }, 2000);
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao criar marcação');
      }
    } catch (error) {
      alert('Erro ao criar marcação');
    }
  };

  const handleCancelMarcacao = async (marcacaoId) => {
    setCancelLoading(true);
    try {
      const response = await fetch(`/api/marcacoes/${marcacaoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'cancelada' })
      });

      if (response.ok) {
        setShowCancelModal(false);
        setMarcacaoToCancel(null);
        fetchMinhasMarcacoes();
      } else {
        alert('Erro ao cancelar marcação');
      }
    } catch (error) {
      alert('Erro ao cancelar marcação');
    } finally {
      setCancelLoading(false);
    }
  };

  const openCancelModal = (marcacao) => {
    setMarcacaoToCancel(marcacao);
    setShowCancelModal(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess('');
    setProfileError('');

    try {
      const response = await fetch('/api/cliente/perfil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          nome: editNome,
          telemovel: editTelemovel,
          password: editPassword || undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setProfileSuccess('Perfil atualizado com sucesso!');
        setEditPassword('');
      } else {
        const data = await response.json();
        setProfileError(data.error || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      setProfileError('Erro de conexão');
    } finally {
      setProfileLoading(false);
    }
  };

  // Função para checkout de plano
  const handlePlanCheckout = async (plano) => {
    // Se não está logado, mostrar modal de autenticação
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Verificar se o Stripe está configurado
    if (!barbearia?.stripe_configured) {
      alert('Esta barbearia ainda não configurou os pagamentos. Por favor, contacte a barbearia.');
      return;
    }

    setCheckoutLoading(true);

    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          plano_id: plano._id,
          barbearia_id: barbearia._id,
          success_url: `${window.location.origin}/barbearia/${slug}?success=true&plano=${plano.nome}`,
          cancel_url: `${window.location.origin}/barbearia/${slug}?canceled=true`
        })
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirecionar para o Stripe Checkout
        window.location.href = data.url;
      } else {
        alert(data.error || 'Erro ao iniciar checkout');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Erro ao processar pagamento');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pendente': return 'bg-yellow-900/50 text-yellow-400';
      case 'aceita': return 'bg-green-900/50 text-green-400';
      case 'concluida': return 'bg-blue-900/50 text-blue-400';
      case 'rejeitada': return 'bg-red-900/50 text-red-400';
      case 'cancelada': return 'bg-gray-900/50 text-gray-400';
      default: return 'bg-zinc-900/50 text-zinc-400';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'pendente': return '⏳ Pendente';
      case 'aceita': return '✓ Confirmada';
      case 'concluida': return '✓✓ Concluída';
      case 'rejeitada': return '✗ Rejeitada';
      case 'cancelada': return '⊘ Cancelada';
      default: return status;
    }
  };

  if (!mounted || loading) {
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
    <div className="min-h-screen bg-zinc-950" suppressHydrationWarning>
      {/* Top Bar for Logged User */}
      {user && (
        <div className="bg-zinc-900 border-b border-zinc-800 py-2">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center gap-2 text-zinc-300">
              <User className="h-4 w-4" />
              <span className="text-sm">Olá, <strong className="text-amber-500">{user.nome}</strong></span>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white"
                onClick={() => {
                  setShowClientPanel(true);
                  fetchMinhasMarcacoes();
                }}
              >
                <Settings className="h-4 w-4 mr-1" />
                Minha Conta
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-zinc-400 hover:text-white"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${barbearia.imagem_hero || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1920&q=80'})`,
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
            {!user && (
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white text-lg px-8"
                onClick={() => setShowAuthModal(true)}
              >
                <User className="mr-2 h-5 w-5" />
                Entrar / Registar
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-zinc-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Scissors className="h-12 w-12 text-amber-600 mx-auto mb-4" />
            <h2 className="text-4xl font-bold text-white mb-4">
              Nossos Serviços
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Serviços de qualidade profissional para o seu estilo
            </p>
          </div>
          
          {servicos.length === 0 ? (
            <p className="text-zinc-400 text-center">Nenhum serviço disponível no momento</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {servicos.map((servico) => (
                <Card key={servico._id} className="bg-zinc-800 border-zinc-700 hover:border-amber-600 transition-all group">
                  <CardHeader>
                    <div className="w-14 h-14 bg-amber-600/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-amber-600 transition-colors">
                      <Scissors className="h-7 w-7 text-amber-600 group-hover:text-white transition-colors" />
                    </div>
                    <CardTitle className="text-white text-xl">{servico.nome}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center text-zinc-400">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{servico.duracao} min</span>
                      </div>
                      <div className="flex items-center text-amber-500 font-bold text-2xl">
                        {servico.preco?.toFixed(2)}€
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
                      <Calendar className="h-4 w-4 mr-2" />
                      Agendar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Plans Section - Logo depois dos Serviços */}
      {planos.length > 0 && (
        <section className="py-16 bg-zinc-950">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <CreditCard className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h2 className="text-4xl font-bold text-white mb-4">
                Planos & Assinaturas
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                Escolha o plano ideal para si e aproveite benefícios exclusivos
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {planos.map((plano, index) => (
                <Card 
                  key={plano._id} 
                  className={`bg-zinc-800 border-zinc-700 relative overflow-hidden ${
                    index === 1 ? 'border-amber-600 scale-105 shadow-xl shadow-amber-600/20' : 'hover:border-amber-600'
                  } transition-all`}
                >
                  {index === 1 && (
                    <div className="absolute top-0 left-0 right-0 bg-amber-600 text-white text-center py-1 text-sm font-semibold">
                      <Star className="h-4 w-4 inline mr-1" />
                      Mais Popular
                    </div>
                  )}
                  <CardHeader className={index === 1 ? 'pt-10' : ''}>
                    <CardTitle className="text-white text-2xl text-center">{plano.nome}</CardTitle>
                    <div className="text-center mt-4">
                      <span className="text-4xl font-bold text-amber-500">{plano.preco?.toFixed(2)}€</span>
                      <span className="text-zinc-400">/{plano.duracao || 30} dias</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {plano.descricao && (
                      <p className="text-zinc-400 text-center mb-6">{plano.descricao}</p>
                    )}
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center gap-2 text-zinc-300">
                        <Check className="h-5 w-5 text-green-500" />
                        Acesso a todos os serviços
                      </li>
                      <li className="flex items-center gap-2 text-zinc-300">
                        <Check className="h-5 w-5 text-green-500" />
                        Marcação prioritária
                      </li>
                      <li className="flex items-center gap-2 text-zinc-300">
                        <Check className="h-5 w-5 text-green-500" />
                        Descontos exclusivos
                      </li>
                    </ul>
                    <Button 
                      className={`w-full ${index === 1 ? 'bg-amber-600 hover:bg-amber-700' : 'bg-zinc-700 hover:bg-zinc-600'}`}
                      onClick={() => handlePlanCheckout(plano)}
                      disabled={checkoutLoading}
                    >
                      {checkoutLoading ? 'A processar...' : 'Escolher Plano'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products Section - Depois dos Planos */}
      {produtos.length > 0 && (
        <section className="py-16 bg-zinc-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Package className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h2 className="text-4xl font-bold text-white mb-4">
                Produtos
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                Os melhores produtos para cuidar do seu visual em casa
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {produtos.map((produto) => (
                <Card key={produto._id} className="bg-zinc-800 border-zinc-700 overflow-hidden hover:border-amber-600 transition-all group">
                  {produto.imagem && (
                    <div 
                      className="h-48 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                      style={{ backgroundImage: `url(${produto.imagem})` }}
                    />
                  )}
                  <CardHeader>
                    <CardTitle className="text-white">{produto.nome}</CardTitle>
                    {produto.descricao && (
                      <CardDescription className="text-zinc-400">{produto.descricao}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-amber-500 font-bold text-2xl">
                      {produto.preco?.toFixed(2)}€
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Barbers Section - Por último */}
      {barbeiros.length > 0 && (
        <section className="py-16 bg-zinc-950">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Users className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h2 className="text-4xl font-bold text-white mb-4">
                Nossa Equipa
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                Profissionais qualificados prontos para cuidar de si
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {barbeiros.map((barbeiro) => (
                <Card key={barbeiro._id} className="bg-zinc-800 border-zinc-700 text-center hover:border-amber-600 transition-all group">
                  <CardHeader>
                    <div className="relative mx-auto mb-4">
                      {barbeiro.foto ? (
                        <img 
                          src={barbeiro.foto} 
                          alt={barbeiro.nome} 
                          className="w-24 h-24 rounded-full object-cover border-3 border-amber-600 group-hover:scale-105 transition-transform" 
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full mx-auto flex items-center justify-center group-hover:scale-105 transition-transform">
                          <User className="h-12 w-12 text-white" />
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-white text-xl">{barbeiro.nome}</CardTitle>
                    {barbeiro.especialidades && barbeiro.especialidades.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center mt-3">
                        {barbeiro.especialidades.slice(0, 3).map((esp, i) => (
                          <span key={i} className="text-xs bg-amber-900/30 text-amber-400 px-2 py-1 rounded-full">
                            {esp}
                          </span>
                        ))}
                      </div>
                    )}
                    {barbeiro.biografia && (
                      <p className="text-zinc-400 text-sm mt-3 line-clamp-2">
                        {barbeiro.biografia}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      className="border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white w-full"
                      onClick={() => {
                        setSelectedBarbeiro(barbeiro._id);
                        if (user) {
                          setShowBookingForm(true);
                        } else {
                          setShowAuthModal(true);
                        }
                      }}
                    >
                      Marcar com {barbeiro.nome.split(' ')[0]}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Auth Modal */}
      {showAuthModal && !user && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-zinc-800 border-zinc-700 max-w-md w-full relative">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Scissors className="h-8 w-8 text-amber-600" />
                <div>
                  <CardTitle className="text-white">Bem-vindo à {barbearia.nome}</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Faz login ou cria uma conta para marcar
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {authError && (
                <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-2 rounded mb-4">
                  {authError}
                </div>
              )}
              
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
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Palavra-passe</Label>
                      <Input
                        type="password"
                        name="password"
                        className="bg-zinc-900 border-zinc-700 text-white"
                        placeholder="••••••"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-amber-600 hover:bg-amber-700"
                      disabled={authLoading}
                    >
                      {authLoading ? 'A entrar...' : 'Entrar'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={(e) => handleAuth(e, 'register')} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Nome Completo</Label>
                      <Input
                        type="text"
                        name="nome"
                        className="bg-zinc-900 border-zinc-700 text-white"
                        placeholder="O seu nome"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Email</Label>
                      <Input
                        type="email"
                        name="email"
                        className="bg-zinc-900 border-zinc-700 text-white"
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Telemóvel</Label>
                      <Input
                        type="tel"
                        name="telemovel"
                        className="bg-zinc-900 border-zinc-700 text-white"
                        placeholder="+351 912 345 678"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Palavra-passe</Label>
                      <Input
                        type="password"
                        name="password"
                        className="bg-zinc-900 border-zinc-700 text-white"
                        placeholder="Mínimo 6 caracteres"
                        minLength="6"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-amber-600 hover:bg-amber-700"
                      disabled={authLoading}
                    >
                      {authLoading ? 'A registar...' : 'Criar Conta'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingForm && user && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-zinc-800 border-zinc-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={() => {
                setShowBookingForm(false);
                setBookingSuccess(false);
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
            
            {bookingSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Marcação Criada!</h2>
                <p className="text-zinc-400">A sua marcação foi enviada e está pendente de confirmação.</p>
              </div>
            ) : (
              <>
                <CardHeader>
                  <CardTitle className="text-white">Nova Marcação</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Preenche os dados para agendar o teu serviço
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBooking} className="space-y-4">
                    {/* Seletor de Local - só aparece se houver mais de 1 local */}
                    {locais.length > 1 && (
                      <div className="space-y-2 p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg">
                        <Label className="text-amber-400 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Selecione o Local
                        </Label>
                        <Select value={selectedLocal} onValueChange={setSelectedLocal}>
                          <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                            <SelectValue placeholder="Escolha o local da marcação" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            {locais.filter(l => l.ativo !== false).map((local) => (
                              <SelectItem key={local._id} value={local._id} className="text-white">
                                <div className="flex flex-col">
                                  <span>{local.nome}</span>
                                  <span className="text-zinc-400 text-xs">{local.morada}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Mostrar seleção de profissional apenas se permitido pela barbearia */}
                      {barbearia.permitir_escolha_profissional !== false && (
                        <div className="space-y-2">
                          <Label className="text-zinc-300">Profissional</Label>
                          <Select value={selectedBarbeiro} onValueChange={setSelectedBarbeiro}>
                            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                              <SelectValue placeholder="Selecione um profissional" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700">
                              {barbeirosDisponiveis.length === 0 ? (
                                <div className="px-2 py-1 text-zinc-400 text-sm">
                                  {locais.length > 1 && !selectedLocal 
                                    ? 'Selecione um local primeiro' 
                                    : 'Nenhum profissional disponível'}
                                </div>
                              ) : (
                                barbeirosDisponiveis.map((b) => (
                                  <SelectItem key={b._id} value={b._id} className="text-white">
                                    {b.nome}
                                    {b.local_id && locais.length > 1 && (
                                      <span className="text-zinc-400 ml-2 text-xs">
                                        ({locais.find(l => l._id === b.local_id)?.nome || 'Local'})
                                      </span>
                                    )}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className={`space-y-2 ${barbearia.permitir_escolha_profissional === false ? 'md:col-span-2' : ''}`}>
                        <Label className="text-zinc-300">Serviço</Label>
                        <Select value={selectedServico} onValueChange={setSelectedServico}>
                          <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                            <SelectValue placeholder="Selecione um serviço" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            {servicos.map((s) => (
                              <SelectItem key={s._id} value={s._id} className="text-white">
                                {s.nome} - {s.preco?.toFixed(2)}€ ({s.duracao}min)
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
                          min={minDate}
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
                                {selectedBarbeiro && selectedData && selectedServico 
                                  ? 'Nenhum horário disponível' 
                                  : 'Selecione barbeiro, serviço e data'}
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

                    <Button 
                      type="submit" 
                      className="w-full bg-amber-600 hover:bg-amber-700"
                      disabled={!selectedHora}
                    >
                      Confirmar Marcação
                    </Button>
                  </form>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Client Panel Modal */}
      {showClientPanel && user && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-zinc-800 border-zinc-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={() => setShowClientPanel(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
            
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {user.nome?.charAt(0).toUpperCase() || 'C'}
                </div>
                <div>
                  <CardTitle className="text-white">Minha Conta</CardTitle>
                  <CardDescription className="text-zinc-400">{user.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={clientTab} onValueChange={setClientTab}>
                <TabsList className="grid w-full grid-cols-2 bg-zinc-900 mb-6">
                  <TabsTrigger value="marcacoes" className="data-[state=active]:bg-amber-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Minhas Marcações
                  </TabsTrigger>
                  <TabsTrigger value="perfil" className="data-[state=active]:bg-amber-600">
                    <User className="h-4 w-4 mr-2" />
                    Meu Perfil
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="marcacoes">
                  {loadingMarcacoes ? (
                    <div className="text-center py-8 text-zinc-400">A carregar...</div>
                  ) : minhasMarcacoes.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                      <p className="text-zinc-400">Ainda não tens marcações</p>
                      <Button 
                        className="mt-4 bg-amber-600 hover:bg-amber-700"
                        onClick={() => {
                          setShowClientPanel(false);
                          setShowBookingForm(true);
                        }}
                      >
                        Fazer Nova Marcação
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-zinc-700">
                            <TableHead className="text-zinc-300">Data</TableHead>
                            <TableHead className="text-zinc-300">Hora</TableHead>
                            <TableHead className="text-zinc-300">Serviço</TableHead>
                            <TableHead className="text-zinc-300">Profissional</TableHead>
                            <TableHead className="text-zinc-300">Preço</TableHead>
                            <TableHead className="text-zinc-300">Status</TableHead>
                            <TableHead className="text-zinc-300">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {minhasMarcacoes.map((marcacao) => (
                            <TableRow key={marcacao._id} className="border-zinc-700">
                              <TableCell className="text-white">
                                {new Date(marcacao.data).toLocaleDateString('pt-PT', { 
                                  weekday: 'short', 
                                  day: '2-digit', 
                                  month: 'short' 
                                })}
                              </TableCell>
                              <TableCell className="text-white font-semibold">{marcacao.hora}</TableCell>
                              <TableCell className="text-white">{marcacao.servico?.nome}</TableCell>
                              <TableCell className="text-white">{marcacao.barbeiro?.nome}</TableCell>
                              <TableCell className="text-amber-500 font-semibold">
                                {marcacao.servico?.preco?.toFixed(2)}€
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(marcacao.status)}`}>
                                  {getStatusLabel(marcacao.status)}
                                </span>
                              </TableCell>
                              <TableCell>
                                {(marcacao.status === 'pendente' || marcacao.status === 'aceita') && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => openCancelModal(marcacao)}
                                  >
                                    Cancelar
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="perfil">
                  <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                    {profileSuccess && (
                      <div className="bg-green-900/20 border border-green-900 text-green-400 px-4 py-2 rounded">
                        {profileSuccess}
                      </div>
                    )}
                    {profileError && (
                      <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-2 rounded">
                        {profileError}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-zinc-300">Nome</Label>
                      <Input
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        className="bg-zinc-900 border-zinc-700 text-white"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-zinc-300">Email</Label>
                      <Input
                        value={user.email}
                        className="bg-zinc-900 border-zinc-700 text-zinc-500"
                        disabled
                      />
                      <p className="text-zinc-500 text-xs">O email não pode ser alterado</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-zinc-300">Telemóvel</Label>
                      <Input
                        type="tel"
                        value={editTelemovel}
                        onChange={(e) => setEditTelemovel(e.target.value)}
                        className="bg-zinc-900 border-zinc-700 text-white"
                        placeholder="+351 912 345 678"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-zinc-300">Nova Palavra-passe</Label>
                      <Input
                        type="password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        className="bg-zinc-900 border-zinc-700 text-white"
                        placeholder="Deixe vazio para manter a atual"
                        minLength={6}
                      />
                    </div>

                    <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={profileLoading}>
                      <Save className="h-4 w-4 mr-2" />
                      {profileLoading ? 'A guardar...' : 'Guardar Alterações'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <CancelConfirmModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setMarcacaoToCancel(null);
        }}
        onConfirm={() => handleCancelMarcacao(marcacaoToCancel?._id)}
        marcacao={marcacaoToCancel}
        loading={cancelLoading}
      />

      {/* Footer */}
      <Footer variant="dark" />
    </div>
  );
}
