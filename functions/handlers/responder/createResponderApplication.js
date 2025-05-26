const admin = require('firebase-admin');

module.exports = async (req, res) => {
  try {
    const { uid, email, responderType, location, fullName } = req.body;

    const responderData = {
      uid,
      email,
      fullName,
      responderType,
      location,
      status: 'pending', // Default pending
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await admin.firestore().collection('responders').doc(uid).set(responderData);
    res.status(201).json({ message: 'Responder application submitted successfully' });
  } catch (error) {
    console.error('Error creating responder application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
