import {File} from 'domain/entities';
import storageService from 'infrastructure/storageService';

export const getApplicantFileURLs = async (files?: File[]) => {
  const promises = files?.map((file) => {
    return storageService
      .getUrl(file.uri)
      .then((uri) => ({formFieldId: file.formFieldId, uri}));
  });

  return Promise.all(promises || []);
};
