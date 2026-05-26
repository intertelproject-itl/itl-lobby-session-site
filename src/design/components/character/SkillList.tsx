import { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

function capitalizeLabel(label: string) {
  const withSpaces = label.replace(/([A-Z])/g, ' $1').trim();
  return withSpaces ? withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1) : withSpaces;
}

export function SkillList({
  skills,
  editable = false,
  onAdjust,
  onUpdate,
  updating = false,
  onRoll,
}: {
  skills: Record<string, number>;
  editable?: boolean;
  onAdjust?: (key: string, delta: number) => void;
  onUpdate?: () => void;
  updating?: boolean;
  onRoll: (key: string, value: number) => void;
}) {
  const [filter, setFilter] = useState('');
  const filteredSkills = useMemo(() => {
    const normalizedFilter = filter.trim().toLowerCase();

    if (!normalizedFilter) return Object.entries(skills);

    return Object.entries(skills).filter(([key]) => key.toLowerCase().includes(normalizedFilter));
  }, [filter, skills]);

  return (
    <Card>
      <h3 className="cy-title">Pericias</h3>
      <Input
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder="Filtrar pericia"
        style={{ margin: '0.75rem 0 0' }}
      />
      <div className="sheet-table" role="table" aria-label="Pericias">
        <div className={`sheet-row ${editable ? 'sheet-row-editable' : ''} sheet-row-header`} role="row">
          <strong>Pericia</strong>
          <strong>Modificador</strong>
          {editable ? <strong aria-hidden="true" /> : null}
          <strong aria-hidden="true" />
        </div>
        {filteredSkills.map(([key, value]) => (
          <div className={`sheet-row ${editable ? 'sheet-row-editable' : ''}`} key={key} role="row">
            <span>{capitalizeLabel(key)}</span>
            <strong style={{ color: 'var(--primary)' }}>{value}</strong>
            {editable ? (
              <span className="sheet-adjust-controls">
                <Button type="button" title={`Diminuir ${capitalizeLabel(key)}`} onClick={() => onAdjust?.(key, -1)}>
                  -
                </Button>
                <Button type="button" title={`Aumentar ${capitalizeLabel(key)}`} onClick={() => onAdjust?.(key, 1)}>
                  +
                </Button>
              </span>
            ) : null}
            <Button
              type="button"
              className="sheet-roll-button"
              aria-label={`Rolar ${capitalizeLabel(key)}`}
              title={`Rolar ${capitalizeLabel(key)}`}
              onClick={() => onRoll(key, value)}
            >
              <span className="sheet-roll-icon" aria-hidden="true" />
            </Button>
          </div>
        ))}
        {filteredSkills.length === 0 ? (
          <div className={`sheet-row ${editable ? 'sheet-row-editable' : ''}`} role="row">
            <span>Nenhuma pericia encontrada.</span>
            <span />
            {editable ? <span /> : null}
            <span />
          </div>
        ) : null}
      </div>
      {editable ? (
        <Button type="button" disabled={updating} style={{ marginTop: '0.75rem' }} onClick={onUpdate}>
          {updating ? 'Atualizando...' : 'Atualizar'}
        </Button>
      ) : null}
    </Card>
  );
}
