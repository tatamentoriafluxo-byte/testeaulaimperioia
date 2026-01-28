
import React, { useState, useRef } from 'react';
import { StudioMode, AspectRatio, ImageSize } from '../types';

interface ControlPanelProps {
  mode: StudioMode;
  prompt: string;
  setPrompt: (s: string) => void;
  uploadedImage: string | null;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (r: AspectRatio) => void;
  imageSize: ImageSize;
  setImageSize: (s: ImageSize) => void;
  onExecute: () => void;
  loading: boolean;
  onAudioRecorded: (blob: Blob) => void;
  onNewSession: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  mode,
  prompt,
  setPrompt,
  uploadedImage,
  handleImageUpload,
  aspectRatio,
  setAspectRatio,
  imageSize,
  setImageSize,
  onExecute,
  loading,
  onAudioRecorded,
  onNewSession
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        onAudioRecorded(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Erro ao acessar microfone", err);
      alert("Permissão de microfone necessária para ditado.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Allow upload in GENERATE mode as well for image-guided generation
  const showUpload = mode === StudioMode.ANALYZE || mode === StudioMode.EDIT || mode === StudioMode.GENERATE;
  const showPrompt = true; 
  const showAspectRatio = mode === StudioMode.GENERATE || mode === StudioMode.VIDEO;
  const showSize = mode === StudioMode.GENERATE;

  return (
    <div className="flex flex-col gap-6">
      
      {/* Reset Session Button */}
      <div className="flex justify-end -mb-4">
        <button 
          onClick={onNewSession}
          className="text-xs text-amber-600 dark:text-amber-500 hover:text-amber-800 dark:hover:text-amber-400 flex items-center gap-1 transition-colors opacity-80 hover:opacity-100"
          title="Limpar todos os campos e começar de novo"
        >
          <span>↺</span> Nova Sessão (Limpar)
        </button>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {mode === StudioMode.GENERATE ? "Imagem de Referência (Opcional)" : "Imagem de Base"}
          </label>
          <div className="relative group">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className={`border bg-gray-50 dark:bg-gray-900 rounded-lg p-4 flex items-center justify-center transition-all shadow-sm ${
              !uploadedImage 
                ? 'h-32 border-dashed border-gray-300 dark:border-gray-600' 
                : 'h-16 border-solid border-amber-500/50 bg-amber-50 dark:bg-amber-900/20'
            }`}>
              {uploadedImage ? (
                <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500">
                  <span className="text-lg">✓</span>
                  <span className="text-sm font-medium">Imagem carregada</span>
                </div>
              ) : (
                <div className="text-center text-gray-400 dark:text-gray-500 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                  <span className="text-2xl block mb-1">+</span>
                  <span className="text-xs">
                    {mode === StudioMode.GENERATE ? "Clique para adicionar rosto/referência" : "Clique para Upload"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings: Aspect Ratio */}
      {showAspectRatio && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Formato</label>
          <div className="grid grid-cols-4 gap-2">
            {Object.values(AspectRatio).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`text-xs py-2 rounded border shadow-sm transition-all ${
                  aspectRatio === ratio 
                    ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-600 text-amber-800 dark:text-amber-200' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Settings: Size */}
      {showSize && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qualidade e Modelo</label>
          <div className="flex gap-2">
            {Object.values(ImageSize).map((size) => (
              <button
                key={size}
                onClick={() => setImageSize(size)}
                className={`flex-1 text-xs py-2 rounded border transition-colors shadow-sm ${
                  imageSize === size 
                    ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-600 text-amber-800 dark:text-amber-200' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="font-bold">{size}</div>
                <div className="text-[9px] opacity-70">
                  {size === '1K' ? 'Nano Banana (Grátis)' : 'Gemini 3 Pro'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Prompt Input */}
      {showPrompt && (
        <div className="space-y-2">
           <div className="flex justify-between items-center">
             <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
               {mode === StudioMode.ANALYZE ? "Foco da Análise (Opcional)" : "Direção Artística"}
             </label>
             <button
               onClick={isRecording ? stopRecording : startRecording}
               className={`text-xs flex items-center gap-1 px-2 py-1 rounded-full transition-colors border ${
                 isRecording 
                  ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 animate-pulse' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
               }`}
             >
               {isRecording ? '⏹ Parar' : '🎤 Ditar'}
             </button>
           </div>
           <textarea
             value={prompt}
             onChange={(e) => setPrompt(e.target.value)}
             placeholder={
                mode === StudioMode.ANALYZE ? "Ex: Foque na iluminação e nas joias..." :
                mode === StudioMode.EDIT ? "Ex: Remova o fundo, adicione um brilho dourado..." :
                "Ex: Um estúdio de luxo vitoriano, iluminação cinematográfica, vestido de seda vermelha..."
             }
             className="w-full h-32 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm text-gray-800 dark:text-gray-200 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none placeholder-gray-400 dark:placeholder-gray-600 shadow-sm"
           />
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={onExecute}
        // Only disable if mode requires upload AND no image is uploaded
        disabled={loading || ((mode === StudioMode.ANALYZE || mode === StudioMode.EDIT) && !uploadedImage)}
        className={`w-full py-4 mt-2 rounded-lg font-serif font-bold text-lg tracking-widest transition-all shadow-lg ${
          loading 
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : ((mode === StudioMode.ANALYZE || mode === StudioMode.EDIT) && !uploadedImage)
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-500 hover:to-amber-600 hover:shadow-amber-600/30'
        }`}
      >
        {loading ? 'PROCESSANDO...' : mode === StudioMode.ANALYZE ? 'ANALISAR ESTILO' : 'CRIAR ARTE'}
      </button>

      {/* Helper Text */}
      <p className="text-[10px] text-center text-gray-400 dark:text-gray-500">
        Utilizamos Nano Banana para 1K e Pro para Alta Definição (2K/4K).
      </p>

    </div>
  );
};
