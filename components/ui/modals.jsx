'use client';

import { CheckCircle2, AlertCircle, X, AlertTriangle, Calendar, User, Scissors, Clock, Euro, Phone, Mail, MapPin, Copy, Link, ExternalLink } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { useEffect, useState } from 'react';

// Copy Success Modal - Beautiful toast-like modal for URL copy feedback
export function CopySuccessModal({ isOpen, onClose, url, autoClose = true, autoCloseDelay = 2500 }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      if (autoClose) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }, autoCloseDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div 
        className={`transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <Card className="bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700 max-w-md w-full shadow-2xl">
          <CardContent className="pt-6 pb-6">
            {/* Success Animation */}
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Animated Check Icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
              </div>

              {/* Title */}
              <div>
                <h3 className="text-xl font-bold text-white mb-1">URL Copiada!</h3>
                <p className="text-zinc-400 text-sm">O link foi copiado para a área de transferência</p>
              </div>

              {/* URL Preview */}
              {url && (
                <div className="w-full bg-zinc-950 rounded-lg p-3 border border-zinc-700">
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <p className="text-amber-400 text-sm font-mono truncate">{url}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 w-full pt-2">
                <Button
                  onClick={() => window.open(url, '_blank')}
                  variant="outline"
                  className="flex-1 border-zinc-700 hover:bg-zinc-800"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir
                </Button>
                <Button
                  onClick={() => {
                    setIsVisible(false);
                    setTimeout(onClose, 300);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function SuccessModal({ isOpen, onClose, title, message, details, autoClose = false, autoCloseDelay = 2500 }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      if (autoClose && !details) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }, autoCloseDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose, details]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div 
        className={`transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <Card className="bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700 max-w-md w-full shadow-2xl">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Animated Check Icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
              </div>

              {/* Title and Message */}
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
                {message && <p className="text-zinc-400 text-sm">{message}</p>}
              </div>

              {/* Details Section */}
              {details && (
                <div className="w-full space-y-3">
                  {details.map((detail, index) => (
                    <div key={index} className="bg-zinc-950 p-3 rounded-lg border border-zinc-700">
                      <p className="text-zinc-400 text-sm mb-1">{detail.label}</p>
                      <p className="text-white font-medium">{detail.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Close Button */}
              <Button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {details ? 'Continuar' : 'OK'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function ErrorModal({ isOpen, onClose, title, message }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div 
        className={`transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <Card className="bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700 max-w-md w-full shadow-2xl">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Error Icon */}
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                  <AlertCircle className="h-8 w-8 text-white" />
                </div>
              </div>

              {/* Title and Message */}
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
                {message && <p className="text-zinc-400 text-sm">{message}</p>}
              </div>

              {/* Close Button */}
              <Button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Entendi
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Generic Info Modal - Following CopySuccessModal design pattern  
export function InfoModal({ isOpen, onClose, title, message, autoClose = false, autoCloseDelay = 3000 }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      if (autoClose) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }, autoCloseDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div 
        className={`transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <Card className="bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700 max-w-md w-full shadow-2xl">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Info Icon */}
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
              </div>

              {/* Title and Message */}
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
                {message && <p className="text-zinc-400 text-sm whitespace-pre-line">{message}</p>}
              </div>

              {/* Close Button */}
              <Button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                OK
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="bg-zinc-800 border-zinc-700 max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-white text-xl">{title}</CardTitle>
          {message && (
            <CardDescription className="text-zinc-300 text-base">
              {message}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-zinc-700"
            >
              {cancelText}
            </Button>
            <Button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
            >
              {confirmText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Modal de Upgrade de Plano (quando limite é atingido)
export function UpgradeModal({ isOpen, onClose, onUpgrade, title, message, currentPlan, limit, resourceType }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="bg-zinc-800 border-zinc-700 max-w-md w-full">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto h-16 w-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>
          <CardTitle className="text-white text-xl">{title || 'Limite Atingido'}</CardTitle>
          <CardDescription className="text-zinc-300 text-base mt-2">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-zinc-900 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-zinc-400 text-sm">Plano Atual</span>
              <span className="text-white font-semibold">{currentPlan}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm">Limite de {resourceType}</span>
              <span className="text-amber-500 font-semibold">{limit}</span>
            </div>
          </div>

          <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-4">
            <p className="text-green-400 text-sm font-medium mb-1">💡 Dica</p>
            <p className="text-zinc-300 text-sm">
              Faça upgrade do seu plano para desbloquear mais {resourceType} e funcionalidades avançadas.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-zinc-700 text-zinc-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                onUpgrade();
                onClose();
              }}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
            >
              Ver Planos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function CancelConfirmModal({ isOpen, onClose, onConfirm, marcacao, loading }) {
  if (!isOpen || !marcacao) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="bg-zinc-800 border-zinc-700 max-w-md w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-white text-xl">Cancelar Marcação</CardTitle>
              <CardDescription className="text-zinc-400">
                Esta ação não pode ser desfeita
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-zinc-900 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3 text-zinc-300">
              <Calendar className="h-5 w-5 text-amber-500" />
              <span>{new Date(marcacao.data).toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long' })}</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-300">
              <Clock className="h-5 w-5 text-amber-500" />
              <span className="font-semibold text-white">{marcacao.hora}</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-300">
              <Scissors className="h-5 w-5 text-amber-500" />
              <span>{marcacao.servico?.nome}</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-300">
              <User className="h-5 w-5 text-amber-500" />
              <span>{marcacao.barbeiro?.nome}</span>
            </div>
            <div className="flex items-center gap-3 text-amber-500 font-semibold">
              <Euro className="h-5 w-5" />
              <span>{marcacao.servico?.preco?.toFixed(2)}€</span>
            </div>
          </div>

          <p className="text-zinc-400 text-sm text-center">
            Tem a certeza que deseja cancelar esta marcação?
          </p>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-zinc-700"
              disabled={loading}
            >
              Voltar
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? 'A cancelar...' : 'Sim, Cancelar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function MarcacaoDetailModal({ isOpen, onClose, marcacao, onUpdateStatus, loading }) {
  if (!isOpen || !marcacao) return null;

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

  // Verificar se o email é um email gerado automaticamente (cliente manual sem email)
  const isManualEmail = marcacao.cliente?.email?.includes('@manual.local');

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="bg-zinc-800 border-zinc-700 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-white text-xl">Detalhes da Marcação</CardTitle>
              <CardDescription className="text-zinc-400">
                {new Date(marcacao.data).toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </CardDescription>
            </div>
            <button onClick={onClose} className="text-zinc-400 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Badge */}
          <div className="flex justify-center">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(marcacao.status)}`}>
              {getStatusLabel(marcacao.status)}
            </span>
          </div>

          {/* Hora e Serviço */}
          <div className="bg-zinc-900 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-zinc-500 text-xs uppercase mb-1">Horário</p>
                <p className="text-white text-2xl font-bold">{marcacao.hora}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs uppercase mb-1">Serviço</p>
                <p className="text-white font-semibold">{marcacao.servico?.nome}</p>
                <p className="text-zinc-400 text-sm">{marcacao.servico?.duracao} min</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-800">
              <p className="text-zinc-500 text-xs uppercase mb-1">Valor</p>
              <p className="text-amber-500 text-2xl font-bold">{marcacao.servico?.preco?.toFixed(2)}€</p>
            </div>
          </div>

          {/* Informações Completas do Cliente */}
          <div className="bg-zinc-900 rounded-lg p-4">
            <p className="text-zinc-500 text-xs uppercase mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações do Cliente
              {marcacao.cliente?.criado_manualmente && (
                <span className="bg-amber-900/30 text-amber-400 px-2 py-0.5 rounded text-xs">Manual</span>
              )}
            </p>
            
            {/* Avatar e Nome */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {marcacao.cliente?.nome?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div>
                <p className="text-white font-semibold text-lg">{marcacao.cliente?.nome || 'Nome não disponível'}</p>
                <p className="text-zinc-400 text-sm">
                  Cliente {marcacao.cliente?.criado_em ? `desde ${new Date(marcacao.cliente.criado_em).toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' })}` : ''}
                </p>
              </div>
            </div>
            
            {/* Dados de Contacto */}
            <div className="space-y-3 border-t border-zinc-800 pt-3">
              {/* Email */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
                  <Mail className="h-4 w-4 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-zinc-500 text-xs">Email</p>
                  {isManualEmail ? (
                    <p className="text-zinc-500 italic text-sm">Não fornecido</p>
                  ) : (
                    <p className="text-white">{marcacao.cliente?.email || 'Não disponível'}</p>
                  )}
                </div>
              </div>
              
              {/* Telemóvel */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
                  <Phone className="h-4 w-4 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-zinc-500 text-xs">Telemóvel</p>
                  {marcacao.cliente?.telemovel ? (
                    <a href={`tel:${marcacao.cliente.telemovel}`} className="text-white hover:text-amber-500 transition-colors">
                      {marcacao.cliente.telemovel}
                    </a>
                  ) : (
                    <p className="text-zinc-500 italic text-sm">Não fornecido</p>
                  )}
                </div>
              </div>

              {/* Observações do Cliente (se houver) */}
              {marcacao.cliente?.observacoes && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-zinc-500 text-xs">Observações</p>
                    <p className="text-white text-sm">{marcacao.cliente.observacoes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Barbeiro */}
          <div className="bg-zinc-900 rounded-lg p-4">
            <p className="text-zinc-500 text-xs uppercase mb-2 flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              Barbeiro Responsável
            </p>
            <div className="flex items-center gap-3">
              {marcacao.barbeiro?.foto ? (
                <img src={marcacao.barbeiro.foto} alt={marcacao.barbeiro.nome} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center text-white font-bold">
                  {marcacao.barbeiro?.nome?.charAt(0).toUpperCase() || 'B'}
                </div>
              )}
              <span className="text-white font-medium">{marcacao.barbeiro?.nome}</span>
            </div>
          </div>

          {/* Local da Marcação */}
          {marcacao.local && (
            <div className="bg-zinc-900 rounded-lg p-4">
              <p className="text-zinc-500 text-xs uppercase mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Local da Marcação
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-900/30 rounded-full flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <span className="text-white font-medium">{marcacao.local.nome}</span>
                  {marcacao.local.morada && (
                    <p className="text-zinc-400 text-sm">{marcacao.local.morada}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Informações da Marcação */}
          {(marcacao.criado_manualmente || marcacao.observacoes) && (
            <div className="bg-zinc-900 rounded-lg p-4">
              <p className="text-zinc-500 text-xs uppercase mb-2">Informações Adicionais</p>
              {marcacao.criado_manualmente && (
                <p className="text-amber-400 text-sm mb-1">📝 Marcação criada manualmente</p>
              )}
              {marcacao.observacoes && (
                <p className="text-zinc-300 text-sm">{marcacao.observacoes}</p>
              )}
            </div>
          )}

          {/* Ações */}
          {marcacao.status === 'pendente' && (
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => onUpdateStatus(marcacao._id, 'rejeitada')}
                variant="outline"
                className="flex-1 border-red-600 text-red-500 hover:bg-red-600 hover:text-white"
                disabled={loading}
              >
                ✗ Rejeitar
              </Button>
              <Button
                onClick={() => onUpdateStatus(marcacao._id, 'aceita')}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                ✓ Aceitar
              </Button>
            </div>
          )}
          
          {marcacao.status === 'aceita' && (
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => onUpdateStatus(marcacao._id, 'cancelada')}
                variant="outline"
                className="flex-1 border-zinc-600 text-zinc-400 hover:bg-zinc-700"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => onUpdateStatus(marcacao._id, 'concluida')}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                ✓✓ Marcar Concluída
              </Button>
            </div>
          )}

          {(marcacao.status === 'concluida' || marcacao.status === 'rejeitada' || marcacao.status === 'cancelada') && (
            <Button
              onClick={onClose}
              className="w-full bg-zinc-700 hover:bg-zinc-600"
            >
              Fechar
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Modal de Detalhes do Cliente
export function ClienteDetailModal({ isOpen, onClose, cliente }) {
  if (!isOpen || !cliente) return null;

  // Verificar se o email é um email gerado automaticamente (cliente manual sem email)
  const isManualEmail = cliente.email?.includes('@manual.local');

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="bg-zinc-800 border-zinc-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {cliente.nome?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div>
                <CardTitle className="text-white text-2xl flex items-center gap-2">
                  {cliente.nome}
                  {cliente.criado_manualmente && (
                    <span className="bg-amber-900/30 text-amber-400 px-2 py-0.5 rounded text-xs font-normal">Manual</span>
                  )}
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Cliente desde {cliente.criado_em ? new Date(cliente.criado_em).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }) : 'N/A'}
                </CardDescription>
              </div>
            </div>
            <button onClick={onClose} className="text-zinc-400 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações de Contacto */}
          <div className="bg-zinc-900 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-amber-500" />
              Informações de Contacto
            </h3>
            <div className="space-y-4">
              {/* Email */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-zinc-500 text-xs uppercase">Email</p>
                  {isManualEmail ? (
                    <p className="text-zinc-500 italic">Não fornecido</p>
                  ) : (
                    <a href={`mailto:${cliente.email}`} className="text-white hover:text-amber-500 transition-colors">
                      {cliente.email || 'Não disponível'}
                    </a>
                  )}
                </div>
              </div>

              {/* Telemóvel */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                  <Phone className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-zinc-500 text-xs uppercase">Telemóvel</p>
                  {cliente.telemovel ? (
                    <a href={`tel:${cliente.telemovel}`} className="text-white hover:text-amber-500 transition-colors">
                      {cliente.telemovel}
                    </a>
                  ) : (
                    <p className="text-zinc-500 italic">Não fornecido</p>
                  )}
                </div>
              </div>

              {/* Morada (se disponível) */}
              {cliente.morada && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs uppercase">Morada</p>
                    <p className="text-white">{cliente.morada}</p>
                  </div>
                </div>
              )}

              {/* Data de Nascimento (se disponível) */}
              {cliente.data_nascimento && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs uppercase">Data de Nascimento</p>
                    <p className="text-white">
                      {new Date(cliente.data_nascimento).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-zinc-900 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-amber-500">{cliente.total_marcacoes || 0}</p>
              <p className="text-zinc-400 text-sm">Total Marcações</p>
            </div>
            <div className="bg-zinc-900 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-500">{cliente.marcacoes_concluidas || 0}</p>
              <p className="text-zinc-400 text-sm">Concluídas</p>
            </div>
            <div className="bg-zinc-900 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-white">{cliente.total_gasto?.toFixed(2) || '0.00'}€</p>
              <p className="text-zinc-400 text-sm">Total Gasto</p>
            </div>
          </div>

          {/* Última Visita */}
          <div className="bg-zinc-900 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Última Visita
            </h3>
            <p className="text-zinc-300">
              {cliente.ultima_visita 
                ? new Date(cliente.ultima_visita).toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
                : 'Ainda não visitou'
              }
            </p>
          </div>

          {/* Observações (se disponível) */}
          {cliente.observacoes && (
            <div className="bg-zinc-900 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Observações
              </h3>
              <p className="text-zinc-300">{cliente.observacoes}</p>
            </div>
          )}

          {/* Preferências (se disponível) */}
          {cliente.preferencias && (
            <div className="bg-zinc-900 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <Scissors className="h-5 w-5 text-amber-500" />
                Preferências
              </h3>
              <p className="text-zinc-300">{cliente.preferencias}</p>
            </div>
          )}

          {/* Informações Adicionais */}
          <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-700">
            <h3 className="text-zinc-400 text-xs uppercase mb-2">Informações do Sistema</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-zinc-500">ID:</span>
                <span className="text-zinc-300 ml-2">{cliente._id?.slice(-8)}</span>
              </div>
              <div>
                <span className="text-zinc-500">Tipo:</span>
                <span className="text-zinc-300 ml-2 capitalize">{cliente.tipo}</span>
              </div>
              {cliente.criado_em && (
                <div className="col-span-2">
                  <span className="text-zinc-500">Registado em:</span>
                  <span className="text-zinc-300 ml-2">
                    {new Date(cliente.criado_em).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Button onClick={onClose} className="w-full bg-amber-600 hover:bg-amber-700">
            Fechar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Modal de Alerta (substitui window.alert)
export function AlertModal({ isOpen, onClose, title, message, type = 'info' }) {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch(type) {
      case 'success': return { bg: 'bg-green-500/20', icon: <CheckCircle2 className="h-6 w-6 text-green-500" />, button: 'bg-green-600 hover:bg-green-700' };
      case 'error': return { bg: 'bg-red-500/20', icon: <AlertCircle className="h-6 w-6 text-red-500" />, button: 'bg-red-600 hover:bg-red-700' };
      case 'warning': return { bg: 'bg-amber-500/20', icon: <AlertTriangle className="h-6 w-6 text-amber-500" />, button: 'bg-amber-600 hover:bg-amber-700' };
      default: return { bg: 'bg-blue-500/20', icon: <AlertCircle className="h-6 w-6 text-blue-500" />, button: 'bg-blue-600 hover:bg-blue-700' };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="bg-zinc-800 border-zinc-700 max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`h-12 w-12 rounded-full ${styles.bg} flex items-center justify-center`}>
              {styles.icon}
            </div>
            <CardTitle className="text-white text-xl">{title}</CardTitle>
          </div>
          {message && (
            <CardDescription className="text-zinc-300 text-base">
              {message}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <Button onClick={onClose} className={`w-full ${styles.button}`}>
            OK
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

