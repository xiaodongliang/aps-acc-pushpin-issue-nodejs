/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by APS Partner Development
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


// *******************************************
// My Extension
// *******************************************
function MyExtension(viewer, options) {
  Autodesk.Viewing.Extension.call(this, viewer, options);
  this.viewer = viewer;
  this.panel = null; // create the panel variable
  this.containerId = null;
  this.hubId = null;
  this.issues = null;
  this.pushPinExtension = null;
}

MyExtension.prototype = Object.create(Autodesk.Viewing.Extension.prototype);
MyExtension.prototype.constructor = MyExtension;

MyExtension.prototype.load = async function () {
  if (this.viewer.toolbar) {
    // Toolbar is already available, create the UI
    this.createUI();
  } else {
    // Toolbar hasn't been created yet, wait until we get notification of its creation
    this.onToolbarCreatedBinded = this.onToolbarCreated.bind(this);
    this.viewer.addEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
    var op = {
      hideRfisButton: true,
      hideFieldIssuesButton: true,
    };
    await this.viewer.loadExtension('Autodesk.BIM360.Extension.PushPin.New', op);
    this.pushPinExtension = this.viewer.getExtension('Autodesk.BIM360.Extension.PushPin.New');
  }
  return true;
};

MyExtension.prototype.onToolbarCreated = function () {
  this.viewer.removeEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
  this.onToolbarCreatedBinded = null;
  this.createUI();
};


//  button of load issues
MyExtension.prototype.loadIssueButton = function () {
  var _this = this;
  var loadIssuesBtn = new Autodesk.Viewing.UI.Button('loadIssuesBtn');
  loadIssuesBtn.onClick = function (e) {
    // check if the panel is created or not
    if (_this.panel == null) {
      _this.panel = new MyIssuePanel(_this.viewer,
        _this.viewer.container,
        'MyIssuePanel',
        'ACC Issues');
    }
    // show/hide docking panel
    _this.panel.setVisible(!_this.panel.isVisible());
    // if panel is NOT visible, exit the function
    if (!_this.panel.isVisible()) return;
    // ok, it's visible, let's load the issues
    const loadedDocument = _this.viewer.model.getDocumentNode();
    if(loadedDocument.data.role == '3d')
      _this.loadIssues3D();
    else
      _this.loadIssues2D();
  };
  loadIssuesBtn.addClass('loadIssuesBtn');
  loadIssuesBtn.setToolTip('Show Issues');
  this.subToolbar.addControl(loadIssuesBtn);
}

//  button of new issues 
MyExtension.prototype.createIssueButton = function () {
  var _this = this;
  var createIssuesBtn = new Autodesk.Viewing.UI.Button('createIssuesBtn');
  createIssuesBtn.onClick = function (e) {
    if (!this.pushPinExtension) {
      const loadedDocument = _this.viewer.model.getDocumentNode();
      if(loadedDocument.data.role == '3d')
        _this.createIssue3D(); // show issues
      else
        _this.createIssue2D();

    }
  };
  createIssuesBtn.addClass('createIssuesBtn');
  createIssuesBtn.setToolTip('Create Issues');
  this.subToolbar.addControl(createIssuesBtn);
}

MyExtension.prototype.createUI = function () {
  // SubToolbar
  this.subToolbar = (this.viewer.toolbar.getControl("MyAppToolbar") ?
    this.viewer.toolbar.getControl("MyAppToolbar") :
    new Autodesk.Viewing.UI.ControlGroup('MyAppToolbar'));
  this.viewer.toolbar.addControl(this.subToolbar);

  this.loadIssueButton();
  this.createIssueButton();

};


//get issue list from APS
MyExtension.prototype.getIssuesList = async function () {
  var _this = this;
  const selNode = getSelectedNodeData();
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `api/issues/${selNode.projectId}/${selNode.itemUrn}/${selNode.versionNum}`,
      type: 'GET',
      success: (data) => {
        resolve(data)
      }, error: (error) => {
        alert('Cannot get issue');
        reject(error)
      }
    });
  })
}

//send payload data to server, to create issue 
MyExtension.prototype.createIssueImpl = async function (projectId, data) {
  var _this = this;
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `api/issues/${projectId}`,
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ payload: data }),
      success: (data) => {
        resolve(data)
      }, error: (error) => {
        _this.pushPinExtension.pushPinManager.removeItemById('0');
        alert('Cannot create issue');
        reject(error)
      }
    });
  })
}
 


//load issues of 3D view to APS Viewer
MyExtension.prototype.loadIssues3D = async function () {
  var _this = this;
  var allIssues = await this.getIssuesList();
  if (_this.panel) _this.panel.removeAllProperties();

  //filter with specific document of the model （One file item may contain 2D view, 2D sheet, 3D model etc)
  const loadedDocument = _this.viewer.model.getDocumentNode();
  allIssues = allIssues.filter(i =>
    i.linkedDocuments && 
    i.linkedDocuments[0].details.viewable.guid == loadedDocument.data.guid &&
    i.linkedDocuments[0].details.viewable.viewableId == loadedDocument.data.viewableID
  )
  if (allIssues.length > 0) {
    this.pushPinExtension.removeAllItems();
    this.pushPinExtension.showAll();
    var pushpinDataArray = [];

    allIssues.forEach(function (issue) {
      const dateCreated = moment(issue.createdAt);

      // add the pushpin
      if (issue.linkedDocuments == null || issue.linkedDocuments.length == 0) {
        alert(`No Pushpin Data with this Issue ${issue.id}! Check the source data!`);
        return;
      }
      // show issue on panel
      if (_this.panel) {
        _this.panel.addProperty('Title', issue.title, 'Issue ' + issue.displayId);
        _this.panel.addProperty('CreatedAt Version', 'V ' + issue.linkedDocuments[0].createdAtVersion, 'Issue ' + issue.displayId);
        _this.panel.addProperty('Created At', dateCreated.format('MMMM Do YYYY, h:mm a'), 'Issue ' + issue.displayId);
        _this.panel.addProperty('Assigned to', issue.assignee, 'Issue ' + issue.displayId);
      }

      var pushpinData = issue.linkedDocuments[0]; //currently, linked with one document only.

      pushpinDataArray.push({
        type: 'issues',
        id: issue.id,
        label: issue.title,
        status: issue.status,
        position: pushpinData.details.position,
        objectId: pushpinData.details.objectId,
        viewerState: pushpinData.details.viewerState
      });
    })
    this.pushPinExtension.loadItemsV2(pushpinDataArray);
  }
  else {
    if (_this.panel) _this.panel.addProperty('No issues found', 'Use create issues button');
  }
}


//create one issue of 3D view
MyExtension.prototype.createIssue3D = async function () {
  var _this = this;
  var issueLabel = prompt("Enter issue title: ");
  if (issueLabel === null) return;

  //const issueSubTypes = await getIssueSubTypeList() 
  //$('#provisionAccountModal').modal('toggle'); 
  // var issueSubTypeId = prompt("Enter issue sub type: ");
  // if (issueSubTypeId === null) return; 

  // prepare to end creation...
  this.pushPinExtension.pushPinManager.addEventListener('pushpin.created', async (e) => {

    _this.pushPinExtension.pushPinManager.removeEventListener('pushpin.created', arguments.callee);
    _this.pushPinExtension.endCreateItem();
    

    const newIssue = _this.pushPinExtension.getLegacyPushPinData
                      ? _this.pushPinExtension.getLegacyPushPinData(e.value)
                      : e.value.data;  

    const selNode = getSelectedNodeData();
    const loadedDocument = _this.viewer.model.getDocumentNode();
    var payload = {
      title: newIssue.label,
      status: 'open',
      issueSubtypeId: '49bae7b2-c8e1-41fd-a11c-193751e866cc',
      //issueSubTypeId is harded coded currently
      //next version of this sample will provide type list for customer to select
      linkedDocuments: [
        {
          type: 'TwoDVectorPushpin',
          urn: selNode.itemUrn,
          createdAtVersion: Number(selNode.versionNum),
          details: {
            viewable: {
              name: loadedDocument.data.name,
              guid: loadedDocument.data.guid,
              is3D: loadedDocument.data.role == '3d',
              viewableId: loadedDocument.data.viewableID
            },
            externalId: newIssue.externalId,
            position: newIssue.position,
            objectId: newIssue.objectId,
            viewerState: newIssue.viewerState
          }
        }
      ]
    };

    _this.createIssueImpl(selNode.projectId, payload);

  });


  // start asking for the push location
  _this.pushPinExtension.startCreateItem({ label: issueLabel, status: 'open', type: 'issues' });
}
//get issue list from APS
MyExtension.prototype.getIssueSubTypeList = async function () {
  var _this = this;
  const selNode = getSelectedNodeData();
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `api/issues/${selNode.projectId}/issueSubTypes`,
      type: 'GET',
      success: (data) => {
        resolve(data)
      }, error: (error) => {
        alert('Cannot get issue sub types');
        reject(error)
      }
    });
  })
}


//create one issue of 2D view
MyExtension.prototype.createIssue2D = async function () {
  alert('2D pushpin data is not available with current API.')
}

//load issues of 2D view to APS Viewer
MyExtension.prototype.loadIssues3D = async function () {
  alert('2D pushpin data is not available with current API.')

}

MyExtension.prototype.getExternalIdFromObjectId = async function (dbId) {
  var _this = this;
  return new Promise((resolve, reject) => {
    _this.viewer.getProperties( dbId, properties => 
      resolve(properties.externalId)
    )
  })
}

MyExtension.prototype.unload = function () {
  this.viewer.toolbar.removeControl(this.subToolbar);
  return true;
};

Autodesk.Viewing.theExtensionManager.registerExtension('MyExtension', MyExtension);


// *******************************************
// My Issue Panel
// *******************************************
function MyIssuePanel(viewer, container, id, title, options) {
  this.viewer = viewer;
  Autodesk.Viewing.UI.PropertyPanel.call(this, container, id, title, options);
}
MyIssuePanel.prototype = Object.create(Autodesk.Viewing.UI.PropertyPanel.prototype);
MyIssuePanel.prototype.constructor = MyIssuePanel;


// *******************************************
// Helper functions
// *******************************************
function getSelectedNodeData() {
  const projectId = $('#labelProjectId').text().replace('b.', '')
  const itemUrn = $('#labelitemUrn').text()
  const versionNum = $('#labelVersionId').text().split('?')[1].replace('version=', '')
  var node_data = {
    projectId: projectId,
    itemUrn: itemUrn,
    versionNum: versionNum
  }
  return node_data
}
 

$('#d_cancel').click(e => {
  $(this).hide();
}
)

$('#d_confirm').click(e => {

}
)