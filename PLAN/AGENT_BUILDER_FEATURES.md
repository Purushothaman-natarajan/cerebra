# Agent Builder Features — Based on OpenAI's Agent Builder

Reference: https://developers.openai.com/api/docs/guides/agent-builder

## Feature Gap Analysis

| Feature | OpenAI | Orchid | Priority |
|---------|--------|--------|----------|
| Visual node canvas | ✅ Drag-drop | ✅ ReactFlow | Done |
| Agent nodes | ✅ | ✅ | Done |
| Router nodes | ✅ | ✅ | Done |
| Templates | ✅ | ✅ | Done |
| Run/Execute | ✅ | ✅ | Done |
| **Node config panel** | ✅ Side panel on click | ❌ No panel | **P0** |
| **Human Gate node** | ✅ | ❌ Missing | **P0** |
| **Output node** | ✅ | ❌ Missing | **P1** |
| **Run preview/debug** | ✅ Live preview | ❌ Basic runs | **P1** |
| **Typed inputs/outputs** | ✅ Data contracts | ❌ Missing | P2 |
| **Versioning** | ✅ Publish/snapshot | ❌ Missing | P2 |
| **Code export** | ✅ SDK code download | ❌ Missing | P3 |
| **Evaluation/graders** | ✅ | ❌ Missing | P3 |

## Implementation Plan

### Phase 1 — P0 (This session)
- [ ] Node config side panel (click node → slide-in panel with config form)
- [ ] Human Gate node type (pause workflow, wait for approval)
- [ ] Output node type (return result, send to channel)

### Phase 2 — P1 (Next session)
- [ ] Run preview mode (side-by-side view during execution)
- [ ] Note node type (documentation-only on canvas)

### Phase 3 — P2-P3 (Future)
- [ ] Input/output typing on edges
- [ ] Workflow versioning
- [ ] Code export
- [ ] Template wizard improvements
