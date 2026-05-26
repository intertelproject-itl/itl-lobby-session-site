import { useApiLoadingStore } from '../../../scripts/store/api-loading.store';
import { Modal } from './Modal';

export function ApiLoadingModal() {
  const isLoading = useApiLoadingStore((state) => state.isLoading);

  if (!isLoading) return null;

  return (
    <Modal maxWidth={360}>
      <div className="auth-loading-modal">
        <span className="auth-loading-spinner" aria-hidden="true" />
        <h2 className="cy-title">Carregando</h2>
        <p className="cy-subtitle">Aguardando retorno da API...</p>
      </div>
    </Modal>
  );
}
