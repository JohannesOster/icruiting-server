import {DBAccess} from 'infrastructure/db';
import {decamelizeKeys} from 'humps';
import sql from './sql';

type Applicant = {
  tenantId: string;
  applicantId: string;
  jobId: string;
  attributes: {formFieldId: string; attributeValue: string}[];
};

export const ApplicantsRepository = ({db, pgp}: DBAccess) => {
  /*
   * TODO: type difference between applicant from retrieve (files and attributes separated) and create (singel attributes prop)
   */
  const retrieve = (
    tenantId: string,
    applicantId: string,
  ): Promise<Applicant | null> => {
    const params = decamelizeKeys({tenantId, applicantId});
    return db.oneOrNone(sql.retrieve, params);
  };

  const create = async (applicant: Applicant): Promise<Applicant> => {
    const {insert, ColumnSet} = pgp.helpers;
    try {
      const {tenantId, jobId, applicantId, attributes} = applicant;
      const applVals = decamelizeKeys({tenantId, jobId, applicantId});
      const applStmt = insert(applVals, null, 'applicant');
      await db.one(applStmt);

      const columns = ['applicant_id', 'form_field_id', 'attribute_value'];
      const options = {table: 'applicant_attribute'};
      const cs = new ColumnSet(columns, options);
      const attrs = attributes.map((attribute) => ({
        ...attribute,
        applicantId,
      }));
      const attrVals = attrs.map((attr) => decamelizeKeys(attr));
      const attrStmt = insert(attrVals, cs);
      await db.any(attrStmt);

      return retrieve(tenantId, applicantId).then((applicant) => {
        if (!applicant) throw new Error('Did not find applicant after insert');
        return applicant;
      });
    } catch (error) {
      return Promise.reject(error);
    }
  };

  return {create};
};
