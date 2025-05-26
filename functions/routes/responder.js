const express = require('express');
const router = express.Router();
const createResponderApplication = require('../handlers/responder/createResponderApplication');
const approveResponder = require('../handlers/responder/approveResponder');
const rejectResponder = require('../handlers/responder/rejectResponder');
const getAllPendingResponders = require('../handlers/responder/getAllPendingResponders');
const getResponderProfile = require('../handlers/responder/getResponderProfile');
const { authenticate, authorize } = require('../middlewares/auth');

// Anyone can apply
router.post('/apply', authenticate, createResponderApplication);

// Admin-only actions
router.post('/approve', authenticate, authorize('admin'), approveResponder);
router.post('/reject', authenticate, authorize('admin'), rejectResponder);
router.get('/pending', authenticate, authorize('admin'), getAllPendingResponders);

// Responder-only access to their own profile
router.get('/me', authenticate, authorize('responder'), getResponderProfile);

module.exports = router;
