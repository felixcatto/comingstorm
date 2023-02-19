import cn from 'classnames';
import { Form, Formik } from 'formik';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../client/common/Layout';
import { TContent, Tooltip, TTrigger } from '../../client/components/Tooltip';
import {
  ErrorMessage,
  Field,
  getUrl,
  SubmitBtn,
  useContext,
  WithApiErrors,
} from '../../client/lib/utils';
import { keygrip, objection } from '../../lib/init';
import { getUserFromRequest, unwrap } from '../../lib/utils';

export async function getServerSideProps({ req, res }) {
  const currentUser = await getUserFromRequest(res, req.cookies, keygrip, objection.User);
  return {
    props: unwrap({ currentUser }),
  };
}

const LoginForm = WithApiErrors(props => {
  const { actions } = useContext();
  const router = useRouter();
  const { setApiErrors } = props;

  const onSubmit = async values => {
    try {
      await actions.signIn(values);
      router.push(getUrl('home'));
    } catch (e: any) {
      setApiErrors(e.response.data.errors);
    }
  };

  return (
    <Layout>
      <h3 className="d-flex">
        <div className="mr-10">Login form</div>
        <Tooltip offset={2} placement="right" className="inline-flex" theme="outline">
          <TTrigger>
            <i className="d-flex items-center far fa-circle-question fa_hint"></i>
          </TTrigger>
          <TContent>
            <div className="py-5 px-10">
              <div>Email - use any email from `Users` page</div>
              <div>Password - 1</div>
            </div>
          </TContent>
        </Tooltip>
      </h3>
      <Formik initialValues={{ email: '', password: '' }} onSubmit={onSubmit}>
        <Form>
          <div className="row mb-20">
            <div className="col-6">
              <div className="mb-15">
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
          <Link href={getUrl('home')} className="mr-10">
            Cancel
          </Link>
          <SubmitBtn className="btn btn-primary">Sign in</SubmitBtn>
        </Form>
      </Formik>
    </Layout>
  );
});

export default LoginForm;
