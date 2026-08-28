export interface RubricTier {
    id: string
    name: string
    points: number
    color: 'emerald' | 'blue' | 'amber' | 'rose'
}

export interface RubricCriterion {
    id: string
    title: string
    max_points: number
    tiers: {
        'Excellent'?: string
        'Good'?: string
        'Fair'?: string
        'Needs Improvement'?: string
        [key: string]: string | undefined
    }
}

export interface QuantitativeRubric {
    scale: RubricTier[]
    criteria: RubricCriterion[]
}

export const DEFAULT_RUBRIC_SCALE: RubricTier[] = [
    { id: 'excellent', name: 'Excellent', points: 10, color: 'emerald' },
    { id: 'good', name: 'Good', points: 7, color: 'blue' },
    { id: 'fair', name: 'Fair', points: 4, color: 'amber' },
    { id: 'needs_improvement', name: 'Needs Improvement', points: 2, color: 'rose' }
]

export const STANDARD_ROUND_RUBRICS: Record<number, { title: string; criteria: RubricCriterion[] }> = {
    1: {
        title: 'Round 1: Online Certification & Practical Learning',
        criteria: [
            {
                id: 'crit_r1_1',
                title: 'Online Certification & Practical Learning Assessment',
                max_points: 10,
                tiers: {
                    'Excellent': 'Completes 100% of prescribed course content, certificate and practical exercises with ≥85% assessment performance',
                    'Good': 'Completes 100% of course requirements with 65–84% assessment performance',
                    'Fair': 'Completes 75–99% of requirements with 40–64% assessment performance',
                    'Needs Improvement': 'Completes <75% of requirements or achieves <40% assessment performance'
                }
            }
        ]
    },
    2: {
        title: 'Round 2: Problem Analysis & Reverse Engineering',
        criteria: [
            {
                id: 'crit_r2_1',
                title: 'Problem Analysis & Requirement Specification',
                max_points: 10,
                tiers: {
                    'Excellent': 'Identifies ≥90% of major features/workflows and provides comprehensive functional & non-functional requirements',
                    'Good': 'Identifies 70–89% of major features/workflows with good requirement analysis',
                    'Fair': 'Identifies 40–69% with partial analysis',
                    'Needs Improvement': 'Identifies <40% or provides insufficient analysis'
                }
            }
        ]
    },
    3: {
        title: 'Round 3: Architecture & Feature Design',
        criteria: [
            {
                id: 'crit_r3_1',
                title: 'System Architecture & Engineering Decisions',
                max_points: 10,
                tiers: {
                    'Excellent': 'Architecture accurately represents ≥90% of components/data flows and includes ≥3 well-justified engineering decisions',
                    'Good': 'Represents 70–89% of components/data flows with 2 justified decisions',
                    'Fair': 'Represents 40–69% with limited justification',
                    'Needs Improvement': 'Represents <40% or lacks meaningful technical justification'
                }
            }
        ]
    },
    4: {
        title: 'Round 4: Feature Development',
        criteria: [
            {
                id: 'crit_r4_1',
                title: 'Core Feature Implementation & Integration',
                max_points: 10,
                tiers: {
                    'Excellent': 'Successfully implements ≥90% of selected features with functional frontend/backend/API/database integration',
                    'Good': 'Implements 70–89% with minor functional issues',
                    'Fair': 'Implements 40–69% with noticeable issues',
                    'Needs Improvement': 'Implements <40% or major functionality is non-functional'
                }
            }
        ]
    },
    5: {
        title: 'Round 5: Testing, Refinement & Documentation',
        criteria: [
            {
                id: 'crit_r5_1',
                title: 'Test Coverage, Bug Resolution & Documentation',
                max_points: 10,
                tiers: {
                    'Excellent': 'Covers ≥90% of defined test cases, resolves major bugs and provides complete documentation',
                    'Good': 'Covers 70–89% of test cases with most major bugs resolved',
                    'Fair': 'Covers 40–69% with limited debugging/documentation',
                    'Needs Improvement': 'Covers <40% with major unresolved bugs or incomplete documentation'
                }
            }
        ]
    },
    6: {
        title: 'Round 6: Final Demonstration, Code Review & Technical Defense',
        criteria: [
            {
                id: 'crit_r6_1',
                title: 'Demonstration, Code Review & Technical Defense',
                max_points: 10,
                tiers: {
                    'Excellent': 'Demonstrates ≥90% of features successfully, code is well-structured, and answers ≥85% of technical questions with strong justification of architecture, technologies and trade-offs',
                    'Good': 'Demonstrates 70–89% of features, code has minor issues, and answers 65–84% of questions with reasonable justification',
                    'Fair': 'Demonstrates 40–69% of features, code has significant issues, and answers 40–64% of questions with limited understanding',
                    'Needs Improvement': 'Demonstrates <40% of features, code is incomplete/poorly structured, or answers <40% of technical questions'
                }
            }
        ]
    }
}

/**
 * Normalizes raw rubric from database/JSON into QuantitativeRubric structure.
 * Supports backward-compatibility with flat { "Criteria": 10 } format.
 */
export function normalizeRubric(
    rawRubric: any,
    roundNumber?: number,
    roundName?: string
): QuantitativeRubric {
    // 1. If already in structured QuantitativeRubric format
    if (rawRubric && Array.isArray(rawRubric.criteria) && rawRubric.criteria.length > 0) {
        return {
            scale: rawRubric.scale && Array.isArray(rawRubric.scale) && rawRubric.scale.length > 0
                ? rawRubric.scale
                : DEFAULT_RUBRIC_SCALE,
            criteria: rawRubric.criteria.map((crit: any, idx: number) => ({
                id: crit.id || `crit_${idx + 1}`,
                title: crit.title || `Criterion ${idx + 1}`,
                max_points: Number(crit.max_points) || 10,
                tiers: crit.tiers || {
                    'Excellent': 'Meets or exceeds benchmark requirements with exceptional quality (≥90%)',
                    'Good': 'Meets majority of requirements with minor issues (70–89%)',
                    'Fair': 'Partially meets requirements with noticeable gaps (40–69%)',
                    'Needs Improvement': 'Fails to meet minimum requirements or insufficient progress (<40%)'
                }
            }))
        }
    }

    // 2. Check if a standard preset matches roundNumber or roundName
    const num = roundNumber || (roundName?.match(/round\s*(\d+)/i) ? parseInt(roundName.match(/round\s*(\d+)/i)![1]) : undefined)
    if (num && STANDARD_ROUND_RUBRICS[num]) {
        return {
            scale: DEFAULT_RUBRIC_SCALE,
            criteria: STANDARD_ROUND_RUBRICS[num].criteria
        }
    }

    // 3. Backward compatibility: flat object { "Problem Definition": 10, "Architecture": 15 }
    if (rawRubric && typeof rawRubric === 'object' && !Array.isArray(rawRubric) && Object.keys(rawRubric).length > 0) {
        const criteria: RubricCriterion[] = Object.entries(rawRubric).map(([title, pts], idx) => {
            const max = Number(pts) || 10
            return {
                id: `crit_legacy_${idx + 1}`,
                title,
                max_points: max,
                tiers: {
                    'Excellent': `Demonstrates thorough mastery and complete implementation of ${title} (≥90%)`,
                    'Good': `Good execution of ${title} with minor areas for improvement (70–89%)`,
                    'Fair': `Partial implementation of ${title} with moderate issues (40–69%)`,
                    'Needs Improvement': `Insufficient implementation or major flaws in ${title} (<40%)`
                }
            }
        })

        return {
            scale: DEFAULT_RUBRIC_SCALE,
            criteria
        }
    }

    // 4. Default fallback
    return {
        scale: DEFAULT_RUBRIC_SCALE,
        criteria: [
            {
                id: 'crit_default_1',
                title: roundName ? `${roundName} Evaluation` : 'Deliverable & Solution Quality',
                max_points: 10,
                tiers: {
                    'Excellent': 'Completes ≥90% of requirements with exceptional technical depth and high quality',
                    'Good': 'Completes 70–89% of requirements with solid implementation and minor issues',
                    'Fair': 'Completes 40–69% of requirements with partial deliverables',
                    'Needs Improvement': 'Completes <40% of requirements or fails to meet standard expectations'
                }
            }
        ]
    }
}

/**
 * Calculates total maximum possible score for a rubric.
 */
export function calculateMaxScore(rubric: QuantitativeRubric): number {
    if (!rubric || !rubric.criteria || rubric.criteria.length === 0) return 10
    return rubric.criteria.reduce((sum, crit) => sum + (crit.max_points || 10), 0)
}
