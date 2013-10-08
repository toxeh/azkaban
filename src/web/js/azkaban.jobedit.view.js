/*
 * Copyright 2012 LinkedIn Corp.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

$.namespace('azkaban');

var jobEditView;
azkaban.JobEditView = Backbone.View.extend({
	events : {
		"click" : "closeEditingTarget",
		"click #set-btn": "handleSet",	
		"click #cancel-btn": "handleCancel",
		"click .modal-close": "handleCancel",
		"click #addRow": "handleAddRow",
		"click table .editable": "handleEditColumn",
		"click table .removeIcon": "handleRemoveColumn"
	},
	initialize: function(setting) {
		this.projectURL = contextURL + "manager"
		this.generalParams = {}
		this.overrideParams = {}
	},
	handleCancel: function(evt) {
		$('#jobEditModalBackground').hide();
		$('#job-edit-pane').hide();
		var tbl = document.getElementById("generalProps").tBodies[0];
		var rows = tbl.rows;
		var len = rows.length;
		for(var i=0; i < len-1; i++) {
			tbl.deleteRow(0);
		}
	},
	show: function(projectName, flowName, jobName) {
		this.projectName = projectName;
		this.flowName = flowName;
		this.jobName = jobName;
		
		var projectURL = this.projectURL
		
		
		$('#jobEditModalBackground').show();
		$('#job-edit-pane').show();
		
		var handleAddRow = this.handleAddRow;
		
//		var overrideParams;
//		var generalParams;
//		this.overrideParams = overrideParams;
//		this.generalParams = generalParams;
		var fetchJobInfo = {"project": this.projectName, "ajax":"fetchJobInfo", "flowName":this.flowName, "jobName":this.jobName};
		
		var mythis = this;
		
		$.get(
				projectURL,
				fetchJobInfo,
				function(data) {
					if (data.error) {
						alert(data.error);
					}
					else {
						document.getElementById('jobName').innerHTML = data.jobName;				
						document.getElementById('jobType').innerHTML = data.jobType;
						var generalParams = data.generalParams;
						var overrideParams = data.overrideParams;
						
//						for(var key in generalParams) {
//							var row = handleAddRow();
//							var td = $(row).find('span');
//							$(td[1]).text(key);
//							$(td[2]).text(generalParams[key]);
//						}
						
						mythis.overrideParams = overrideParams;
						mythis.generalParams = generalParams;
						
						for(var okey in overrideParams) {
							if(okey != 'type' && okey != 'dependencies') {
								var row = handleAddRow();
								var td = $(row).find('span');
								$(td[1]).text(okey);
								$(td[2]).text(overrideParams[okey]);
							}
						}
						
					}
				},
				"json"
			);

	},
	handleSet: function(evt) {
		this.closeEditingTarget(evt);
		var jobOverride = {};
	  	var editRows = $(".editRow");
		for (var i = 0; i < editRows.length; ++i) {
			var row = editRows[i];
			var td = $(row).find('span');
			var key = $(td[1]).text();
			var val = $(td[2]).text();

			if (key && key.length > 0) {
				jobOverride[key] = val;
			}
		}
		
		var overrideParams = this.overrideParams
		var generalParams = this.generalParams
		
		jobOverride['type'] = overrideParams['type']
		if('dependencies' in overrideParams) {
			jobOverride['dependencies'] = overrideParams['dependencies']
		}
		
		var project = this.projectName
		var flowName = this.flowName
		var jobName = this.jobName
		
		var jobOverrideData = {
			project: project,
			flowName: flowName,
			jobName: jobName,
			ajax: "setJobOverrideProperty",
			jobOverride: jobOverride
		};

		var projectURL = this.projectURL
		var redirectURL = projectURL+'?project='+project+'&flow='+flowName+'&job='+jobName;
		
		$.get(
			projectURL,
			jobOverrideData,
			function(data) {
				if (data.error) {
					alert(data.error);
				}
				else {
					window.location = redirectURL;
				}
			},
			"json"
		);
	},
	handleAddRow: function(evt) {
		var tr = document.createElement("tr");
	  	var tdName = document.createElement("td");
	    var tdValue = document.createElement("td");

	    var icon = document.createElement("span");
	    $(icon).addClass("removeIcon");
	    var nameData = document.createElement("span");
	    $(nameData).addClass("spanValue");
	    var valueData = document.createElement("span");
	    $(valueData).addClass("spanValue");

		$(tdName).append(icon);
		$(tdName).append(nameData);
		$(tdName).addClass("name");
		$(tdName).addClass("editable");
		nameData.myparent = tdName;

		$(tdValue).append(valueData);
	    $(tdValue).addClass("editable");
		valueData.myparent = tdValue;
		
		$(tr).addClass("editRow");
	  	$(tr).append(tdName);
	  	$(tr).append(tdValue);

	  	$(tr).insertBefore("#addRow");
	  	return tr;

	},
	handleEditColumn : function(evt) {
		var curTarget = evt.currentTarget;
	
		if (this.editingTarget != curTarget) {
			this.closeEditingTarget(evt);
		
			var text = $(curTarget).children(".spanValue").text();
			$(curTarget).empty();
						
			var input = document.createElement("input");
			$(input).attr("type", "text");
			$(input).css("width", "100%");
			$(input).val(text);
			
			$(curTarget).addClass("editing");
			$(curTarget).append(input);
			$(input).focus();
			var obj = this;
			$(input).keypress(function(evt) {
		    	if(evt.which == 13) {
			        obj.closeEditingTarget(evt);
			    }
			});
			
			this.editingTarget = curTarget;
		}

		evt.preventDefault();
		evt.stopPropagation();
	},
	handleRemoveColumn : function(evt) {
		var curTarget = evt.currentTarget;
		// Should be the table
		var row = curTarget.parentElement.parentElement;
		$(row).remove();
	},
	closeEditingTarget: function(evt) {
		if (this.editingTarget != null && this.editingTarget != evt.target && this.editingTarget != evt.target.myparent ) {
	  		var input = $(this.editingTarget).children("input")[0];
	  		var text = $(input).val();
	  		$(input).remove();

		    var valueData = document.createElement("span");
		    $(valueData).addClass("spanValue");
		    $(valueData).text(text);

	  		if ($(this.editingTarget).hasClass("name")) {
		  		var icon = document.createElement("span");
		    	$(icon).addClass("removeIcon");
		    	$(this.editingTarget).append(icon);
		    }

		    $(this.editingTarget).removeClass("editing");
		    $(this.editingTarget).append(valueData);
		    valueData.myparent=this.editingTarget;
		    this.editingTarget = null;
	  	}
	}
});

$(function() {


	jobEditView = new azkaban.JobEditView({el:$('#job-edit-pane')});
	
	 
	
});
