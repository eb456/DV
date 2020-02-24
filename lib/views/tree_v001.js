/*-------------------------------------------------------------------- 
  
   Module: tree class implemented in Bostock's functional style
   Author: Mike Chantler
  
   What it does:
  	Renders a tree hierarchy using the GUP
	
	It has a collapse/reveal child nodes behaviour on clicking a node.
	The key to understanding this is to read the comments on the click
	callback function (clickFunction()).


	
   Input
	Accept two formats:

	
	Format 1: "d3Hierarchy" or "name-children" format

     This is a hierarchy, in 'name', 'children' format with single top-level object 
	 i.e. var treeData = {"name":"node name", "children":[{...},{...}...  {...}] }
	 
	 In format at https://bl.ocks.org/d3noob/43a860bc0024792f8803bba8ca0d5ecd
	 And shown below:
	 
			{
			  "name": "Top Level",
			  "children": [
				{ 
				  "name": "Level 2: A",
				  "children": [
					  { "name": "Son of A" },
					  { "name": "Daughter of A" }
				  ]
			    },
			    { "name": "Level 2: B" }
			  ]
			};

	Format 2: "nest" or "key-values" format
	 This is the same format as provided by d3.nest
	 (an array of objects with "key" and "values" fields)
	 as below:
	 
			[
			  {
				"key": "RP",
				"values": [
				  {
					"key": "tab",
					"values": [
					  {
						"date": "2011-11-14T16:17:54Z",
						"quantity": 2,
						"waiter": "RP",
						"tip": 100,
						"method": "tab"
					  }
					]
				  }
				]
			  },
			  {
				"key": "BS",
				"values": [
				  {
					"key": "cash",
					"values": [
					  {				etc.
					  
					  
	Format 3: Flat data, example below:
	
		var flatDataset = [
			{date: "2011-11-14T16:17:54Z", quantity: 2, waiter: "RP", tip: 100, method: "tab"},
			{date: "2011-11-14T16:20:19Z", quantity: 2, waiter: "RP", tip: 100, method: "tab"},
			{date: "2011-11-14T17:25:45Z", quantity: 2, waiter: "BS", tip: 120, method: "cash"},
			{date: "2011-11-14T17:25:45Z", quantity: 2, waiter: "BS", tip: 120, method: "cash"},
			{date: "2011-11-14T17:29:52Z", quantity: 1, waiter: "BS", tip: 100, method: "visa"}
		];
  
   Dependencies
  	D3.js v4
  
   Version history
  	v001	17/09/2017	mjc	Created.
  
---------------------------------------------------------------------- */
var hierarchyGraph; //The graph of objects used to represent the hierachy

function tree(targetDOMelement) { 
	//Here we use a function declaration to imitate a 'class' definition
	//
	//Invoking the function will return an object (treeObject)
	//    e.g. tree_instance = tree(target)
	//    This also has the 'side effect' of appending an svg to the target element 
	//
	//The returned object has attached public and private methods (functions in JavaScript)
	//For instance calling method 'updateAndRenderData()' on the returned object 
	//(e.g. tree_instance) will render a tree to the svg
	
	
	

	//Delare the main object that will be returned to caller
	var treeObject = {};
	
	
	
	
	//=================== PUBLIC FUNCTIONS =========================
	//


	treeObject.addCSSClassesToDOMelements = function (selectors, cssClassName, trueFalse) {
		//Method to add the class <cssClassName> to all DOM elements that have at least one of the
		// selectors (e.g. classes) contained in the array <selectors>
		// (allows easy highlighting of multiple nodes)
		//
		//Selectors is an array of css selectors (e.g. .class and #id),
		//an example of cssClassName would be: "highlight", and
		//trueFalse must either be true (set the cssClassName) or false (remove the cssClassName)
		
		selectors.forEach(s => grp.selectAll(s).classed(cssClassName, trueFalse))
		return treeObject; //for method chaining
	}
		
	treeObject.loadAndRenderDataset = function (jsonHierarchy) {
		//Loads and renders a standard (format 1) d3 JSON hierarchy in "d3Hierarchy" or "name-children" format
		
		datasetAsJsonD3Hierarchy=jsonHierarchy;
		//Transform into list of nodes into d3 hierarchy object
		hierarchyGraph = d3.hierarchy(datasetAsJsonD3Hierarchy);
		addTreeXYdataAndRender(hierarchyGraph);
		return treeObject; //for method chaining
	} 

	treeObject.loadAndRenderNestDataset = function (nestFormatHierarchy, rootName) {
		//Loads and renders (format 2) hierarchy in "nest" or "key-values" format.
		layoutAndRenderHierarchyInNestFormat(nestFormatHierarchy, rootName)
		return treeObject; //for method chaining
	}	
	
	treeObject.loadAndRenderFlatDataset = function (flatDataset, rootName, keys) {
		//Create nest from flat data
		//Note that keys = an array acessor functions such as d => d["Institution name"]
		nestFormatHierarchy=createNestFormatHierarchyFromFlatDataset(flatDataset, keys);
		layoutAndRenderHierarchyInNestFormat(nestFormatHierarchy, rootName)		
		return treeObject; //for method chaining
	}
	
	treeObject.nodeLabelIfNoKey = function (fn) {
		//Leaf nodes from d3.nest typically have no 'key' property
		//By default the d3.nest 'key' property is used as the node text label
		//If this does not exist the nodeLabelIfNoKey() function will be called to 
		// provide the label
		nodeLabelIfNoKey = fn;
		return treeObject; //for method chaining
	}

	treeObject.appendClickFunction = function (fn) {
		//Instead of overriding the internal click function
		//this will append the invocation of 'fn' to the end of it
		appendClickFunction = fn;
		return treeObject; //for method chaining
	}
	
	treeObject.getDatasetAsJsonD3Hierarchy = function () {
		return datasetAsJsonD3Hierarchy; 
	}
	
	
	//=================== PRIVATE VARIABLES ====================================
	
	//Declare and append SVG element
	var margin = {top: 20, right: 200, bottom: 20, left: 50},
	width = 800 - margin.right - margin.left,
	height = 500 - margin.top - margin.bottom;

	//Set up SVG and append group to act as container for tree graph
	var grp = d3.select(targetDOMelement).append("svg")
		.attr("width", width + margin.right + margin.left)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	//Add group for the nodes, just for clarity in viewing the svg
	var nodesGroup = grp
		.append("g")
		.classed("nodesGroup", true);
	//Add group for the links, just for clarity in viewing the svg
	var linksGroup = grp
		.append("g")
		.classed("linksGroup", true);
 
	var datasetAsJsonD3Hierarchy; //Hierarchy in JSON form (suitable for use in d3.hierarchy 
//	var hierarchyGraph; //The graph of objects used to represent the hierachy
	var clickedNode; //This is the 'clicked' node in a collapse or uncollapse animation
	var listOfNodes; //To be rendered


	//=================== PRIVATE FUNCTIONS ====================================

	var nodeLabelIfNoKey = function(){return "No name set"};
	var appendClickFunction = function(){console.log ("No click fn appended")};

	var clickFunction = function (clickedNode,i){

		if (clickedNode.children) {
			hideChildren(clickedNode)
		}
		else {
			//Reveal children
			revealChildren(clickedNode);
			
			//Store the position of the clicked node 
			//so that we can use it as the starting position 
			//for the revealed children in the GUP Node Enter Selection
			clickedNode.xAtEndPreviousGUPrun = clickedNode.x; 
			clickedNode.yAtEndPreviousGUPrun = clickedNode.y;	
		}
		
		//Now calculate new x,y positions for all visible nodes and render in GUP
		calculateXYpositionsAndRender(hierarchyGraph, clickedNode);
		
		//Now do anything else (e.g. interactions as specified in the pbulic 
		//method appendClickFunction()
		appendClickFunction(clickedNode,i );
	}
	
	function hideChildren(node) {
		if (node.children) { 
			node._children = node.children;
			node.children = null;
		} 
	}
	
	function revealChildren(node) {
		if (node._children) { 		
			node.children = node._children;
			node._children = null;
		}
	}
	
	function hideUnhideChildren(d) {
		var clickedNode = d;
		if (clickedNode.children) { 
			//Hide children
			clickedNode._children = d.children;
			clickedNode.children = null;

		} else {
			//Reveal children
			clickedNode.children = clickedNode._children;
			clickedNode._children = null;
			clickedNode.xAtEndPreviousGUPrun = clickedNode.x; 
			clickedNode.yAtEndPreviousGUPrun = clickedNode.y;		}
	}

	var nodeLabel = function(d) {return d.data.name + "(height:"+d.height+")";}
	
	function layoutAndRenderHierarchyInNestFormat (nestFormatHierarchy, rootName){

		//Move the 'nest' array into a root node:
		datasetAsJsonD3Hierarchy = {"key":rootName, "values": nestFormatHierarchy}

		//Now create hierarchy structure 
		//(but need to copy 'values' attributes into "children" attributes
		function childrenAcessor(d){return d.values} 
		hierarchyGraph = d3.hierarchy(datasetAsJsonD3Hierarchy, childrenAcessor);

		//And we'll use the nest 'keys' as the node labels
		nodeLabel = function(d) {
			if (d.data.key) return d.data.key + "(height:"+ d.height+")";
			else return nodeLabelIfNoKey(d);
		}

		//And perform layout
		addTreeXYdataAndRender(hierarchyGraph);
	}


	function addTreeXYdataAndRender(hierarchyGraph){
		
		var rootNode = hierarchyGraph;

		//Set 'clicked node' node to root of hierarchy to start
		//as we want all nodes to appear from the root on startup
		clickedNode = rootNode;

		//And set it's 'previous' position to (0,0) as we'll 
		//start drawing from there
		clickedNode.xAtEndPreviousGUPrun=clickedNode.yAtEndPreviousGUPrun=0;

		//Now we'll hide all nodes except the root and the next level down 
		//to dreate a compact tree to start the dashboard
		rootNode.descendants().forEach(node => {if(node.depth - 0) hideChildren(node)})

		//Add (x,y) positions of all visible nodes and render
		calculateXYpositionsAndRender(hierarchyGraph, clickedNode);

	}
	
	function calculateXYpositionsAndRender(hierarchyGraph, clickedNode){
		//Note that the 'clickedNode' is the clicked node in a collapse or
		//uncollapse animation
		//For a colapse, we want all children of the clicked node converge upon the
		//the clicked node's final position (in the current GUP animation) and then exit.
		
		//get and setup the tree layout generator 
		var myTreeLayoutGenerator = d3.tree().size([height, width]);

		//Add the newly calculated x and y properies to each node
		//in the hierarcy graph.
		var hierarchyGraphWithPositions = myTreeLayoutGenerator(hierarchyGraph);

		//Get lists of nodes and links
		var listOfLinksByDescendants = hierarchyGraphWithPositions.descendants().slice(1);
		listOfNodes = hierarchyGraphWithPositions.descendants(); //Note that the x,y values are the 
													//final positions we want for the graph
													//i.e. values after transitions

		//Render links and nodes
		GUPrenderLinks(listOfLinksByDescendants, clickedNode);
		GUPrenderNodes(listOfNodes, clickedNode);		

	}


	function GUPrenderNodes(listOfNodes, clickedNode){
		
		//DATA BIND
		var selection = nodesGroup
			.selectAll("g.cssClassNode") //select groups with class = "cssClassNode"
			.data(listOfNodes, generateUniqueKey);		

		//ENTER  
		var enterSelection = selection
			.enter()
			.append("g")
			.attr("class", d=>{if(d.data.key) return "nest-key--"+d.data.key.replace(/[\W]+/g,"_"); else return "No key";})
			.classed("cssClassNode enterSelection", true)
			.on("click", clickFunction)
			
		//transitions
		enterSelection	
			.attr("transform", function(d) { 
				//
				//We have two situations where we have nodes in the Enter Selection
				//   a) after  invocation of addTreeXYdataAndRender() we have to render
				//      the new hierarchy.
				//   b) after a node 'click' event that causes an a node to be expanded
				//      (or un-collapsed) then the Enter Selection will contain all the 
				//      (previously hidden) child nodes of the clicked node. 
				//      In this case we need to first set (transform) these newly revealed nodes to suitable 
				//      'start positions', and only then transform them into the final
				//      positions as determined by the last run of the d3.tree layout algorithm.
				//      The 'start positions' of newly revealed children are set to the position of
				//		their parent (i.e. the clicked node) when it was clicked .
				return "translate(" + clickedNode.yAtEndPreviousGUPrun + "," + clickedNode.xAtEndPreviousGUPrun + ")"; 
			})
			//Transition to final entry positions
			.transition()
			.duration(2000)
			.attr("transform", function(d) { 
				return "translate(" + d.y + "," + d.x + ")"; 
			});	
			
		//Append nodes
		enterSelection
			.append("circle")
			.attr("r", d => 10 );
			
		//Append holders for leaf node labels
		enterSelection
			.append("text")


		//UPDATE 
		selection
			//On update we simply want to update the classes 
			//and transition to new positions
			.classed("enterSelection", false)
			.classed("updateSelection", true)
			.transition()
			.duration(2000)
			.attr("transform", function(d) { 
				return "translate(" + d.y + "," + d.x + ")"; 
			});
			

		//ENTER + UPDATE 
		enterUpdateSelectionGroup = enterSelection.merge(selection)
			
		enterUpdateSelectionGroup
			//set appropriate classes for the group
			.classed("leafNode", d => d.height == 0)
			.classed("rootNode", d => d.depth == 0)
			.classed("intermediateNode", d => (d.height != 0 && d.depth != 0));
		
		enterUpdateSelectionGroup
			//add label text to the text elements within the groups
			.select("text")
				.text(nodeLabel);


		// EXIT 
		selection
			.exit()
			.classed("enterSelection updateSelection", false)
			.classed("exitSelection", true)
			//Move departing nodes to clicked node and remove.
			.transition()
			.duration(2000)
			.attr("transform", function(d) {
				d.x =  clickedNode.x; 
				d.y =  clickedNode.y;
				return "translate(" + d.y + "," + d.x + ")";
			})
			.remove();
	}


	
	function GUPrenderLinks(listOfLinksByDescendants, clickedNode){
		
		// DATA JOIN
		var selection = linksGroup
			.selectAll("path.cssClassLink")
			.data(listOfLinksByDescendants, generateUniqueKey);
			
		//ENTER 
		var enterSel = selection
			.enter()
			.append('path')
			.attr("id", (d, i) => "link key "+d.key)
			.classed("cssClassLink enterSelection", true);
			
		enterSel
			.attr('d', function(d){
				var o = {x:clickedNode.xAtEndPreviousGUPrun, y:clickedNode.yAtEndPreviousGUPrun}
				return diagonalShapeGenerator2(o, o);
			})
			.transition()
			.duration(2000)
			.attr("d", diagonalShapeGenerator1);
			
		// UPDATE
		selection
			.classed("enterSelection", false)
			.classed("updateSelection", false)			
			.transition()
			.duration(2000)
			.attr("d", diagonalShapeGenerator1);
		
		// EXIT 
		selection
			.exit()
			.classed("enterSelection updateSelection", false)
			.classed("exitSelection", false)
			.transition()
			.duration(2000)
			.attr('d', function(d){
				return diagonalShapeGenerator2(clickedNode, clickedNode);
			})
			.remove();			
	}


	//Define the diagonal path shape generator function
	function diagonalShapeGenerator1(d){
		source = d.parent;
		descendant = d;
		return diagonalShapeGenerator2(source, descendant);
	}	
	
	//Define the diagonal path shape generator function
	function diagonalShapeGenerator2(source, descendant){
		return "M" + source.y + "," + source.x
			+ "C" + (source.y + descendant.y) / 2 + "," + source.x
			+ " " + (source.y + descendant.y) / 2 + "," + descendant.x
			+ " " + descendant.y + "," + descendant.x;
	}	
	
	//Define key generator
	var lastKey=0;
	function generateUniqueKey(d) {
		//If no key then generate new unique key, assign it, and return to caller 
		if(!d.hasOwnProperty("key")) d.key = ++lastKey;
		return d.key;
	}
	
	function createNestFormatHierarchyFromFlatDataset(flatDataset, keyFunctions){
		function applyKey(keyFunction, i){
			hierarchy = hierarchy.key(keyFunction);
		}		
		var hierarchy = d3.nest();
		
		keyFunctions.forEach(applyKey);
		
		hierarchy = hierarchy.entries(flatDataset); 

		return hierarchy;
	}	
	
	//================== IMPORTANT do not delete ==================================
	return treeObject; // return the main object to the caller to create an instance of the 'class'
	
} //End of tree() declaration	