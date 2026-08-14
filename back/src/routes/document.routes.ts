import { Router } from 'express'
import {
    uploadDocument,
    listDocuments,
    getDocument,
    deleteDocument,
    reprocessDocument,
} from '../controller/documentController.js'
import { authenticate } from '../middleware/autheticate.js'
import { upload, hadleUploadError } from '../middleware/uploadMiddleware.js'

const router = Router()

// Todos los endpoints requieren autenticación
router.use(authenticate)

// Upload: primero multer procesa el archivo, luego el controller
router.post('/', upload.single('file'), hadleUploadError, uploadDocument)

// CRUD básico
router.get('/', listDocuments)
router.get('/:id', getDocument)
router.delete('/:id', deleteDocument)
router.post('/:id/reprocess', reprocessDocument)

export default router