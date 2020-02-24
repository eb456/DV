/*-------------------------------------------------------------------- 
  
   Module: agglomerative clustering class implemented in Bostock's functional style
   Author: Mike Chantler
  
   What it does:
  	Performs aggloerative clustering 
	Produces a linkage table given a similarity matrix
  
   Dependencies
  	D3.js v4
  
   Version history
  	v001	11/10/2018	mjc	Created.

  
---------------------------------------------------------------------- */
"use safe"

function agglomCluster() { 


	//Delare the main object that will be returned to caller
	var agglomClusterObject = {};
	
	//=================== PUBLIC FUNCTIONS =========================
	//

	agglomClusterObject.refFormatLoadSimData = function (data) {
		//Load in REF format data and create 1d and 2d similarity matrices
		
		datasetRefFormat=data.map(d=>d); //create local copy of references so that we can sort etc.
		generateOneAnd2dMatrixForms(datasetRefFormat);
		listOfCategories = datasetRefFormat.map(topic => topic.words.first3words);
		listOfCategoryObj = datasetRefFormat.map(function(topic,i){return {nodeIndex: i, cat:topic.words.first3words, active:true, topic:topic}})
		linkageTable = datasetRefFormat.map(function(topic,i){
			return {nodeIndex: i, cat:topic.words.first3words, active:true, topic:topic, leaf:true}})
		nodeIndex = listOfCategories.length;
		return agglomClusterObject;
	}	

	agglomClusterObject.performAgglomerativeClustering = function () {
		//Perform agglomerative clustering
		while (oneDsimMatrix.filter(s=>s.active).length > 1.5) {
			createAgglomerativeNode(nodeIndex);
			nodeIndex++;
		}
		return agglomClusterObject;
	}	

	agglomClusterObject.oneDsimMatrix = function (data) {
		return oneDsimMatrix;
	}

	agglomClusterObject.twoDsimMatrix = function (data) {
		return twoDsimMatrix;
	}		
	
	agglomClusterObject.listOfCategories = function (data) {
		return listOfCategories;
	}

	agglomClusterObject.listOfCategoryObj = function (data) {
		return listOfCategoryObj;
	}	

	agglomClusterObject.linkageTable = function (data) {
		return linkageTable;
	}	

	
	//****************** SINGLE STEP METHODS ********************
	
	//The next three methods allow you to single through adding one new cluster
	agglomClusterObject.maxSim = function(){
		return getMaxSim();
	}

	agglomClusterObject.inactivateOldRowsAndColums = function(simObj){
		deactivateRowsColsofNode(simObj);
		return agglomClusterObject;
	}
	
	agglomClusterObject.addCluster = function(simOfChildNodesToBeJoined, newNodeLabel){
		createCluster(simOfChildNodesToBeJoined, newNodeLabel)
		return agglomClusterObject;
	}
	
	//createAgglomerativeNode - executes above tree steps in one go 
	agglomClusterObject.createAgglomerativeNode = function () {
		createAgglomerativeNode(nodeIndex);
		nodeIndex++;
		return agglomClusterObject;
	}		 




	
	//=================== PRIVATE VARIABLES ====================================
	var datasetRefFormat = [];
	var listOfCategories = []; //Similarity labels or categories
	var listOfCategoryObj = []; //Array of object representing similarity labels or categories
	var oneDsimMatrix = [];
	var twoDsimMatrix = []; //format: twoDsimMatrix[colNumber][rowNumber] = twoDsimMatrix[xIndex][yIndex]
	var linkageTable = [];
	var nodeIndex; //Index for new nodes
	
	
	//=================== PRIVATE FUNCTIONS ====================================

	function createAgglomerativeNode(nodeIndex){
		var maxSimNode = getMaxSim();
		createCluster (maxSimNode, nodeIndex);
		deactivateRowsColsofNode(maxSimNode);
		return agglomClusterObject;
	}
	
		
	function getMaxSim() {
		var maxSimValue = -1;
		var maxSimObj ={};
		oneDsimMatrix.forEach(function (s, index){
			if (!s.diagonal && s.active && s.similarity > maxSimValue){ 
				maxSimValue = s.similarity;
				maxSimObj = s;
			}
		})
		//return clone of maxSimObj
		return Object.assign({}, maxSimObj);
	}


	function deactivateRowsColsofNode(simObj) {
		//Get the two node numbers of the two nodes that we are removing
		var nodeAnumber = simObj.xIndex;
		var nodeBnumber = simObj.yIndex;
		oneDsimMatrix.forEach(function (sim){ 
			if (sim.xIndex == nodeAnumber ||
				sim.yIndex == nodeAnumber ||
				sim.yIndex == nodeBnumber ||
				sim.xIndex == nodeBnumber) 
			{sim.active = false}
		})		
		listOfCategoryObj[nodeAnumber].active = false;
		listOfCategoryObj[nodeBnumber].active = false;
	}
	
	var linkageCriteria =  function(simA, simB) {return d3.mean([simA, simB])} 

	function generateOneAnd2dMatrixForms(datasetRefFormat){
		//Generate complete list of similarities as a flat array 
		//so that they can be easily manipulated by GUP etc.
		var maxSim = 0;

		//Convert array of similarity matrices into flat array
		var oneDindex = 0;
		datasetRefFormat.forEach(function(xTopic, xIndex){
			twoDsimMatrix[xIndex] = [];
			xTopic.similarities.forEach(function(similarity, yIndex){
				var xCat = dataModel.topics[xIndex].words.first3words;
				var yCat = dataModel.topics[yIndex].words.first3words;
				if(xCat == yCat) {similarity = 0; diagonal = true} else {diagonal = false}
				var obj = {
					similarity:similarity, 
					xCat:xCat, "yCat":yCat,
					xIndex:xIndex, "yIndex":yIndex,
					diagonal: diagonal,
					active: true //true if still part of clustering process
				}
				oneDsimMatrix[oneDindex] = obj;
				twoDsimMatrix[xIndex][yIndex] = oneDsimMatrix[oneDindex];
				oneDindex++;
			})
		})			
	}
	
	function createCluster (simOfChildNodesToBeJoined, nodeIndex) {
		//This method adds a new row and a new column to the matrix to represent the new cluster
		//The new cluster (node) represents the union of xCat and yCat nodes 
		//
		//First: add node for new cluster to linkage table:
		var newnode = {
			nodeIndex:nodeIndex,
			similarity:simOfChildNodesToBeJoined,
			children:[simOfChildNodesToBeJoined.xIndex, simOfChildNodesToBeJoined.yIndex]
		}
		linkageTable.push(newnode)


		//The rest of this function adds the new row and column corresponding to the new cluster 
		//to the similarity matrix		
		//
		//The cells of the new row are assigned a similarity value determined by the linkageCriteria
		//using the cells of the xCat and yCat rows
		//
		//The cells of the new column are assigned a similarity value determined by the linkageCriteria
		//using the cells of the xCat and yCat columns
		//
		//note format: twoDsimMatrix[colNumber][rowNumber] = twoDsimMatrix[xIndex][yIndex]




		
		
		//Get the two node numbers of the two nodes that we are joining into a new cluster
		var nodeAnumber = simOfChildNodesToBeJoined.xIndex;
		var nodeBnumber = simOfChildNodesToBeJoined.yIndex;
		var xCat, yCat, newSimilarity, similarityA, similarityB;

		var new_xIndex = listOfCategories.length;
		var new_yIndex = listOfCategories.length;
		originalListOfCategories = listOfCategories.map(cat=>cat); 
		listOfCategories[new_xIndex] = nodeIndex;
		listOfCategoryObj[new_xIndex] = {nodeIndex:nodeIndex, cat:nodeIndex, active:true};


		//Add new column at right of matrix
		twoDsimMatrix[new_xIndex] = [];
		xCat = nodeIndex;
 		originalListOfCategories.forEach(function(category, yIndex){
		
			yCat = category;
			if (yIndex != new_xIndex && yIndex != listOfCategories.length-1){
				similarityA = twoDsimMatrix[nodeAnumber][yIndex].similarity;
				similarityB = twoDsimMatrix[nodeBnumber][yIndex].similarity;
			}
			active = listOfCategoryObj[yIndex].active; //don't sim of inactive categories active
			newSimilarity 
				= createNewSim(new_xIndex, yIndex, xCat, yCat, similarityA, similarityB, active)			
			oneDsimMatrix.push(newSimilarity)
			twoDsimMatrix[new_xIndex][yIndex] = newSimilarity;	
		})

		//Add new row to  end of matrix
		yCat = nodeIndex;
		originalListOfCategories.forEach(function(category,xIndex){
			xCat = category;
			similarityA = twoDsimMatrix[xIndex][nodeAnumber].similarity;
			similarityB = twoDsimMatrix[xIndex][nodeBnumber].similarity;
			active = listOfCategoryObj[xIndex].active; //don't sim of inactive categories active
			newSimilarity 
				= createNewSim(xIndex, new_yIndex, xCat, yCat, similarityA, similarityB, active)
			oneDsimMatrix.push(newSimilarity)
			twoDsimMatrix[xIndex][new_yIndex] = newSimilarity;	
		})	

		//Add final diagonal element
		xCat = yCat = nodeIndex;
		newSimilarity 
			= createNewSim(new_xIndex, new_yIndex, xCat, yCat, 0, 0, true)
		oneDsimMatrix.push(newSimilarity)
		twoDsimMatrix[new_xIndex][new_yIndex] = newSimilarity;
		
		return agglomClusterObject;
	}	

	
	function createNewSim(xIndex, yIndex, xCat, yCat, similarityA, similarityB, active){
		//Returns a sim object
		var simValue, diagonal;
		if (xIndex == yIndex){simValue = 0;  diagonal = true;} //sim is on diagonal
		else simValue = linkageCriteria(similarityA,similarityB);

		return {
			similarity: simValue,
			xCat: xCat,
			xIndex: xIndex, //colNumber
			yCat: yCat,
			yIndex: yIndex, //rowNumber
			diagonal: diagonal,
			active: active,
		}
	}		
	
	//================== IMPORTANT do not delete ==================================
	return agglomClusterObject; // return the main object to the caller to create an instance of the 'class'
	
} //End of agglomCluster() declaration	

