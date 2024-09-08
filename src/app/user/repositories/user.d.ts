export interface IUserRepository {
  save(id: string): Promise<void>;
}
