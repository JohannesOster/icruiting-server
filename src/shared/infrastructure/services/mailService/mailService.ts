import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import config from 'config';

export const sendMail = (options: Mail.Options): Promise<any> => {
  const user = config.get('mailService.email');
  const pass = config.get('mailService.password');

  if (!(user && pass)) throw new Error('Missing email credentials');

  const smtpConfig = {
    host: 'smtp.zoho.eu',
    port: 465,
    secure: true,
    auth: {user, pass},
  };

  const transporter = nodemailer.createTransport(smtpConfig);

  return new Promise((resolve, reject) => {
    transporter.sendMail({from: user, ...options}, (error, info) => {
      if (error) return reject(error);
      resolve(info);
    });
  });
};
