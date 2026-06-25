const fs = require('fs');
const path = require('path');
const sgMail = require('@sendgrid/mail');

function loadEnv() {
  try {
    let envFile = fs.readFileSync(path.resolve('.env'), 'utf8');
    parseEnv(envFile);
  } catch(err) {}
  
  try {
    let localEnvFile = fs.readFileSync(path.resolve('.env.local'), 'utf8');
    parseEnv(localEnvFile);
  } catch(err) {}
}

function parseEnv(envStr) {
  envStr.split(/\r?\n/).forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^"(.*)"$/, '$1');
    }
  });
}

loadEnv();

async function test() {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  
  if (!apiKey || !fromEmail) {
    console.error("❌ Missing SENDGRID_API_KEY or SENDGRID_FROM_EMAIL in environment variables.");
    process.exit(1);
  }

  console.log(`Testing SendGrid with Sender Email: ${fromEmail}`);

  sgMail.setApiKey(apiKey);
  
  const msg = {
    to: fromEmail, // sending to yourself to test
    from: {
      email: fromEmail,
      name: process.env.SENDGRID_FROM_NAME || "Test Sender"
    },
    subject: 'SendGrid Integration Test',
    text: 'If you are seeing this, SendGrid is configured correctly and working!',
    html: '<strong>If you are seeing this, SendGrid is configured correctly and working!</strong>',
  };

  try {
    const res = await sgMail.send(msg);
    console.log("✅ Success! Email sent.");
    console.log("Status Code:", res[0].statusCode);
    console.log("Check your inbox at:", fromEmail);
  } catch (error) {
    console.error("❌ SendGrid Test Failed!");
    if (error.response) {
      console.error(JSON.stringify(error.response.body, null, 2));
    } else {
      console.error(error);
    }
  }
}

test();
