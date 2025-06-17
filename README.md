# Gaia Toolkit

A command-line interface (CLI) tool for managing and running various AI models through Gaia nodes.

## Features

### Model Management
- **Dynamic Model Discovery**: Automatically fetches available models from the gaia repository
- **Smart Model Categorization**: Models are intelligently categorized based on their size:
  - Small (1B - 5B parameters)
  - Medium (6B - 8B parameters)
  - Big (9B+ parameters)
- **System-Aware Recommendations**: Analyzes your system's RAM and provides appropriate model recommendations
- **Fallback Support**: Includes fallback models when online repository is unavailable

### System Requirements
- **RAM-Based Guidance**: Provides recommendations based on your system's available memory:
  - < 4GB: Very limited options, may struggle with even small models
  - 4-8GB: Recommended for Small models
  - 8-24GB: Suitable for Small and Medium models
  - 24GB+: Capable of running all model sizes

### Installation & Setup
1. **One-Command Installation**: Simple installation process using a single command
2. **Interactive Setup**: Guided setup process with:
   - Model category selection
   - Specific model selection
   - System compatibility warnings
3. **Automatic Configuration**: Downloads and configures model settings automatically

### Usage

```bash
# Start the interactive setup process
gaia setup
```

The setup process will:
1. Check your system's RAM
2. Show available model categories
3. Let you select a specific model
4. Install and configure the gaia node
5. Start the node with your selected model

### Safety Features
- **Resource Warnings**: Warns when selected model size may exceed system capabilities
- **Compatibility Checks**: Validates system requirements before installation
- **Error Handling**: Graceful fallback and error reporting

### Supported Models
- **Small Models**: Ideal for systems with limited resources
  - Phi-3 Mini
  - ExaOne 2.4B
  - Other 1B-5B parameter models

- **Medium Models**: Balanced performance and resource usage
  - Llama 3 8B
  - Other 6B-8B parameter models

- **Big Models**: High-performance models for powerful systems
  - Codestral 22B
  - Other 9B+ parameter models

## Requirements
- Node.js environment
- Sufficient system RAM (see System Requirements above)
- Internet connection for initial setup

## Local Development Setup

To run the CLI locally, follow these steps:

1. **Install Dependencies**
   ```bash
   npm install
   ```
   This installs all required Node.js packages defined in package.json.

2. **Build the Project**
   ```bash
   npm run build
   ```
   This compiles the TypeScript code into JavaScript in the `dist` directory.

3. **Make the CLI Executable**
   ```bash
   chmod +x dist/gaia-manager.js
   ```
   This gives the CLI script executable permissions, which is required for it to run as a command.

4. **Link the Package Globally**
   ```bash
   npm link
   ```
   This creates a global symlink to your local package, allowing you to run the `gaia` command from anywhere.

5. **Run the CLI**
   ```bash
   gaia setup
   ```
   Now you can use the CLI as if it was installed globally.

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


