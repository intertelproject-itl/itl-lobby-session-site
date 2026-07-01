import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';

const chatHubPath = '/chathub';
let chatHubConnection: ReturnType<typeof createChatHubConnection> | null = null;
let chatHubStartPromise: Promise<void> | null = null;
let chatHubGlobalHandlersRegistered = false;

export function getChatHubUrl() {
  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '';
  return `${baseUrl}${chatHubPath}`;
}

export function createChatHubConnection() {
  return new HubConnectionBuilder()
    .withUrl(getChatHubUrl())
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build();
}

export function getChatHubConnection() {
  if (!chatHubConnection) {
    chatHubConnection = createChatHubConnection();
    registerChatHubLifecycleHandlers(chatHubConnection);
    (globalThis as { cyberpunkChatHub?: unknown }).cyberpunkChatHub = chatHubConnection;
  }

  return chatHubConnection;
}

function registerChatHubLifecycleHandlers(connection: ReturnType<typeof createChatHubConnection>) {
  if (chatHubGlobalHandlersRegistered) return;

  chatHubGlobalHandlersRegistered = true;

  connection.onreconnecting((error) => {
    console.warn('[SignalR] Reconectando ao /chathub', error);
  });

  connection.onreconnected((connectionId) => {
    console.info('[SignalR] Reconectado ao /chathub', { connectionId });
  });

  connection.onclose((error) => {
    console.warn('[SignalR] Conexao com /chathub fechada', error);
  });
}

export async function ensureChatHubConnected() {
  const connection = getChatHubConnection();

  if (connection.state === HubConnectionState.Connected) {
    return connection;
  }

  if (chatHubStartPromise) {
    await chatHubStartPromise;
    return connection;
  }

  if (connection.state !== HubConnectionState.Disconnected) {
    return connection;
  }

  chatHubStartPromise ??= connection.start().finally(() => {
    chatHubStartPromise = null;
  });

  await chatHubStartPromise;

  return connection;
}

export function getChatHubDiagnostics() {
  const connection = getChatHubConnection();

  return {
    connectionId: connection.connectionId,
    state: HubConnectionState[connection.state],
  };
}

export async function stopHubConnection(connection: { state: HubConnectionState; stop: () => Promise<void> }) {
  if (connection.state !== HubConnectionState.Disconnected) {
    await connection.stop();
  }
}
