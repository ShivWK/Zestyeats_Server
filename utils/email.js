import { Resend } from 'resend';

const sendMail = async (userEmail, text) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const send = await resend.emails.send({
    from: 'ZestyEats <zestyeats@shivendra.site>',
    to: userEmail,
    subject: 'OTP from ZestyEats',
    html: text,
  });

  return send;
};

export default sendMail;
