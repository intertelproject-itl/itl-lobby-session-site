import { Link } from 'react-router-dom';
import { AppShell } from '../../design/components/layout/AppShell';
import { PageContainer } from '../../design/components/layout/PageContainer';
import { Card } from '../../design/components/ui/Card';
import { Button } from '../../design/components/ui/Button';

export function NotFoundPage() {
  return (
    <AppShell>
      <PageContainer>
        <Card>
          <h1 className="cy-title">404</h1>
          <p className="cy-subtitle">Rota não encontrada.</p>
          <Link to="/sessoes"><Button>Voltar às sessões</Button></Link>
        </Card>
      </PageContainer>
    </AppShell>
  );
}
