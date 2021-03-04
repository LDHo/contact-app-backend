import {UserCredentials, UserCredentialsRepository, UserServiceBindings} from '@loopback/authentication-jwt';
import {inject} from '@loopback/core';
import {DefaultCrudRepository, Getter, HasOneRepositoryFactory, juggler, repository} from '@loopback/repository';
import {MyUser, UserRelations} from '../models';


export class UserRepository extends DefaultCrudRepository<
  MyUser,
  typeof MyUser.prototype.id,
  UserRelations
  > {

  public readonly userCredentials: HasOneRepositoryFactory<
    UserCredentials,
    typeof MyUser.prototype.id
  >

  constructor(
    @inject(`datasources.${UserServiceBindings.DATASOURCE_NAME}`) dataSource: juggler.DataSource,
    @repository.getter('UserCredentialsRepository')
    protected userCredentialsRepositoryGetter: Getter<UserCredentialsRepository>
  ) {
    super(MyUser, dataSource);
    this.userCredentials = this.createHasOneRepositoryFactoryFor(
      'userCredentials',
      userCredentialsRepositoryGetter
    );
    this.registerInclusionResolver(
      'userCredentials',
      this.userCredentials.inclusionResolver
    )
  }


  async findCredentials(
    userId: typeof MyUser.prototype.id
  ): Promise<UserCredentials | undefined> {
    try {
      return await this.userCredentials(userId).get();
    } catch (err) {
      if (err.code === 'ENTITY_NOT_FOUND') {
        return undefined;
      }
      throw err;
    }
  }
}
