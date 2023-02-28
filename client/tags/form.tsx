import { Form, Formik } from 'formik';
import Link from 'next/link';
import { IEmptyObject, ITag } from '../../lib/types.js';
import { emptyObject, ErrorMessage, Field, getUrl, SubmitBtn } from '../lib/utils.js';

interface IForm {
  onSubmit: any;
  tag?: ITag | IEmptyObject;
}

export default (props: IForm) => {
  const { onSubmit, tag = emptyObject } = props;
  return (
    <Formik initialValues={{ name: tag.name }} onSubmit={onSubmit}>
      <Form>
        <div className="row mb-5">
          <div className="col-6">
            <div>
              <label>Name</label>
              <Field className="form-control" name="name" />
              <ErrorMessage name="name" />
            </div>
          </div>
        </div>

        <Link href={getUrl('tags')} className="mr-4">
          Back
        </Link>
        <SubmitBtn className="btn">Save</SubmitBtn>
      </Form>
    </Formik>
  );
};
