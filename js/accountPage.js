var accountPage = (function() {
	var module = {};
	var PERSON_INDEX = 0;
	var SCENE_INDEX = 1;
	var updateListBool = true;

	function isWebsite (web, cueList) {
		console.log("isWebsite");
		//check empty/same account entered
		if (web == '') {
			//display cannot be empty message
			$("#accountSubmitFeedback").html("<p>Account Cannot Be Empty!</p>");
			return false;
		}
		$("#accountSubmitFeedback").html('');
		//check for duplicate accounts 
		if (programVariables.checkForDuplicateAccountNames(web.toLowerCase())) {
			$("#accountSubmitFeedback").html('<p>Duplicate Account Names!</p>');
			return false
		}
		//check if all stories are unlocked
		//get the largest in the cueList
		var maxIndex = Math.ceil(cueList[cueList.length - 1]/2);
		var maxStoryUnlocked = 
				programVariables.calculateMaxUnlockedStoryIndex();
		if (maxIndex > maxStoryUnlocked) {
			$("#accountSubmitFeedback").html('<p>\
					Need to Unlock More Stories!</p>');
			return false;
		}
		return true;
	}

	function getAccountPwdRule(prefix) {
		console.log("getAccountPwdRule");
		//Each Account has a rule list 
		//[maxLength, upper, lower, specialChar, number]
		var length = parseInt($("#" + prefix + "PwdLength").val());
		var speCharBool = $("#" + prefix + "PwdSpecialChar").is(":checked");
		var upperBool = $("#" + prefix + "PwdUpper").is(":checked");
		var lowerBool = $("#" + prefix + "PwdLower").is(":checked");
		var numberBool = $("#" + prefix + "PwdNumber").is(":checked");
		var otherBool = $("#" + prefix + "PwdOther").is(":checked");
		var ruleText = $("#" + prefix + "PwdOtherText").val();
		if (!ruleText) {
			ruleText = ''
		}

		return [length, upperBool, lowerBool, 
				speCharBool, numberBool, otherBool, ruleText];
	}
	function resetPwdRule() {
		console.log("resetPwdRule");
		var attribute;
		//set pwd rule fresh for a new account
		var fieldSet = [ $("#pwdUpper"), $("#pwdLower"),
						 $("#pwdNumber"), $("#pwdSpecialChar"), $("#pwdOther")];
		$("#pwdLength").prop("value", "100");
		$("#pwdUpper").prop("checked", false);
		$("#pwdLower").prop("checked", true);
		$("#pwdNumber").prop("checked", false);
		$("#pwdSpecialChar").prop("checked", false);
		$("#pwdOther").prop("checked", false);
		$("#pwdLength").slider('refresh');
		$("#pwdOtherText").val('');

		for (var i=0; i<fieldSet.length; i++) {
			attribute = fieldSet[i];
			attribute.checkboxradio('refresh');
		}
		//other text box start off hidden;
		$("#pwdOtherText").hide();
		return;	
	}
	function processCueList(cueList) {
		console.log("processCueList");
		var j;
		var result = [];
		for (var i=0; i<cueList.length; i++) {
			j = Math.ceil(cueList[i]/2);
			result.push(j);	
		}
		return result;
	}

	function submitFunction (e) {
		console.log("submitFunction");
		if ( ((e.keyCode === 13) || (e.keyCode == undefined)) 
				&& ($("#entry:focus")) ) {
			e.preventDefault();

			var accountID = 'button' + storyMode.getAccountIndex();
			var account = $('#accountName').val();
			$('#accountName').val('');

			//get the next set of story
			var level = "setFamily." + 
						storyMode.getSecurityLevel().toLowerCase();
			var args = "(" + storyMode.getAccountIndex() + ")";
			var functionName = level.concat(("SecurityIthAccount" + args));
			var cueList = eval(functionName);
			//process cueList to reflect the action object separte cue 
			//meaning [1,2,3,4,5,6] 1 meaning 1st story's action 
			//2 meaning 1st story's object
			var newCueList = processCueList(cueList);

			//if pass validation of website input
			if ( isWebsite(account, newCueList) ) {
				var eString = 'list'+ storyMode.getAccountIndex();
				var buttonID = '#' + accountID;
				var listID = '#' + eString;

				$('.images').css('text-align','center');

				//calculate cue (person-scene pairs from the story list)
				var storyList = 
						programVariables.calculateCuePairsFromList(newCueList);
				var ruleList = getAccountPwdRule('');
				programVariables.insertAccount(account, 
						storyList, storyMode.getAccountIndex(), ruleList);

				//?storyMode.accountIndex += 1;
				updateStoryRefCount(account, cueList);
				renderAccountList(true);
			}
		} else {
			alert('Warning: Account entered is not valid');
		}
		//reset Password Rules for later accounts added
		resetPwdRule();
		return false
	}

	function updateAccountListWrapper () {
		console.log("updateAccountListWrapper");
		//by rehearsal date?
		renderAccountList(false);
		return;
	}

	function updateStoryRefCount (webName, accountList) {
		console.log("updateStoryRefCount");
		//refer to page
	}

	function checkPassword (web, index) {
		console.log("checkPassword");
		//update rehearsal time
		var date, record, story, storyList, newRuleList;
		var answer = $('#' + web + 'Page').find('#' + web+'-password').val(); 
		if (answer != '') {
			//update reherasal time of each story as well as the account
			var records = programVariables.getAccounts();
			for (var i=0; i<records.length; i++) {
				record = records[i];
				if (record.get('account') == web) {
					//find the account record & set the time
					record.set('lastRehearsal', new Date());
					storyList = record.get('storyList');
					//update RuleList for account incase changed
					newRuleList = getAccountPwdRule(web);
					record.set("rules", newRuleList);
				}
			}
            console.log('what information have I entered so far???\n');
			storyList = parseStringToNestedArrays(storyList);
			var records = programVariables.getStories();
			for (var i=0; i<records.length; i++) {
				//check each story and update it
				record = records[i];
				for (var j=0; j<storyList.length; j++) {
					story = storyList[j];
					if ( record.get('person') == story[0] && 
							record.get('scene') == story[1] ) {
						//update record time
						date = new Date();
						//TEMP
						console.log('calculating old ' + record.get('lastRehearsed').toString()  + ' new ' + date.toString());
						record.set('lastRehearsed', date);
						record.set('totalRehearsal',
								record.get('totalRehearsal')+1);

						//everything is 100% now?? cannot tell 
						record.set('correctRehearsal',
								record.get('correctRehearsal')+1);
						console.log('story last reherased....');

						//if that interval not satisfied
						//length of satisfactory less than that intervalNum
						if (record.get('rehearsalList').length() 
								<= record.get('intervalNum')) {
							record.get('rehearsalList').push(true);
							record.set('intervalNum',
									record.get('intervalNum')+1);
						}

					}
				}
			}
		}
		$.mobile.changePage($("#accounts"));
	}

	function alertOnUpdate(account) {
		console.log("alertOnUpdate");
		//individual field names end in ..I
		var checkBox;
		var checkBoxes = ['upperI', 'lowerI' , 'specialI', 'numberI', 'otherI'];
		for (var i=0; i<checkBoxes.length; i++) {
			checkBox = checkBoxes[i]
			$('input[type=checkbox][name=' + checkBox + ']').change(
				function(){
					window.confirm("Are you sure?")
				}
			)
		}
	}
	function generateRuleHTML(ruleList, account) {
		console.log("generateRuleHTML");
		var endString;
		var prependStringList = [];
		var stringList = [ "<div class='accountSlideBar'><label>\
							<input type='range' min='6' max='100' id='", 
							account, "PwdLength' value='", ruleList[0], 
							"' step='1'/>Max Length &nbsp &nbsp</label></div>"];

		//ruleList[0] -> length
		var fieldUpperList = [
				"<fieldset class='accountField' data-type='horizontal' \
				data-role='controlgroup'><label class='pwdUpperLabel' \
				data-type='horizontal'><input type='checkbox' \
				class='pwdUpperInput' name='upperI' \
				id='", account, "PwdUpper' value='Uppercase' "]

		//ruleList[1] -> upperCaseBool
		if (ruleList[1]) {
			fieldUpperList.push("checked='checked'");
			prependStringList.push("X");
		}
		var fieldLowerList = [
				"/>Uppercase</label><label class='pwdLowerLabel' \
				data-type='horizontal'><input type='checkbox' \
				class='pwdLowerInput' name='lowerI' \
	 			id='", account, "PwdLower' value='Lowercase' "];

	 	//ruleList[2] -> lowerCaseBool
	 	if (ruleList[2]) {
	 		fieldLowerList.push("checked='checked' ")
	 	}

	 	var fieldSpecialCharList = [
	 			"/>Lowercase</label><label class='pwdSpecialLabel' \
	 			 data-type='horizontal'><input type='checkbox' \
	 			 class='pwdSpecialInput' name='specialI' \
	 			 id='", account, "PwdSpecialChar' value='Special Character'"];

	 	//ruleList[3] -> specialChar
	 	if (ruleList[3]) {
	 		fieldSpecialCharList.push("checked='checked'");
	 		prependStringList.push("&");
	 	}

	 	var fieldNumberList = [
	 			"/>Special Chars</label><label class='pwdNumberLabel' \
	 			 data-type='horizontal'><input type='checkbox' \
	 			 class='pwdNumberInput' name='numberI' \
	 			 id='", account, "PwdNumber' value='Number' "];

	 	if (ruleList[4]) {
	 		fieldNumberList.push("checked='checked' ");
	 		prependStringList.push("7");

	 	}

	 	var fieldOtherList = ["/>Number</label><label class='pwdOtherLabel' \
	 			data-type='horizontal'><input type='checkbox' \
	 			class='pwdOtherInput' name='otherI' \
	 			id='", account, "pwdOther' value='Other'"];

	 	endString = "/>Other</label><fieldset>";

	 	if (ruleList[5]) {
	 		var otherRules = ruleList[6];
	 		fieldOtherList.push("checked='checked' />Other</label>");
	 		fieldOtherList.push("<input type='text' name='otherTextI' \
	 			id='pwdOtherText'" + account + " class='pwdOtherTextInput' \
	 			value='" + otherRules + "' placeholder='Enter Additional Rules'\
	 			 />");
	 		endString = "</fieldset>";
	 	}

	 	var finalString = [ stringList.join(''), fieldUpperList.join(''),
	 						fieldLowerList.join(''), 
	 						fieldSpecialCharList.join(''),
	 						fieldNumberList.join(''), 
	 						fieldOtherList.join(''), 
	 						endString ];
	 	return [finalString.join(''), prependStringList.join('')];
	}

	function parseStringToNestedArrays (stringOfArray) {
		console.log("parseStringToNestedArrays");
		var result = [];
		for (var i=0; i < stringOfArray.length(); i++) {
			var li = stringOfArray.get(i).split('|||'); 
			result.push(li);
		}
		return result;
	}
	//returns the number of dictionary words in the typed string
	function checkNumberOfWordsTyped (input,account) {
		console.log("checkNumberOfWordsTyped");
		var current = 0;
		var stop = 0;
		var numberOfWords = 0;
		var wordsList = [];
		var word;
		var SPHval;
		var fullPass = "";
		var nonEmptyPass;
		var trie = appConstants.getTrie();
		while (stop < input.length) {
			stop += 1;
			word = input.slice(current, stop);
			console.log(word);
			// SPHval = pwdhash.simpleHash(word,account);
			// console.log(SPHval)
			if ((word != '') && (trie.get(word) != null)) {
				numberOfWords += 1;
				wordsList.push(word);
				console.log(wordsList);
				current = stop;
			}
		}
		console.log(numberOfWords);
		//generating full password
		while (wordsList.length > 0){
			fullPass += wordsList.pop();
			nonEmptyPass = true;
		}
		if (nonEmptyPass){
			console.log(fullPass);
			SPHval = pwdhash.simpleHash(fullPass,account);
			console.log("SPH val is\n");
			console.log(SPHval);
		}
		return [numberOfWords,SPHval];
	}
	
	//CONTROLLER
	module.submit = function (e) {
		submitFunction(e);
		return;
	}
	module.updateAccountList = function () {
		updateAccountListWrapper();
		return;
	}

	module.checkPassword = function (web, index) {
		checkPassword(web, index);
	}

	//VIEW
	function renderEachAccountElements (time, accountName, list, index, rules) {
		//check duplicates?
		var prependString;
		//create html for each page
		var html = "<div id='" + accountName + "Box' class='horizontal'>\
				<div id='" + accountName + "Stories' class='table'>";
		for (var i=0; i < list.length; i ++) {
			if (i % 2 == 0) {
				var liold = "\
						<div class='twoPairs'><item class='pairdiv'>\
						<figure><img class=pair src=images/person/{0}.jpg />\
						<figcaption>{1}</figcaption></figure><figure>\
						<img class=pair src=images/scene/{2}.jpg />\
						<figcaption>{3}</figcaption></figure>\
						<img class='pair action' src=images/takeAction.png>\
						</item>";
			} else {
				var liold = "\
						&nbsp&nbsp<item class='pairdiv'><figure>\
						<img class=pair src=images/person/{0}.jpg />\
						<figcaption>{1}</figcaption></figure><figure>\
						<img class=pair src=images/scene/{2}.jpg /><figcaption>\
						{3}</figcaption></figure>\
						<img class='pair object' src=images/takeObject.png>\
						</item></div>";
			}
			var li = String.format(liold, list[i][PERSON_INDEX], 
					list[i][PERSON_INDEX].split('_').join(' '),
					list[i][SCENE_INDEX].toLowerCase(), 
					list[i][SCENE_INDEX].split('_').join(' '));
		
			html += li;
		}
		resultList = generateRuleHTML(rules, accountName);
		rulesHTML = resultList[0];
		prependString = resultList[1];

		// html += "</div></div><br>" +  
		// 		 "<input type='text' autocorrect='off' name='password'\
		// 		 id='"+accountName+"-password' value='" + prependString + "' \
		// 		 placeholder='Type in your password' \
		// 		 autofocus='autofocus'/>\<a href=# \
		// 		 data-role='button' data-rel='popup' \
		// 		 onclick='accountPage.checkPassword(\""  + accountName + 
		// 		 		"\", " + index + ")' > Rehearse Account</a>";

		html += "</div></div><br>" +  
				 "<input type='text' autocorrect='off' name='password'\
				 id='"+accountName+"-password' value='" + prependString + "' \
				 placeholder='Type in your password' \
				 autofocus='autofocus'/>\<a href=# \
				 data-role='button' data-rel='popup' \
				 onclick='accountPage.checkPassword(\""  + accountName + 
				 		"\", " + index + ")' > Rehearse Account</a>" + 
				 rulesHTML;
		html += "<p><br>This text is normal.</p>";

		return html;
	}

	function renderAccountList (changePageBool) {
		var accounts = programVariables.getAccounts();
		var accountIndex = programVariables.getAccountIndex();
		var stories = storyMode.getStoryBank();
		var accountName = '';

		if (stories.length >= 0) {
			for (var i=0; i < accounts.length; i++) {
				var account = accounts[i];
				var temp = account.get('storyList');
				var list = parseStringToNestedArrays(account.get('storyList'));
				accountName = account.get('account');
				var accountIndexForChecking = account.get('accountIndex');
				var ruleList = account.get('rules').toArray();
				var time = account.get('lastRehearsal').toString();
				var pageHtml = renderEachAccountElements(time, accountName, 
						list, accountIndexForChecking, ruleList);

				var newPage = $("\
						<div data-role='page' data-title='" + accountName + 
						"' id=" + accountName + "Page><div data-role='header'\
						data-position=fixed><a href=#accounts \
						data-icon='back'>Back</a><h1>"+ accountName + 
						"</h1></div><div data-role='content' \
						class='images'>"+ pageHtml +" </div></div>");
				
				if ( updateListBool || 
					(changePageBool && i==accounts.length-1) ) {

					//if insert the first time
					var keyID = 'button' + accountIndex;
					var eString = 'list'+ accountIndex;
					var buttonID = '#' + keyID;
					var listID = '#' + eString;
					$("#list").append( "\
							<li id=" + accountName + "><a href=#" + accountName 
							+ "Page id=" + keyID + " data-wrapperels=\
							'span' data-inline='true' data-icon='delete'\
							 data-iconpos='right' data-theme='a'>" 
							+ accountName + "</a></li>");

					if ($('#list').hasClass('ui-listview')) {
						$('#list').listview('refresh');
					} else {
						$('#list').trigger('create');
					}

					newPage.appendTo( $.mobile.pageContainer );
					alertOnUpdate();
					//add listener for each page
					var pageID = "#" + accountName + "Page";

					$(document).on("pagebeforeshow",pageID, {name: accountName},
						function(event){
							var name = event.data.name;
							//refocus password field 
							var pwdAccountTextId = "#" + name + "-password";
							var pwdAccountText = $(pwdAccountTextId);
							pwdAccountText.focus();
							//store current value
							var temp = pwdAccountText.val();
							//clear and reset while focused
							pwdAccountText.val(''); 
							pwdAccountText.val(temp);
						}
					);

					//set key up function to monitor pwd-input
					$(document).on('pagecreate', pageID, {name:accountName}, 
						function (event) {
							var pwdText = "#" + event.data.name + "-password";
							var prepend = $(pwdText).val();
							$(document).on('keyup', pwdText, 
								{ prepend:prepend, name:event.data.name},
								function(event) {
									//check for current typed-in word is in trie 
									//remember to get rid of the prepend
									var typed = $("#" + event.target.id).val();
									var len = typed.length;
									var pre_len = event.data.prepend.length;
									var input = typed.slice(pre_len, len);
									var trie = appConstants.getTrie();
									var account = event.data.name;
									var imageBox = $("#" + account + "Box");
									console.log("ACCOUNT NAME IS...");
									console.log(account);
									var pwdData = checkNumberOfWordsTyped(input,account);
									var num = pwdData[0];
									var SPHval = pwdData[1];
									console.log("num is ");
									console.log(num);
									console.log("sphval is "+SPHval);
									var hashBox = $("#"+SPHval+"Box");
									// var num = checkNumberOfWordsTyped(input,account);
									imageBox.scrollLeft(400*num);
									//need to add to the html
									// var hashInfo = $("<br><p>"+SPHval+"<p>");
									// newPage.appendTo( $.mobile.pageContainer );
									alertOnUpdate();

								}
							);
					})
					
				}
			}
			//update the account page 
		} else {
			//alert('play the game to unlock more stories!');
		}
		if (changePageBool) {
			storyMode.incrementAccountIndex();
			programVariables.setAccountIndex(storyMode.getAccountIndex());
			$.mobile.changePage(newPage);
		}
		updateListBool = false;
	}
	return module;
}());
