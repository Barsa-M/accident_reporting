const admin = require('firebase-admin');

module.exports = async (req, res) => {
  try {
    const { uid, reason } = req.body;

    await admin.firestore().collection('responders').doc(uid).update({
      status: 'rejected',
      rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      rejectionReason: reason || '',
    });

    res.status(200).json({ message: 'Responder rejected successfully' });
  } catch (error) {
    console.error('Error rejecting responder:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
