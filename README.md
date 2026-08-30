# Home AI

Home AI is a lightweight Expo mobile app for chatting with a local Ollama server. It is designed to work as a simple, private AI client for local models running on a Mac or another machine in the local network.

## App description

The app lets users:

- connect to a local Ollama server
- select an installed model
- open chat threads with persisted history
- create, rename, and delete chat sessions
- test the connection to the configured server
- manage settings and model information from a clean mobile UI
- use the app in multiple languages through built-in internationalization

The app currently supports the following languages:

- English
- German
- Spanish
- Italian
- French

This is intended for local-first AI usage where the model runs on the user’s machine or a nearby local server instead of requiring a hosted cloud API.

## Local installation on macOS with Ollama and qwen2.5-coder:7b

### 1) Install Ollama

Download and install Ollama from the official site:

https://ollama.com/download/mac

After installation, verify that the Ollama CLI is available:

```bash
ollama --version
```

### 2) Pull the model

Run the following command to download the Qwen 2.5 Coder 7B model:

```bash
ollama pull qwen2.5-coder:7b
```

This may take some time depending on your internet connection and machine speed.

### 3) Start the server

Start the Ollama server in the background:

```bash
ollama serve
```

By default, it runs locally on:

```text
http://localhost:11434
```

If you want to make it available on your local network, make sure your firewall and network settings allow access and then use the machine IP address instead of localhost.

### 4) Run the app

From the project root:

```bash
npm install
npx expo start
```

Then run the app in the iOS simulator or on an Android emulator. In the app settings, set the Ollama server URL to the correct address, for example:

```text
http://localhost:11434
```

or

```text
http://192.168.1.10:11434
```

Then select the model `qwen2.5-coder:7b` in the model selector.

## What this AI can do

The `qwen2.5-coder:7b` model is a coding-focused LLM and is useful for:

- writing and explaining code
- reviewing code for bugs and logic issues
- generating small functions, scripts, and utilities
- refactoring existing code
- suggesting architecture improvements
- converting code between languages or frameworks
- generating unit tests or example usage
- helping with API integration and debugging
- explaining command-line workflows and project setup

For this app, the main use case is local coding assistance and quick AI-driven development support without sending code to a third-party cloud service.

## Typical usage scenarios

- ask the model to explain a function or project structure
- generate a small helper or API call based on your requirements
- review a bug and suggest a fix
- explain an error stack trace from a local build
- create a small UI or logic patch for a React Native or Expo app
- use it as a local coding assistant for day-to-day development work

## Notes

This app is designed as a local-first developer tool. It works best when the machine running Ollama is reachable from the device or emulator and the model is installed locally.

The test setup for this project is running on a MacBook Pro with an M2 Pro processor and 32 GB of RAM. In this configuration, the app and the local Ollama setup work reliably for day-to-day local AI usage.
