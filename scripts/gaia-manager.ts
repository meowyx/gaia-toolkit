#!/usr/bin/env node

import { Command, Argument } from "commander"
import { spawn, type SpawnOptions } from "child_process"

// Define a type for our model objects for type safety
interface Model {
  name: string
  id: string
  configUrl: string
}

const models: Model[] = [
  {
    name: "Phi-3-mini-4k",
    id: "phi-3-mini-4k",
    configUrl: "https://raw.githubusercontent.com/GaiaNet-AI/node-configs/main/phi-3-mini-instruct-4k/config.json",
  },
  {
    name: "Llama-3-Groq-8B",
    id: "llama-3-groq-8b",
    configUrl: "https://raw.githubusercontent.com/GaiaNet-AI/node-configs/main/llama-3-groq-8b-tool/config.json",
  },
  {
    name: "Llama-3-8B",
    id: "llama-3-8b",
    configUrl: "https://raw.githubusercontent.com/GaiaNet-AI/node-configs/main/llama-3-8b-instruct/config.json",
  },
  {
    name: "Llama-2-7B",
    id: "llama-2-7b",
    configUrl: "https://raw.githubusercontent.com/GaiaNet-AI/node-configs/main/llama-2-7b/config.json",
  },
  {
    name: "Gemma-3-1B",
    id: "gemma-3-1b",
    configUrl: "https://raw.githubusercontent.com/GaiaNet-AI/node-configs/main/gemma-3-1b-it/config.json",
  },
  {
    name: "Gemma-1.1-7B",
    id: "gemma-1.1-7b",
    configUrl: "https://raw.githubusercontent.com/GaiaNet-AI/node-configs/main/gemma-1.1-7b-it/config.json",
  },
  {
    name: "EXAONE-3.5-2.4b",
    id: "exaone-3.5-2.4b",
    configUrl: "https://raw.githubusercontent.com/GaiaNet-AI/node-configs/main/exaone-3.5-2.4b-instruct/config.json",
  },
  {
    name: "Deepseek-R1-Distilled",
    id: "deepseek-r1-distill-llama-8b",
    configUrl:
      "https://raw.githubusercontent.com/GaiaNet-AI/node-configs/main/deepseek-r1-distill-llama-8b/config.json",
  },
]

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
  .name("gaia") // Program name for help messages
  .description("CLI to install, initialize, and start GaiaNet nodes for various AI models.")
  .version("0.1.0")

program
  .command("setup")
  .description("Install GaiaNet, then initialize and start a node for a specific model.")
  .addArgument(new Argument("<model-id>", "ID of the model to set up.").choices(models.map((m) => m.id)))
  .action(async (modelId: string) => {
    const selectedModel = models.find((m) => m.id === modelId)
    if (!selectedModel) {
      // This should ideally be caught by commander's choices validation,
      // but it's good to have a fallback.
      console.error(`Error: Model ID "${modelId}" not found.`)
      process.exit(1)
    }

    console.log(`🚀 Starting setup for GaiaNet node with model: ${selectedModel.name}`)

    try {
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
      console.error(`\n🛑 Error during setup for ${selectedModel.name}:`)
      if (error instanceof Error) {
        console.error(error.message)
      } else {
        console.error(String(error)) // Ensure error is stringified if not an Error instance
      }
      console.error(
        "\nPlease check the output above for details. Ensure `gaianet` is accessible after installation if errors persist in later steps.",
      )
      process.exit(1)
    }
  })

program.parse(process.argv)
