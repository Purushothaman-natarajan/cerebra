# Contributing to Cerebra-AI

## Code of Conduct

This project adheres to a code of conduct. By participating, you agree to maintain a respectful, inclusive, and constructive environment.

---

## Git Workflow

### Branching Strategy

```
main          ─── Production-ready code
  └── develop ─── Integration branch for features
       ├── feat/run-events           Feature branches
       ├── fix/dialog-focus          Bug fix branches
       ├── refactor/llm-provider     Refactoring branches
       └── docs/api-documentation    Documentation branches
```

### Branch Naming

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New feature | `feat/provider-aware-llm` |
| `fix/` | Bug fix | `fix/dialog-focus-steal` |
| `refactor/` | Code refactoring | `refactor/executor-error-handling` |
| `docs/` | Documentation | `docs/api-documentation` |
| `chore/` | Maintenance | `chore/update-dependencies` |
| `test/` | Testing | `test/run-execution-edge-cases` |

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `security`

**Examples:**
```
feat(agents): add provider-aware LLM routing
fix(dialog): prevent focus-steal on input change
refactor(executor): extract event publishing helpers
docs(api): add run events endpoint documentation
test(runs): add integration test for failed workflow
security(auth): validate token expiry before access
```

---

## Pull Request Process

### Before Submitting

1. **Run all tests:**
   ```bash
   cd backend && python -m pytest tests/ -v
   cd frontend && npm run build
   ```

2. **Check for lint issues:**
   ```bash
   # Backend (Python)
   pip install ruff && ruff check backend/app/

   # Frontend (TypeScript)
   cd frontend && npx tsc --noEmit
   ```

3. **Write or update tests** for any changed functionality.

4. **Update documentation** if API contracts or configurations change.

### PR Title Format

```
<type>(<scope>): <description>
```

### PR Checklist

- [ ] Code follows project style and conventions
- [ ] Tests pass (backend + frontend)
- [ ] New tests added for changed functionality
- [ ] TypeScript compiles without errors
- [ ] Frontend production build succeeds
- [ ] API documentation updated (if endpoints changed)
- [ ] CHANGELOG.md updated
- [ ] No hardcoded secrets or credentials
- [ ] Environment variables documented in .env.example

### Review Process

1. At least one maintainer must approve
2. All CI checks must pass
3. No merge conflicts with `main`
4. Squash commits before merging

---

## Coding Standards

### Python

- **Python version**: 3.12+
- **Async-first**: Use `async/await` for I/O-bound operations
- **Type hints**: Required for all functions (`Optional`, `Union`, etc.)
- **Docstrings**: Google-style docstrings for all public functions
- **Imports**: Standard library → Third-party → Local, alphabetically sorted
- **Naming**: `snake_case` for functions/variables, `PascalCase` for classes, `UPPER_CASE` for constants
- **Error handling**: Use specific exception types; avoid bare `except:`

```python
async def get_agent(db: AsyncSession, agent_id: str) -> Agent | None:
    """Fetch an agent by UUID.

    Args:
        db: Async database session.
        agent_id: UUID string of the agent.

    Returns:
        The Agent ORM instance, or None if not found.

    Raises:
        ValueError: If agent_id is not a valid UUID.
    """
    try:
        result = await db.execute(
            select(Agent).where(Agent.id == uuid.UUID(agent_id))
        )
    except ValueError:
        raise ValueError(f"Invalid agent_id: {agent_id}")
    return result.scalar_one_or_none()
```

### TypeScript / React

- **TypeScript**: Strict mode enabled. Avoid `any` where possible.
- **React**: Functional components with hooks. No class components.
- **State management**: TanStack Query for server state, Zustand for UI state.
- **Styling**: Tailwind CSS utility classes. No CSS modules or styled-components.
- **Naming**: `camelCase` for variables/functions, `PascalCase` for components/interfaces
- **File structure**: One component per file, exported as default
- **Error boundaries**: Wrap async operations with try/catch; show user-friendly toasts

```typescript
interface AgentCardProps {
  agent: Agent;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
}

export default function AgentCard({ agent, onEdit, onDelete, onTest }: AgentCardProps) {
  return (
    <Card hover className="p-4">
      <div className="flex items-start gap-3">
        <AgentAvatar role={agent.role} />
        <div className="min-w-0 flex-1">
          <span className="font-medium text-foreground text-sm truncate">
            {agent.name}
          </span>
          <p className="text-xs text-muted line-clamp-2">{agent.system_prompt}</p>
        </div>
      </div>
    </Card>
  );
}
```

### Naming Conventions

| Concept | Convention | Example |
|---------|-----------|---------|
| Python modules | `snake_case` | `agent_service.py` |
| Python classes | `PascalCase` | `RunEventResponse` |
| Python functions | `snake_case` | `get_run_events()` |
| TypeScript files | `PascalCase.tsx` | `ToolTestDialog.tsx` |
| TypeScript components | `PascalCase` | `AgentCard` |
| TypeScript functions | `camelCase` | `fetchTools()` |
| API endpoints | `kebab-case` | `GET /agent-templates` |
| Database tables | `snake_case` | `run_events` |
| Environment variables | `UPPER_SNAKE_CASE` | `DATABASE_URL` |

---

## Testing Guidelines

### Backend Tests

- **Framework**: pytest + pytest-asyncio
- **Location**: `backend/tests/`
- **Naming**: `test_<module>.py`
- **Test functions**: `def test_<feature>()`
- **Fixtures**: Use `conftest.py` for shared test infrastructure
- **Isolation**: Each test should be independent (use fresh DB session)

```bash
cd backend
python -m pytest tests/ -v                    # Run all tests
python -m pytest tests/test_agent_crud.py -v  # Run specific file
python -m pytest tests/ --cov=app             # Coverage report
```

### Frontend Tests

- **Framework**: Vitest + Testing Library
- **Location**: `frontend/src/test/`
- **Coverage**: Aim for 80%+ on components, 60%+ on pages
- **Mocking**: Mock API calls with `vi.fn()`, mock router with `MemoryRouter`

```bash
cd frontend
npx vitest run                  # Run all tests
npx vitest --coverage           # Coverage report
```

---

## Adding a New Tool

1. Create `backend/app/runtime/tools/<name>.py`
2. Use `@register("<name>")` decorator
3. Import in `backend/app/runtime/tools/__init__.py`
4. Add icon to `frontend/src/pages/ToolsPage.tsx` `toolIcons` map
5. Add sample input to `SAMPLE_INPUTS` map
6. Add frontend tests if UI interactions are affected

---

## Adding a New LLM Provider

1. Add adapter in `backend/app/runtime/llm_providers.py`
2. Register the provider type in the provider router
3. Add model discovery logic in the test-connection flow

---

## Security Checklist

- [ ] No hardcoded secrets in code or comments
- [ ] All user input validated via Pydantic schemas
- [ ] API keys encrypted at rest (Fernet)
- [ ] SQL injection prevented via SQLAlchemy ORM
- [ ] SSRF/DNS rebinding protection for HTTP tools
- [ ] Rate limiting on all endpoints
- [ ] Authentication enforced (configurable)
- [ ] Dependencies scanned for known vulnerabilities

---

## Questions?

Open a [GitHub Discussion](https://github.com/Purushothaman-natarajan/cerebra/discussions) or tag a maintainer in your PR.
