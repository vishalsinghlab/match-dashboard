import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { decode } from '@msgpack/msgpack';

export interface MatchUpdate {
    matchId: string;
    score: {
        home: number;
        away: number;
    };
    status: 'LIVE' | 'COMPLETED';
    timestamp: number;
}

@Injectable({
    providedIn: 'root',
})


export class RealtimeService {
    private readonly socket: Socket = io('http://localhost:3000', {
        transports: ['websocket'],
        withCredentials: true,
    });

    connect(): void {
        if (!this.socket.connected) {
            this.socket.connect();
        }
    }

    disconnect(): void {
        if (this.socket.connected) {
            this.socket.disconnect();
        }
    }

    isConnected(): boolean {
        return this.socket.connected;
    }

    onError(callback: (err: Error) => void): () => void {
        this.socket.on('connect_error', callback);
        return () => this.socket.off('connect_error', callback);
    }

    joinMatch(matchId: string): void {
        this.socket.emit('match:join', matchId);
    }

    leaveMatch(matchId: string): void {
        this.socket.emit('match:leave', matchId);
    }

    onConnect(callback: () => void): () => void {
        this.socket.on('connect', callback);
        return () => this.socket.off('connect', callback);
    }

    onDisconnect(callback: (reason: string) => void): () => void {
        this.socket.on('disconnect', callback);
        return () => this.socket.off('disconnect', callback);
    }

    onMatchJoined(
        callback: (data: { matchId: string; room: string }) => void,
    ): () => void {
        this.socket.on('match:joined', callback);
        return () => this.socket.off('match:joined', callback);
    }

    onMatchUpdate(
        callback: (data: MatchUpdate) => void,
    ): () => void {
        const handler = (binaryData: Uint8Array) => {
            try {
                const data = decode(binaryData) as MatchUpdate;
                callback(data);
            } catch (err) {
                console.error('Failed to decode match update payload:', err);
            }
        };

        this.socket.on('match:update', handler);
        return () => this.socket.off('match:update', handler);
    }
}