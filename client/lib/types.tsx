import { IUser } from '../../models';

export interface IEmptyObject {
  [key: string]: undefined;
}

export type ICurrentUser = {
  currentUser: IUser;
};
