export type User = {
  idUsuario: number | string;
  nickname: string;
  email?: string | null;
  senhaHash?: string;
  ativo?: number | string;
  dataCriacao?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type Cadastro = {
  nickname: string;
  password: string;
  email: string;
}

export type AuthResponse = {
  usuario: User | null;
  accessToken: string;
  expiration?: string;
};
