import { RollResponse } from '../../../integrations/rolls/rolls.api';
import { Card } from './Card';

export function DiceResult({ result }: { result: RollResponse | null }) {
  if (!result) return null;

  return (
    <Card>
      <h3 className="cy-title">Ultima rolagem</h3>
      <p className="cy-subtitle">{result.tipo} - {result.referencia}</p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        <strong>D20: {result.d20}</strong>
        <strong>Base: {result.valorBase}</strong>
        <strong>Mod: {result.modificador}</strong>
        <strong style={{ color: 'var(--primary)' }}>Total: {result.total}</strong>
      </div>
    </Card>
  );
}
