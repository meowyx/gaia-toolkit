# Gaia Toolkit

A comprehensive command-line interface (CLI) tool for managing and running various AI models through GaiaNet nodes. The toolkit provides intelligent model selection, system-aware recommendations, and seamless setup for your own AI infrastructure.

## 🎉 Key Improvements

- **🔍 Better Model Discovery**: Browse and filter models with `gaia list --size small --use-case coding`
- **📊 Informed Decisions**: Get detailed model info with `gaia info <model>` before deployment
- **⚡ Quick Deployment**: One-command installation with `gaia run <model>`
- **🛡️ Safety First**: Enhanced multi-layer protection prevents system crashes
- **🎯 Flexible Workflow**: From command-line power users to guided interactive setup

## 🚀 Quick Start

```bash
# Show welcome banner and available commands
gaia

# Browse available models with filtering options
gaia list

# Get detailed information about a specific model
gaia info llama3-8b

# Quick model deployment (install and run)
gaia run llama3-8b

# Start interactive setup process
gaia setup

# Get personalized model recommendations
gaia recommend

# Show comprehensive help guide
gaia help
```

## ✨ Features

### 🎯 Smart Model Management
- **Dynamic Model Discovery**: Automatically fetches available models from the GaiaNet repository
- **Command-Line Model Browsing**: List and filter models by size and use case
- **Intelligent Categorization**: Models are categorized by size with clear RAM requirements:
  - **Small (1B - 5B parameters)**: 8-16GB RAM - Fast, efficient models for basic tasks
  - **Standard (6B - 9B parameters)**: 16GB RAM - Balanced performance for most use cases
  - **Medium (10B - 16B parameters)**: 24GB RAM - High performance for enhanced capabilities
  - **Heavy (17B - 24B parameters)**: 32GB RAM - Advanced models for complex tasks
  - **Big (25B - 70B parameters)**: 64GB RAM - Maximum capability models for your hardware
  - **Max (70B+ parameters)**: 128GB+ RAM - Contact team for enterprise/cloud solutions
- **Use Case Analysis**: Models are tagged with specific use cases (coding, chat, creative writing, etc.)
- **Direct Model Deployment**: One-command installation and execution with `gaia run`
- **Fallback Support**: Includes reliable fallback models when online repository is unavailable

### 🧠 System-Aware Intelligence
- **RAM Analysis**: Automatically detects your system's available memory
- **Smart Recommendations**: Provides personalized suggestions based on your hardware
- **Resource Warnings**: Warns about potential performance issues before installation
- **Safety Mechanisms**: Blocks oversized models that exceed system RAM (override with --force)
- **Compatibility Checks**: Validates system requirements against model requirements

### 🎨 Interactive User Experience
- **Beautiful ASCII Art Banner**: Professional welcome screen with Gaia branding
- **Interactive Prompts**: Guided setup process with clear choices
- **Progress Indicators**: Real-time feedback during installation and setup
- **Error Handling**: Graceful fallback and helpful error messages

## 📋 Available Commands

### `gaia` (no arguments)
Shows the welcome banner with available commands and quick start information.

### `gaia list`
Browse available models with filtering options:
- **Lists all AI models**: Organized by size category with use cases
- **Options**:
  - `-s, --size <size>`: Filter by size (small, standard, medium, heavy, big, max)
  - `-u, --use-case <useCase>`: Filter by use case (coding, chat, creative, etc.)
  - `-f, --format <format>`: Output format (table or json)
- **Example**: `gaia list --size small --use-case coding`

### `gaia info <model>`
Get detailed model information:
- **Model specifications**: ID, name, and size category
- **Use cases and capabilities**: What the model excels at
- **System requirements**: RAM requirements and performance characteristics
- **Compatibility check**: Validates against your system
- **Installation instructions**: Step-by-step guide
- **Example**: `gaia info llama3-8b`

### `gaia run <model>`
Quick model deployment - directly install and run any model:
- **Safety mechanism**: Blocks models that exceed system RAM
- **Clear error messages**: Shows RAM shortage details
- **Options**:
  - `--skip-install`: Skip GaiaNet installation if already installed
  - `--force`: Override safety check (EXTREMELY DANGEROUS - see below)
- **Workflow**: Validate → Install → Initialize → Start
- **Example**: `gaia run phi3-mini --skip-install`

#### ⚠️ Force Flag Security (--force)
The `--force` flag requires multiple security confirmations to prevent system crashes:
1. **System Analysis Display**: Shows exact RAM shortage
2. **Risk Acknowledgment**: Must confirm understanding of crash risks
3. **5-Second Cooling Period**: Enforced wait time to read warnings
4. **Explicit Selection**: Choose from cancel or accept responsibility
5. **Type Confirmation**: Must type "I accept all risks" exactly
6. **Final Countdown**: 3-second countdown with last chance to cancel

This extensive process ensures users fully understand they may experience:
- System freezes requiring hard reset
- Loss of unsaved work in other applications
- Potential hardware stress from memory overload

### `gaia setup`
Interactive model selection and installation process:
1. **System Analysis**: Checks your RAM and provides recommendations
2. **Category Selection**: Choose from Small, Medium, or Big model categories
3. **Model Selection**: Pick a specific model from your chosen category
4. **Installation**: Automatically installs GaiaNet node and configures your model
5. **Launch**: Starts your AI node with the selected model

### `gaia recommend`
Get personalized model recommendations based on your use case:
- **Coding & Programming**: Specialized models for development tasks
- **General Chat & Conversation**: Models optimized for natural dialogue
- **Creative Writing**: Models designed for creative content generation
- **Research & Analysis**: Models suited for analytical tasks
- **Resource-Constrained Environment**: Small/lightweight models for limited hardware
- **General Purpose**: Versatile models for various tasks

### `gaia help`
Comprehensive model selection guide including:
- System requirements breakdown
- Performance vs resource trade-offs
- Use case-specific recommendations
- Quick selection tips for beginners

### `gaia welcome`
Displays the welcome banner with command overview.

## 💻 System Requirements

### RAM-Based Recommendations
- **< 8GB RAM**: Very limited options, consider upgrading for AI model support
- **8-16GB RAM**: Small models (1B-5B parameters) recommended
- **16GB RAM**: Small and Standard models (up to 9B parameters) supported
- **24GB RAM**: Small, Standard, and Medium models (up to 16B parameters) supported
- **32GB RAM**: Small through Heavy models (up to 24B parameters) supported
- **64GB RAM**: Small through Big models (up to 70B parameters) supported
- **128GB+ RAM**: All model categories including Max models (70B+) supported

### Supported Models by Category

#### 🟢 Small Models (1B-5B parameters) - 8-16GB RAM
- **Phi-3 Mini**: Excellent performance-to-size ratio
- **ExaOne 2.4B**: Good for multilingual tasks
- **Ideal for**: Quick responses, basic tasks, mobile/edge deployment

#### 🟡 Standard Models (6B-9B parameters) - 16GB RAM
- **Llama 3 8B**: Versatile and well-tested
- **9B models**: Run comfortably on 16GB systems
- **Ideal for**: Balanced performance, most common use cases

#### 🟠 Medium Models (10B-16B parameters) - 24GB RAM
- **13B models**: Enhanced capabilities
- **Ideal for**: Advanced features, better context understanding

#### 🔵 Heavy Models (17B-24B parameters) - 32GB RAM
- **Codestral 22B**: Specialized for programming tasks
- **Ideal for**: Complex reasoning, professional workloads

#### 🔴 Big Models (25B-70B parameters) - 64GB RAM
- **30B-70B models**: Maximum performance
- **Ideal for**: Enterprise tasks, research, complex analysis

#### ⚫ Max Models (70B+ parameters) - 128GB+ RAM
- **DeepSeek, Llama 70B+**: Top-tier capabilities
- **Ideal for**: Contact team for enterprise/cloud deployment

## 🔧 Installation & Setup

### Prerequisites
- Node.js environment
- Sufficient system RAM (see requirements above)
- Internet connection for initial setup
- Terminal with TTY support for interactive prompts

## 🛡️ Safety Features

- **Resource Validation**: Checks system capabilities before model selection
- **Performance Warnings**: Alerts when selected model may exceed system limits
- **Multi-Layer Safety**: `gaia run` blocks oversized models with 6-step override process
- **Force Flag Protection**: Requires explicit acknowledgment, typing test, and countdown
- **System Crash Prevention**: Clear warnings about RAM shortage and potential consequences
- **Graceful Fallbacks**: Handles network issues and repository unavailability
- **Error Recovery**: Provides helpful error messages and recovery options

## 🔄 Model Discovery

The toolkit automatically fetches available models from the GaiaNet repository and categorizes them based on:
- **Parameter count**: Determines model size category
- **Model name patterns**: Identifies specialized models (coding, chat, etc.)
- **Use case analysis**: Tags models with appropriate applications

## 📊 Use Case Recommendations

### 🔧 Coding & Programming
- **Small models**: Basic code completion, syntax help
- **Medium models**: Better code understanding, debugging assistance
- **Big models**: Advanced code generation, complex problem solving
- **Recommended**: Codestral 22B (if RAM > 24GB) or Llama 3 8B

### 💬 General Chat & Conversation
- **Small models**: Quick responses, basic conversations
- **Medium models**: More natural conversations, better context
- **Big models**: Human-like interactions, complex discussions
- **Recommended**: Llama 3 8B or Phi-3 Mini (for faster responses)

### ✍️ Creative Writing
- **Small models**: Simple creative tasks, short stories
- **Medium models**: Better storytelling, character development
- **Big models**: Complex narratives, nuanced writing styles
- **Recommended**: Medium or Big instruct models for best creativity

### ⚡ Resource-Constrained Environments
- **Focus on Small models** (1B-5B parameters)
- **Phi-3 Mini**: Excellent performance-to-size ratio
- **ExaOne 2.4B**: Good for multilingual tasks

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. Areas for contribution include:
- New model configurations
- Improved categorization algorithms
- Enhanced user experience features
- Documentation improvements

### Local Development Setup for Contribution

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build the Project**
   ```bash
   npm run build
   ```

3. **Make the CLI Executable**
   ```bash
   chmod +x dist/gaia-manager.js
   ```

4. **Link the Package Globally**
   ```bash
   npm link
   ```

5. **Run the CLI**
   ```bash
   gaia setup
   ```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues
- **TTY Error**: Ensure you're running in a terminal with TTY support
- **Memory Issues**: Check system RAM and consider smaller models
- **Network Issues**: The toolkit includes fallback models for offline scenarios
- **Permission Errors**: Ensure proper file permissions for installation

### Getting Help
- Run `gaia help` for comprehensive guidance
- Use `gaia recommend` for personalized suggestions
- Check system requirements before model selection


