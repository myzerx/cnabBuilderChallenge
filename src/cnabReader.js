// fileReader.js
"use strict";
import path from "path";
import fs from "fs";
import { readFile } from "fs/promises";
import chalk from "chalk";

export function processCommandLineInput(options) {
  const { from, to, segmento, businessName } = options;
  const sliceArrayPosition = (arr, ...positions) =>
    [...arr].slice(...positions);

  const messageLog = (segmento, segmentoType, from, to) => `
----- Cnab linha ${segmentoType} -----

posição from: ${chalk.inverse.bgBlack(from)}

posição to: ${chalk.inverse.bgBlack(to)}

item isolado: ${chalk.inverse.bgBlack(segmento.substring(from - 1, to))}

item dentro da linha P: 
  ${segmento.substring(0, from)}${chalk.inverse.bgBlack(
    segmento.substring(from - 1, to)
  )}${segmento.substring(to)}

----- FIM ------
`;

  const log = console.log;

  console.time("Async reading");

  function findCnabFile(filePath) {
    const CliPath = path.resolve(filePath);

    switch (true) {
      case !fs.existsSync(CliPath):
        console.log("The provided path doesn't exist");
        break;
      case !fs.statSync(CliPath).isFile():
        console.log("The provided path isn't a file.");
        break;
      default:
        console.log("File found at:", CliPath);
        break;
    }

    return CliPath;
  }

  const filePath = process.argv[process.argv.length - 1];

  !filePath
    ? console.log("Provide a file path as a command line argument")
    : (() => {
        const resolvedFilePath = findCnabFile(filePath);

        readFile(resolvedFilePath, "utf8")
          .then((data) => {
            const cnabArray = data.split("\n");

            if (from && to && segmento) {
              const [cnabBodySegmentoP, cnabBodySegmentoQ, cnabBodySegmentoR] =
                sliceArrayPosition(cnabArray, 2, -2);

              if (segmento === "p") {
                log(messageLog(cnabBodySegmentoP, "P", from, to));
                return;
              }

              if (segmento === "q") {
                log(messageLog(cnabBodySegmentoQ, "Q", from, to));
                return;
              }

              if (segmento === "r") {
                log(messageLog(cnabBodySegmentoR, "R", from, to));
                return;
              }
            } else if (businessName) {
              const cnabFiltered = cnabArray.filter((e) =>
                e.includes(businessName)
              );

              const fullCompanyNameAndAddress = cnabArray
                .map((e) => {
                  const nameStartIndex = e.indexOf(businessName);
                  if (nameStartIndex !== -1) {
                    const nameEndIndex = e.indexOf(",", nameStartIndex);
                    if (nameEndIndex !== -1) {
                      return e.slice(nameStartIndex, nameEndIndex).trim();
                    }
                  }
                  return null;
                })
                .filter(Boolean);

              let fullCompanyName, companyAddress;

              const nameIdentifiers = ["RUA", "AV", "AVENIDA", "QD"];
              fullCompanyNameAndAddress.forEach((name) => {
                const splitCompanyNameAndAdress = name.split(
                  new RegExp(`(${nameIdentifiers.join("|")})`)
                );
                fullCompanyName = splitCompanyNameAndAdress.shift();
                companyAddress = splitCompanyNameAndAdress.splice(0).toString();

                return fullCompanyName, companyAddress;
              });

              const cnabSplit = cnabFiltered.map((e) => {
                const parts = e.split(",", 2);
                return {
                  cnabSegmentName: parts[0],
                  cnabAddress: parts[1] || "",
                  cnabPosition: cnabArray.findIndex((position) =>
                    position.includes(parts[0])
                  ),
                };
              });

              const cnabSegments = [];

              cnabSplit.forEach((item) => {
                const [cnabCode] = item.cnabSegmentName.split(" ");

                const cnabSegment = cnabCode.slice(-1);
                cnabSegments.push(cnabSegment);
              });
              const cnabSegment = cnabSegments[0];

              const jsonPayload = [
                {
                  companyName: fullCompanyName,
                  companyAddress: companyAddress,
                },
              ];

              let existingData = [];
              try {
                existingData = JSON.parse(fs.readFileSync("cnabFiles.json"));
              } catch (err) {}

              const updatedData = existingData.concat(jsonPayload);

              const jsonContent = JSON.stringify(updatedData, null, 2);

              fs.writeFile("cnabFiles.json", jsonContent, (err) => {
                if (err) {
                  console.error("Error writing JSON file:", err);
                } else {
                  console.log("JSON file created successfully");
                }
              });

              const messageLog = () => {
                return `
        ----- Cnab -----

        CompanyName: ${chalk.inverse.bgBlack(fullCompanyName)}

        Position: ${chalk.inverse.bgBlack(cnabSplit[0].cnabPosition)}

        Segment: ${chalk.inverse.bgBlack(cnabSegment)}

        ----- FIM ------
    `;
              };

              return log(messageLog());
            } else {
              console.log("No matching condition in the if statements.");
            }

            console.timeEnd("Async reading");
          })
          .catch((error) => {
            console.log("Error:", error);
          });
      })();
}
