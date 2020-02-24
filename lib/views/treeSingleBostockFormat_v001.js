/*-------------------------------------------------------------------- 
  
   Module: tree class implemented in Bostock's functional style
   Author: Mike Chantler
  
   What it does:
  	Renders a tree hierarchy using the GUP
	
		
   Input
	Only accepts 'format 1' 

	
	Format 1: Bostock's json "d3Hierarchy" or "name-children" format

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
			
   Dependencies
  	D3.js v4
  
   Version history
  	v001	17/09/2017	mjc	Created.
  
---------------------------------------------------------------------- */
var hierarchyGraph; //The graph of objects used to represent the hierarchy

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

		
	treeObject.loadAndRenderDataset = function (jsonHierarchy) {
		//Loads and renders a standard (format 1) d3 JSON hierarchy in "d3Hierarchy" or "name-children" format
		
		datasetAsJsonD3Hierarchy=jsonHierarchy;
		//Transform into list of nodes into d3 hierarchy object
		hierarchyGraph = d3.hierarchy(datasetAsJsonD3Hierarchy);
		calculateXYpositionsAndRender(hierarchyGraph);
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
	var listOfNodes; //To be rendered


	//=================== PRIVATE FUNCTIONS ====================================

	var nodeLabelIfNoKey = function(){return "No name set"};
	var appendClickFunction = function(){console.log ("No click fn appended")};
	var clickFunction = function (d,i){console.log("node clicked, d = ",d)}
	var nodeLabel = function(d) {return d.data.name + "(height:"+d.height+")";}
	
	function calculateXYpositionsAndRender(hierarchyGraph){
	
		//get and setup the tree layout generator 
		var myTreeLayoutGenerator = d3.tree().size([height, width]);

		//Add the newly calculated x and y properties to each node
		//in the hierarchy graph.
		var hierarchyGraphWithPositions = myTreeLayoutGenerator(hierarchyGraph);

		//Get lists of nodes and links
		var listOfLinksByDescendants = hierarchyGraphWithPositions.descendants().slice(1);
		listOfNodes = hierarchyGraphWithPositions.descendants(); 
		console.log("listOfLinksByDescendants:", listOfLinksByDescendants)

		//Render links and nodes
		GUPrenderLinks(listOfLinksByDescendants);
		GUPrenderNodes(listOfNodes);		

	}


	function GUPrenderNodes(listOfNodes){
		
		//DATA BIND
		var selection = nodesGroup
			.selectAll("g.cssClassNode") //select groups with class = "cssClassNode"
			.data(listOfNodes, generateUniqueKey);		

		//ENTER  
		var enterSelection = selection
			.enter()
			.append("g")
			.classed("cssClassNode enterSelection", true)
			.on("click", clickFunction)
			
		enterSelection	
			.attr("transform", function(d) { 
				return "translate(" + d.y + "," + d.x + ")"; 
			});	
			
		//Append nodes
		enterSelection
			.append("circle")
			.attr("r", 
			d => 10 
			);
			
		//Append associated leaf node labels
		enterSelection
			//filter depth to get root node
			.filter(d => d.depth == 0)
			.append("text")
			.attr("y", -20)
			.attr("text-anchor", "start")
			.text(nodeLabel);		
		
		enterSelection
			//filter height to get leaf nodes
			.filter(d => d.height == 0)
			.append("text")
			.attr("x", 13)
			.attr("text-anchor", "start")
			.text(nodeLabel);

		//Append associated node labels (but not root or leaves )
		enterSelection
			//filter height to get all but leaf nodes
			.filter(d => {
				return d.height != 0 && d.depth != 0
			})
			.append("text")
			.attr("y", -10)
			.attr("text-anchor", "middle")
			.text(nodeLabel);
		

		//UPDATE 
		selection
			//On update we simply want to transition to new positions
			.classed("enterSelection", false)
			.classed("updateSelection", true)
			.transition()
			.duration(2000)
			.attr("transform", function(d) { 
				return "translate(" + d.y + "," + d.x + ")"; 
			});


		// EXIT 
		selection
			.exit()
			.classed("enterSelection updateSelection", false)
			.classed("exitSelection", true)
			.remove();
	}


	
	function GUPrenderLinks(listOfLinksByDescendants){
		
		// DATA JOIN
		var selection = linksGroup
			.selectAll("path.cssClassLink")
			.data(listOfLinksByDescendants, generateUniqueKey);
			
		//ENTER 
		var enterSel = selection
			.enter()
			.append('path')
			.classed("cssClassLink enterSelection", true);
			
		enterSel
			.attr("d", diagonalShapeGenerator1);
			
		// UPDATE
		selection
			.classed("enterSelection", false)
			.classed("updateSelection", false)			
			.attr("d", diagonalShapeGenerator1);
		
		// EXIT 
		selection
			.exit()
			.classed("enterSelection updateSelection", false)
			.classed("exitSelection", false)
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
	

	
	//================== IMPORTANT do not delete ==================================
	return treeObject; // return the main object to the caller to create an instance of the 'class'
	
} //End of tree() declaration	