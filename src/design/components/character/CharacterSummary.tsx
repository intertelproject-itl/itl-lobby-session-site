import { CharacterDetails } from '../../../integrations/character/character.types';
import { Card } from '../ui/Card';

const defaultPortraitImage = '/sessionsPublic/default-portrait.png';

function valueOrFallback(value: unknown) {
  return value === null || value === undefined || value === '' ? 'Nao informado' : String(value);
}

function toPortraitSource(character: CharacterDetails) {
  const imageValue = character.fotoBase64 ?? character.imagemBase64 ?? character.portraitBase64 ?? character.foto ?? character.imagem;

  if (!imageValue) return defaultPortraitImage;
  if (imageValue.startsWith('data:image')) return imageValue;

  return `data:image/png;base64,${imageValue}`;
}

const fields: Array<{ label: string; key: keyof CharacterDetails }> = [
  { label: 'Idade', key: 'idade' },
  { label: 'Genero', key: 'genero' },
  { label: 'Origem', key: 'origem' },
  { label: 'Nivel Reputacao', key: 'nivelReputacao' },
  { label: 'Humanidade Atual', key: 'humanidadeAtual' },
  { label: 'Humanidade Maxima', key: 'humanidadeMaxima' },
  { label: 'Dinheiro', key: 'dinheiro' },
  { label: 'Data Criacao', key: 'dataCriacao' },
];

export function CharacterSummary({ character }: { character: CharacterDetails }) {
  const background = character.conceito;
  const portraitSource = toPortraitSource(character);

  return (
    <Card>
      <div className="character-summary-layout">
        <div className="character-portrait-box">
          <img src={portraitSource} alt={`Retrato de ${valueOrFallback(character.nome)}`} />
        </div>

        <div>
          <div className="character-highlight">
            <div>
              <span>Nome</span>
              <strong>{valueOrFallback(character.nome)}</strong>
            </div>
            <div>
              <span>Funcao</span>
              <strong>{valueOrFallback(character.papel)}</strong>
            </div>
          </div>

          <div className="basic-info-grid">
            {fields.map(({ label, key }) => (
              <div key={key}>
                <span>{label}</span>
                <strong>{valueOrFallback(character[key])}</strong>
              </div>
            ))}
          </div>

          <div className="background-box">
            <span>Background</span>
            <p>{valueOrFallback(background)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
