# Local image generation with ComfyUI on an M2 Pro Mac

## Short functionality description

This setup allows the app to generate images locally on the user’s Mac without relying on cloud APIs such as DALL-E. The app can send a text prompt to a local ComfyUI server, wait for the model to generate one or more images, and then display the result directly in the chat UI.

This is useful when:

- the user wants local-only image generation
- no API key is required
- they want to keep prompt generation on the same machine as the chat app
- they need a fast, private workflow for experimenting with AI-generated images

Recommended local model choices for an M2 Pro:

- SDXL Turbo for fast iterations and lower latency
- SD 1.5 for a stable, well-supported base model
- optionally a tuned variant if the user wants more stylization and is okay with slower generation

## Why ComfyUI instead of Ollama

Ollama is ideal for local chat and text models, but it is not the best default choice for image generation workflows on Apple Silicon. ComfyUI is more flexible and is the most common local image-generation stack for Mac users because it:

- supports multiple image models and workflows
- works well with Apple Silicon / Metal / MPS acceleration
- offers a visual node pipeline for fine control
- makes it easier to expose a stable HTTP endpoint to the app

## Hardware recommendation for M2 Pro

A 14-inch or 16-inch MacBook Pro with M2 Pro and 32 GB RAM is a good target for local image generation. In practice:

- SDXL Turbo is the best balance of speed and quality
- SD 1.5 is very practical and widely supported
- use 768px or lower output for faster generation
- use fewer sampling steps for quick previews
- keep a single image generation request at a time to reduce memory pressure

## Installation steps: ComfyUI + SDXL Turbo / SD 1.5

### 1) Install the required tools

Open a terminal and install Xcode Command Line Tools if needed:

```bash
xcode-select --install
```

Install Homebrew if it is not already installed:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Install Python 3.10 or 3.11 and Git:

```bash
brew install python git
```

Verify the versions:

```bash
python3 --version
git --version
```

### 2) Clone ComfyUI

```bash
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI
```

### 3) Create a virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 4) Install dependencies

```bash
pip install --upgrade pip
pip install torch torchvision torchaudio
pip install -r requirements.txt
```

If the environment reports a Metal/MPS issue, make sure the PyTorch build matches macOS Apple Silicon. In most cases, the standard PyTorch build for Apple Silicon works well with ComfyUI on an M2 Pro.

### 5) Install ComfyUI Manager (optional but recommended)

Inside the ComfyUI directory, open the UI and install ComfyUI Manager from the Manager menu if it is available, or install it manually as a custom node manager.

This makes model installation much easier.

### 6) Download a local model

Choose one of the following:

- SDXL Turbo
- SD 1.5

The easiest path is to use the ComfyUI UI and a model source such as CivitAI, Hugging Face, or a model repository you trust.

Recommended local model paths:

- place models in `ComfyUI/models/checkpoints/`
- for SDXL Turbo, the model should be a checkpoint file such as `sdxl_turbo.safetensors`
- for SD 1.5, a checkpoint such as `sd15.safetensors`

Examples:

```bash
mkdir -p /path/to/ComfyUI/models/checkpoints
```

Then copy or download the model file into that folder.

### 7) Start the local ComfyUI server

From the ComfyUI folder:

```bash
python main.py --listen 0.0.0.0 --port 8188
```

Then open the browser at:

```text
http://localhost:8188
```

This starts the local ComfyUI web UI and exposes its API.

### 8) Test the ComfyUI API

Open a browser and confirm the UI loads. Then verify the API is accepting requests by hitting the local endpoint.

Examples:

```bash
curl http://localhost:8188/system_stats
```

If the server is running, you should receive a JSON response with basic system information.

### 9) Add an image workflow

The simplest workflow is:

- text prompt
- CLIP text encoder
- KSampler / sampler
- VAE decode
- SaveImage

For SDXL Turbo or SD 1.5, this is enough to generate a single image from a prompt.

This can be created in the ComfyUI UI visually or loaded from a `.json` workflow file. The app does not need to build the workflow in the browser; it just needs to send a valid prompt payload to the ComfyUI API.

### 10) Expose a simple app-facing endpoint

The app should not talk directly to the very low-level ComfyUI workflow JSON in production. Instead, add a small local API layer in front of the ComfyUI server.

Typical pattern:

- app calls `POST http://localhost:3001/generate-image`
- backend route accepts `{ prompt, width, height, steps }`
- backend converts that request into the correct ComfyUI API payload
- ComfyUI returns an image file or URL
- backend returns `{ imageUrl }` to the app

This keeps the app stable and isolates ComfyUI details from the client.

## Recommended server architecture

Use a lightweight local service in front of ComfyUI, for example:

- Node.js Express server
- Python FastAPI service
- local proxy route in the same app project (for early development)

The service should be responsible for:

- validating input
- building the prompt workflow
- queuing generation requests
- returning a generated image path or URL
- surfacing errors and generation timeouts

## App functionality requirements

The app should support:

- a “Generate image” action in the chat UI
- a text prompt field or tool request
- a loading state while generation is running
- image preview in the conversation
- optional image download / save to gallery
- error handling for empty prompt, generation failure, and server connectivity

This can be implemented as one of the following:

- a dedicated image-generation action in the message composer
- a tool button alongside the send button
- a separate assistant tool to generate images when the prompt requests it

## App implementation description

### Data flow

1. User enters a prompt and taps Generate image.
2. App sends a fetch request to the local image-generation endpoint.
3. Backend calls the ComfyUI API.
4. ComfyUI computes the image and returns an image artifact.
5. App receives the result as either:
   - a remote image URL, or
   - base64 image data
6. App renders the image in an assistant bubble or dedicated image card.
7. User can tap or long-press to save or copy the image reference.

### React Native implementation details

In the app, add:

- `Image` from `react-native`
- a generation function similar to `generateImage(prompt)`
- image message state in the chat thread
- optional metadata such as prompt text, width, height, and timestamp

Example message shape:

```ts
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text?: string;
  imageUrl?: string;
  imageBase64?: string;
};
```

Rendering logic:

```tsx
{
  item.imageUrl ? (
    <Image
      source={{ uri: item.imageUrl }}
      style={{ width: 240, height: 240, borderRadius: 12 }}
      resizeMode="cover"
    />
  ) : null;
}
```

When using base64 image data, convert it to a valid data URI before rendering:

```tsx
source={{ uri: `data:image/png;base64,${base64}` }}
```

### App UX recommendation

Add a small image action next to the send button:

- icon: image or sparkles
- action: generate image from the current prompt

The flow can be:

- text prompt enters the chat composer
- user taps image action or send with an image tool keyword
- app calls the generation endpoint
- final result appears as a generated image card below the message

### Error handling

The app should display the following states:

- no prompt provided
- ComfyUI server unavailable
- model not found
- generation timed out
- invalid image response

Use the existing custom modal/dialog system to surface these errors in the same style as the rest of the app.

## Recommended local model choice for this project

For the M2 Pro target, the best default is:

- SDXL Turbo for speed and responsiveness

If the user wants a more classic stable pipeline and is fine with slower generation:

- SD 1.5

This gives a good mix of quality, reliability, and compatibility with Apple Silicon.

## Final recommendation

For this application, the best architecture is:

- ComfyUI running locally on the Mac
- one of the lightweight image models above
- a small local service in front of ComfyUI
- app-side generation action and image rendering in chat

This keeps the feature local, private, and easy to debug while keeping the mobile app simple and consistent.
