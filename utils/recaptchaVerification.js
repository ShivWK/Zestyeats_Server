const recaptchaVerification = async (token) => {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  const params = new URLSearchParams();
  params.append('secret', secret);
  params.append('response', token);

  // google recaptcha verifier wants the token and secret in url encoded formate not in JSON that's we have created query string

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, //body will url string type
      body: params,
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.log('Error in verification', err);
    return false;
  }
};

export default recaptchaVerification;
