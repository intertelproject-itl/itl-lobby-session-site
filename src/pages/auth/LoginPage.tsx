import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AppShell } from '../../design/components/layout/AppShell';
import { PageContainer } from '../../design/components/layout/PageContainer';
import { Card } from '../../design/components/ui/Card';
import { Input } from '../../design/components/ui/Input';
import { Button } from '../../design/components/ui/Button';
import { useAuth } from '../../scripts/hooks/useAuth';

type FormValues = { email: string; password: string };

export function LoginPage() {
  const { register, handleSubmit } = useForm<FormValues>();
  const { signIn } = useAuth();

  return (
    <AppShell>
      <PageContainer>
        <div style={{ display: 'grid', placeItems: 'center', minHeight: '70vh' }}>
          <Card>
            <h1 className="cy-title login-title-glitch">Login</h1>
            <p className="cy-subtitle">Acesse sua conta e reconecte à sessão.</p>
            <form className="form-grid" style={{ marginTop: '1rem', minWidth: 'min(420px, 85vw)' }} onSubmit={handleSubmit((values) => signIn(values.email, values.password))}>
              <Input placeholder="E-mail" type="email" {...register('email')} />
              <Input placeholder="Senha" type="password" {...register('password')} />
              <Button type="submit">Entrar</Button>
            </form>
            <p style={{ color: 'var(--text-muted)' }}>
              Sem conta? <Link to="/cadastro" style={{ color: 'var(--primary)' }}>Cadastre-se</Link>
            </p>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
