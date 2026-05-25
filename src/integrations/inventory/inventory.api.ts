import { apiClient } from '../http/apiClient';
import '../http/authInterceptor';
import { InventoryAsset, InventoryResponse } from './inventory.types';

function getUploadsBaseUrl() {
  const configuredUrl = import.meta.env.VITE_UPLOADS_URL;

  if (configuredUrl) {
    return configuredUrl.endsWith('/') ? configuredUrl : `${configuredUrl}/`;
  }

  const apiUrl = String(import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

  return `${apiUrl}/`;
}

function toImageFileStem(nome: string) {
  return nome.split(' ').join('');
}

function canLoadImage(url: string) {
  return new Promise<boolean>((resolve) => {
    const image = new Image();

    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = url;
  });
}

async function findInventoryImageUrl(nome?: string | null) {
  if (!nome) return undefined;

  const uploadsBaseUrl = getUploadsBaseUrl();
  const fileStem = encodeURIComponent(toImageFileStem(nome));
  const imageUrl = `${uploadsBaseUrl}${fileStem}.jpg`;

  return (await canLoadImage(imageUrl)) ? imageUrl : undefined;
}

export async function getInventoryAssets(_sessionId: number, characterId: number): Promise<InventoryAsset[]> {
  const { data } = await apiClient.get<InventoryResponse[]>('/Inventario', {
    params: { idPersonagem: characterId },
  });

  return Promise.all(
    data.map(async (item, index) => {
      const imageUrl = await findInventoryImageUrl(item.nome);

      return {
        id: `${item.idPersonagem}-${item.nome ?? 'item'}-${index}`,
        idPersonagem: item.idPersonagem,
        nome: item.nome ?? 'Item sem nome',
        descricao: item.descricao,
        tipo: 'ITEM',
        url: imageUrl,
        thumbnailUrl: imageUrl,
      };
    })
  );
}
