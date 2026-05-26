import { Character } from './character.types';

export const defaultPortraitImage = '/sessionsPublic/default-portrait.png';

const portraitExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

export function getUploadsBaseUrl() {
  const configuredUrl = import.meta.env.VITE_UPLOADS_URL;

  if (configuredUrl) {
    return configuredUrl.endsWith('/') ? configuredUrl : `${configuredUrl}/`;
  }

  const apiUrl = String(import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

  return `${apiUrl}/`;
}

function canLoadImage(url: string) {
  return new Promise<boolean>((resolve) => {
    const image = new Image();

    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = url;
  });
}

function getCharacterId(character: Character) {
  return Number(character.idPersonagem ?? character.id);
}

function getSessionId(character: Character) {
  return Number(character.idSessao ?? character.sessionId);
}

export async function findCharacterPortraitUrl(character: Character, cacheKey?: number) {
  const characterId = getCharacterId(character);
  const sessionId = getSessionId(character);

  if (!characterId || !sessionId) return defaultPortraitImage;

  const uploadsBaseUrl = getUploadsBaseUrl();
  const fileStem = `_potrait-${characterId}_${sessionId}`;
  const cacheSuffix = cacheKey ? `?v=${cacheKey}` : '';

  for (const extension of portraitExtensions) {
    const imageUrl = `${uploadsBaseUrl}${fileStem}.${extension}${cacheSuffix}`;

    if (await canLoadImage(imageUrl)) {
      return imageUrl;
    }
  }

  return defaultPortraitImage;
}
