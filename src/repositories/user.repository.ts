import {inject} from '@loopback/core';
import {DefaultCrudRepository, Getter, HasOneRepositoryFactory, juggler, repository} from '@loopback/repository';
import {MyUser, UserRelations} from '../models';
import {MyUserCredentials} from '../models/user-credentials.model';
import {MyUserCredentialsRepository} from './user-credentials.repository';


export class UserRepository extends DefaultCrudRepository<
  MyUser,
  typeof MyUser.prototype.id,
  UserRelations
> {

  public readonly userCredentials: HasOneRepositoryFactory<
    MyUserCredentials,
    typeof MyUser.prototype.id
  >

  constructor(
    @inject(`datasources.db`) dataSource: juggler.DataSource,
    @repository.getter('UserCredentialsRepository')
    protected userCredentialsRepositoryGetter: Getter<MyUserCredentialsRepository>
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
  ): Promise<MyUserCredentials | undefined> {
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
