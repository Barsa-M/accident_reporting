const admin = require('firebase-admin');

module.exports = async (req, res) => {
  try {
    const uid = req.user.uid;

    const doc = await admin.firestore().collection('responders').doc(uid).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Responder not found' });
    }

    res.status(200).json({ responder: doc.data() });
  } catch (error) {
    console.error('Error fetching responder profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
