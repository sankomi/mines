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
let cursor = {x: 0, y: 0};
let field = [];
for (let y = 0; y < HEIGHT; y++) {
	field[y] = [];
	for (let x = 0; x < WIDTH; x++) {
		field[y][x] = {
			hidden: true,
			value: 0,
		};
	}
}
let mines = 0;
while (mines < 10) {
	let x = Math.floor(Math.random() * WIDTH);
	let y = Math.floor(Math.random() * HEIGHT);
	if (field[y][x].value === 0) {
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
function addNumber(x, y) {
	if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
	if (field[y][x] === "*") return;
	field[y][x].value += 1;
}

let keying = false;
function onKey(key) {
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
			flip(x, y);
			break;
	}

	x = Math.max(Math.min(x, WIDTH - 1), 0);
	y = Math.max(Math.min(y, HEIGHT - 1), 0);

	cursor.x = x;
	cursor.y = y;
	draw();

	keying = false;
}

function flip(x, y) {
	if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
	const one = field[y][x];
	if (!one.hidden) return;
	one.hidden = false;
	if (one.value === 0) {
		flip(x - 1, y - 1);
		flip(x    , y - 1);
		flip(x + 1, y - 1);
		flip(x - 1, y    );
		flip(x + 1, y    );
		flip(x - 1, y + 1);
		flip(x    , y + 1);
		flip(x + 1, y + 1);
	}
}

draw();
function draw() {
	print(`\r\x1b[${HEIGHT + 2}A`);
	for (let i = 0; i < WIDTH + 2; i++) {
		print("██");
	}
	print("", true);
	for (let y = 0; y < HEIGHT; y++) {
		print("██");
		for (let x = 0; x < WIDTH; x++) {
			let {hidden, value} = field[y][x];
			if (x === cursor.x && y === cursor.y) {
				if (hidden) {
					print("\x1b[105m░░\x1b[0m");
				} else if (value === 0) {
					print(`\x1b[105m  \x1b[0m`);
				} else {
					print(`\x1b[105m${value.toString().padStart(2, " ")}\x1b[0m`);
				}
			} else {
				if (hidden) {
					print("░░");
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
