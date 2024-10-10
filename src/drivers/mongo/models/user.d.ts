export interface IUserDocument {
  _id: string;
  code: string | undefined;
  email: string;
  name: string;
  password: string;
  username: string;
  validated: boolean;
}
