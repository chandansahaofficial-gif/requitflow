const crypto = require('crypto');

async function sendN8nWebhook(user, eventType, payload) {
  if (!user || !user.n8nEnabled || !user.n8nWebhookUrl) {
    return;
  }

  try {
    const webhookPayload = {
      event_type: eventType,
      user_id: user.id,
      timestamp: new Date().toISOString(),
      ...payload
    };

    const headers = {
      'Content-Type': 'application/json'
    };

    // If a secret is provided, send it in the headers (as a simple Authorization or custom header)
    if (user.n8nWebhookSecret) {
      // Basic security mechanism for the webhook. You could also do HMAC signature.
      headers['x-webhook-secret'] = user.n8nWebhookSecret;
    }

    // In a production environment with retries, we might want to use a library like `axios-retry`
    // For this MVP, we use fetch with a simple try/catch
    const response = await fetch(user.n8nWebhookUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(webhookPayload)
    });

    if (!response.ok) {
      console.error(`n8n webhook failed with status: ${response.status}`);
      // If we wanted to retry, we would do it here or push to a queue.
    } else {
      console.log(`n8n webhook triggered successfully for event: ${eventType}`);
    }
  } catch (error) {
    console.error('Error sending n8n webhook:', error);
  }
}

module.exports = {
  sendN8nWebhook
};
