import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../design/components/layout/AppShell';
import { PageContainer } from '../../design/components/layout/PageContainer';
import { Card } from '../../design/components/ui/Card';
import { Input } from '../../design/components/ui/Input';
import { Select } from '../../design/components/ui/Select';
import { Button } from '../../design/components/ui/Button';
import { createCharacter, createCharacterAttributes, createCharacterSkills } from '../../integrations/character/character.api';
import { useAuthStore } from '../../scripts/store/auth.store';

type FormValues = {
  usuarioId: number;
  sessionID: number;
  nome: string;
  papel: string;
  origem: string;
  historia: string;
  dinheiro: string;
  idade: string;
  genero: string;
  humanidade: string;    
};

const defaultAttributes = {
  inteligencia: 6,
  reflexos: 6,
  destreza: 6,
  tecnica: 6,
  frieza: 6,
  vontade: 6,
  sorte: 6,
  movimento: 6,
  corpo: 6,
  empatia: 6,
};

const defaultSkills = {
  pontaria: 6,
  furtividade: 6,
  percepcao: 6,
  atletismo: 6,
};

export function CharacterCreationPage() {
  const user = useAuthStore((state) => state.user);
  const userId = user?.idUsuario || 0;
  const { sessionId } = useParams();  
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<FormValues>();
  const numericSessionId = Number(sessionId);
  const usuarioId = Number(userId);

  async function CriarPersonagem(values: FormValues) {
    console.log('onSubmit - form values', values);
    values = { ...values, usuarioId, sessionID: numericSessionId };
    await createCharacter(values);
    //await createCharacterAttributes(character.id, defaultAttributes);
    //await createCharacterSkills(character.id, defaultSkills);
    navigate(`/sessoes/${numericSessionId}`);
  }

  return (
    <AppShell>
      <PageContainer>
        <Card>
          <h1 className="cy-title">Criar personagem</h1>
          <p className="cy-subtitle">Base inicial pronta para ligar com os formulários completos de Cyberpunk RED.</p>
          <form className="form-grid cols-2" style={{ marginTop: '1rem' }} >
            <Input placeholder="Nome do personagem" {...register('nome')} />
            <Select {...register('papel')} defaultValue="solo">
              <option value="solo">Solo</option>
              <option value="netrunner">Netrunner</option>
              <option value="tech">Tech</option>
              <option value="media">Media</option>
              <option value="nomad">Nomad</option>
            </Select>
            <Input placeholder="Origem" {...register('origem')} />
            <Input placeholder="Dinheiro" {...register('dinheiro')} />
            <Input placeholder="Idade" {...register('idade')} />
            <Select {...register('genero')} defaultValue="Prefiro não dizer">
              <option value="Prefiro não dizer">Prefiro não dizer</option>   
              <option value="Masc">Masculino</option>
              <option value="Fem">Feminino</option>                         
              <option value="Outro">Outro</option>
            </Select>
            <Input placeholder="Humanidade" {...register('humanidade')} />

          </form>
        </Card>
        <Card>
          <form style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ width: '100%', flex: 1, display: 'flex' }}
            >
              <textarea
                className="cyber-textarea"
                placeholder="História"
                {...register('historia')}
                style={{
                  width: '100%',
                  minHeight: '220px',
                  flex: 1,
                  resize: 'none',
                  background: '#101010',
                  color: '#F5F5F5',
                  border: '1px solid #27272A',
                  borderLeft: '3px solid #FF3B30',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ alignSelf: 'end', marginTop: '1rem' }}>
              <Button type="submit" onClick={handleSubmit(CriarPersonagem)}>
                Criar e vincular
              </Button>
            </div>
          </form>
        </Card>
      </PageContainer>
    </AppShell>
  );
}
