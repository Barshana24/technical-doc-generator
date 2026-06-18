import httpx
import json
from typing import AsyncGenerator, Optional
from app.config import settings
from app.utils.logger import logger


class OllamaService:
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.model = settings.OLLAMA_MODEL
        self.timeout = settings.OLLAMA_TIMEOUT

    async def check_health(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                return resp.status_code == 200
        except Exception as exc:
            logger.warning("Ollama health check failed: %s", exc)
            return False

    async def list_models(self) -> list:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                resp.raise_for_status()
                data = resp.json()
                return [m["name"] for m in data.get("models", [])]
        except Exception as exc:
            logger.error("Failed to list Ollama models: %s", exc)
            return []

    async def generate(self, prompt: str, system: str = "", stream: bool = False) -> str:
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system,
            "stream": False,
            "options": {
                "temperature": 0.2,
                "top_p": 0.9,
                "num_predict": 4096,
            },
        }
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(
                    f"{self.base_url}/api/generate",
                    json=payload,
                )
                resp.raise_for_status()
                data = resp.json()
                return data.get("response", "")
        except httpx.TimeoutException:
            logger.error("Ollama generation timed out after %ds", self.timeout)
            raise RuntimeError("AI model timed out. Try a smaller file or increase OLLAMA_TIMEOUT.")
        except httpx.HTTPStatusError as exc:
            logger.error("Ollama HTTP error: %s", exc)
            raise RuntimeError(f"AI model returned error: {exc.response.status_code}")
        except Exception as exc:
            logger.error("Ollama generation failed: %s", exc)
            raise RuntimeError(f"AI model unavailable: {exc}")

    # ------------------------------------------------------------------ #
    #  Domain-specific generation methods                                  #
    # ------------------------------------------------------------------ #

    async def generate_readme(self, project_name: str, code_summary: str, language_stats: dict) -> str:
        langs = ", ".join(f"{k} ({v} files)" for k, v in language_stats.items())
        system = (
            "You are a senior software engineer writing professional README.md files. "
            "Output only valid Markdown. Be thorough but avoid filler text."
        )
        prompt = f"""Generate a comprehensive README.md for a project called "{project_name}".

Languages detected: {langs}

Code overview:
{code_summary[:3000]}

Include these sections:
# Project Title
## Overview
## Features
## Tech Stack
## Prerequisites
## Installation
## Usage
## Project Structure
## API Reference (if applicable)
## Contributing
## License

Use proper Markdown formatting with code blocks where relevant."""
        return await self.generate(prompt, system)

    async def generate_api_docs(self, endpoints: str) -> str:
        system = (
            "You are a technical writer specializing in REST API documentation. "
            "Output only valid Markdown."
        )
        prompt = f"""Generate complete API documentation for the following endpoints.

{endpoints[:4000]}

For each endpoint include:
- HTTP method and path
- Description
- Request parameters/body (with types)
- Response schema
- Example request and response
- Error codes

Format as clean Markdown with code blocks."""
        return await self.generate(prompt, system)

    async def generate_function_docs(self, functions_info: str, language: str) -> str:
        system = (
            "You are a documentation expert. Generate clear, accurate technical documentation. "
            "Output only valid Markdown."
        )
        prompt = f"""Generate comprehensive documentation for these {language} functions/methods.

{functions_info[:4000]}

For each function:
- One-line summary
- Detailed description
- Parameters table (name, type, description)
- Return value (type, description)
- Raises/throws (if applicable)
- Usage example

Format as clean Markdown."""
        return await self.generate(prompt, system)

    async def generate_class_docs(self, classes_info: str, language: str) -> str:
        system = (
            "You are a documentation expert. Generate clear OOP documentation. "
            "Output only valid Markdown."
        )
        prompt = f"""Generate comprehensive documentation for these {language} classes.

{classes_info[:4000]}

For each class:
- Purpose and responsibility
- Class diagram description
- Constructor parameters
- Properties/attributes table
- Methods summary table
- Usage example
- Inheritance and composition notes

Format as clean Markdown."""
        return await self.generate(prompt, system)

    async def generate_inline_comments(self, code: str, language: str) -> str:
        system = (
            f"You are a {language} expert. Add clear, helpful inline comments to code. "
            "Return ONLY the commented code, no explanation outside it."
        )
        prompt = f"""Add inline comments to this {language} code.
Explain the WHY, not the WHAT. Keep comments concise.
Preserve the exact code structure and indentation.

```{language}
{code[:3000]}
```"""
        return await self.generate(prompt, system)

    async def generate_uml_mermaid(self, classes_info: str) -> str:
        system = (
            "You are a software architect. Generate valid Mermaid.js class diagram syntax. "
            "Output ONLY the mermaid code block, nothing else."
        )
        prompt = f"""Generate a Mermaid.js class diagram for these classes.

{classes_info[:3000]}

Rules:
- Use classDiagram syntax
- Show attributes with types
- Show methods with parameters and return types
- Show inheritance with <|-- arrows
- Show composition with *-- arrows
- Show associations with --> arrows

Output only:
```mermaid
classDiagram
    ...
```"""
        result = await self.generate(prompt, system)
        # Strip markdown fences if model returns them
        result = result.strip()
        if result.startswith("```mermaid"):
            result = result[len("```mermaid"):].strip()
        if result.startswith("```"):
            result = result[3:].strip()
        if result.endswith("```"):
            result = result[:-3].strip()
        return result

    async def generate_circuit_docs(self, code: str) -> str:
        system = (
            "You are an electronics engineer. Generate technical circuit/schematic documentation. "
            "Output only valid Markdown."
        )
        prompt = f"""Analyze this code and generate circuit/schematic documentation.

{code[:3000]}

Include:
- Component list with specifications
- Signal flow description
- Pin assignments (if detectable)
- Operating parameters
- Schematic description in text
- ASCII representation if possible

Format as clean Markdown."""
        return await self.generate(prompt, system)


ollama_service = OllamaService()
