"use client";

import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, MessageCircle, UserCircle2 } from "lucide-react"; // Added UserCircle2
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';

interface Message {
  id: string;
  text: string;
  sender: "user" | "support";
  timestamp: Date;
  avatar?: string;
  userName?: string;
}

export default function SupportPage() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      { 
        id: '1', 
        text: '¡Hola! ¿Cómo puedo ayudarte hoy?', 
        sender: 'support', 
        timestamp: new Date(),
        avatar: 'https://placehold.co/40x40.png?text=S', // Placeholder for support agent
        userName: 'Soporte Gaia'
      }
    ]);
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);


  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const userMessage: Message = {
      id: String(Date.now()),
      text: newMessage,
      sender: 'user',
      timestamp: new Date(),
      avatar: currentUser?.photoURL || undefined,
      userName: currentUser?.displayName || "Tú"
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setNewMessage('');

    // Simulate support reply
    setTimeout(() => {
      const supportReply: Message = {
        id: String(Date.now() + 1),
        text: "Gracias por tu mensaje. Un agente se pondrá en contacto contigo pronto.",
        sender: 'support',
        timestamp: new Date(),
        avatar: 'https://placehold.co/40x40.png?text=S',
        userName: 'Soporte Gaia'
      };
      setMessages(prevMessages => [...prevMessages, supportReply]);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
        <MessageCircle className="mr-3 h-8 w-8 text-primary" /> Chat de Soporte
      </h2>
      
      <Card className="shadow-lg w-full h-[calc(100vh-250px)] md:h-[calc(100vh-220px)] flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg">
            {currentUser ? `Chateando como ${currentUser.displayName}` : "Soporte en Vivo"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden p-0">
          <ScrollArea ref={scrollAreaRef} className="h-full p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end space-x-2 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'support' && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={msg.avatar} alt={msg.userName} data-ai-hint="avatar support" />
                    <AvatarFallback>{msg.userName ? msg.userName.charAt(0) : 'S'}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[70%] p-3 rounded-lg shadow ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-card text-card-foreground border border-border rounded-bl-none'
                  }`}
                >
                  <p className="text-sm font-semibold">{msg.sender === 'user' ? (currentUser?.displayName || "Tú") : msg.userName}</p>
                  <p className="text-sm mt-1">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {msg.sender === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser?.photoURL || undefined} alt={currentUser?.displayName || "Usuario"} data-ai-hint="avatar person" />
                    <AvatarFallback>
                      {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : <UserCircle2 className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </ScrollArea>
        </CardContent>
        <form onSubmit={handleSendMessage} className="p-4 border-t bg-background flex items-center space-x-2">
          <Input
            type="text"
            placeholder={currentUser ? "Escribe tu mensaje..." : "Inicia sesión para chatear"}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-grow"
            aria-label="Entrada de mensaje de chat"
            disabled={!currentUser}
          />
          <Button type="submit" size="icon" variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground" aria-label="Enviar mensaje" disabled={!currentUser}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
