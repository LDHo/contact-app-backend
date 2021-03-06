import {model, property} from '@loopback/repository';

@model()
export class RegisterRequestModel {
  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      format: 'email',
      minLength: 5,
      maxLength: 100,
      uniqueItems: true,
      transform: ['toLowerCase']
    },
  })
  email: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      // pattern: '',
      minLength: 8,
      maxLength: 100,
      pattern: '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'
    }
  })
  password: string;
}

@model()
export class ContactFormModel {

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 2,
      maxLength: 50
    }
  })
  lastName: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 2,
      maxLength: 50
    }
  })
  firstName: string;

  @property({
    type: 'string',
    jsonSchema: {
      pattern: '^(?!666|000|9\\d{2})\\d{3}-(?!00)\\d{2}-(?!0{4})\\d{4}$',
      uniqueItems: true
    }
  })
  ssn: string;

  @property({
    type: 'date',
    required: true
  })
  birthday: string;
}

