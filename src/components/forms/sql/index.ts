import {QueryFile} from 'pg-promise';
import {join} from 'path';

const options = {minify: true};

const selectForms = new QueryFile(join(__dirname, 'selectForms.sql'), options);
const selectForm = new QueryFile(join(__dirname, 'selectForm.sql'), options);

export {selectForms, selectForm};
