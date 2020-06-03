import {RequestHandler} from 'express';

export const createOrganization: RequestHandler = (req, res) => {
  res.status(200).json({message: 'Hello from the icruiting - API 🦄🌎👋'});
};
