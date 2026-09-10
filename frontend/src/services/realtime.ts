import { supabase } from "../lib/supabase";

export interface RealtimeMessage {
  id: string;
  queryId: string;
  senderId: string;
  senderRole: "CUSTOMER" | "ADMIN" | string;
  senderName: string;
  senderEmail?: string;
  message: string;
  createdAt: string;
}

export interface RealtimeStatusChange {
  queryId: string;
  status: "OPEN" | "PENDING" | "RESOLVED" | "CLOSED" | string;
  resolvedAt?: string;
}

/**
 * Subscribes to realtime updates for a specific query conversation thread.
 * Listens for:
 * 1. `new_message`: when customer or admin sends a reply
 * 2. `status_changed`: when ticket is resolved or reopened
 *
 * Returns an unsubscribe callback for clean component unmounting.
 */
export function subscribeToQuery(
  queryId: string,
  callbacks: {
    onMessage?: (msg: RealtimeMessage) => void;
    onStatusChange?: (statusData: RealtimeStatusChange) => void;
  }
): () => void {
  if (!queryId) return () => {};

  const channelName = `query:${queryId}`;
  const channel = supabase.channel(channelName);

  channel
    .on("broadcast", { event: "new_message" }, (event) => {
      if (event.payload && event.payload.message) {
        if (callbacks.onMessage) {
          callbacks.onMessage(event.payload.message);
        }
      }
    })
    .on("broadcast", { event: "status_changed" }, (event) => {
      if (event.payload) {
        if (callbacks.onStatusChange) {
          callbacks.onStatusChange(event.payload as RealtimeStatusChange);
        }
      }
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log(`[REALTIME CLIENT] Connected to ${channelName}`);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribes to global queries feed (for Admin Dashboard real-time telemetry badge / count).
 */
export function subscribeToGlobalQueriesFeed(
  onActivity: (activity: { queryId: string; type: string; message?: any; status?: string }) => void
): () => void {
  const channel = supabase.channel("queries_feed");

  channel
    .on("broadcast", { event: "query_activity" }, (event) => {
      if (event.payload) {
        onActivity(event.payload);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
