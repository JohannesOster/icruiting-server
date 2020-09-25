import express from 'express';
import {getMembers, createMember, updateMember} from './controller';
import {validateCreateMember, validateUpdateMember} from './validation';
import {validate} from 'middlewares/common';
import {requireAdmin, requireAuth} from 'middlewares';

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);
router.get('/', getMembers);
router.post('/', validateCreateMember, validate, createMember);
router.put('/:username', validateUpdateMember, validate, updateMember);

export {router as routes};
