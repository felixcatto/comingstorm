import { Form, Formik } from 'formik';
import Link from 'next/link';
import { IEmptyObject, IUser } from '../../lib/types';
import {
  emptyObject,
  ErrorMessage,
  Field,
  getUrl,
  roles,
  SubmitBtn,
  UsualSelect,
} from '../lib/utils';

interface IForm {
  onSubmit: any;
  user?: IUser | IEmptyObject;
}

const UserForm = (props: IForm) => {
  const { onSubmit, user = emptyObject } = props;
  return (
    <Formik
      initialValues={{
        name: user.name,
        role: user.role || roles.user,
        email: user.email,
        password: '',
      }}
      onSubmit={onSubmit}
    >
      <Form>
        <div className="row mb-5">
          <div className="col-6">
            <div className="mb-4">
              <label>Name</label>
              <Field className="form-control" name="name" />
              <ErrorMessage name="name" />
            </div>
            <div className="mb-4">
              <label>Role</label>
              <UsualSelect
                name="role"
                data={Object.values(roles).filter(el => el !== roles.guest)}
                defaultItem={roles.user}
              />
              <ErrorMessage name="role" />
            </div>
            <div className="mb-4">
              <label>Email</label>
              <Field className="form-control" name="email" />
              <ErrorMessage name="email" />
            </div>
            <div>
              <label>Password</label>
              <Field className="form-control" type="password" name="password" />
              <ErrorMessage name="password" />
            </div>
          </div>
        </div>

        <Link href={getUrl('users')} className="mr-4">
          Back
        </Link>
        <SubmitBtn className="btn">Save</SubmitBtn>
      </Form>
    </Formik>
  );
};

export default UserForm;
