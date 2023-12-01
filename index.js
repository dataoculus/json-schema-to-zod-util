const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function resolveAndGenerateTypes(inputFilePath, outputFolderPath) {
  const resolveCommand = `json-refs resolve ${inputFilePath}.json`;
  const toZodCommand = `json-schema-to-zod -n ${path.basename(inputFilePath)}`;
  const prettierCommand = "prettier --parser typescript";

  try {
    // Resolve JSON references
    const resolvedJson = execSync(resolveCommand, { encoding: "utf-8" });
    const resolvedObject = JSON.parse(resolvedJson);

    // Include properties from 'extends' section
    const extendedProperties = resolvedObject.extends
      ? resolvedObject.extends.properties
      : {};

    // Include properties from the main section
    const mainProperties = resolvedObject.properties || {};

    // Merge properties
    const allProperties = { ...extendedProperties, ...mainProperties };

    // Create a new object with merged properties
    const mergedObject = { ...resolvedObject, properties: allProperties };

    // Generate Zod types from JSON schema
    const zodTypes = execSync(`${toZodCommand}`, {
      input: JSON.stringify(mergedObject),
      encoding: "utf-8",
    });

    // Format the generated TypeScript code using Prettier
    const formattedCode = execSync(`${prettierCommand}`, {
      input: zodTypes,
      encoding: "utf-8",
    });

    // Create output folder if it doesn't exist
    if (!fs.existsSync(outputFolderPath)) {
      fs.mkdirSync(outputFolderPath, { recursive: true });
    }

    // Write the formatted code to a TypeScript file in the output folder
    const outputFileName = path.join(
      outputFolderPath,
      `${path.basename(inputFilePath)}.ts`
    );

    // Append the final line to the converted TypeScript file
    const finalLine = `export type Z${path.basename(
      inputFilePath
    )} = z.infer<typeof ${path.basename(inputFilePath)}>;\n`;
    const finalCode = formattedCode + finalLine;

    fs.writeFileSync(outputFileName, finalCode);

    console.log(`Successfully generated types in ${outputFileName}`);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

function processFolder(inputFolderPath, outputRootFolderPath) {
  fs.readdirSync(inputFolderPath, { withFileTypes: true }).forEach((item) => {
    const itemPath = path.join(inputFolderPath, item.name);
    if (item.isDirectory() && item.name !== "node_modules") {
      const subfolderOutputPath = path.join(
        outputRootFolderPath,
        path.relative(inputFolderPath, itemPath)
      );
      processFolder(itemPath, subfolderOutputPath);
    } else if (item.isFile() && item.name.endsWith(".json")) {
      const relativePath = path.relative(inputRootFolderPath, itemPath);
      const outputFolderPath = path.join("zod", path.dirname(relativePath));
      resolveAndGenerateTypes(itemPath.replace(".json", ""), outputFolderPath);
    }
  });
}

// Specify the root folder paths
const inputRootFolderPath = process.cwd(); //
const outputRootFolderPath = ""; // Output folder

processFolder(inputRootFolderPath, outputRootFolderPath);
function generateZodTypes(inputRootFolderPath, outputRootFolderPath) {
  processFolder(inputRootFolderPath, outputRootFolderPath);
}

module.exports = { generateZodTypes };
