/*-------------------------------------------------------------------- 
  
   Module: simple barchart class implemented in Bostock's functional style
   Author: Mike Chantler
  
   What it does:
  	Renders a bar chart in as simple mannert as posibe
  
   Dependencies
  	D3.js v4
  
   Version history
  	v001	29/08/2018	mjc	Created.
  
---------------------------------------------------------------------- */
"use safe"

function barchart(targetDOMelement) { 
	//Here we use a function declaration to imitate a 'class' definition
	//
	//Invoking the function will return an object (barchartObject)
	//    e.g. barchart_instance = barchart(target)
	//    This also has the 'side effect' of appending an svg to the target element 
	//
	//The returned object has attached public and private methods (functions in JavaScript)
	//For instance calling method 'updateAndRenderData()' on the returned object 
	//(e.g. barchart_instance) will render a barchart to the svg
	

	//Delare the main object that will be returned to caller
	var barchartObject = {};
	
	//=================== PUBLIC FUNCTIONS =========================
	//
	barchartObject.loadAndRenderDataset = function (data) {
		dataset=data;
		GUP_bars(dataset);
		return barchartObject;
	}		
	barchartObject.render = function (data) {
		GUP_bars(dataset);
		//console.log("render called",targetDOM)
		return barchartObject;
	}	
	barchartObject.overrideMouseoverFunction = function (callbackFunction) {
		mouseoverCallback = callbackFunction;
		return barchartObject;
	}
	barchartObject.overrideMouseoutFunction = function (callbackFunction) {
		mouseoutCallback = callbackFunction;
		return barchartObject;
	}
	
	//=================== PRIVATE VARIABLES ====================================
	//Width and height of svg canvas
	var svgWidth = 900; 
	var svgHeight = 150;
	var dataset = [];
	var targetDOM = targetDOMelement;
	
	//=================== INITIALISATION CODE ====================================
	
	//Declare and append SVG element
	var svg = d3
		.select(targetDOM)
		.append("svg")
		.attr("width", svgWidth)
		.attr("height", svgHeight)
		.classed("barchart",true);				
		
	//===================== PRIVATE FUNCTIONS =========================================
	
	var dataField = function(d){return d.dataField} //The length of the bars
	var getBarPosition = function(d, i){return 24* i;}
	var getKey = function(d){return d.keyField;}	
	var mouseoverCallback = function(d){
		d.highlight = true; 
		GUP_bars(dataset); 
	}	
	var mouseoutCallback = function(d){
		d.highlight =false; 
		GUP_bars(dataset); 
	}	
	var GUP_bars = function(dataset){
		//GUP = General Update Pattern to render bars 
		
		//GUP: SELECT & BIND
		selection = svg
			.selectAll("rect")
			.data(dataset, getKey);			

		//GUP: ENTER SELECTION
		var enterSelection = selection
			.enter()
			.append("rect")
			.classed("enterSelection bars", true);
			
		enterSelection
			.attr("x", 0)
			.attr("y", getBarPosition)	
			.attr("height", 20)
			.attr("width", dataField);
		
		//GUP UPDATE SELECTION
		var updateSelection = selection
			.classed("enterSelection", false)
			.classed("updateSelection", true)
			.attr("y", getBarPosition)	   
			.attr("width", dataField);	
			
		//GUP EXIT SELECTION 
		selection.exit()
			.classed("enterSelection updateSelection", false)
			.classed("exitSelection", true)
			.remove() 
	}
		
	
	//================== IMPORTANT do not delete ==================================
	return barchartObject; // return the main object to the caller to create an instance of the 'class'
	
} //End of barchart() declaration	

