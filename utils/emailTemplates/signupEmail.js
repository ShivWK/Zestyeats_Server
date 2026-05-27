const signupEmail = (name, otp, forWhat) => {
  return `<!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="UTF-8" />
                        <title>Your ZestyEats OTP</title>
                        <style>
                            body {
                                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                background-color: #f6f8fa;
                                padding: 0;
                                margin: 0;
                            }
                            .container {
                                max-width: 500px;
                                margin: 40px auto;
                                background-color: #ffffff;
                                border-radius: 8px;
                                padding: 30px;
                                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
                                text-align: center;
                            }
                            .logo {
                                font-size: 30px;
                                color: #ff5200;
                                font-weight: bold;
                                margin-bottom: 20px;
                            }
                            .otp {
                                font-size: 32px;
                                font-weight: 700;
                                letter-spacing: 4px;
                                color: #333;
                                margin: 20px 0;
                            }
                            .text {
                                font-size: 16px;
                                color: #555;
                                margin-bottom: 30px;
                            }
                            .footer {
                                font-size: 12px;
                                color: #aaa;
                                margin-top: 20px;
                            }
                        </style>
                        </head>
                            <body>
                                <div class="container">
                                <div class="logo">ZestyEats</div>
                                <div class="text">
                                    Hi${name ? ' ' + name.split(' ')[0] : ''}, <br />
                                    Use the OTP below to complete your ${forWhat}:
                                </div>
                                    <div class="otp">${otp}</div>
                                    <div class="text">
                                        This OTP is valid for only 5 minutes. <br />
                                        If you did not request this, you can safely ignore this email.
                                    </div>
                                    <div class="footer">
                                        © 2025 ZestyEats. All rights reserved.
                                    </div>
                                </div>
                            </body>
                </html>`;
};

export default signupEmail;
