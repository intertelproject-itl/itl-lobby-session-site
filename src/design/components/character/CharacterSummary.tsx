import { ChangeEvent, useEffect, useState } from 'react';
import { CharacterDetails } from '../../../integrations/character/character.types';
import { findCharacterPortraitUrl, defaultPortraitImage } from '../../../integrations/character/portrait';
import { updateCharacterPortrait } from '../../../integrations/character/character.api';
import { Card } from '../ui/Card';

const acceptedPortraitTypes = '.jpg,.jpeg,.png,.webp,.gif';
const maxPortraitSizeBytes = 500 * 1024;
const maxPortraitWidth = 1080;
const maxPortraitHeight = 1920;

function getImageSize(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Imagem invalida.'));
    };

    image.src = objectUrl;
  });
}

function valueOrFallback(value: unknown) {
  return value === null || value === undefined || value === '' ? 'Nao informado' : String(value);
}

const fields: Array<{ label: string; key: keyof CharacterDetails }> = [
  { label: 'Idade', key: 'idade' },
  { label: 'Genero', key: 'genero' },
  { label: 'Origem', key: 'origem' },
  { label: 'Nivel Reputacao', key: 'nivelReputacao' },
  { label: 'Dinheiro', key: 'dinheiro' },
  { label: 'Data Criacao', key: 'dataCriacao' },
];

export function CharacterSummary({
  character,
  allowPortraitUpload = false,
  portraitVersion = 0,
  onPortraitUpdated,
}: {
  character: CharacterDetails;
  allowPortraitUpload?: boolean;
  portraitVersion?: number;
  onPortraitUpdated?: () => void;
}) {
  const background = character.conceito;
  const [portraitSource, setPortraitSource] = useState(defaultPortraitImage);
  const [portraitError, setPortraitError] = useState('');

  async function changePortrait(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setPortraitError('');

    try {
      if (file.size > maxPortraitSizeBytes) {
        setPortraitError('A imagem deve ter no maximo 500kb.');
        return;
      }

      const imageSize = await getImageSize(file);

      if (imageSize.width > maxPortraitWidth || imageSize.height > maxPortraitHeight) {
        setPortraitError('A imagem deve ter resolucao maxima de 1080 x 1920.');
        return;
      }

      await updateCharacterPortrait(Number(character.idPersonagem ?? character.id), Number(character.idSessao ?? character.sessionId), file);
      const nextVersion = Date.now();
      setPortraitSource(await findCharacterPortraitUrl(character, nextVersion));
      onPortraitUpdated?.();
    } catch {
      setPortraitError('Nao foi possivel atualizar o retrato.');
    } finally {
      event.target.value = '';
    }
  }

  useEffect(() => {
    let active = true;

    async function refreshPortrait() {
      const portraitUrl = await findCharacterPortraitUrl(character, portraitVersion);

      if (active) {
        setPortraitSource(portraitUrl);
      }
    }

    refreshPortrait();

    return () => {
      active = false;
    };
  }, [character, portraitVersion]);

  return (
    <Card>
      <div className="character-summary-layout">
        <div className="character-portrait-box">
          <img src={portraitSource} alt={`Retrato de ${valueOrFallback(character.nome)}`} />
          {allowPortraitUpload ? (
            <label className="character-portrait-upload">
              <input type="file" accept={acceptedPortraitTypes} onChange={changePortrait} />
              <span>Alterar retrato</span>
              <small>JPG, PNG, WEBP ou GIF. Max 500kb, ate 1080 x 1920.</small>
            </label>
          ) : null}
          {portraitError ? <p className="auth-error-message">{portraitError}</p> : null}
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
