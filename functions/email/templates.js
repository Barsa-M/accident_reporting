const templates = {
  'responder-status-update': {
    subject: (data) => `Your Responder Application Status: ${data.status.toUpperCase()}`,
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Responder Application Update</h2>
        <p>Dear ${data.instituteName},</p>
        <p>Your application as a ${data.responderType} responder has been <strong>${data.status}</strong>.</p>
        ${data.status === 'approved' ? `
          <p>You can now log in to your responder dashboard to:</p>
          <ul>
            <li>View assigned incidents</li>
            <li>Update incident status</li>
            <li>Manage your profile</li>
          </ul>
        ` : ''}
        <p>If you have any questions, please contact our support team.</p>
        <p>Best regards,<br>SAFE Team</p>
      </div>
    `
  },
  'incident-assigned': {
    subject: () => 'New Incident Assigned',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Incident Assignment</h2>
        <p>A new incident requires your attention:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Type:</strong> ${data.incidentType}</p>
          <p><strong>Location:</strong> ${data.location}</p>
        </div>
        <p>Please log in to your responder dashboard for more details and to take action.</p>
        <p>Best regards,<br>SAFE Team</p>
      </div>
    `
  },
  'new-responder-admin': {
    subject: (data) => `New ${data.responderType} Responder Application`,
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Responder Application</h2>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Institute:</strong> ${data.instituteName}</p>
          <p><strong>Type:</strong> ${data.responderType}</p>
          <p><strong>Email:</strong> ${data.email}</p>
        </div>
        <p>Please review this application in your admin dashboard.</p>
        <p>Best regards,<br>SAFE Team</p>
      </div>
    `
  },
  'new-incident-admin': {
    subject: () => 'New Incident Reported',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Incident Report</h2>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Type:</strong> ${data.incidentType}</p>
          <p><strong>Location:</strong> ${data.location}</p>
          ${data.isAnonymous ? '' : `<p><strong>Reporter:</strong> ${data.reporterName}</p>`}
        </div>
        <p>Please review and assign appropriate responders.</p>
        <p>Best regards,<br>SAFE Team</p>
      </div>
    `
  }
};

module.exports = templates; 