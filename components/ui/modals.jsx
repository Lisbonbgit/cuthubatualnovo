'use client';

import { CheckCircle2, AlertCircle, X, AlertTriangle, Calendar, User, Scissors, Clock, Euro, Phone, Mail } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

export function SuccessModal({ isOpen, onClose, title, message, details }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="bg-zinc-800 border-zinc-700 max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <CardTitle className="text-white text-xl">{title}</CardTitle>
          </div>
          {message && (
            <CardDescription className="text-zinc-300 text-base">
              {message}
            </CardDescription>
          )}
        </CardHeader>
        {details && (
          <CardContent className="space-y-3">
            {details.map((detail, index) => (
              <div key={index} className="bg-zinc-900 p-3 rounded-lg">
                <p className="text-zinc-400 text-sm mb-1">{detail.label}</p>
                <p className="text-white font-medium">{detail.value}</p>
              </div>
            ))}
            <Button
              onClick={onClose}
              className="w-full bg-green-600 hover:bg-green-700 mt-4"
            >
              Continuar
            </Button>
          </CardContent>
        )}
        {!details && (
          <CardContent>
            <Button
              onClick={onClose}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              OK
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export function ErrorModal({ isOpen, onClose, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="bg-zinc-800 border-zinc-700 max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-500" />
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
          <Button
            onClick={onClose}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            Entendi
          </Button>
        </CardContent>
      </Card>
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

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="bg-zinc-800 border-zinc-700 max-w-lg w-full">
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

          {/* Informações do Cliente */}
          <div className="bg-zinc-900 rounded-lg p-4">
            <p className="text-zinc-500 text-xs uppercase mb-3">Informações do Cliente</p>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {marcacao.cliente?.nome?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div>
                <p className="text-white font-semibold text-lg">{marcacao.cliente?.nome}</p>
                <p className="text-zinc-400 text-sm">Cliente</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-zinc-300">
                <Mail className="h-4 w-4 text-zinc-500" />
                <span>{marcacao.cliente?.email}</span>
              </div>
              {marcacao.cliente?.telemovel && (
                <div className="flex items-center gap-3 text-zinc-300">
                  <Phone className="h-4 w-4 text-zinc-500" />
                  <span>{marcacao.cliente?.telemovel}</span>
                </div>
              )}
            </div>
          </div>

          {/* Barbeiro */}
          <div className="bg-zinc-900 rounded-lg p-4">
            <p className="text-zinc-500 text-xs uppercase mb-2">Barbeiro Responsável</p>
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
