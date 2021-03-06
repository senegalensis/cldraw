/*  CL Draw Probabilities
 *  Copyright (C) 2017  eminga
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in all
 *  copies or substantial portions of the Software.

 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *  SOFTWARE.
 */

/*
Team, Country
	Winners
Manchester United FC, England
Paris St. Germain, France
AS Roma, Italy
FC Barcelona, Spain
Liverpool FC, England
Manchester City FC, England
Beşiktaş JK, Turkey
Tottenham Hotspur FC, England

	Runners-up
FC Basel 1893, Switzerland
FC Bayern München, Germany
Chelsea FC, England
Juventus, Italy
Sevilla FC, Spain
FC Shakhtar Donetsk, Ukraine
FC Porto, Portugal
Real Madrid CF, Spain
*/

var teamsW = ['Manchester United', 'Paris St. Germain', 'AS Roma', 'FC Barcelona', 'Liverpool FC', 'Manchester City', 'Beşiktaş JK', 'Tottenham Hotspur'];
var countriesW = ['EN', 'FR', 'IT', 'ES', 'EN', 'EN', 'TR', 'EN'];
var teamsR = ['FC Basel', 'FC Bayern', 'Chelsea FC', 'Juventus', 'Sevilla FC', 'Shakhtar', 'FC Porto', 'Real Madrid'];
var countriesR = ['CH', 'DE', 'EN', 'IT', 'ES', 'UA', 'PT', 'ES'];

// drawn{W,R}[i] == true if team i has already been drawn
var drawnW = [];
var drawnR = [];

// matched[i] == j if teams i and j are matched
var matched = [];

var calculatedProbabilities;

initialize();


function initialize() {
	createTable();
	calculatedProbabilities = [];
	// if available, load precalculated probabilities
	var filename = 'probabilities/';
	for (var i = 0; i < 8; i++) {
		filename += countriesW[i];
	}
	for (var i = 0; i < 8; i++) {
		filename += countriesR[i];
	}
	filename += '.json';

	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (this.status == 200) {
				calculatedProbabilities = JSON.parse(this.responseText);
			}
			reset();
		}
	};
	xhr.open('GET', filename);
	xhr.send();
}


function reset() {
	for (var i = 0; i < 8; i++) {
		drawnW[i] = false;
		drawnR[i] = false;
		matched[i] = -1;
	}
	updateTable(calculateProbabilities());
	createButtonsR();
	document.getElementById('button-randomteam').classList.remove('disabled');
    document.getElementById('cldraw-fixtures').innerHTML = '';
}


// returns true if draw is a valid draw
function isValid(draw) {
	var j = 0;
	for (var i = 0; i < draw.length; i++) {
		while (drawnW[i + j]) {
			j++;
		}
		if (i + j == draw[i] || countriesW[i + j] == countriesR[draw[i]]) {
			return false;
		}
	}
	return true;
}


// returns matrix with teams i,j which can be matched s.t. there remains
// at least one valid draw after i and j have been matched
function calculatePossibleMatches() {
	var availableTeams = [];
	for (var i = 0; i < 8; i++) {
		if (!drawnR[i]) {
			availableTeams.push(i);
		}
	}

	var possibleMatches = [];
	for (var i = 0; i < 8; i++) {
		possibleMatches[i] = [];
		for (var j = 0; j < 8; j++) {
			possibleMatches[i][j] = false;
		}
	}

	if (availableTeams.length > 0) {
		draws = Combinatorics.permutation(availableTeams);

		while(draw = draws.next()) {
			if (isValid(draw)) {
				var j = 0;
				for (var k = 0; k < draw.length; k++) {
					while (drawnW[k + j]) {
						j++;
					}
					possibleMatches[draw[k]][k + j] = true;
				}
			}
		}
	}

	return possibleMatches;
}

// generates an identifier for the drawn teams
function generateId() {
	x = 0;
	for (var i = 0; i < 8; i++) {
		x <<= 1;
		if (drawnW[i]) {
			x |= 1;
		}
	}
	for (var i = 0; i < 8; i++) {
		x <<= 1;
		if (drawnR[i]) {
			x |= 1;
		}
	}
	return x;
}


function calculateProbabilities(team, possibleMatch) {
	var id = generateId();
	var probabilities = [];

	// use cached probabilities if existing
	if (calculatedProbabilities[id] != null) {
		probabilities = calculatedProbabilities[id];
	} else {
		var options = 0;
		for (var i = 0; i < 8; i++) {
			probabilities[i] = [];
			for (var j = 0; j < 8; j++) {
				probabilities[i][j] = 0;
			}
		}

		// if the same number of winners and runners-up has been drawn
		if (team == undefined) {
			var possibleMatches = calculatePossibleMatches();

			for (var i = 0; i < 8; i++) {
				if (!drawnR[i]) {
					options++;
					drawnR[i] = true;

					var temp = calculateProbabilities(i, possibleMatches[i]);
					for (var j = 0; j < 8; j++) {
						for (var k = 0; k < 8; k++) {
							probabilities[j][k] += temp[j][k];
						}
					}
					drawnR[i] = false;
				}
			}

			calculatedProbabilities[id] = probabilities;
		// if an opponent for team "team" is to be drawn next
		} else { 
			for (var i = 0; i < 8; i++) {
				if (possibleMatch[i]) {
					options++;
					matched[i] = team;
					drawnW[i] = true;
					var temp = calculateProbabilities();
					for (var j = 0; j < 8; j++) {
						for (var k = 0; k < 8; k++) {
							probabilities[j][k] += temp[j][k];
						}
					}
					probabilities[i][team] += 1;
					matched[i] = -1;
					drawnW[i] = false;
				}
			}
		}

		if (options > 0) {
			for (var i = 0; i < 8; i++) {
				for (var j = 0; j < 8; j++) {
					probabilities[i][j] /= options;
				}
			}
		}
	}

	return probabilities;
}


function drawRunnerUp(team) {
	var possibleMatch = calculatePossibleMatches()[team];
	drawnR[team] = true;
	var probabilities = calculateProbabilities(team, possibleMatch);
	updateTable(probabilities, team);
	createButtonsW(team, possibleMatch);
	document.getElementById('cldraw-fixtures').innerHTML += teamsR[team] + ' - ';
}


function drawWinner(team, opponent) {
	matched[team] = opponent;
	drawnW[team] = true;
	updateTable(calculateProbabilities());
	createButtonsR();
	document.getElementById('cldraw-fixtures').innerHTML += teamsW[team] + '<br>';
}


function drawRandomTeam() {
	var opponent = -1;
	for (var i = 0; i < 8; i++) {
		if (drawnR[i] && !matched.includes(i)) {
			opponent = i;
		}
	}

	if (opponent == -1) {
		var numR = 0;
		for (var i = 0; i < 8; i++) {
			if (!drawnR[i]) {
				numR++;
			}
		}
		if (numR > 0) {
			var team = Math.floor(Math.random() * numR);
			for (var i = 0; i <= team; i++) {
				if (drawnR[i]) {
					team++;
				}
			}
			drawRunnerUp(team);
		}
	} else {
		drawnR[opponent] = false;
		var possibleMatch = calculatePossibleMatches()[opponent];
		drawnR[opponent] = true;
		var numW = 0;
		for (var i = 0; i < 8; i++) {
			if (possibleMatch[i]) {
				numW++;
			}
		}
		var team = Math.floor(Math.random() * numW);
		for (var i = 0; i <= team && i < 20; i++) {
			if (!possibleMatch[i]) {
				team++;
			}
		}
		drawWinner(team, opponent);
	}
}


function createTable() {
	var table = document.getElementById('cldraw-table');
	while (table.firstChild) {
		table.removeChild(table.firstChild);
	}
	var thead = document.createElement('thead');
	var tr = document.createElement('tr');
	var th = document.createElement('th');
	tr.appendChild(th)
	for (var i = 0; i < 8; i++) {
		th = document.createElement('th');
		th.appendChild(document.createTextNode(teamsR[i]));
		th.scope = 'col';
		tr.appendChild(th);
	}
	thead.appendChild(tr);

	var tbody = document.createElement('tbody');
	for (var i = 0; i < 8; i++) {
		var tr = document.createElement('tr');
		var th = document.createElement('th');
		th.scope = 'row';
		th.appendChild(document.createTextNode(teamsW[i]));
		tr.appendChild(th);
		for (var j = 0; j < 8; j++) {
			var td = document.createElement('td');
			td.style.textAlign = 'center';
			tr.appendChild(td);
		}
		tbody.appendChild(tr);
	}

	table.appendChild(thead);
	table.appendChild(tbody);
}


function updateTable(probabilities, highlight) {
	var table = document.getElementById('cldraw-table');
	for (var i = 0; i < 8; i++){
		for (var j = 0; j < 8; j++){
			var color = '';
			var text;
			if (matched[i] == j) {
				text = 'drawn';
				color = '#4998ff';
			} else {
				text = (100 * probabilities[i][j]).toFixed(2) + "%";
				if (probabilities[i][j] == 0) {
					color = '#999999';
				} else if (j == highlight) {
					color = '#f5ff75';
				}
			}
			table.rows[i + 1].cells[j + 1].innerHTML = text;
			table.rows[i + 1].cells[j + 1].style.background = color;
		}
	}
}


// create buttons of runner-up teams which were not drawn yet
function createButtonsR() {
	var buttons = document.getElementById('cldraw-buttons');
	while (buttons.firstChild) {
		buttons.removeChild(buttons.firstChild);
	}

	var numR = 0;
	for (var i = 0; i < 8 ; i++) {
		if (!drawnR[i]) {
			numR++;
			var button = document.createElement('button');
			button.classList.add('btn');
			button.classList.add('btn-primary');
			var text = document.createTextNode(teamsR[i]);
			button.appendChild(text);
			button.addEventListener('click', drawRunnerUp.bind(null, i), false);
			buttons.appendChild(button);
		}
	}
	if (numR == 0) {
		var button = document.getElementById('button-randomteam');
    	button.classList.add('disabled');
	}
}

// create buttons of group winners which can be matched with the last drawn runner-up
function createButtonsW(opponent, possibleMatch) {
	var buttons = document.getElementById('cldraw-buttons');
	while (buttons.firstChild) {
		buttons.removeChild(buttons.firstChild);
	}
	for (var i = 0; i < 8 ; i++) {
		if (!drawnW[i] && possibleMatch[i]) {
			var button = document.createElement('button');
			button.classList.add('btn');
			button.classList.add('btn-primary');
			var text = document.createTextNode(teamsW[i]);
			button.appendChild(text);
			button.addEventListener('click', drawWinner.bind(null, i, opponent), false);
			buttons.appendChild(button);
		}
	}
}


function showEditor() {
	var button = document.getElementById('button-editor');
	var div = document.getElementById('cldraw-editor');
	if (!button.classList.contains('active')) {
		for (var i = 0; i < 8; i++) {
			document.getElementById('cldraw-winner-' + i).value = teamsW[i];
			document.getElementById('cldraw-winner-' + i + '-country').value = countriesW[i];
			document.getElementById('cldraw-runner-up-' + i).value = teamsR[i];
			document.getElementById('cldraw-runner-up-' + i + '-country').value = countriesR[i];
		}
		button.classList.add('active');
		div.style.display = '';
	} else {
		button.classList.remove('active');
		div.style.display = 'none';
	}
}


function saveTeams() {
	var button = document.getElementById('button-editor');
	button.classList.remove('active');
	var div = document.getElementById('cldraw-editor');
	div.style.display = 'none';
	for (var i = 0; i < 8; i++) {
			teamsW[i] = document.getElementById('cldraw-winner-' + i).value;
			countriesW[i] = document.getElementById('cldraw-winner-' + i + '-country').value;
			teamsR[i] = document.getElementById('cldraw-runner-up-' + i).value;
			countriesR[i] = document.getElementById('cldraw-runner-up-' + i + '-country').value;
		}
	initialize();
}
