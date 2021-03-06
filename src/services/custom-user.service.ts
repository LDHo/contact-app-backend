import {UserService} from '@loopback/authentication';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import * as crypto from 'crypto';
import {MyUser} from '../models';
import {UserRepository} from '../repositories';



function compare(
  enteredPassword: string,
  storeHashedPassword: string,
  salt: string
): boolean {
  console.log({enteredPassword, storeHashedPassword, salt});
  const pepper = process.env.PEPPER;
  const hashedPassword = crypto.pbkdf2Sync(enteredPassword, salt + pepper, 1000, 64, 'sha512').toString('hex');
  return hashedPassword === storeHashedPassword;
}


export type Credentials = {
  email: string;
  password: string;
}

export class CustomUserService implements UserService<MyUser, Credentials> {


  constructor(
    @repository(UserRepository) public userRepository: UserRepository,
  ) {
  }

  findUserFromUserRepository() {
    this.userRepository.findOne()
  }

  async verifyCredentials(credentials: Credentials): Promise<MyUser> {

    const invalidCredentialsError = 'Invalid email or password.';

    const foundUser = await this.userRepository.findOne({
      where: {email: credentials.email},
    });

    if (!foundUser) {
      // @todo - logging
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }

    const credentialsFound = await this.userRepository.findCredentials(foundUser.id);

    if (!credentialsFound) {
      // @todo - logging
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }

    const passwordMatched = compare(
      credentials.password,
      credentialsFound.password,
      credentialsFound.passwordSalt
    );

    if (!passwordMatched) {
      // @todo - logging
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }
    // @todo -logging
    return foundUser;
  }

  // User --> MyUser
  convertToUserProfile(user: MyUser): UserProfile {
    return {
      [securityId]: user.id as string,
      id: user.id,
      email: user.email,
      lastName: user.lastName,
      firstName: user.firstName
    };
  }
}
