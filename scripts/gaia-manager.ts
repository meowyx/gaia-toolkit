#!/usr/bin/env node

import { Command } from "commander"
import { spawn, exec, type SpawnOptions } from "child_process"
import inquirer from "inquirer"
import os from "os"
import chalk from "chalk"
import ora from "ora"
import gradient from "gradient-string"
import { promisify } from "util"
import readline from "readline"

interface Model {
name: string
id: string
configUrl: string
sizeCategory?: ModelSizeCategory
useCase?: string[]
}

enum ModelSizeCategory {
SMALL = "Small (1B - 5B parameters) - 8-16GB RAM",
STANDARD = "Standard (6B - 9B parameters) - 16GB RAM",
MEDIUM = "Medium (10B - 16B parameters) - 24GB RAM",
HEAVY = "Heavy (17B - 24B parameters) - 32GB RAM",
BIG = "Big (25B - 70B parameters) - 64GB RAM",
MAX = "Max (70B+ parameters) - 128GB+ RAM",
UNKNOWN = "Unknown Size",
}

interface KnowledgeBase {
  name: string
  snapshot: string
  systemPrompt: string
}

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatOptions {
  apiUrl?: string
  model?: string
  systemPrompt?: string
  system?: string
  apiKey?: string
  endpoint?: string
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
  if (params >= 6 && params <= 9) return ModelSizeCategory.STANDARD
  if (params >= 10 && params <= 16) return ModelSizeCategory.MEDIUM
  if (params >= 17 && params <= 24) return ModelSizeCategory.HEAVY
  if (params >= 25 && params <= 70) return ModelSizeCategory.BIG
  if (params > 70) return ModelSizeCategory.MAX
}

// Fallback checks based on common naming patterns
if (idLower.includes("7b") || idLower.includes("8b") || idLower.includes("9b")) return ModelSizeCategory.STANDARD
if (
  idLower.includes("1b") ||
  idLower.includes("2b") ||
  idLower.includes("3b") ||
  idLower.includes("4b") ||
  idLower.includes("5b") ||
  idLower.includes("mini") ||
  idLower.includes("small")
)
  return ModelSizeCategory.SMALL
if (idLower.includes("10b") || idLower.includes("11b") || idLower.includes("12b") || 
    idLower.includes("13b") || idLower.includes("14b") || idLower.includes("15b") || 
    idLower.includes("16b")) return ModelSizeCategory.MEDIUM

if (idLower.includes("17b") || idLower.includes("18b") || idLower.includes("19b") || 
    idLower.includes("20b") || idLower.includes("21b") || idLower.includes("22b") || 
    idLower.includes("23b") || idLower.includes("24b")) return ModelSizeCategory.HEAVY

if (idLower.includes("25b") || idLower.includes("30b") || idLower.includes("32b") || 
    idLower.includes("34b") || idLower.includes("40b") || idLower.includes("65b") || 
    idLower.includes("70b")) return ModelSizeCategory.BIG

if (idLower.includes("72b") || idLower.includes("120b") || idLower.includes("180b") || 
    idLower.includes("large") || idLower.includes("huge")) return ModelSizeCategory.MAX

if (idLower.includes("phi-3-mini")) return ModelSizeCategory.SMALL
if (idLower.includes("exaone-3.5-2.4b")) return ModelSizeCategory.SMALL
if (idLower.includes("codestral-0.1-22b")) return ModelSizeCategory.HEAVY

return ModelSizeCategory.UNKNOWN
}

function getModelUseCases(modelId: string): string[] {
const idLower = modelId.toLowerCase()

// Code-focused models
if (idLower.includes("codestral") || idLower.includes("code")) {
  return ["coding", "code-generation", "programming-assistance", "debugging"]
}

// Instruction-following models
if (idLower.includes("instruct")) {
  return ["general-chat", "question-answering", "instruction-following", "creative-writing"]
}

// Chat models
if (idLower.includes("chat")) {
  return ["general-chat", "conversation", "customer-support", "personal-assistant"]
}

// Mini/Small models - good for lightweight tasks
if (idLower.includes("mini") || idLower.includes("phi-3")) {
  return ["lightweight-tasks", "quick-responses", "resource-constrained", "mobile-deployment"]
}

// Math/reasoning models
if (idLower.includes("math") || idLower.includes("reasoning")) {
  return ["mathematical-reasoning", "problem-solving", "analytical-tasks"]
}

// Llama models - versatile general purpose
if (idLower.includes("llama")) {
  return ["general-purpose", "versatile-tasks", "balanced-performance", "research"]
}

// Default use cases for unknown models
return ["general-purpose"]
}

function getRecommendationsByUseCase(useCase: string, totalRamGB: number): string {
const recommendations: Record<string, string> = {
  "coding": `
    🔧 CODING & PROGRAMMING:
    • Small (1-5B): Basic code completion, syntax help - 8-16GB RAM
    • Standard (6-9B): Better code understanding, debugging - 16GB RAM
    • Medium (10-16B): Advanced code generation - 24GB RAM
    • Heavy (17-24B): Complex problem solving - 32GB RAM
    • Big/Max (25B+): Enterprise-level code assistance - 64GB+ RAM
    
    Recommended: Codestral 22B (Heavy, needs 32GB) or Llama 3 8B (Standard, needs 16GB)`,
    
  "general-chat": `
    💬 GENERAL CHAT & CONVERSATION:
    • Small (1-5B): Quick responses, basic chat - 8-16GB RAM
    • Standard (6-9B): Natural conversations - 16GB RAM
    • Medium (10-16B): Better context understanding - 24GB RAM
    • Heavy (17-24B): Complex discussions - 32GB RAM
    • Big/Max (25B+): Human-like interactions - 64GB+ RAM
    
    Recommended: Llama 3 8B (Standard) or Phi-3 Mini (Light) for faster responses`,
    
  "creative-writing": `
    ✍️ CREATIVE WRITING:
    • Small (1-5B): Simple tasks, short stories - 8-16GB RAM
    • Standard (6-9B): Better storytelling - 16GB RAM
    • Medium (10-16B): Character development - 24GB RAM
    • Heavy (17-24B): Complex narratives - 32GB RAM
    • Big/Max (25B+): Professional writing - 64GB+ RAM
    
    Recommended: Standard or Medium instruct models for best creativity`,
    
  "resource-constrained": `
    ⚡ RESOURCE-CONSTRAINED ENVIRONMENTS:
    • Focus on Small models (1-5B) - need only 8-16GB RAM
    • Phi-3 Mini: Excellent performance-to-size ratio
    • ExaOne 2.4B: Good for multilingual tasks
    
    Your system (${totalRamGB}GB RAM): ${totalRamGB < 16 ? 'Small models only' : totalRamGB < 24 ? 'Small/Standard models' : 'Consider Standard/Medium models'}`,
    
  "research": `
    🔬 RESEARCH & ANALYSIS:
    • Standard (6-9B): Literature review - 16GB RAM
    • Medium (10-16B): Data analysis - 24GB RAM
    • Heavy (17-24B): Research assistance - 32GB RAM
    • Big/Max (25B+): Complex reasoning - 64GB+ RAM
    
    Recommended: Llama 3 8B (Standard) or larger models for comprehensive research`
}

return recommendations[useCase] || `
    📝 GENERAL PURPOSE:
    • Small (1-5B): Fast responses, basic tasks - 8-16GB RAM
    • Standard (6-9B): Balanced performance - 16GB RAM
    • Medium (10-16B): Enhanced capabilities - 24GB RAM
    • Heavy (17-24B): Advanced features - 32GB RAM
    • Big (25-70B): Maximum performance - 64GB RAM
    • Max (70B+): Enterprise solutions - 128GB+ RAM
    
    Your system (${totalRamGB}GB RAM): ${totalRamGB < 16 ? 'Small models only' : totalRamGB < 24 ? 'Small/Standard models' : totalRamGB < 32 ? 'Up to Medium models' : totalRamGB < 64 ? 'Up to Heavy models' : totalRamGB < 128 ? 'Up to Big models' : 'All models supported'}`
}

async function fetchModelsFromGitHub(): Promise<Model[]> {
const spinner = ora({
  text: 'Fetching latest models from GitHub...',
  spinner: 'dots12',
  color: 'cyan'
}).start()

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
        useCase: getModelUseCases(modelId),
      }
    })

  if (fetchedModels.length === 0) {
    throw new Error("No models found in the GitHub repository.")
  }

  spinner.succeed('Successfully fetched model list.')
  return fetchedModels
} catch (error) {
  spinner.fail('Error fetching models from GitHub.')
  if (error instanceof Error) console.error(`Details: ${error.message}`)
  console.error("Falling back to a minimal hardcoded list...")
  return [
    {
      name: "Phi-3 Mini 4k (Fallback)",
      id: "phi-3-mini-instruct-4k",
      configUrl: "https://raw.githubusercontent.com/GaiaNet-AI/node-configs/main/phi-3-mini-instruct-4k/config.json",
      sizeCategory: ModelSizeCategory.SMALL,
      useCase: getModelUseCases("phi-3-mini-instruct-4k"),
    },
    {
      name: "Llama 3 8B (Fallback)",
      id: "llama-3-8b-instruct",
      configUrl: "https://raw.githubusercontent.com/GaiaNet-AI/node-configs/main/llama-3-8b-instruct/config.json",
      sizeCategory: ModelSizeCategory.MEDIUM,
      useCase: getModelUseCases("llama-3-8b-instruct"),
    },
    {
      name: "Codestral 0.1 22B (Fallback)",
      id: "codestral-0.1-22b",
      configUrl: "https://raw.githubusercontent.com/GaiaNet-AI/node-configs/main/codestral-0.1-22b/config.json",
      sizeCategory: ModelSizeCategory.BIG,
      useCase: getModelUseCases("codestral-0.1-22b"),
    },
  ]
}
}

function runCommand(command: string, args: string[] = [], options: SpawnOptions = {}): Promise<void> {
return new Promise((resolve, reject) => {
  const commandString = args.length > 0 ? `${command} ${args.join(" ")}` : command
  console.log(chalk.gray(`\n⏳ Executing: ${commandString}`))
  const isShellCommand = command.includes("|") || command.includes(">")
  const proc = spawn(isShellCommand ? command : command, isShellCommand ? [] : args, {
    stdio: "inherit",
    shell: isShellCommand ? true : options.shell || false,
    ...options,
  })
  proc.on("close", (code) => {
    if (code === 0) {
      console.log(chalk.green(`✅ Command finished successfully: ${commandString}`))
      resolve()
    } else {
      const errorMsg = `Command failed with code ${code}: ${commandString}`
      console.error(chalk.red(`❌ ${errorMsg}`))
      reject(new Error(errorMsg))
    }
  })
  proc.on("error", (err) => {
    const errorMsg = `Failed to start command: ${commandString}`
    console.error(chalk.red(`❌ ${errorMsg}`))
    reject(new Error(`${errorMsg}\n${err.message}`))
  })
})
}

const program = new Command()

async function promptToReturnToMenu() {
  const { returnToMenu } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'returnToMenu',
      message: '\nWould you like to return to the main menu?',
      default: true
    }
  ])
  
  if (returnToMenu) {
    await mainMenu()
  } else {
    console.log(chalk.yellow('\nGoodbye! 👋'))
    process.exit(0)
  }
}

program
.name("gaia")
.description("CLI to install, initialize, and start GaiaNet nodes for various AI models.")
.version("0.1.0")

async function showWelcomeBanner() {
  console.clear()
  
  console.log(`
╔════════════════════════════════════════════════════════════════════════════════════════════╗
║   ██████╗  █████╗ ██╗ █████╗     ████████╗ ██████╗  ██████╗ ██╗     ██╗  ██╗██╗████████╗   ║
║  ██╔════╝ ██╔══██╗██║██╔══██╗    ╚══██╔══╝██╔═══██╗██╔═══██╗██║     ██║ ██╔╝██║╚══██╔══╝   ║
║  ██║  ███╗███████║██║███████║       ██║   ██║   ██║██║   ██║██║     █████╔╝ ██║   ██║      ║
║  ██║   ██║██╔══██║██║██╔══██║       ██║   ██║   ██║██║   ██║██║     ██╔═██╗ ██║   ██║      ║
║  ╚██████╔╝██║  ██║██║██║  ██║       ██║   ╚██████╔╝╚██████╔╝███████╗██║  ██╗██║   ██║      ║
║   ╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝       ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝   ╚═╝      ║
║                                                                                            ║
║                            🤖 Your Own AI, Your Own Data                                   ║
╚════════════════════════════════════════════════════════════════════════════════════════════╝
`)
  
  console.log(chalk.gray('\n─────────────────────────────────────────\n'))

  console.log(chalk.yellow.bold('🚀 AVAILABLE COMMANDS:'))
  console.log(chalk.gray('──────────────────────────────────────────────────────────────────────────────'))
  console.log(chalk.cyan('  gaia list       ') + chalk.gray('🔍 Browse available models with filtering options'))
  console.log(chalk.cyan('  gaia info       ') + chalk.gray('📊 Get detailed information about a specific model'))
  console.log(chalk.cyan('  gaia run        ') + chalk.gray('⚡ Quick model deployment (install and run)'))
  console.log(chalk.cyan('  gaia setup      ') + chalk.gray('📦 Interactive model selection and installation'))
  console.log(chalk.cyan('  gaia help       ') + chalk.gray('📚 Show comprehensive model selection guide'))
  console.log(chalk.cyan('  gaia recommend  ') + chalk.gray('🎯 Get personalized model recommendations'))
  console.log(chalk.cyan('  gaia chat       ') + chalk.gray('💬 Chat with a Gaia AI node'))
  console.log(chalk.cyan('  gaia kb         ') + chalk.gray('📚 Configure knowledge bases'))

  console.log(chalk.gray('\n💡 QUICK START:'))
  console.log(chalk.gray("  Run 'gaia list' to see available models or 'gaia setup' for guided installation!"))
  console.log(chalk.gray("\n🔧 Need help choosing a model? Run 'gaia recommend' for personalized suggestions."))
}

async function showHelp() {
  try {
    const totalRamGB = getSystemRamGB()
    
    console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                    🤖 GAIA MODEL SELECTION GUIDE                ║
╚══════════════════════════════════════════════════════════════════╝

📊 YOUR SYSTEM: ${totalRamGB}GB RAM

🎯 CHOOSE BY USE CASE:
──────────────────────────────────────────────────────────────────
`)

    const useCases = [
      "coding",
      "general-chat", 
      "creative-writing",
      "resource-constrained",
      "research"
    ]

    for (const useCase of useCases) {
      console.log(getRecommendationsByUseCase(useCase, totalRamGB))
      console.log("──────────────────────────────────────────────────────────────────")
    }

    console.log(`
💡 QUICK SELECTION TIPS:
• New to AI models? Start with Phi-3 Mini or Llama 3 8B
• Need fast responses? Choose Small models (1-5B parameters)
• Want best quality? Choose Big models (9B+) if you have 24GB+ RAM
• Coding tasks? Codestral models are specialized for programming
• General purpose? Llama models are versatile and well-tested

⚡ PERFORMANCE vs RESOURCE TRADE-OFF:
• Small models: Fast, efficient, good for basic tasks
• Medium models: Balanced performance, handles most use cases well  
• Big models: Best quality, slowest, needs more RAM

🔧 COMMANDS:
• gaia setup    - Interactive model selection and installation
• gaia help     - Show this guide
• gaia recommend - Get personalized model recommendations

For more detailed setup, run: gaia setup
`)

  } catch (error) {
    console.error("Error displaying help:", error)
  }
}

async function showRecommendations() {
  try {
    const totalRamGB = getSystemRamGB()
    console.log(`\n🎯 PERSONALIZED MODEL RECOMMENDATIONS`)
    console.log(`   Based on your system: ${totalRamGB}GB RAM\n`)

    const { useCase } = await inquirer.prompt([
      {
        type: "list",
        name: "useCase",
        message: "What will you primarily use the AI model for?",
        choices: [
          { name: "🔧 Coding & Programming", value: "coding" },
          { name: "💬 General Chat & Conversation", value: "general-chat" },
          { name: "✍️  Creative Writing", value: "creative-writing" },
          { name: "🔬 Research & Analysis", value: "research" },
          { name: "⚡ Resource-Constrained Environment", value: "resource-constrained" },
          { name: "📝 General Purpose", value: "general-purpose" }
        ],
        pageSize: 6
      }
    ])

    console.log(getRecommendationsByUseCase(useCase, totalRamGB))

    const { showModels } = await inquirer.prompt([
      {
        type: "confirm",
        name: "showModels",
        message: "Would you like to see available models and start setup?",
        default: true
      }
    ])

    if (showModels) {
      console.log("\n🚀 Starting setup process...\n")
      await setup()
    }

  } catch (error) {
    console.error("Error showing recommendations:", error)
  }
}

async function setup() {
  try {
    const totalRamGB = getSystemRamGB()
    console.log(`\nℹ️  Your system has approximately ${totalRamGB} GB of RAM.`)
    console.log("    Please consider this when selecting a model size.")

    if (totalRamGB < 8) {
      console.log("    ⚠️  Your system has very low RAM. Running AI models will be challenging.")
      console.log("    Consider upgrading to at least 8GB RAM for basic model support.")
    } else if (totalRamGB < 16) {
      console.log("    ✓ Small models (1B-5B) are recommended for your system.")
      console.log("    ⚠️  Standard models (6B-9B) may run but could be slow.")
    } else if (totalRamGB < 24) {
      console.log("    ✓ Small (1B-5B) and Standard (6B-9B) models are recommended.")
      console.log("    ⚠️  Medium models (10B-16B) require 24GB RAM.")
    } else if (totalRamGB < 32) {
      console.log("    ✓ Small, Standard, and Medium models (up to 16B) are supported.")
      console.log("    ⚠️  Heavy models (17B-24B) require 32GB RAM.")
    } else if (totalRamGB < 64) {
      console.log("    ✓ Small, Standard, Medium, and Heavy models (up to 24B) are supported.")
      console.log("    ⚠️  Big models (25B-70B) require 64GB RAM.")
    } else if (totalRamGB < 128) {
      console.log("    ✓ All models up to 70B parameters are supported.")
      console.log("    ⚠️  Max models (70B+) require 128GB+ RAM.")
    } else {
      console.log("    ✓ Your system has sufficient RAM for all model categories, including Max models (70B+).")
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
          ModelSizeCategory.STANDARD,
          ModelSizeCategory.MEDIUM,
          ModelSizeCategory.HEAVY,
          ModelSizeCategory.BIG,
          ModelSizeCategory.MAX,
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
.action(async () => {
  await setup()
  await promptToReturnToMenu()
})

program
.command("help")
.description("Show comprehensive model selection guide and recommendations.")
.action(async () => {
  await showHelp()
  await promptToReturnToMenu()
})

program
.command("recommend")
.description("Get personalized model recommendations based on your use case.")
.action(async () => {
  await showRecommendations()
  if (!process.exitCode) {
    await promptToReturnToMenu()
  }
})

program
.command("welcome")
.description("Show the welcome banner with available commands.")
.action(async () => {
  await showWelcomeBanner()
  await promptToReturnToMenu()
})

async function listModels(options: { size?: string; useCase?: string; format?: string }) {
  try {
    const models = await fetchModelsFromGitHub()
    
    // Filter models based on options
    let filteredModels = models
    
    if (options.size) {
      const sizeFilter = options.size.toLowerCase()
      filteredModels = filteredModels.filter(model => {
        const category = model.sizeCategory?.toLowerCase() || ''
        return category.includes(sizeFilter)
      })
    }
    
    if (options.useCase) {
      const useCaseFilter = options.useCase.toLowerCase()
      filteredModels = filteredModels.filter(model => 
        model.useCase?.some(uc => uc.toLowerCase().includes(useCaseFilter))
      )
    }
    
    // Sort models by size category
    const sizeOrder = [
      ModelSizeCategory.SMALL,
      ModelSizeCategory.STANDARD,
      ModelSizeCategory.MEDIUM,
      ModelSizeCategory.HEAVY,
      ModelSizeCategory.BIG,
      ModelSizeCategory.MAX,
      ModelSizeCategory.UNKNOWN
    ]
    
    filteredModels.sort((a, b) => {
      const aIndex = sizeOrder.indexOf(a.sizeCategory || ModelSizeCategory.UNKNOWN)
      const bIndex = sizeOrder.indexOf(b.sizeCategory || ModelSizeCategory.UNKNOWN)
      return aIndex - bIndex
    })
    
    if (options.format === 'json') {
      console.log(JSON.stringify(filteredModels, null, 2))
      return
    }
    
    // Display models in a table format
    console.log("\n📋 Available Models:\n")
    console.log("═".repeat(100))
    
    let currentCategory = ''
    filteredModels.forEach((model) => {
      if (model.sizeCategory !== currentCategory) {
        currentCategory = model.sizeCategory || ModelSizeCategory.UNKNOWN
        console.log(`\n${currentCategory}`)
        console.log("─".repeat(100))
      }
      
      const useCases = model.useCase?.join(', ') || 'general-purpose'
      console.log(`  ${model.id.padEnd(40)} ${model.name.padEnd(40)}`)
      console.log(`  ${' '.repeat(40)} Use cases: ${useCases}`)
    })
    
    console.log("\n═".repeat(100))
    console.log(`\nTotal models: ${filteredModels.length}`)
    
    if (options.size || options.useCase) {
      console.log(`Filtered by: ${options.size ? `size=${options.size} ` : ''}${options.useCase ? `use-case=${options.useCase}` : ''}`)
    }
    
    console.log("\n💡 Tip: Use 'gaia info <model-id>' to see detailed information about a specific model")
    
  } catch (error) {
    console.error("❌ Error fetching models:", error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

async function showModelInfo(modelId: string) {
  try {
    const models = await fetchModelsFromGitHub()
    const model = models.find(m => m.id.toLowerCase() === modelId.toLowerCase())
    
    if (!model) {
      console.error(`❌ Model '${modelId}' not found.`)
      console.log("\n💡 Use 'gaia list' to see all available models")
      process.exit(1)
    }
    
    console.log("\n📦 Model Information:\n")
    console.log("═".repeat(80))
    console.log(`Model ID:     ${model.id}`)
    console.log(`Name:         ${model.name}`)
    console.log(`Size:         ${model.sizeCategory || ModelSizeCategory.UNKNOWN}`)
    console.log(`Use Cases:    ${model.useCase?.join(', ') || 'general-purpose'}`)
    console.log(`Config URL:   ${model.configUrl}`)
    console.log("═".repeat(80))
    
    // Extract parameter count from model ID
    const match = model.id.toLowerCase().match(/(\d+(\.\d+)?)[bB]/)
    if (match && match[1]) {
      const params = Number.parseFloat(match[1])
      console.log(`\n📊 Model Details:`)
      console.log(`  • Parameters: ~${params}B`)
      console.log(`  • Recommended RAM: ${params <= 5 ? '8-16GB' : params <= 9 ? '16GB' : params <= 16 ? '24GB' : params <= 24 ? '32GB' : params <= 70 ? '64GB' : '128GB+'}`)
      console.log(`  • Performance: ${params <= 5 ? 'Fast' : params <= 16 ? 'Balanced' : params <= 70 ? 'High Quality' : 'Maximum Quality'}`)
    }
    
    console.log(`\n💻 System Compatibility:`)
    const systemRam = getSystemRamGB()
    const minRam = match && match[1] ? 
      (Number.parseFloat(match[1]) <= 5 ? 8 : 
       Number.parseFloat(match[1]) <= 9 ? 16 : 
       Number.parseFloat(match[1]) <= 16 ? 24 : 
       Number.parseFloat(match[1]) <= 24 ? 32 : 
       Number.parseFloat(match[1]) <= 70 ? 64 : 128) : 16
    
    if (systemRam >= minRam) {
      console.log(`  ✅ Your system (${systemRam}GB RAM) meets the requirements`)
    } else {
      console.log(`  ⚠️  Your system (${systemRam}GB RAM) may not have enough RAM (${minRam}GB recommended)`)
    }
    
    console.log(`\n🚀 To install this model, run:`)
    console.log(`  gaia setup`)
    console.log(`  Then select: ${model.sizeCategory} → ${model.name}`)
    
  } catch (error) {
    console.error("❌ Error fetching model information:", error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

program
  .command("list")
  .description("List all available models with optional filtering")
  .option("-s, --size <size>", "Filter by size category (small, standard, medium, heavy, big, max)")
  .option("-u, --use-case <useCase>", "Filter by use case (coding, chat, creative, etc.)")
  .option("-f, --format <format>", "Output format (table or json)", "table")
  .action(async (options) => {
    await listModels(options)
    await promptToReturnToMenu()
  })

program
  .command("info <model>")
  .description("Show detailed information about a specific model")
  .action(async (modelId) => {
    await showModelInfo(modelId)
    await promptToReturnToMenu()
  })

async function runModel(modelId: string, options: { skipInstall?: boolean; force?: boolean }) {
  try {
    const models = await fetchModelsFromGitHub()
    const model = models.find(m => m.id.toLowerCase() === modelId.toLowerCase())
    
    if (!model) {
      console.error(`❌ Model '${modelId}' not found.`)
      console.log("\n💡 Use 'gaia list' to see all available models")
      process.exit(1)
    }
    
    // Check system compatibility
    const systemRam = getSystemRamGB()
    const match = model.id.toLowerCase().match(/(\d+(\.\d+)?)[bB]/)
    const minRam = match && match[1] ? 
      (Number.parseFloat(match[1]) <= 5 ? 8 : 
       Number.parseFloat(match[1]) <= 9 ? 16 : 
       Number.parseFloat(match[1]) <= 16 ? 24 : 
       Number.parseFloat(match[1]) <= 24 ? 32 : 
       Number.parseFloat(match[1]) <= 70 ? 64 : 128) : 16
    
    if (systemRam < minRam) {
      console.error("\n❌ System Requirements Not Met")
      console.error("═".repeat(50))
      console.error(`Model:         ${model.name}`)
      console.error(`Required RAM:  ${minRam}GB minimum`)
      console.error(`Your RAM:      ${systemRam}GB`)
      console.error(`Shortage:      ${minRam - systemRam}GB`)
      console.error("═".repeat(50))
      
      if (!options.force) {
        console.log("\n⚠️  Running this model on your system could cause:")
        console.log("   • System freezes or crashes")
        console.log("   • Extremely slow performance")
        console.log("   • Out of memory errors")
        console.log("   • Potential data loss")
        
        console.log("\n💡 Recommendations:")
        console.log("   1. Choose a smaller model that fits your system")
        console.log("   2. Use 'gaia list' to see models suitable for your RAM")
        console.log("   3. Use 'gaia recommend' for personalized suggestions")
        
        console.log("\n🚨 To override this safety check (NOT RECOMMENDED):")
        console.log(`   gaia run ${modelId} --force`)
        
        process.exit(1)
      } else {
        // Enhanced security for force flag
        console.warn("\n🚨 CRITICAL WARNING: Force Override Requested 🚨")
        console.warn("═".repeat(60))
        console.warn("YOU ARE ATTEMPTING TO OVERRIDE CRITICAL SAFETY CHECKS!")
        console.warn("═".repeat(60))
        
        console.error("\n📊 SYSTEM ANALYSIS:")
        console.error(`   Your System RAM:     ${systemRam}GB`)
        console.error(`   Model Requirements:  ${minRam}GB minimum`)
        console.error(`   RAM SHORTAGE:        ${minRam - systemRam}GB ❌`)
        
        console.warn("\n⚠️  LIKELY CONSEQUENCES:")
        console.warn("   • SYSTEM FREEZE - Your computer may become unresponsive")
        console.warn("   • MEMORY CRASH - Applications may crash unexpectedly")
        console.warn("   • DATA LOSS - Unsaved work in other applications may be lost")
        console.warn("   • HARDWARE STRESS - Extended operation may damage components")
        console.warn("   • FORCED SHUTDOWN - You may need to hard reset your computer")
        
        console.log("\n💡 STRONG RECOMMENDATIONS:")
        console.log("   1. SAVE ALL WORK in other applications NOW")
        console.log("   2. CLOSE unnecessary applications to free RAM")
        console.log("   3. Consider using a SMALLER model instead:")
        console.log(`      Run: gaia list --size small`)
        console.log("   4. Or get personalized recommendations:")
        console.log(`      Run: gaia recommend`)
        
        // First confirmation
        const { understandRisks } = await inquirer.prompt([{
          type: "confirm",
          name: "understandRisks",
          message: "Do you understand that this may CRASH YOUR SYSTEM?",
          default: false
        }])
        
        if (!understandRisks) {
          console.log("\n✅ Setup cancelled. Good decision!")
          process.exit(0)
        }
        
        // Second confirmation - make them wait
        console.warn("\n⏱️  Please wait 5 seconds to ensure you've read the warnings...")
        await new Promise(resolve => setTimeout(resolve, 5000))
        
        // Third confirmation - explicit acknowledgment
        const { acknowledgeDanger } = await inquirer.prompt([{
          type: "list",
          name: "acknowledgeDanger",
          message: "Please explicitly acknowledge the danger:",
          choices: [
            { name: "❌ Cancel - I don't want to risk system crashes", value: false },
            { name: "⚠️  I understand the risks and accept full responsibility", value: true }
          ],
          default: 0
        }])
        
        if (!acknowledgeDanger) {
          console.log("\n✅ Setup cancelled. Wise choice!")
          process.exit(0)
        }
        
        // Final confirmation - type to confirm
        const confirmPhrase = "I accept all risks"
        const { typedConfirmation } = await inquirer.prompt([{
          type: "input",
          name: "typedConfirmation",
          message: `Type "${confirmPhrase}" to proceed (case-sensitive):`,
          validate: (input: string) => {
            if (input === confirmPhrase) {
              return true
            }
            return `Please type exactly: ${confirmPhrase}`
          }
        }])
        
        if (typedConfirmation !== confirmPhrase) {
          console.log("\n✅ Setup cancelled.")
          process.exit(0)
        }
        
        // Show final warning with countdown
        console.warn("\n🚨 FINAL WARNING: Starting in 3 seconds...")
        console.warn("   Press Ctrl+C NOW to cancel!")
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.warn("   3...")
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.warn("   2...")
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.warn("   1...")
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        console.warn("\n🚨 PROCEEDING AT YOUR OWN RISK...")
        console.warn("🚨 Monitor system performance closely!")
        console.warn("🚨 Be ready to force shutdown if needed!")
      }
    }
    
    console.log(`\n🚀 Starting setup for: ${model.name}`)
    console.log(`   Model ID: ${model.id}`)
    console.log(`   Size: ${model.sizeCategory || ModelSizeCategory.UNKNOWN}`)
    console.log(`   Use Cases: ${model.useCase?.join(', ') || 'general-purpose'}`)
    
    if (!options.skipInstall) {
      console.log("\n📦 Step 1: Installing GaiaNet node...")
      const installCommandString = "curl -sSfL 'https://github.com/GaiaNet-AI/gaianet-node/releases/latest/download/install.sh' | bash"
      
      try {
        await runCommand(installCommandString, [], { shell: true })
        console.log("✅ GaiaNet node installed successfully.")
      } catch (error) {
        // Check if gaianet command exists
        try {
          await runCommand("which", ["gaianet"])
          console.log("✅ GaiaNet node already installed.")
        } catch {
          console.error("❌ Failed to install GaiaNet node.")
          throw error
        }
      }
    }
    
    console.log(`\n🔧 Step 2: Initializing with ${model.name} model...`)
    await runCommand("gaianet", ["init", "--config", model.configUrl])
    console.log(`✅ ${model.name} model initialized successfully.`)
    
    console.log("\n🚀 Step 3: Starting the node...")
    await runCommand("gaianet", ["start"])
    console.log("✅ GaiaNet node started successfully.")
    
    console.log("\n🎉 Success! Your GaiaNet node is now running with:")
    console.log(`   • Model: ${model.name}`)
    console.log(`   • Size: ${model.sizeCategory?.split(" ")[0]}`)
    
    console.log("\n💡 Next steps:")
    console.log("   • Check status: gaianet info")
    console.log("   • Stop node: gaianet stop")
    console.log("   • View logs: gaianet log")
    
  } catch (error) {
    console.error("\n❌ Error setting up model:", error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

program
  .command("run <model>")
  .description("Install and run a specific model by its ID")
  .option("--skip-install", "Skip GaiaNet installation if already installed")
  .option("--force", "Force installation even if system requirements are not met (DANGEROUS)")
  .action(async (modelId, options) => {
    await runModel(modelId, options)
    await promptToReturnToMenu()
  })

const prebuiltKnowledgeBases: KnowledgeBase[] = [
  {
    name: 'London Tour Guide',
    snapshot: 'https://huggingface.co/datasets/gaianet/london/resolve/main/london_768_nomic-embed-text-v1.5-f16.snapshot.tar.gz',
    systemPrompt: 'You are a tour guide in London, UK. Please answer the question from a London visitor accurately.'
  },
  {
    name: 'Vyper Language Expert',
    snapshot: 'https://huggingface.co/datasets/meowy-ai/vyper-lang/resolve/main/default-845259036638694-2025-04-22-09-28-18.snapshot.tar.gz',
    systemPrompt: 'You are a vyper lang expert, please answer questions'
  },
  {
    name: 'MCP Expert',
    snapshot: 'https://huggingface.co/datasets/tobySolutions/mcp-agent/resolve/main/mcp-expert.snapshot.tar.gz',
    systemPrompt: 'You are a mcp expert, please answer questions'
  },
  {
    name: 'Solidity Expert',
    snapshot: 'https://huggingface.co/datasets/harishkotra/solidity/resolve/main/solidity_snippets-7989848718163905-2025-03-27-14-08-36.snapshot',
    systemPrompt: 'You are a solidity expert, please answer questions'
  }
]

class GaiaCLI {
  private messages: Message[] = []
  private options: ChatOptions
  private rl: readline.Interface
  private shouldExit: boolean = false
  private switchTo: 'menu' | 'knowledge-base' | null = null

  constructor(options: ChatOptions) {
    this.options = options
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.blue('You: ')
    })

    if (options.system) {
      this.messages.push({
        role: 'system',
        content: options.system
      })
    }
  }

  private async sendMessage(content: string): Promise<string> {
    const spinner = ora('Thinking...').start()
    
    try {
      this.messages.push({
        role: 'user',
        content
      })

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (this.options.apiKey) {
        headers['Authorization'] = `Bearer ${this.options.apiKey}`
      }

      const url = `${this.options.endpoint}/v1/chat/completions`
      const body = JSON.stringify({
        model: this.options.model || 'llama',
        messages: this.messages,
        stream: false
      })

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body
      })

      spinner.stop()

      if (!response.ok) {
        const errorText = await response.text()
        console.error(chalk.gray(`URL: ${url}`))
        console.error(chalk.gray(`Status: ${response.status}`))
        if (errorText) {
          console.error(chalk.gray(`Response: ${errorText}`))
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json() as any
      const assistantMessage = data.choices?.[0]?.message?.content

      if (!assistantMessage) {
        throw new Error('No response content received')
      }

      this.messages.push({
        role: 'assistant',
        content: assistantMessage
      })

      return assistantMessage
    } catch (error) {
      spinner.stop()
      throw error
    }
  }

  private formatResponse(text: string): string {
    return text.split('\n').map(line => {
      if (line.trim().startsWith('```')) {
        return chalk.gray(line)
      }
      if (line.trim().startsWith('#')) {
        return chalk.bold.yellow(line)
      }
      return line
    }).join('\n')
  }

  public async start(): Promise<'menu' | 'knowledge-base' | null> {
    console.log(chalk.green.bold('\n🤖 Gaia Chat Session'))
    console.log(chalk.gray(`Connected to: ${this.options.endpoint}`))
    console.log(chalk.gray(`Model: ${this.options.model || 'llama'}`))
    console.log(chalk.gray('Commands: /help, /menu, /kb (knowledge-base), /exit\n'))

    this.rl.prompt()

    return new Promise((resolve) => {
      this.rl.on('line', async (input: string) => {
        const trimmed = input.trim()
        
        // Handle commands
        if (trimmed.startsWith('/')) {
          const command = trimmed.toLowerCase()
          
          switch (command) {
            case '/help':
              console.log(chalk.cyan('\nAvailable commands:'))
              console.log(chalk.gray('  /help    - Show this help message'))
              console.log(chalk.gray('  /menu    - Return to main menu'))
              console.log(chalk.gray('  /kb      - Switch to knowledge base configuration'))
              console.log(chalk.gray('  /exit    - Exit the application'))
              console.log(chalk.gray('  exit     - Exit the application\n'))
              this.rl.prompt()
              return
              
            case '/menu':
              this.switchTo = 'menu'
              this.rl.close()
              return
              
            case '/kb':
            case '/knowledge-base':
              this.switchTo = 'knowledge-base'
              this.rl.close()
              return
              
            case '/exit':
              this.shouldExit = true
              this.rl.close()
              return
              
            default:
              console.log(chalk.yellow(`Unknown command: ${command}. Type /help for available commands.\n`))
              this.rl.prompt()
              return
          }
        }
        
        if (trimmed === '' || trimmed === 'exit' || trimmed === 'quit') {
          this.shouldExit = true
          this.rl.close()
          return
        }

        try {
          const response = await this.sendMessage(trimmed)
          console.log(chalk.green('Assistant: ') + this.formatResponse(response))
          console.log()
        } catch (error) {
          console.error(chalk.red('Error: ') + (error as Error).message)
        }

        this.rl.prompt()
      })

      this.rl.on('close', () => {
        if (this.shouldExit) {
          console.log(chalk.yellow('\nGoodbye! 👋'))
          process.exit(0)
        }
        resolve(this.switchTo)
      })

      process.on('SIGINT', () => {
        console.log(chalk.yellow('\nGoodbye! 👋'))
        process.exit(0)
      })
    })
  }
}

async function checkGaiaNodeStatus(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    
    const response = await fetch('http://localhost:8080/v1/models', {
      method: 'GET',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    return response.ok
  } catch (error) {
    return false
  }
}

async function promptForChatConfig(): Promise<ChatOptions> {
  const { connectionType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'connectionType',
      message: 'How would you like to connect?',
      choices: [
        { name: 'Local Gaia node (no API key required)', value: 'local' },
        { name: 'Public hosted Gaia domain (API key required)', value: 'public' }
      ]
    }
  ])

  let endpoint: string
  let apiKey: string | undefined

  if (connectionType === 'local') {
    const localAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'endpoint',
        message: 'Enter your local Gaia endpoint:',
        default: 'http://localhost:8080',
        validate: (input: string) => {
          try {
            new URL(input)
            return true
          } catch {
            return 'Please enter a valid URL'
          }
        }
      }
    ])
    endpoint = localAnswers.endpoint
  } else {
    const publicAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'nodeId',
        message: 'Enter the Gaia node ID (e.g., 0x1234abcd or metamask):',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Node ID is required'
          }
          if (input.includes('http://') || input.includes('https://') || input.includes('.gaia.domains')) {
            return 'Please enter only the node ID, not the full URL (e.g., "metamask" not "https://metamask.gaia.domains")'
          }
          return true
        },
        filter: (input: string) => {
          return input.trim()
            .replace(/^https?:\/\//, '')
            .replace(/\.gaia\.domains\/?.*$/, '')
        }
      },
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter your API key:',
        mask: '*',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'API key is required for public domains'
          }
          return true
        }
      }
    ])
    endpoint = `https://${publicAnswers.nodeId}.gaia.domains`
    apiKey = publicAnswers.apiKey
  }

  const commonAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'model',
      message: 'Enter the model name:',
      default: 'llama'
    },
    {
      type: 'input',
      name: 'system',
      message: 'Enter system message (optional):',
      default: 'You are a helpful assistant'
    }
  ])

  return {
    endpoint,
    apiKey,
    model: commonAnswers.model,
    system: commonAnswers.system || 'You are a helpful assistant'
  }
}

async function promptForKnowledgeBase(): Promise<'menu' | 'chat' | null> {
  const { kbType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'kbType',
      message: 'Choose a knowledge base option:',
      choices: [
        ...prebuiltKnowledgeBases.map(kb => ({ name: kb.name, value: kb })),
        new inquirer.Separator(),
        { name: 'Custom knowledge base', value: 'custom' },
        new inquirer.Separator(),
        { name: '← Back to main menu', value: 'back' }
      ]
    }
  ])

  if (kbType === 'back') {
    return 'menu'
  }

  let snapshot: string
  let systemPrompt: string

  if (kbType === 'custom') {
    const customAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'snapshot',
        message: 'Enter the snapshot URL:',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Snapshot URL is required'
          }
          try {
            new URL(input)
            return true
          } catch {
            return 'Please enter a valid URL'
          }
        }
      },
      {
        type: 'input',
        name: 'systemPrompt',
        message: 'Enter the system prompt:',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'System prompt is required'
          }
          return true
        }
      }
    ])
    snapshot = customAnswers.snapshot
    systemPrompt = customAnswers.systemPrompt
  } else {
    snapshot = kbType.snapshot
    systemPrompt = kbType.systemPrompt
  }

  const nodeSpinner = ora({
    text: 'Checking Gaia node status...',
    spinner: 'dots12',
    color: 'cyan'
  }).start()

  const isNodeRunning = await checkGaiaNodeStatus()
  
  if (!isNodeRunning) {
    nodeSpinner.fail('Gaia node is not running')
    console.log(chalk.yellow('\n⚠️  Please make sure your Gaia node is running.'))
    console.log(chalk.gray('Start with: gaianet start'))
    
    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Do you want to configure anyway?',
        default: true
      }
    ])
    
    if (!proceed) {
      return 'menu'
    }
  } else {
    nodeSpinner.succeed('Gaia node is running')
  }

  const command = `gaianet config --snapshot "${snapshot}" --system-prompt "${systemPrompt}"`

  console.log('\n' + chalk.green.bold('Configuring Gaia node with knowledge base...'))
  console.log(chalk.gray('─────────────────────────────────────────\n'))

  console.log(chalk.gray('Executing command:'))
  console.log(chalk.cyan(command))
  console.log()

  const configSpinner = ora({
    text: 'Applying configuration...',
    spinner: 'dots12',
    color: 'cyan'
  }).start()

  const { success, output } = await executeGaiaCommand(command)

  if (success) {
    configSpinner.succeed('Configuration applied successfully!')
    console.log(chalk.green('\n✅ Knowledge base configured successfully!'))
    if (output) {
      console.log(chalk.gray('\nOutput:'))
      console.log(chalk.gray(output))
    }
    
    console.log(chalk.yellow('\n📝 To apply the changes, please restart your Gaia node:'))
    console.log(chalk.gray('   1. Stop the node: ') + chalk.cyan('gaianet stop'))
    console.log(chalk.gray('   2. Start the node: ') + chalk.cyan('gaianet start'))
  } else {
    configSpinner.fail('Configuration failed')
    console.log(chalk.red('\n❌ Failed to configure knowledge base'))
    console.log(chalk.gray('Error: ' + output))
    console.log(chalk.yellow('\nYou can try running this command manually:'))
    console.log(chalk.cyan(command))
  }

  const { nextAction } = await inquirer.prompt([
    {
      type: 'list',
      name: 'nextAction',
      message: 'What would you like to do next?',
      choices: [
        { name: '💬 Go to Gaia Chat', value: 'chat' },
        { name: '📚 Configure another knowledge base', value: 'kb' },
        { name: '← Return to main menu', value: 'menu' },
        { name: '🚪 Exit', value: 'exit' }
      ]
    }
  ])

  if (nextAction === 'exit') {
    console.log(chalk.yellow('\nGoodbye! 👋'))
    process.exit(0)
  } else if (nextAction === 'kb') {
    return promptForKnowledgeBase()
  }

  return nextAction
}

async function executeGaiaCommand(command: string): Promise<{ success: boolean; output: string }> {
  try {
    const { exec } = await import('child_process')
    const { stdout, stderr } = await promisify(exec)(command)
    return { success: true, output: stdout || stderr }
  } catch (error: any) {
    return { success: false, output: error.message }
  }
}

async function chat() {
  const chatOptions = await promptForChatConfig()
  
  const loadingSpinner = ora({
    text: 'Connecting to Gaia...',
    spinner: 'dots12',
    color: 'cyan'
  }).start()

  await new Promise(resolve => setTimeout(resolve, 1000))
  loadingSpinner.succeed('Connected successfully!')

  const gaiaCli = new GaiaCLI(chatOptions)
  const switchTo = await gaiaCli.start()
  
  if (switchTo === 'knowledge-base') {
    const kbResult = await promptForKnowledgeBase()
    if (kbResult === 'chat') {
      const newChat = new GaiaCLI(chatOptions)
      await newChat.start()
    } else if (kbResult === 'menu') {
      return mainMenu()
    }
  } else if (switchTo === 'menu') {
    return mainMenu()
  }
}

async function knowledgeBase() {
  const kbResult = await promptForKnowledgeBase()
  if (kbResult === 'chat') {
    return chat()
  } else if (kbResult === 'menu') {
    return mainMenu()
  }
}

async function mainMenu() {
  await showWelcomeBanner()

  const { mode } = await inquirer.prompt([
    {
      type: 'list',
      name: 'mode',
      message: 'What would you like to do?',
      choices: [
        { name: '💬 Gaia Chat - Chat with a Gaia AI node', value: 'chat' },
        { name: '📚 Gaia Knowledge Base - Configure a knowledge base', value: 'knowledge-base' },
        { name: '📦 Setup Model - Interactive model selection', value: 'setup' },
        { name: '🔍 List Models - Browse available models', value: 'list' },
        { name: '🎯 Get Recommendations - Personalized suggestions', value: 'recommend' },
        new inquirer.Separator(),
        { name: '🚪 Exit', value: 'exit' }
      ]
    }
  ])

  switch (mode) {
    case 'chat':
      await chat()
      break
    case 'knowledge-base':
      await knowledgeBase()
      break
    case 'setup':
      await setup()
      break
    case 'list':
      await listModels({})
      const { nextAction } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'nextAction',
          message: 'Return to main menu?',
          default: true
        }
      ])
      if (nextAction) await mainMenu()
      break
    case 'recommend':
      await showRecommendations()
      break
    case 'exit':
      console.log(chalk.yellow('\nGoodbye! 👋'))
      process.exit(0)
  }
}

program
  .command('chat')
  .description('Start a chat session with a Gaia AI node')
  .action(async () => {
    await chat()
    if (!process.exitCode) {
      await promptToReturnToMenu()
    }
  })

program
  .command('kb')
  .alias('knowledge-base')
  .description('Configure knowledge bases for your Gaia node')
  .action(async () => {
    await knowledgeBase()
    if (!process.exitCode) {
      await promptToReturnToMenu()
    }
  })

// Show welcome banner if no command is provided
if (process.argv.length === 2) {
  showWelcomeBanner().then(async () => {
    await mainMenu()
  })
} else {
  program.parse(process.argv)
}