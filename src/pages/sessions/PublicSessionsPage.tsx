import { AppShell } from '../../design/components/layout/AppShell';
import { PageContainer } from '../../design/components/layout/PageContainer';
import { LoadingScreen } from '../../design/components/ui/LoadingScreen';
import { SessionCard } from '../../design/components/session/SessionCard';
import { useSessionList } from '../../scripts/hooks/useSessionList';

export function PublicSessionsPage() {
  const { sessions, loading } = useSessionList();

  if (loading) return <LoadingScreen label="Buscando sessões públicas..." />;

  return (
    <AppShell>
      <PageContainer>
        <header style={{ marginBottom: '1rem' }}>
          <h1 className="cy-title">Sessões públicas</h1>
          <p className="cy-subtitle">Entre em uma sessão ativa e retome seu personagem automaticamente.</p>
        </header>
        <div className="section-grid">
          {sessions.map((session) => <SessionCard key={session.idSessao} session={session} />)}
        </div>
      </PageContainer>
    </AppShell>
  );
}
