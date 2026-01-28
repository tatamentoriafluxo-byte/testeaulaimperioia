
import React, { useState, useCallback, useEffect } from 'react';
import { StudioMode, AspectRatio, ImageSize, GenerationResult } from './types';
import { Sidebar } from './components/Sidebar';
import { StudioCanvas } from './components/StudioCanvas';
import { ControlPanel } from './components/ControlPanel';
import { LoginScreen } from './components/LoginScreen';
import { analyzeImage, editImage, generateImage, generateVideo, transcribeAudio } from './services/geminiService';
import { saveSession, loadSession } from './services/storageService';

const App: React.FC = () => {
  // Auth State
  const [apiKey, setApiKey] = useState<string | null>(localStorage.getItem('lux_api_key'));
  
  // UI Preferences State (Persisted in localStorage immediately)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => 
    (localStorage.getItem('lux_theme') as 'light' | 'dark') || 'light'
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => 
    localStorage.getItem('lux_sidebar_collapsed') === 'true'
  );

  // App State
  const [mode, setMode] = useState<StudioMode>(StudioMode.ANALYZE);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.RATIO_16_9);
  const [imageSize, setImageSize] = useState<ImageSize>(ImageSize.SIZE_1K);
  const [error, setError] = useState<string | null>(null);
  const [isRestored, setIsRestored] = useState(false);

  // Apply Theme Effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('lux_theme', theme);
  }, [theme]);

  // Persist Sidebar State
  useEffect(() => {
    localStorage.setItem('lux_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Restore session on startup (Content)
  useEffect(() => {
    const restore = async () => {
      const savedState = await loadSession();
      if (savedState) {
        if (savedState.mode) setMode(savedState.mode);
        if (savedState.uploadedImage) setUploadedImage(savedState.uploadedImage);
        if (savedState.result) setResult(savedState.result);
        if (savedState.prompt) setPrompt(savedState.prompt);
        if (savedState.aspectRatio) setAspectRatio(savedState.aspectRatio);
        if (savedState.imageSize) setImageSize(savedState.imageSize);
      }
      setIsRestored(true);
    };
    restore();
  }, []);

  // Auto-save session on changes (Debounced)
  useEffect(() => {
    if (!isRestored) return; 

    const timeoutId = setTimeout(() => {
      saveSession({
        mode,
        uploadedImage,
        result,
        prompt,
        aspectRatio,
        imageSize
      });
    }, 1000); 

    return () => clearTimeout(timeoutId);
  }, [mode, uploadedImage, result, prompt, aspectRatio, imageSize, isRestored]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

  const handleLogin = (key: string) => {
    localStorage.setItem('lux_api_key', key);
    setApiKey(key);
  };

  const handleLogout = () => {
    localStorage.removeItem('lux_api_key');
    setApiKey(null);
    setResult(null);
    setUploadedImage(null);
    setPrompt("");
  };

  const handleNewSession = () => {
    setUploadedImage(null);
    setResult(null);
    setPrompt("");
    setError(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setResult(null); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioTranscription = async (audioBlob: Blob) => {
    if (!apiKey) return;
    try {
      setLoading(true);
      const text = await transcribeAudio(apiKey, audioBlob);
      setPrompt((prev) => (prev ? `${prev} ${text}` : text));
    } catch (err) {
      console.error(err);
      setError("Falha na transcrição de áudio.");
    } finally {
      setLoading(false);
    }
  };

  const executeAction = useCallback(async () => {
    if (!apiKey) {
      setError("Chave de API não encontrada. Por favor, faça login novamente.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (mode === StudioMode.ANALYZE) {
        if (!uploadedImage) throw new Error("Por favor, faça upload de uma imagem primeiro.");
        
        const analysis = await analyzeImage(apiKey, uploadedImage, prompt);
        
        setResult({ type: 'text', content: analysis });
        setPrompt(analysis); 
      } 
      else if (mode === StudioMode.EDIT) {
        if (!uploadedImage) throw new Error("Por favor, faça upload de uma imagem primeiro.");
        if (!prompt) throw new Error("Descreva as edições desejadas.");
        const editedImages = await editImage(apiKey, uploadedImage, prompt);
        setResult({ type: 'image', content: editedImages }); 
      } 
      else if (mode === StudioMode.GENERATE) {
        if (!prompt) throw new Error("Descreva a imagem que deseja criar.");
        const generatedImages = await generateImage(apiKey, prompt, aspectRatio, imageSize, uploadedImage);
        setResult({ type: 'image', content: generatedImages });
      } 
      else if (mode === StudioMode.VIDEO) {
        if (!prompt) throw new Error("Descreva o vídeo que deseja criar.");
        const videoUri = await generateVideo(apiKey, prompt, aspectRatio);
        setResult({ type: 'video', content: videoUri });
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro inesperado.");
      
      // Auto logout on authentication error
      if (err.message?.includes('403') || err.message?.includes('API Key')) {
         setError("Chave API inválida ou expirada. Verifique suas permissões.");
      }
    } finally {
      setLoading(false);
    }
  }, [mode, uploadedImage, prompt, aspectRatio, imageSize, apiKey]);

  // If not logged in, show Login Screen
  if (!apiKey) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col lg:flex-row lg:h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 lg:overflow-hidden min-h-screen transition-colors duration-300">
      
      <Sidebar 
        currentMode={mode} 
        setMode={setMode} 
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main className="flex-1 flex flex-col lg:flex-row relative lg:overflow-hidden overflow-y-auto lg:overflow-y-hidden">
        <div className="flex-1 bg-gray-100 dark:bg-gray-950 p-6 flex flex-col items-center lg:justify-center relative lg:overflow-y-auto overflow-visible min-h-[500px] transition-colors duration-300">
          <StudioCanvas 
            uploadedImage={uploadedImage} 
            result={result} 
            loading={loading}
            mode={mode}
            error={error}
          />
        </div>

        <div className="w-full lg:w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 flex flex-col shadow-xl z-10 lg:h-full lg:overflow-y-auto overflow-visible transition-all duration-300">
           <div className="mb-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-serif text-amber-600 dark:text-amber-500 mb-1">
                  {mode === StudioMode.ANALYZE && "Consultoria de Imagem"}
                  {mode === StudioMode.GENERATE && "Sessão Fotográfica"}
                  {mode === StudioMode.EDIT && "Retoque Profissional"}
                  {mode === StudioMode.VIDEO && "Produção Cinematográfica"}
                </h2>
                <div className="flex flex-col">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">LuxStudio AI</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">by Tata Gonçalves</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-1">
                  {/* Header/Control Panel duplicate controls */}
                  <button 
                    onClick={toggleTheme}
                    className="text-gray-400 hover:text-amber-500 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title={theme === 'light' ? "Modo Escuro" : "Modo Claro"}
                  >
                    {theme === 'light' ? '🌙' : '🌞'}
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="text-[10px] text-red-400 hover:text-red-600 border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded transition-colors"
                  >
                    Sair
                  </button>
                </div>
                {isRestored && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-600">
                    Auto-Save On
                  </span>
                )}
              </div>
           </div>

           <ControlPanel 
              mode={mode}
              prompt={prompt}
              setPrompt={setPrompt}
              uploadedImage={uploadedImage}
              handleImageUpload={handleImageUpload}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              imageSize={imageSize}
              setImageSize={setImageSize}
              onExecute={executeAction}
              loading={loading}
              onAudioRecorded={handleAudioTranscription}
              onNewSession={handleNewSession}
           />
        </div>
      </main>
    </div>
  );
};

export default App;
