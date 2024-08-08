## Setup

This sample is based on APS Tutorial
https://github.com/autodesk-platform-services/aps-hubs-browser-nodejs
Please follow the Readme to setup the sample

The sample extends with ACC Issue demo, integrating BIM360PushpinExtension from the other sample: https://github.com/autodesk-platform-services/aps-bim360-issues  

## Overview
Current ACC Issue API only officially support to fetch all pushpin issue data of 3D view, partial data of 2D view. It does not support to create pushpin issue. However, technically, with the same payload schema of fetching pushpin data, the API could still work to create a new pushpin issue. But this is NOT a supported scenario. In addition, BIM360PushpinExtension is more for BIM360 issue. This sample adopts this extension as workaround, instead of an recommended way. So you would use on your own risk.

This sample applies with latest new SDKs of APS for Authentication, Data Management, Model Derivative etc. While because APS has not exposed SDK for ACC Issue. So this sample calls ACC Issue API HTTP by fetch_common. 

## Test
To play the sample, after loading the model in Viewer, two buttons will be loaded in the toolbar of the viewer. One (pencil icon) is to load all issues that associate with this model view. The other (exclamation-triangle) is to start the workflow of creating an issue. After filling the issue title, click one position of the model, the issue will be created. 

## Notes/TroubleShooting:
- the extension of creating ACC Issue is not working well for any model. The position might be shifting. 
- if you see failure of creating issue, that might be the token has expired. Re-login with the user
- this sample aks the end user to provide issue title and select position (also the selected object) only. The other attributes come from code. IssueSubtypeId is also hard-coded. status is also hard-coded(Open). you may adjust with your design. 
