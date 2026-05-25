import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AppShell } from '../../design/components/layout/AppShell';
import { PageContainer } from '../../design/components/layout/PageContainer';
import { Card } from '../../design/components/ui/Card';
import { Input } from '../../design/components/ui/Input';
import { Button } from '../../design/components/ui/Button';
import { useAuth } from '../../scripts/hooks/useAuth';

type FormValues = { nickname: string; email: string; password: string };

export function RegisterPage() {
  const { register, handleSubmit } = useForm<FormValues>();
  const { signUp } = useAuth();

  return (
    <AppShell>
      <PageContainer>
        <div style={{ display: 'grid', placeItems: 'center', minHeight: '70vh' }}>
          <Card>
            <h1 className="cy-title">Cadastro</h1>
            <p className="cy-subtitle">Crie seu agente</p>
            <form className="form-grid" style={{ marginTop: '1rem', minWidth: 'min(420px, 85vw)' }} onSubmit={handleSubmit((values) => signUp(values.nickname, values.email, values.password))}>
              <Input placeholder="Nickname" {...register('nickname')} />
              <Input placeholder="E-mail" type="email" {...register('email')} />
              <Input placeholder="Senha" type="password" {...register('password')} />
              <Button type="submit">Cadastrar</Button>
            </form>
            <p style={{ color: 'var(--text-muted)' }}>
              Já tem conta? <Link to="/login" style={{ color: 'var(--primary)' }}>Entrar</Link>
            </p>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
