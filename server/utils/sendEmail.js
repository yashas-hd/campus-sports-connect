const axios = require('axios');

const sendEmail = async (options) => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY environment variable is not configured");
  }
  if (!process.env.EMAIL_USER) {
    throw new Error("EMAIL_USER (sender email) environment variable is not configured");
  }

  const payload = {
    sender: {
      name: "Campus Sports Connect",
      email: process.env.EMAIL_USER,
    },
    to: [
      {
        email: options.email,
      },
    ],
    subject: options.subject,
    htmlContent: options.html || options.message,
  };

  try {
    const response = await axios.post("https://api.brevo.com/v3/smtp/email", payload, {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 10000, // 10 second timeout
    });
    
    console.log("Brevo API Email sent successfully. Message ID:", response.data.messageId);
    return response.data;
  } catch (error) {
    console.error(
      "Brevo API Email sending failed:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

module.exports = sendEmail;
