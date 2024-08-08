/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Developer Acvocacy and Support
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////
const { get, post, patch } = require('./fetch_common');  
const service = module.exports = {};

service.getIssuesbyDocument = async (accessToken,projectId,documentFilter) => {
  let endpoint = `https://developer.api.autodesk.com/construction/issues/v1/projects/${projectId}/issues?filter[linkedDocumentUrn]=${documentFilter}`
  const headers =  {
    Authorization: 'Bearer ' + accessToken
  }  
  const response = await get(endpoint, headers)
  if (response.results && response.results.length > 0) {
    return response.results
  }else{
    return null
  } 
};  

service.createIssue = async (accessToken,projectId,payload) => {
  let endpoint = `https://developer.api.autodesk.com/construction/issues/v1/projects/${projectId}/issues`
  const headers =  {
    Authorization: 'Bearer ' + accessToken
  }  
  const response = await post(endpoint, headers,JSON.stringify(payload))
  if (response) {
    return response
  }else{
    return null
  } 
};  

service.getIssueSubTypes = async (accessToken,projectId) => {
  let endpoint = `https://developer.api.autodesk.com/construction/issues/v1/projects/${projectId}/https://developer.api.autodesk.com/construction/issues/v1/projects/:projectId/issue-types?include=subtypes&limit=100`
  const headers =  {
    Authorization: 'Bearer ' + accessToken
  }  
  const response = await post(endpoint, headers)
  var subTypes = []
  response.forEach(type => {
    subTypes = subTypes.concat(type.subTypes)
  });
  return subTypes
};  
 
  