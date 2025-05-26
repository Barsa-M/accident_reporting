const admin = require('firebase-admin');

module.exports = async (req, res) => {
  try {
    const snapshot = await admin.firestore()
      .collection('responders')
      .where('status', '==', 'pending')
      .get();

    const pendingResponders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json({ responders: pendingResponders });
  } catch (error) {
    console.error('Error fetching pending responders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
