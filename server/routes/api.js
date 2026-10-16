const express = require('express');

// The versioned API surface, mounted at both `/api` and `/api/v1` by server.js.
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/account', require('./account'));
router.use('/public', require('./public'));
router.use('/news', require('./news'));
router.use('/daily-brief', require('./dailyBrief'));
router.use('/comments', require('./comments'));
router.use('/me', require('./me'));
router.use('/admin', require('./admin'));
router.use('/subscribers', require('./subscribers'));

module.exports = router;
