import {authenticate, TokenService} from '@loopback/authentication';
import {
  Credentials,
  TokenServiceBindings,
  UserServiceBindings
} from '@loopback/authentication-jwt';
import {inject, intercept} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  get,
  HttpErrors,

  patch,
  post,
  requestBody,
  response,
  SchemaObject
} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {MyUser} from '../models';
import {ContactFormModel, RegisterRequestModel} from '../models/custom.request.model';
import {UserRepository} from '../repositories';
import {CryptoService, EncryptedData} from '../services/crypto.service';
import {CustomUserService} from '../services/custom-user.service';
import {log} from '../shared/logger';

const CredentialsSchema: SchemaObject = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
    },
    password: {
      type: 'string',
      // minLength: 8,
    },
  },
};

export const CredentialsRequestBody = {
  description: 'The input of login function',
  required: true,
  content: {
    'application/json': {schema: CredentialsSchema},
  },
};

@intercept(log)
export class UserController {

  constructor(
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: CustomUserService,
    @inject(SecurityBindings.USER, {optional: true})
    public user: UserProfile,
    @repository(UserRepository)
    protected userRepository: UserRepository
  ) { }

  @post('/users/register', {
    responses: {
      description: 'User model instance',
      content: {'application/json': {schema: MyUser}}
    }
  })
  async register(
    @requestBody({
      content: {
        'application/json': {
          schema: {'x-ts-type': RegisterRequestModel}
        },
      },
    })
    user: RegisterRequestModel,
  ) {
    const foundUser = await this.userRepository.findOne({
      where: {
        email: user.email
      }
    });
    if (foundUser) {
      const emailUsed = 'Email has already been used';
      throw new HttpErrors.BadRequest(emailUsed);
    }

    const userPassword = user.password;
    let {salt, hashedData} = CryptoService.hashingData(userPassword, process.env.PEPPER as string);

    // create a record with only email
    const modifiedUser = JSON.parse(JSON.stringify(user));

    // password will be stored in the user_credentials
    delete modifiedUser['password'];

    const savedUser = await this.userRepository.create(modifiedUser);
    await this.userRepository.userCredentials(savedUser.id).create({
      password: hashedData,
      passwordSalt: salt
    });
    return savedUser;
  }

  @post('/users/login', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async login(
    @requestBody(CredentialsRequestBody) credentials: Credentials
  ): Promise<{token: string}> {
    const user = await this.userService.verifyCredentials(credentials);
    const userProfile = this.userService.convertToUserProfile(user);
    const token = await this.jwtService.generateToken(userProfile)
    return {token};
  }

  @authenticate('jwt')
  @get('/users/profile', {
    responses: {
      '200': {
        description: 'Return current user',
        content: {
          'application/json': {
            schema: {
              type: 'string',
            },
          },
        },
      },
    },
  })
  async whoAmI(
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<MyUser> {
    const userId = currentUserProfile[securityId];
    const foundUser = await this.userRepository.findById(userId);

    if (!foundUser) {
      // @todo - logging
      throw new HttpErrors.Unauthorized();
    }

    const modifiedUser = JSON.parse(JSON.stringify(foundUser));
    delete modifiedUser['password'];
    delete modifiedUser['passwordSalt'];
    if (foundUser.ssn && foundUser.iv) {
      const encryptedData: EncryptedData = {
        data: foundUser.ssn,
        iv: foundUser.iv
      };
      modifiedUser['ssn'] = CryptoService.decrypt(encryptedData);
    }
    return modifiedUser;
  }

  @authenticate('jwt')
  @patch('/users/update')
  @response(204, {
    description: 'User PATCH success',
  })
  async updateById(
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
    @requestBody({
      content: {
        'application/json': {schema: {'x-ts-type': ContactFormModel}},
      },
    })
    user: ContactFormModel,
  ): Promise<void> {
    const {iv, encryptedData} = CryptoService.encrypt(user.ssn);
    user['ssn'] = encryptedData;
    user['iv'] = iv;
    const userId = currentUserProfile[securityId];
    const response = await this.userRepository.updateById(userId, user);
    return response;
  }
}
