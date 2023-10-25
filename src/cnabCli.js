"use strict";
import yargs from "yargs";
import { processCommandLineInput } from "./cnabReader.js";

const optionsYargs = yargs(process.argv.slice(2))
  .usage("Usage: $0 [options]")
  .option("f", {
    alias: "from",
    describe: "Starting position for Cnab line search",
    type: "number",
  })
  .option("t", {
    alias: "to",
    describe: "Ending position for Cnab line search",
    type: "number",
  })
  .option("s", {
    alias: "segmento",
    describe: "Cnab segment type",
    type: "string",
  })
  .option("businessName", {
    alias: "businessName",
    describe: "Business name",
    type: "string",
  })
  .demandCommand(1, "You need at least one command before moving on")
  .example(
    "$0 -f 21 -t 34 -s p utils/cnabExample.rem",
    "Lists the line and field that from and to of cnab with the file location"
  ).argv;

processCommandLineInput(optionsYargs);
