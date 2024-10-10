export interface ICreateUserControllerOptions {
  email: string;
  name: string;

  password: string;
}

export interface ICreateUserControllerDTO {
  session: string;
}
