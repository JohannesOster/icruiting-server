import app from 'infrastructure/http';
import config from 'config';

const port = config.get('port');
app.listen(port, () => {
  if (process.env.NODE_ENV === 'development') {
    /* tslint:disable no-console */
    console.log(`Listening: http://localhost:${port}`);
  }
});
