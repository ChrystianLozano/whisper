import { useState, useRef, useEffect } from 'react';
import { Background } from './components/Background';
import { Header } from './components/Header';
import { AudioVisualizer } from './components/AudioVisualizer';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useTranscriber } from './hooks/useTranscriber';
import { resampleAudio } from './utils/audio';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Upload, FileAudio, Download, Square, Play, Trash2, Cpu, Zap, Box, Lock, Code2 } from 'lucide-react';

function App() {
  const {
    isRecording,
    recordingTime,
    stream,
    audioUrl,
    audioBlob,
    startRecording,
    stopRecording,
    clearAudio
  } = useAudioRecorder();

  const transcriber = useTranscriber();

  const [uploadedFile, setUploadedFile] = useState<{ file: File, url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Automatically initialize/load model in background once app opens
    transcriber.loadModel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    clearAudio();
    transcriber.clearTranscript();
    if (uploadedFile) URL.revokeObjectURL(uploadedFile.url);

    setUploadedFile({
      file,
      url: URL.createObjectURL(file)
    });
  };

  const clearAll = () => {
    clearAudio();
    transcriber.clearTranscript();
    if (uploadedFile) URL.revokeObjectURL(uploadedFile.url);
    setUploadedFile(null);
  };

  const activeAudioUrl = audioUrl || uploadedFile?.url;
  const isReady = !!activeAudioUrl;

  const handleStartTranscription = async () => {
    const fileTarget = audioBlob || uploadedFile?.file;
    if (!fileTarget) return;

    try {
      const audioData = await resampleAudio(fileTarget);
      transcriber.startTranscription(audioData);
    } catch (err) {
      console.error("Failed to resample audio", err);
      alert("Error al procesar el audio.");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const exportTxt = () => {
    if (!transcriber.text) return;
    const blob = new Blob([transcriber.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whisper-web-transcript-${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    if (!transcriber.text) return;
    const blob = new Blob([JSON.stringify({ text: transcriber.text, chunks: transcriber.chunks }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whisper-web-transcript-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (seconds: number) => {
    const d = new Date(seconds * 1000);
    const hrs = String(d.getUTCHours()).padStart(2, '0');
    const mins = String(d.getUTCMinutes()).padStart(2, '0');
    const secs = String(d.getUTCSeconds()).padStart(2, '0');
    const ms = String(d.getUTCMilliseconds()).padStart(3, '0');
    return `${hrs}:${mins}:${secs},${ms}`;
  };

  const exportSRT = () => {
    if (!transcriber.chunks || transcriber.chunks.length === 0) return;

    let srtContent = '';
    transcriber.chunks.forEach((chunk: any, index: number) => {
      const startTime = formatTimestamp(chunk.timestamp[0]);
      // If chunk.timestamp[1] is null (often happens on the last chunk), guess an end time (+2s)
      const endTime = formatTimestamp(chunk.timestamp[1] !== null ? chunk.timestamp[1] : chunk.timestamp[0] + 2);

      srtContent += `${index + 1}\n`;
      srtContent += `${startTime} --> ${endTime}\n`;
      srtContent += `${chunk.text.trim()}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whisper-web-transcript-${new Date().getTime()}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const progress = transcriber.progressItems.length > 0
    ? transcriber.progressItems.reduce((acc, curr) => acc + (curr.progress || 0), 0) / transcriber.progressItems.length
    : 0;

  return (
    <div className="min-h-screen text-foreground relative flex flex-col pt-24 pb-8 px-4 sm:px-6 lg:px-8">
      <Background />
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center max-w-4xl w-full mx-auto gap-8">

        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary-hover text-sm font-semibold mb-6 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            100% Procesamiento Local en el Navegador
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight px-4 bg-gradient-to-b from-white via-white/90 to-white/40 bg-clip-text text-transparent drop-shadow-sm pb-2">
            Reconocimiento de Voz
          </h2>
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto px-4 leading-relaxed font-light">
            Transcripción In-Browser increíblemente rápida usando <strong className="font-semibold text-white drop-shadow-md">Whisper</strong> y <strong className="font-semibold text-white drop-shadow-md">WebGPU</strong>. <br className="hidden md:block" />
            <span className="text-slate-200 mt-2 block text-lg font-medium">Graba tu voz desde el micrófono o sube un archivo de Audio / Video.</span>
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-emerald-400 text-sm font-medium">
            <Lock className="w-4 h-4" />
            Todo el procesamiento se hace 100% de forma local en tu PC. Ningún archivo se envía a servidores externos.
          </div>
        </motion.div>

        {/* Status Loading Banner */}
        <AnimatePresence>
          {transcriber.isModelLoading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full max-w-sm mx-auto overflow-hidden"
            >
              <div className="flex flex-col gap-2 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                <div className="flex items-center justify-between text-indigo-300 text-sm font-medium px-1">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 animate-spin" />
                    Cargando IA WebGPU...
                  </div>
                  <span className="tabular-nums">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-1.5 bg-indigo-950/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full glass-panel rounded-3xl p-6 sm:p-8 flex flex-col min-h-[400px] border border-white/10"
        >

          {/* Model Selection */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 w-full">
            <label htmlFor="model-select" className="text-sm font-medium text-slate-300">
              Precisión del Modelo:
            </label>
            <div className="relative">
              <select
                id="model-select"
                value={transcriber.selectedModel}
                onChange={(e) => transcriber.changeModel(e.target.value)}
                disabled={isRecording || transcriber.isBusy || transcriber.isModelLoading}
                className="appearance-none bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <option value="Xenova/whisper-tiny" className="bg-slate-900 text-white">Tiny (Más rápido, ~39MB)</option>
                <option value="Xenova/whisper-base" className="bg-slate-900 text-white">Base (Equilibrado, ~73MB)</option>
                <option value="Xenova/whisper-small" className="bg-slate-900 text-white">Small (Más preciso, ~241MB)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 md:gap-8 mb-16 w-full max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
              {!isRecording ? (
                <motion.button
                  key="start"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => { clearAll(); startRecording(); }}
                  disabled={isReady || transcriber.isBusy || transcriber.isModelLoading}
                  className="relative flex items-center gap-3 px-6 py-4 h-[60px] rounded-2xl font-semibold text-rose-50 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 hover:border-rose-500/50 hover:shadow-[0_0_30px_rgba(244,63,94,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-500/0 via-rose-500/10 to-rose-500/0 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity" />
                  <div className="bg-rose-500/20 p-2 rounded-full group-hover:bg-rose-500/40 transition-colors relative z-10 shadow-[0_0_15px_rgba(244,63,94,0.5)]">
                    <Mic className="w-5 h-5 text-rose-400" />
                  </div>
                  <span className="relative z-10 whitespace-nowrap">Empezar a Grabar</span>
                </motion.button>
              ) : (
                <motion.button
                  key="stop"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={stopRecording}
                  className="relative flex items-center gap-3 px-6 py-4 h-[60px] rounded-2xl font-semibold text-white border-rose-500/50 bg-rose-500/20 hover:bg-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.3)] transition-all overflow-hidden hover:-translate-y-1"
                >
                  <div className="bg-rose-500 p-2 rounded-full animate-pulse-slow shadow-[0_0_15px_rgba(244,63,94,0.8)] relative z-10">
                    <Square className="w-5 h-5 fill-white text-white" />
                  </div>
                  <span className="relative z-10 whitespace-nowrap">Deteniendo ({formatTime(recordingTime)})</span>
                </motion.button>
              )}
            </AnimatePresence>

            <div className="text-foreground/40 font-bold px-2 py-1 sm:py-0">o</div>

            <input
              type="file"
              accept="audio/*,video/*"
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="hidden"
            />

            <div className="relative flex flex-col items-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isRecording || isReady || transcriber.isBusy || transcriber.isModelLoading}
                className="relative flex items-center gap-3 px-6 py-4 h-[60px] rounded-2xl font-semibold text-indigo-50 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity" />
                <div className="bg-indigo-500/20 p-2 rounded-full group-hover:bg-indigo-500/40 transition-colors relative z-10 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                  <Upload className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="relative z-10 whitespace-nowrap">Subir Audio o Video</span>
              </button>
              <span className="absolute -bottom-7 text-[10px] text-indigo-200/40 font-semibold tracking-widest uppercase drop-shadow-sm whitespace-nowrap">(MP3, WAV, MP4, MOV...)</span>
            </div>
          </div>

          {/* Visualization / Player Area */}
          <div className="w-full mb-6">
            {isRecording && stream && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4">
                <AudioVisualizer stream={stream} />
              </motion.div>
            )}

            {activeAudioUrl && !isRecording && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-4 py-4 bg-white/5 rounded-2xl border border-white/5">
                <audio src={activeAudioUrl} controls className="w-full max-w-md h-12" />
                <div className="flex gap-4">
                  <button
                    onClick={clearAll}
                    disabled={transcriber.isBusy}
                    className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" /> Limpiar Audio
                  </button>
                  <button
                    onClick={handleStartTranscription}
                    disabled={transcriber.isBusy || transcriber.isModelLoading}
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary-hover transition-colors font-semibold disabled:opacity-50"
                  >
                    {transcriber.isBusy ? (
                      <><Cpu className="w-4 h-4 animate-spin" /> Transcribiendo...</>
                    ) : (
                      <><Play className="w-4 h-4" /> Transcribir Archivo</>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Transcript Area */}
          <div className="flex-1 bg-black/20 rounded-2xl border border-white/5 p-6 flex flex-col relative transition-all min-h-[150px]">
            {!transcriber.text && !transcriber.isBusy && (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                <FileAudio className="w-12 h-12 mb-4 opacity-50" />
                <p className="font-medium">Listo para transcribir.</p>
                <p className="text-sm mt-2 opacity-70">El texto de la transcripción aparecerá aquí.</p>
              </div>
            )}

            {transcriber.isBusy && !transcriber.text && (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-pulse">
                <p className="text-primary font-medium tracking-wide">Procesando inferencia local...</p>
              </div>
            )}

            {transcriber.text && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-left w-full h-full overflow-y-auto pr-2"
              >
                <motion.p
                  key={transcriber.text.length} // Force re-animate on significant change
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="text-lg leading-relaxed text-slate-200 indent-2"
                >
                  {transcriber.text}
                </motion.p>
              </motion.div>
            )}
          </div>

          {/* Export Actions */}
          <div className={`mt-6 flex justify-end gap-3 transition-opacity duration-300 ${transcriber.text ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <button onClick={exportTxt} className="glass-button flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium hover:text-white">
              <Download className="w-4 h-4" />
              .TXT
            </button>
            <button onClick={exportJSON} className="glass-button flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium hover:text-white">
              <Download className="w-4 h-4" />
              .JSON
            </button>
            <button onClick={exportSRT} className="glass-button flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium hover:text-white">
              <Download className="w-4 h-4" />
              .SRT
            </button>
          </div>

        </motion.div>

        {/* Tech Stack Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full flex flex-wrap items-center justify-center gap-4 text-xs font-medium mt-4 pb-16"
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
            <Box className="w-3.5 h-3.5 text-blue-400" />
            <span>Modelo: <strong className="text-white">{transcriber.selectedModel}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>Motor: <strong className="text-white">WebGPU Accelerado</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-green-400" />
            <span>Core: <strong className="text-white">Transformers.js</strong></span>
          </div>
        </motion.div>

      </main>

      {/* Footer Credits */}
      <footer className="fixed bottom-0 left-0 w-full py-4 bg-black/40 backdrop-blur-md border-t border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 text-xs md:text-sm text-slate-400">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium text-slate-300">100% Local y Privado</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <Code2 className="w-4 h-4 text-indigo-400" />
            Desarrollado por <span className="text-white">Chrystian Fabian Lozano Ramirez</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
