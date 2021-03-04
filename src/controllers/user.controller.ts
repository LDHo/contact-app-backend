import {authenticate, TokenService} from '@loopback/authentication';
import {
  Credentials,
  RefreshtokenService,
  RefreshTokenServiceBindings,

  TokenServiceBindings,

  UserServiceBindings
} from '@loopback/authentication-jwt';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  get,
  getModelSchemaRef, HttpErrors,
  param,
  patch,
  post,
  requestBody,
  response,
  SchemaObject
} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {MyUser} from '../models';
import {UserRepository} from '../repositories';
import {CryptoService, EncryptedData} from '../services/crypto.service';
import {CustomUserService} from '../services/custom-user.service';

type RefreshGrant = {
  refreshToken: string;
};

// Describes the schema of grant object
const RefreshGrantSchema: SchemaObject = {
  type: 'object',
  required: ['refreshToken'],
  properties: {
    refreshToken: {
      type: 'string',
    },
  },
};

// Describes the request body of grant object
const RefreshGrantRequestBody = {
  description: 'Reissuing Acess Token',
  required: true,
  content: {
    'application/json': {schema: RefreshGrantSchema},
  },
};

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

export class UserController {
  constructor(
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: CustomUserService,
    @inject(SecurityBindings.USER, {optional: true})
    public user: UserProfile,
    @repository(UserRepository)
    protected userRepository: UserRepository,
    @inject(RefreshTokenServiceBindings.REFRESH_TOKEN_SERVICE)
    public refreshService: RefreshtokenService,
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
          schema: getModelSchemaRef(MyUser, {
            exclude: [
              'id',
              'passwordSalt',
              'lastName',
              'firstName',
              'birthday',
              'ssn',
              'iv'
            ]
          })
        },
      },
    })
    user: MyUser,
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
    const modifiedUser: MyUser = JSON.parse(JSON.stringify(user));
    modifiedUser['password'] = hashedData;
    modifiedUser['passwordSalt'] = salt;
    const savedUser = await this.userRepository.create(modifiedUser);
    await this.userRepository.userCredentials(savedUser.id).create({
      password: hashedData
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
  @patch('/users/update/{id}')
  @response(204, {
    description: 'User PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(MyUser, {
            partial: true,
            exclude: [
              'id',
              'email',
              'password',
              'passwordSalt',
              'iv'
            ]
          }),
        },
      },
    })
    user: MyUser,
  ): Promise<void> {
    if (user.ssn) {
      const {iv, encryptedData} = CryptoService.encrypt(user.ssn);
      user['ssn'] = encryptedData;
      user['iv'] = iv;
    }
    const response = await this.userRepository.updateById(id, user);
    return response;
  }
}
