var recoveryMechanism = (function() {
	var module = {};

	var PERSON_INDEX_PUB = 0;
	var SCENE_INDEX_PUB = 1;
	var ACTION_INDEX_PRI = 1;
	var OBJECT_INDEX_PRI = 2;
	var MINIMUM_STORY_COUNT = 5;
	var NUM_OF_ROUNDS = 5;

	var hashResults = [];
	var recoveryResult = null;
	var groupIndex;
	var missingStoryIndex;
	var inputIndicesList;

	function makeHashStringIntoList (string) {
		return string.split('&&&&&&');
	}

	//recursively compute (bank.size choose k)
	//does so with any set of objects denoted as bank
	function computeCombinationsOfSizeK (bank, k) {
		
		if (bank.length < k) {
			return [[]];
		} else if (bank.length === k) {
			return [bank];
		} else if (k === 1) {
			return bank.map( function (e) {return [e];} );
		} else {
			var result = [];
			var withFirst = computeCombinationsOfSizeK(bank.slice(1), k-1);
			var withOutFirst = computeCombinationsOfSizeK(bank.slice(1), k);

			for (var i=0; i<withFirst.length; i++) {
				var first = [bank[0]];
				first.push.apply(first, withFirst[i]);
				result.push(first);
			}
			withOutFirst.map( function (e) {result.push(e);} );
			return result;
		}
	}
//////////////////////////////////////////////////////////////////

	function isSubset (A, B) {
		//checks if A is a subset of B
		for (int i=0;i<A.length;i++) {
			var found = false;
			int j = 0;
			while (!found && j < B.length){
				if (A[i] == B[j]) found = true;
				j++;
			}
			if (found == false) return false;
		}
		return true;
	}


	function impact (S, subs) {
		var num_of_subsets = 0;
		for (int i=0;i<subs.length;i++) {
			if (isSubset(subs[i],S) num_of_subsets++;
		}
		return num_of_subsets;
	}

	function deleteSubsets (S, subs) {
		var size = subs.length;
		for (int i=0;i<size;i++) {
			if (isSubset(subs[i],S) subs = subs.splice(i,1);
		}
	}

	function computeSelectedCombosOfSizeK (bank, k) {
		//translation of python prog into javascript
		//calculating selected combos - min superset cover
		var subsets = computeCombinationsOfSizeK(bank,k-1);
		var supersets = computeCombinationsOfSizeK(bank,k);
		//want to loop through all the supersets and figure out which of these
		//has the greatest number of subsets in "subsets". 
		var filteredSubs = [];
		var maxImpact,maxS;
		while (subsets.length > 0) {
			maxImpact = 0;
			maxS = [];
			for (int i=0;i<supersets.length;i++){
				if (maxS == []) maxS = supersets[i];
				if (impact(supersets[i],subsets) > maxImpact){
					maxImpact = impact(supersets[i],subsets);
					maxS = supersets[i];	
				}
			}
				
			filteredSubs.push(maxS);
			deleteSubsets(maxS,subsets);
		}
		return filteredSubs;
	}

/////////////////////////////////////////////////////////////////////

	function compareHashToExistingOnes (hashResult) {
		//true if hashResult is found in allHashes; false otherwise
		var temp, group, hashPlusGroup, storedHash;
		//grab stored hashes from dropBox for given group

		var storedHashes = makeHashStringIntoList(
				storyMode.getGroupHashesList()[groupIndex]);

		for (var i=0; i<storedHashes.length; i++) {
			hashPlusGroup = storedHashes[i];
			temp = hashPlusGroup.split('$$$$$$');
			storedHash = temp[0];
			group = temp[1];
			if (hashResult === storedHash) {
				return [true, group];
			}
		}
		return [false, null];
	}
	function convertIndicesStringToArray (indicesString) {
		var result = [];
		for (var i=0; i<indicesString.length; i++) {
			var intString = indicesString.charAt(i);
			if (intString == 'a') {
				result.push(10);
			} else if (intString == 'b') {
				result.push(11);
			} else {
				result.push(parseInt(intString));
			}
		}
		return result;
	}
	function callbackFnForGroupHashes (hash, groupIndicesString) {
		hashResults.push(hash + '$$$$$$' + groupIndicesString);
		//string and hash seperated by '$$$$$$'
		//for DEBUGGING NOW
		//console.log('the string ' + string + ' is hashed in to ' + hash);
	}

	function callbackFnForRecovery (hash, pwGuess) {
		var index, temp, action, object;
		var boolGroupList = compareHashToExistingOnes(hash);
		if (boolGroupList[0]) {
			//if result found, store the action & object
			
			//parse group list and turn into an int list
			var groupIndicesList = 
					convertIndicesStringToArray(boolGroupList[1]);
			for (var i=0; i<groupIndicesList.length; i++) {
				index = groupIndicesList[i];
				if ( (inputIndicesList.indexOf(index) < 0) && 
					(missingStoryIndex == index) ) {
					recoveryResult = pwGuess;
					//generate recovery result page
					//temp = pwGuess.split('ing');
					temp = pwGuess.split("a")[1].split("o");
					action = appConstants.getActionsList()[parseInt(temp[0])];
					object = appConstants.getObjectsList()[parseInt(temp[1])];
					createRecoveryResultPage(action, object);
				}
			}
		}
	}

	function generateBCryptHash (inStr, callbkFn, pwGuess, saltStr) {
		var salt;
		var round = NUM_OF_ROUNDS;
		var localBCrypt = new bCrypt();

	// generate salt using issac 
		try {
			if (saltStr == undefined) {
				salt = localBCrypt.gensalt(round);
			} else {
				salt = saltStr;
			}
		} catch (err) {
			alert('bCrypt gensalt error ' + err);
			return;
		} 

		try {
			//'' is the progressFn which does nothing
			localBCrypt.hashpw(inStr, salt, callbkFn, '', pwGuess);
		} catch (err) {
			alert('bCrypt hashpw error ' + err);
			return;
		}
	}

	function createIntStringArrayForGroup (length) {
		//this function creates a list of indices in strings given length
		//length <= 12
		var result = [];
		for (var i=0; i<length; i++) {
			if ( i < 10) {
				result.push(i.toString());
			} else if (i == 10) { //#11th story
				result.push('a');
			} else if (i == 11) { //#12th story
				result.push('b');
			} else{
				console.log('Something is wrong!');
			}
		}
		return result;
	}
	
		

	/*INITIAL COMPUTATION OF STORY HASHES*/
	// Note: same as computeHashesForGroup
	function computeHashesOfGroup (groupFullList, gpIndex) {
		var salt, groupStr, setIndicesString;
		var round = NUM_OF_ROUNDS;
		var localBCrypt = new bCrypt();

		try {
			salt = localBCrypt.gensalt(round);
		} catch (err) {
			alert('computeHashesOfGroup gensalt error ' + err);
			//?WHAT IF ERROR?
			return;
		}

		//????????
		storyMode.getGroupSaltList()[gpIndex] = salt;
		//update generalRecord's group salt list
		programVariables.setGeneralRecordGroupSaltList(
				storyMode.getGroupSaltList());
		
		//if could use recovery mechanism;
		//storing hash combination values
		if (groupFullList.length > MINIMUM_STORY_COUNT) {
			var k = MINIMUM_STORY_COUNT + 1;
			/* need to replace computeCombinationsOfSizeK with my function to generate
 * 			   sequence of sets  */
			////////////////// OLD MECHANISM /////////////////////////////
			/*
			var allCombinations = computeCombinationsOfSizeK(groupFullList, k);
			var indexArray = createIntStringArrayForGroup(groupFullList.length);
			var indicesCombinations = computeCombinationsOfSizeK(indexArray, k);*/

			///////////////////// NEW MECHANISM ///////////////////////
			
			var allCombinations = computeSelectedCombosOfSizeK(groupFullList, k);
			var indexArray = createIntStringArrayForGroup(groupFullList.length);
			var indicesCombinations = computeSelectedCombosOfSizeK(indexArray, k);

			for (var i=0; i<allCombinations.length; i++) {
				/* for each possible combination:
 * 					for each story in the combination:
 * 						extract the action and object
 * 					create a string of the form a1o1a2o2...corresponding to combination */
				groupStr = ((allCombinations[i]).map( 
						function (l) {
							var act = l[ACTION_INDEX_PRI];
							var obj = l[OBJECT_INDEX_PRI];
							var action = appConstants.getStrActIndex(act);
							var object = appConstants.getStrObjIndex(obj);
							return action + object;
						})).join('');
				setIndicesString = indicesCombinations[i].join('');
				//compute hash for one set of six stories
				generateBCryptHash(groupStr, callbackFnForGroupHashes, 
						setIndicesString, salt);

			}
		}
		return;
	}

	function gatherUserInput () {
		//index is the position of the missing story in group
		var inputId, inputObj, inputAct, userInput, stroyGuess, groupGuess;
		var guessAct, guessObj;
		var inputCount = 0;
		var inputFirstHalf = '';
		var inputSecondHalf = '';
		var length = storyMode.getGroupList()[groupIndex];
		var groupSalt = storyMode.getGroupSaltList()[groupIndex];
		inputIndicesList = [];

		for (var i=0; i<length; i++) {
			inputId = i.toString();
			inputAct = $('#action-password' + inputId).val();
			inputObj = $('#object-password' + inputId).val();
			userInput = appConstants.getStrActIndex(inputAct) + 
					appConstants.getStrObjIndex(inputObj);
			if ( (userInput != '') && (missingStoryIndex!=i) ) {
				inputIndicesList.push(i);
				inputCount++;
			}
			if (i < missingStoryIndex) inputFirstHalf += userInput;
			if (i > missingStoryIndex) inputSecondHalf += userInput;
		}

		//less than minimum count cannot perform recovery
		if (inputCount < MINIMUM_STORY_COUNT) {
			//maybe fix this redirect back to recovery page?
			alert('Cannot Recover Missing Story without Five Known Ones!');
			return;
		}
		//loop through all possible actions and objects combined with known ones
		for (var i=0; i<appConstants.getActionsList().length; i++) {
			guessAct = appConstants.getActionsList()[i];
			for (var j=0; j<appConstants.getObjectsList().length; j++) {
				guessObj = appConstants.getObjectsList()[j];
				storyGuess = appConstants.getStrActIndex(guessAct) + 
						appConstants.getStrObjIndex(guessObj);
				groupGuess = inputFirstHalf + storyGuess + inputSecondHalf;

				//no way to short-circuit since bCrypt uses a callback fn
				generateBCryptHash(groupGuess,
					callbackFnForRecovery, storyGuess, groupSalt);
			}
		}


	}

	function initializePrivateValues () {
		recoveryResult = null;
		hashResults = [];
		$("#recoveryPageDiv").html(
				"<p>Please input at least five stories. &nbsp; However, \
				only the first five will be used.</p><div id='groupStories'>\
				</div><button id='submitRecovery' type='submit' value='submit' \
				name='submit' onclick='recoveryMechanism.startRecovery()'>\
				Recover!</button></div>");
	}

	//CONTROLLER PUBLIC METHOD
	module.emptyPrivateValues = initializePrivateValues;
	module.computeHashesForGroup = computeHashesOfGroup;
	module.startRecovery = function () {
		gatherUserInput();
	}
	module.getHashResults = function () {
		return hashResults;
	}
	module.generateRecoveryPage = function (group, i, index) {
		displayRecoveryInputPage(group, i, index);
		return;
	}
	//VIEW FUNCTIONS

	//generate the recovery page used to gather user input
	function displayRecoveryInputPage (storyList, gpIndex, storyIndex) {
		var person, scene, story;
		groupIndex = gpIndex;
		missingStoryIndex = storyIndex%10;

		//initialize private values in case of first-time use;
		initializePrivateValues();
		var current = ''
		var head = '<ul data-role="listview" data-inset="true">';
		//??? refer back
		for (var i=0; i<storyList.length; i++){
			story = storyList[i];
			person = story[PERSON_INDEX_PUB];
			scene = story[SCENE_INDEX_PUB];	
			console.log("storyIndex is " + storyIndex.toString());
			console.log("gpIndex is " + gpIndex.toString());
			if (storyIndex % 10 === i) {
				//adding element for story trying to recover
				current = "id='currentItem'";
			}
			var listHtml = "\
					<li class='boarditems'" + current + 
					"><span class='pairdiv'><figure>\
					<img class=pair src='images/person/" + person + ".jpg' />\
					<figcaption><p class='storyText'>" + 
					person.split('_').join(' ') + "</p></figcaption></figure>\
					<figure><img class=pair src='images/scene/" + 
					scene.toLowerCase() + ".jpg' /><figcaption>\
					<p class='storyText'>" + scene.split('_').join(' ') + "\
					</p></figcaption></figure></span>\
					<span data-role='fieldcontain'><form action='#'>\
					<span class='boxWidget'><p class='actionCombo'><input \
					id='action-password" + i + "' placeholder='Doing' \
					tabindex='" + (2*i+1) + "' data-role='none' \
					class='action-input' /><ul id='recovery-action-suggestions"
					+ i + "' class='action-suggestions' data-role='listview' \
					data-inset='true'></ul></p><p class='objectCombo'><input \
					id='object-password" + i + "' placeholder='What?' \
					class='object-input' data-role='none' \
					tabindex='" + (2*i+2) + "'/><ul \
					id='recovery-object-suggestions" + i + "' \
					class='object-suggestions' data-role='listview' \
					data-inset='true'></ul></p></span></form></span></li>"
			head += listHtml;
		}
		head += '</ul>';
		$('#groupStories').html(head);
		document.getElementById('submitRecovery').tabIndex=(2*i+1).toString();
		for (i=0; i<storyList.length; i++) {
			memoryGame.getVerbComboBoxWrapper('action-password'+i.toString(),
					'recovery-action-suggestions'+i.toString());
			memoryGame.getObjectComboBoxWrapper('object-password'+i.toString(),
					'recovery-object-suggestions'+i.toString());
		}
		document.getElementById('currentItem').style.opacity = 0.5;
		$('#action-password0').focus();
		$("#recover").page().page("destroy").page();
		return;
	}

	function createRecoveryResultPage(action, object) {
		var story = storyMode.getStoryBank()[missingStoryIndex];
		var person = story[PERSON_INDEX_PUB]; 
		var scene = story[SCENE_INDEX_PUB];
		var html = "\
				<div id='recoveryResultDiv'><figure><img class=clue \
				src=images/person/{0}.jpg /><figcaption>{1}</figcaption>\
				</figure>is <figure><img class=clue src=images/action/{2}1.jpg \
				/><figcaption>{3}</figcaption></figure>{8}<figure>\
				<img class=clue src=images/object/{4}1.jpg /><figcaption>{5}\
				</figcaption></figure>in/on<figure>\
				<img class=clue src=images/scene/{6}.jpg />\
				<figcaption>the {7}</figcaption></figure><button \
				onclick='rehearsalModule.resetForRecoveredStory('" + person + 
				"', '" + scene + "')'></button></div>";

		var article = (object == 'igloo' ? 'an' : 'a');

		$('#recoveryPageDiv').html(
				String.format( html, person, person.split('_').join(' '), 
						action, action, object, object, 
						scene.toLowerCase(), scene.split('_').join(' '), 
						article));

		//later instead JQuery?
		$.mobile.changePage("#recover");

	}
	
return module;

})();
