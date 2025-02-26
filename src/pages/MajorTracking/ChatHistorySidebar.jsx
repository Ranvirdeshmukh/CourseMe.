import React, { useEffect, useState } from 'react';
import { getFirestore, collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const ChatHistorySidebar = ({ onSelectChat, currentChatId }) => {
  const db = getFirestore();
  const auth = getAuth();
  const [chatSessions, setChatSessions] = useState([]);

  useEffect(() => {
    const fetchChatSessions = async () => {
      if (!auth.currentUser) return;
      const sessionsRef = collection(db, "chatConversations", auth.currentUser.uid, "sessions");
      const q = query(sessionsRef);
      const snapshot = await getDocs(q);
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Optionally sort sessions by last updated
      sessions.sort((a, b) => b.lastUpdated?.seconds - a.lastUpdated?.seconds);
      setChatSessions(sessions);
    };

    fetchChatSessions();
  }, [auth.currentUser, db]);

  return (
    <div className="p-4 border-r" style={{ minWidth: '250px', background: '#f9f9f9' }}>
      <h3 className="text-lg font-semibold mb-4">Chat History</h3>
      {chatSessions.map(session => (
        <div 
          key={session.id}
          className={`cursor-pointer p-2 mb-2 rounded-md hover:bg-gray-200 ${session.id === currentChatId ? 'bg-gray-300' : ''}`}
          onClick={() => onSelectChat(session)}
        >
          <div className="font-medium">
            {new Date(session.lastUpdated?.seconds * 1000).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">
            {session.conversation && session.conversation[0] && session.conversation[0].text.slice(0, 30) + '...'}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatHistorySidebar;
