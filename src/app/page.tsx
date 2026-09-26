"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, Loader2, MapPin, Star, Clock, Info, CheckCircle2, AlertTriangle, IndianRupee } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  toolUsed?: {
    name: string;
    args: any;
    result?: any;
    status?: "success" | "pending_confirmation";
  };
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "msg-1", role: "assistant", content: "Namaste! What can I help you find today?" }
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [taskState, setTaskState] = useState<any>({ status: "collecting_requirements" });
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [traceLogs, setTraceLogs] = useState<any[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, traceLogs]);

  const toggleListening = async () => {
    if (isListening) {
      mediaRecorderRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          setInput("Transcribing audio...");
          
          const formData = new FormData();
          formData.append("file", audioBlob, "recording.webm");

          try {
            const sttRes = await fetch("/api/stt", {
              method: "POST",
              body: formData
            });
            const sttData = await sttRes.json();
            
            if (sttData.transcript) {
               setInput(sttData.transcript);
               setTimeout(() => {
                 document.getElementById("send-btn")?.click();
               }, 100);
            } else {
               setInput("");
               console.error("STT Failed", sttData.error);
            }
          } catch (e) {
            console.error("Failed to transcribe", e);
            setInput("");
          }

          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsListening(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
      }
    }
  };

  const addTrace = (title: string, data: any) => {
    setTraceLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), title, data }]);
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isProcessing) return;

    // Stop listening if sending
    if (isListening) {
      mediaRecorderRef.current?.stop();
      setIsListening(false);
    }

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsProcessing(true);
    addTrace("USER GOAL", text);

    try {
      // Build history for backend
      const history = messages.filter(m => m.role !== "system").map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, state: taskState, history })
      });

      const data = await res.json();
      
      addTrace("AGENT RESPONSE", data);
      setTaskState(data.newState);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        toolUsed: data.toolUsed
      };
      setMessages(prev => [...prev, assistantMsg]);

      // TTS playback
      if (data.reply) {
         try {
           const ttsRes = await fetch("/api/tts", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ text: data.reply })
           });
           const ttsData = await ttsRes.json();
           if (ttsData.audioBase64) {
             const audio = new Audio("data:audio/wav;base64," + ttsData.audioBase64);
             audio.play().catch(e => console.error("Audio playback blocked:", e));
           }
         } catch (ttsErr) {
           console.error("Failed to fetch TTS:", ttsErr);
         }
      }

    } catch (error) {
      console.error(error);
      addTrace("ERROR", "Failed to reach API");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmAction = async () => {
    if (taskState.status !== "awaiting_confirmation") return;
    handleSend("Yes, please proceed.");
  };

  const cancelAction = async () => {
     if (taskState.status !== "awaiting_confirmation") return;
     handleSend("No, cancel that.");
  }

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-gray-100 font-sans">
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative max-w-4xl mx-auto border-x border-[#333]/50 bg-black/40 backdrop-blur-xl shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#333] glass-dark z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              <div className="w-3 h-3 rounded-full bg-indigo-400 animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide text-white">SAARTHI</h1>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> LIVE
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-400 bg-[#222] px-3 py-1 rounded-full border border-[#333]">
             Powered by Sarvam AI
          </div>
        </div>

        {/* Status Indicator */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-16 left-0 right-0 flex justify-center z-10"
            >
              <div className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs px-4 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-md">
                <Loader2 className="w-3 h-3 animate-spin" />
                {taskState.status === "searching" ? "Searching nearby..." :
                 taskState.status === "awaiting_confirmation" ? "Waiting for confirmation..." :
                 "Understanding..."}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user" 
                    ? "bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-500/20" 
                    : "bg-[#222] text-gray-200 rounded-bl-none border border-[#333]"
                }`}
              >
                {msg.content}
              </motion.div>

              {/* Tool Execution Visuals */}
              {msg.toolUsed && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-2 w-full max-w-[85%]"
                >
                  {msg.toolUsed.name === "search_places" && msg.toolUsed.result && Array.isArray(msg.toolUsed.result) && (
                     <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
                        {msg.toolUsed.result.map((place: any) => (
                          <div key={place.id} className="min-w-[240px] flex-shrink-0 bg-[#1a1a1a] rounded-xl p-4 border border-[#333] snap-center hover:border-indigo-500/50 transition-all cursor-default">
                             <h3 className="font-semibold text-white text-lg truncate">{place.name}</h3>
                             <div className="flex items-center gap-1 text-yellow-500 text-sm mt-1">
                                <Star className="w-3 h-3 fill-current" /> {place.rating} <span className="text-gray-500">({place.reviewCount})</span>
                             </div>
                             <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                                <MapPin className="w-3 h-3" /> {place.address}
                             </div>
                             <div className="flex flex-wrap gap-1 mt-3">
                                {place.cuisine.slice(0, 2).map((c: string) => (
                                  <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-[#333] text-gray-300">{c}</span>
                                ))}
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1">
                                  <IndianRupee className="w-2 h-2" />{"₹".repeat(place.priceLevel)}
                                </span>
                             </div>
                          </div>
                        ))}
                     </div>
                  )}

                  {msg.toolUsed.name === "create_reservation" && msg.toolUsed.status === "pending_confirmation" && (
                     <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mt-2">
                        <div className="flex items-start gap-3">
                           <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                           <div>
                              <h4 className="font-medium text-orange-400">Confirmation Required</h4>
                              <p className="text-sm text-gray-300 mt-1">
                                 Do you want to book {msg.toolUsed.args.partySize} seats on {msg.toolUsed.args.date} at {msg.toolUsed.args.time}?
                              </p>
                              <div className="flex gap-2 mt-3">
                                 <button onClick={confirmAction} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
                                   Confirm Booking
                                 </button>
                                 <button onClick={cancelAction} className="bg-transparent border border-gray-600 hover:bg-[#333] text-gray-300 px-4 py-1.5 rounded-lg text-sm transition-colors">
                                   Cancel
                                 </button>
                              </div>
                           </div>
                        </div>
                     </div>
                  )}
                  
                  {msg.toolUsed.name === "create_reservation" && msg.toolUsed.result?.success && (
                     <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mt-2 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                        <div>
                           <h4 className="font-medium text-green-400">Booking Confirmed!</h4>
                           <p className="text-sm text-gray-300 mt-1">ID: {msg.toolUsed.result.reservationId}</p>
                           <p className="text-xs text-gray-500 mt-2 uppercase tracking-wider">{msg.toolUsed.result.provider}</p>
                        </div>
                     </div>
                  )}
                </motion.div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#111] border-t border-[#333] relative z-10">
          <div className="relative flex items-center bg-[#1a1a1a] rounded-2xl border border-[#333] focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all shadow-inner overflow-hidden">
            <button 
               onClick={toggleListening}
               className={`p-3 md:p-4 transition-colors ${isListening ? 'text-red-400 bg-red-400/10' : 'text-gray-400 hover:text-indigo-400'}`}
            >
              <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isListening ? "Listening..." : "Tell SAARTHI what you need..."}
              className="flex-1 bg-transparent border-none focus:outline-none text-gray-200 text-sm md:text-base py-3 px-2 placeholder:text-gray-500"
              disabled={isProcessing}
            />
            <button 
              id="send-btn"
              onClick={() => handleSend()}
              disabled={!input.trim() || isProcessing}
              className="p-3 md:p-4 text-indigo-500 hover:text-indigo-400 disabled:text-gray-600 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center mt-3">
             <p className="text-[10px] text-gray-500">Click mic to record, click again to send. Powered by Sarvam AI Speech-to-Text.</p>
          </div>
        </div>
      </div>

      {/* Developer Trace Panel */}
      <div className="hidden lg:flex flex-col w-96 bg-[#0a0a0a] border-l border-[#333] p-4">
        <div className="flex items-center gap-2 mb-4 text-gray-400">
           <Info className="w-4 h-4" />
           <h2 className="text-xs font-semibold uppercase tracking-widest">Agent Trace</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
           <AnimatePresence>
             {traceLogs.map((log, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-[#111] border border-[#222] rounded-lg p-3"
                >
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-[10px] font-bold text-indigo-400">{log.title}</span>
                     <span className="text-[10px] text-gray-600">{log.time}</span>
                   </div>
                   <pre className="text-[10px] text-gray-400 whitespace-pre-wrap font-mono bg-[#0a0a0a] p-2 rounded border border-[#222] overflow-x-auto">
                     {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                   </pre>
                </motion.div>
             ))}
             {traceLogs.length === 0 && (
                <div className="text-xs text-gray-600 text-center mt-10">
                   Trace logs will appear here as the agent works.
                </div>
             )}
           </AnimatePresence>
        </div>
      </div>

    </div>
  );
}

