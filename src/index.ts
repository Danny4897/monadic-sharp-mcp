/**
 * MonadicSharp MCP Server
 *
 * All resources and snippets are derived from real source code in:
 *   - MonadicSharp/          (Result.cs, Option.cs, Error.cs, Try.cs, Either.cs,
 *                              Extensions/FunctionalExtensions.cs,
 *                              Extensions/PipelineExtensions.cs)
 *   - MonadicSharp.Framework/ (Agents/*, Caching/*, Http/*, Persistence/*, Security/*, Telemetry/*)
 *
 * Resources/scenarios backed by NO real source are omitted with a comment.
 */

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "monadic-sharp-mcp",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// RESOURCE: monadic-sharp://rop-basics
// Source: Result.cs, Option.cs, Error.cs, Try.cs, Either.cs,
//         Extensions/FunctionalExtensions.cs, Extensions/PipelineExtensions.cs
// ---------------------------------------------------------------------------

server.resource(
  "rop-basics",
  "monadic-sharp://rop-basics",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "text/markdown",
        text: `# MonadicSharp — Railway-Oriented Programming Basics

## Result<T>
*Source: MonadicSharp/Result.cs*

\`\`\`csharp
// Success / Failure factories
Result<User> ok = Result<User>.Success(user);
Result<User> err = Result<User>.Failure(Error.Create("not found"));

// Implicit conversions (also from Exception)
Result<User> fromError = Error.NotFound("User", id.ToString());
Result<User> fromEx    = new InvalidOperationException("boom");

// Core combinators
Result<string> name = result
    .Map(u => u.Name)                          // infallible transform
    .Bind(n => Validate(n))                    // may fail
    .Where(n => n.Length > 0, "Empty name")    // predicate guard
    .MapError(e => e.WithMetadata("field", "name"));

// Pattern matching
string display = result.Match(
    onSuccess: u => $"Hello {u.Name}",
    onFailure: e => $"Error: {e.Message}");

// Safe value access
User user = result.GetValueOrDefault(User.Guest);
\`\`\`

## Option<T>
*Source: MonadicSharp/Option.cs*

\`\`\`csharp
// Construction
Option<string> some = Option<string>.Some("hello");
Option<string> none = Option<string>.None;
Option<string> from = Option<string>.From(maybeNull); // null-safe

// Combinators
Option<int> length = opt
    .Map(s => s.Length)
    .Where(n => n > 0)
    .Bind(n => ParsePositive(n));

// Convert to Result when None must become an error
Result<string> result = opt.ToResult(Error.NotFound("Config", "key"));

// Pattern match
string val = opt.Match(
    onSome:  s => s.ToUpper(),
    onNone: () => "(empty)");
\`\`\`

## Error
*Source: MonadicSharp/Error.cs*

\`\`\`csharp
// Factory methods
Error generic    = Error.Create("something failed");
Error validation = Error.Validation("too short", field: "Name");
Error notFound   = Error.NotFound("Order", orderId.ToString());
Error forbidden  = Error.Forbidden("Admin only");
Error conflict   = Error.Conflict("Duplicate email", "User");
Error fromEx     = Error.FromException(exception);

// Composition
Error combined   = Error.Combine(err1, err2, err3);

// Enrichment
Error enriched   = error
    .WithMetadata("RequestId", reqId)
    .WithInnerError(innerError);

// ErrorType enum: Failure, Validation, NotFound, Forbidden, Conflict, Exception
bool isVal = error.IsOfType(ErrorType.Validation);
\`\`\`

## Try
*Source: MonadicSharp/Try.cs*

\`\`\`csharp
// Wraps synchronous I/O that might throw
Result<string> content = Try.Execute(() => File.ReadAllText(path));

// Wraps async I/O — use this for every awaited call
Result<string> json = await Try.ExecuteAsync(() => httpClient.GetStringAsync(url));

// With typed input
Result<int> parsed = Try.Execute(input, int.Parse);
Result<byte[]> bytes = await Try.ExecuteAsync(url, client.GetByteArrayAsync);
\`\`\`

## Either<TLeft, TRight>
*Source: MonadicSharp/Either.cs*

\`\`\`csharp
Either<Error, User> either = Either<Error, User>.FromRight(user);

// Map/Bind only applies to Right
Either<Error, string> name = either.Map(u => u.Name);

// Pattern match
string label = either.Match(
    onLeft:  e => $"Err: {e.Message}",
    onRight: u => $"User: {u.Name}");
\`\`\`

## FunctionalExtensions — ResultExtensions
*Source: MonadicSharp/Extensions/FunctionalExtensions.cs*

\`\`\`csharp
// Sequence: fail fast on first error
Result<IEnumerable<User>> all = results.Sequence();

// Partition: for batch processing, split successes from failures
var (users, errors) = results.Partition();
// users : IEnumerable<User>
// errors: IEnumerable<Error>

// Traverse
Result<IEnumerable<Dto>> dtos = userIds.Traverse(id => FindUser(id));

// Ensure: add invariant check inline
Result<Order> validated = order
    .Ensure(o => o.Total > 0, "Total must be positive")
    .Ensure(o => o.Items.Any(), "At least one item required");

// Recovery
Result<User> recovered = result.OrElse(err => TryFallback(err));
\`\`\`

## PipelineExtensions
*Source: MonadicSharp/Extensions/PipelineExtensions.cs*

\`\`\`csharp
// Fluent async pipeline with PipelineBuilder
var result = await Task.FromResult(Result<Order>.Success(order))
    .Then(ValidateAsync)
    .Then(EnrichAsync)
    .ThenIf(o => o.RequiresApproval, RequestApprovalAsync)
    .ExecuteAsync();

// PipelineAsync with array of steps (fail-fast)
var result = await initialStep
    .PipelineAsync(StepA, StepB, StepC);

// ThenWithRetry — retry only after validation is complete
var result = await Task.FromResult(Result<Order>.Success(order))
    .Then(ValidateAsync)
    .ThenWithRetry(SendToExternalApiAsync, maxAttempts: 3)
    .ExecuteAsync();

// TaskResultExtensions: async Map/Bind/Do
Result<string> name = await resultTask.Map(u => u.Name);
Result<Profile> profile = await resultTask.Bind(u => FetchProfileAsync(u.Id));
\`\`\`
`,
      },
    ],
  })
);

// ---------------------------------------------------------------------------
// RESOURCE: monadic-sharp://framework-agents
// Source: MonadicSharp.Framework/src/MonadicSharp.Agents/**
//   - Core/IAgent.cs, Core/AgentContext.cs, Core/AgentCapability.cs
//   - Orchestration/AgentOrchestrator.cs
//   - Pipeline/AgentPipeline.cs
//   - Resilience/CircuitBreaker.cs
//   - Errors/AgentError.cs (referenced but not individually read — types used in context)
// ---------------------------------------------------------------------------

server.resource(
  "framework-agents",
  "monadic-sharp://framework-agents",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "text/markdown",
        text: `# MonadicSharp.Agents — Framework Agents

## IAgent<TInput, TOutput>
*Source: MonadicSharp.Framework/src/MonadicSharp.Agents/Core/IAgent.cs*

\`\`\`csharp
// Implement IAgent — never throw for expected failures
public class SummaryAgent : IAgent<string, Summary>
{
    public string Name => "SummaryAgent";
    public AgentCapability RequiredCapabilities => AgentCapability.CallLlm;

    public async Task<Result<Summary>> ExecuteAsync(
        string input,
        AgentContext context,
        CancellationToken cancellationToken = default)
    {
        // Always use Try.ExecuteAsync for I/O
        return await Try.ExecuteAsync(() => llmClient.SummarizeAsync(input, cancellationToken));
    }
}
\`\`\`

## AgentCapability [Flags]
*Source: MonadicSharp.Framework/src/MonadicSharp.Agents/Core/AgentCapability.cs*

\`\`\`csharp
// Declare only the minimum capabilities needed (principle of least privilege)
AgentCapability caps = AgentCapability.CallLlm | AgentCapability.ReadLocalFiles;

// Grouped convenience flags
AgentCapability net  = AgentCapability.OutboundNetwork; // CallExternalApis | SendMessages
AgentCapability fs   = AgentCapability.LocalFileSystem; // ReadLocalFiles | WriteLocalFiles

// Available flags:
// None, ReadLocalFiles, WriteLocalFiles,
// CallExternalApis, SendMessages, AccessDatabase, ReadSecrets,
// SpawnSubAgents, ReadAuditTrail, CallLlm, ExecuteCode,
// LocalFileSystem, OutboundNetwork, All
\`\`\`

## AgentContext
*Source: MonadicSharp.Framework/src/MonadicSharp.Agents/Core/AgentContext.cs*

\`\`\`csharp
// Create a context granting specific capabilities
var ctx = AgentContext.Create(
    AgentCapability.CallLlm | AgentCapability.AccessDatabase);

// Narrow for child agents (can never grant MORE than parent)
var childCtx = ctx.Narrow(AgentCapability.CallLlm);

// Check capabilities inside an agent (returns Result)
Result<AgentContext> verified = ctx.Require(AgentCapability.CallLlm);

// Attach metadata (correlation ID, tenant, etc.)
var ctx2 = ctx.WithMetadata("TenantId", tenantId)
              .WithMetadata("CorrelationId", correlationId);

// Read back typed metadata
Result<string> tenant = ctx.GetMetadata<string>("TenantId");

// Factory shortcuts
var trusted   = AgentContext.Trusted();    // all caps — tests only
var sandboxed = AgentContext.Sandboxed();  // no caps
\`\`\`

## AgentPipeline
*Source: MonadicSharp.Framework/src/MonadicSharp.Agents/Pipeline/AgentPipeline.cs*

\`\`\`csharp
// Typed sequential pipeline — short-circuits on first failure
var pipelineResult = await AgentPipeline
    .Start("DocumentProcessing", extractorAgent)
    .Then(summaryAgent)
    .Then(classifierAgent)
    .RunAsync(rawText, context);

// pipelineResult carries both the Result and a full PipelineTrace
if (pipelineResult.IsSuccess)
    Console.WriteLine(pipelineResult.Value);
else
    Console.WriteLine($"Failed at: {pipelineResult.Error.Message}");

// Steps are always populated up to the point of failure
foreach (var step in pipelineResult.Steps)
    Console.WriteLine($"{step.AgentName}: {step.Duration.TotalMilliseconds}ms {(step.Succeeded ? "OK" : "FAILED")}");
\`\`\`

## AgentOrchestrator
*Source: MonadicSharp.Framework/src/MonadicSharp.Agents/Orchestration/AgentOrchestrator.cs*

\`\`\`csharp
// Build and register agents — each gets its own CircuitBreaker automatically
var orchestrator = new AgentOrchestrator(logger, circuitBreakerThreshold: 5)
    .Register(summaryAgent)
    .Register(classifierAgent);

// Dispatch by name — capability check and CB applied
Result<Summary> result = await orchestrator.DispatchAsync<string, Summary>(
    "SummaryAgent", rawText, context);

// Inspect circuit state
Result<CircuitState> state = orchestrator.GetCircuitState("SummaryAgent");

// Full audit log (immutable list of OrchestratorAuditEntry)
foreach (var entry in orchestrator.AuditLog)
    Console.WriteLine($"{entry.AgentName} — {(entry.Succeeded ? "OK" : entry.Error?.Message)}");
\`\`\`

## CircuitBreaker
*Source: MonadicSharp.Framework/src/MonadicSharp.Agents/Resilience/CircuitBreaker.cs*

\`\`\`csharp
// Use on every external agent or third-party service call
var cb = new CircuitBreaker(
    name: "OpenAiClient",
    failureThreshold: 5,
    openDuration: TimeSpan.FromSeconds(30),
    halfOpenTimeout: TimeSpan.FromSeconds(10));

// States: Closed (normal), Open (blocking), HalfOpen (probing)
Result<string> response = await cb.ExecuteAsync(
    async ct => await Try.ExecuteAsync(() => llmClient.CompleteAsync(prompt, ct)));

// Result<AgentError.CircuitOpen> returned when circuit is OPEN — no call made
result.Match(
    onSuccess: r  => Process(r),
    onFailure: err => err.Code == "CIRCUIT_OPEN" ? Fallback() : LogAndFail(err));
\`\`\`
`,
      },
    ],
  })
);

// ---------------------------------------------------------------------------
// RESOURCE: monadic-sharp://framework-infrastructure
// Source: MonadicSharp.Framework/src/MonadicSharp.Caching/**
//         MonadicSharp.Framework/src/MonadicSharp.Http/**
//         MonadicSharp.Framework/src/MonadicSharp.Persistence/**
// ---------------------------------------------------------------------------

server.resource(
  "framework-infrastructure",
  "monadic-sharp://framework-infrastructure",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "text/markdown",
        text: `# MonadicSharp.Framework — Infrastructure (Caching, Http, Persistence)

## CachingAgentWrapper
*Source: MonadicSharp.Framework/src/MonadicSharp.Caching/Middleware/CachingAgentWrapper.cs*

\`\`\`csharp
// Transparent decorator — wraps any IAgent<TIn,TOut> with cache-aside logic
IAgent<Query, SearchResult> cachedSearch =
    new CachingAgentWrapper<Query, SearchResult>(
        inner: searchAgent,
        cache: cache,
        policy: new AgentCachePolicy<Query, SearchResult>
        {
            KeyFactory    = (name, q) => $"{name}:{q.Text}:{q.TopK}",
            EntryOptions  = CacheEntryOptions.WithTtl(TimeSpan.FromMinutes(10)),
            CacheOnlySuccesses = true,
            // BypassPredicate: bypass cache for authenticated/personal queries
            BypassPredicate = (q, ctx) => ctx.HasCapability(AgentCapability.ReadSecrets),
        });

// Wire it into the orchestrator exactly like a plain agent
orchestrator.Register(cachedSearch);
\`\`\`

## HttpResultClient
*Source: MonadicSharp.Framework/src/MonadicSharp.Http/Client/HttpResultClient.cs*

\`\`\`csharp
// All methods return Result<T> — never throw
var client = new HttpResultClient(httpClient, logger: logger);

Result<WeatherDto>     weather = await client.GetAsync<WeatherDto>("/api/weather");
Result<OrderDto>       created = await client.PostAsync<CreateOrderReq, OrderDto>("/api/orders", req);
Result<OrderDto>       updated = await client.PutAsync<UpdateOrderReq, OrderDto>($"/api/orders/{id}", req);
Result<Unit>           deleted = await client.DeleteAsync($"/api/orders/{id}");

// Full response metadata (status code, headers)
HttpResultResponse<T> full = await client.SendAsync<T>(customRequest);
int statusCode = (int)full.StatusCode;

// HTTP errors map to typed Error codes:
// HTTP_NOT_FOUND, HTTP_UNAUTHORIZED, HTTP_FORBIDDEN, HTTP_SERVER_ERROR,
// HTTP_TOO_MANY_REQUESTS, HTTP_NETWORK_FAILURE, HTTP_TIMEOUT, HTTP_DESERIALIZATION_FAILED
\`\`\`

## RetryPolicy (Http)
*Source: MonadicSharp.Framework/src/MonadicSharp.Http/Resilience/RetryPolicy.cs*

\`\`\`csharp
// Only retries transient errors: NETWORK_FAILURE, TIMEOUT, RATE_LIMITED, SERVER_ERROR
var retry = new RetryPolicy(
    maxAttempts:      3,
    initialDelay:     TimeSpan.FromMilliseconds(200),
    backoffMultiplier: 2.0,
    maxDelay:         TimeSpan.FromSeconds(30));

// Use outside validation scope
Result<OrderDto> result = await retry.ExecuteAsync(
    url: "/api/orders",
    operation: ct => client.PostAsync<CreateOrderReq, OrderDto>("/api/orders", req, ct));

// Predefined policies
RetryPolicy.Default  // 3 attempts, 200ms initial, x2 backoff
RetryPolicy.None     // 1 attempt (no retry)
\`\`\`

## IRepository<T, TId> + IUnitOfWork
*Source: MonadicSharp.Framework/src/MonadicSharp.Persistence/Core/IRepository.cs*
*Source: MonadicSharp.Framework/src/MonadicSharp.Persistence/Core/IUnitOfWork.cs*

\`\`\`csharp
// All mutations return Result — nothing throws for expected failures
Result<Order>  added   = await repo.AddAsync(order);
Result<Order>  found   = await repo.GetByIdAsync(orderId);
Result<Order>  updated = repo.Update(order);
Result<Unit>   deleted = await repo.DeleteAsync(orderId);

// Changes are staged — persist via UnitOfWork
Result<int> saved = await unitOfWork.SaveChangesAsync();

// IReadRepository extras
Result<IEnumerable<Order>> all    = await repo.GetAllAsync();
Result<IEnumerable<Order>> paged  = await repo.GetPagedAsync(page: 1, pageSize: 20);
Result<bool>               exists = await repo.ExistsAsync(o => o.Status == OrderStatus.Pending);
Result<int>                count  = await repo.CountAsync(o => o.CustomerId == customerId);
\`\`\`
`,
      },
    ],
  })
);

// ---------------------------------------------------------------------------
// RESOURCE: monadic-sharp://framework-security
// Source: MonadicSharp.Framework/src/MonadicSharp.Security/**
//         MonadicSharp.Framework/src/MonadicSharp.Telemetry/**
// ---------------------------------------------------------------------------

server.resource(
  "framework-security",
  "monadic-sharp://framework-security",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "text/markdown",
        text: `# MonadicSharp.Framework — Security & Telemetry

## PromptGuard
*Source: MonadicSharp.Framework/src/MonadicSharp.Security/Guard/PromptGuard.cs*

\`\`\`csharp
// Default guard: RoleOverride, SystemPromptLeak, DelimiterInjection, Jailbreak
// Max input length: 32 000 chars, binary content rejected
var guard = PromptGuard.Default;

// Strict guard: adds CodeInjection, max length 8 000 chars
var strict = PromptGuard.Strict;

// Always validate at the LLM boundary — returns Result
Result<string> safe = guard.Validate(userInput);
Result<string> safeResult = safe.Bind(input => pipeline.RunAsync(input, ctx));

// Sanitize instead of blocking (replaces patterns, does not fail)
string cleaned = guard.Sanitize(userInput);

// Detection rules (via PromptGuardOptions):
// DetectRoleOverride, DetectSystemPromptLeak, DetectDelimiterInjection,
// DetectJailbreak, DetectCodeInjection, MaxInputLength, RejectBinaryContent
\`\`\`

## SecretMasker
*Source: MonadicSharp.Framework/src/MonadicSharp.Security/Masking/SecretMasker.cs*

\`\`\`csharp
// Default patterns: AwsAccessKey, AwsSecretKey, JwtToken, BearerToken,
// ApiKey, ConnectionString, PrivateKey, GitHubPat, OpenAiKey, SlackToken
var masker = SecretMasker.Default;

// Register known runtime secrets (exact match, highest priority)
masker.Register(Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? "");

// Mask before writing to logs / audit trails
string safeLog = masker.Mask(agentOutputContainingSecrets);

// Mask dictionary (e.g., HTTP headers, agent metadata)
IReadOnlyDictionary<string,string> safeHeaders = masker.MaskDictionary(requestHeaders);

// Check without masking
bool hasSecret = masker.ContainsSecret(responseBody);
\`\`\`

## SecureAgentWrapper
*Source: MonadicSharp.Framework/src/MonadicSharp.Security/Middleware/SecureAgentWrapper.cs*

\`\`\`csharp
// Wraps any IAgent with PromptGuard validation + SecretMasker on output
// Transparent: exposes same Name and RequiredCapabilities as inner agent
IAgent<string, string> secureAgent = new SecureAgentWrapper<string, string>(
    inner:       rawAgent,
    guard:       PromptGuard.Default,
    masker:      masker);

orchestrator.Register(secureAgent);
\`\`\`

## AuditTrail
*Source: MonadicSharp.Framework/src/MonadicSharp.Security/Audit/AuditTrail.cs*

\`\`\`csharp
// Thread-safe append-only audit log for agent invocations
var audit = new AuditTrail();
audit.Record(agentName: "SummaryAgent", input: maskedInput, success: true, sessionId: ctx.SessionId);

foreach (var entry in audit.Entries)
    logger.LogInformation("{Agent} @ {Time}: {Status}", entry.AgentName, entry.Timestamp, entry.Succeeded);
\`\`\`

## AgentActivitySource (Telemetry)
*Source: MonadicSharp.Framework/src/MonadicSharp.Telemetry/Core/AgentActivitySource.cs*

\`\`\`csharp
// Distributed tracing — subscribe via OpenTelemetry SDK
// Activity source name: TelemetryConstants.ActivitySourceName
// Spans: "agent.execute", "pipeline.run"

// Inside an agent implementation
using var activity = AgentActivitySource.StartAgentActivity(Name, context);
var result = await Try.ExecuteAsync(() => llmClient.CompleteAsync(prompt));
AgentActivitySource.CompleteAgentActivity(activity, result.IsSuccess, result.IsFailure ? result.Error.Code : null);
return result;

// Pipeline span
using var pipelineActivity = AgentActivitySource.StartPipelineActivity("OrderPipeline", ctx);
var pipelineResult = await AgentPipeline.Start("OrderPipeline", validatorAgent)
    .Then(processorAgent)
    .RunAsync(order, ctx);
AgentActivitySource.CompletePipelineActivity(pipelineActivity, pipelineResult.IsSuccess, pipelineResult.Steps.Count);
\`\`\`

## TelemetryAgentWrapper
*Source: MonadicSharp.Framework/src/MonadicSharp.Telemetry/Middleware/TelemetryAgentWrapper.cs*

\`\`\`csharp
// Transparent decorator: starts/stops an ActivitySource span per agent invocation
IAgent<string, Summary> traced = new TelemetryAgentWrapper<string, Summary>(innerAgent);
orchestrator.Register(traced);
\`\`\`
`,
      },
    ],
  })
);

// ---------------------------------------------------------------------------
// RESOURCE: monadic-sharp://ai-patterns
// Source: Both repos combined — patterns specific to LLM/AI usage
// ---------------------------------------------------------------------------

server.resource(
  "ai-patterns",
  "monadic-sharp://ai-patterns",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "text/markdown",
        text: `# MonadicSharp — AI / LLM Patterns

These patterns combine core primitives (Result, Try, Option) with Framework
modules (Agents, Caching, Security) for safe, composable AI workflows.

## Minimal LLM Agent skeleton
*Derived from: IAgent.cs + AgentCapability.cs + Try.cs*

\`\`\`csharp
public class LlmSummaryAgent : IAgent<string, string>
{
    public string Name => "LlmSummaryAgent";
    // Declare minimum capability required
    public AgentCapability RequiredCapabilities => AgentCapability.CallLlm;

    private readonly ILlmClient _llm;
    public LlmSummaryAgent(ILlmClient llm) => _llm = llm;

    public Task<Result<string>> ExecuteAsync(
        string input, AgentContext ctx, CancellationToken ct = default)
        // Try.ExecuteAsync wraps every I/O boundary — no try/catch inside
        => Try.ExecuteAsync(() => _llm.SummarizeAsync(input, ct));
}
\`\`\`

## Validate prompt → cache → call LLM pipeline
*Derived from: PromptGuard.cs + CachingAgentWrapper.cs + AgentPipeline.cs + Try.cs*

\`\`\`csharp
// 1. Validate prompt at boundary (PromptGuard returns Result<string>)
var safePrompt = PromptGuard.Default.Validate(userInput);

// 2. Chain into agent pipeline
var pipelineResult = await safePrompt
    .AsTask()                              // Result<string> → Task<Result<string>>
    .Bind(prompt =>                        // only called when validation succeeds
        AgentPipeline
            .Start("AnalysisPipeline", cachedLlmAgent) // CachingAgentWrapper on LLM agent
            .Then(classifierAgent)
            .RunAsync(prompt, ctx)
            .ContinueWith(t => t.Result.Result));       // unwrap PipelineResult

// 3. Mask secrets before logging
string safeLog = SecretMasker.Default.Mask(pipelineResult.ToString());
\`\`\`

## Batch processing with Partition
*Derived from: FunctionalExtensions.cs — Partition()*

\`\`\`csharp
// Preferred over Sequence() for batch jobs — never loses partial results
var results = await Task.WhenAll(inputs.Select(i => agent.ExecuteAsync(i, ctx)));
var (successes, failures) = results.Partition();

// Process successes
await repo.AddRangeAsync(successes);

// Dead-letter / log failures independently
foreach (var error in failures)
    logger.LogWarning("Batch item failed: {Code} {Message}", error.Code, error.Message);
\`\`\`

## Context narrowing for sub-agents
*Derived from: AgentContext.cs — Narrow()*

\`\`\`csharp
// Parent context has broad capabilities
var rootCtx = AgentContext.Create(
    AgentCapability.CallLlm | AgentCapability.AccessDatabase | AgentCapability.SpawnSubAgents);

// Narrow before passing to child — can never escalate
var childCtx = rootCtx.Narrow(AgentCapability.CallLlm);

Result<Summary> summary = await orchestrator.DispatchAsync<string, Summary>(
    "LlmSummaryAgent", prompt, childCtx);
\`\`\`

## Http call with retry + circuit breaker
*Derived from: HttpResultClient.cs + RetryPolicy.cs + CircuitBreaker.cs*

\`\`\`csharp
var cb     = new CircuitBreaker("ExternalLlmApi", failureThreshold: 5);
var retry  = new RetryPolicy(maxAttempts: 3, initialDelay: TimeSpan.FromMilliseconds(200));
var client = new HttpResultClient(httpClient);

Result<CompletionDto> result = await cb.ExecuteAsync(async ct =>
    await retry.ExecuteAsync(
        url: "/v1/completions",
        operation: ct2 => client.PostAsync<CompletionReq, CompletionDto>(
            "/v1/completions", req, ct2),
        ct: ct));

result.Match(
    onSuccess: r  => Process(r),
    onFailure: err => err.Code is "CIRCUIT_OPEN" ? ServeFallback() : LogError(err));
\`\`\`

## Audit + Telemetry composition
*Derived from: AgentOrchestrator.cs (OrchestratorAuditLog) + AgentActivitySource.cs*

\`\`\`csharp
// AgentOrchestrator records every dispatch automatically
var orchestrator = new AgentOrchestrator(logger)
    .Register(new TelemetryAgentWrapper<string, Summary>(llmSummaryAgent))
    .Register(new CachingAgentWrapper<string, Summary>(llmSummaryAgent, cache));

var result = await orchestrator.DispatchAsync<string, Summary>(
    "LlmSummaryAgent", prompt, ctx);

// Inspect per-session audit trail
var sessionLog = orchestrator.AuditLog
    .Where(e => e.SessionId == ctx.SessionId)
    .ToList();
\`\`\`
`,
      },
    ],
  })
);

// ---------------------------------------------------------------------------
// TOOL: generate_monadic_snippet
// Scenarios derived exclusively from real source in both repos.
// ---------------------------------------------------------------------------

server.tool(
  "generate_monadic_snippet",
  {
    scenario: z.enum([
      // Core (MonadicSharp)
      "result-chain",
      "option-from-nullable",
      "error-types",
      "try-async-io",
      "either-branch",
      "partition-batch",
      "pipeline-builder",
      "sequence-vs-partition",
      // Framework — Agents
      "agent-implementation",
      "agent-pipeline-typed",
      "agent-orchestrator-dispatch",
      "circuit-breaker-external",
      "context-narrowing",
      // Framework — Caching
      "caching-agent-wrapper",
      // Framework — Http
      "http-result-client",
      "http-retry-policy",
      // Framework — Persistence
      "repository-unit-of-work",
      // Framework — Security
      "prompt-guard-validate",
      "secret-masker",
      // Framework — Telemetry
      "telemetry-activity-span",
    ]),
    context: z.string().optional(),
  },
  async ({ scenario, context }) => {
    const snippets: Record<string, string> = {
      // ── Core ──────────────────────────────────────────────────────────────

      "result-chain": `// Result<T> chaining — from Result.cs
// Source: MonadicSharp/Result.cs, Extensions/FunctionalExtensions.cs
Result<Order> result = await Try.ExecuteAsync(() => db.FindOrderAsync(orderId))
    .Map(o => o)                                          // infallible: use Map
    .Bind(o => ValidateOrder(o))                          // may fail: use Bind
    .Where(o => o.Status == OrderStatus.Active, "Not active")
    .MapAsync(o => EnrichWithCustomer(o));

result.Match(
    onSuccess: o  => Console.WriteLine($"Order {o.Id} OK"),
    onFailure: err => Console.WriteLine($"[{err.Type}] {err.Code}: {err.Message}"));`,

      "option-from-nullable": `// Option<T> from nullable — from Option.cs
// Source: MonadicSharp/Option.cs
string? raw = config["ApiKey"];

Option<string> apiKey = Option<string>.From(raw);

// Convert to Result when absence must be an error
Result<string> required = apiKey.ToResult(Error.NotFound("Config", "ApiKey"));

// Pattern match
string display = apiKey.Match(
    onSome:  k => $"Key: {k[..4]}...",
    onNone: () => "(not configured)");`,

      "error-types": `// Error factory methods — from Error.cs
// Source: MonadicSharp/Error.cs
Error validation = Error.Validation("Email is invalid", field: "Email");
Error notFound   = Error.NotFound("User", userId.ToString());
Error forbidden  = Error.Forbidden("Admin role required");
Error conflict   = Error.Conflict("Email already registered", "User");
Error fromEx     = Error.FromException(exception);

// Composition
Error combined   = Error.Combine(err1, err2, err3);

// Enrichment
Error enriched   = Error.Create("Downstream failure")
    .WithMetadata("ServiceName", "PaymentApi")
    .WithMetadata("RequestId", requestId)
    .WithInnerError(downstreamError);

// ErrorType check
bool isValidation = error.IsOfType(ErrorType.Validation);
bool isNotFound   = error.HasCode("NOT_FOUND");`,

      "try-async-io": `// Try.ExecuteAsync for every I/O boundary — from Try.cs
// Source: MonadicSharp/Try.cs
// Rule: never use try/catch inside Bind — use Try.ExecuteAsync instead

Result<byte[]> file = await Try.ExecuteAsync(
    () => File.ReadAllBytesAsync(path, cancellationToken));

Result<string> response = await Try.ExecuteAsync(
    () => httpClient.GetStringAsync(url, cancellationToken));

// With typed input
Result<Order> order = await Try.ExecuteAsync(
    orderId,
    id => dbContext.Orders.FindAsync(id).AsTask());`,

      "either-branch": `// Either<TLeft, TRight> — from Either.cs
// Source: MonadicSharp/Either.cs
Either<ValidationError, ParsedCommand> parsed =
    TryParseCommand(rawInput);

// Map/Bind only on Right
Either<ValidationError, string> label =
    parsed.Map(cmd => cmd.ToString());

// Pattern match to collapse both sides
string output = parsed.Match(
    onLeft:  e   => $"Parse error: {e.Message}",
    onRight: cmd => $"Command: {cmd.Name}");`,

      "partition-batch": `// Partition for batch — from FunctionalExtensions.cs
// Source: MonadicSharp/Extensions/FunctionalExtensions.cs
// Prefer Partition over Sequence for batch jobs — retains partial results

var tasks = orders.Select(o => processAgent.ExecuteAsync(o, ctx));
var results = await Task.WhenAll(tasks);

var (processed, errors) = results.Partition();

// processed : IEnumerable<ProcessedOrder>
// errors    : IEnumerable<Error>

await repo.AddRangeAsync(processed);
foreach (var err in errors)
    deadLetterQueue.Enqueue(err);`,

      "pipeline-builder": `// PipelineBuilder fluent API — from PipelineExtensions.cs
// Source: MonadicSharp/Extensions/PipelineExtensions.cs
var result = await Task.FromResult(Result<CreateOrderRequest>.Success(request))
    .Then(ValidateRequestAsync)
    .Then(CheckInventoryAsync)
    .ThenIf(req => req.RequiresApproval, RequestApprovalAsync)
    // Retry only after validation — outside validation scope
    .ThenWithRetry(SubmitToWarehouseAsync, maxAttempts: 3)
    .ExecuteAsync();

result.Match(
    onSuccess: order => logger.LogInformation("Order {Id} created", order.Id),
    onFailure: err   => logger.LogError("Order failed: {Code}", err.Code));`,

      "sequence-vs-partition": `// Sequence vs Partition — from FunctionalExtensions.cs
// Source: MonadicSharp/Extensions/FunctionalExtensions.cs

// Sequence: fail-fast — returns error if ANY result fails
// Use when all-or-nothing semantics are required
Result<IEnumerable<User>> all = userResults.Sequence();

// Partition: split-path — never loses partial successes
// Use for batch processing (Service Bus, bulk insert, fan-out)
var (users, errors) = userResults.Partition();
// Continue processing users even if some failed`,

      // ── Framework — Agents ───────────────────────────────────────────────

      "agent-implementation": `// Implementing IAgent<TInput, TOutput> — from IAgent.cs
// Source: MonadicSharp.Framework/src/MonadicSharp.Agents/Core/IAgent.cs
public sealed class ClassificationAgent : IAgent<string, ClassificationResult>
{
    public string Name => "ClassificationAgent";
    // Declare MINIMUM capabilities only
    public AgentCapability RequiredCapabilities => AgentCapability.CallLlm;

    private readonly ILlmClient _llm;
    public ClassificationAgent(ILlmClient llm) => _llm = llm;

    public Task<Result<ClassificationResult>> ExecuteAsync(
        string text, AgentContext ctx, CancellationToken ct = default)
    {
        // Try.ExecuteAsync at every I/O boundary — no try/catch here
        return Try.ExecuteAsync(() => _llm.ClassifyAsync(text, ct));
    }
}`,

      "agent-pipeline-typed": `// AgentPipeline typed chaining — from AgentPipeline.cs
// Source: MonadicSharp.Framework/src/MonadicSharp.Agents/Pipeline/AgentPipeline.cs
var ctx = AgentContext.Create(
    AgentCapability.CallLlm | AgentCapability.AccessDatabase);

PipelineResult<Report> pipelineResult = await AgentPipeline
    .Start("ReportPipeline", extractorAgent)   // string → ExtractedData
    .Then(summaryAgent)                         // ExtractedData → Summary
    .Then(reportAgent)                          // Summary → Report
    .RunAsync(rawDocument, ctx);

// Always check both result and trace
if (pipelineResult.IsSuccess)
    await repo.AddAsync(pipelineResult.Value);
else
    logger.LogError("Pipeline failed: {Error}", pipelineResult.Error.Message);

// Trace always populated to the point of failure
foreach (var step in pipelineResult.Steps)
    metrics.Record(step.AgentName, step.Duration, step.Succeeded);`,

      "agent-orchestrator-dispatch": `// AgentOrchestrator — from AgentOrchestrator.cs
// Source: MonadicSharp.Framework/src/MonadicSharp.Agents/Orchestration/AgentOrchestrator.cs
var orchestrator = new AgentOrchestrator(logger, circuitBreakerThreshold: 5)
    .Register(extractorAgent)
    .Register(summaryAgent);

var ctx = AgentContext.Create(AgentCapability.CallLlm)
    .WithMetadata("CorrelationId", correlationId);

// Dispatch: capability check + CircuitBreaker applied automatically
Result<Summary> summary = await orchestrator.DispatchAsync<string, Summary>(
    "SummaryAgent", rawText, ctx);

// Inspect circuit health per agent
Result<CircuitState> state = orchestrator.GetCircuitState("SummaryAgent");

// Immutable audit log (all dispatches in this orchestrator)
var failedDispatches = orchestrator.AuditLog
    .Where(e => !e.Succeeded)
    .ToList();`,

      "circuit-breaker-external": `// CircuitBreaker on every external agent — from CircuitBreaker.cs
// Source: MonadicSharp.Framework/src/MonadicSharp.Agents/Resilience/CircuitBreaker.cs
var cb = new CircuitBreaker(
    name:             "ExternalApiAgent",
    failureThreshold: 5,                            // opens after 5 consecutive failures
    openDuration:     TimeSpan.FromSeconds(30),     // stays open 30s
    halfOpenTimeout:  TimeSpan.FromSeconds(10));    // probe must complete within 10s

Result<ApiResponse> result = await cb.ExecuteAsync(async ct =>
    await Try.ExecuteAsync(() => externalClient.CallAsync(request, ct)));

// Handle circuit-open gracefully
result.Match(
    onSuccess: r  => Process(r),
    onFailure: err =>
    {
        if (err.Code == "CIRCUIT_OPEN")   ServeFallback();
        else                              LogAndAlert(err);
    });`,

      "context-narrowing": `// AgentContext.Narrow for sub-agents — from AgentContext.cs
// Source: MonadicSharp.Framework/src/MonadicSharp.Agents/Core/AgentContext.cs
// Narrow() can never escalate capabilities — always returns subset

var rootCtx = AgentContext.Create(
    AgentCapability.CallLlm
    | AgentCapability.AccessDatabase
    | AgentCapability.SpawnSubAgents)
    .WithMetadata("TenantId", tenantId);

// Child agent gets only what it needs
var llmOnlyCtx = rootCtx.Narrow(AgentCapability.CallLlm);

Result<Summary> summary = await orchestrator.DispatchAsync<string, Summary>(
    "LlmSummaryAgent", prompt, llmOnlyCtx);`,

      // ── Framework — Caching ──────────────────────────────────────────────

      "caching-agent-wrapper": `// CachingAgentWrapper — from CachingAgentWrapper.cs
// Source: MonadicSharp.Framework/src/MonadicSharp.Caching/Middleware/CachingAgentWrapper.cs
// Place BEFORE every repeated LLM call

IAgent<SearchQuery, SearchResult> cachedSearch =
    new CachingAgentWrapper<SearchQuery, SearchResult>(
        inner: searchAgent,
        cache: memoryCacheService,
        policy: new AgentCachePolicy<SearchQuery, SearchResult>
        {
            KeyFactory         = (name, q) => $"{name}:{q.Text}:{q.TopK}",
            EntryOptions       = CacheEntryOptions.WithTtl(TimeSpan.FromMinutes(5)),
            CacheOnlySuccesses = true,
            // Bypass for personalised queries
            BypassPredicate    = (q, ctx) => q.UserId != null,
        });

orchestrator.Register(cachedSearch);`,

      // ── Framework — Http ─────────────────────────────────────────────────

      "http-result-client": `// HttpResultClient — from HttpResultClient.cs
// Source: MonadicSharp.Framework/src/MonadicSharp.Http/Client/HttpResultClient.cs
var client = new HttpResultClient(httpClient, logger: logger);

// All methods return Result<T> — HTTP errors mapped to typed Error codes
Result<UserDto>    user    = await client.GetAsync<UserDto>($"/users/{id}");
Result<UserDto>    created = await client.PostAsync<CreateUserReq, UserDto>("/users", req);
Result<UserDto>    updated = await client.PutAsync<UpdateUserReq, UserDto>($"/users/{id}", req);
Result<Unit>       deleted = await client.DeleteAsync($"/users/{id}");

// Map HTTP error codes to domain decisions
user.Match(
    onSuccess: u  => Render(u),
    onFailure: err => err.Code switch
    {
        "HTTP_NOT_FOUND"    => ShowNotFound(),
        "HTTP_UNAUTHORIZED" => RedirectToLogin(),
        "HTTP_SERVER_ERROR" => ShowRetryMessage(),
        _                   => ShowGenericError(err.Message),
    });`,

      "http-retry-policy": `// RetryPolicy (Http) — from RetryPolicy.cs
// Source: MonadicSharp.Framework/src/MonadicSharp.Http/Resilience/RetryPolicy.cs
// Retries only transient codes: NETWORK_FAILURE, TIMEOUT, RATE_LIMITED, SERVER_ERROR

var retry = new RetryPolicy(
    maxAttempts:       3,
    initialDelay:      TimeSpan.FromMilliseconds(200),
    backoffMultiplier: 2.0,                        // 200ms → 400ms → 800ms
    maxDelay:          TimeSpan.FromSeconds(30));

Result<PaymentDto> payment = await retry.ExecuteAsync(
    url: "/api/payments",
    operation: ct => client.PostAsync<PaymentReq, PaymentDto>("/api/payments", req, ct));

// RetryPolicy.Default  = 3 attempts, 200ms, ×2 backoff, max 30s
// RetryPolicy.None     = 1 attempt (no retry — use for non-idempotent ops)`,

      // ── Framework — Persistence ──────────────────────────────────────────

      "repository-unit-of-work": `// IRepository + IUnitOfWork — from IRepository.cs / IUnitOfWork.cs
// Source: MonadicSharp.Framework/src/MonadicSharp.Persistence/Core/

// Stage mutations — nothing persists until SaveChangesAsync
Result<Order>  added   = await orderRepo.AddAsync(newOrder);
Result<Order>  updated = orderRepo.Update(existingOrder);
Result<Unit>   deleted = await orderRepo.DeleteAsync(orderId);

// Commit — returns rows affected
Result<int> saved = await unitOfWork.SaveChangesAsync();

// Paged query
Result<IEnumerable<Order>> page = await orderRepo.GetPagedAsync(
    page: 1, pageSize: 20, predicate: o => o.Status == OrderStatus.Active);

// Checked existence
Result<bool> exists = await orderRepo.ExistsAsync(o => o.Email == email);`,

      // ── Framework — Security ─────────────────────────────────────────────

      "prompt-guard-validate": `// PromptGuard.Validate — from PromptGuard.cs
// Source: MonadicSharp.Framework/src/MonadicSharp.Security/Guard/PromptGuard.cs
// Always validate at the LLM boundary

Result<string> safe = PromptGuard.Default.Validate(userInput);

// Railway-chain: only reaches LLM if validation passes
Result<Summary> result = safe
    .Bind(prompt => AgentContext
        .Create(AgentCapability.CallLlm)
        .Require(AgentCapability.CallLlm)
        .Bind(ctx => llmAgent.ExecuteAsync(prompt, ctx).GetAwaiter().GetResult()));

// Strict mode: shorter limit (8k), includes code injection detection
Result<string> strictSafe = PromptGuard.Strict.Validate(userInput);

// Sanitize (clean rather than block)
string cleaned = PromptGuard.Default.Sanitize(userInput);`,

      "secret-masker": `// SecretMasker — from SecretMasker.cs
// Source: MonadicSharp.Framework/src/MonadicSharp.Security/Masking/SecretMasker.cs
// Mask before any log, audit, or LLM trace write

var masker = new SecretMasker();
masker.Register(Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? "");
masker.Register(Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "");

// Safe to log
string safeOutput = masker.Mask(agentResult.ToString());
logger.LogInformation("Agent response: {Response}", safeOutput);

// Mask entire header dictionary
IReadOnlyDictionary<string, string> safeHeaders = masker.MaskDictionary(requestHeaders);

// Quick check
if (masker.ContainsSecret(responseBody))
    logger.LogWarning("Secret detected in response body — not forwarding to client");

// Default patterns cover: AWS keys, JWTs, Bearer tokens, API keys,
// connection strings, private keys, GitHub PATs, OpenAI keys, Slack tokens`,

      // ── Framework — Telemetry ────────────────────────────────────────────

      "telemetry-activity-span": `// AgentActivitySource — from AgentActivitySource.cs
// Source: MonadicSharp.Framework/src/MonadicSharp.Telemetry/Core/AgentActivitySource.cs
// Zero overhead when no listener is subscribed

// In an agent implementation
public async Task<Result<Summary>> ExecuteAsync(
    string input, AgentContext ctx, CancellationToken ct = default)
{
    using var activity = AgentActivitySource.StartAgentActivity(Name, ctx);
    var result = await Try.ExecuteAsync(() => _llm.SummarizeAsync(input, ct));
    AgentActivitySource.CompleteAgentActivity(
        activity, result.IsSuccess, result.IsFailure ? result.Error.Code : null);
    return result;
}

// For a full pipeline
using var pipelineActivity = AgentActivitySource.StartPipelineActivity("DocPipeline", ctx);
var pr = await AgentPipeline.Start("DocPipeline", extractorAgent).Then(summaryAgent)
    .RunAsync(document, ctx);
AgentActivitySource.CompletePipelineActivity(pipelineActivity, pr.IsSuccess, pr.Steps.Count);

// Or use transparent wrapper (from TelemetryAgentWrapper.cs)
orchestrator.Register(new TelemetryAgentWrapper<string, Summary>(summaryAgent));`,
    };

    const code = snippets[scenario];
    const contextNote = context ? `\n\n// Context: ${context}` : "";

    return {
      content: [
        {
          type: "text" as const,
          text: `${code}${contextNote}`,
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
