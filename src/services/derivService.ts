/**
 * Deriv API Service
 * Handles WebSocket connection to Deriv API V2
 */

const APP_ID = 1089; // Default app_id for testing
const WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

export type Tick = {
  quote: number;
  epoch: number;
  symbol: string;
};

export type Market = {
  display_name: string;
  symbol: string;
  market: string;
};

class DerivService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, (data: any) => void> = new Map();
  private onConnectListeners: (() => void)[] = [];

  constructor() {
    this.connect();
  }

  private connect() {
    this.socket = new WebSocket(WS_URL);

    this.socket.onopen = () => {
      console.log('Deriv WebSocket connected');
      this.onConnectListeners.forEach(cb => cb());
      this.startHeartbeat();
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const msgType = data.msg_type;
      
      if (this.listeners.has(msgType)) {
        this.listeners.get(msgType)!(data);
      }
      
      // Handle generic subscription responses
      if (data.subscription && this.listeners.has('subscription')) {
        this.listeners.get('subscription')!(data);
      }
    };

    this.socket.onclose = () => {
      console.log('Deriv WebSocket closed, reconnecting...');
      setTimeout(() => this.connect(), 3000);
    };

    this.socket.onerror = (error) => {
      console.error('Deriv WebSocket error:', error);
    };
  }

  private startHeartbeat() {
    setInterval(() => {
      this.send({ ping: 1 });
    }, 30000); // Ping every 30 seconds
  }

  public send(request: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(request));
    } else {
      console.warn('Deriv WebSocket not ready, queueing request...');
      this.onConnectListeners.push(() => this.send(request));
    }
  }

  public on(msgType: string, callback: (data: any) => void) {
    this.listeners.set(msgType, callback);
  }

  public subscribeTicks(symbol: string) {
    this.send({ ticks: symbol, subscribe: 1 });
  }

  public unsubscribeTicks(symbol: string) {
    this.send({ forget_all: 'ticks' });
  }

  public getActiveSymbols() {
    this.send({ active_symbols: 'brief', product_type: 'basic' });
  }

  public authorize(token: string) {
    this.send({ authorize: token });
  }
}

export const derivService = new DerivService();
