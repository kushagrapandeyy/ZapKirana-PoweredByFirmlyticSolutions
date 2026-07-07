import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { v4 as uuidv4 } from 'uuid';

export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
  createdAt: number;
}

const QUEUE_KEY = '@offline_queue';

class OfflineQueue {
  private async getQueue(): Promise<QueuedRequest[]> {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private async saveQueue(queue: QueuedRequest[]) {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }

  async enqueue(url: string, method: string, headers?: Record<string, string>, body?: string) {
    const queue = await this.getQueue();
    queue.push({
      id: uuidv4(),
      url,
      method,
      headers,
      body,
      createdAt: Date.now(),
    });
    await this.saveQueue(queue);
    console.log(`[OfflineQueue] Enqueued ${method} ${url}`);
  }

  async flush() {
    const queue = await this.getQueue();
    if (queue.length === 0) return;

    console.log(`[OfflineQueue] Flushing ${queue.length} pending requests...`);
    
    // Process sequentially
    const remainingQueue = [];
    for (const req of queue) {
      try {
        console.log(`[OfflineQueue] Syncing ${req.method} ${req.url}`);
        const response = await fetch(req.url, {
          method: req.method,
          headers: req.headers,
          body: req.body,
        });
        
        if (!response.ok) {
          console.error(`[OfflineQueue] Failed to sync ${req.id} - ${response.status}`);
          // If it's a 4xx error (except 429), it might be a bad request, don't retry forever?
          // For simplicity, we drop 400s but keep 500s.
          if (response.status >= 500 || response.status === 429) {
            remainingQueue.push(req);
          }
        }
      } catch (error) {
        console.error(`[OfflineQueue] Network error for ${req.id}`, error);
        remainingQueue.push(req); // Keep in queue
      }
    }

    await this.saveQueue(remainingQueue);
    console.log(`[OfflineQueue] Flush complete. ${remainingQueue.length} items remaining.`);
  }

  async apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const state = await NetInfo.fetch();
    const method = (options.method || 'GET').toUpperCase();

    // If online, do normal fetch
    if (state.isConnected && state.isInternetReachable !== false) {
      return fetch(url, options);
    }

    // If offline and it's a mutation, queue it
    if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
      await this.enqueue(
        url,
        method,
        options.headers as Record<string, string>,
        options.body as string
      );
      
      // Return a mocked successful response
      return new Response(JSON.stringify({ offlineQueued: true }), {
        status: 202,
        statusText: 'Accepted (Offline Queue)',
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });
    }

    // If offline and it's a GET, just throw or return empty
    throw new Error('Network offline');
  }
}

export const OfflineQueueService = new OfflineQueue();
