import { Form, Formik } from 'formik';
import Link from 'next/link';
import { IArticle, IEmptyObject, ITag } from '../../lib/types.js';
import { emptyObject, ErrorMessage, Field, FMultiSelect, getUrl, SubmitBtn } from '../lib/utils.js';

interface IForm {
  onSubmit: any;
  tags: ITag[];
  article?: IArticle | IEmptyObject;
}

export default (props: IForm) => {
  const { onSubmit, tags, article = emptyObject } = props;
  const transformTag = tag => ({ value: tag.id, label: tag.name });
  const tagsForSelect = tags.map(transformTag);
  const articleTags = article.tags || [];
  const selectedTags = articleTags.map(transformTag);
  const tagIds = articleTags.map(tag => tag.id);

  return (
    <Formik
      initialValues={{
        title: article.title,
        text: article.text,
        tagIds,
      }}
      onSubmit={onSubmit}
    >
      <Form>
        <div className="row mb-5">
          <div className="col-6">
            <div className="mb-4">
              <label>Title</label>
              <Field className="form-control" name="title" />
              <ErrorMessage name="title" />
            </div>
            <div className="mb-4">
              <label>Text</label>
              <Field className="form-control" as="textarea" name="text" />
            </div>
            <div>
              <label>Tags</label>
              <FMultiSelect name="tagIds" data={tagsForSelect} defaultItems={selectedTags} />
            </div>
          </div>
        </div>

        <Link href={getUrl('articles')} className="mr-4">
          Back
        </Link>
        <SubmitBtn className="btn">Save</SubmitBtn>
      </Form>
    </Formik>
  );
};
