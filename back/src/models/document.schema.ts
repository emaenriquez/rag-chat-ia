import { z } from "zod"

export const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
]

export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md']

export type DocumentStatus = 'uploaded' | 'processing' | 'processed' | 'failed'


export interface DocumentResponse {
    id: string,
    filename: string,
    originalName: string,
    mimeType: string | null,
    fileSize: string | null,
    status: string,
    createdAt: Date,
    updatedAt: Date
}