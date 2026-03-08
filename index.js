#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const zod_1 = require("zod");
const server = new index_js_1.Server({
    name: "monadic-sharp-mcp",
    version: "1.0.0",
}, {
    capabilities: {
        resources: {},
        tools: {},
    },
});
// Content from MonadicSharp Skill
const ROP_BASICS = `# MonadicSharp Basics (ROP)

## Core Types

### Result<T>

Represents a success value of type \`T\` or a failure \`Error\`.

\`\`\`csharp
Result<string> success = "Hello";
Result<string> failure = Error.Validation("Name is required");

// Check (rarely needed, prefer Match)
if (result.IsSuccess) { ... }
\`\`\`

### Error

A structured error value with a \`Code\`, \`Message\`, and \`Type\`.

\`\`\`csharp
Error.Validation("Invalid email");
Error.NotFound("User", userId);
Error.Conflict("User already exists");
Error.Unexpected("Database connection failed", ex);
\`\`\`

---

## Core Operations

### Bind (Transform Result -> Result)

Use \`Bind\` when the next step can also fail. This is the "railway switch".

\`\`\`csharp
// Sync
Result<User> user = Validate(input).Bind(validInput => Repository.Save(validInput));

// Async (most common)
Result<User> user = await Validate(input)
    .Bind(validInput => Repository.SaveAsync(validInput));
\`\`\`

### Map (Transform T -> U)

Use \`Map\` when the next step cannot fail (pure transformation).

\`\`\`csharp
Result<UserDto> dto = userResult.Map(user => new UserDto(user));
\`\`\`

### Match (Unwrap)

The only way to get the value out safely. Forces handling both cases.

\`\`\`csharp
return result.Match(
    onSuccess: value => Ok(value),
    onFailure: error => BadRequest(error)
);
\`\`\`

### Result.Try (Exception -> Failure)

Wraps legacy/external code that throws exceptions.

\`\`\`csharp
Result<string> fileContent = Result.Try(() => File.ReadAllText("path.txt"));
// Returns Result.Failure if exception is thrown
\`\`\`

---

## Async Best Practices

*   **Avoid \`.Result\`**: Always await async methods.
*   **Use \`.Bind\` extensions**: Most async operations return \`Task<Result<T>>\`. MonadicSharp handles the task unwrapping automatically.

\`\`\`csharp
// GOOD
public async Task<Result<Order>> CreateOrderAsync(CreateOrderRequest request)
{
    return await Validate(request)
        .Bind(req => _repo.SaveAsync(req))
        .Map(order => _emailService.SendConfirmation(order));
}
\`\`\`
`;
const AI_PATTERNS = `# MonadicSharp.AI Patterns

## AiError (Semantic Failures)

Never throw \`HttpRequestException\` or \`TaskCanceledException\`. Return \`AiError\`.

### Core Error Types

| Error | Description | Retriable? |
|-------|-------------|------------|
| \`AiError.RateLimit\` | 429 Too Many Requests | Yes |
| \`AiError.ModelTimeout\` | LLM didn't respond in time | Yes |
| \`AiError.ModelUnavailable\` | 503 Service Unavailable | Yes |
| \`AiError.TokenLimitExceeded\` | Context window full | No |
| \`AiError.ContentFiltered\` | Policy violation | No |
| \`AiError.InvalidStructuredOutput\` | JSON parsing failed | No |

## AgentResult (Pipeline Tracing)

Use \`AgentResult\` for multi-step agent workflows. It traces execution time, tokens, and steps.

\`\`\`csharp
public async Task<AgentResult<string>> RunAgentAsync(string prompt)
{
    return await AgentResult
        .StartTrace("MyAgent", prompt)
        .Step("Retrieve", q => _db.SearchAsync(q))
        .Step("Generate", ctx => _llm.CompleteAsync(ctx))
        .ExecuteAsync();
}
\`\`\`

## Retry Logic (Exponential Backoff)

Wrap fragile operations (LLM calls) with \`.WithRetry()\`.

\`\`\`csharp
// Standard call
Result<string> result = await Result.TryAsync(() => _llm.CompleteAsync(prompt))
    .WithRetry(maxAttempts: 3, initialDelay: TimeSpan.FromSeconds(2));

// In a pipeline
.Step("Generate", ctx => 
    Result.TryAsync(() => _llm.CompleteAsync(ctx))
          .WithRetry(3))
\`\`\`

## Validation & Parsing

Chain parsing and validation.

\`\`\`csharp
Result<Product> product = await llmResponse
    .ParseAs<Product>()
    .Validate(p => p.Price > 0, "Price must be positive")
    .AsResultAsync();
\`\`\`
`;
server.setRequestHandler(types_js_1.ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: "monadic-sharp://rop-basics",
                name: "MonadicSharp Basics (ROP)",
                mimeType: "text/markdown",
                description: "Core concepts of Railway-Oriented Programming with MonadicSharp (Result<T>, Bind, Map, Match)",
            },
            {
                uri: "monadic-sharp://ai-patterns",
                name: "MonadicSharp AI Patterns",
                mimeType: "text/markdown",
                description: "Best practices for building robust AI agents with MonadicSharp.AI (AgentResult, AiError, Retry Logic)",
            },
        ],
    };
});
server.setRequestHandler(types_js_1.ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    if (uri === "monadic-sharp://rop-basics") {
        return {
            contents: [
                {
                    uri: "monadic-sharp://rop-basics",
                    mimeType: "text/markdown",
                    text: ROP_BASICS,
                },
            ],
        };
    }
    else if (uri === "monadic-sharp://ai-patterns") {
        return {
            contents: [
                {
                    uri: "monadic-sharp://ai-patterns",
                    mimeType: "text/markdown",
                    text: AI_PATTERNS,
                },
            ],
        };
    }
    else {
        throw new Error("Resource not found");
    }
});
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "generate_monadic_snippet",
                description: "Generates a MonadicSharp code snippet for a common scenario (e.g., repository method, controller action, or AI agent pipeline).",
                inputSchema: {
                    type: "object",
                    properties: {
                        scenario: {
                            type: "string",
                            description: "The type of code snippet to generate (e.g., 'repository-save', 'controller-endpoint', 'ai-agent-step').",
                            enum: ["repository-save", "controller-endpoint", "ai-agent-step", "basic-result-chain"],
                        },
                    },
                    required: ["scenario"],
                },
            },
        ],
    };
});
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (name === "generate_monadic_snippet") {
        const scenario = args.scenario;
        let snippet = "";
        switch (scenario) {
            case "repository-save":
                snippet = `
public async Task<Result<Unit>> SaveAsync(User user)
{
    return await Result.Success(user)
        .Ensure(u => !string.IsNullOrEmpty(u.Email), Error.Validation("Email required"))
        .Bind(u => Result.TryAsync(() => _dbContext.SaveChangesAsync()));
}
`;
                break;
            case "controller-endpoint":
                snippet = `
[HttpPost]
public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
{
    var result = await _userService.CreateAsync(request);
    
    return result.Match(
        onSuccess: id => Ok(new { Id = id }),
        onFailure: error => error.Type switch {
            ErrorType.Validation => BadRequest(error),
            ErrorType.NotFound => NotFound(error),
            _ => StatusCode(500, error)
        }
    );
}
`;
                break;
            case "ai-agent-step":
                snippet = `
public async Task<AgentResult<string>> ExecuteStep(string input)
{
    return await AgentResult.StartTrace("StepName", input)
        .Step("LLM Call", ctx => 
             Result.TryAsync(() => _llm.CompleteAsync(ctx))
                   .WithRetry(3)
                   .MapError(ex => AiError.Unexpected(ex)))
        .ExecuteAsync();
}
`;
                break;
            case "basic-result-chain":
            default:
                snippet = `
public Result<int> Calculate(string input)
{
    return Result.Success(input)
        .Bind(s => int.TryParse(s, out var i) ? Result.Success(i) : Result.Failure<int>(Error.Validation("Not a number")))
        .Map(i => i * 2);
}
`;
                break;
        }
        return {
            content: [
                {
                    type: "text",
                    text: snippet.trim(),
                },
            ],
        };
    }
    throw new Error("Tool not found");
});
const transport = new stdio_js_1.StdioServerTransport();
await server.connect(transport);
//# sourceMappingURL=index.js.map