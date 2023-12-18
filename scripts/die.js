import * as utils from "./utils.js";

const Pip = (key) => "<span class=\"pip\" key=\"" + key.toString() + "\" ></span>";
const BigPip = (value) => "<span class=\"bigpip\">{0}</span>".format(value);

const Face = (children) => "<div class=\"face\">" + children + "</div>";

export const Die = (value) => {
	if (! Number.isInteger(value)) { throw "Dice value should be an Integer."; }
	let pips = [];
	if (value <= 6)
		pips = Array(value).fill(0).map((_, i) => Pip(i));
	else
		pips = [BigPip(value)];
	return Face( pips.join("") );
};

export const RollDie = async (elem, max, timer, rollTime) => {
	let _timer = timer;
	let _value = 1;
	while (_timer > 0)
	{
		_value = 1 + utils.getRandomInt(max);
		elem.innerHTML = Die(_value);
		await new Promise(resolve => setTimeout(resolve, rollTime));
		_timer = _timer - rollTime;
	}
	return _value;
};
