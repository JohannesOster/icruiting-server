import express from 'express';
import {ThemesAdapter} from 'application/tenants/themes';

const adapter = ThemesAdapter();
const router = express.Router();

router.post('/', adapter.upload);
router.delete('/', adapter.del);

export {router as routes};
