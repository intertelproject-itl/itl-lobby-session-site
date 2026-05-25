import { useNavigate } from 'react-router-dom';
import { login, register } from '../../integrations/auth/auth.api';
import { useAuthStore } from '../store/auth.store';

export function useAuth() {
  const navigate = useNavigate();
  const signInStore = useAuthStore((state) => state.signIn);

  async function signIn(email: string, password: string) {
    const response = await login({ email, password });
    if (!response.usuario) {
      throw new Error('Login sem usuario retornado pela API.');
    }
    signInStore(response.usuario, response.accessToken);
    navigate('/sessoes');
  }

  async function signUp(nickname: string, email: string, password: string) {
    const response = await register({ nickname, email, password });
    if (!response.usuario) {
      throw new Error('Cadastro sem usuario retornado pela API.');
    }
    signInStore(response.usuario, response.accessToken);
    navigate('/sessoes');
  }

  return { signIn, signUp };
}
