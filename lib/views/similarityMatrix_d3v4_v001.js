/*-------------------------------------------------------------------- 
  
   Module: simMatrix class implemented in Bostock's functional style
   Author: Mike Chantler
  
   What it does:
  	Renders a similarity matrix using the GUP
  
   Dependencies
  	D3.js v4
  
   Version history
  	v001	11/10/2018	mjc	Created.

  
---------------------------------------------------------------------- */
"use safe"

function simMatrix(targetDOMelement) { 


	//Delare the main object that will be returned to caller
	var simMatrixObject = {};
	
	//=================== PUBLIC FUNCTIONS =========================
	//

	simMatrixObject.refFormatLoadSimData = function (data) {
		datasetRefFormat=data.map(d=>d); //create local copy of references so that we can sort etc.
		listOfSquares = generateListOfSimSquares(datasetRefFormat);
		listOfLabels = datasetRefFormat.map(topic => topic.words.first3words);
		render(listOfSquares, listOfLabels);
		return simMatrixObject;
	}	
	

	
	simMatrixObject.refLoadAndRenderSimData = function (oneDimSimilarityArray, argListOfLabels){
		listOfSquares = oneDimSimilarityArray;
		listOfLabels = argListOfLabels;
		render(listOfSquares, listOfLabels);

		return simMatrixObject;
	}	
	
	simMatrixObject.setSimCssClass = function (sim, cssClass, set = true){
		//sets the class <cssClass> of all sim squares that are of class sim.xCat AND sim.yCat
		//removes the class <set> == false
		d3.selectAll("."+sim.xCat+"."+sim.yCat).classed(cssClass, set);
		return simMatrixObject;
	}	
	
	simMatrixObject.setSimColRowCssClass = function (sim, cssClass, set = true){
		//sets the class <cssClass> of all sim squares that are of class sim.xCat AND sim.yCat
		//removes the class <set> == false
		d3.selectAll("."+sim.xCat+", ."+sim.yCat).classed(cssClass, set);
		return simMatrixObject;
	}	
	
	

	
	//=================== PRIVATE VARIABLES ====================================
	//Width and height of svg canvas
	var svgWidth = 900; 
	var svgHeight = 900;
	var datasetRefFormat = [];
	var xyScale = d3.scaleBand(); //This is an ordinal (categorical) scale
	var leftLabelSpace = 200; //Space for labels
	var topLabelSpace = 200; //Space for labels

	var maxValueOfDataset; //For manual setting of bar length scaling (only used if .maxValueOfDataset() public method called)
	var listOfSquares = [];
	var listOfLabels;
	//=================== INITIALISATION CODE ====================================
	
	//Declare and append SVG element
	var svg = d3
		.select(targetDOMelement)
		.append("svg")
		.attr("width", svgWidth)
		.attr("height", svgHeight)
		.classed("simMatrix",true);	

	var leftLabelgrp = svg
		.append("g")
		.classed("leftLabelGroup", true)
				
	var topLabelgrp = svg
		.append("g")
		.classed("topLabelGroup", true)	
			
	var simGrp = svg
		.append("g")
		.classed("simMatrixGroup", true)
		
	//===================== ACCESSOR FUNCTIONS =========================================
	
	var GUPsimClasses = sim => (sim.xCat+" "+sim.yCat+" "+generateKey(sim.xCat, sim.yCat));
	var GUPsimKeyField = sim => generateKey(sim.xCat, sim.yCat);
	var GUPsimKeyFieldConjugate = sim => generateKey(sim.yCat, sim.xCat);
	var generateKey = function(a,b){return "GUPsimKey_"+a+"---"+b};
	var opacityFunction = function (d) {
		if (d.xCat == d.yCat) return 1.0;
		else return d.similarity/maxSimilarity;
	}
	
	//=================== OTHER PRIVATE FUNCTIONS ====================================	
	
	var appendedMouseOutFunction = function(){};
		
	var appendedMouseOverFunction = function(){};
		
	var mouseOverFunction = function (d,i){
        d3.select(this).classed("highlight", true)//.style("opacity", 1.0);
		d3.select(".leftLabel."+d.yCat).classed("highlight", true)
		d3.select(".bottomLabel."+d.xCat).classed("highlight", true)
		appendedMouseOverFunction(d,i);
	}
	
	var mouseOutFunction = function (d,i){
        d3.select(this).classed("highlight", false)//.style("opacity", d=>d.similarity);
		d3.select(".leftLabel."+d.yCat).classed("highlight", false)
		d3.select(".bottomLabel."+d.xCat).classed("highlight", false)
		appendedMouseOutFunction(d,i);
	}	
	
	var mouseClickFunction = function (d,i){console.log("d= ", d)}

	function render (listOfSquares, listOfLabels) {
		updateScales(listOfLabels);
		GUP_squares(listOfSquares);
		GUP_leftLabels(listOfLabels);
		GUP_topLabels(listOfLabels);
	}
	
	function updateScales(listOfLabels){
		xyScale
			.domain(listOfLabels) //Load y-axis categories into xyScale
			.rangeRound([25, svgHeight-340])
			.padding([.0]);
	};
	
	
	function GUP_squares(listOfSquares){
		//First find max value of similarity (excluding diagonals)
		maxSimilarity = 0;
		listOfSquares.forEach(function(sim){
			if(sim.xCat != sim.yCat) 
				maxSimilarity = d3.max([sim.similarity, maxSimilarity]);
		})
		

		//GUP: BIND DATA to DOM placeholders
		var selectionGrp = simGrp
			.selectAll(".square")
			.data(listOfSquares.filter(d=>d.active), GUPsimKeyField)
			
			
		//GUP: ENTER Selection
		var enterSelectionGrp = selectionGrp
			.enter()
			.append("g")
			.attr("class", GUPsimClasses)
			.classed("square enterSelection", true)
			.classed("diagonal", d => (d.xCat == d.yCat));
		
		enterSelectionGrp
			.append("title")
			.text(d => (d.yCat + " to " + d.xCat + ", similarity = " +d.similarity ));
			
		enterSelectionSimSquare = enterSelectionGrp
			.append("rect")
				.attr("width", function(d) {return xyScale.bandwidth()})
				.attr("height", function(){return xyScale.bandwidth()})
				.style("fill-opacity", opacityFunction)

		

		//GUP UPDATE (anything that is already on the page)
		selectionGrp //update CSS classes
			.classed("updateSelection", true)
			.classed("enterSelection exitSelection", false)
			.select ("rect")
				.attr("width", function(d) {return xyScale.bandwidth()})
				.attr("height", function(){return xyScale.bandwidth()})
				.style("fill-opacity", opacityFunction)		
	
		//GUP: Merged Enter & Update selections (so we don't write these twice) 
		var mergedSelGrp = enterSelectionGrp.merge(selectionGrp);
		mergedSelGrp
			.attr("transform", function(d){
				var x = leftLabelSpace + xyScale(d.xCat);
				var y = topLabelSpace + xyScale(d.yCat);
				return ("transform", "translate(" + x + "," + y + ")")
			})
			.on("mouseover", mouseOverFunction)
			.on("mouseout", mouseOutFunction)
			.on("click", mouseClickFunction)			
			
		//GUP EXIT selection 
		var exitSel = selectionGrp.exit()
			.classed("updateSelection enterSelection", false)
			.classed("exitSelection", true)
			.transition().duration(2000)
			.attr("transform", function(d){
				var x = 0;
				var y = 0;
				return ("transform", "translate(" + x + "," + y + ")")
			})
			.remove() 

	};

	function GUP_leftLabels(listOfLabels){
		//GUP: BIND DATA to DOM placeholders
		var selection = leftLabelgrp
			.selectAll(".leftLabel")
			.data(listOfLabels)	
	
	   //GUP: ENTER SELECTION 
		var enterSelection = selection 
			.enter()
			.append("text")
			.attr ("class", d=>d)
			.classed("leftLabel enterSel", true)

		//GUP: UPDATE SELECTIONS
		selection
			.classed("enterSel", false)	
			.classed("updateSel", true)	
	
		//GUP: ENTER + UPDATE SELECTIONS	
		var enterUpdate = enterSelection.merge(selection)
			.attr("y", d => (xyScale(d)+topLabelSpace+10) )
			.attr("x", leftLabelSpace )
			.text(d=>d)	

		enterUpdate.on("click", d=>console.log("leftLabel d: ", d))
		//GUP: EXIT selection 
		var exitSel = selection.exit().remove();
	}

	function GUP_topLabels(listOfLabels){
		//GUP: BIND DATA to DOM placeholders
		var selection = topLabelgrp
			.selectAll(".bottomLabel")
			.data(listOfLabels, d=>d)		
	   //GUP: ENTER SELECTION 
		var enterSelection = selection //Create DOM rectangles, positioned @ x=leftLabelSpace
			.enter()
			.append("text")
			.attr ("class", d=>d)
			.classed("bottomLabel", true)
		//GUP: ENTER + UPDATE SELECTIONS	
		var enterUpdate = enterSelection.merge(selection)		
			.attr("x", d => (leftLabelSpace + 5 + xyScale(d)) )
			.attr("y", topLabelSpace+10 )
			.text(d=>d)
		enterUpdate.on("click", d=>console.log("bottom Label d: ", d)	)					
		var exitSel = selection.exit().remove();
		//GUP: EXIT selection 
		var exitSel = selection.exit().remove();
	}

	function generateListOfSimSquares(datasetRefFormat){
		//Generate complete list of similarities as a flat array 
		//so that they can be easily manipulated by GUP etc.
		listOfSquares = [];

		//Convert array of similarity matrices into flat array
		datasetRefFormat.forEach(function(xTopic, xIndex){
			xTopic.similarities.forEach(function(similarity, yIndex){
				var xCat = dataModel.topics[xIndex].words.first3words;
				var yCat = dataModel.topics[yIndex].words.first3words;
				var obj = {
					"similarity":similarity, 
					"xCat":xCat,
					"yCat":yCat,
					"key": "xCat_"+xCat+"___yCat_"+yCat
				}
				listOfSquares.push (obj);
			})
		})			
		console.log ("listOfSquares = ", listOfSquares);
		return listOfSquares;
	}

	
	
	//================== IMPORTANT do not delete ==================================
	return simMatrixObject; // return the main object to the caller to create an instance of the 'class'
	
} //End of simMatrix() declaration	

