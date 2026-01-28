
import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (key: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim() || !inputKey.startsWith('AIza')) {
      setError('Por favor, insira uma chave API válida do Google (começa com AIza).');
      return;
    }
    onLogin(inputKey.trim());
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-6 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl rounded-lg p-10 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-600 to-amber-400"></div>
        
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🏛️</div>
          <h1 className="text-3xl font-serif text-amber-600 dark:text-amber-500 font-bold tracking-wider mb-2">LuxStudio AI</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-serif italic">by Tata Gonçalves</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="apiKey" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Chave de Acesso (API Key)
            </label>
            <input
              type="password"
              id="apiKey"
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                setError('');
              }}
              placeholder="AIzaSy..."
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-4 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
            />
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 p-4 rounded-lg text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
            <p className="font-bold mb-1">ℹ️ Informação sobre Planos:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Plano Gratuito:</strong> Funciona para imagens 1K, Edição e Análise.</li>
              <li><strong>Plano Pago:</strong> Necessário para gerar imagens <strong>4K</strong> e <strong>Vídeos (Veo)</strong>.</li>
            </ul>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-serif font-bold text-lg rounded-lg hover:from-amber-500 hover:to-amber-600 shadow-lg hover:shadow-amber-600/30 transition-all transform hover:-translate-y-0.5"
          >
            ENTRAR NO ESTÚDIO
          </button>
        </form>

        <div className="mt-8 text-center">
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-amber-600 border-b border-dashed border-gray-300 dark:border-gray-700 hover:border-amber-600 pb-0.5 transition-colors"
          >
            Não tem uma chave? Gere a sua no Google AI Studio
          </a>
        </div>
      </div>
    </div>
  );
};
