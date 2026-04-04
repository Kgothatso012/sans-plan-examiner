# Joe's Examiner - Intelligent Plan Examiner

## Goal
Build an intelligent plan examination system inspired by Claude Code architecture - for sale to City of Tshwane.

## Architecture (Claude Code-Inspired)

### Core Components (from Claude Code)
1. **Tool System** - Modular clause checkers (like FileReadTool, GrepTool)
2. **Skill System** - Reusable examination workflows
3. **Memory System** - Learn from corrections (persistent)
4. **Service Layer** - MiniMax API + Supabase integration
5. **Command System** - User commands (/analyze, /report, /export)

### Intelligent Features
- Multi-step clause verification workflow
- Learning from user corrections (feedback loop)
- Pattern recognition from historical data
- Confidence scoring
- Evidence extraction from plans

## Tasks (Phase 1 - Intelligence Layer)
- [ ] Task 1: Add tool definitions for clause checkers → Verify: Each clause has tool schema
- [ ] Task 2: Build skill system for examination workflows → Verify: Skills are reusable
- [ ] Task 3: Implement memory system for corrections → Verify: Corrections improve future analysis
- [ ] Task 4: Add command system (/analyze, /report) → Verify: Commands work via UI buttons

## Tasks (Phase 2 - UI/UX)
- [ ] Task 5: Enhanced dashboard withExaminer stats → Verify: Shows examiner performance
- [ ] Task 6: Report export (PDF) → Verify: Generates downloadable report
- [ ] Task 7: Multi-plan comparison → Verify: Compare multiple plans

## Done When
- [ ] Tool-based clause checking system
- [ ] Skills execute multi-step workflows
- [ ] Memory learns from corrections
- [ ] Ready for Tshwane demo/pitch