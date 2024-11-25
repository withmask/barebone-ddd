import {
  EmailUnavailableException,
  isValidEmail,
  NameValueObject
} from 'app/user';
import { Container, userTokens } from 'components';
import { ApplicationEventManager, Result, Validator } from 'shared';

import type {
  ICreateUserControllerDTO,
  ICreateUserControllerOptions,
  IUserCreatedEvent,
  IUserRepository,
  UserFactory
} from 'app/user';

import type { TGetNextEvent, TResult } from 'shared';

@Container.injectable()
export class CreateUserController {
  private _eventEmitter!: TGetNextEvent<IUserCreatedEvent>;

  public constructor(
    @Container.inject(userTokens.factories.userFactory)
    private readonly _userFactory: UserFactory,
    @Container.inject(userTokens.repositories.userRepository)
    private readonly _userRepository: IUserRepository
  ) {}

  public async execute(
    options: ICreateUserControllerOptions
  ): Promise<TResult<ICreateUserControllerDTO>> {
    const getNextEventResult = await this._eventEmitter.next();

    if (getNextEventResult.failed()) return getNextEventResult;

    if (getNextEventResult.void()) console.log('NO EVENT');
    else console.log(getNextEventResult.value());

    process.exit(1) as null;

    const validateDTOResult =
      Validator.validateDTO<ICreateUserControllerOptions>(options).valueObjects(
        {
          name: NameValueObject
        }
      );

    const validatePropertiesResult =
      await Validator.validateDTO<ICreateUserControllerOptions>(
        options
      ).properties(
        {
          email: {
            type: 'string',
            nullable: false,
            optional: false,
            rules: [
              isValidEmail,
              // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
              async (value, controller) => {
                const checkEmailAvailabilityResult =
                  await controller._userRepository.emailAvailable(value);

                if (checkEmailAvailabilityResult.failed())
                  return checkEmailAvailabilityResult;

                const isAvailable = checkEmailAvailabilityResult.value();

                if (!isAvailable)
                  return Result.fail(new EmailUnavailableException());

                return Result.done();
              }
            ]
          }
        },
        this
      );

    const validationResult = Result.combined(
      validateDTOResult,
      validatePropertiesResult
    );

    if (validationResult.failed()) return validationResult;

    const valueObjects = validateDTOResult.value();

    const createNewOneResult = await this._userFactory.createNewOne({
      properties: {
        email: options.email
      },
      valueObjects: {
        name: valueObjects.name
      }
    });

    if (createNewOneResult.failed()) return createNewOneResult;

    const user = createNewOneResult.value();

    // const saveUserResult = await this._userRepository.save(user);

    // if (saveUserResult.failed()) return saveUserResult;

    const emitEventResult =
      await ApplicationEventManager.emit<IUserCreatedEvent>('userCreated', {
        id: user.id
      });

    if (emitEventResult.failed()) return emitEventResult;

    const dto: ICreateUserControllerDTO = {
      session: 'login-session'
    };

    return Result.ok(dto);
  }
}
