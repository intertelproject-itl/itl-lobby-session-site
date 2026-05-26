import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

function capitalizeLabel(label: string) {
  const withSpaces = label.replace(/([A-Z])/g, ' $1').trim();
  return withSpaces ? withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1) : withSpaces;
}

export function AttributeGrid({
  attributes,
  editable = false,
  onAdjust,
  onUpdate,
  updating = false,
  onRoll,
}: {
  attributes: Record<string, number>;
  editable?: boolean;
  onAdjust?: (key: string, delta: number) => void;
  onUpdate?: () => void;
  updating?: boolean;
  onRoll: (key: string, value: number) => void;
}) {
  return (
    <Card>
      <h3 className="cy-title">Atributos</h3>
      <div className="sheet-table" role="table" aria-label="Atributos">
        <div className={`sheet-row ${editable ? 'sheet-row-editable' : ''} sheet-row-header`} role="row">
          <strong>Atributo</strong>
          <strong>Modificador</strong>
          {editable ? <strong aria-hidden="true" /> : null}
          <strong aria-hidden="true" />
        </div>
        {Object.entries(attributes).map(([key, value]) => (
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
      </div>
      {editable ? (
        <Button type="button" disabled={updating} style={{ marginTop: '0.75rem' }} onClick={onUpdate}>
          {updating ? 'Atualizando...' : 'Atualizar'}
        </Button>
      ) : null}
    </Card>
  );
}
