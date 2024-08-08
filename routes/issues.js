const express = require('express');
const { authRefreshMiddleware} = require('../services/aps.js');
const {getIssuesbyDocument,createIssue,getIssueSubTypes} = require('../services/issues.js')
const bodyParser = require('body-parser');

let router = express.Router();


router.use('/api/issues', authRefreshMiddleware);

router.use('/api/issues/:projectId/:itemUrn/:versionNum', async function (req, res, next) {
    const projectId = req.params.projectId
    const documentFilter = `${req.params.itemUrn}@${req.params.versionNum}`

    try {
        const issues = await getIssuesbyDocument(req.internalOAuthToken.access_token,projectId,documentFilter);
        res.json(issues);
    } catch (err) {
        next(err);
    }
}); 

router.post('/api/issues/:projectId', bodyParser.json(), async function (req, res, next) {
    const projectId = req.params.projectId
    let payload = req.body.payload;
    try {
        const oneissue = await createIssue(req.internalOAuthToken.access_token,projectId,payload);
        res.json(oneissue);
    } catch (err) {
        next(err);
    }
}); 

router.use('/api/issues/:projectId/issueSubTypes', async function (req, res, next) {
    const projectId = req.params.projectId
    try {
        const issues = await getIssueSubTypes(req.internalOAuthToken.access_token);
        res.json(issues);
    } catch (err) {
        next(err);
    }
}); 

module.exports = router;
