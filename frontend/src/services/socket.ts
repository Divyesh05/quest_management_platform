import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:9999';

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string) {
    if (this.socket?.connected && this.token === token) return;
    
    this.token = token;
    
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to real-time server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('notification', (data: any) => {
      if (data.type === 'success') toast.success(data.message || data.title);
      else if (data.type === 'error') toast.error(data.message || data.title);
      else if (data.type === 'warning') toast.error(data.message || data.title);
      else toast(data.message || data.title);
    });
    
    this.socket.on('submission_approved', (data: any) => {
      toast.success(`Submission for ${data.quest.title} approved! You earned ${data.quest.reward} points!`);
    });

    this.socket.on('submission_rejected', (data: any) => {
      toast.error(`Submission for ${data.quest.title} rejected.`);
    });
    
    this.socket.on('achievement_earned', (data: any) => {
      toast.success(`Achievement Unlocked! ${data.quest.title}`);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.token = null;
    }
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
