import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

export const sendMail = (options: Mail.Options): Promise<any> => {
  const user = process.env.EMAIL_ADRESS;
  const pass = process.env.EMAIL_PASSWORD;

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
