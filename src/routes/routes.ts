import express from 'express';
import {organizationsController} from '../controllers';

const router = express.Router();

router.get('/', organizationsController.createOrganization);

export {router as routes};
