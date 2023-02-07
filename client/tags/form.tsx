import { Form, Formik } from 'formik';
import Link from 'next/link';
import { ITag } from '../../models';
import { IEmptyObject } from '../lib/types';
import { emptyObject, ErrorMessage, Field, getUrl, SubmitBtn } from '../lib/utils';

interface IForm {
  onSubmit: any;
  tag?: ITag | IEmptyObject;
}

export default (props: IForm) => {
  const { onSubmit, tag = emptyObject } = props;
  return (
    <Formik initialValues={{ name: tag.name }} onSubmit={onSubmit}>
      <Form>
        <div className="row mb-20">
          <div className="col-6">
            <div className="mb-15">
              <label>Name</label>
              <Field className="form-control" name="name" />
              <ErrorMessage name="name" />
            </div>
          </div>
        </div>

        <Link href={getUrl('tags')} className="mr-15">
          Back
        </Link>
        <SubmitBtn className="btn btn-primary">Save</SubmitBtn>
      </Form>
    </Formik>
  );
};
