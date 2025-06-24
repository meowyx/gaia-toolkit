# Gaia Toolkit

A comprehensive command-line interface (CLI) tool for managing and running various AI models through GaiaNet nodes. The toolkit provides intelligent model selection, system-aware recommendations, and seamless setup for your own AI infrastructure.

## 🚀 Quick Start

```bash
# Show welcome banner and available commands
gaia

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
- **Intelligent Categorization**: Models are categorized by size and capabilities:
  - **Small (1B - 5B parameters)**: Fast, efficient models for basic tasks
  - **Medium (6B - 8B parameters)**: Balanced performance for most use cases
  - **Big (9B+ parameters)**: High-performance models for complex tasks
- **Use Case Analysis**: Models are tagged with specific use cases (coding, chat, creative writing, etc.)
- **Fallback Support**: Includes reliable fallback models when online repository is unavailable

### 🧠 System-Aware Intelligence
- **RAM Analysis**: Automatically detects your system's available memory
- **Smart Recommendations**: Provides personalized suggestions based on your hardware
- **Resource Warnings**: Warns about potential performance issues before installation
- **Compatibility Checks**: Validates system requirements against model requirements

### 🎨 Interactive User Experience
- **Beautiful ASCII Art Banner**: Professional welcome screen with Gaia branding
- **Interactive Prompts**: Guided setup process with clear choices
- **Progress Indicators**: Real-time feedback during installation and setup
- **Error Handling**: Graceful fallback and helpful error messages

## 📋 Available Commands

### `gaia` (no arguments)
Shows the welcome banner with available commands and quick start information.

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
- **Resource-Constrained Environment**: Lightweight models for limited hardware
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
- **< 4GB RAM**: Very limited options, may struggle with even small models
- **4-8GB RAM**: Recommended for Small models (1B-5B parameters)
- **8-24GB RAM**: Suitable for Small and Medium models
- **24GB+ RAM**: Capable of running all model sizes including Big models

### Supported Models by Category

#### 🟢 Small Models (1B-5B parameters)
- **Phi-3 Mini**: Excellent performance-to-size ratio
- **ExaOne 2.4B**: Good for multilingual tasks
- **Ideal for**: Quick responses, basic tasks, mobile/edge deployment

#### 🟡 Medium Models (6B-8B parameters)
- **Llama 3 8B**: Versatile and well-tested
- **Ideal for**: Balanced performance, most common use cases

#### 🔴 Big Models (9B+ parameters)
- **Codestral 22B**: Specialized for programming tasks
- **Ideal for**: Advanced capabilities, complex reasoning, research

## 🔧 Installation & Setup

### Prerequisites
- Node.js environment
- Sufficient system RAM (see requirements above)
- Internet connection for initial setup
- Terminal with TTY support for interactive prompts

## 🛡️ Safety Features

- **Resource Validation**: Checks system capabilities before model selection
- **Performance Warnings**: Alerts when selected model may exceed system limits
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


