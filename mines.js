require("readline").emitKeypressEvents(process.stdin);
print("\x1b[2J\x1b[H");
process.stdin.setRawMode(true);
process.stdin.on("keypress", (chunk, key) => {
	if (key.ctrl && key.name === "c") {
		print("", true);
		process.exit();
	} else {
		onKey(key);
	}
});

const WIDTH = 10;
const HEIGHT = 10;
const MINES = 10;
const States = {PLAYING: 0, WIN: 1, DEAD: 2};
let cursor = {x: 0, y: 0};
let field = [];
let state;
let left;
let mined;

function init() {
	for (let y = 0; y < HEIGHT; y++) {
		field[y] = [];
		for (let x = 0; x < WIDTH; x++) {
			field[y][x] = {};
		}
	}
	reset();
}

function reset() {
	state = States.PLAYING;
	mined = false;

	cursor.x = 0;
	cursor.y = 0;

	for (let y = 0; y < HEIGHT; y++) {
		for (let x = 0; x < WIDTH; x++) {
			field[y][x].hidden = true;
			field[y][x].flag = false;
			field[y][x].value = 0;
		}
	}

	draw();
}

function setMines(fx, fy) {
	left = Math.max(WIDTH * HEIGHT - MINES, 1);
	let mines = 0;
	while (mines < Math.min(MINES, WIDTH * HEIGHT - 1)) {
		let x = Math.floor(Math.random() * WIDTH);
		let y = Math.floor(Math.random() * HEIGHT);
		if ((x !== fx || y !== fy) && field[y][x].value !== "*") {
			field[y][x].value = "*";
			addNumber(x - 1, y - 1);
			addNumber(x - 1, y    );
			addNumber(x - 1, y + 1);
			addNumber(x    , y - 1);
			addNumber(x    , y + 1);
			addNumber(x + 1, y - 1);
			addNumber(x + 1, y    );
			addNumber(x + 1, y + 1);
			mines++;
		}
	}

	mined = true;
}

function addNumber(x, y) {
	if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
	if (field[y][x].value === "*") return;
	field[y][x].value += 1;
}

let keying = false;
async function onKey(key) {
	if (state === States.DEAD || state === States.WIN) {
		if (key.name === "z") {
			reset();
		}
		return;
	}

	if (keying) return;
	keying = true;
	let {x, y} = cursor;
	switch (key.name) {
		case "k":
		case "up":
			y--;
			break;
		case "j":
		case "down":
			y++;
			break;
		case "h":
		case "left":
			x--;
			break;
		case "l":
		case "right":
			x++;
			break;
		case "z":
			await flip(x, y);
			break;
		case "x":
			flag(x, y);
	}

	x = Math.max(Math.min(x, WIDTH - 1), 0);
	y = Math.max(Math.min(y, HEIGHT - 1), 0);

	cursor.x = x;
	cursor.y = y;

	keying = false;
	draw();
}

function flag(x, y) {
	if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
	const one = field[y][x];
	if (!one.hidden) return;
	one.flag = !one.flag;
}

async function flip(x, y) {
	if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;

	if (!mined) setMines(x, y);

	const one = field[y][x];
	if (one.flag || !one.hidden) return;
	one.hidden = false;

	if (one.value === "*") {
		state = States.DEAD;
		return;
	}

	left--;
	if (left <= 0) {
		state = States.WIN;
		return;
	}

	draw(x, y);
	await sleep(20);

	if (one.value === 0) {
		await flip(x - 1, y - 1);
		await flip(x    , y - 1);
		await flip(x + 1, y - 1);
		await flip(x - 1, y    );
		await flip(x + 1, y    );
		await flip(x - 1, y + 1);
		await flip(x    , y + 1);
		await flip(x + 1, y + 1);
	}
}

async function sleep(time) {
	return new Promise(resolve => {
		setTimeout(resolve, time);
	});
}

function draw() {
	print(`\r\x1b[${HEIGHT + 3}A`);
	for (let i = 0; i < WIDTH * 0.5; i++) {
		print("  ");
	}
	print(" ");
	switch (state) {
		case States.DEAD:
			print("X(");
			break;
		case States.PLAYING:
			if (keying) print(":O");
			else print (":)");
			break;
		case States.WIN:
			print("X)");
			break;
	}
	print("", true);
	for (let i = 0; i < WIDTH + 2; i++) {
		print("██");
	}
	print("", true);
	for (let y = 0; y < HEIGHT; y++) {
		print("██");
		for (let x = 0; x < WIDTH; x++) {
			let {hidden, flag, value} = field[y][x];
			if (x === cursor.x && y === cursor.y) {
				if (hidden) {
					if (flag) {
						print("\x1b[101m P\x1b[0m");
					} else {
						print("\x1b[105m░░\x1b[0m");
					}
				} else if (value === 0) {
					print(`\x1b[105m  \x1b[0m`);
				} else {
					print(`\x1b[105m${value.toString().padStart(2, " ")}\x1b[0m`);
				}
			} else {
				if (hidden) {
					if (flag) {
						print("\x1b[91m P\x1b[0m");
					} else {
						print("░░");
					}
				} else if (value === 0) {
					print("  ");
				} else {
					print(value.toString().padStart(2, " "));
				}
			}
		}
		print("██", true);
	}
	for (let i = 0; i < WIDTH + 2; i++) {
		print("██");
	}
}

function print(string, newLine) {
	process.stdout.write(string);
	if (newLine) process.stdout.write("\n");
}

init();
