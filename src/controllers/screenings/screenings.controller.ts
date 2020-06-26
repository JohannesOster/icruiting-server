import {RequestHandler} from 'express';
import {validationResult} from 'express-validator';
import {selectForm} from '../../db/forms.db';
import {insertScreening} from '../../db/screenings.db';

export const submitForm: RequestHandler = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({errors: errors.array()});

  const submitterId = res.locals.user['sub'];

  insertScreening({submitter_id: submitterId, ...req.body})
    .then((data) => res.status(201).json(data))
    .catch(next);
};
