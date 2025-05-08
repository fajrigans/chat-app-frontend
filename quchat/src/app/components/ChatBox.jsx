'use client';

import { useState, useRef, useEffect } from 'react';
import { Paperclip, Send, Mic, Image, Video, FileText, Phone, Settings, UserCircle, MessageCircle, PhoneCall, Clock } from 'lucide-react';
import io from 'socket.io-client';  // Import socket.io-client

const socket = io('http://localhost:5000', {
  transports: ['websocket']

});

  // Hubungkan dengan server WebSocket

export default function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [activePage, setActivePage] = useState('chat');
  const [isCalling, setIsCalling] = useState(false); // Status panggilan
  const [isVideoCall, setIsVideoCall] = useState(false); // Status panggilan video
  const [isMicOn, setIsMicOn] = useState(false); // Status mic
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Event ketika menerima pesan dari server
    socket.on('chat_message', (msg) => {
      setMessages((prev) => [...prev, { text: msg, sender: 'Other', type: 'text' }]);
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });

    return () => {
      socket.off('chat_message');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
  
    socket.emit('chat_message', input);  // Kirim ke server
    setInput('');                         // Kosongkan input
    // Jangan setMessages di sini
  };
  

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileURL = URL.createObjectURL(file);
    let type = 'file';
    if (file.type.startsWith('image')) type = 'image';
    else if (file.type.startsWith('video')) type = 'video';

    setMessages((prev) => [
      ...prev,
      { text: fileURL, sender: 'You', type, name: file.name }
    ]);
  };

  const toggleMic = () => {
    setIsMicOn((prev) => !prev);
    socket.emit('toggle_mic', !isMicOn);
  };

  const startCall = () => {
    setIsCalling(true);
    socket.emit('start_call', { isVideoCall });
  };

  const endCall = () => {
    setIsCalling(false);
    setIsVideoCall(false);
    socket.emit('end_call');
  };

  const pages = {
    chat: (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
          {messages.map((msg, idx) => (
            <div key={idx} className="flex justify-end">
              <div className="text-sm bg-blue-100 text-black rounded p-2 max-w-xs">
                <span className="font-semibold">{msg.sender}: </span>
                {msg.type === 'text' && <span>{msg.text}</span>}
                {msg.type === 'image' && (
                  <img src={msg.text} alt="img" className="mt-1 rounded max-w-full" />
                )}
                {msg.type === 'video' && (
                  <video controls className="mt-1 rounded max-w-full">
                    <source src={msg.text} type="video/mp4" />
                    Browser tidak mendukung video.
                  </video>
                )}
                {msg.type === 'file' && (
                  <a
                    href={msg.text}
                    download={msg.name}
                    className="text-blue-600 underline block mt-1"
                  >
                    📎 {msg.name}
                  </a>
                )}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
          {messages.length === 0 && (
            <p className="text-gray-400 text-sm text-center mt-8">Belum ada pesan...</p>
          )}
        </div>

        <form onSubmit={handleSend} className="flex items-center p-2 border-t gap-2 bg-white">
          <button type="button" onClick={() => fileInputRef.current.click()}>
            <Paperclip className="w-5 h-5 text-gray-500 cursor-pointer" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,video/*,application/pdf,.doc,.docx"
          />
          <input
            type="text"
            className="flex-1 p-2 border rounded-lg"
            placeholder="Tulis pesan..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Mic
            className={`w-5 h-5 cursor-pointer ${isMicOn ? 'text-green-500' : 'text-gray-500'}`}
            onClick={toggleMic}
          />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    ),
    status: (
      <div className="flex-1 p-4 text-gray-500 text-sm">Fitur status belum tersedia.</div>
    ),
    calls: (
      <div className="flex-1 p-4 text-gray-500 text-sm">
        <div className="flex items-center justify-between mb-4">
          {isCalling ? (
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold">{isVideoCall ? 'Video Call' : 'Voice Call'}</h3>
              <button
                className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                onClick={endCall}
              >
                Akhiri Panggilan
              </button>
            </div>
          ) : (
            <button
              className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600"
              onClick={startCall}
            >
              {isVideoCall ? 'Mulai Video Call' : 'Mulai Panggilan Suara'}
            </button>
          )}
        </div>
      </div>
    ),
    settings: (
      <div className="flex-1 p-4 text-gray-500 text-sm">Pengaturan aplikasi belum tersedia.</div>
    ),
  };

  return (
    <div className="h-screen w-screen flex bg-gray-100">
      {/* Sidebar kiri */}
      <div className="w-1/4 bg-white p-4 flex flex-col border-r shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <UserCircle className="w-10 h-10 text-gray-500" />
          <div>
            <h2 className="font-semibold text-lg">Nama Anda</h2>
            <p className="text-xs text-gray-500">Online</p>
          </div>
        </div>
        <nav className="flex-1 space-y-4">
          <button onClick={() => setActivePage('chat')} className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
            <MessageCircle className="w-5 h-5" /> <span>Chat</span>
          </button>
          <button onClick={() => setActivePage('status')} className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
            <Clock className="w-5 h-5" /> <span>Status</span>
          </button>
          <button onClick={() => setActivePage('calls')} className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
            <PhoneCall className="w-5 h-5" /> <span>Panggilan</span>
          </button>
        </nav>
        <div className="mt-auto">
          <button onClick={() => setActivePage('settings')} className="flex items-center space-x-2 text-gray-500 hover:text-blue-600">
            <Settings className="w-5 h-5" /> <span>Pengaturan</span>
          </button>
        </div>
      </div>

      {/* Halaman kanan */}
      <div className="flex-1 flex flex-col">
        {/* Header chat */}
        <div className="bg-blue-500 text-white p-4 flex items-center space-x-3 shadow">
          <img
            src="https://via.placeholder.com/40"
            alt="Profile User Lain"
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h3 className="font-semibold">Pengguna Lain</h3>
            <p className="text-xs">Terakhir online 1 jam lalu</p>
          </div>
        </div>

        {pages[activePage]}
      </div>
    </div>
  );
}
