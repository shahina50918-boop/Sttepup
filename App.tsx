
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import ChatBubble from './components/ChatBubble';
import { Message, Subject } from './types';
import { getGeminiResponse } from './services/geminiService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'teacher',
      text: 'আসসালামু আলাইকুম। আমি ডিজিটাল টিচার। আটুলিয়া সোহরাবিয়া দাখিল মাদ্রাসার পক্ষ থেকে তোমাকে স্বাগতম। তুমি কোন বিষয়ে শিখতে চাও? নিচে থেকে বিষয় নির্বাচন করতে পারো।',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const subjects = [
    { name: Subject.Quran, icon: 'fa-book-quran', color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
    { name: Subject.Arabic, icon: 'fa-language', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    { name: Subject.Math, icon: 'fa-calculator', color: 'bg-rose-100 text-rose-700 hover:bg-rose-200' },
    { name: Subject.English, icon: 'fa-font', color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' },
    { name: Subject.Hadith, icon: 'fa-scroll', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  const handleSend = async (overrideMessage?: string) => {
    const textToSend = overrideMessage || input;
    if (!textToSend.trim() || isLoading) return;

    // Local copy of input to reset UI immediately
    const currentUserInput = textToSend;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: currentUserInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare history including the context of the current request
      // We limit history to last 10 messages to maintain performance and focus
      const history = messages.slice(-10).map(msg => ({
        role: msg.role === 'teacher' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      // Add context if a subject is selected
      const contextualMessage = selectedSubject 
        ? `[ছাত্র এখন ${selectedSubject} বিষয়ের উপর আলোকপাত করছে]: ${currentUserInput}`
        : currentUserInput;

      const responseText = await getGeminiResponse(contextualMessage, history);

      const teacherResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'teacher',
        text: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, teacherResponse]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubjectClick = (subject: Subject) => {
    setSelectedSubject(subject);
    const prompt = `${subject} বিষয়ে আমাকে আজ কিছু বিশেষ শিক্ষা দিন।`;
    handleSend(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-emerald-50">
      <Header />
      
      <main className="flex-grow container mx-auto p-4 md:p-6 flex flex-col max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-grow h-full">
          
          {/* Sidebar / Info */}
          <div className="hidden md:flex flex-col gap-4 col-span-1">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100">
              <h3 className="font-bold text-emerald-800 mb-3 border-b pb-2">মাদরাসার তথ্য</h3>
              <ul className="text-sm space-y-3 text-gray-600">
                <li className="flex items-center gap-2">
                  <i className="fas fa-check-circle text-emerald-500"></i> ইবতেদায়ি বিভাগ
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check-circle text-emerald-500"></i> দাখিল বিভাগ
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check-circle text-emerald-500"></i> হিফজ ও নুরানি
                </li>
              </ul>
            </div>
            
            <div className="bg-emerald-600 p-5 rounded-2xl shadow-sm text-white">
              <h3 className="font-bold mb-2 text-sm">ডিজিটাল টিচার টিপস</h3>
              <p className="text-[11px] opacity-90 leading-relaxed">গণিত সমাধান পেতে প্রশ্নটি স্পষ্টভাবে লেখো। কুরআন বা হাদিসের রেফারেন্স পেতে বিষয়ের নাম উল্লেখ করো।</p>
            </div>
          </div>

          {/* Chat Main Area */}
          <div className="col-span-1 md:col-span-3 flex flex-col bg-white rounded-3xl shadow-xl overflow-hidden border border-emerald-100">
            {/* Chat Messages */}
            <div 
              ref={scrollRef}
              className="flex-grow p-4 md:p-6 overflow-y-auto chat-container h-[450px] bg-slate-50/50"
            >
              {messages.map(msg => (
                <ChatBubble key={msg.id} message={msg} />
              ))}
              {isLoading && (
                <div className="flex justify-start mb-4 animate-in fade-in duration-300">
                  <div className="flex items-center">
                    <div className="bg-emerald-600 h-10 w-10 rounded-full flex items-center justify-center text-white mr-2 shadow-sm ring-2 ring-emerald-100">
                      <i className="fas fa-user-tie"></i>
                    </div>
                    <div className="bg-white px-4 py-3 rounded-2xl border border-emerald-100 shadow-sm rounded-tl-none flex items-center gap-1.5">
                      <div className="typing-dot w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                      <div className="typing-dot w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                      <div className="typing-dot w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Subject Selection Area */}
            <div className="px-4 py-3 bg-white border-t border-emerald-50 overflow-x-auto no-scrollbar">
              <div className="flex gap-2 min-w-max">
                {subjects.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => handleSubjectClick(s.name)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all transform active:scale-95 whitespace-nowrap border ${
                      selectedSubject === s.name 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-200' 
                        : `${s.color} border-transparent hover:shadow-sm`
                    }`}
                  >
                    <i className={`fas ${s.icon}`}></i>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-emerald-50">
              <div className="flex items-end gap-2 bg-gray-50 rounded-2xl p-2 border border-gray-200 focus-within:border-emerald-500 transition-all shadow-inner">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={selectedSubject ? `${selectedSubject} বিষয়ে প্রশ্ন করুন...` : "আপনার প্রশ্নটি এখানে লিখুন..."}
                  className="flex-grow bg-transparent border-none focus:ring-0 text-sm md:text-base py-2 px-3 resize-none max-h-32 min-h-[44px]"
                  rows={1}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                    !input.trim() || isLoading 
                      ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200'
                  }`}
                >
                  <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
                </button>
              </div>
              <p className="text-[10px] text-center text-gray-400 mt-2 italic font-medium">
                আটুলিয়া সোহরাবিয়া দাখিল মাদ্রাসা - ডিজিটাল টিচার সর্বদা পাশে আছে।
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Mobile */}
      <footer className="md:hidden bg-white p-3 border-t flex justify-around text-emerald-700 text-xs font-medium shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        <button className="flex flex-col items-center gap-1">
          <i className="fas fa-home"></i> হোম
        </button>
        <button className="flex flex-col items-center gap-1 text-emerald-900 border-b-2 border-emerald-600 px-2 pb-1">
          <i className="fas fa-chalkboard-teacher"></i> ডিজিটাল টিচার
        </button>
        <button className="flex flex-col items-center gap-1">
          <i className="fas fa-info-circle"></i> তথ্য
        </button>
      </footer>
    </div>
  );
};

export default App;
