import pug from 'pug';

export enum Template {
  EmailConfirmation = 'application-confirmation-email.pug',
  EmailConfirmationTE = 'application-confirmation-email-te.pug',
}

const getTemplate = (template: Template, options: pug.LocalsObject | undefined) =>
  pug.compileFile(`${__dirname}/${template}`)(options);

export default getTemplate;
