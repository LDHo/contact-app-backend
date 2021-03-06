// Copyright IBM Corp. 2020. All Rights Reserved.
// Node module: @loopback/authentication-jwt
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {inject} from '@loopback/core';
import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {MyUserCredentials, UserCredentialsRelations} from '../models/user-credentials.model';

export class MyUserCredentialsRepository extends DefaultCrudRepository<
  MyUserCredentials,
  typeof MyUserCredentials.prototype.id,
  UserCredentialsRelations
> {
  constructor(
    @inject(`datasources.db`)
    dataSource: juggler.DataSource,
  ) {
    super(MyUserCredentials, dataSource);
  }
}
