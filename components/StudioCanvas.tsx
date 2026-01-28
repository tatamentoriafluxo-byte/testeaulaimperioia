
import React from 'react';
import { StudioMode, GenerationResult } from '../types';
import JSZip from 'jszip';

interface StudioCanvasProps {
  uploadedImage: string | null;
  result: GenerationResult | null;
  loading: boolean;
  mode: StudioMode;
  error: string | null;
}

export const StudioCanvas: React.FC<StudioCanvasProps> = ({ uploadedImage, result, loading, mode, error }) => {
  
  const handleDownloadAll = async (images: string[]) => {
    const zip = new JSZip();
    const folder = zip.folder("luxstudio_photoshoot");
    
    images.forEach((imgData, index) => {
      // Remove header data:image/png;base64,
      const data = imgData.replace(/^data:image\/\w+;base64,/, "");
      folder?.file(`luxstudio_angle_${index + 1}.png`, data, { base64: true });
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = window.URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "luxstudio_sessao_completa.zip";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-amber-600 animate-pulse min-h-[300px]">
        <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-serif text-xl">Sessão de Fotos em Andamento...</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">O fotógrafo está ajustando a iluminação e os ângulos.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 rounded-lg max-w-md shadow-sm">
        <h3 className="text-red-600 dark:text-red-400 font-bold mb-2">Erro de Produção</h3>
        <p className="text-red-500 dark:text-red-300 text-sm">{error}</p>
      </div>
    );
  }

  // Display based on result or upload state
  const hasContent = result || (uploadedImage && (mode === StudioMode.ANALYZE || mode === StudioMode.EDIT || mode === StudioMode.GENERATE));

  if (!hasContent) {
    return (
      <div className="text-center text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-12 max-w-lg bg-white/50 dark:bg-gray-800/50">
        <div className="text-6xl mb-4 opacity-30 text-gray-300 dark:text-gray-600">📸</div>
        <h3 className="text-xl font-serif text-gray-600 dark:text-gray-300 mb-2">Seu Estúdio Profissional</h3>
        <p className="text-sm mb-4 text-gray-500 dark:text-gray-400">
          {mode === StudioMode.GENERATE || mode === StudioMode.VIDEO 
            ? "Faça upload da sua foto para iniciarmos a sessão." 
            : "Faça upload de uma imagem à direita para começar."}
        </p>
        {mode === StudioMode.GENERATE && (
          <div className="text-xs text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-100 dark:border-amber-900/30">
             ✨ Geramos 3 ângulos exclusivos baseados no seu rosto.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full lg:h-full flex flex-col items-center lg:justify-center p-4">
      <div className="relative w-full lg:h-full max-w-7xl lg:overflow-y-auto overflow-visible custom-scrollbar">
        
        {/* Case: Analysis Result (Text + Original Image) */}
        {mode === StudioMode.ANALYZE && result?.type === 'text' && (
          <div className="flex flex-col lg:flex-row h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm shadow-xl">
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
               {uploadedImage && <img src={uploadedImage} alt="Original" className="max-h-[60vh] object-contain shadow-lg" />}
            </div>
            <div className="flex-1 bg-white dark:bg-gray-800 p-8 overflow-y-auto border-l border-gray-200 dark:border-gray-700">
               <h3 className="text-amber-600 font-serif text-2xl mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Relatório do Consultor</h3>
               <div className="prose prose-amber dark:prose-invert text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                 {result.content}
               </div>
            </div>
          </div>
        )}

        {/* Case: Image Edit/Generate Result (Handles Arrays for Photoshoot) */}
        {result?.type === 'image' && (
          <div className="flex flex-col lg:h-full pb-10">
            <div className="flex justify-between items-center mb-6 px-2 flex-wrap gap-4 sticky top-0 z-10 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 rounded-b-lg border-b border-white/50 dark:border-gray-800/50">
              <div>
                <h2 className="text-xl font-serif text-amber-600">Resultado da Sessão</h2>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">3 Ângulos Exclusivos</span>
              </div>
              
              {Array.isArray(result.content) && result.content.length > 1 && (
                <button 
                  onClick={() => handleDownloadAll(result.content as string[])}
                  className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-amber-600/20"
                >
                  <span>📦</span> Baixar Tudo (ZIP)
                </button>
              )}
            </div>
            
            <div className={`grid gap-8 p-2 ${
                Array.isArray(result.content) && result.content.length > 1 
                ? 'grid-cols-1 lg:grid-cols-3' 
                : 'grid-cols-1 flex-1 items-center justify-center'
              }`}>
              
              {(Array.isArray(result.content) ? result.content : [result.content]).map((imgSrc, idx) => (
                <div key={idx} className="relative group bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xl flex flex-col">
                  <div className="bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden min-h-[400px]">
                     <img src={imgSrc} alt={`Angle ${idx + 1}`} className="w-full h-auto object-cover" />
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <span className="text-xs text-amber-600 font-bold uppercase tracking-wider">
                      {idx === 0 ? "1. Close-up" : idx === 1 ? "2. Fashion" : idx === 2 ? "3. Cenário" : "Resultado"}
                    </span>
                    <a 
                      href={imgSrc} 
                      download={`lux_studio_angle_${idx + 1}.png`}
                      className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-200 px-3 py-1.5 rounded text-xs font-bold transition-all border border-gray-200 dark:border-gray-600"
                    >
                      Baixar Foto
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Case: Video Result */}
        {result?.type === 'video' && (
          <div className="flex items-center justify-center h-full">
            <div className="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-2xl">
               <video controls autoPlay loop className="max-h-[85vh] max-w-full">
                 <source src={result.content} type="video/mp4" />
                 Seu navegador não suporta a tag de vídeo.
               </video>
               <div className="absolute top-4 right-4">
                 <a 
                    href={result.content} 
                    download="lux_cinema.mp4"
                    className="bg-white/80 hover:bg-amber-600 hover:text-white text-gray-800 p-2 rounded-full backdrop-blur-sm transition-colors shadow-sm"
                    title="Baixar Vídeo"
                  >
                   📥
                 </a>
               </div>
            </div>
          </div>
        )}

        {/* Case: Initial Upload display */}
        {!result && uploadedImage && (
           <div className="w-full h-full flex items-center justify-center min-h-[300px]">
             <div className="relative">
               <img src={uploadedImage} alt="Reference" className="max-h-[70vh] rounded-lg border border-gray-200 dark:border-gray-700 shadow-2xl opacity-80 hover:opacity-100 transition-all duration-700" />
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <p className="bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-200 px-4 py-2 rounded backdrop-blur-md text-sm font-serif shadow-lg border border-gray-100 dark:border-gray-600">Imagem de Referência Carregada</p>
               </div>
             </div>
           </div>
        )}

      </div>
    </div>
  );
};
