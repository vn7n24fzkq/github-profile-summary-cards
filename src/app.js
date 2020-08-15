#!/usr/bin/env node

const writer = require("./utils/svg-writer");
const TopLangCard = require("./templates/top-lang-card");

var myArgs = process.argv.slice(2);
let card = new TopLangCard("user");
writer.save("test", card.getSVG());
