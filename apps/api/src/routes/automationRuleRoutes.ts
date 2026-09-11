import { Router } from 'express';
import {
  listAutomationRules,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
} from '../controllers/automationRuleController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, listAutomationRules);
router.post('/', requireAuth, createAutomationRule);
router.put('/:id', requireAuth, updateAutomationRule);
router.delete('/:id', requireAuth, deleteAutomationRule);

export default router;
