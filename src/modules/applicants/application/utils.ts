import {File} from 'modules/applicants/domain';
import storageService from 'shared/infrastructure/services/storageService';

export const getApplicantFileURLs = async (files?: File[]) => {
  const promises = files?.map((file) => {
    return storageService.getUrl(file.uri).then((uri) => ({formFieldId: file.formFieldId, uri}));
  });

  return Promise.all(promises || []);
};
