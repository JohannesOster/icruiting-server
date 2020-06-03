import express from 'express';
import {organizationsController} from '../controllers';

const router = express.Router();

router.post('/organizations', organizationsController.createOrganization);

export {router as routes};
