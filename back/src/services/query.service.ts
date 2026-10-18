const STOP_WORDS = new Set([
    'a', 'al', 'con', 'cual', 'cuales', 'como', 'cuando', 'cuál', 'cuáles',
    'dame', 'de', 'del', 'el', 'en', 'es', 'eso', 'esta', 'este', 'explica',
    'haz', 'la', 'las', 'lo', 'los', 'me', 'mi', 'para', 'por', 'que', 'qué',
    'resume', 'se', 'sobre', 'sus', 'un', 'una', 'y'
])

function clean(text: string): string {
    return text.replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim()
}

function usefulTerms(text: string): string[] {
    return clean(text)
        .toLocaleLowerCase('es-AR')
        .split(' ')
        .filter(term => term.length > 2 && !STOP_WORDS.has(term))
}

export function buildContextualQuery(
    content: string,
    history: Array<{ role: string; content: string }>
): string {
    const currentTerms = usefulTerms(content)
    const historyTerms = history
        .slice(-4)
        .flatMap(message => usefulTerms(message.content))

    const terms = [...new Set([...currentTerms, ...historyTerms])]
    if (historyTerms.length === 0) return terms.join(' ') || clean(content)

    return `${content}. Contexto relacionado: ${terms.join(' ')}`
}

export function buildLexicalQuery(content: string): string[] {
    const normalized = usefulTerms(content)
    const phrase = normalized.join(' ')
    return [...new Set([phrase, ...normalized])].filter(Boolean)
}

export function formatContextWithSources(
    chunks: Array<{ document_name?: string; content: string }>
): string {
    return chunks
        .map(chunk => `[Fuente: ${chunk.document_name || 'Documento sin nombre'}]\n${chunk.content}`)
        .join('\n\n---\n\n')
}
