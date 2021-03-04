import {UserCredentials} from '@loopback/authentication-jwt';
import {Entity, hasOne, model, property} from '@loopback/repository';

@model({
  settings: {
    indexes: {
      uniqueEmail: {
        keys: {
          email: 1
        },
        options: {
          unique: true
        }
      }
    }
  }
})
export class MyUser extends Entity {
  @property({
    type: 'string',
    id: true,
    defaultFn: 'uuidv4'
  })
  id: string;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {
      minLength: 2,
      maxLength: 50
    }
  })
  lastName: string;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {
      minLength: 2,
      maxLength: 50
    }
  })
  firstName: string;

  @property({
    type: 'date',
    required: false,
  })
  birthday: string;

  @property({
    type: 'string',
    required: true,
    index: {
      unique: true
    },
    jsonSchema: {
      format: 'email',
      minLength: 5,
      maxLength: 100,
      uniqueItems: true,
      transform: ['toLowerCase']
    }
  })
  email: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 10,
      maxLength: 30,
      errorMessage: 'Password should be at least 10 to 30 characters'
    }
  })
  password: string;

  @property({
    type: 'string',
    required: true
  })
  passwordSalt: string;

  @property({
    type: 'string',
    required: false
  })
  ssn: string;

  @property({
    type: 'string',
    required: false
  })
  iv: string;

  @hasOne(() => UserCredentials, {keyTo: 'userId'})
  userCredentials: UserCredentials;

  constructor(data?: Partial<MyUser>) {
    super(data);
  }
}

export interface UserRelations {
  // describe navigational properties here
}

export type UserWithRelations = MyUser & UserRelations;
