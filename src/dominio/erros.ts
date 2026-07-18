export class ErroDominio extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = new.target.name;
  }
}

export class DadosInvalidos extends ErroDominio {}

export class EmailJaCadastrado extends ErroDominio {
  constructor(email: string) {
    super(`E-mail já cadastrado: ${email}`);
  }
}

export class CredenciaisInvalidas extends ErroDominio {
  constructor() {
    super("E-mail ou senha inválidos");
  }
}

export class TokenInvalido extends ErroDominio {
  constructor() {
    super("Token de autenticação inválido ou expirado");
  }
}
