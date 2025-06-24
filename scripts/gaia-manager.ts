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
useCase?: string[]
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
    • Small models (1-5B): Good for basic code completion, syntax help
    • Medium models (6-8B): Better code understanding, debugging assistance
    • Big models (9B+): Advanced code generation, complex problem solving
    
    Recommended: Codestral 22B (if RAM > 24GB) or Llama 3 8B`,
    
  "general-chat": `
    💬 GENERAL CHAT & CONVERSATION:
    • Small models (1-5B): Quick responses, basic conversations
    • Medium models (6-8B): More natural conversations, better context
    • Big models (9B+): Human-like interactions, complex discussions
    
    Recommended: Llama 3 8B or Phi-3 Mini (for faster responses)`,
    
  "creative-writing": `
    ✍️ CREATIVE WRITING:
    • Small models (1-5B): Simple creative tasks, short stories
    • Medium models (6-8B): Better storytelling, character development
    • Big models (9B+): Complex narratives, nuanced writing styles
    
    Recommended: Medium or Big instruct models for best creativity`,
    
  "resource-constrained": `
    ⚡ RESOURCE-CONSTRAINED ENVIRONMENTS:
    • Focus on Small models (1-5B parameters)
    • Phi-3 Mini: Excellent performance-to-size ratio
    • ExaOne 2.4B: Good for multilingual tasks
    
    Your system (${totalRamGB}GB RAM): ${totalRamGB < 8 ? 'Stick to Small models' : 'Can handle Small/Medium models'}`,
    
  "research": `
    🔬 RESEARCH & ANALYSIS:
    • Medium models (6-8B): Good for literature review, summarization
    • Big models (9B+): Complex analysis, research assistance
    
    Recommended: Llama 3 8B or larger models for comprehensive research tasks`
}

return recommendations[useCase] || `
    📝 GENERAL PURPOSE:
    • Small (1-5B): Fast responses, basic tasks, mobile/edge deployment
    • Medium (6-8B): Balanced performance, most common use cases
    • Big (9B+): Advanced capabilities, complex reasoning, research
    
    Your system (${totalRamGB}GB RAM): ${totalRamGB < 8 ? 'Small models recommended' : totalRamGB < 24 ? 'Small/Medium models recommended' : 'All model sizes supported'}`
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
        useCase: getModelUseCases(modelId),
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

function showWelcomeBanner() {
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

🚀 AVAILABLE COMMANDS:
──────────────────────────────────────────────────────────────────────────────
  gaia setup      📦 Interactive model selection and installation
  gaia help       📚 Show comprehensive model selection guide  
  gaia recommend  🎯 Get personalized model recommendations

💡 QUICK START:
  Run 'gaia setup' to get started with your first AI model!

🔧 Need help choosing a model? Run 'gaia recommend' for personalized suggestions.
`)
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
    
    console.log("\n" + "=".repeat(80))
    showWelcomeBanner()
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

program
.command("help")
.description("Show comprehensive model selection guide and recommendations.")
.action(showHelp)

program
.command("recommend")
.description("Get personalized model recommendations based on your use case.")
.action(showRecommendations)

program
.command("welcome")
.description("Show the welcome banner with available commands.")
.action(showWelcomeBanner)

// Show welcome banner if no command is provided
if (process.argv.length === 2) {
  showWelcomeBanner()
} else {
  program.parse(process.argv)
}