import assert from 'node:assert/strict'
import test from 'node:test'
import { buildContextualQuery, buildLexicalQuery, formatContextWithSources } from '../src/services/query.service.js'

test('convierte orden breve en consulta con términos útiles', () => {
    const query = buildContextualQuery('Dame el resumen ejecutivo', [])

    assert.equal(query, 'resumen ejecutivo')
})

test('usa historial para resolver referencias como "eso"', () => {
    const query = buildContextualQuery('Resume eso', [
        { role: 'user', content: '¿Cuál es el plan de implementación?' },
        { role: 'assistant', content: 'El documento propone tres etapas.' }
    ])

    assert.match(query, /plan implementación/)
    assert.match(query, /Resume eso/)
})

test('crea términos léxicos sin palabras vacías', () => {
    assert.deepEqual(buildLexicalQuery('Dame el resumen ejecutivo'), ['resumen ejecutivo', 'resumen', 'ejecutivo'])
})

test('etiqueta cada fragmento con su documento', () => {
    assert.equal(
        formatContextWithSources([
            { document_name: 'stockpoint.md', content: 'Arquitectura Flutter.' },
            { document_name: 'api_documentacion.md', content: 'Endpoint de chats.' }
        ]),
        '[Fuente: stockpoint.md]\nArquitectura Flutter.\n\n---\n\n[Fuente: api_documentacion.md]\nEndpoint de chats.'
    )
})
