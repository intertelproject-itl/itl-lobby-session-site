import { Link } from 'react-router-dom';
import { PublicSession } from '../../../integrations/sessions/sessions.types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export function SessionCard({ session }: { session: PublicSession }) {
  const briefing = session.Briefing ?? session.briefing ?? session.resumo;

  return (
    <Card className="public-session-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
        <h3 className="cy-title" style={{ marginBottom: 0 }}>{session.titulo}</h3>
        <Badge>{session.idSessao}</Badge>
      </div>
      <p style={{ color: 'var(--text-muted)' }}>{briefing}</p>
      <small style={{ display: 'block', marginBottom: '1rem', color: 'var(--text-muted)' }}>Mestre: {session.mestre}</small>
      <Link to={`/sessoes/${session.idSessao}`}>
        <Button>Acessar sessão</Button>
      </Link>
    </Card>
  );
}
