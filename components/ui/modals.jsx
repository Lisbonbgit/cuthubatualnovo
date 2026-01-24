'use client';

import { CheckCircle2, AlertCircle, X } from 'lucide-react';
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
