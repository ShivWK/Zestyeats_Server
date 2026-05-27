const sms = async (number, text) => {
  const options = {
    method: 'POST',
    headers: {
      'COntent-Type': 'application/json',
      Authorization: process.env.FAST_TWO_SMS_KEY,
    },
    body: JSON.stringify({
      message: text,
      language: 'english',
      route: 'q',
      numbers: `91${number}`,
    }),
  };

  return await fetch('https://www.fast2sms.com/dev/bulkV2', options);
};

export default sms;
