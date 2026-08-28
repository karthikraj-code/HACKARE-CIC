export interface SubmissionFieldConfig {
    enabled: boolean
    required: boolean
    label: string
    placeholder: string
    helpText?: string
}

export interface SubmissionConfig {
    types?: string[]
    fields: {
        text: SubmissionFieldConfig
        live_demo: SubmissionFieldConfig
        github: SubmissionFieldConfig
        ppt: SubmissionFieldConfig
    }
}

export const DEFAULT_SUBMISSION_FIELDS: Record<'text' | 'live_demo' | 'github' | 'ppt', SubmissionFieldConfig> = {
    text: {
        enabled: true,
        required: true,
        label: 'Written Solution & Technical Summary',
        placeholder: 'Detail your problem analysis, proposed methodology, technical architecture, and implementation highlights...',
        helpText: 'Provide a structured summary or response for the problem statement.'
    },
    live_demo: {
        enabled: true,
        required: false,
        label: 'Live Deployed App / Demo Video URL',
        placeholder: 'https://your-app.vercel.app or https://www.loom.com/share/...',
        helpText: 'Live hosted application or demo video walkthrough link.'
    },
    github: {
        enabled: true,
        required: true,
        label: 'GitHub Repository URL',
        placeholder: 'https://github.com/your-team/repo-name',
        helpText: 'Ensure the repository is public or access is provided to judges.'
    },
    ppt: {
        enabled: true,
        required: false,
        label: 'Presentation / Google Slides Link',
        placeholder: 'https://docs.google.com/presentation/d/...',
        helpText: 'Make sure access permissions are set to "Anyone with link can view".'
    }
}

export function normalizeSubmissionConfig(raw: any, roundNumber?: number, roundName?: string): SubmissionConfig {
    // If raw is already structured as an object with fields
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && raw.fields) {
        return {
            types: Array.isArray(raw.types) ? raw.types : Object.keys(raw.fields).filter(k => raw.fields[k]?.enabled),
            fields: {
                text: { ...DEFAULT_SUBMISSION_FIELDS.text, ...(raw.fields.text || {}) },
                live_demo: { ...DEFAULT_SUBMISSION_FIELDS.live_demo, ...(raw.fields.live_demo || {}) },
                github: { ...DEFAULT_SUBMISSION_FIELDS.github, ...(raw.fields.github || {}) },
                ppt: { ...DEFAULT_SUBMISSION_FIELDS.ppt, ...(raw.fields.ppt || {}) },
            }
        }
    }

    // If raw is an array of legacy strings e.g. ['problem_architecture_ppt']
    const arrayValues: string[] = Array.isArray(raw) ? raw : (typeof raw === 'string' ? [raw] : [])
    const nameLower = (roundName || '').toLowerCase()

    if (arrayValues.includes('problem_architecture_ppt') || roundNumber === 1 || nameLower.includes('round 1')) {
        return {
            types: ['ppt', 'live_demo', 'text'],
            fields: {
                text: {
                    enabled: true,
                    required: true,
                    label: 'Executive Problem & Proposed Solution Summary',
                    placeholder: 'Summarize the core problem statement, your proposed AI methodology, data pipeline, and why your solution stands out...',
                    helpText: 'Summary of problem definition and planned architecture.'
                },
                live_demo: {
                    enabled: true,
                    required: true,
                    label: 'System Architecture Diagram Link / Image URL',
                    placeholder: 'https://drive.google.com/... or Figma / Eraser.io / Imgur direct image link',
                    helpText: 'Link to your architecture diagram or visual schema blueprint.'
                },
                github: {
                    enabled: false,
                    required: false,
                    label: DEFAULT_SUBMISSION_FIELDS.github.label,
                    placeholder: DEFAULT_SUBMISSION_FIELDS.github.placeholder
                },
                ppt: {
                    enabled: true,
                    required: true,
                    label: 'Google Slides / Presentation Link',
                    placeholder: 'https://docs.google.com/presentation/d/... or Canva / OneDrive',
                    helpText: 'Ensure link access is set to Anyone with the link can view.'
                }
            }
        }
    }

    if (arrayValues.includes('product_code_demo') || roundNumber === 2 || roundNumber === 3 || nameLower.includes('round 2') || nameLower.includes('round 3')) {
        return {
            types: ['github', 'live_demo', 'text'],
            fields: {
                text: {
                    enabled: true,
                    required: true,
                    label: 'Implemented Features & Technical Highlights',
                    placeholder: 'Describe what features you implemented, model accuracy/benchmarks achieved, UI features, challenges resolved, and future scope...',
                    helpText: 'Technical overview and implementation details.'
                },
                live_demo: {
                    enabled: true,
                    required: true,
                    label: 'Live Deployed App / Demo Video Link',
                    placeholder: 'https://your-app.vercel.app or https://loom.com/share/...',
                    helpText: 'Live hosted application or demo video walkthrough.'
                },
                github: {
                    enabled: true,
                    required: true,
                    label: 'GitHub Repository Link',
                    placeholder: 'https://github.com/your-team/repo-name',
                    helpText: 'Ensure the repository is public or accessible to judges.'
                },
                ppt: {
                    enabled: false,
                    required: false,
                    label: DEFAULT_SUBMISSION_FIELDS.ppt.label,
                    placeholder: DEFAULT_SUBMISSION_FIELDS.ppt.placeholder
                }
            }
        }
    }

    // Generic fallback based on legacy types
    const hasText = arrayValues.includes('text')
    const hasLink = arrayValues.includes('link') || arrayValues.includes('file_upload')
    const hasGithub = arrayValues.includes('github') || arrayValues.includes('github_url')
    const hasPpt = arrayValues.includes('ppt') || arrayValues.includes('ppt_link')
    const hasDemo = arrayValues.includes('live_demo') || arrayValues.includes('live_link')

    const hasAnyExplicit = hasText || hasLink || hasGithub || hasPpt || hasDemo

    return {
        types: hasAnyExplicit ? arrayValues : ['text', 'live_demo', 'github', 'ppt'],
        fields: {
            text: {
                ...DEFAULT_SUBMISSION_FIELDS.text,
                enabled: hasAnyExplicit ? hasText : true
            },
            live_demo: {
                ...DEFAULT_SUBMISSION_FIELDS.live_demo,
                enabled: hasAnyExplicit ? (hasDemo || hasLink) : true
            },
            github: {
                ...DEFAULT_SUBMISSION_FIELDS.github,
                enabled: hasAnyExplicit ? hasGithub : true
            },
            ppt: {
                ...DEFAULT_SUBMISSION_FIELDS.ppt,
                enabled: hasAnyExplicit ? hasPpt : true
            }
        }
    }
}
