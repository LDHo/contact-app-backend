import {Entity, hasOne, model, property} from '@loopback/repository';
import {MyUserCredentials} from './user-credentials.model';

@model({
  name: 'user',
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
    defaultFn: 'uuidv4',
    mysql: {
      columnName: 'id',
      dataType: 'varchar',
      dataLength: 36,
      nullable: 'N'
    }
  })
  id: string;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {
      minLength: 2,
      maxLength: 50
    },
    mysql: {
      columnName: 'last_name',
      dataType: 'varchar',
      dataLength: 50,
      nullable: 'Y'
    }
  })
  lastName?: string;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {
      minLength: 2,
      maxLength: 50
    },
    mysql: {
      columnName: 'first_name',
      dataType: 'varchar',
      dataLength: 50,
      nullable: 'Y'
    }
  })
  firstName?: string;

  @property({
    type: 'date',
    required: false,
    mysql: {
      columnName: 'birthday',
      nullable: 'Y'
    }
  })
  birthday?: string;

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
    },
    mysql: {
      columnName: 'email',
      dataType: 'varchar',
      dataLength: 50,
      nullable: 'N'
    }
  })
  email: string;

  @property({
    type: 'string',
    required: false,
    mysql: {
      columnName: 'ssn',
      nullable: 'Y'
    }
  })
  ssn?: string;

  // @property({
  //   type: 'string',
  //   required: false,
  //   mysql: {
  //     columnName: 'iv',
  //     nullable: 'Y'
  //   }
  // })
  // iv?: string;

  @hasOne(() => MyUserCredentials, {keyTo: 'userId'})
  userCredentials: MyUserCredentials;

  constructor(data?: Partial<MyUser>) {
    super(data);
  }
}

export interface UserRelations {
  // describe navigational properties here
}

export type UserWithRelations = MyUser & UserRelations;
