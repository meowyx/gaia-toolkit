#!/usr/bin/env node

import { Command } from "commander"
import { spawn, type SpawnOptions } from "child_process"
import inquirer from "inquirer"
import os from "os"

interface Model {
name: string
id: string
configUrl: string
sizeCategory?: ModelSizeCategory
}

enum ModelSizeCategory {
SMALL = "Small (1B - 5B parameters)",
MEDIUM = "Medium (6B - 8B parameters)",
BIG = "Big (9B+ parameters)", 
UNKNOWN = "Unknown Size",
}

function getSystemRamGB(): number {
const totalMemoryBytes = os.totalmem()
const totalMemoryGB = totalMemoryBytes / 1024 ** 3
return Math.round(totalMemoryGB * 10) / 10
}

function categorizeModel(modelId: string): ModelSizeCategory {
const idLower = modelId.toLowerCase()
const match = idLower.match(/(\d+(\.\d+)?)[bB]/)

if (match && match[1]) {
  const params = Number.parseFloat(match[1])
  if (params >= 1 && params <= 5) return ModelSizeCategory.SMALL
  if (params >= 6 && params <= 8) return ModelSizeCategory.MEDIUM
  if (params > 8) return ModelSizeCategory.BIG // Models >8B are considered BIG
}

// Fallback checks based on common naming patterns
if (idLower.includes("7b") || idLower.includes("8b")) return ModelSizeCategory.MEDIUM
if (
  idLower.includes("1b") ||
  idLower.includes("2b") ||
  idLower.includes("3b") ||
  idLower.includes("mini") ||
  idLower.includes("small")
)
  return ModelSizeCategory.SMALL
if (
  idLower.includes("13b") ||
  idLower.includes("22b") || // e.g. codestral-0.1-22b
  idLower.includes("30b") ||
  idLower.includes("70b") ||
  idLower.includes("large") ||
  idLower.includes("qwen") ||
  idLower.includes("big")
)
  return ModelSizeCategory.BIG

if (idLower.includes("phi-3-mini")) return ModelSizeCategory.SMALL
if (idLower.includes("exaone-3.5-2.4b")) return ModelSizeCategory.SMALL
if (idLower.includes("codestral-0.1-22b")) return ModelSizeCategory.BIG

return ModelSizeCategory.UNKNOWN
}

async function fetchModelsFromGitHub(): Promise<Model[]> {
console.log("⏳ Fetching latest models from GitHub...")
const apiUrl = "https://api.github.com/repos/GaiaNet-AI/node-configs/contents/"
try {
  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'GaiaNet-CLI-Model-Fetcher/0.1.0' // Or any appropriate name for your app
    }
  })
  if (!response.ok) {
    throw new Error(`GitHub API responded with status ${response.status}`)
  }
  const contents: any[] = await response.json()

  const fetchedModels = contents
    .filter((item) => item.type === "dir" && !item.name.startsWith("."))
    .map((item) => {
      const modelId = item.name
      const readableName = modelId
        .replace(/-/g, " ")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l: string) => l.toUpperCase())

      const category = categorizeModel(modelId)

      return {
        id: modelId,
        name: `${readableName}`,
        configUrl: `https://raw.githubusercontent.com/GaiaNet-AI/node-configs/main/${modelId}/config.json`,
        sizeCategory: category,
      }
    })

  if (fetchedModels.length === 0) {
    throw new Error("No models found in the GitHub repository.")
  }

  console.log("✅ Successfully fetched model list.")
  return fetchedModels
} catch (error) {
  console.error("\n❌ Error fetching models from GitHub.")
  if (error instanceof Error) console.error(`Details: ${error.message}`)
  console.error("Falling back to a minimal hardcoded list...")
  return [
    {
      name: "Phi-3 Mini 4k (Fallback)",
      id: "phi-3-mini-instruct-4k",
      configUrl: "https://raw.githubusercontent.com/GaiaNet-AI/node-configs/main/phi-3-mini-instruct-4k/config.json",
      sizeCategory: ModelSizeCategory.SMALL,
    },
    {
      name: "Llama 3 8B (Fallback)",
      id: "llama-3-8b-instruct",
      configUrl: "https://raw.githubusercontent.com/GaiaNet-AI/node-configs/main/llama-3-8b-instruct/config.json",
      sizeCategory: ModelSizeCategory.MEDIUM,
    },
    {
      name: "Codestral 0.1 22B (Fallback)",
      id: "codestral-0.1-22b",
      configUrl: "https://raw.githubusercontent.com/GaiaNet-AI/node-configs/main/codestral-0.1-22b/config.json",
      sizeCategory: ModelSizeCategory.BIG,
    },
  ]
}
}

function runCommand(command: string, args: string[] = [], options: SpawnOptions = {}): Promise<void> {
return new Promise((resolve, reject) => {
  const commandString = args.length > 0 ? `${command} ${args.join(" ")}` : command
  console.log(`\n⏳ Executing: ${commandString}`)
  const isShellCommand = command.includes("|") || command.includes(">")
  const proc = spawn(isShellCommand ? command : command, isShellCommand ? [] : args, {
    stdio: "inherit",
    shell: isShellCommand ? true : options.shell || false,
    ...options,
  })
  proc.on("close", (code) => {
    if (code === 0) {
      console.log(`✅ Command finished successfully: ${commandString}`)
      resolve()
    } else {
      const errorMsg = `Command failed with code ${code}: ${commandString}`
      console.error(`❌ ${errorMsg}`)
      reject(new Error(errorMsg))
    }
  })
  proc.on("error", (err) => {
    const errorMsg = `Failed to start command: ${commandString}`
    console.error(`❌ ${errorMsg}`)
    reject(new Error(`${errorMsg}\n${err.message}`))
  })
})
}

const program = new Command()

program
.name("gaia")
.description("CLI to install, initialize, and start GaiaNet nodes for various AI models.")
.version("0.1.0")

async function setup() {
  try {
    const totalRamGB = getSystemRamGB()
    console.log(`\nℹ️  Your system has approximately ${totalRamGB} GB of RAM.`)
    console.log("    Please consider this when selecting a model size.")

    if (totalRamGB < 4) {
      console.log("    ⚠️  Your system has very low RAM. Running even small models might be challenging.")
    } else if (totalRamGB < 8) {
      console.log("    Models in the 'Small' category are generally recommended for your system.")
    } else if (totalRamGB < 24) {
      console.log("    Models in 'Small' or 'Medium' categories are generally recommended.")
      console.log(
        "    Running 'Big' models may lead to performance issues or errors on systems with less than 24GB RAM.",
      )
    } else {
      console.log("    Your system appears to have sufficient RAM for all model categories, including 'Big' models.")
    }

    const allModels = await fetchModelsFromGitHub()
    if (allModels.length === 0) {
      console.log("No models available to set up.")
      return
    }

    const categoryAnswers = await inquirer.prompt([
      {
        type: "list",
        name: "selectedCategory",
        message: "What kind of model do you want to run?",
        choices: [
          ModelSizeCategory.SMALL,
          ModelSizeCategory.MEDIUM,
          ModelSizeCategory.BIG,
          ModelSizeCategory.UNKNOWN,
        ],
        default: ModelSizeCategory.SMALL,
      },
    ])

    const selectedCategoryValue = categoryAnswers.selectedCategory as ModelSizeCategory
    const filteredModels = allModels.filter((model) => model.sizeCategory === selectedCategoryValue)

    if (filteredModels.length === 0) {
      console.log(`\nℹ️ No models found in the "${selectedCategoryValue.split(" ")[0]}" category.`)
      const { tryAgain } = await inquirer.prompt([
        {
          type: "confirm",
          name: "tryAgain",
          message: "Would you like to select a different category?",
          default: true,
        },
      ])
      if (tryAgain) {
        return setup()
      }
      return
    }

    const modelAnswers = await inquirer.prompt([
      {
        type: "list",
        name: "selectedModelId",
        message: `Select a model from the "${selectedCategoryValue.split(" ")[0]}" category:`,
        choices: filteredModels.map((model) => ({ name: model.name, value: model.id })),
        pageSize: 10,
      },
    ])

    const selectedModelId = modelAnswers.selectedModelId
    const selectedModel = allModels.find((m) => m.id === selectedModelId)

    if (!selectedModel) {
      console.error(`Error: Could not find details for selected model ID "${selectedModelId}".`)
      process.exit(1)
    }

    if (selectedModel.sizeCategory === ModelSizeCategory.BIG && totalRamGB < 24) {
      console.warn(
        `\n⚠️  Warning: You've selected a 'Big' model (${selectedModel.name}), but your system has ${totalRamGB} GB of RAM. ` +
          "Optimal performance for 'Big' models is generally expected with 24GB RAM or more. " +
          "You might experience performance issues or out-of-memory errors.",
      )
    } else if (selectedModel.sizeCategory === ModelSizeCategory.MEDIUM && totalRamGB < 8) {
      console.warn(
        `\n⚠️  Warning: You've selected a 'Medium' model (${selectedModel.name}), but your system has ${totalRamGB} GB of RAM. Performance might be suboptimal.`,
      )
    }

    console.log(
      `\n🚀 Starting setup for GaiaNet node with model: ${selectedModel.name} (${selectedModel.sizeCategory?.split(" ")[0]})`,
    )

    console.log("\nStep 1: Installing GaiaNet node...")
    const installCommandString =
      "curl -sSfL 'https://github.com/GaiaNet-AI/gaianet-node/releases/latest/download/install.sh' | bash"
    await runCommand(installCommandString, [], { shell: true })

    console.log(`\nStep 2: Initializing with ${selectedModel.name} model...`)
    await runCommand("gaianet", ["init", "--config", selectedModel.configUrl])
    console.log(`${selectedModel.name} model initialized successfully.`)

    console.log("\nStep 3: Starting the node...")
    await runCommand("gaianet", ["start"])
    console.log("GaiaNet node started successfully.")

    console.log(`\n🎉 Setup complete for ${selectedModel.name}!`)
    console.log("Your GaiaNet node should now be running.")
  } catch (error) {
    console.error(`\n🛑 An unexpected error occurred during setup:`)
    if (error instanceof Error) {
      if ((error as any).isTtyError) console.error("Prompt couldn't be rendered. Ensure you're running in a TTY.")
      else console.error(error.message)
    } else {
      console.error(String(error))
    }
    process.exit(1)
  }
}

program
.command("setup")
.description("Interactively select a model category and then a model to install.")
.action(setup)

program.parse(process.argv)