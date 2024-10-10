import type { CreateUserController } from 'app/user';
import { container, userTokens } from 'components';

await container.load();

const createUserController = await container.get<CreateUserController>(
  userTokens.controllers.createUserController
);

await createUserController.execute({
  email: 'with.mask@tutanota.com',
  name: 'With MaskWith MaskWith MaskWith MaskWith MaskWith MaskWith MaskWith MaskWith MaskWith Mask',
  password: 'LOL'
});
