import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Sparkles, Sprout, SendHorizontal, Bot } from "lucide-react";
import { ChatMessage, Crop, Region, FarmState } from "../types";

interface GeminiAdvisorProps {
  currentRegion: Region;
  activeFarms: FarmState[];
}

// Lightweight, safe markdown rendering component to handle lists, headings, and bold markup flawlessly
const SafeMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split("\n");
  
  return (
    <div className="space-y-2 text-xs sm:text-sm text-gray-800 leading-relaxed text-left font-serif">
      {lines.map((line, idx) => {
        // Strip trailing/leading spaces
        const trimmed = line.trim();

        if (trimmed.startsWith("###")) {
          return (
            <h4 key={idx} className="font-serif italic font-bold text-sm text-[#1A1A1A] mt-3 mb-1 flex items-center gap-1.5 border-b border-black/5 pb-1">
              {trimmed.replace(/^###\s*/, "")}
            </h4>
          );
        }
        if (trimmed.startsWith("##")) {
          return (
            <h3 key={idx} className="font-serif italic font-bold text-base text-[#1A1A1A] mt-4 mb-2">
              {trimmed.replace(/^##\s*/, "")}
            </h3>
          );
        }
        if (trimmed.startsWith("-") || trimmed.startsWith("* ")) {
          const content = trimmed.replace(/^[-*]\s*/, "");
          return (
            <li key={idx} className="ml-4 list-disc pl-1 text-gray-700">
              {renderBoldText(content)}
            </li>
          );
        }
        if (/^\d+\./.test(trimmed)) {
          const content = trimmed.replace(/^\d+\.\s*/, "");
          return (
            <div key={idx} className="ml-4 text-gray-700">
              <span className="font-bold text-[#2D5A27] mr-1">{trimmed.match(/^\d+\./)?.[0]}</span>
              {renderBoldText(content)}
            </div>
          );
        }
        if (trimmed === "") {
          return <div key={idx} className="h-1.5" />;
        }
        
        return <p key={idx}>{renderBoldText(trimmed)}</p>;
      })}
    </div>
  );
};

// Simple utility to bold matches of **something**
function renderBoldText(rawText: string) {
  const parts = rawText.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) => {
    // Every odd index is a match within asterisks
    if (i % 2 === 1) {
      return <strong key={i} className="font-bold text-gray-950">{part}</strong>;
    }
    return part;
  });
}

export const GeminiAdvisorClient: React.FC<GeminiAdvisorProps> = ({ currentRegion, activeFarms }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Seed initial introduction greeting message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome-msg",
          sender: "ai",
          text: `### 🌾 Indian Agricultural AI Advisor\n` +
                `Hello! I am your cooperative co-advisor, specialized in **${currentRegion.name}** soil characteristics.\n\n` +
                `I can assist you with adaptive agronomy decisions:\n` +
                `- **Soil Nutrition**: Custom NPK optimization & organic bio-manure recipes.\n` +
                `- **Pest Containment**: Early mitigation plans for Cotton Bollworm, Soybean mites, etc.\n` +
                `- **FPO Wholesaling**: Drafting direct buyer off-take agreement blueprints.\n\n` +
                `*Use one of the instant questions below, or query your customized field concern!*`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [currentRegion]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, sending]);

  const presetPrompts = [
    { label: "NPK Deficit Correctives", prompt: "How should our FPO treat extreme low Nitrogen in clayey black soils cheaply?" },
    { label: "Organic Pest Controls", prompt: "What organic crop protection schedule eradicates pest caterpillars on Bt Cotton without toxic elements?" },
    { label: "FPO Deal Template", prompt: "Write an agreement template for FPO direct contract supply to Tata Global, securing moisture guarantee limits." }
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || sending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setSending(true);

    const activeCropNames = Array.from(new Set(activeFarms.map(f => f.allocatedCropId))).join(", ");

    try {
      const response = await fetch("/api/chat-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          regionName: currentRegion.name,
          activeCropName: activeCropNames,
          sensorStats: activeFarms.map(f => ({
            owner: f.ownerName,
            crop: f.allocatedCropId,
            moisture: `${Math.round(f.soilMoisture)}mm`,
            yieldFactor: `${Math.round(f.cropYieldFactor * 100)}%`
          }))
        })
      });

      const data = await response.json();
      
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.text || "I was unable to analyze that. Please rephrase or verify connection parameters.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("[FrontEnd Chat Error]", err);
      // Fallback
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: "ai",
          text: `### ⚠️ Connection Notice\n` +
                `Our server gateway encountered a communication variance. This can occur in guest preview. Let me provide typical advisory diagnostics:\n\n` +
                `- **Recommendation for Crop**: Maintain soil moisture threshold above 35mm using precise drip lines.\n` +
                `- **NPK Correction**: Top-dress with customized dolomite or azolla bio-matter.\n\n` +
                `*Please verify that process.env.GEMINI_API_KEY is active in the AI Studio Secrets panel!*`,
          timestamp: new Date().toLocaleTimeString([])
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#FAF9F6] border border-[#1A1A1A]/20 p-6 h-[510px] flex flex-col justify-between" id="ai-chat-advisor-section">
      <div className="border-b border-black/10 pb-3 flex items-baseline justify-between animate-none">
        <h2 className="text-base font-serif italic font-bold text-[#1A1A1A]">
          Smart Agronomy Consultant
        </h2>
        <span className="text-[9px] border border-[#2D5A27] bg-green-50 text-[#2D5A27] font-bold font-mono px-2 py-0.5 uppercase tracking-wider">
          Active Grounding
        </span>
      </div>

      {/* Message Feed Canvas */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin scrollbar-thumb-black/5">
        {messages.map((m) => {
          const isAi = m.sender === "ai";
          return (
            <div key={m.id} className={`flex items-start gap-2.5 ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`h-8 w-8 shrink-0 flex items-center justify-center border font-bold ${
                isAi ? "bg-[#FAF9F6] text-[#2D5A27] border-[#2D5A27]" : "bg-[#1A1A1A] text-[#FAF9F6] border-[#1A1A1A]"
              }`}>
                {isAi ? <Sprout className="h-4.5 w-4.5" /> : <span className="text-xs font-mono">FR</span>}
              </div>
              <div className={`p-4 max-w-[85%] border ${
                isAi ? "bg-white border-black/10 text-left font-serif" : "bg-[#1A1A1A] border-[#1A1A1A] text-white text-xs sm:text-sm text-left"
              }`}>
                {isAi ? (
                  <SafeMarkdown text={m.text} />
                ) : (
                  <p className="leading-relaxed">{m.text}</p>
                )}
                <span className={`text-[9px] block mt-2 text-right ${isAi ? "text-gray-400" : "text-white/60 font-mono"}`}>
                  {m.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {sending && (
          <div className="flex items-start gap-2.5">
            <div className="h-8 w-8 shrink-0 flex items-center justify-center bg-white border border-[#2D5A27] text-[#2D5A27] animate-pulse">
              <Sprout className="h-4.5 w-4.5" />
            </div>
            <div className="p-4 bg-white border border-black/10 text-xs text-gray-500 italic block text-left font-serif">
              Consultant is analyzing environmental metrics and aligning cooperative guidelines...
            </div>
          </div>
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Input controls */}
      <div className="pt-3 border-t border-black/15">
        {/* Preset query widgets */}
        <div className="flex flex-wrap gap-1.5 pb-3">
          {presetPrompts.map((p, idx) => (
            <button
              key={idx}
              id={`preset-prompt-${idx}`}
              onClick={() => handleSendMessage(p.prompt)}
              disabled={sending}
              className="px-2.5 py-1.5 text-[9.5px] uppercase font-mono font-bold tracking-wider bg-white border border-black/10 hover:border-black hover:bg-black/5 transition-all text-gray-700 disabled:opacity-55 cursor-pointer"
            >
              {p.label} →
            </button>
          ))}
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="flex items-center gap-2 pt-3 border-t border-black/5"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ask about crop plans in ${currentRegion.name.split(",")[0]}...`}
            disabled={sending}
            className="flex-1 bg-white border border-black/10 focus:border-[#1A1A1A] font-serif text-xs sm:text-sm px-4 py-2.5 outline-none transition-all placeholder:text-gray-405"
          />
          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="p-2.5 bg-[#1A1A1A] border border-[#1A1A1A] text-white hover:bg-[#2D5A27] transition-all disabled:opacity-40 cursor-pointer"
          >
            <SendHorizontal className="h-4.5 w-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
