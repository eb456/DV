/*-------------------------------------------------------------------- 
  
   Module: piechart class implemented in Bostock's functional style
   Author: Mike Chantler
  
   What it does:
  	Renders a pie chart using the GUP
  
   Dependencies
  	D3.js v4
  
   Version history
  	v001	17/09/2017	mjc	Created.
	v002	17/08/2018	mjc	Non-linear tweening added
	v003	26/09/2018	mjc Tidy to make classes more similar to barchart with axes module
  
---------------------------------------------------------------------- */

function piechart(targetDOMelement) { 
	//Here we use a function declaration to imitate a 'class' definition
	//
	//Invoking the function will return an object (piechartObject)
	//    e.g. piechart_instance = piechart(target)
	//    This also has the 'side effect' of appending an svg to the target element 
	//
	//The returned object has attached public and private methods (functions in JavaScript)
	//For instance calling method 'updateAndRenderData()' on the returned object 
	//(e.g. piechart_instance) will render a piechart to the svg
	

	//Delare the main object that will be returned to caller
	var piechartObject = {};
	
	//=================== PUBLIC FUNCTIONS =========================
	//
	piechartObject.overrideDataFieldFunction = function (dataFieldFunction) {
		dataField = dataFieldFunction;
		return piechartObject;
	}
	
	piechartObject.overrideMouseOverFunction = function (callbackFunction) {
		mouseOverFunction = callbackFunction;
		layoutAndRender();
		return piechartObject;
	}
	
	piechartObject.overrideMouseOutFunction = function (callbackFunction) {
		mouseOutFunction = callbackFunction;
		layoutAndRender();
		return piechartObject;
	}
	
	piechartObject.render = function (callbackFunction) {
		layoutAndRender();
		return piechartObject;
	}
	
	piechartObject.loadAndRenderDataset = function (data) {
		dataset=data;
		layoutAndRender();
		return piechartObject;
	}
	
	piechartObject.sort = function () {
		dataset.sort(function (a,b){return dataField(a) - dataField(b)})
		layoutAndRender();
		return piechartObject;
	}
	
	piechartObject.sortR = function () {
		dataset.sort(function (a,b){return dataField(b) - dataField(a)})
		layoutAndRender();
		return piechartObject;
	}
	
	piechartObject.sortKey = function () {
		//Could also utilize d3.descending(a, b) here 
		//but will be nice and explicit with this alpha sort
		dataset.sort(function (a,b){
			if (a.keyField < b.keyField) return -1;
			if (a.keyField > b.keyField) return  1;
			return 0;
		});
		layoutAndRender();
		return piechartObject;
	}
	
	//=================== PRIVATE VARIABLES ====================================
	//Width and height of svg canvas
	var svgWidth = 300; 
	var svgHeight = 300;
	var dataset = [];
	

	//=================== INITIALISATION CODE ====================================
	
	//Declare and append SVG element
	var svg = d3.select(targetDOMelement)
				.append("svg")
				.attr("width", svgWidth)
				.attr("height", svgHeight)
				.classed ("piechart",true);
				
	
	//Declare and append group that we will use tp center the piechart within the svg
	var grp = svg.append("g");
	

	//=================== PRIVATE FUNCTIONS ====================================

	var dataField = function(d){return d.dataField1}
	var GUPkeyField = function(d){return d.data.keyField};
	
	var mouseOverFunction = function (d,i){
		d.data.highlight = "highlight";
		layoutAndRender();
	}
	var mouseOutFunction = function (d,i){
		d.data.highlight = "noHighlight";
		layoutAndRender();
	}

	//Set up shape generator
	var arcShapeGenerator = d3.arc()
		.outerRadius(svgHeight/2)
		.innerRadius(svgHeight/4)
		.padAngle(0.03)
		.cornerRadius(8);

	function layoutAndRender(){
		//Taken and addapted from https://github.com/d3/d3-shape/blob/master/README.md#pie

		//Generate the layout 
		var arcsLayout = d3.pie()
			.value(dataField)
			.sort(null)
			(dataset);

		//center the group within the svg
		grp.attr("transform", "translate("+[svgWidth/2, svgHeight/2]+")")
		
		//Now call the GUP
		GUP_pies(arcsLayout, arcShapeGenerator);		
	}
	
	function GUP_pies(arcsLayout, arcShapeGenerator){

		//GUP = General Update Pattern to render pies 

		//GUP: BIND DATA to DOM placeholders
		var selection = grp.selectAll("path")
			.data(arcsLayout, GUPkeyField)

		//GUP: ENTER SELECTION
		var enterSel = selection
			.enter()
			.append("path")
			.each(function(d) { this.dPrevious = d; }); // store d for use in tweening
			
		enterSel //Add CSS classes	
			.attr("class", d=>("key--"+GUPkeyField(d)))
			.classed("arcs enterSelection", true)
			.classed("highlight", d=>d.highlight)
		
		//Add a tooltip
		enterSel
			.append("title")
				.text(function(d, i) { return JSON.stringify(d.data)});
				
		//GUP UPDATE selection
		var updateSel = selection //update CSS classes
			.classed("updateSelection", true)
			.classed("highlight enterSelection exitSelection", false)
			.classed("highlight", d=>d.highlight)
		
		updateSel
			.select("title") //
			.text(function(d, i) { return JSON.stringify(d.data)});
		
		//GUP ENTER AND UPDATE selection
		//Merge enter and update selections into one selection
		var mergedSel = enterSel.merge(selection)			
		
		mergedSel
			.style("fill",function(d){return d.data.colour })
			.on("mouseover", mouseOverFunction)
			.on("mouseout", mouseOutFunction)
			
		mergedSel
			.transition()
			.duration(750)
			.attrTween("d", arcTween); //Use custom tween to draw arcs

		//Now filter selections to set or reset highlight classes
		//as alternative highlighting method		
		mergedSel
			.filter(function(d) {return d.data.highlight=="highlight"})
				.classed("highlight", true)
				.classed("noHighlight", false);
			
		mergedSel
			.filter(function(d) {return d.data.highlight=="noHighlight"})
				.classed("highlight", false)
				.classed("noHighlight", true);
		
		//GUP EXIT selection 
		selection.exit()
			.classed("highlight updateSelection enterSelection", false)
			.classed("exitSelection", true)
			.remove() 
	};
	
	//Ignore this function unless you really want to know how interpolators work
	function arcTween(dNew) {
		//Create the linear interpolator function
		//this provides a linear interpolation of the start and end angles 
		//stored 'd' (starting at the previous values in 'd' and ending at the new values in 'd')
		var interpolateAngles = d3.interpolate(this.dPrevious, dNew); 
		//Now store new d for next interpoloation
		this.dPrevious = dNew;
		//Return shape (path for the arc) for time t (t goes from 0 ... 1)
		return function(t) {return arcShapeGenerator(interpolateAngles(t)) }; 
	}	
	
	
	//================== IMPORTANT do not delete ==================================
	return piechartObject; // return the main object to the caller to create an instance of the 'class'
	
} //End of piechart() declaration	