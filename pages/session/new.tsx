import { Form, Formik } from 'formik';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../client/common/Layout.js';
import { TContent, Tooltip, TTrigger } from '../../client/components/Tooltip.js';
import {
  ErrorMessage,
  Field,
  getUrl,
  SubmitBtn,
  useContext,
  useSubmit,
  WithApiErrors,
} from '../../client/lib/utils.js';
import { keygrip, orm } from '../../lib/init.js';
import { getGenericProps } from '../../lib/utils.js';

export async function getServerSideProps(ctx) {
  const props = await getGenericProps({ ctx, keygrip, orm });
  return { props };
}

const LoginForm = () => {
  const { actions } = useContext();
  const router = useRouter();

  const onSubmit = useSubmit(async values => {
    await actions.signIn(values);
    router.push(getUrl('home'));
  });

  return (
    <Layout>
      <h3 className="flex">
        <div className="mr-2">Login form</div>
        <Tooltip offset={2} placement="right" className="inline-flex" theme="outline">
          <TTrigger>
            <i className="flex items-center far fa-circle-question fa_hint"></i>
          </TTrigger>
          <TContent>
            <div className="py-1 px-2">
              <div>Email - use any email from `Users` page</div>
              <div>Password - 1</div>
            </div>
          </TContent>
        </Tooltip>
      </h3>

      <Formik initialValues={{ email: '', password: '' }} onSubmit={onSubmit}>
        <Form>
          <div className="row mb-5">
            <div className="col-6">
              <div className="mb-4">
                <label>Email</label>
                <Field className="input" name="email" />
                <ErrorMessage name="email" />
              </div>
              <div>
                <label>Password</label>
                <Field className="input" type="password" name="password" />
                <ErrorMessage name="password" />
              </div>
            </div>
          </div>
          <Link href={getUrl('home')} className="mr-2">
            Cancel
          </Link>
          <SubmitBtn className="btn">Sign in</SubmitBtn>
        </Form>
      </Formik>
    </Layout>
  );
};

export default WithApiErrors(LoginForm);
