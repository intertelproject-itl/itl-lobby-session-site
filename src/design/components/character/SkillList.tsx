import { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { SkillSheetRow, SkillSheetValues } from '../../../integrations/character/character.types';

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
  skills: SkillSheetValues;
  editable?: boolean;
  onAdjust?: (key: string, delta: number) => void;
  onUpdate?: () => void;
  updating?: boolean;
  onRoll: (key: string, value: number) => void;
}) {
  const [filter, setFilter] = useState('');
  const skillRows = useMemo<SkillSheetRow[]>(() => {
    if (Array.isArray(skills)) return skills;

    return Object.entries(skills).map(([key, value]) => ({
      id: key,
      key,
      baseKey: key,
      categoryKey: '',
      label: capitalizeLabel(key),
      category: '-',
      base: value,
      nivel: 0,
      editable,
      nivelKey: key,
      categoryFields: {},
    }));
  }, [editable, skills]);
  const canUpdate = skillRows.some((skill) => skill.editable);
  const filterReady = filter.trim().length >= 3;
  const filteredSkills = useMemo(() => {
    const normalizedFilter = filter.trim().toLowerCase();

    if (normalizedFilter.length < 3) return [];

    return skillRows.filter((skill) =>
      `${skill.label} ${skill.key} ${skill.category}`.toLowerCase().includes(normalizedFilter)
    );
  }, [filter, skillRows]);

  return (
    <Card>
      <h3 className="cy-title">Pericias</h3>
      <Input
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder="Digite ao menos 3 letras para filtrar"
        style={{ margin: '0.75rem 0 0' }}
      />
      {!filterReady ? <p className="sheet-filter-hint">Digite pelo menos 3 letras para listar as pericias.</p> : null}
      <div className="sheet-table" role="table" aria-label="Pericias">
        <div className="sheet-row sheet-row-skill sheet-row-header" role="row">
          <strong>Pericia</strong>
          <strong>Grupo</strong>
          <strong>Base</strong>
          <strong>Nivel</strong>
          <strong>Editavel</strong>
          <strong aria-hidden="true" />
          <strong aria-hidden="true" />
        </div>
        {filteredSkills.map((skill) => {
          const rollValue = skill.base + skill.nivel;

          return (
          <div className="sheet-row sheet-row-skill" key={skill.id} role="row">
            <span>{skill.label}</span>
            <span>{skill.category}</span>
            <strong>{skill.base}</strong>
            <strong style={{ color: 'var(--primary)' }}>{skill.nivel}</strong>
            <span>{skill.editable ? 'Sim' : 'Nao'}</span>
            {skill.editable ? (
              <span className="sheet-adjust-controls">
                <Button type="button" title={`Diminuir ${skill.label}`} onClick={() => onAdjust?.(skill.id, -1)}>
                  -
                </Button>
                <Button type="button" title={`Aumentar ${skill.label}`} onClick={() => onAdjust?.(skill.id, 1)}>
                  +
                </Button>
              </span>
            ) : <span />}
            <Button
              type="button"
              className="sheet-roll-button"
              aria-label={`Rolar ${skill.label}`}
              title={`Rolar ${skill.label}`}
              onClick={() => onRoll(skill.label, rollValue)}
            >
              <span className="sheet-roll-icon" aria-hidden="true" />
            </Button>
          </div>
          );
        })}
        {filterReady && filteredSkills.length === 0 ? (
          <div className="sheet-row sheet-row-skill" role="row">
            <span>Nenhuma pericia encontrada.</span>
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        ) : null}
      </div>
      {canUpdate ? (
        <Button type="button" disabled={updating} style={{ marginTop: '0.75rem' }} onClick={onUpdate}>
          {updating ? 'Atualizando...' : 'Atualizar'}
        </Button>
      ) : null}
    </Card>
  );
}
