import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ai } from '../lib/ai';
import { MessageSquare, Send, Paperclip, Mic, Image, Video } from 'lucide-react';
import { format } from 'date-fns';
import type { Message, User } from '../types';

export function Messaging() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!user) return;
    
    fetchContacts();
    subscribeToMessages();
    
    return () => {
      supabase.removeChannel('messages');
    };
  }, [user]);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id);
    }
  }, [selectedContact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .neq('id', user!.id);

    if (error) {
      console.error('Error fetching contacts:', error);
      return;
    }

    setContacts(data);
  };

  const fetchMessages = async (contactId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data);
  };

  const subscribeToMessages = () => {
    supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user!.id}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedContact) return;

    const messageIntent = await ai.classifyIntent(newMessage);
    const sentiment = await ai.analyzeSentiment(newMessage);

    const message = {
      sender_id: user!.id,
      receiver_id: selectedContact.id,
      content: newMessage,
      type: 'text',
      metadata: {
        intent: messageIntent,
        sentiment: sentiment
      }
    };

    const { error } = await supabase
      .from('messages')
      .insert(message);

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    setNewMessage('');
    handleStopTyping();
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      // Notify the other user that this user is typing
      supabase.from('notifications').insert({
        user_id: selectedContact!.id,
        type: 'typing',
        content: { user_id: user!.id }
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(handleStopTyping, 2000);
  };

  const handleStopTyping = () => {
    setIsTyping(false);
    // Notify the other user that this user stopped typing
    if (selectedContact) {
      supabase.from('notifications').insert({
        user_id: selectedContact.id,
        type: 'stop_typing',
        content: { user_id: user!.id }
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Contacts Sidebar */}
      <div className="w-1/4 bg-white border-r">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Messages</h2>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-4rem)]">
          {contacts.map(contact => (
            <button
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 ${
                selectedContact?.id === contact.id ? 'bg-indigo-50' : ''
              }`}
            >
              {contact.profile_image ? (
                <img
                  src={contact.profile_image}
                  alt={contact.full_name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                </div>
              )}
              <div className="flex-1 text-left">
                <h3 className="font-medium">{contact.full_name}</h3>
                <p className="text-sm text-gray-500 truncate">
                  {contact.role}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b flex items-center space-x-3">
              {selectedContact.profile_image ? (
                <img
                  src={selectedContact.profile_image}
                  alt={selectedContact.full_name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                </div>
              )}
              <div>
                <h2 className="font-semibold">{selectedContact.full_name}</h2>
                <p className="text-sm text-gray-500">{selectedContact.role}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.sender_id === user!.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.sender_id === user!.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200'
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className="text-xs mt-1 opacity-75">
                      {format(new Date(message.created_at), 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t">
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <Paperclip className="w-5 h-5 text-gray-500" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <Image className="w-5 h-5 text-gray-500" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <Video className="w-5 h-5 text-gray-500" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <Mic className="w-5 h-5 text-gray-500" />
                </button>
                <button
                  onClick={handleSend}
                  className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900">
                Select a contact to start messaging
              </h3>
              <p className="mt-1 text-gray-500">
                Choose from your contacts list to begin a conversation
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}