import React, { useState, useRef, useEffect } from 'react';
import { SelectionBox, ProcessingStatus } from './types';
import ImageCanvas from './components/ImageCanvas';
import Button from './components/Button';
import { editImageTimestamp } from './services/geminiService';

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [selection, setSelection] = useState<SelectionBox | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState<string>(new Date().toTimeString().split(' ')[0].substring(0, 5));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setOriginalImage(event.target?.result as string);
        setResultImage(null);
        setSelection(null);
        setStatus(ProcessingStatus.IDLE);
        setErrorMsg(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!originalImage) return;

    setStatus(ProcessingStatus.PROCESSING);
    setErrorMsg(null);

    try {
      const result = await editImageTimestamp({
        imageBase64: originalImage,
        newDate,
        newTime,
        // We pass the selection info conceptually via prompt engineering in the service if needed,
        // or just rely on the smart model. The current service relies on strict prompting.
      });
      setResultImage(result);
      setStatus(ProcessingStatus.COMPLETED);
    } catch (err) {
      setStatus(ProcessingStatus.ERROR);
      setErrorMsg("Failed to process image. Please try again. Ensure the image is clear.");
    }
  };

  const handleDownload = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = `timemark_edited_${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setResultImage(null);
    setSelection(null);
    setStatus(ProcessingStatus.IDLE);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Timemark Editor <span className="text-blue-500 text-sm font-normal px-2 py-0.5 bg-blue-500/10 rounded-full border border-blue-500/20">Pro</span>
            </h1>
          </div>
          <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Documentation</a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-6 gap-6 h-[calc(100vh-80px)]">
        
        {/* Left Panel: Image Editor */}
        <div className="flex-1 flex flex-col bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl relative">
          {!originalImage ? (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 m-4 rounded-xl hover:border-blue-500/50 hover:bg-slate-800 transition-all cursor-pointer group"
                 onClick={() => fileInputRef.current?.click()}>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 text-slate-400 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-200 mb-2">Upload Timestamp Image</h3>
              <p className="text-slate-400">Click or Drag & Drop to upload</p>
            </div>
          ) : (
            <div className="flex-1 relative flex flex-col">
              {resultImage ? (
                 <div className="relative w-full h-full flex items-center justify-center bg-slate-950 p-4">
                     <div className="absolute top-4 left-4 z-20 bg-green-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-green-500/30 text-green-400 text-xs font-bold uppercase">
                        Result
                     </div>
                     <img src={resultImage} className="max-w-full max-h-full object-contain rounded shadow-2xl" alt="Edited" />
                 </div>
              ) : (
                <ImageCanvas 
                    imageSrc={originalImage} 
                    onSelectionChange={setSelection}
                    className="p-4"
                    label="Original"
                />
              )}
              
              {/* Bottom Warning / Instruction */}
              {!resultImage && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur text-white px-4 py-2 rounded-lg text-sm border border-white/10 shadow-xl pointer-events-none whitespace-nowrap">
                    {selection ? "Target area selected" : "Optional: Draw a box around the timestamp for precision"}
                  </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel: Controls */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
          
          {/* Instructions Panel */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                Settings
            </h2>
            
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">New Date</label>
                    <input 
                        type="date" 
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">New Time</label>
                    <input 
                        type="time" 
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>

                <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
                    <h4 className="text-blue-400 font-medium text-sm mb-1">Processing Mode</h4>
                    <p className="text-blue-300/70 text-xs">
                        AI will detect font style, shadow, and background texture to perform seamless inpainting replacement.
                    </p>
                </div>
            </div>
          </div>

          {/* Action Panel */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg flex-1 flex flex-col justify-end">
             {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-4">
                    {errorMsg}
                </div>
             )}

             <div className="space-y-3">
                 {resultImage ? (
                    <>
                        <Button onClick={handleDownload} className="w-full py-3 text-lg">
                            Download Result
                        </Button>
                        <Button variant="secondary" onClick={handleReset} className="w-full">
                            Edit Another
                        </Button>
                    </>
                 ) : (
                    <Button 
                        onClick={handleProcess} 
                        disabled={!originalImage || status === ProcessingStatus.PROCESSING}
                        isLoading={status === ProcessingStatus.PROCESSING}
                        className="w-full py-3 text-lg"
                    >
                        Apply New Timestamp
                    </Button>
                 )}
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;