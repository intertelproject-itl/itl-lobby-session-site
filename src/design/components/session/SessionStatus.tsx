import { Badge } from '../ui/Badge';

export function SessionStatus({ online }: { online: boolean }) {
  return <Badge>{online ? 'Sessão ativa' : 'Sessão indisponível'}</Badge>;
}
