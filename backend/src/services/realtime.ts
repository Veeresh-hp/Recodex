import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://fpeyenqtujkmmwmolwtp.supabase.co";

const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwZXllbnF0dWprbW13bW9sd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NjIxNDQsImV4cCI6MjA5NTUzODE0NH0.xUXnO0wVL0gl9yr1tqZ_s6Z_O7J2gmyu-Jq6TfuUAsM";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Broadcasts a new query message over Supabase Realtime channel.
 * Target channels:
 * - `query:${queryId}`: for anyone viewing this specific conversation
 * - `queries_feed`: for the admin inquiries feed and global notifications
 */
export async function broadcastQueryMessage(queryId: string, messagePayload: any) {
  try {
    const channelName = `query:${queryId}`;
    const channel = supabase.channel(channelName);

    // Send to specific query conversation channel
    await channel.send({
      type: "broadcast",
      event: "new_message",
      payload: {
        queryId,
        message: messagePayload,
      },
    });

    // Also notify global feed
    const globalChannel = supabase.channel("queries_feed");
    await globalChannel.send({
      type: "broadcast",
      event: "query_activity",
      payload: {
        queryId,
        type: "NEW_MESSAGE",
        message: messagePayload,
      },
    });

    console.log(`[REALTIME] Broadcasted new_message to ${channelName} [msgId=${messagePayload.id}]`);
  } catch (err) {
    console.warn("[REALTIME] Broadcast message warning (database remains source of truth):", err);
  }
}

/**
 * Broadcasts a status change event (e.g. RESOLVED, OPEN, REOPENED).
 */
export async function broadcastQueryStatus(queryId: string, status: string, additionalData?: any) {
  try {
    const channelName = `query:${queryId}`;
    const channel = supabase.channel(channelName);

    await channel.send({
      type: "broadcast",
      event: "status_changed",
      payload: {
        queryId,
        status,
        ...additionalData,
      },
    });

    const globalChannel = supabase.channel("queries_feed");
    await globalChannel.send({
      type: "broadcast",
      event: "query_activity",
      payload: {
        queryId,
        type: "STATUS_CHANGED",
        status,
        ...additionalData,
      },
    });

    console.log(`[REALTIME] Broadcasted status_changed to ${channelName} [status=${status}]`);
  } catch (err) {
    console.warn("[REALTIME] Broadcast status warning (database remains source of truth):", err);
  }
}
