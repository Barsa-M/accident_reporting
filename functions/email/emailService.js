const nodemailer = require('nodemailer');
const templates = require('./templates');
const functions = require('firebase-functions');

// Initialize nodemailer with Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'safesystemsender@gmail.com',
    pass: 'evfkdhfiubwjwgnf'
  }
});

// Verify transporter
transporter.verify((error) => {
  if (error) {
    console.error('Error with email transporter:', error);
  } else {
    console.log('Email service is ready');
  }
});

// Send email using template
const sendTemplatedEmail = async ({ to, template, data }) => {
  if (!templates[template]) {
    throw new Error(`Template ${template} not found`);
  }

  const mailOptions = {
    from: 'SAFE System <safesystemsender@gmail.com>',
    to,
    subject: templates[template].subject(data),
    html: templates[template].html(data)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = {
  sendTemplatedEmail
}; 