import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../../design/components/layout/AppShell';
import { PageContainer } from '../../design/components/layout/PageContainer';
import { LoadingScreen } from '../../design/components/ui/LoadingScreen';
import { CharacterSummary } from '../../design/components/character/CharacterSummary';
import { AttributeGrid } from '../../design/components/character/AttributeGrid';
import { SkillList } from '../../design/components/character/SkillList';
import { DiceResult } from '../../design/components/ui/DiceResult';
import { Button } from '../../design/components/ui/Button';
import { useSessionAccess } from '../../scripts/hooks/useSessionAccess';
import { useDiceRoll } from '../../scripts/hooks/useDiceRoll';

export function CharacterSheetPage() {
  const { sessionId } = useParams();
  const numericSessionId = Number(sessionId);
  const { loading, character } = useSessionAccess(numericSessionId);
  const { result, roll } = useDiceRoll();

  const attributes = useMemo(() => character?.atributos ?? {}, [character]);
  const skills = useMemo(() => character?.pericias ?? {}, [character]);

  if (loading) return <LoadingScreen label="Carregando ficha do personagem..." />;
  if (!character) return <LoadingScreen label="Nenhum personagem vinculado a esta sessão." />;

  return (
    <AppShell>
      <PageContainer>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <CharacterSummary character={character} />
          <DiceResult result={result} />
          <AttributeGrid
            attributes={attributes}
            onRoll={(key, value) => roll({ characterId: character.id, tipo: 'ATRIBUTO', referencia: key, valorBase: value })}
          />
          <SkillList
            skills={skills}
            onRoll={(key, value) => roll({ characterId: character.id, tipo: 'PERICIA', referencia: key, valorBase: value })}
          />
          <Link to={`/sessoes/${numericSessionId}/inventario`}>
            <Button>Acessar inventário</Button>
          </Link>
        </div>
      </PageContainer>
    </AppShell>
  );
}
