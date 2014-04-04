YUI().use(
	'node',
	'aui-progressbar',
	'slider',
	'aui-modal',
	'transition',
	'aui-popover',
	function(Y) {
		var ballsArray;
		var damage;
		var drawInterval = 0;
		var health = 100;
		var healthBar;
		var height = 500; // hold canvas height
		var hits = 0;
		var innerUpdateCounter = 0;
		var numberOfBalls = 3;
		var sliderValue = 1; // initial value of YUI slider
		var timerInterval = 0;
		var userBall; // variable to hold user ball object
		var width = 600; // hold canvas width
		var showingPopovers = false;

		// assign Unicode keyboard values variables
		var LEFT = '37';
		var RIGHT = '39';
		var UP = '38';
		var DOWN = '40';

		var userSpeed = 20; // how many pixels the user's ball can cover on a key press
		var level = 1; // holds which level the user is on
		var score = 0;
		var timer = 0;

		var healthBarPopover;
		var startPopover;
		var canvasPopover;
		var difficultySliderPopover;
		var hudPopover;
		var userBallPopover;

		var hBar = Y.one('.pbar');
		var canvasContainer = Y.one('#canvas_container');
		var difficultySlider = Y.one('.yui3-slider-rail');

		// grab button nodes and assign to variables
		var start = Y.one('#start');
		var pause = Y.one('#pause');
		var startOver = Y.one('#start_over');
		var newBall = Y.one('#new_ball');
		var instructions = Y.one('#instructions');

		var newLevel = Y.one('#new_level');

		var ballCounter = Y.one('#ball_counter');
		var levelTimer = Y.one('#level_timer');
		var userScore = Y.one('#user_score');
		var userLevel = Y.one('#level');

		// assign variables to hold nodes for AUI progress bar and YUI slider content
		var healthBarContent = Y.one('.health-bar-content');
		var xInput = Y.one('#horiz_value');
		var xSlider;

		// create the health bar
		healthBar = new Y.ProgressBar(
			{
				contentBox: '.pbar',
				label: 'Damage',
				value: hits,
				width: width + 50,
			}
		).render();

		// if the slider is changed, change the number of balls displayed
		function updateSlider(e) {
			this.set('value', e.newVal);
			sliderValue = xSlider.getValue();
			numberOfBalls = sliderValue * 3;
			ballCounter.setContent('Balls: ' + numberOfBalls);
		}

		// create a new slider instance
		xSlider = new Y.Slider({
			length:'600px',
			min: 1,
			max: 5,
			value: 1,
		});

		// set the initial slider value, set what to do after a value change, render slider
		xInput.setData({slider:xSlider});
		xSlider.after('valueChange', updateSlider, xInput);
		xSlider.render("#slider_container");

		document.onkeydown = userMove; //call user movement function on key press

		// generate a random integer between specified values
		function getRandomInt(min, max) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		}

		// if the user presses left, right, up, or down move the user ball appropriately
		function userMove(e) {
			e = e || window.event;
			if(e.keyCode == LEFT && userBall.x - userBall.radius * 2 >= 0) {
				userBall.x -= userSpeed;
			}
			else if(e.keyCode == RIGHT && userBall.x + userBall.radius * 2 <= canvas.width) {
				userBall.x += userSpeed;
			}
			else if(e.keyCode == UP && userBall.y - userBall.radius * 2 >= 0) {
				userBall.y -= userSpeed;
			}
			else if(e.keyCode == DOWN && userBall.y + userBall.radius * 2 <= canvas.height) {
				userBall.y += userSpeed;
			}
		}

		//ball constructor
		function Ball() {
			this.radius = 10; // set ball radius
			this.x = getRandomInt(this.radius * 3, width - this.radius * 3); // initial x position
			this.y = getRandomInt(this.radius * 3, height / 2); // initial y position
			this.dirX = getRandomInt(-4,4); // assign ball a change in x position
			this.dirY = getRandomInt(-4,4); // assign ball a change in y position
			this.col = colorsArray[getRandomInt(0,colorsArray.length-1)];
		}

		// store available ball colors in an array
		var colorsArray = ['#1E9D74','#146A4F','#00174C','#B02F02','#FC4302','#8BCC7E','#CDE9C7','#E49F1A'];

		// check each ball against every other ball to see if they have collided
		function checkCollision() {
			var ball1;
			var ball2;
			var ballx
			var tempHolder;

			// check to see if any ball has hit the users ball, if so update hit count and damage
			for(var i = 1; i < ballsArray.length; i++) {
				ballx = ballsArray[i];
				if((((userBall.x - userBall.radius <= ballx.x - ballx.radius) &&
					(userBall.x + userBall.radius >= ballx.x - ballx.radius)) ||
					((ballx.x - ballx.radius <= userBall.x - userBall.radius) &&
					(ballx.x + ballx.radius >= userBall.x - userBall.radius)))
					&&
					(((userBall.y - userBall.radius <= ballx.y - ballx.radius) &&
					(userBall.y + userBall.radius >= ballx.y - ballx.radius)) ||
					((ballx.y - ballx.radius <= userBall.y - userBall.radius) &&
					(ballx.y + ballx.radius >= userBall.y - userBall.radius)))) {
					// var element = document.getElementById('hit_counter');
					hits++;
					// element.innerHTML = 'Damage: ' + hits;
					updateDamage();
				}
			}

			// check each ball to see if it has hit any other ball, if so change direction of both balls
			for(var i=0; i<ballsArray.length; i++) {
				ball1 = ballsArray[i];

				for(var j=0; j<ballsArray.length; j++) {
					ball2 = ballsArray[j];

					if((((ball1.x - ball1.radius <= ball2.x - ball2.radius) && (ball1.x + ball1.radius >= ball2.x - ball2.radius)) && ((ball1.y - ball1.radius <= ball2.y - ball2.radius) && (ball1.y + ball1.radius >= ball2.y - ball2.radius)))) {
						tempHolder = ball1.dirX;
						ball1.dirX = ball1.dirY;
						ball1.dirY = tempHolder;
						tempHolder = ball2.dirX;
						ball2.dirX = ball2.dirY;
						ball2.dirY = tempHolder;
					}
				}
			}
		}

		// draw canvas
		function draw() {
			var canvas = document.getElementById('background');
			var ctx = canvas.getContext('2d'); // define context for canvas
			canvas.width = width; // assign canvas width
			canvas.height = height; // assign canvas height

			// clear canvas
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			checkCollision();

			for (var i = 0; i < ballsArray.length; i++) {
				var ball = ballsArray[i];

				// fill and draw balls
				ctx.fillStyle = ball.col;
				ctx.beginPath();

				// check to see if ball hits canvas edge, if so change direction
				if (ball.x + ball.radius >= canvas.width || ball.x - ball.radius <= 0) {
					ball.dirX *= -1;
				}
				if (ball.y + ball.radius >= canvas.height || ball.y - ball.radius <= 0) {
					ball.dirY *= -1;
				}

				ball.x += ball.dirX;
				ball.y += ball.dirY;

				ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2, false);
				ctx.stroke();
				ctx.fill();
			}
		}

		function fadeNewLevelPopUp() {
			newLevel.transition({
				duration: 1,
				opacity: 0.0,
				easing: 'ease-out'
			});
		}

		// update time, level, and user score
		function updateLevelInfo() {
			innerUpdateCounter += 1;
			timer += 1;
			levelTimer.setContent('Time: ' + timer);
			score = (1 * numberOfBalls) + score;
			userScore.setContent('Score: ' + score);

			if (timer % 10 == 0) {
				level+= 1;
				userLevel.setContent('Level: ' + level);
				ballsArray.push(new Ball());
				numberOfBalls += 1;
				ballCounter.setContent('Balls: ' + numberOfBalls);
				newLevel.setStyle('opacity','1.0');
			}

			else if (innerUpdateCounter == 11) {
				innerUpdateCounter = 1;
				fadeNewLevelPopUp();
			}
		}

		// start a level time and call updateLevelInfo() every second
		function startLevelTimer() {
			timerInterval = setInterval(function(){updateLevelInfo()}, 1000);
		}

		function showInstructionsPopovers() {
			if (showingPopovers == false) {
				userBallPopover = new Y.Popover(
					{
						align: {
						node: canvasContainer,
						points:[Y.WidgetPositionAlign.BL, Y.WidgetPositionAlign.BL]
					},
						bodyContent: 'This is your ball. Use up, down, left, and right arrow keys to move.',
						position: 'left'
					}
				).render();

				hudPopover = new Y.Popover(
					{
						align: {
						node: userScore,
						points:[Y.WidgetPositionAlign.LC, Y.WidgetPositionAlign.RC]
					},
						bodyContent: 'The current level you are on, number of balls on-screen, elapsed time, and your score are displayed here. The level will change every 10 seconds.',
						position: 'right'
					}
				).render();

				difficultySliderPopover = new Y.Popover(
					{
						align: {
						node: difficultySlider,
						points:[Y.WidgetPositionAlign.RC, Y.WidgetPositionAlign.BL]
					},
						bodyContent: 'You can control the difficulty level (numbers of balls on screen) with this slider. Left is easy, right is...well...death.',
						position: 'left'
					}
				).render();

				canvasPopover = new Y.Popover(
					{
						align: {
						node: canvasContainer,
						points:[Y.WidgetPositionAlign.RC, Y.WidgetPositionAlign.LC]
					},
						bodyContent: 'This is where the action takes place. You will control the large red ball at the bottom of the screen. The other balls will start at the top half of the screen; avoid them!',
						position: 'left'
					}
				).render();

				healthBarPopover = new Y.Popover(
					{
						align: {
						node: hBar,
						points:[Y.WidgetPositionAlign.RC, Y.WidgetPositionAlign.LC]
					},
						bodyContent: 'This bar shows your current damage. Try to avoid filling it with red...',
						position: 'left'
					}
				).render();

				startPopover = new Y.Popover(
					{
						align: {
						node: start,
						points:[Y.WidgetPositionAlign.RC, Y.WidgetPositionAlign.LC]
					},
						bodyContent: 'Press to start a new game or un-pause a paused game.',
						position: 'left'
					}
				).render();

				showingPopovers = true;
			}

			else if (showingPopovers == true) {
				startPopover.destroy();
				healthBarPopover.destroy();
				canvasPopover.destroy();
				difficultySliderPopover.destroy();
				hudPopover.destroy();
				userBallPopover.destroy();
				showingPopovers = false;
			}
		}

		// start when user clicks on start button, hide other buttons
		start.on('click', function() {
			startLevelTimer();
			loadBallArray(); // load balls into the ball array
			drawInterval = setInterval(draw, 16); // redraw canvas every 16 milliseconds
			start.setStyle('visibility','hidden');
			pause.setStyle('visibility','visible');
			newBall.setStyle('visibility','visible');
			startOver.setStyle('visibility','hidden');
			ballCounter.setContent('Balls: ' + numberOfBalls);
		});

		// stop drawing on canvas and hide/show appropriate buttons when pause button is clicked
		pause.on('click', function() {
			start.setStyle('visibility','visible');
			pause.setStyle('visibility','hidden');
			newBall.setStyle('visibility','hidden');
			clearInterval(drawInterval);
			clearInterval(timerInterval);
		});

		// add a new ball object to the ball array when the button is clicked
		newBall.on('click', function() {
			ballsArray.push(new Ball());
			numberOfBalls += 1;
			ballCounter.setContent('Balls: ' + numberOfBalls);
		});

		instructions.on('click', function() {
			showInstructionsPopovers();
		})

		// reload the page when the start over button is clicked
		startOver.on('click', function() {
			location.reload();
		});

		// launch game over (modal) message, hide appropriate buttons, and stop re-drawing canvas
		function gameEnded() {
			var modal = new Y.Modal(
				{
					bodyContent: 'Game over! Can you beat your score? Try again!',
					centered: true,
					draggable: false,
					headerContent: 'Game Over!',
					render: '#modal',
					resizable: false
				}
			).render();

			start.setStyle('visibility','hidden');
			pause.setStyle('visibility','hidden');
			newBall.setStyle('visibility','hidden');
			startOver.setStyle('visibility','visible');
			clearInterval(drawInterval);
			clearInterval(timerInterval);
		}

		// update the health bar with number of hits and end game if they exceed upper limit
		function updateDamage() {
			healthBar.set('value',hits);

			if (hits >= 100) {
				gameEnded();
			}
		}

		function loadBallArray() {
			ballsArray = new Array(numberOfBalls);

			// load a new ball object into each address of the array
			for (var i = 0; i < ballsArray.length; i++) {
				ballsArray[i] = new Ball();
			}

			// create user ball with specific attributes and place in ball array
			userBall = new Ball();
			userBall.col = '#F71207';
			userBall.dirX = 0;
			userBall.dirY = 0;
			userBall.x = 300;
			userBall.y = 460;
			userBall.radius = 20;

			// place the user ball into the first position of the array to keep track of it more easily
			ballsArray.unshift(userBall);
		}

	}
); // end YUI